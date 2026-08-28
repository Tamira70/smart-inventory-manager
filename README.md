Smart Inventory Manager

Praxisnahes WMS-/Lager-IT-Projekt mit Wareneingang, Lagerplatzverwaltung, Transportaufträgen, Warenausgangsflächen, Stapler-Terminal, Versandabschluss und Transport-Dashboard.

<!-- PORTFOLIO-INTRO-END -->

Projektüberblick

Der Smart Inventory Manager ist ein selbst entwickeltes Full-Stack-Projekt für digitale Lager- und WMS-Prozesse. Es bildet typische Abläufe aus der Logistik ab: Wareneingang, Lagerplatzsteuerung, interne Transportaufträge, scannergeführte Staplerprozesse, Warenausgangsflächen und eine nachvollziehbare Bestandsführung.

Das Projekt verbindet praktische Logistik-Erfahrung mit IT-naher Prozessoptimierung. Es zeigt, wie operative Lagerabläufe technisch strukturiert, digitalisiert und für Anwender übersichtlich bedienbar gemacht werden können.

Portfolio-Kernbotschaft

Der Smart Inventory Manager ist kein reines Übungsprojekt, sondern ein praxisnahes Beispiel für digitale Lagerprozesssteuerung. Besonders relevant ist das Projekt für Tätigkeiten in den Bereichen:

ERP-/SAP-Anwendungssupport

WMS-/Lager-IT

Application Support

Stammdaten- und Prozessmanagement

IT-nahe Logistikkoordination

Digitalisierung und Prozessoptimierung

Fachlicher Gesamtprozess

Der aktuelle Stand bildet einen vollständigen WMS-Demoablauf ab:

Wareneingang
→ WE-Fläche
→ Transportauftrag
→ Lagerplatz
→ Warenausgangsauftrag
→ WA-Fläche
→ Versandabschluss
→ finale Bestandsausbuchung

Damit kann ein kompletter Lagerprozess gezeigt werden:

Ware kommt im Wareneingang an.

Die Ware wird auf einer WE-Fläche erfasst.

Das System erzeugt einen Transportauftrag zur Einlagerung.

Das Stapler-Terminal führt den Transport per Quell-/Zielscan aus.

Aus dem Lagerbestand wird ein Warenausgangs-Transportauftrag zur WA-Fläche erzeugt.

Die Ware wird per Stapler-Terminal zur Bereitstellung bewegt.

Der Versandabschluss bucht den Bestand final aus.

Aktueller Funktionsumfang

Wareneingang

Erfassung von Wareneingängen

Nutzung von WE-Flächen als Zwischenziel

automatische oder manuelle Weiterleitung Richtung Lagerplatz

nachvollziehbare Bestandsbewegungen

Wareneingang aus Einkaufsbestellungen

Lagerplatzverwaltung

Lagerorte mit Codes, Zonen, Gang, Regal und Fach

Lagerplatztypen wie WE, Lagerplatz, WA, Prüfung und Sperrfläche

aktive und blockierte Lagerplätze

Anzeige von Beständen je Lagerplatz

Frei-/Belegt-Synchronisierung

Unterstützung für feste und freie Lagerplatzlogik

Kapazitätsprüfung nach Volumen und Gewicht

Verpackung, Ladungsträger und Strategien

Verpackungsarten und Ladungsträger

Packmengen

Einstandspreise für HIFO/LOFO

MHD/Ablaufdatum für FEFO

Auslagerstrategien FIFO, LIFO, FEFO, HIFO und LOFO

Transportaufträge

Transportaufträge von WE-Fläche zu Lagerplatz

Transportaufträge von Lagerplatz zu WA-Fläche

automatische TA-Nummer und TS-Nummer

Statuslogik: erstellt, zugewiesen, in Transport, abgeschlossen, storniert, Fehler

Benutzerzuweisung

Scanner-Workflow

Schutz vor doppelten offenen Transportaufträgen für denselben Bestand

Stapler-Terminal

reduzierte Oberfläche für Stapler-/Lagerrolle

Anzeige aktiver Transportaufträge

Quelle scannen

Ziel scannen

automatische Bestandsumbuchung beim Abschluss

klare Fehlermeldungen bei falschem Scan oder ungültigem Ablauf

Warenausgang

Erstellung von Transportaufträgen zur WA-Fläche

Zielauswahl nur über WA-/Bereitstellflächen

Anzeige bereitgestellter WA-Bestände

Versandabschluss direkt aus der WA-Fläche

finale Ausbuchung aus dem Bestand

Transport-Dashboard

Übersicht über Transportaufträge

Filter nach Zeitraum, Schicht, Benutzer, Status und Transportart

Kennzahlen zu offenen, laufenden, abgeschlossenen und fehlerhaften Transporten

Auswertung nach Benutzer

Anzeige letzter abgeschlossener Transporte

professioneller Excel-Export als .xlsx

Exporte

Excel-Export für Bewegungshistorie

Excel-Export für Inventurberichte

Excel-Export für Lagerplatzbestände

Excel-Export für Transport-Dashboard

Warenausgang und Versandabschluss

Der Warenausgang unterstützt einen vollständigen WMS-Ablauf:

Transportauftrag aus dem Lagerbestand erstellen

Ware per Stapler-Terminal vom Lagerplatz zur WA-Fläche bewegen

Bestand auf der WA-Fläche prüfen

Versand über den Button „Versand abschließen“ final ausbuchen

Der Versandabschluss läuft über einen eigenen Backend-Endpunkt:

POST /inventory-api/location-stocks/<id>/complete-shipping/

Der Endpunkt prüft:

Versand nur von WA-Flächen

ausreichenden Bestand auf der WA-Fläche

aktive und nicht gesperrte WA-Fläche

Berechtigung für Lager/Admin

Automatischer Testlauf:

python manage.py test inventory.tests.WaShippingCompletionEndpointTests -v 2

Abgesicherte Testfälle:

Lager/Admin darf Versand von WA-Bestand abschließen

normaler Lagerplatz wird für Versandabschluss blockiert

zu hohe Versandmenge wird abgelehnt

Viewer darf den Versandabschluss nicht durchführen

erfolgreicher Versand erzeugt eine OUT-Bewegung

WMS-Demo-Manager

Für eine saubere Vorführung des WMS-Prozesses gibt es einen eigenen Django-Management-Befehl:

python manage.py prepare_wms_demo

Der Befehl bereitet einen stabilen Demo-Zustand vor:

offene alte Demo-Transportaufträge stornieren

WA-Flächen sicherstellen

Demo-Bestand am Quelllagerplatz prüfen

optional fehlenden Demo-Bestand anlegen

frischen Transportauftrag für den Stapler-Test erzeugen

Vorabprüfung ohne Änderungen

python manage.py prepare_wms_demo --dry-run

Demo-Zustand vorbereiten

python manage.py prepare_wms_demo --ensure-stock

Standardmäßig wird folgender Demo-Ablauf vorbereitet:

Filament PAL Blau
A-R2-F4 → WA-0001
Menge: 1

Der vorbereitete Transportauftrag kann anschließend im Stapler-Terminal durchgescannt werden:

1. Quelle scannen: A-R2-F4
2. Ziel scannen: WA-0001
3. Transportauftrag wird abgeschlossen
4. Bestand liegt auf der WA-Fläche
5. Versandabschluss kann im Warenausgang durchgeführt werden

Nützliche Optionen:

python manage.py prepare_wms_demo --product-name "Filament PAL Blau"
python manage.py prepare_wms_demo --source-code A-R2-F4
python manage.py prepare_wms_demo --target-code WA-0001
python manage.py prepare_wms_demo --quantity 1
python manage.py prepare_wms_demo --skip-cancel-open
python manage.py prepare_wms_demo --skip-create-order

Technischer Aufbau

Bereich

Technologie

Backend

Django REST Framework

Frontend

React mit TypeScript

Authentifizierung

JWT

Datenbank

SQLite im aktuellen Projektstand

Exporte

openpyxl für Excel-Dateien

Serverbetrieb

Gunicorn und Apache Reverse Proxy

Deployment

eigener Linux-Server

Versionsverwaltung

Git und GitHub

Rollen und Berechtigungen

Rolle

Zweck

Admin

Verwaltung, Stammdaten, Benutzer, alle Funktionen

Lager

Wareneingang, Warenausgang, Lagerbewegungen, Versandabschluss

Stapler

reduzierte Scanner-Oberfläche für Transportaufträge

Einkauf

Einkaufs- und Bestellprozesse

Dispo

dispositive Übersicht und Prozesskontrolle

Viewer

Lesender Zugriff

Lokale Entwicklung

Backend starten:

cd "$HOME/Dokumente/web app/smart-inventory-manager"
source "/home/tamira/Dokumente/web app/smart-inventory-manager/venv/bin/activate"
python manage.py runserver

Frontend starten:

cd "$HOME/Dokumente/web app/smart-inventory-manager/frontend"
npm run dev

Lokale Anwendung öffnen:

http://localhost:5173/inventory/

Qualitätssicherung

Django-Systemcheck:

python manage.py check

Tests für den WA-Versandabschluss:

python manage.py test inventory.tests.WaShippingCompletionEndpointTests -v 2

Frontend-Build:

cd frontend
npm run build
cd ..

API-Auszug

Bereich

Endpunkt

Produkte

/inventory-api/products/

Lagerorte

/inventory-api/storage-locations/

Lagerplatzbestände

/inventory-api/location-stocks/

Lagerbewegungen

/inventory-api/stock-movements/

Transportaufträge

/inventory-api/transport-orders/

Aktive Transportaufträge

/inventory-api/transport-orders/active/

TA aus Warenausgang erzeugen

/inventory-api/transport-orders/create-from-outbound/

Versandabschluss

/inventory-api/location-stocks/<id>/complete-shipping/

Transport-Dashboard Excel

/inventory-api/transport-orders/export-excel/

Screenshots – Bestellprozess

Der Bestellprozess zeigt den Ablauf von der Einkaufsbestellung bis zur automatischen Lagerbewegung im Wareneingang.

Neue Bestellung

Status: Entwurf





Status: Freigegeben

Status: Geliefert





Wareneingang aus Bestellung

Automatische Lagerbewegung





Geplante nächste Ausbaustufen

Status „bereitgestellt“ für Ware auf WA-Flächen

Kundenauftrag / Kommissionierbedarf als Auslöser für Warenausgangs-Transportaufträge

Erweiterung für Palette, NVE oder SSCC

weitere Scanner-Optimierung für mobile Geräte

PostgreSQL-Vorbereitung für produktionsnähere Umgebung

zusätzliche automatische Tests für Transportauftrag-Scanlogik

Status

Der aktuelle Branch dient der Weiterentwicklung der Lager-IT- und WMS-Funktionen. Die wichtigsten Lagerplatz-, Transport-, Warenausgangs- und Versandabschlussprozesse sind lokal getestet und für eine Portfolio-Demonstration dokumentiert.