from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from inventory.models import (
    Product,
    StockMovement,
    StorageLocation,
    StorageLocationStock,
    UserProfile,
)


class WaShippingCompletionEndpointTests(TestCase):
    def make_user_with_role(self, role):
        user = User.objects.create_user(
            username=f"{role}-user",
            password="testpass123",
        )
        profile, _created = UserProfile.objects.get_or_create(user=user)
        profile.role = role
        profile.save(update_fields=["role"])

        return User.objects.select_related("userprofile").get(pk=user.pk)

    def setUp(self):
        self.client = APIClient()

        self.lager_user = self.make_user_with_role("lager")
        self.client.force_authenticate(user=self.lager_user)

        self.product = Product.objects.create(
            name="Filament PAL Blau Test",
            sku="PAL-BLAU-TEST",
            quantity=10,
            min_stock=0,
            unit="Stück",
        )

        self.storage_location = StorageLocation.objects.create(
            code="A-R2-F4-TEST",
            name="Regalplatz Test",
            location_type=StorageLocation.LocationType.STORAGE,
            is_active=True,
            is_empty=False,
        )

        self.shipping_location = StorageLocation.objects.create(
            code="WA-TEST-0001",
            name="WA-Fläche Test",
            location_type=StorageLocation.LocationType.SHIPPING,
            is_active=True,
            is_empty=False,
        )

        self.wa_stock = StorageLocationStock.objects.create(
            product=self.product,
            storage_location=self.shipping_location,
            quantity=3,
        )

    def complete_shipping_url(self, stock):
        return reverse("location-stock-complete-shipping", args=[stock.id])

    def test_lager_user_can_complete_shipping_from_wa_stock(self):
        response = self.client.post(
            self.complete_shipping_url(self.wa_stock),
            {
                "quantity": 3,
                "reference_number": "VERSAND-TEST-0001",
                "note": "Automatischer Test Versandabschluss",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertIn("Versand abgeschlossen", response.data["detail"])

        self.assertFalse(
            StorageLocationStock.objects.filter(
                pk=self.wa_stock.pk,
                quantity__gt=0,
            ).exists()
        )

        movement = StockMovement.objects.get(reference_number="VERSAND-TEST-0001")
        self.assertEqual(movement.movement_type, "OUT")
        self.assertEqual(movement.product, self.product)
        self.assertEqual(movement.storage_location, self.shipping_location)
        self.assertEqual(movement.quantity, 3)

    def test_shipping_completion_is_blocked_from_normal_storage_location(self):
        normal_stock = StorageLocationStock.objects.create(
            product=self.product,
            storage_location=self.storage_location,
            quantity=2,
        )

        response = self.client.post(
            self.complete_shipping_url(normal_stock),
            {
                "quantity": 1,
                "reference_number": "VERSAND-TEST-STORAGE",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("WA-Flächen", str(response.data))

        normal_stock.refresh_from_db()
        self.assertEqual(normal_stock.quantity, 2)
        self.assertFalse(
            StockMovement.objects.filter(
                reference_number="VERSAND-TEST-STORAGE",
            ).exists()
        )

    def test_shipping_completion_rejects_quantity_above_wa_stock(self):
        response = self.client.post(
            self.complete_shipping_url(self.wa_stock),
            {
                "quantity": 4,
                "reference_number": "VERSAND-TEST-TOO-MUCH",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("liegen nur", str(response.data))

        self.wa_stock.refresh_from_db()
        self.assertEqual(self.wa_stock.quantity, 3)
        self.assertFalse(
            StockMovement.objects.filter(
                reference_number="VERSAND-TEST-TOO-MUCH",
            ).exists()
        )

    def test_viewer_user_cannot_complete_shipping(self):
        viewer_client = APIClient()
        viewer_user = self.make_user_with_role("viewer")
        viewer_client.force_authenticate(user=viewer_user)

        response = viewer_client.post(
            self.complete_shipping_url(self.wa_stock),
            {
                "quantity": 1,
                "reference_number": "VERSAND-TEST-VIEWER",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(
            StockMovement.objects.filter(
                reference_number="VERSAND-TEST-VIEWER",
            ).exists()
        )
