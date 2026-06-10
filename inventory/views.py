from django.contrib.auth.models import User
from django.http import HttpResponse
from django.utils.text import slugify
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from django.db import transaction
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.http import HttpResponse
from rest_framework.decorators import action
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

from .models import (
    PackagingType,
    StorageStrategySettings,
    Product,
    InventoryTransaction,
    StockMovement,
    InventorySession,
    InventoryCount,
    StorageLocation,
    StorageLocationStock,
    Supplier,
    Customer,
    CustomerContact,
    DeliveryAddress,
    CustomerNote,
    AuditLog,
)
from .serializers import (
    PackagingTypeSerializer,
    StorageStrategySettingsSerializer,
    ProductSerializer,
    InventoryTransactionSerializer,
    StockMovementSerializer,
    InventorySessionSerializer,
    InventoryCountSerializer,
    StorageLocationSerializer,
    StorageLocationStockSerializer,
    SupplierSerializer,

    CustomerSerializer,
    CustomerContactSerializer,
    DeliveryAddressSerializer,
    CustomerNoteSerializer,
    AdminUserSerializer,
    AuditLogSerializer,
)
from .permissions import IsAdmin, IsLagerOrAdmin, IsEinkaufOrAdmin


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        user = self.user
        profile = getattr(user, "userprofile", None)

        data["user"] = {
            "username": user.username,
            "role": profile.role if profile else "viewer",
        }

        return data



class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class StorageLocationViewSet(viewsets.ModelViewSet):
    queryset = StorageLocation.objects.all().order_by("code")
    serializer_class = StorageLocationSerializer

    def get_permissions(self):
        if self.request.method in ["GET", "HEAD", "OPTIONS"]:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsEinkaufOrAdmin()]


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all().order_by("name")
    serializer_class = SupplierSerializer

    def get_permissions(self):
        if self.request.method in ["GET", "HEAD", "OPTIONS"]:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsEinkaufOrAdmin()]



class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by("name")
    serializer_class = CustomerSerializer

    def get_permissions(self):
        if self.request.method in ["GET", "HEAD", "OPTIONS"]:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsEinkaufOrAdmin()]


class CustomerContactViewSet(viewsets.ModelViewSet):
    queryset = CustomerContact.objects.select_related("customer").order_by(
        "customer__name",
        "last_name",
        "first_name",
    )
    serializer_class = CustomerContactSerializer

    def get_permissions(self):
        if self.request.method in ["GET", "HEAD", "OPTIONS"]:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsEinkaufOrAdmin()]


class DeliveryAddressViewSet(viewsets.ModelViewSet):
    queryset = DeliveryAddress.objects.select_related("customer").order_by(
        "customer__name",
        "-is_default",
        "label",
    )
    serializer_class = DeliveryAddressSerializer

    def get_permissions(self):
        if self.request.method in ["GET", "HEAD", "OPTIONS"]:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsEinkaufOrAdmin()]


class CustomerNoteViewSet(viewsets.ModelViewSet):
    queryset = CustomerNote.objects.select_related(
        "customer",
        "created_by",
    ).order_by("-created_at")
    serializer_class = CustomerNoteSerializer

    def get_permissions(self):
        if self.request.method in ["GET", "HEAD", "OPTIONS"]:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsEinkaufOrAdmin()]

def perform_create(self, serializer):
    movement = serializer.save(created_by=self.request.user)

    product = movement.product

    # Nur bei Wareneingang
    if movement.movement_type == "IN":

        suggested_location = self.get_storage_location_suggestion(product)

        if suggested_location:

            # Produkt Lagerplatz setzen
            product.storage_location = suggested_location

            # Lagerplatz als belegt markieren
            suggested_location.is_empty = False
            suggested_location.save(update_fields=["is_empty"])

            product.save(update_fields=["storage_location"])

        else:
            raise ValueError(
                "Kein geeigneter Lagerplatz gefunden."
            )

class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.select_related("userprofile").order_by("username")
    serializer_class = AdminUserSerializer

    def get_permissions(self):
        return [IsAuthenticated(), IsAdmin()]

    def perform_create(self, serializer):
        created_user = serializer.save()

        AuditLog.objects.create(
            area="Benutzerverwaltung",
            action="CREATE",
            object_type="User",
            object_id=str(created_user.id),
            message=f"Benutzer {created_user.username} wurde angelegt.",
            created_by=self.request.user,
            metadata={"username": created_user.username},
        )

    def perform_update(self, serializer):
        updated_user = serializer.save()

        AuditLog.objects.create(
            area="Benutzerverwaltung",
            action="UPDATE",
            object_type="User",
            object_id=str(updated_user.id),
            message=f"Benutzer {updated_user.username} wurde geändert.",
            created_by=self.request.user,
            metadata={"username": updated_user.username},
        )


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related("created_by").order_by("-created_at")
    serializer_class = AuditLogSerializer

    def get_permissions(self):
        return [IsAuthenticated(), IsAdmin()]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related("storage_location").order_by("-id")
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.request.method in ["GET", "HEAD", "OPTIONS"]:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsLagerOrAdmin()]

class InventoryTransactionViewSet(viewsets.ModelViewSet):
    queryset = InventoryTransaction.objects.all().order_by("-id")
    serializer_class = InventoryTransactionSerializer

    def get_permissions(self):
        if self.request.method in ["GET", "HEAD", "OPTIONS"]:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsLagerOrAdmin()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.select_related(
        "product",
        "created_by",
        "storage_location",
        "packaging_type",
        "load_carrier_type",
    ).order_by("-created_at")

    serializer_class = StockMovementSerializer

    def get_storage_location_suggestion(self, product):
        """
        Ermittelt einen intelligenten Lagerplatzvorschlag.
        """

        # 1. Festplatzstrategie
        if (
            product.putaway_strategy == "FIXED_BIN"
            and product.fixed_storage_location
            and product.fixed_storage_location.is_active
            and not product.fixed_storage_location.is_blocked
        ):
            return product.fixed_storage_location

        # 2. Leerplatzsuche
        empty_location = (
            StorageLocation.objects.filter(
                is_active=True,
                is_blocked=False,
                is_empty=True,
            )
            .order_by("zone", "aisle", "rack", "shelf")
            .first()
        )

        if empty_location:
            return empty_location

        # 3. Zulagerung / Mischlager
        if product.putaway_strategy == "ADD_TO_STOCK":
            mixed_location = (
                StorageLocation.objects.filter(
                    is_active=True,
                    is_blocked=False,
                    allow_mixed_products=True,
                ).first()
            )

            if mixed_location:
                return mixed_location

        return None

    def get_permissions(self):
        if self.request.method in ["GET", "HEAD", "OPTIONS"]:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsLagerOrAdmin()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"], url_path="export-excel")
    def export_excel(self, request):
        workbook = Workbook()
        worksheet = workbook.active
        worksheet.title = "Bewegungshistorie"

        headers = [
            "Datum",
            "Produkt",
            "Typ",
            "Menge",
            "Referenz",
            "Lagerplatz",
            "Verpackung",
            "Ladungsträger",
            "Packmenge",
            "Kosten",
            "Notiz",
            "Benutzer",
        ]

        worksheet.append(headers)

        column_widths = {
            "A": 22,
            "B": 28,
            "C": 18,
            "D": 12,
            "E": 18,
            "F": 45,
            "G": 18,
            "H": 22,
            "I": 14,
            "J": 14,
            "K": 45,
            "L": 18,
        }

        for column, width in column_widths.items():
            worksheet.column_dimensions[column].width = width

        header_fill = PatternFill(
            fill_type="solid",
            fgColor="1E293B",
        )
        header_font = Font(
            bold=True,
            color="FFFFFF",
        )
        border = Border(
            left=Side(style="thin", color="CBD5E1"),
            right=Side(style="thin", color="CBD5E1"),
            top=Side(style="thin", color="CBD5E1"),
            bottom=Side(style="thin", color="CBD5E1"),
        )

        for cell in worksheet[1]:
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(
                horizontal="center",
                vertical="center",
                wrap_text=True,
            )
            cell.border = border

        movements = self.get_queryset()

        for movement in movements:
            movement_type = (
                "Wareneingang"
                if movement.movement_type == "IN"
                else "Warenausgang"
            )

            quantity = (
                -movement.quantity
                if movement.movement_type == "OUT"
                else movement.quantity
            )

            row = [
                movement.created_at.strftime("%d.%m.%Y %H:%M:%S"),
                movement.product.name if movement.product else "",
                movement_type,
                quantity,
                movement.reference_number or "",
                str(movement.storage_location) if movement.storage_location else "",
                movement.packaging_type.name if movement.packaging_type else "",
                movement.load_carrier_type.name if movement.load_carrier_type else "",
                movement.packaging_quantity
                if movement.packaging_type or movement.load_carrier_type
                else "",
                movement.packaging_cost_total
                if movement.packaging_cost_total is not None
                else "",
                movement.note or "",
                movement.created_by.username if movement.created_by else "",
            ]

            worksheet.append(row)

        for row in worksheet.iter_rows(min_row=2):
            for cell in row:
                cell.border = border
                cell.alignment = Alignment(
                    vertical="top",
                    wrap_text=True,
                )

        for cell in worksheet["J"][1:]:
            cell.number_format = '#,##0.00 €'

        worksheet.freeze_panes = "A2"
        worksheet.auto_filter.ref = worksheet.dimensions

        response = HttpResponse(
            content_type=(
                "application/vnd.openxmlformats-officedocument."
                "spreadsheetml.sheet"
            )
        )
        response["Content-Disposition"] = (
            'attachment; filename="bewegungshistorie.xlsx"'
        )

        workbook.save(response)
        return response

    serializer_class = StockMovementSerializer

    def get_storage_location_suggestion(self, product):
        """
        Ermittelt einen intelligenten Lagerplatzvorschlag.
        """

        # 1. Festplatzstrategie
        if (
            product.putaway_strategy == "FIXED_BIN"
            and product.fixed_storage_location
            and product.fixed_storage_location.is_active
            and not product.fixed_storage_location.is_blocked
        ):
            return product.fixed_storage_location

        # 2. Leerplatzsuche
        empty_location = (
            StorageLocation.objects.filter(
                is_active=True,
                is_blocked=False,
                is_empty=True,
            )
            .order_by("zone", "aisle", "rack", "shelf")
            .first()
        )

        if empty_location:
            return empty_location

        # 3. Zulagerung / Mischlager
        if product.putaway_strategy == "ADD_TO_STOCK":
            mixed_location = (
                StorageLocation.objects.filter(
                    is_active=True,
                    is_blocked=False,
                    allow_mixed_products=True,
                ).first()
            )

            if mixed_location:
                return mixed_location

        return None

    def get_permissions(self):
        if self.request.method in ["GET", "HEAD", "OPTIONS"]:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsLagerOrAdmin()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)



class InventorySessionViewSet(viewsets.ModelViewSet):
    queryset = (
        InventorySession.objects.select_related("created_by")
        .prefetch_related("counts")
        .order_by("-created_at")
    )
    serializer_class = InventorySessionSerializer

    def get_permissions(self):
        if self.request.method in ["GET", "HEAD", "OPTIONS"]:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsLagerOrAdmin()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"], url_path="complete")
    def complete(self, request, pk=None):
        session = self.get_object()
        session.status = "COMPLETED"
        session.completed_at = timezone.now()
        session.save(update_fields=["status", "completed_at"])

        serializer = self.get_serializer(session)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="export-excel")
    def export_excel(self, request, pk=None):
        session = self.get_object()

        counts = (
            session.counts.select_related(
                "product",
                "created_by",
                "correction_movement",
            )
            .order_by("product__name")
        )

        wb = Workbook()
        ws = wb.active
        ws.title = "Inventurbericht"

        title_fill = PatternFill("solid", fgColor="1E3A8A")
        header_fill = PatternFill("solid", fgColor="2563EB")
        green_fill = PatternFill("solid", fgColor="DCFCE7")
        red_fill = PatternFill("solid", fgColor="FEE2E2")
        yellow_fill = PatternFill("solid", fgColor="FEF3C7")

        white_font = Font(color="FFFFFF", bold=True)
        bold_font = Font(bold=True)

        thin_border = Border(
            left=Side(style="thin", color="CBD5E1"),
            right=Side(style="thin", color="CBD5E1"),
            top=Side(style="thin", color="CBD5E1"),
            bottom=Side(style="thin", color="CBD5E1"),
        )

        ws.merge_cells("A1:I1")
        ws["A1"] = "Smart Inventory Manager - Inventurbericht"
        ws["A1"].fill = title_fill
        ws["A1"].font = Font(color="FFFFFF", bold=True, size=16)
        ws["A1"].alignment = Alignment(horizontal="center")

        ws["A3"] = "Inventur:"
        ws["B3"] = session.title

        ws["A4"] = "Status:"
        ws["B4"] = session.get_status_display()

        ws["A5"] = "Erstellt von:"
        ws["B5"] = session.created_by.username if session.created_by else "—"

        ws["A6"] = "Erstellt am:"
        ws["B6"] = session.created_at.strftime("%d.%m.%Y %H:%M")

        if session.completed_at:
            ws["A7"] = "Abgeschlossen am:"
            ws["B7"] = session.completed_at.strftime("%d.%m.%Y %H:%M")

        for cell in ["A3", "A4", "A5", "A6", "A7"]:
            ws[cell].font = bold_font

        start_row = 9

        headers = [
            "Produkt",
            "SKU",
            "Soll-Bestand",
            "Ist-Bestand",
            "Differenz",
            "Einheit",
            "Korrigiert",
            "Notiz",
            "Gezählt von",
        ]

        for col, header in enumerate(headers, start=1):
            cell = ws.cell(row=start_row, column=col, value=header)
            cell.fill = header_fill
            cell.font = white_font
            cell.alignment = Alignment(horizontal="center")
            cell.border = thin_border

        for row_index, count in enumerate(counts, start=start_row + 1):
            difference = count.difference

            row_values = [
                count.product.name,
                count.product.sku,
                count.expected_quantity,
                count.counted_quantity if count.counted_quantity is not None else "",
                difference if difference is not None else "",
                count.product.unit,
                "Ja" if count.corrected else "Nein",
                count.note,
                count.created_by.username if count.created_by else "—",
            ]

            if count.counted_quantity is None:
                row_fill = yellow_fill
            elif difference != 0:
                row_fill = red_fill
            else:
                row_fill = green_fill

            for col, value in enumerate(row_values, start=1):
                cell = ws.cell(row=row_index, column=col, value=value)
                cell.fill = row_fill
                cell.border = thin_border
                cell.alignment = Alignment(vertical="top")

        for col in range(1, len(headers) + 1):
            column_letter = get_column_letter(col)
            ws.column_dimensions[column_letter].width = 20

        ws.column_dimensions["A"].width = 28
        ws.column_dimensions["H"].width = 35
        ws.freeze_panes = "A10"

        summary_row = start_row + counts.count() + 3

        total_counts = counts.count()
        done_counts = counts.exclude(counted_quantity__isnull=True).count()
        diff_counts = sum(
            1 for count in counts if count.difference not in (None, 0)
        )
        corrected_counts = counts.filter(corrected=True).count()

        ws.cell(
            row=summary_row,
            column=1,
            value="Zusammenfassung",
        ).font = Font(bold=True, size=14)

        summary_data = [
            ("Positionen gesamt", total_counts),
            ("Gezählte Positionen", done_counts),
            ("Positionen mit Differenz", diff_counts),
            ("Korrigierte Positionen", corrected_counts),
        ]

        for index, (label, value) in enumerate(summary_data, start=summary_row + 1):
            ws.cell(row=index, column=1, value=label).font = bold_font
            ws.cell(row=index, column=2, value=value)

        correction_sheet = wb.create_sheet("Korrekturen")

        correction_headers = [
            "Produkt",
            "Bewegungstyp",
            "Menge",
            "Referenz",
            "Notiz",
            "Gebucht von",
            "Datum",
        ]

        for col, header in enumerate(correction_headers, start=1):
            cell = correction_sheet.cell(row=1, column=col, value=header)
            cell.fill = header_fill
            cell.font = white_font
            cell.border = thin_border

        correction_row = 2

        for count in counts:
            movement = count.correction_movement
            if not movement:
                continue

            values = [
                movement.product.name,
                movement.get_movement_type_display(),
                movement.quantity,
                movement.reference_number,
                movement.note,
                movement.created_by.username if movement.created_by else "—",
                movement.created_at.strftime("%d.%m.%Y %H:%M"),
            ]

            for col, value in enumerate(values, start=1):
                cell = correction_sheet.cell(
                    row=correction_row,
                    column=col,
                    value=value,
                )
                cell.border = thin_border

            correction_row += 1

        for col in range(1, len(correction_headers) + 1):
            correction_sheet.column_dimensions[get_column_letter(col)].width = 24

        safe_title = slugify(session.title) or "inventur"
        filename = f"inventurbericht-{session.id}-{safe_title}.xlsx"

        response = HttpResponse(
            content_type=(
                "application/vnd.openxmlformats-officedocument."
                "spreadsheetml.sheet"
            )
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        wb.save(response)
        return response


class InventoryCountViewSet(viewsets.ModelViewSet):
    queryset = InventoryCount.objects.select_related(
        "session",
        "product",
        "created_by",
        "correction_movement",
    ).order_by("-created_at")
    serializer_class = InventoryCountSerializer

    def get_permissions(self):
        if self.request.method in ["GET", "HEAD", "OPTIONS"]:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsLagerOrAdmin()]

    def get_queryset(self):
        queryset = super().get_queryset()
        session_id = self.request.query_params.get("session")

        if session_id:
            queryset = queryset.filter(session_id=session_id)

        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"], url_path="apply-correction")
    @transaction.atomic
    def apply_correction(self, request, pk=None):
        inventory_count = self.get_object()

        if inventory_count.counted_quantity is None:
            return Response(
                {"detail": "Bitte zuerst eine gezählte Menge eintragen."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if inventory_count.corrected:
            return Response(
                {
                    "detail": (
                        "Für diese Inventurposition wurde bereits eine "
                        "Korrektur gebucht."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        product = inventory_count.product
        current_quantity = product.quantity
        counted_quantity = inventory_count.counted_quantity
        difference = counted_quantity - current_quantity

        if difference == 0:
            inventory_count.corrected = True
            inventory_count.save(update_fields=["corrected"])
            serializer = self.get_serializer(inventory_count)
            return Response(serializer.data)

        movement_type = "IN" if difference > 0 else "OUT"
        movement_quantity = abs(difference)

        product.quantity = counted_quantity
        product.save(update_fields=["quantity", "updated_at"])

        movement = StockMovement.objects.create(
            product=product,
            movement_type=movement_type,
            quantity=movement_quantity,
            reference_number=f"INV-{inventory_count.session_id}-{inventory_count.id}",
            note=(
                f"Inventur-Korrektur: Soll laut System "
                f"{inventory_count.expected_quantity}, "
                f"Ist gezählt {counted_quantity}, "
                f"vorheriger aktueller Bestand {current_quantity}."
            ),
            created_by=request.user,
        )

        inventory_count.corrected = True
        inventory_count.correction_movement = movement
        inventory_count.save(
            update_fields=[
                "corrected",
                "correction_movement",
                "updated_at",
            ]
        )

        serializer = self.get_serializer(inventory_count)
        return Response(serializer.data)
    


class StorageLocationStockViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = (
        StorageLocationStock.objects.select_related(
            "product",
            "storage_location",
            "packaging_type",
            "load_carrier_type",
        )
        .filter(quantity__gt=0)
        .order_by("storage_location__code", "product__name")
    )
    serializer_class = StorageLocationStockSerializer
    permission_classes = [IsAuthenticated]


class PackagingTypeViewSet(viewsets.ModelViewSet):
    queryset = PackagingType.objects.all().order_by("name")
    serializer_class = PackagingTypeSerializer


class StorageStrategySettingsViewSet(viewsets.ModelViewSet):
    queryset = StorageStrategySettings.objects.all()
    serializer_class = StorageStrategySettingsSerializer
