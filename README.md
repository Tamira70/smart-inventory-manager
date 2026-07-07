# 📦 Smart Inventory Manager – Feature Branch `feature/lagerorte`

Dieser Branch enthält die erweiterte Lagerplatz- und WMS-Logik des **Smart Inventory Manager**.

## Schwerpunkt dieses Branches

- Lagerorte und Lagerplatzbestände
- Wareneingang mit Lagerplatz, Verpackung und Ladungsträger
- Warenausgang von konkretem Lagerplatz
- automatische Frei-/Belegt-Synchronisierung der Lagerplätze
- Kapazitätsprüfung nach Volumen und Gewicht
- Verpackungsarten und Ladungsträger
- Einstandspreise für HIFO/LOFO
- MHD/Ablaufdatum für FEFO
- Auslagerstrategien FIFO, LIFO, FEFO, HIFO und LOFO
- Excel-Export für Bewegungshistorie
- Excel-Export für Inventurberichte
- Excel-Export für Lagerplatzbestände

## Status

Dieser Branch dient der Weiterentwicklung der Lager-IT-/WMS-Funktionen.  
Die wichtigsten Lagerplatz-, Kapazitäts- und Auslagerstrategien sind lokal und auf dem Server getestet.

## Technologie

- Django REST Framework
- React mit TypeScript
- SQLite lokal
- Apache + Gunicorn auf Linux-Server
- openpyxl für Excel-Exporte

## Ziel

Das Projekt zeigt praxisnahe Logistik-IT, ERP-/SAP-nahe Prozesslogik und digitale Lagerverwaltung in einer eigenen Full-Stack-Anwendung.

---
<<<<<<< Updated upstream
=======

## 📸 Screenshots – Bestellprozess

Der Bestellprozess zeigt den Ablauf von der Einkaufsbestellung bis zur automatischen Lagerbewegung im Wareneingang.

| Neue Bestellung | Status: Entwurf |
|---|---|
| ![Neue Bestellung](docs/screenshots/bestellprozess/01-neue-bestellung.png) | ![Bestellstatus Entwurf](docs/screenshots/bestellprozess/02-bestellstatus-entwurf.png) |

| Status: Freigegeben | Status: Geliefert |
|---|---|
| ![Bestellstatus Freigegeben](docs/screenshots/bestellprozess/03-bestellstatus-freigegeben.png) | ![Bestellstatus Geliefert](docs/screenshots/bestellprozess/04-bestellstatus-geliefert.png) |

| Wareneingang aus Bestellung | Automatische Lagerbewegung |
|---|---|
| ![Wareneingang aus Bestellung](docs/screenshots/bestellprozess/05-wareneingang-aus-bestellung.png) | ![Lagerbewegung WE-PO](docs/screenshots/bestellprozess/06-lagerbewegung-we-po.png) |

---

### 📸 Screenshots für die Projektdokumentation

Geplante Screenshots für die Portfolio-Dokumentation:

- Bestellübersicht mit PO-Nummern
- Neue Bestellung mit Lieferant und Produktposition
- Bestellstatus mit ENTWURF / FREIGEGEBEN / BESTELLT / ERHALTEN
- Wareneingang mit ausgewählter offener Bestellposition
- Automatisch erzeugte Lagerbewegung mit Referenz `WE-PO-...`

### 🚜 WMS-/Lagerleitsystem: Transportauftrag, Transportschein & Stapler-Terminal

#### 🟨 Teilweise umgesetzt

Der Smart Inventory Manager wurde um eine erste WMS-Logik für Transportaufträge erweitert. Ziel dieses Moduls ist eine zentrale Lagerleitlogik, die Transportaufträge automatisch erstellt, Quell- und Zielplätze vorgibt und später direkt mit Stapler-Terminals kommunizieren kann.

Bereits umgesetzt:

- automatische Erstellung eines Transportauftrags (TA) aus einer Warenausgangsanforderung
- automatische Erstellung einer Transportschein-Nummer (TS)
- automatische Ermittlung eines geeigneten Entnahmeplatzes auf Basis vorhandener Lagerplatzbestände
- API-Endpunkte für aktive Transportaufträge
- Scan-Logik für Quell- und Zielplatz
- Statusführung von `CREATED` über `IN_TRANSIT` bis `COMPLETED`
- Fehlerschutz bei falschem Quell- oder Zielscan
- automatische Bestandsumbuchung vom Quellplatz auf den Zielplatz beim Abschluss
- automatische OUT- und IN-Lagerbewegung mit TA-Referenz

#### 🔜 Nächster Ausbau

- eigenes Stapler-Terminal im Frontend
- dauerhaft aktives Ein-Scan-Feld
- Anzeige von aktuellem TA/TS, Produkt, Menge, Quelle und Ziel
- akustische Warnung bei falschem Scan
- spätere Erweiterung für Palette / NVE / SSCC
- direkte Zuweisung von Transportaufträgen an Stapler oder Benutzer