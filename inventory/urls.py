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
    CustomerViewSet,
    CustomerContactViewSet,
    DeliveryAddressViewSet,
    CustomerNoteViewSet,
    AdminUserViewSet,
    AuditLogViewSet,
    PackagingTypeViewSet
)

router = DefaultRouter()
router.register(r"products", ProductViewSet, basename="product")
router.register(r"transactions", InventoryTransactionViewSet, basename="transaction")
router.register(r"stock-movements", StockMovementViewSet, basename="stock-movement")
router.register(r"inventory-sessions", InventorySessionViewSet, basename="inventory-session")
router.register(r"inventory-counts", InventoryCountViewSet, basename="inventory-count")
router.register(r"storage-locations", StorageLocationViewSet, basename="storage-location")
router.register(r"suppliers", SupplierViewSet, basename="supplier")
router.register(r"customers", CustomerViewSet, basename="customer")
router.register(r"customer-contacts", CustomerContactViewSet, basename="customer-contact")
router.register(r"delivery-addresses", DeliveryAddressViewSet, basename="delivery-address")
router.register(r"customer-notes", CustomerNoteViewSet, basename="customer-note")
router.register(r"admin-users", AdminUserViewSet, basename="admin-user")
router.register(r"audit-logs", AuditLogViewSet, basename="audit-log")
router.register(r"packaging-types",PackagingTypeViewSet,basename="packaging-type",)

urlpatterns = [
    path("login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("", include(router.urls)),
]