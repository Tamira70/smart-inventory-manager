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

### 🚜 WMS-/Lagerleitsystem: Wareneingangsflächen, Transportauftrag & Stapler-Terminal

#### 🟨 Teilweise umgesetzt

Der Smart Inventory Manager wurde um eine erste WMS-/Lagerleitlogik erweitert. Der Wareneingang wird nicht mehr direkt auf normale Lagerplätze gebucht, sondern zuerst auf definierte Wareneingangsflächen. Von dort erzeugt das System automatisch Transportaufträge für die weitere Einlagerung.

Bereits lokal umgesetzt:

- Lagerplatztypen für unterschiedliche Lagerbereiche:
  - `RECEIVING` = Wareneingangsfläche
  - `STORAGE` = regulärer Lagerplatz
  - `SHIPPING` = Warenausgang / Bereitstellung
  - `QUALITY` = Prüfung / Klärung
  - `BLOCKED` = Sperrfläche
- Wareneingangsflächen `WE-0001` bis `WE-0005`
- Wareneingang nur noch auf WE-Flächen
- Dashboard-Anzeige für freie und belegte WE-Flächen
- automatische Prüfung belegter WE-Flächen
- automatische TA-Erstellung, wenn Bestand auf einer WE-Fläche liegt und noch kein offener TA existiert
- Schutz vor doppelten Transportaufträgen für denselben WE-Bestand
- automatische Erstellung von TA-Nummer und TS-Nummer
- automatische Ermittlung eines geeigneten Ziel-Lagerplatzes
- Stapler-Terminal mit TA-Liste, aktuellem Auftrag und Ein-Scan-Feld
- Scan-Logik für Quellplatz und Zielplatz
- Bestandsumbuchung von WE-Fläche auf Lagerplatz beim Abschluss des Transportauftrags
- automatische OUT- und IN-Lagerbewegung mit TA-Referenz

#### 🔜 Nächster Ausbau

- Stapler-Terminal weiter optimieren
- akustische Warnung und visuelle Fehlerführung weiter ausbauen
- automatische 15-Minuten-Prüfung später als Hintergrunddienst oder Scheduler betreiben
- Warenausgangsflächen `WA-0001` bis `WA-0005`
- Transportaufträge vom Lagerplatz zur WA-/Bereitstellfläche
- Erweiterung für Palette / NVE / SSCC
- direkte Zuweisung von Transportaufträgen an Stapler oder Benutzer

### Warenausgangsflächen / WA-Prozess

Ergänzend zum Wareneingangsprozess wurden Warenausgangs- bzw. Bereitstellflächen vorbereitet.

Umgesetzt:

- Automatische Anlage von `WA-0001` bis `WA-0005` als Warenausgangs-/Bereitstellflächen
- Lagerplatztyp `SHIPPING` für WA-Flächen
- Neuer Command-Parameter: `python manage.py auto_create_transport_orders --create-shipping-areas`
- Optional mit `--shipping-count`
- STAPLER-TERMINAL nutzt beim Erstellen von Warenausgangs-Transportaufträgen nur noch WA-Flächen als Zielauswahl
- Getesteter Ablauf: `A-R2-F4 -> WA-0001`
- Quellplatzscan und Zielplatzscan erfolgreich getestet
- Bestand wurde erfolgreich auf `WA-0001` umgebucht

Damit ist neben dem Wareneingangsprozess auch ein Warenausgangsprozess vorbereitet:

Wareneingang:
WE-Fläche -> Lagerplatz

Warenausgang:
Lagerplatz -> WA-Fläche

Nächste mögliche Ausbaustufen:

- Automatische Erzeugung von Warenausgangs-Transportaufträgen aus Kundenauftrag / Kommissionierbedarf
- WA-Flächen im Dashboard gesondert anzeigen
- Status „bereitgestellt“ für Ware auf WA-Fläche
- Übergabe an Versand / Warenausgangsbuchung

### Aktueller WMS-Gesamtprozess

Der aktuelle Stand bildet einen vollständigen WMS-Demoablauf ab:

- Wareneingang: WE-Fläche -> Lagerplatz
- Warenausgang: Lagerplatz -> WA-Fläche
- Versandabschluss: WA-Fläche -> Bestand raus

Ergänzte Funktionen:

- WA-Flächen `WA-0001` bis `WA-0005` als `SHIPPING`
- Transportauftrag vom Lagerplatz zur WA-Fläche
- STAPLER-TERMINAL mit Quelle-/Ziel-Scan
- Versandabschluss direkt aus WA-Flächen
- Transport-Dashboard mit frei wählbarem Zeitraum
- Filter nach Schicht, Benutzer, Status und Transportart
- Auswertung: TA je Benutzer im Zeitraum
- Anzeige offener Transporte und letzter abgeschlossener Transport

Damit kann der komplette Ablauf gezeigt werden:

1. Ware kommt auf WE-Fläche an
2. Automatischer Transportauftrag bringt Ware ins Lager
3. Warenausgang erzeugt Transportauftrag zur WA-Fläche
4. Stapler bringt Ware zur Bereitstellung
5. Versandabschluss bucht die Ware final aus

### Transport-Dashboard Excel-Export

Das Transport-Dashboard wurde um einen Excel-Export erweitert.

Umgesetzt:

- Export der aktuell gefilterten Transportdaten
- Berücksichtigung von Zeitraum, Schicht, Benutzer, Status und Transportart
- Export von Kennzahlen wie:
  - TA im Zeitraum
  - offene TA
  - TA in Transport
  - abgeschlossene TA
  - Fehler
  - Erfüllungsquote
- Export von Transportdetails:
  - TA-Nummer
  - TS-Nummer
  - Status
  - Transportart
  - Produkt
  - Menge
  - Quelle
  - Ziel
  - Fahrer
  - Referenz
  - Zeitpunkt
  - Abschlusszeitpunkt

Die Excel-Datei (.xlsx) kann direkt mit LibreOffice Calc oder Microsoft Excel geöffnet werden.
