from django.contrib import admin

from .models import (
    Product,
    InventoryTransaction,
    StockMovement,
    UserProfile,
    InventorySession,
    InventoryCount,
)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "sku", "quantity", "min_stock", "unit", "updated_at")
    search_fields = ("name", "sku", "description")
    list_filter = ("unit",)


@admin.register(InventoryTransaction)
class InventoryTransactionAdmin(admin.ModelAdmin):
    list_display = ("product", "transaction_type", "quantity", "created_by", "created_at")
    search_fields = ("product__name", "product__sku", "created_by__username", "note")
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
        "note",
        "created_by__username",
    )
    list_filter = ("movement_type", "created_at")
    readonly_fields = ("created_at",)


@admin.register(InventorySession)
class InventorySessionAdmin(admin.ModelAdmin):
    list_display = ("title", "status", "created_by", "created_at", "completed_at")
    search_fields = ("title", "note", "created_by__username")
    list_filter = ("status", "created_at")
    readonly_fields = ("created_at", "completed_at")


@admin.register(InventoryCount)
class InventoryCountAdmin(admin.ModelAdmin):
    list_display = (
        "session",
        "product",
        "expected_quantity",
        "counted_quantity",
        "difference_display",
        "corrected",
        "created_by",
        "created_at",
    )
    search_fields = (
        "session__title",
        "product__name",
        "product__sku",
        "note",
        "created_by__username",
    )
    list_filter = ("corrected", "created_at")
    readonly_fields = (
        "expected_quantity",
        "correction_movement",
        "created_at",
        "updated_at",
    )

    def difference_display(self, obj):
        return obj.difference

    difference_display.short_description = "Differenz"


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role")
    search_fields = ("user__username", "user__email")
    list_filter = ("role",)