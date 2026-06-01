from django.contrib import admin

from .models import (
    Product,
    InventoryTransaction,
    StockMovement,
    UserProfile,
    InventorySession,
    InventoryCount,
    StorageLocation,
    Supplier,
    Customer,
    CustomerContact,
    DeliveryAddress,
    CustomerNote,
)

@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "supplier_number",
        "contact_person",
        "email",
        "phone",
        "city",
        "is_active",
        "updated_at",
    )
    search_fields = (
        "name",
        "supplier_number",
        "contact_person",
        "email",
        "phone",
        "city",
    )
    list_filter = ("is_active", "country", "city")
    readonly_fields = ("created_at", "updated_at")

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


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "customer_number",
        "email",
        "phone",
        "city",
        "is_active",
        "updated_at",
    )
    search_fields = ("name", "customer_number", "email", "phone", "city")
    list_filter = ("is_active", "country", "city")
    readonly_fields = ("created_at", "updated_at")


@admin.register(CustomerContact)
class CustomerContactAdmin(admin.ModelAdmin):
    list_display = (
        "customer",
        "first_name",
        "last_name",
        "role",
        "email",
        "phone",
        "is_primary",
        "is_active",
    )
    search_fields = (
        "customer__name",
        "first_name",
        "last_name",
        "role",
        "email",
        "phone",
    )
    list_filter = ("is_primary", "is_active")
    readonly_fields = ("created_at", "updated_at")


@admin.register(DeliveryAddress)
class DeliveryAddressAdmin(admin.ModelAdmin):
    list_display = (
        "customer",
        "label",
        "recipient_name",
        "postal_code",
        "city",
        "is_default",
        "is_active",
    )
    search_fields = (
        "customer__name",
        "label",
        "recipient_name",
        "street",
        "postal_code",
        "city",
    )
    list_filter = ("is_default", "is_active", "country")
    readonly_fields = ("created_at", "updated_at")


@admin.register(CustomerNote)
class CustomerNoteAdmin(admin.ModelAdmin):
    list_display = (
        "customer",
        "title",
        "created_by",
        "created_at",
        "updated_at",
    )
    search_fields = ("customer__name", "title", "note", "created_by__username")
    list_filter = ("created_at",)
    readonly_fields = ("created_at", "updated_at")
