from django.conf import settings
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone


class StorageLocation(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=120)

    zone = models.CharField(max_length=80, blank=True)
    aisle = models.CharField(max_length=50, blank=True)
    rack = models.CharField(max_length=50, blank=True)
    shelf = models.CharField(max_length=50, blank=True)

    description = models.TextField(blank=True)

    is_active = models.BooleanField(default=True)
    is_blocked = models.BooleanField(default=False)
    is_empty = models.BooleanField(default=True)

    allow_mixed_products = models.BooleanField(default=False)

    length_cm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    width_cm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    height_cm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    max_weight_kg = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def volume_cm3(self):
        if self.length_cm and self.width_cm and self.height_cm:
            return self.length_cm * self.width_cm * self.height_cm
        return None

    def __str__(self):
        parts = [self.code, self.name]

        details = []
        if self.zone:
            details.append(f"Zone {self.zone}")
        if self.aisle:
            details.append(f"Gang {self.aisle}")
        if self.rack:
            details.append(f"Regal {self.rack}")
        if self.shelf:
            details.append(f"Fach {self.shelf}")

        if details:
            parts.append(" / ".join(details))

        return " - ".join(parts)

class Supplier(models.Model):
    name = models.CharField(max_length=255)
    supplier_number = models.CharField(max_length=100, blank=True, unique=True, null=True)
    contact_person = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=80, blank=True)
    street = models.CharField(max_length=255, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    city = models.CharField(max_length=120, blank=True)
    country = models.CharField(max_length=120, blank=True, default="Deutschland")
    note = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Product(models.Model):

    REMOVAL_STRATEGIES = [
        ("FIFO", "FIFO - Ältestes zuerst"),
        ("LIFO", "LIFO - Neuestes zuerst"),
        ("FEFO", "FEFO - Kürzestes MHD zuerst"),
        ("HIFO", "HIFO - Höchster Preis zuerst"),
        ("LOFO", "LOFO - Niedrigster Preis zuerst"),
    ]

    PUTAWAY_STRATEGIES = [
        ("FIXED_BIN", "Festplatz"),
        ("EMPTY_BIN", "Leerplatzsuche"),
        ("ADD_TO_STOCK", "Zulagerung"),
    ]

    removal_strategy = models.CharField(max_length=20, choices=REMOVAL_STRATEGIES, default="FIFO")
    putaway_strategy = models.CharField(max_length=30, choices=PUTAWAY_STRATEGIES, default="EMPTY_BIN")
    packaging_type = models.ForeignKey("PackagingType", on_delete=models.SET_NULL, null=True, blank=True)
    fixed_storage_location = models.ForeignKey(
        "StorageLocation",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="fixed_products",
    )
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    quantity = models.IntegerField(default=0)
    min_stock = models.IntegerField(default=0)
    unit = models.CharField(max_length=50, default="Stück")
    weight_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Produktgewicht pro Einheit in kg",
    )

    storage_location = models.ForeignKey(
        StorageLocation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_low_stock(self):
        return self.quantity <= self.min_stock

    def __str__(self):
        return f"{self.name} ({self.sku})"


class PurchaseOrder(models.Model):
    STATUS_CHOICES = [
        ("DRAFT", "Entwurf"),
        ("RELEASED", "Freigegeben"),
        ("ORDERED", "Bestellt"),
        ("PARTIALLY_RECEIVED", "Teilgeliefert"),
        ("RECEIVED", "Geliefert"),
        ("CANCELLED", "Storniert"),
    ]

    order_number = models.CharField(
        max_length=50,
        unique=True,
        blank=True,
        null=True,
    )

    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchase_orders",
    )

    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default="DRAFT",
    )

    title = models.CharField(max_length=255, blank=True)
    note = models.TextField(blank=True)
    expected_delivery_date = models.DateField(null=True, blank=True)

    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_purchase_orders",
    )

    released_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="released_purchase_orders",
    )

    ordered_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ordered_purchase_orders",
    )

    received_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="received_purchase_orders",
    )

    released_at = models.DateTimeField(null=True, blank=True)
    ordered_at = models.DateTimeField(null=True, blank=True)
    received_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        if not self.order_number:
            self.order_number = f"PO-{self.created_at:%Y}-{self.id:05d}"
            super().save(update_fields=["order_number"])

    @property
    def total_quantity(self):
        return sum(item.quantity for item in self.items.all())

    @property
    def received_quantity_total(self):
        return sum(item.received_quantity for item in self.items.all())

    def __str__(self):
        return self.order_number or f"Bestellung #{self.pk}"


class PurchaseOrderItem(models.Model):
    purchase_order = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.CASCADE,
        related_name="items",
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="purchase_order_items",
    )

    quantity = models.PositiveIntegerField()
    received_quantity = models.PositiveIntegerField(default=0)

    unit = models.CharField(max_length=50, blank=True)

    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )

    note = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["product__name", "id"]

    @property
    def open_quantity(self):
        return max(0, self.quantity - self.received_quantity)

    def save(self, *args, **kwargs):
        if self.product and not self.unit:
            self.unit = self.product.unit

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.purchase_order} - {self.product.name} ({self.quantity})"



class InventoryTransaction(models.Model):
    TRANSACTION_TYPE = [
        ("IN", "Eingang"),
        ("OUT", "Ausgang"),
    ]

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    transaction_type = models.CharField(max_length=3, choices=TRANSACTION_TYPE)
    quantity = models.IntegerField()
    note = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product.name} - {self.transaction_type} ({self.quantity})"

class StockMovement(models.Model):
    MOVEMENT_TYPES = [
        ("IN", "Wareneingang"),
        ("OUT", "Warenausgang"),
    ]

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="stock_movements",
    )

    movement_type = models.CharField(max_length=3, choices=MOVEMENT_TYPES)
    quantity = models.PositiveIntegerField()

    storage_location = models.ForeignKey(
        "StorageLocation",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stock_movements",
    )

    packaging_type = models.ForeignKey(
        "PackagingType",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="packaging_movements",
    )

    load_carrier_type = models.ForeignKey(
        "PackagingType",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="load_carrier_movements",
    )

    packaging_quantity = models.PositiveIntegerField(default=1)

    packaging_cost_total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )

    unit_purchase_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Einstandspreis pro Stück",
    )

    expiry_date = models.DateField(
        null=True,
        blank=True,
        help_text="MHD oder Ablaufdatum",
    )

    reference_number = models.CharField(max_length=100, blank=True)
    note = models.TextField(blank=True)

    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product.name} - {self.movement_type} - {self.quantity}"


class StorageLocationStock(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="location_stocks",
    )

    storage_location = models.ForeignKey(
        "StorageLocation",
        on_delete=models.CASCADE,
        related_name="stock_positions",
    )

    quantity = models.PositiveIntegerField(default=0)

    packaging_type = models.ForeignKey(
        "PackagingType",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="location_packaging_stocks",
    )

    load_carrier_type = models.ForeignKey(
        "PackagingType",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="location_load_carrier_stocks",
    )

    packaging_quantity = models.PositiveIntegerField(default=0)

    unit_purchase_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Einstandspreis pro Stück",
    )

    expiry_date = models.DateField(
        null=True,
        blank=True,
        help_text="MHD oder Ablaufdatum",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = (
            "product",
            "storage_location",
            "packaging_type",
            "load_carrier_type",
            "unit_purchase_price",
            "expiry_date",
        )
        ordering = ["storage_location__code", "product__name"]

    def __str__(self):
        return f"{self.storage_location.code} - {self.product.name}: {self.quantity}"


class InventorySession(models.Model):
    STATUS_CHOICES = [
        ("OPEN", "Offen"),
        ("COMPLETED", "Abgeschlossen"),
    ]

    title = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="OPEN")
    note = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def complete(self):
        self.status = "COMPLETED"
        self.completed_at = timezone.now()
        self.save(update_fields=["status", "completed_at"])

    def __str__(self):
        return f"{self.title} ({self.status})"


class InventoryCount(models.Model):
    session = models.ForeignKey(
        InventorySession,
        on_delete=models.CASCADE,
        related_name="counts",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="inventory_counts",
    )
    expected_quantity = models.IntegerField(default=0)
    counted_quantity = models.IntegerField(null=True, blank=True)
    note = models.TextField(blank=True)

    corrected = models.BooleanField(default=False)
    correction_movement = models.ForeignKey(
        StockMovement,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inventory_corrections",
    )

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("session", "product")
        ordering = ["product__name"]

    @property
    def difference(self):
        if self.counted_quantity is None:
            return None
        return self.counted_quantity - self.expected_quantity

    def __str__(self):
        return f"{self.session.title} - {self.product.name}"



class Customer(models.Model):
    customer_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        unique=True,
    )
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=80, blank=True)
    street = models.CharField(max_length=255, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    city = models.CharField(max_length=120, blank=True)
    country = models.CharField(max_length=120, blank=True, default="Deutschland")
    note = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class CustomerContact(models.Model):
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="contacts",
    )
    first_name = models.CharField(max_length=120, blank=True)
    last_name = models.CharField(max_length=120)
    role = models.CharField(max_length=120, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=80, blank=True)
    mobile = models.CharField(max_length=80, blank=True)
    is_primary = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    note = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["customer__name", "last_name", "first_name"]

    def __str__(self):
        full_name = f"{self.first_name} {self.last_name}".strip()
        return f"{full_name} - {self.customer.name}"


class DeliveryAddress(models.Model):
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="delivery_addresses",
    )
    label = models.CharField(max_length=120, default="Standard")
    recipient_name = models.CharField(max_length=255, blank=True)
    street = models.CharField(max_length=255)
    postal_code = models.CharField(max_length=20)
    city = models.CharField(max_length=120)
    country = models.CharField(max_length=120, default="Deutschland")
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    note = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["customer__name", "-is_default", "label"]

    def __str__(self):
        return f"{self.customer.name} - {self.label}"


class CustomerNote(models.Model):
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="notes",
    )
    title = models.CharField(max_length=180)
    note = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.customer.name} - {self.title}"



class AuditLog(models.Model):
    ACTION_CHOICES = [
        ("CREATE", "Erstellt"),
        ("UPDATE", "Geändert"),
        ("DELETE", "Gelöscht"),
        ("LOGIN", "Login"),
        ("SYSTEM", "System"),
    ]

    area = models.CharField(max_length=120, default="System")
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    object_type = models.CharField(max_length=120, blank=True)
    object_id = models.CharField(max_length=120, blank=True)
    message = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.area} - {self.action} - {self.created_at:%d.%m.%Y %H:%M}"


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("lager", "Lager"),
        ("einkauf", "Einkauf"),
        ("dispo", "Dispo"),
        ("viewer", "Viewer"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE)

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="viewer",
    )

    def __str__(self):
        return f"{self.user.username} ({self.role})"


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    UserProfile.objects.get_or_create(user=instance)


class PackagingType(models.Model):
    TYPE_CHOICES = [
        ("PACKAGING", "Verpackung"),
        ("LOAD_CARRIER", "Ladungsträger"),
    ]

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    category = models.CharField(
        max_length=30,
        choices=TYPE_CHOICES,
        default="PACKAGING",
    )

    unit_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )

    is_active = models.BooleanField(default=True)

    length_cm = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )
    width_cm = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )
    height_cm = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )
    weight_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name


class StorageStrategySettings(models.Model):
    REMOVAL_STRATEGIES = [
        ("FIFO", "FIFO - Ältestes zuerst"),
        ("LIFO", "LIFO - Neuestes zuerst"),
        ("FEFO", "FEFO - Kürzestes MHD zuerst"),
        ("HIFO", "HIFO - Höchster Preis zuerst"),
        ("LOFO", "LOFO - Niedrigster Preis zuerst"),
    ]

    PUTAWAY_STRATEGIES = [
        ("FIXED_BIN", "Festplatz"),
        ("EMPTY_BIN", "Leerplatzsuche"),
        ("ADD_TO_STOCK", "Zulagerung"),
    ]

    removal_strategy = models.CharField(max_length=20, choices=REMOVAL_STRATEGIES, default="FIFO")
    putaway_strategy = models.CharField(max_length=30, choices=PUTAWAY_STRATEGIES, default="EMPTY_BIN")
    capacity_check_enabled = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.removal_strategy} / {self.putaway_strategy}"


class TransportOrder(models.Model):
    class Status(models.TextChoices):
        CREATED = "CREATED", "Erstellt"
        ASSIGNED = "ASSIGNED", "Zugewiesen"
        PICKED = "PICKED", "Ware aufgenommen"
        IN_TRANSIT = "IN_TRANSIT", "In Transport"
        COMPLETED = "COMPLETED", "Abgeschlossen"
        CANCELLED = "CANCELLED", "Storniert"
        ERROR = "ERROR", "Fehler"

    transport_order_number = models.CharField(
        max_length=30,
        unique=True,
        null=True,
        blank=True,
        verbose_name="Transportauftrag",
    )
    transport_slip_number = models.CharField(
        max_length=30,
        unique=True,
        null=True,
        blank=True,
        verbose_name="Transportschein",
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="transport_orders",
        verbose_name="Produkt",
    )
    quantity = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Menge",
    )

    source_location = models.ForeignKey(
        StorageLocation,
        on_delete=models.PROTECT,
        related_name="transport_orders_source",
        verbose_name="Quellplatz",
    )
    target_location = models.ForeignKey(
        StorageLocation,
        on_delete=models.PROTECT,
        related_name="transport_orders_target",
        null=True,
        blank=True,
        verbose_name="Zielplatz / Bereitstellplatz",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.CREATED,
        verbose_name="Status",
    )

    reference_number = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Referenz",
    )
    priority = models.PositiveIntegerField(
        default=100,
        verbose_name="Priorität",
    )

    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_transport_orders",
        verbose_name="Zugewiesen an",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_transport_orders",
        verbose_name="Erstellt von",
    )

    picked_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    last_scan_value = models.CharField(max_length=255, blank=True)
    last_error = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Transportauftrag"
        verbose_name_plural = "Transportaufträge"

    def __str__(self):
        number = self.transport_order_number or f"TA-{self.pk or 'neu'}"
        return f"{number} - {self.product} von {self.source_location}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        updates = {}

        if not self.transport_order_number:
            updates["transport_order_number"] = f"TA-{self.created_at:%Y}-{self.id:05d}"

        if not self.transport_slip_number:
            updates["transport_slip_number"] = f"TS-{self.created_at:%Y}-{self.id:05d}"

        if updates:
            for field, value in updates.items():
                setattr(self, field, value)

            super().save(update_fields=list(updates.keys()))

