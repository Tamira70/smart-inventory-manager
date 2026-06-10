# 📦 Smart Inventory Manager

<!-- portfolio-summary:start -->

## Portfolio-Zusammenfassung

Der **Smart Inventory Manager** ist eine selbst entwickelte Full-Stack-Webanwendung zur digitalen Lagerverwaltung mit Fokus auf Lagerplatzlogik, Bestandsführung und WMS-/ERP-nahe Prozesse.

Das Projekt bildet typische Abläufe aus Lager, Materialwirtschaft und Logistik-IT ab: Produktstammdaten, Lagerorte, Wareneingang, Warenausgang, Lagerplatzbestände, Bewegungshistorie, Verpackungen, Ladungsträger, Kapazitätsprüfung sowie rollenbasierte Zugriffsrechte.

Ein besonderer Schwerpunkt liegt auf praxisnahen Ein- und Auslagerstrategien:

- **Festplatzstrategie** zur gezielten Einlagerung auf definierte Lagerplätze
- **Freiplatz-/Leerplatzlogik** zur Auswahl geeigneter Lagerplätze
- **Zulagerung** zu bestehenden Produktbeständen
- **FIFO** und **LIFO** für zeitbasierte Auslagerung
- **FEFO** mit MHD-/Ablaufdatum für chargennahe Warenflüsse
- **HIFO** und **LOFO** auf Basis von Einstandspreisen

Zusätzlich prüft das System Lagerplatzkapazitäten anhand von Volumen, Gewicht, Verpackungsdaten und Ladungsträgern. Lagerplatzbestände werden separat geführt und nach Wareneingang sowie Warenausgang automatisch aktualisiert. Der Status eines Lagerplatzes wird automatisch zwischen **Frei** und **Belegt** synchronisiert.

Das Projekt zeigt praktische Kenntnisse in:

- Django REST Framework
- React mit TypeScript
- REST-API-Design
- Datenmodellierung für Lager- und Bestandsprozesse
- rollenbasierter Zugriffsteuerung
- Prozesslogik für WMS-/ERP-Schnittstellen
- Deployment auf Linux-Server mit Gunicorn und Apache

Der Smart Inventory Manager ist damit ein praxisnahes Portfolio-Projekt für Tätigkeiten im Bereich **ERP-/SAP-Support, Application Support, Lager-IT, WMS-Key-User, Digitalisierung und Prozessoptimierung in der Logistik**.

<!-- portfolio-summary:end -->
Praxisnahe Fullstack-Lagerverwaltung zur Abbildung realer Logistik-, Einkaufs-, Dispositions-, Kundenstamm- und Inventurprozesse.

Der **Smart Inventory Manager** wurde mit **Django REST Framework** im Backend und **React + TypeScript** im Frontend entwickelt.  
Das Projekt bildet typische Abläufe aus Lager, Einkauf, Dispo, Kundenstamm und Administration in einer ERP-ähnlichen Webanwendung ab.

---

## 🚀 Aktueller Stand: Smart Inventory Manager v2

Version 2 erweitert das Projekt um eine professionelle Modulstruktur mit Sidebar-Navigation, Rollenmodell, Lagerortverwaltung, Lieferantenverwaltung, Kundenstamm, Admin-Bereich, Systemprotokoll und erweitertem Inventurmodus.

### Enthaltene Module

- 📊 Dashboard
- 🛒 Einkauf
- 🚚 Lieferanten
- 📋 Dispo
- 🏭 Lager
- 📍 Lagerorte
- 🔧 Lagerkorrekturen
- 🧾 Inventur
- 👥 Kundenstamm
- ☎️ Ansprechpartner
- 📦 Lieferadressen
- 📝 Kundennotizen
- 👤 Benutzerverwaltung
- 🔐 Rollen & Zugriffsrechte
- 🧾 Systemprotokoll

---

## 🧩 Projektübersicht

Der **Smart Inventory Manager** ist eine webbasierte Lager- und Prozessanwendung zur Verwaltung von Produkten, Beständen, Lagerorten, Warenbewegungen, Inventuren, Lieferanten, Kundenstammdaten und Benutzerrollen.

Die Anwendung orientiert sich an realen Abläufen aus Logistik und Lagerverwaltung:

- Artikel und Bestände verwalten
- Lagerorte zuordnen
- Mindestbestände überwachen
- Nachbestellvorschläge erzeugen
- Wareneingänge buchen
- Warenausgänge buchen
- Lagerkorrekturen mit Begründung buchen
- Bewegungen nachvollziehen
- Inventuren durchführen
- Soll-/Ist-Abweichungen erkennen
- Korrekturbuchungen erzeugen
- Lieferanten pflegen
- Kundenstamm verwalten
- Benutzer und Rollen steuern
- Admin-Aktionen im Systemprotokoll nachvollziehen

---

## 🔐 Demo-Zugänge

> Hinweis: Die folgenden Zugänge sind für lokale Tests beziehungsweise Demo-Umgebungen gedacht.  
> In produktiven Umgebungen sollten Passwörter individuell gesetzt werden.

### 🔍 Recruiter / Viewer

```text
Benutzername: recruiter
Passwort: demo123456
Rolle: Viewer
Rechte: Alles ansehen, nichts bearbeiten
```

### 📦 Lager

```text
Benutzername: lager-demo
Passwort: demo123456
Rolle: Lager
Rechte: Wareneingang, Warenausgang, Lagerorte, Lagerkorrekturen und Bewegungshistorie
```

### 🛒 Einkauf

```text
Benutzername: einkauf-demo
Passwort: demo123456
Rolle: Einkauf
Rechte: Einkauf, Lieferanten, Kundenstamm und Lagerkorrekturen lesend
```

### 📋 Dispo

```text
Benutzername: dispo-demo
Passwort: demo123456
Rolle: Dispo
Rechte: Dispo, Bestände, Mindestbestände, Nachbestellvorschläge und Inventuransicht
```

### ⚙️ Admin

```text
Benutzername: tamira
Passwort: lokal gesetzt
Rolle: Admin
Rechte: Vollzugriff
```

---

## 🔐 Rollenmodell

| Rolle | Zugriff |
|---|---|
| Admin | Voller Zugriff auf alle Module, Benutzer, Rollen und Systemprotokoll |
| Lager | Wareneingang, Warenausgang, Lagerorte, Lagerkorrekturen, Bewegungshistorie |
| Einkauf | Einkauf, Lieferanten, Kundenstamm, Lagerkorrekturen lesend |
| Dispo | Dispo, Bestände, Mindestbestände, Nachbestellvorschläge, Inventuransicht |
| Viewer / Recruiter | Alle Bereiche ansehen, keine Schreib- oder Buchungsrechte |

---

## 🚀 Features

### 📊 Dashboard

- Produkte gesamt
- Bestand gesamt
- Niedriger Bestand
- Inventur-Differenzen
- Wareneingänge heute
- Warenausgänge heute
- Letzte Lagerbewegung

---

### 📦 Produktverwaltung / Artikelstamm

- Produkte anlegen und bearbeiten
- SKU / Artikelnummer
- Beschreibung
- Bestand
- Einheit
- Mindestbestand
- Lagerort-Zuordnung
- Automatische Markierung bei niedrigem Bestand

---

### 📍 Lagerorte

- Lagerorte anlegen
- Lagerort-Code
- Zone
- Gang
- Regal
- Fach
- Aktiv / Inaktiv
- Produktanzahl je Lagerort
- Lagerortauswahl im Artikelstamm
- Leserechte für alle eingeloggten Rollen
- Schreibrechte für Admin

Beispiel:

```text
A-R2-F4
Lager A / Zone A / Regal 2 / Fach 4
```

---

### 📥 Wareneingang

- Produkt auswählen
- Menge buchen
- Referenznummer / Lieferschein erfassen
- Notiz erfassen
- Bestand wird automatisch erhöht
- Benutzer wird gespeichert

---

### 📤 Warenausgang

- Produkt auswählen
- Menge buchen
- Referenznummer erfassen
- Notiz erfassen
- Bestand wird automatisch reduziert
- Validierung gegen negativen Bestand
- Benutzer wird gespeichert

---

### 🔧 Lagerkorrekturen

- Produkt auswählen
- Zielbestand eintragen
- Differenz wird automatisch berechnet
- Korrektur wird als Wareneingang oder Warenausgang gebucht
- Begründung wird gespeichert
- Korrekturen bleiben in der Bewegungshistorie nachvollziehbar
- Admin und Lager dürfen buchen
- Einkauf darf Lagerkorrekturen lesend ansehen

---

### 🕓 Bewegungshistorie

- Vollständige Historie aller Lagerbewegungen
- Wareneingang / Warenausgang unterscheidbar
- Benutzer wird gespeichert
- Datum und Uhrzeit der Buchung
- Suche und Filter
- CSV-Export
- Rückgängig-Funktion für die letzte Bewegung

---

### 🧾 Inventur-Modus

- Inventur-Runde starten
- Produkt zur Inventur auswählen
- Soll-Bestand wird automatisch gespeichert
- Ist-Bestand / gezählte Menge eintragen
- Differenz wird automatisch berechnet
- Korrekturbuchung aus Inventur-Differenz erzeugen
- Bewegungshistorie wird automatisch ergänzt
- Inventur abschließen
- Excel-Bericht exportieren
- Inventurpositionen im Django Admin sichtbar

---

### 🛒 Einkauf & Nachbestellvorschläge

- Mindestbestände auswerten
- Nachbestellvorschläge erzeugen
- Bestellentwürfe vorbereiten
- Bestellungen freigeben
- Bestellstatus anzeigen
- Einkauf-Demo-Rolle für Einkaufsprozesse

---

### 🚚 Lieferanten

- Lieferanten anlegen
- Lieferantennummer
- Ansprechpartner
- E-Mail
- Telefon
- Adresse
- Aktiv / Inaktiv
- Einkauf und Admin dürfen Lieferanten pflegen
- Viewer darf Lieferanten nur ansehen

---

### 👥 Kundenstamm

Der Kundenstamm besteht aus vier Modulen:

#### 👥 Kundenliste

- Kunden anlegen
- Kundennummer
- E-Mail
- Telefon
- Adresse
- Aktiv / Inaktiv
- Anzahl Ansprechpartner
- Anzahl Lieferadressen
- Anzahl Kundennotizen

#### ☎️ Ansprechpartner

- Ansprechpartner je Kunde
- Vorname / Nachname
- Rolle / Funktion
- E-Mail
- Telefon
- Mobilnummer
- Hauptkontakt
- Aktiv / Inaktiv

#### 📦 Lieferadressen

- Abweichende Lieferadressen je Kunde
- Empfängername
- Straße
- PLZ
- Ort
- Land
- Standardadresse
- Aktiv / Inaktiv

#### 📝 Kundennotizen

- Interne Kundennotizen
- Titel
- Notiztext
- Ersteller
- Datum

---

### 👤 Benutzerverwaltung

- Benutzer über Frontend anlegen
- Benutzername
- Startpasswort
- E-Mail
- Vorname
- Nachname
- Rolle beim Anlegen auswählen
- Aktiv / Inaktiv beim Anlegen setzen
- Bestehende Benutzer aktivieren oder deaktivieren

---

### 🔐 Rollen & Zugriffsrechte

- Rollenübersicht
- Benutzer je Rolle anzeigen
- Rolle bestehender Benutzer ändern
- Rechte-Struktur transparent anzeigen
- Aktiv/Inaktiv wird separat in der Benutzerverwaltung gepflegt

---

### 🧾 Systemprotokoll

- Admin-Aktionen nachvollziehen
- Benutzeranlage protokollieren
- Rollenänderungen protokollieren
- Zeitstempel
- ausführender Benutzer
- Objektbezug

---

## 🛠️ Technologien

### Frontend

| Technologie | Einsatz |
|---|---|
| React | Benutzeroberfläche |
| TypeScript | Typisierte Frontend-Entwicklung |
| Vite | Entwicklungs- und Build-Tool |
| CSS-in-JS / Inline Styles | UI-Struktur und responsives Layout |

### Backend

| Technologie | Einsatz |
|---|---|
| Python | Backend-Programmiersprache |
| Django | Webframework |
| Django REST Framework | REST API |
| SimpleJWT | JWT Authentifizierung |
| SQLite | lokale Datenbank aktuell |
| openpyxl | Excel-Export für Inventurberichte |

### Infrastruktur

| Technologie | Einsatz |
|---|---|
| Linux Server | Self-hosted Deployment |
| Apache | Reverse Proxy und Frontend-Auslieferung |
| Gunicorn | Django Application Server |
| systemd | Backend-Service |
| HTTPS | Sichere Verbindung über Domain |
| Proxmox | Virtualisierte Infrastruktur |

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

## 🔗 API-Endpunkte

### Authentifizierung

| Methode | Endpoint | Beschreibung |
|---|---|---|
| POST | `/api/login/` | JWT Login |
| POST | `/api/token/refresh/` | Access Token erneuern |

### Produkte & Lager

| Methode | Endpoint | Beschreibung |
|---|---|---|
| GET | `/api/products/` | Produkte abrufen |
| POST | `/api/products/` | Produkt anlegen |
| PUT/PATCH | `/api/products/<id>/` | Produkt bearbeiten |
| GET | `/api/storage-locations/` | Lagerorte abrufen |
| POST | `/api/storage-locations/` | Lagerort anlegen |
| GET | `/api/stock-movements/` | Bewegungen abrufen |
| POST | `/api/stock-movements/` | Wareneingang / Warenausgang / Korrektur buchen |

### Inventur

| Methode | Endpoint | Beschreibung |
|---|---|---|
| GET | `/api/inventory-sessions/` | Inventur-Runden abrufen |
| POST | `/api/inventory-sessions/` | Inventur-Runde erstellen |
| POST | `/api/inventory-sessions/<id>/complete/` | Inventur abschließen |
| GET | `/api/inventory-sessions/<id>/export-excel/` | Inventurbericht exportieren |
| GET | `/api/inventory-counts/` | Inventurpositionen abrufen |
| POST | `/api/inventory-counts/` | Inventurposition speichern |
| POST | `/api/inventory-counts/<id>/apply-correction/` | Korrekturbuchung erzeugen |

### Einkauf

| Methode | Endpoint | Beschreibung |
|---|---|---|
| GET | `/api/suppliers/` | Lieferanten abrufen |
| POST | `/api/suppliers/` | Lieferant anlegen |

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

### Admin

| Methode | Endpoint | Beschreibung |
|---|---|---|
| GET | `/api/admin-users/` | Benutzer abrufen |
| POST | `/api/admin-users/` | Benutzer anlegen |
| PATCH | `/api/admin-users/<id>/` | Benutzerrolle oder Status ändern |
| GET | `/api/audit-logs/` | Systemprotokoll abrufen |

---

## 📸 Screenshots

Lege Screenshots im Ordner `screenshots/` ab.

### 🔐 Login

![Login](screenshots/login.png)

### 📊 Dashboard

![Dashboard](screenshots/dashboard.png)

### 📋 Produkte

![Produkte](screenshots/products.png)

### 📥 Wareneingang

![Wareneingang](screenshots/goods-in-WE.png)

### 📤 Warenausgang

![Warenausgang](screenshots/goods-in-WA.png)

### 🕓 Bewegungshistorie

![Bewegungshistorie](screenshots/history.png)

### 🧾 Inventur-Modus

![Inventur-Modus](screenshots/inventory-mode.png)

### 📍 Lagerorte

![Lagerorte](screenshots/storage-locations.png)

### 🚚 Lieferanten

![Lieferanten](screenshots/suppliers.png)

### 👥 Kundenstamm

![Kundenstamm](screenshots/customers.png)

### 🔐 Rollen & Rechte

![Rollen und Rechte](screenshots/roles.png)


---

## 💻 Installation lokal

### 1. Repository klonen

```bash
git clone https://github.com/Tamira70/smart-inventory-manager.git
cd smart-inventory-manager
```

---

## 🐍 Backend einrichten

Virtuelle Umgebung erstellen:

```bash
python3 -m venv venv
source venv/bin/activate
```

Abhängigkeiten installieren:

```bash
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Datenbank vorbereiten:

```bash
python manage.py migrate
```

Admin-User erstellen:

```bash
python manage.py createsuperuser
```

Backend starten:

```bash
python manage.py runserver
```

Backend läuft unter:

```text
http://127.0.0.1:8000/
```

Django Admin:

```text
http://127.0.0.1:8000/admin/
```

---

## ⚛️ Frontend einrichten

In einem zweiten Terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend läuft unter:

```text
http://localhost:5173/inventory/
```

---

## ⚙️ Lokaler Vite Proxy

Für die lokale Entwicklung wird `/inventory-api/` an das Django Backend weitergeleitet.

Beispiel `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/inventory/",
  server: {
    proxy: {
      "/inventory-api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/inventory-api/, "/api"),
      },
    },
  },
});
```

---

## 🚀 Deployment

### Frontend

Produktionsbuild erstellen:

```bash
cd frontend
npm run build
```

Build-Dateien werden auf dem Server ausgeliefert über:

```text
/var/www/html/inventory/
```

### Backend

Backend liegt auf dem Server unter:

```text
/opt/smart-inventory-manager/
```

Gunicorn läuft als systemd-Service:

```text
smart-inventory.service
```

### Apache Reverse Proxy

Apache leitet API-Anfragen weiter:

```apache
ProxyPass /inventory-api/ http://127.0.0.1:8001/api/
ProxyPassReverse /inventory-api/ http://127.0.0.1:8001/api/
```

---

## 🧪 Beispielprozess: Inventur

```text
1. Inventur starten
2. Produkt auswählen
3. Systembestand wird als Soll-Bestand gespeichert
4. Gezählt wird z. B. 4 kg statt 6 kg
5. Differenz = -2 kg
6. Korrekturbuchung erzeugt automatisch Warenausgang
7. Produktbestand wird aktualisiert
8. Bewegungshistorie erhält Inventur-Korrektur
9. Inventurbericht wird als Excel-Datei exportiert
```

---

## 🧪 Beispielprozess: Lagerkorrektur

```text
1. Produkt auswählen
2. Neuen Zielbestand erfassen
3. Begründung eintragen
4. Differenz wird berechnet
5. System erzeugt automatisch IN- oder OUT-Bewegung
6. Bewegung bleibt historisch nachvollziehbar
```

---

## 🎯 Projektziel

Dieses Projekt demonstriert:

- Fullstack-Webentwicklung mit Django und React
- REST API Design
- JWT Authentifizierung
- Rollen- und Berechtigungskonzept
- Digitalisierung realer Logistikprozesse
- Wareneingang und Warenausgang
- Bewegungshistorie
- Inventur mit Soll-/Ist-Vergleich
- Automatische Korrekturbuchungen
- Lagerortverwaltung
- Lieferantenverwaltung
- Kundenstammverwaltung
- Admin-Benutzerverwaltung
- Deployment auf eigener Linux-Infrastruktur
- Verbindung von Logistikpraxis und IT-Umsetzung

---

## 🧠 Roadmap und Umsetzungsstand

### ✅ Bereits umgesetzt

- 📦 Verpackungsarten und Packmittel  
  Verpackungen und Ladungsträger sind als eigene Stammdaten umgesetzt, inklusive Kategorie, Maße, Gewicht und Kosten.

- 📍 Erweiterte Lagerplatz-Kapazitätsprüfung  
  Lagerplätze berücksichtigen Maße, Volumen und Maximalgewicht. Die Kapazitätsprüfung bezieht Produktgewicht, Verpackung und Ladungsträger ein.

- 🔁 FIFO / LIFO / FEFO-Auslagerungslogik  
  FIFO, LIFO und FEFO sind technisch umgesetzt. FEFO nutzt MHD- beziehungsweise Ablaufdaten.

- 💰 HIFO / LOFO-Auslagerungslogik  
  Zusätzlich wurden HIFO und LOFO auf Basis von Einstandspreisen pro Lagerplatzbestand umgesetzt.

- 📦 Lagerplatzbestand je Lagerort  
  Bestände werden lagerplatzgenau geführt und nach Wareneingang sowie Warenausgang automatisch aktualisiert.

- 🟩 Frei-/Belegt-Status für Lagerplätze  
  Der Lagerplatzstatus wird anhand echter Lagerplatzbestände automatisch synchronisiert.

- 📤 Excel-Export für Inventurberichte und Bewegungshistorie  
  Inventurberichte und Lagerbewegungen können exportiert werden.

### 🟨 Teilweise umgesetzt / nächster Ausbau

- 📊 Dashboard mit erweiterten Diagrammen  
  Die Dashboard-Grundlage ist vorhanden. Erweiterte Diagramme und Auswertungen sind als nächster Ausbau geplant.

- 📤 Weitere Excel-Exporte für Bestände und Lagerplatzbestände  
  Bestehende Exporte sind vorhanden, zusätzliche Bestands- und Lagerplatzbestands-Exporte sollen ergänzt werden.

- 🛒 Bestellwesen mit Lieferantenverknüpfung  
  Lieferantenverwaltung und Einkaufsbereich sind vorhanden. Ein vollständiges Bestellwesen mit Bestellungen, Bestellpositionen und Wareneingang aus Bestellung ist noch auszubauen.

### 🟥 Noch geplant

- 📄 PDF-Export für Inventurberichte
- 🐘 Migration auf PostgreSQL
- 📱 QR-Code- / Barcode-Funktion

---

## 👩‍💻 Autorin

**Tamira Morgner**  
SAP Key User | Logistik | IT | Webentwicklung

GitHub: [Tamira70](https://github.com/Tamira70)

---

## 📜 Lizenz

Dieses Projekt dient als Portfolio-Projekt.
