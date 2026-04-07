from django.contrib import admin
from .models import Product, InventoryTransaction, StockMovement, UserProfile


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "sku", "quantity", "min_stock", "unit", "updated_at")
    search_fields = ("name", "sku")
    list_filter = ("unit",)


@admin.register(InventoryTransaction)
class InventoryTransactionAdmin(admin.ModelAdmin):
    list_display = ("product", "transaction_type", "quantity", "created_by", "created_at")
    search_fields = ("product__name", "product__sku", "created_by__username")
    list_filter = ("transaction_type", "created_at")


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = (
        "product",
        "movement_type",
        "quantity",
        "reference_number",
        "created_by",
        "created_at",
    )
    search_fields = (
        "product__name",
        "product__sku",
        "reference_number",
        "created_by__username",
    )
    list_filter = ("movement_type", "created_at")


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role")
    search_fields = ("user__username", "user__email")
    list_filter = ("role",)