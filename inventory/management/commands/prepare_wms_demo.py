from decimal import Decimal

from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from inventory.models import (
    Product,
    StockMovement,
    StorageLocation,
    StorageLocationStock,
    TransportOrder,
)


class Command(BaseCommand):
    help = "Bereitet einen sauberen WMS-Demostand mit WA-Flächen und Demo-Transportauftrag vor."

    def add_arguments(self, parser):
        parser.add_argument(
            "--shipping-count",
            type=int,
            default=5,
            help="Anzahl der sicherzustellenden WA-Flächen, Standard: 5",
        )
        parser.add_argument(
            "--product-name",
            default="Filament PAL Blau",
            help="Produktname für den Demo-Transportauftrag",
        )
        parser.add_argument(
            "--source-code",
            default="A-R2-F4",
            help="Quell-Lagerort für den Demo-Transportauftrag",
        )
        parser.add_argument(
            "--target-code",
            default="WA-0001",
            help="Ziel-WA-Fläche für den Demo-Transportauftrag",
        )
        parser.add_argument(
            "--quantity",
            default="1",
            help="Menge für den Demo-Transportauftrag",
        )
        parser.add_argument(
            "--reference",
            default="SERVER-DEMO-WA-TEST",
            help="Referenznummer für den Demo-Transportauftrag",
        )
        parser.add_argument(
            "--skip-cancel-open",
            action="store_true",
            help="Offene Transportaufträge nicht stornieren",
        )
        parser.add_argument(
            "--skip-create-order",
            action="store_true",
            help="Keinen neuen Demo-Transportauftrag erstellen",
        )
        parser.add_argument(
            "--ensure-stock",
            action="store_true",
            help="Fehlenden Demo-Bestand am Quellplatz automatisch anlegen",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Nur anzeigen, was passieren würde",
        )

    def handle(self, *args, **options):
        quantity = Decimal(str(options["quantity"]))

        if quantity <= 0:
            raise CommandError("Die Menge muss größer als 0 sein.")

        dry_run = options["dry_run"]

        self.stdout.write(self.style.MIGRATE_HEADING("WMS-Demo vorbereiten"))

        self._cancel_open_orders(options, dry_run)
        self._ensure_shipping_areas(options, dry_run)

        if options["skip_create_order"]:
            self.stdout.write(self.style.WARNING("Demo-Transportauftrag wird übersprungen."))
            return

        self._create_demo_order(options, quantity, dry_run)

    def _cancel_open_orders(self, options, dry_run):
        if options["skip_cancel_open"]:
            self.stdout.write(self.style.WARNING("Offene Transportaufträge werden nicht storniert."))
            return

        qs = TransportOrder.objects.exclude(status__in=["COMPLETED", "CANCELLED"]).order_by("id")
        count = qs.count()

        self.stdout.write(f"Offene Transportaufträge gefunden: {count}")

        for order in qs:
            self.stdout.write(
                f"- {order.transport_order_number} · {order.status} · "
                f"{order.source_location.code if order.source_location else '-'} -> "
                f"{order.target_location.code if order.target_location else '-'}"
            )

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry-run: offene Transportaufträge würden storniert."))
            return

        updated = qs.update(
            status="CANCELLED",
            last_error="Alter Demo-Transportauftrag wurde für sauberen Demo-Zustand storniert.",
            updated_at=timezone.now(),
        )

        self.stdout.write(self.style.SUCCESS(f"Stornierte Transportaufträge: {updated}"))

    def _ensure_shipping_areas(self, options, dry_run):
        shipping_count = options["shipping_count"]

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f"Dry-run: WA-Flächen WA-0001 bis WA-{shipping_count:04d} würden sichergestellt."
                )
            )
            return

        self.stdout.write("WA-Flächen sicherstellen...")
        call_command(
            "auto_create_transport_orders",
            create_shipping_areas=True,
            shipping_count=shipping_count,
        )

    def _create_demo_order(self, options, quantity, dry_run):
        product_name = options["product_name"]
        source_code = options["source_code"]
        target_code = options["target_code"]
        reference = options["reference"]

        product = Product.objects.filter(name=product_name).first()

        if not product:
            product = Product.objects.filter(name__icontains=product_name).first()

        if not product:
            raise CommandError(f"Produkt nicht gefunden: {product_name}")

        try:
            source = StorageLocation.objects.get(code=source_code)
        except StorageLocation.DoesNotExist as exc:
            raise CommandError(f"Quell-Lagerort nicht gefunden: {source_code}") from exc

        try:
            target = StorageLocation.objects.get(code=target_code)
        except StorageLocation.DoesNotExist as exc:
            raise CommandError(f"Ziel-Lagerort nicht gefunden: {target_code}") from exc

        stock_qs = StorageLocationStock.objects.filter(
            product=product,
            storage_location=source,
            quantity__gt=0,
        )

        current_stock = sum((stock.quantity for stock in stock_qs), Decimal("0"))

        self.stdout.write(
            f"Demo-Auswahl: {product.name} · {source.code} -> {target.code} · Menge {quantity}"
        )
        self.stdout.write(f"Aktueller Bestand am Quellplatz: {current_stock}")

        if current_stock < quantity:
            missing_quantity = quantity - current_stock

            if not options["ensure_stock"]:
                raise CommandError(
                    f"Nicht genug Bestand auf {source.code}. "
                    f"Vorhanden: {current_stock}, benötigt: {quantity}. "
                    f"Optional mit --ensure-stock fehlenden Demo-Bestand anlegen."
                )

            if dry_run:
                self.stdout.write(
                    self.style.WARNING(
                        f"Dry-run: {missing_quantity} Stück Demo-Bestand würden auf {source.code} angelegt."
                    )
                )
            else:
                stock, _created = StorageLocationStock.objects.get_or_create(
                    product=product,
                    storage_location=source,
                    defaults={"quantity": Decimal("0")},
                )
                stock.quantity += missing_quantity
                stock.save(update_fields=["quantity"])

                StockMovement.objects.create(
                    product=product,
                    storage_location=source,
                    movement_type="IN",
                    quantity=missing_quantity,
                    reference_number="DEMO-STOCK-SETUP",
                )

                self.stdout.write(
                    self.style.SUCCESS(
                        f"Demo-Bestand ergänzt: {missing_quantity} auf {source.code}"
                    )
                )

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry-run: Demo-Transportauftrag würde erstellt."))
            return

        with transaction.atomic():
            order = TransportOrder.objects.create(
                product=product,
                quantity=quantity,
                source_location=source,
                target_location=target,
                status="CREATED",
                reference_number=reference,
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Demo-Transportauftrag erstellt: {order.transport_order_number} "
                f"({source.code} -> {target.code})"
            )
        )
