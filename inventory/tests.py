from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from inventory.models import (
    Customer,
    OutboundOrder,
    OutboundOrderItem,
    Product,
    StockMovement,
    StorageLocation,
    StorageLocationStock,
    TransportOrder,
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

class OutboundOrderWorkflowApiTests(TestCase):
    def make_user_with_role(self, role):
        user = User.objects.create_user(
            username=f"outbound-{role}-user",
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

        self.customer = Customer.objects.create(
            customer_number="KD-TEST-0001",
            name="Testkunde Versand",
            email="versand@example.test",
            city="Crimmitschau",
        )

        self.product = Product.objects.create(
            name="Filament PAL Blau Outbound Test",
            sku="PAL-BLAU-OUTBOUND-TEST",
            quantity=10,
            min_stock=0,
            unit="Stück",
        )

        self.storage_location = StorageLocation.objects.create(
            code="A-OUT-TEST-01",
            name="Outbound Quellplatz Test",
            location_type=StorageLocation.LocationType.STORAGE,
            is_active=True,
            is_empty=False,
        )

        self.shipping_location = StorageLocation.objects.create(
            code="WA-OUT-TEST-01",
            name="Outbound WA-Fläche Test",
            location_type=StorageLocation.LocationType.SHIPPING,
            is_active=True,
            is_empty=True,
        )

        self.source_stock = StorageLocationStock.objects.create(
            product=self.product,
            storage_location=self.storage_location,
            quantity=5,
        )

    def create_order(self):
        return OutboundOrder.objects.create(
            customer=self.customer,
            reference_number="KUNDENAUFTRAG-TEST-0001",
            created_by=self.lager_user,
        )

    def create_item(self, order, quantity="2.00"):
        return OutboundOrderItem.objects.create(
            outbound_order=order,
            product=self.product,
            quantity=quantity,
        )

    def test_lager_user_can_create_outbound_order_and_item(self):
        order_response = self.client.post(
            reverse("outbound-order-list"),
            {
                "customer": self.customer.id,
                "reference_number": "KUNDENAUFTRAG-API-0001",
                "note": "Testauftrag über API",
            },
            format="json",
        )

        self.assertEqual(order_response.status_code, status.HTTP_201_CREATED, order_response.data)
        self.assertTrue(order_response.data["order_number"].startswith("VA-"))

        order = OutboundOrder.objects.get(pk=order_response.data["id"])
        self.assertEqual(order.created_by, self.lager_user)

        item_response = self.client.post(
            reverse("outbound-order-item-list"),
            {
                "outbound_order": order.id,
                "product": self.product.id,
                "quantity": "2.00",
                "note": "Testposition",
            },
            format="json",
        )

        self.assertEqual(item_response.status_code, status.HTTP_201_CREATED, item_response.data)
        self.assertEqual(item_response.data["product_name"], self.product.name)
        self.assertEqual(OutboundOrderItem.objects.filter(outbound_order=order).count(), 1)

    def test_create_transport_order_from_outbound_item(self):
        order = self.create_order()
        item = self.create_item(order, quantity="2.00")

        response = self.client.post(
            reverse("outbound-order-item-create-transport-order", args=[item.id]),
            {
                "target_location": self.shipping_location.id,
                "priority": 80,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertIn("Transportauftrag", response.data["detail"])

        item.refresh_from_db()
        order.refresh_from_db()

        self.assertIsNotNone(item.transport_order)
        self.assertEqual(order.status, OutboundOrder.Status.IN_PICKING)

        transport_order = item.transport_order
        self.assertEqual(transport_order.product, self.product)
        self.assertEqual(transport_order.quantity, item.quantity)
        self.assertEqual(transport_order.source_location, self.storage_location)
        self.assertEqual(transport_order.target_location, self.shipping_location)
        self.assertEqual(transport_order.status, TransportOrder.Status.CREATED)
        self.assertEqual(transport_order.reference_number, order.order_number)
        self.assertEqual(transport_order.priority, 80)

    def test_duplicate_transport_order_for_same_item_is_blocked(self):
        order = self.create_order()
        item = self.create_item(order, quantity="2.00")

        first_response = self.client.post(
            reverse("outbound-order-item-create-transport-order", args=[item.id]),
            {"target_location": self.shipping_location.id},
            format="json",
        )
        self.assertEqual(first_response.status_code, status.HTTP_201_CREATED, first_response.data)

        second_response = self.client.post(
            reverse("outbound-order-item-create-transport-order", args=[item.id]),
            {"target_location": self.shipping_location.id},
            format="json",
        )

        self.assertEqual(second_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("bereits", str(second_response.data))
        self.assertEqual(TransportOrder.objects.count(), 1)

    def test_transport_order_creation_rejects_missing_stock(self):
        order = self.create_order()
        item = self.create_item(order, quantity="99.00")

        response = self.client.post(
            reverse("outbound-order-item-create-transport-order", args=[item.id]),
            {"target_location": self.shipping_location.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Kein geeigneter Entnahmeplatz", str(response.data))
        self.assertFalse(TransportOrder.objects.exists())

    def test_viewer_cannot_create_outbound_order(self):
        viewer_client = APIClient()
        viewer_user = self.make_user_with_role("viewer")
        viewer_client.force_authenticate(user=viewer_user)

        response = viewer_client.post(
            reverse("outbound-order-list"),
            {
                "customer": self.customer.id,
                "reference_number": "VIEWER-DARF-NICHT",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(
            OutboundOrder.objects.filter(reference_number="VIEWER-DARF-NICHT").exists()
        )

class OutboundOrderStatusWorkflowTests(TestCase):
    def make_user_with_role(self, role):
        user = User.objects.create_user(
            username=f"outbound-status-{role}-user",
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

        self.customer = Customer.objects.create(
            customer_number="KD-STATUS-0001",
            name="Statuskunde Versand",
            email="status@example.test",
            city="Crimmitschau",
        )

        self.product = Product.objects.create(
            name="Filament PAL Status Test",
            sku="PAL-STATUS-TEST",
            quantity=10,
            min_stock=0,
            unit="Stück",
        )

        self.storage_location = StorageLocation.objects.create(
            code="A-STATUS-TEST-01",
            name="Status Quellplatz Test",
            location_type=StorageLocation.LocationType.STORAGE,
            is_active=True,
            is_empty=False,
        )

        self.shipping_location = StorageLocation.objects.create(
            code="WA-STATUS-TEST-01",
            name="Status WA-Fläche Test",
            location_type=StorageLocation.LocationType.SHIPPING,
            is_active=True,
            is_empty=True,
        )

        StorageLocationStock.objects.create(
            product=self.product,
            storage_location=self.storage_location,
            quantity=5,
        )

    def create_order(self):
        return OutboundOrder.objects.create(
            customer=self.customer,
            reference_number="STATUS-AUFTRAG-0001",
            created_by=self.lager_user,
        )

    def create_item(self, order, quantity="2.00"):
        return OutboundOrderItem.objects.create(
            outbound_order=order,
            product=self.product,
            quantity=quantity,
        )

    def create_transport_order_for_item(self, item):
        response = self.client.post(
            reverse("outbound-order-item-create-transport-order", args=[item.id]),
            {
                "target_location": self.shipping_location.id,
                "priority": 90,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

        item.refresh_from_db()
        self.assertIsNotNone(item.transport_order)

        return item.transport_order

    def test_refresh_status_marks_order_ready_for_shipping_when_transport_completed(self):
        order = self.create_order()
        item = self.create_item(order)

        transport_order = self.create_transport_order_for_item(item)
        transport_order.status = TransportOrder.Status.COMPLETED
        transport_order.save(update_fields=["status"])

        response = self.client.post(
            reverse("outbound-order-refresh-status", args=[order.id]),
            {},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

        order.refresh_from_db()
        self.assertEqual(order.status, OutboundOrder.Status.READY_FOR_SHIPPING)

    def test_mark_shipped_sets_ready_order_to_shipped(self):
        order = self.create_order()
        order.status = OutboundOrder.Status.READY_FOR_SHIPPING
        order.save(update_fields=["status"])

        response = self.client.post(
            reverse("outbound-order-mark-shipped", args=[order.id]),
            {},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

        order.refresh_from_db()
        self.assertEqual(order.status, OutboundOrder.Status.SHIPPED)

    def test_mark_shipped_is_blocked_before_order_is_ready(self):
        order = self.create_order()

        response = self.client.post(
            reverse("outbound-order-mark-shipped", args=[order.id]),
            {},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        order.refresh_from_db()
        self.assertEqual(order.status, OutboundOrder.Status.DRAFT)
