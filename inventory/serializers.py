from django.contrib.auth.models import User
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
    Supplier,

    Customer,
    CustomerContact,
    DeliveryAddress,
    CustomerNote,
    AuditLog,
    UserProfile,
)


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = [
            "id",
            "name",
            "supplier_number",
            "contact_person",
            "email",
            "phone",
            "street",
            "postal_code",
            "city",
            "country",
            "note",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

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



class CustomerSerializer(serializers.ModelSerializer):
    contact_count = serializers.SerializerMethodField()
    delivery_address_count = serializers.SerializerMethodField()
    note_count = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = [
            "id",
            "customer_number",
            "name",
            "email",
            "phone",
            "street",
            "postal_code",
            "city",
            "country",
            "note",
            "is_active",
            "contact_count",
            "delivery_address_count",
            "note_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "contact_count",
            "delivery_address_count",
            "note_count",
            "created_at",
            "updated_at",
        ]

    def get_contact_count(self, obj):
        return obj.contacts.count()

    def get_delivery_address_count(self, obj):
        return obj.delivery_addresses.count()

    def get_note_count(self, obj):
        return obj.notes.count()


class CustomerContactSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name", read_only=True)

    class Meta:
        model = CustomerContact
        fields = [
            "id",
            "customer",
            "customer_name",
            "first_name",
            "last_name",
            "role",
            "email",
            "phone",
            "mobile",
            "is_primary",
            "is_active",
            "note",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["customer_name", "created_at", "updated_at"]


class DeliveryAddressSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name", read_only=True)

    class Meta:
        model = DeliveryAddress
        fields = [
            "id",
            "customer",
            "customer_name",
            "label",
            "recipient_name",
            "street",
            "postal_code",
            "city",
            "country",
            "is_default",
            "is_active",
            "note",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["customer_name", "created_at", "updated_at"]


class CustomerNoteSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True,
    )

    class Meta:
        model = CustomerNote
        fields = [
            "id",
            "customer",
            "customer_name",
            "title",
            "note",
            "created_by",
            "created_by_username",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "created_by",
            "created_by_username",
            "customer_name",
            "created_at",
            "updated_at",
        ]



class AdminUserSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(
        choices=UserProfile.ROLE_CHOICES,
        required=False,
        default="viewer",
    )
    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "is_staff",
            "date_joined",
            "role",
            "password",
        ]
        read_only_fields = ["id", "date_joined", "is_staff"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        profile = getattr(instance, "userprofile", None)
        data["role"] = profile.role if profile else "viewer"
        return data

    def create(self, validated_data):
        role = validated_data.pop("role", "viewer")
        password = validated_data.pop("password", "")

        user = User(**validated_data)
        user.is_staff = role == "admin"

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save()

        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.role = role
        profile.save()

        return user

    def update(self, instance, validated_data):
        role = validated_data.pop("role", None)
        password = validated_data.pop("password", None)

        for field, value in validated_data.items():
            setattr(instance, field, value)

        if role is not None:
            instance.is_staff = role == "admin"
            profile, _ = UserProfile.objects.get_or_create(user=instance)
            profile.role = role
            profile.save()

        if password:
            instance.set_password(password)

        instance.save()
        return instance


class AuditLogSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True,
    )

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "area",
            "action",
            "object_type",
            "object_id",
            "message",
            "metadata",
            "created_by",
            "created_by_username",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "created_by",
            "created_by_username",
            "created_at",
        ]


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