from django.db import transaction
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import (
    Product,
    InventoryTransaction,
    StockMovement,
    InventorySession,
    InventoryCount,
)
from .serializers import (
    ProductSerializer,
    InventoryTransactionSerializer,
    StockMovementSerializer,
    InventorySessionSerializer,
    InventoryCountSerializer,
)
from .permissions import IsAdmin, IsLagerOrAdmin


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        user = self.user
        profile = getattr(user, "userprofile", None)

        data["user"] = {
            "username": user.username,
            "role": profile.role if profile else "viewer",
        }

        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by("-id")
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.request.method in ["GET", "HEAD", "OPTIONS"]:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsLagerOrAdmin()]


class InventoryTransactionViewSet(viewsets.ModelViewSet):
    queryset = InventoryTransaction.objects.all().order_by("-id")
    serializer_class = InventoryTransactionSerializer

    def get_permissions(self):
        if self.request.method in ["GET", "HEAD", "OPTIONS"]:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsLagerOrAdmin()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.select_related("product", "created_by").order_by("-created_at")
    serializer_class = StockMovementSerializer

    def get_permissions(self):
        if self.request.method in ["GET", "HEAD", "OPTIONS"]:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsLagerOrAdmin()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class InventorySessionViewSet(viewsets.ModelViewSet):
    queryset = InventorySession.objects.select_related("created_by").prefetch_related("counts").order_by("-created_at")
    serializer_class = InventorySessionSerializer

    def get_permissions(self):
        if self.request.method in ["GET", "HEAD", "OPTIONS"]:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsLagerOrAdmin()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"], url_path="complete")
    def complete(self, request, pk=None):
        session = self.get_object()
        session.status = "COMPLETED"
        session.completed_at = timezone.now()
        session.save(update_fields=["status", "completed_at"])

        serializer = self.get_serializer(session)
        return Response(serializer.data)


class InventoryCountViewSet(viewsets.ModelViewSet):
    queryset = InventoryCount.objects.select_related(
        "session",
        "product",
        "created_by",
        "correction_movement",
    ).order_by("-created_at")
    serializer_class = InventoryCountSerializer

    def get_permissions(self):
        if self.request.method in ["GET", "HEAD", "OPTIONS"]:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsLagerOrAdmin()]

    def get_queryset(self):
        queryset = super().get_queryset()
        session_id = self.request.query_params.get("session")

        if session_id:
            queryset = queryset.filter(session_id=session_id)

        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"], url_path="apply-correction")
    @transaction.atomic
    def apply_correction(self, request, pk=None):
        inventory_count = self.get_object()

        if inventory_count.counted_quantity is None:
            return Response(
                {"detail": "Bitte zuerst eine gezählte Menge eintragen."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if inventory_count.corrected:
            return Response(
                {"detail": "Für diese Inventurposition wurde bereits eine Korrektur gebucht."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        product = inventory_count.product
        current_quantity = product.quantity
        counted_quantity = inventory_count.counted_quantity
        difference = counted_quantity - current_quantity

        if difference == 0:
            inventory_count.corrected = True
            inventory_count.save(update_fields=["corrected"])
            serializer = self.get_serializer(inventory_count)
            return Response(serializer.data)

        movement_type = "IN" if difference > 0 else "OUT"
        movement_quantity = abs(difference)

        product.quantity = counted_quantity
        product.save(update_fields=["quantity", "updated_at"])

        movement = StockMovement.objects.create(
            product=product,
            movement_type=movement_type,
            quantity=movement_quantity,
            reference_number=f"INV-{inventory_count.session_id}-{inventory_count.id}",
            note=(
                f"Inventur-Korrektur: Soll laut System {inventory_count.expected_quantity}, "
                f"Ist gezählt {counted_quantity}, vorheriger aktueller Bestand {current_quantity}."
            ),
            created_by=request.user,
        )

        inventory_count.corrected = True
        inventory_count.correction_movement = movement
        inventory_count.save(update_fields=["corrected", "correction_movement", "updated_at"])

        serializer = self.get_serializer(inventory_count)
        return Response(serializer.data)