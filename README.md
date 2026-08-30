# 📦 Smart Inventory Manager

## Portfolio-Zusammenfassung

Der **Smart Inventory Manager** ist eine selbst entwickelte Full-Stack-Webanwendung zur digitalen Lagerverwaltung mit Fokus auf Lagerplatzlogik, Bestandsführung und WMS-/ERP-nahe Prozesse.

Das Projekt bildet praxisnahe Abläufe aus Lager, Materialwirtschaft und Logistik-IT ab:

```text
Wareneingang
→ WE-Fläche
→ Lagerplatzbestand
→ Versandauftrag / Kundenauftrag
→ Versandposition
→ Transportauftrag zur WA-Fläche
→ Stapler-Terminal mit Quelle-/Ziel-Scan
→ Bestand auf WA-Fläche
→ Versandabschluss
→ Versandauftrag wird als versendet markiert
→ Bewegungshistorie / Dashboard / Auswertung
```

Das Projekt zeigt meine Verbindung aus operativer Logistikpraxis, SAP-/ERP-Verständnis, Prozessdenken und technischer Umsetzung.

---

## ✅ Aktueller Stand

Der Smart Inventory Manager unterstützt inzwischen einen vollständigen WMS-nahen Lagerprozess:

- Produkt- und Artikelstammdaten
- Lagerorte mit Zone, Gang, Regal und Fach
- Wareneingang über WE-Flächen
- Lagerplatzbestände je Lagerort
- Verpackungen, Ladungsträger und Packmengen
- Kapazitätsprüfung über Maße, Volumen und Gewicht
- Ein- und Auslagerstrategien
- Transportaufträge und Transportscheine
- Stapler-Terminal mit Quelle-/Ziel-Scan
- Warenausgang über WA-Flächen
- finaler Versandabschluss von WA-Flächen
- Versandauftrag / Kundenauftrag mit Positionen
- automatischer Transportauftrag aus Versandposition
- Status-Workflow bis „Versendet“
- Bewegungshistorie
- Transport-Dashboard
- Excel-Export
- Rollen- und Rechtekonzept
- JWT-Authentifizierung
- automatisierte Backend-Tests für kritische Prozesse

---

## 🧠 Fachlicher Schwerpunkt

Ein besonderer Schwerpunkt liegt auf praxisnaher Lager- und WMS-Logik.

Umgesetzt sind unter anderem:

- **Festplatzstrategie** zur gezielten Einlagerung auf definierte Lagerplätze
- **Freiplatz-/Leerplatzlogik** zur Auswahl geeigneter Lagerplätze
- **Zulagerung** zu bestehenden Produktbeständen
- **FIFO** und **LIFO** für zeitbasierte Auslagerung
- **FEFO** mit MHD-/Ablaufdatum für chargennahe Warenflüsse
- **HIFO** und **LOFO** auf Basis von Einstandspreisen
- automatische Frei-/Belegt-Synchronisierung von Lagerplätzen
- Bestandsführung auf Lagerplatzebene
- automatische Statusführung bei Versandaufträgen

---

## 🚚 WMS-/Outbound-Prozess

Der aktuelle WMS-Prozess verbindet Lagerbewegungen, Transportaufträge, Staplerführung und Versandabschluss.

```text
1. Wareneingang buchen
2. Bestand wird auf einem Lagerplatz geführt
3. Versandauftrag / Kundenauftrag anlegen
4. Versandposition mit Produkt und Menge erfassen
5. Transportauftrag zur WA-Fläche erzeugen
6. Stapler-Terminal öffnet den Auftrag
7. Quellplatz scannen
8. Zielplatz / WA-Fläche scannen
9. Bestand wird automatisch zur WA-Fläche umgebucht
10. Versandabschluss bucht Ware final aus
11. Versandauftrag wird als versendet markiert
12. Bewegungshistorie dokumentiert den Vorgang
```

---

## 📦 Versandauftrag / Kundenauftrag Workflow

Der Smart Inventory Manager unterstützt einen kundenauftragsnahen Warenausgang.

### Ablauf

```text
Versandauftrag / Kundenauftrag
→ Versandposition
→ Transportauftrag zur WA-Fläche
→ Stapler-Terminal
→ Quelle-/Ziel-Scan
→ Bestand auf WA-Fläche
→ Versandabschluss
→ finale Bestandsausbuchung
→ Status „Versendet“
```

### Umgesetzte Funktionen

- Versandauftrag mit Kunde, Referenz, Lieferadresse und gewünschtem Versanddatum
- Versandposition mit Produkt und Menge
- automatische Erstellung eines Transportauftrags aus einer Versandposition
- automatische Auswahl eines geeigneten Entnahmeplatzes
- Ziel ist eine aktive WA-Fläche
- Schutz vor doppelten Transportaufträgen je Versandposition
- Statuswechsel des Versandauftrags in Richtung Kommissionierung
- Statusaktualisierung auf „Versandbereit“
- Markierung als „Versendet“
- Frontend-Bereich „Versandaufträge“ unter Lager
- automatische Tests für den kompletten Outbound-Workflow

---

## 🏭 Lagerfunktionen

### Wareneingang

- Produkt auswählen
- Menge buchen
- WE-Fläche auswählen
- Verpackung und Ladungsträger erfassen
- Packmenge erfassen
- Einstandspreis und MHD erfassen
- Referenznummer / Lieferschein erfassen
- Lagerplatzvorschlag anzeigen
- Bestand automatisch erhöhen
- Lagerplatzbestand aktualisieren

### Warenausgang

- Produkt auswählen
- Menge buchen
- Quell-Lagerplatz auswählen
- WA-Fläche als Ziel auswählen
- Transportauftrag zur WA-Fläche erstellen
- Versandabschluss von WA-Fläche buchen
- Bestand automatisch reduzieren
- Bewegungshistorie aktualisieren

### Stapler-Terminal

- offene Transportaufträge anzeigen
- Auftrag übernehmen
- Quellplatz scannen
- Zielplatz scannen
- falsche Scans blockieren
- Transportauftrag abschließen
- Bestand automatisch umbuchen

### Lagerplatzbestand

- Bestand je Lagerplatz
- Produkt
- SKU
- Menge
- Verpackung
- Ladungsträger
- Packmenge
- Einstandspreis
- MHD
- letzte Aktualisierung
- Excel-Export

---

## 📊 Dashboard und Auswertung

Das operative Lager-Cockpit zeigt:

- Artikelstamm
- Bestandseinheiten
- kritische Bestände
- Inventurabweichungen
- Wareneingänge heute
- Warenausgänge heute
- Top-Lagerplätze nach Bestand
- Bewegungsanalyse
- WE-/WA-Flächen
- Bestandsrisiken

Das Transport-Dashboard zeigt:

- Transportaufträge im Zeitraum
- offene Transportaufträge
- abgeschlossene Transportaufträge
- Fehler
- Transportarten
- TA je Benutzer
- aktivster Benutzer
- letzter Abschluss
- Excel-Export

---

## 🔐 Rollenmodell

| Rolle | Zugriff |
|---|---|
| Admin | Voller Zugriff auf alle Module, Benutzer, Rollen und Systemprotokoll |
| Lager | Wareneingang, Warenausgang, Versandaufträge, Stapler-Terminal, Lagerorte, Lagerkorrekturen, Bewegungshistorie |
| Einkauf | Einkauf, Lieferanten, Kundenstamm, Lagerkorrekturen lesend |
| Dispo | Dispo, Bestände, Mindestbestände, Nachbestellvorschläge, Inventuransicht |
| Viewer / Recruiter | Lesender Zugriff ohne Buchungsrechte |
| Stapler | Stapler-Terminal und Transportaufträge |

---

## 🧪 Automatische Tests

Für zentrale Prozesse gibt es Backend-Tests.

```bash
python manage.py test inventory.tests.WaShippingCompletionEndpointTests -v 2
python manage.py test inventory.tests.OutboundOrderWorkflowApiTests -v 2
python manage.py test inventory.tests.OutboundOrderStatusWorkflowTests -v 2
```

Gesamttest der wichtigsten WMS-/Outbound-Prozesse:

```bash
python manage.py test inventory.tests.WaShippingCompletionEndpointTests inventory.tests.OutboundOrderWorkflowApiTests inventory.tests.OutboundOrderStatusWorkflowTests -v 2
```

Abgedeckt werden unter anderem:

- Versandabschluss nur von WA-Flächen
- blockierter Versandabschluss von normalen Lagerplätzen
- Mengenprüfung beim Versandabschluss
- Rollenprüfung für Lager/Admin
- Versandauftrag per API anlegen
- Versandposition anlegen
- Transportauftrag aus Versandposition erzeugen
- doppelte Transportaufträge verhindern
- fehlenden Bestand ablehnen
- Status „Versandbereit“ nach abgeschlossenem Transport
- Markierung als „Versendet“
- Sperre gegen zu frühes „Versendet“

---

## 🔗 API-Auszug

### Authentifizierung

| Methode | Endpoint | Beschreibung |
|---|---|---|
| POST | `/api/login/` | JWT Login |
| POST | `/api/token/refresh/` | Access Token erneuern |

### Produkte und Lager

| Methode | Endpoint | Beschreibung |
|---|---|---|
| GET | `/api/products/` | Produkte abrufen |
| POST | `/api/products/` | Produkt anlegen |
| GET | `/api/storage-locations/` | Lagerorte abrufen |
| POST | `/api/storage-locations/` | Lagerort anlegen |
| GET | `/api/location-stocks/` | Lagerplatzbestände abrufen |
| GET | `/api/stock-movements/` | Bewegungen abrufen |
| POST | `/api/stock-movements/` | Wareneingang / Warenausgang / Korrektur buchen |

### Transport und WMS

| Methode | Endpoint | Beschreibung |
|---|---|---|
| GET | `/api/transport-orders/` | Transportaufträge abrufen |
| GET | `/api/transport-orders/active/` | aktive Transportaufträge abrufen |
| POST | `/api/transport-orders/create-from-outbound/` | TA aus Warenausgang erzeugen |
| POST | `/api/transport-orders/<id>/assign-to-me/` | TA übernehmen |
| POST | `/api/transport-orders/<id>/scan/` | Quell-/Zielscan verarbeiten |

### Versandabschluss

| Methode | Endpoint | Beschreibung |
|---|---|---|
| POST | `/api/location-stocks/<id>/complete-shipping/` | WA-Bestand final ausbuchen |

### Versandauftrag / Kundenauftrag

| Methode | Endpoint | Beschreibung |
|---|---|---|
| GET | `/api/outbound-orders/` | Versandaufträge abrufen |
| POST | `/api/outbound-orders/` | Versandauftrag anlegen |
| POST | `/api/outbound-orders/<id>/release/` | Versandauftrag freigeben |
| POST | `/api/outbound-orders/<id>/refresh-status/` | Status aktualisieren |
| POST | `/api/outbound-orders/<id>/mark-shipped/` | als versendet markieren |
| GET | `/api/outbound-order-items/` | Versandpositionen abrufen |
| POST | `/api/outbound-order-items/` | Versandposition anlegen |
| POST | `/api/outbound-order-items/<id>/create-transport-order/` | Transportauftrag aus Position erstellen |

### Kundenstamm

| Methode | Endpoint | Beschreibung |
|---|---|---|
| GET | `/api/customers/` | Kunden abrufen |
| POST | `/api/customers/` | Kunde anlegen |
| GET | `/api/customer-contacts/` | Ansprechpartner abrufen |
| POST | `/api/customer-contacts/` | Ansprechpartner anlegen |
| GET | `/api/delivery-addresses/` | Lieferadressen abrufen |
| POST | `/api/delivery-addresses/` | Lieferadresse anlegen |
| GET | `/api/customer-notes/` | Kundennotizen abrufen |
| POST | `/api/customer-notes/` | Kundennotiz anlegen |

---

## 🛠️ Technologien

### Frontend

| Technologie | Einsatz |
|---|---|
| React | Benutzeroberfläche |
| TypeScript | typisierte Frontend-Entwicklung |
| Vite | Entwicklungs- und Build-Tool |
| CSS-in-JS / Inline Styles | UI-Struktur und responsives Layout |

### Backend

| Technologie | Einsatz |
|---|---|
| Python | Backend-Programmiersprache |
| Django | Webframework |
| Django REST Framework | REST API |
| SimpleJWT | JWT-Authentifizierung |
| SQLite | lokale Entwicklungsdatenbank |
| openpyxl | Excel-Export |

### Infrastruktur

| Technologie | Einsatz |
|---|---|
| Linux Server | Self-hosted Deployment |
| Apache | Reverse Proxy und Frontend-Auslieferung |
| Gunicorn | Django Application Server |
| systemd | Backend-Service |
| HTTPS | sichere Verbindung über Domain |
| Proxmox | virtualisierte Infrastruktur |

---

## 🏗️ Architektur

```text
Browser
  ↓
React Frontend
  ↓
Vite Proxy lokal / Apache Reverse Proxy produktiv
  ↓
Django REST API
  ↓
SQLite Datenbank
```

Deployment-Struktur:

```text
Frontend Build:
    /var/www/html/inventory/

Backend:
    /opt/smart-inventory-manager/

Service:
    smart-inventory.service

API Proxy:
    /inventory-api/ → Django Backend /api/
```

---

## 💻 Lokale Entwicklung

Repository klonen:

```bash
git clone https://github.com/Tamira70/smart-inventory-manager.git
cd smart-inventory-manager
```

Backend einrichten:

```bash
python3 -m venv venv
source venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Frontend starten:

```bash
cd frontend
npm install
npm run dev
```

Frontend lokal:

```text
http://localhost:5173/inventory/
```

Django Admin lokal:

```text
http://127.0.0.1:8000/admin/
```

---

## 📸 Screenshots

Screenshots können im Ordner `screenshots/` abgelegt werden.

Empfohlene Screenshots für die Portfolio-Dokumentation:

- Dashboard / Lager-Cockpit
- Wareneingang
- Warenausgang
- Versandaufträge
- Stapler-Terminal
- Transport-Dashboard
- Bewegungshistorie
- Bestandsübersicht
- Kundenstamm
- Rollen & Rechte

---

## 🧠 Roadmap

### Bereits umgesetzt

- Dashboard mit Lagerkennzahlen
- Einkauf und Bestellwesen
- Lieferantenverwaltung
- Kundenstamm
- Lagerorte
- Lagerplatzbestände
- WE-/WA-Flächen
- Verpackungen und Ladungsträger
- Kapazitätsprüfung
- Auslagerungsstrategien FIFO, LIFO, FEFO, HIFO und LOFO
- Transportaufträge
- Stapler-Terminal
- Versandabschluss
- Versandauftrag / Kundenauftrag
- Outbound-Status-Workflow bis „Versendet“
- Bewegungshistorie
- Excel-Export
- Rollenmodell
- Systemprotokoll
- automatisierte Tests

### Noch geplant

- Migration von SQLite auf PostgreSQL
- weitere Barcode-/Scanner-Erkennung
- weitere Auswertungen für Transport- und Lagerkennzahlen
- mobile Optimierung für Scanner-/Staplergeräte

---

## 🎯 Projektziel

Dieses Projekt demonstriert:

- Full-Stack-Webentwicklung mit Django und React
- REST API Design
- JWT-Authentifizierung
- Rollen- und Berechtigungskonzept
- Digitalisierung realer Logistikprozesse
- WMS-nahe Lagerprozesse
- ERP-/SAP-nahes Prozessverständnis
- Transportaufträge und Staplerlogik
- Kundenauftragsnaher Warenausgang
- automatische Statusführung
- Bewegungshistorie und Auswertung
- Deployment auf eigener Linux-Infrastruktur
- Verbindung von Logistikpraxis und IT-Umsetzung

---

## 👩‍💻 Autorin

**Tamira Morgner**  
SAP Key User | Logistik | IT | Webentwicklung

GitHub: [Tamira70](https://github.com/Tamira70)

---

## 📜 Lizenz

Dieses Projekt dient als Portfolio-Projekt.
