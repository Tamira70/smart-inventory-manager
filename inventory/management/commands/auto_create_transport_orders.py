import time
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from inventory.models import (
    Product,
    StorageLocation,
    StorageLocationStock,
    TransportOrder,
)


OPEN_TRANSPORT_STATUSES = [
    TransportOrder.Status.CREATED,
    TransportOrder.Status.ASSIGNED,
    TransportOrder.Status.PICKED,
    TransportOrder.Status.IN_TRANSIT,
    TransportOrder.Status.ERROR,
]


class Command(BaseCommand):
    help = (
        "Erstellt Wareneingangsflächen und erzeugt automatisch Transportaufträge "
        "für WE-Flächen mit Bestand ohne offenen TA."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--create-areas",
            action="store_true",
            help="Legt Wareneingangsflächen WE-0001 bis WE-000X an.",
        )
        parser.add_argument(
            "--count",
            type=int,
            default=5,
            help="Anzahl der anzulegenden WE-Flächen. Standard: 5.",
        )
        parser.add_argument(
            "--loop",
            action="store_true",
            help="Prüft dauerhaft im angegebenen Intervall.",
        )
        parser.add_argument(
            "--interval",
            type=int,
            default=900,
            help="Prüfintervall in Sekunden. Standard: 900 Sekunden = 15 Minuten.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Zeigt nur an, was passieren würde, ohne Daten zu ändern.",
        )

    def handle(self, *args, **options):
        if options["create_areas"]:
            self.create_receiving_areas(
                count=options["count"],
                dry_run=options["dry_run"],
            )

        if options["loop"]:
            self.stdout.write(
                self.style.WARNING(
                    f"Automatische WE-Prüfung läuft alle {options['interval']} Sekunden. "
                    "Mit STRG+C beenden."
                )
            )

            while True:
                self.create_transport_orders_for_receiving_areas(
                    dry_run=options["dry_run"],
                )
                time.sleep(options["interval"])

        else:
            self.create_transport_orders_for_receiving_areas(
                dry_run=options["dry_run"],
            )

    def create_receiving_areas(self, count: int, dry_run: bool):
        for number in range(1, count + 1):
            code = f"WE-{number:04d}"

            if StorageLocation.objects.filter(code=code).exists():
                self.stdout.write(f"WE-Fläche existiert bereits: {code}")
                continue

            if dry_run:
                self.stdout.write(f"[DRY-RUN] Würde WE-Fläche anlegen: {code}")
                continue

            StorageLocation.objects.create(
                code=code,
                name="Wareneingangsfläche",
                location_type=StorageLocation.LocationType.RECEIVING,
                zone="WE",
                aisle="WE",
                rack=f"{number:04d}",
                shelf="0001",
                description=(
                    "Automatisch angelegte Wareneingangsfläche. "
                    "Bestände auf dieser Fläche werden regelmäßig auf offene TA geprüft."
                ),
                is_active=True,
                is_blocked=False,
                is_empty=True,
                allow_mixed_products=True,
            )

            self.stdout.write(self.style.SUCCESS(f"WE-Fläche angelegt: {code}"))

    def create_transport_orders_for_receiving_areas(self, dry_run: bool):
        receiving_locations = StorageLocation.objects.filter(
            location_type=StorageLocation.LocationType.RECEIVING,
            is_active=True,
            is_blocked=False,
        ).order_by("code")

        if not receiving_locations.exists():
            self.stdout.write(
                self.style.WARNING(
                    "Keine aktiven WE-Flächen gefunden. Nutze zuerst --create-areas."
                )
            )
            return

        created_count = 0
        skipped_count = 0

        stocks = (
            StorageLocationStock.objects
            .select_related("product", "storage_location")
            .filter(
                storage_location__in=receiving_locations,
                quantity__gt=0,
            )
            .order_by("storage_location__code", "product__name", "created_at")
        )

        for stock in stocks:
            with transaction.atomic():
                has_open_transport_order = TransportOrder.objects.filter(
                    product=stock.product,
                    source_location=stock.storage_location,
                    status__in=OPEN_TRANSPORT_STATUSES,
                ).exists()

                if has_open_transport_order:
                    skipped_count += 1
                    self.stdout.write(
                        f"Übersprungen: {stock.storage_location.code} / "
                        f"{stock.product.name} hat bereits einen offenen TA."
                    )
                    continue

                target_location = self.find_target_location(stock.product, stock.storage_location)

                if not target_location:
                    skipped_count += 1
                    self.stdout.write(
                        self.style.WARNING(
                            f"Kein Zielplatz gefunden für {stock.product.name} "
                            f"von {stock.storage_location.code}."
                        )
                    )
                    continue

                quantity = Decimal(stock.quantity)

                if dry_run:
                    created_count += 1
                    self.stdout.write(
                        f"[DRY-RUN] Würde TA erstellen: "
                        f"{stock.product.name} Menge {quantity} "
                        f"von {stock.storage_location.code} nach {target_location.code}"
                    )
                    continue

                order = TransportOrder.objects.create(
                    product=stock.product,
                    quantity=quantity,
                    source_location=stock.storage_location,
                    target_location=target_location,
                    reference_number=(
                        f"AUTO-WE-{stock.storage_location.code}-"
                        f"{timezone.now():%Y%m%d%H%M%S}"
                    ),
                    status=TransportOrder.Status.CREATED,
                )

                created_count += 1

                self.stdout.write(
                    self.style.SUCCESS(
                        f"TA erstellt: {order.transport_order_number} / "
                        f"{order.transport_slip_number} · "
                        f"{stock.product.name} · "
                        f"{stock.storage_location.code} → {target_location.code}"
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"WE-Prüfung abgeschlossen. Erstellt: {created_count}, "
                f"übersprungen: {skipped_count}."
            )
        )

    def find_target_location(self, product: Product, source_location: StorageLocation):
        fixed_location = getattr(product, "fixed_storage_location", None)

        if (
            fixed_location
            and fixed_location.id != source_location.id
            and fixed_location.is_active
            and not fixed_location.is_blocked
        ):
            return fixed_location

        product_location = getattr(product, "storage_location", None)

        if (
            product_location
            and product_location.id != source_location.id
            and product_location.is_active
            and not product_location.is_blocked
        ):
            return product_location

        existing_stock_location = (
            StorageLocationStock.objects
            .select_related("storage_location")
            .filter(
                product=product,
                storage_location__is_active=True,
                storage_location__is_blocked=False,
                storage_location__location_type=StorageLocation.LocationType.STORAGE,
            )
            .exclude(storage_location=source_location)
            .exclude(storage_location__code__startswith="WE-")
            .order_by("storage_location__code")
            .first()
        )

        if existing_stock_location:
            return existing_stock_location.storage_location

        empty_location = (
            StorageLocation.objects
            .filter(
                is_active=True,
                is_blocked=False,
                is_empty=True,
                location_type=StorageLocation.LocationType.STORAGE,
            )
            .exclude(id=source_location.id)
            .exclude(code__startswith="WE-")
            .order_by("code")
            .first()
        )

        if empty_location:
            return empty_location

        fallback_location = (
            StorageLocation.objects
            .filter(
                is_active=True,
                is_blocked=False,
                location_type=StorageLocation.LocationType.STORAGE,
            )
            .exclude(id=source_location.id)
            .exclude(code__startswith="WE-")
            .order_by("code")
            .first()
        )

        return fallback_location
