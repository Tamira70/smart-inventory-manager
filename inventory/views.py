from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Product, InventoryTransaction, StockMovement
from .serializers import (
    ProductSerializer,
    InventoryTransactionSerializer,
    StockMovementSerializer,
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