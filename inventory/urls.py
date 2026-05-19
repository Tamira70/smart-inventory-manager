from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CustomTokenObtainPairView,
    ProductViewSet,
    InventoryTransactionViewSet,
    StockMovementViewSet,
    InventorySessionViewSet,
    InventoryCountViewSet,
    StorageLocationViewSet,
    SupplierViewSet,
)

router = DefaultRouter()
router.register(r"products", ProductViewSet, basename="product")
router.register(r"transactions", InventoryTransactionViewSet, basename="transaction")
router.register(r"stock-movements", StockMovementViewSet, basename="stock-movement")
router.register(r"inventory-sessions", InventorySessionViewSet, basename="inventory-session")
router.register(r"inventory-counts", InventoryCountViewSet, basename="inventory-count")
router.register(r"storage-locations", StorageLocationViewSet, basename="storage-location")
router.register(r"suppliers", SupplierViewSet, basename="supplier")

urlpatterns = [
    path("login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("", include(router.urls)),
]
