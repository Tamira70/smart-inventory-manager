from rest_framework import serializers
from django.db import transaction
from .models import Product, InventoryTransaction, StockMovement

from rest_framework import serializers
from django.db import transaction
from .models import Product, InventoryTransaction, StockMovement, UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = UserProfile
        fields = ["username", "role"]

class ProductSerializer(serializers.ModelSerializer):
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