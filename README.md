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

### 🚜 Geplantes WMS-/Lagerleitsystem: Transportauftrag, Transportschein & Stapler-Terminal

Dieses Modul soll den nächsten professionellen Ausbauschritt des Smart Inventory Managers abbilden. Ziel ist nicht nur ein einfaches Scan-Feld, sondern eine zentrale WMS-Logik, die Transportaufträge automatisch erzeugt und direkt an Stapler-Terminals übergibt.

#### Geplanter Ablauf

Sobald am Warenausgang ein Auftrag gestartet wird oder Produkte angefordert werden, erstellt das System automatisch einen Transportauftrag.

Der Ablauf soll folgendermaßen funktionieren:

1. **Automatische TA-Erstellung**  
   Das System erstellt einen Transportauftrag und ermittelt anhand der vorhandenen Bestände, Lagerplätze und Auslagerungsstrategien den optimalen Entnahmeplatz.

2. **Automatische TS-Erstellung**  
   Aus dem Transportauftrag wird ein Transportschein erzeugt. Dieser wird dem zuständigen Stapler-Terminal angezeigt.

3. **Stapler-Terminal mit Ein-Scan-Feld-Logik**  
   Das Stapler-Terminal besitzt nur ein dauerhaft aktives Scan-Feld. Der Fahrer muss keinen Cursor manuell setzen und keine unterschiedlichen Felder auswählen.

4. **Automatische Scan-Erkennung**  
   Das System erkennt anhand von Präfixen, QR-Inhalten oder Längen automatisch, was gescannt wurde:

   - Produkt
   - Lagerort
   - Quellplatz
   - Zielplatz
   - Palette / NVE / SSCC

5. **Quell-Bestätigung**  
   Der erste gültige Scan bestätigt die Aufnahme der Ware am Entnahmeplatz. Der TA wechselt in den Status „Ware aufgenommen“ oder „in Transport“.

6. **Ziel-Bestätigung**  
   Der zweite gültige Scan bestätigt die Abstellung am Ziel- oder Bereitstellungsplatz. Der TA wird automatisch abgeschlossen und der Bestand wird umgebucht.

7. **Fehlerschutz**  
   Falsche Scans werden sofort blockiert. Das Terminal zeigt eine Fehlermeldung und gibt eine akustische Warnung aus.

#### Ziel des Moduls

Das Modul soll zeigen, wie der Smart Inventory Manager zu einem echten Lagerleitsystem erweitert werden kann:

- automatische Transportaufträge
- automatische Quell- und Zielermittlung
- direkte Staplerführung
- Ein-Scan-Feld-Bedienung
- Plausibilitätsprüfung gegen falsche Plätze
- automatische Statusführung
- automatische Bestandsbuchung nach erfolgreichem Transport

