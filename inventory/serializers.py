from django.db import transaction
from rest_framework import serializers

from .models import (
    Product,
    InventoryTransaction,
    StockMovement,
    UserProfile,
    InventorySession,
    InventoryCount,
    StorageLocation,
)


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = UserProfile
        fields = ["username", "role"]


class StorageLocationSerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = StorageLocation
        fields = [
            "id",
            "code",
            "name",
            "zone",
            "aisle",
            "rack",
            "shelf",
            "description",
            "is_active",
            "product_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "product_count"]

    def get_product_count(self, obj):
        return obj.products.count()


class ProductSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = "__all__"


class InventoryTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryTransaction
        fields = "__all__"


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source="product.name")
    created_by_username = serializers.ReadOnlyField(source="created_by.username")

    class Meta:
        model = StockMovement
        fields = [
            "id",
            "product",
            "product_name",
            "movement_type",
            "quantity",
            "reference_number",
            "note",
            "created_by",
            "created_by_username",
            "created_at",
        ]
        read_only_fields = ["created_by", "created_at"]

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Menge muss größer als 0 sein.")
        return value

    def validate(self, attrs):
        product = attrs["product"]
        movement_type = attrs["movement_type"]
        quantity = attrs["quantity"]

        if movement_type == "OUT" and product.quantity < quantity:
            raise serializers.ValidationError(
                {"quantity": "Nicht genug Bestand für diesen Warenausgang."}
            )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        product = validated_data["product"]
        movement_type = validated_data["movement_type"]
        quantity = validated_data["quantity"]

        if movement_type == "IN":
            product.quantity += quantity
        elif movement_type == "OUT":
            product.quantity -= quantity

        product.save()
        return super().create(validated_data)


class InventorySessionSerializer(serializers.ModelSerializer):
    created_by_username = serializers.ReadOnlyField(source="created_by.username")
    counts_total = serializers.SerializerMethodField()
    counts_done = serializers.SerializerMethodField()

    class Meta:
        model = InventorySession
        fields = [
            "id",
            "title",
            "status",
            "note",
            "created_by",
            "created_by_username",
            "created_at",
            "completed_at",
            "counts_total",
            "counts_done",
        ]
        read_only_fields = ["created_by", "created_at", "completed_at"]

    def get_counts_total(self, obj):
        return obj.counts.count()

    def get_counts_done(self, obj):
        return obj.counts.exclude(counted_quantity__isnull=True).count()


class InventoryCountSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source="product.name")
    product_sku = serializers.ReadOnlyField(source="product.sku")
    product_unit = serializers.ReadOnlyField(source="product.unit")
    session_title = serializers.ReadOnlyField(source="session.title")
    created_by_username = serializers.ReadOnlyField(source="created_by.username")
    difference = serializers.SerializerMethodField()

    class Meta:
        model = InventoryCount
        fields = [
            "id",
            "session",
            "session_title",
            "product",
            "product_name",
            "product_sku",
            "product_unit",
            "expected_quantity",
            "counted_quantity",
            "difference",
            "note",
            "corrected",
            "correction_movement",
            "created_by",
            "created_by_username",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "expected_quantity",
            "difference",
            "corrected",
            "correction_movement",
            "created_by",
            "created_at",
            "updated_at",
        ]

    def get_difference(self, obj):
        return obj.difference

    def validate_counted_quantity(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Gezählte Menge darf nicht negativ sein.")
        return value

    def create(self, validated_data):
        product = validated_data["product"]
        validated_data["expected_quantity"] = product.quantity
        return super().create(validated_data)