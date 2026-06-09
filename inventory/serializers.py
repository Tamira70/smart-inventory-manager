from django.contrib.auth.models import User
from django.db import transaction
from rest_framework import serializers

from .models import (
    PackagingType,
    StorageStrategySettings,
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
    volume_cm3 = serializers.ReadOnlyField()
    occupied_volume_cm3 = serializers.SerializerMethodField()
    occupied_weight_kg = serializers.SerializerMethodField()
    available_volume_cm3 = serializers.SerializerMethodField()
    available_weight_kg = serializers.SerializerMethodField()

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
            "is_blocked",
            "is_empty",
            "allow_mixed_products",
            "length_cm",
            "width_cm",
            "height_cm",
            "max_weight_kg",
            "volume_cm3",
            "occupied_volume_cm3",
            "occupied_weight_kg",
            "available_volume_cm3",
            "available_weight_kg",
            "product_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "created_at",
            "updated_at",
            "product_count",
            "volume_cm3",
            "occupied_volume_cm3",
            "occupied_weight_kg",
            "available_volume_cm3",
            "available_weight_kg",
        ]

    def get_product_count(self, obj):
        return obj.products.count()

    def _format_number(self, value):
        if value is None:
            return None
        return round(float(value), 2)

    def _get_volume_cm3(self, item):
        if (
            item
            and item.length_cm
            and item.width_cm
            and item.height_cm
        ):
            return item.length_cm * item.width_cm * item.height_cm
        return None

    def _get_occupied_values(self, obj):
        occupied_volume = 0
        occupied_weight = 0

        for product in obj.products.select_related("packaging_type").all():
            if product.weight_kg is not None:
                occupied_weight += product.weight_kg * product.quantity

            packaging_volume = self._get_volume_cm3(product.packaging_type)
            if packaging_volume is not None:
                occupied_volume += packaging_volume * product.quantity

        return occupied_volume, occupied_weight

    def get_occupied_volume_cm3(self, obj):
        occupied_volume, _ = self._get_occupied_values(obj)
        return self._format_number(occupied_volume)

    def get_occupied_weight_kg(self, obj):
        _, occupied_weight = self._get_occupied_values(obj)
        return self._format_number(occupied_weight)

    def get_available_volume_cm3(self, obj):
        if obj.volume_cm3 is None:
            return None

        occupied_volume, _ = self._get_occupied_values(obj)
        return self._format_number(obj.volume_cm3 - occupied_volume)

    def get_available_weight_kg(self, obj):
        if obj.max_weight_kg is None:
            return None

        _, occupied_weight = self._get_occupied_values(obj)
        return self._format_number(obj.max_weight_kg - occupied_weight)


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
    storage_location_code = serializers.SerializerMethodField()
    storage_location_name = serializers.SerializerMethodField()
    storage_location_label = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "is_low_stock",
            "name",
            "sku",
            "description",
            "quantity",
            "min_stock",
            "unit",
            "weight_kg",
            "storage_location",
            "storage_location_code",
            "storage_location_name",
            "storage_location_label",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "is_low_stock",
            "storage_location_code",
            "storage_location_name",
            "storage_location_label",
            "created_at",
            "updated_at",
        ]

    def get_storage_location_code(self, obj):
        if not obj.storage_location:
            return ""
        return obj.storage_location.code

    def get_storage_location_name(self, obj):
        if not obj.storage_location:
            return ""
        return obj.storage_location.name

    def get_storage_location_label(self, obj):
        if not obj.storage_location:
            return "Kein Lagerort"
        return str(obj.storage_location)



class InventoryTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryTransaction
        fields = "__all__"


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source="product.name")
    storage_location_label = serializers.SerializerMethodField()
    packaging_type_name = serializers.ReadOnlyField(source="packaging_type.name")
    load_carrier_type_name = serializers.ReadOnlyField(source="load_carrier_type.name")
    created_by_username = serializers.ReadOnlyField(source="created_by.username")

    def get_storage_location_label(self, obj):
        if obj.storage_location:
            return str(obj.storage_location)
        return None

    class Meta:
        model = StockMovement
        fields = [
            "id",
            "product",
            "product_name",
            "movement_type",
            "quantity",
            "storage_location",
            "storage_location_label",
            "packaging_type",
            "packaging_type_name",
            "load_carrier_type",
            "load_carrier_type_name",
            "packaging_quantity",
            "packaging_cost_total",
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
        storage_location = attrs.get("storage_location")
        packaging_type = attrs.get("packaging_type")
        load_carrier_type = attrs.get("load_carrier_type")
        packaging_quantity = attrs.get("packaging_quantity")

        errors = {}

        if packaging_quantity is None:
            packaging_quantity_for_check = 1
        elif packaging_quantity <= 0:
            packaging_quantity_for_check = 1
            errors["packaging_quantity"] = "Packmenge muss größer als 0 sein."
        else:
            packaging_quantity_for_check = packaging_quantity

        if packaging_type and packaging_type.category != "PACKAGING":
            errors["packaging_type"] = (
                "Hier darf nur eine Verpackung ausgewählt werden."
            )

        if load_carrier_type and load_carrier_type.category != "LOAD_CARRIER":
            errors["load_carrier_type"] = (
                "Hier darf nur ein Ladungsträger ausgewählt werden."
            )

        reference_number = attrs.get("reference_number", "")

        if not str(reference_number).strip():
            errors["reference_number"] = "Bitte eine Referenznummer eintragen."

        if movement_type == "IN" and not storage_location:
            errors["storage_location"] = "Bitte einen Lagerplatz auswählen."

        if movement_type == "IN" and not packaging_type:
            errors["packaging_type"] = "Bitte eine Verpackung auswählen."

        if movement_type == "IN" and not load_carrier_type:
            errors["load_carrier_type"] = "Bitte einen Ladungsträger auswählen."

        if movement_type == "OUT" and product.quantity < quantity:
            errors["quantity"] = "Nicht genug Bestand für diesen Warenausgang."

        if movement_type == "IN" and storage_location:
            storage_location_errors = []

            if not storage_location.is_active:
                storage_location_errors.append(
                    "Dieser Lagerplatz ist nicht aktiv."
                )

            if storage_location.is_blocked:
                storage_location_errors.append(
                    "Dieser Lagerplatz ist gesperrt."
                )

            is_same_product_location = (
                getattr(product, "storage_location_id", None) == storage_location.id
            )

            if (
                not storage_location.is_empty
                and not storage_location.allow_mixed_products
                and not is_same_product_location
            ):
                storage_location_errors.append(
                    "Dieser Lagerplatz ist belegt und erlaubt keine Mischlagerung."
                )

            def get_volume_cm3(item):
                if (
                    item
                    and item.length_cm
                    and item.width_cm
                    and item.height_cm
                ):
                    return item.length_cm * item.width_cm * item.height_cm
                return None

            def get_current_location_load(location):
                occupied_volume = 0
                occupied_weight = 0

                for current_product in location.products.select_related(
                    "packaging_type"
                ).all():
                    if current_product.weight_kg is not None:
                        occupied_weight += (
                            current_product.weight_kg * current_product.quantity
                        )

                    current_packaging_volume = get_volume_cm3(
                        current_product.packaging_type
                    )
                    if current_packaging_volume is not None:
                        occupied_volume += (
                            current_packaging_volume * current_product.quantity
                        )

                return occupied_volume, occupied_weight

            occupied_volume, occupied_weight = get_current_location_load(
                storage_location
            )

            location_volume = storage_location.volume_cm3
            packaging_volume = get_volume_cm3(packaging_type)
            load_carrier_volume = get_volume_cm3(load_carrier_type)

            required_volume = 0

            if packaging_volume is not None:
                required_volume += (
                    packaging_volume * packaging_quantity_for_check
                )

            if load_carrier_volume is not None:
                required_volume += load_carrier_volume

            if location_volume is not None:
                total_volume_after_booking = occupied_volume + required_volume

                if (
                    required_volume > 0
                    and total_volume_after_booking > location_volume
                ):
                    storage_location_errors.append(
                        "Kapazität überschritten: Bereits belegt "
                        f"{occupied_volume:.2f} cm³, neue Buchung "
                        f"{required_volume:.2f} cm³, nach Buchung "
                        f"{total_volume_after_booking:.2f} cm³, verfügbar "
                        f"{location_volume:.2f} cm³."
                    )

            max_weight = storage_location.max_weight_kg
            required_weight = 0

            if product.weight_kg is not None:
                required_weight += product.weight_kg * quantity

            if packaging_type and packaging_type.weight_kg is not None:
                required_weight += (
                    packaging_type.weight_kg * packaging_quantity_for_check
                )

            if load_carrier_type and load_carrier_type.weight_kg is not None:
                required_weight += load_carrier_type.weight_kg

            if max_weight is not None:
                total_weight_after_booking = occupied_weight + required_weight

                if (
                    required_weight > 0
                    and total_weight_after_booking > max_weight
                ):
                    storage_location_errors.append(
                        "Gewicht überschritten: Bereits belegt "
                        f"{occupied_weight:.2f} kg, neue Buchung "
                        f"{required_weight:.2f} kg, nach Buchung "
                        f"{total_weight_after_booking:.2f} kg, erlaubt "
                        f"{max_weight:.2f} kg."
                    )

            if storage_location_errors:
                errors["storage_location"] = storage_location_errors

        if errors:
            raise serializers.ValidationError(errors)

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        product = validated_data["product"]
        movement_type = validated_data["movement_type"]
        quantity = validated_data["quantity"]

        packaging_type = validated_data.get("packaging_type")
        load_carrier_type = validated_data.get("load_carrier_type")
        packaging_quantity = validated_data.get("packaging_quantity", 1)

        if movement_type == "OUT":
            latest_packaging_movement = (
                StockMovement.objects.filter(
                    product=product,
                    movement_type="IN",
                )
                .exclude(
                    packaging_type__isnull=True,
                    load_carrier_type__isnull=True,
                )
                .order_by("-created_at")
                .first()
            )

            if latest_packaging_movement:
                if not packaging_type:
                    packaging_type = latest_packaging_movement.packaging_type
                    validated_data["packaging_type"] = packaging_type

                if not load_carrier_type:
                    load_carrier_type = latest_packaging_movement.load_carrier_type
                    validated_data["load_carrier_type"] = load_carrier_type

                initial_data = getattr(self, "initial_data", {})
                packaging_quantity_was_sent = bool(
                    initial_data.get("packaging_quantity")
                )

                if not packaging_quantity_was_sent:
                    source_quantity = latest_packaging_movement.quantity or 1
                    source_packaging_quantity = (
                        latest_packaging_movement.packaging_quantity or 1
                    )

                    units_per_package = max(
                        1,
                        source_quantity // source_packaging_quantity,
                    )

                    packaging_quantity = max(
                        1,
                        -(-quantity // units_per_package),
                    )

                    validated_data["packaging_quantity"] = packaging_quantity

        packaging_cost_total = 0

        if packaging_type and packaging_type.unit_cost is not None:
            packaging_cost_total += packaging_type.unit_cost * packaging_quantity

        if load_carrier_type and load_carrier_type.unit_cost is not None:
            packaging_cost_total += load_carrier_type.unit_cost

        validated_data["packaging_cost_total"] = packaging_cost_total

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


class PackagingTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackagingType
        fields = "__all__"


class StorageStrategySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = StorageStrategySettings
        fields = "__all__"
