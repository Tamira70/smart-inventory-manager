from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, InventoryTransactionViewSet, StockMovementViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.views import TokenRefreshView
from inventory.views import CustomTokenObtainPairView


path("api/login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),

{
  "refresh": "...",
  "access": "...",
  "user": {
    "username": "tamira",
    "role": "admin"
  }
}

router = DefaultRouter()
router.register(r"products", ProductViewSet, basename="product")
router.register(r"transactions", InventoryTransactionViewSet, basename="transaction")
router.register(r"stock-movements", StockMovementViewSet, basename="stock-movement")

urlpatterns = [
    path("", include(router.urls)),
]