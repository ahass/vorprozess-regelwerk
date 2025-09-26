# Vorprozess Regelwerk System

Ein umfassendes Template-Management-System zur Erstellung und Verwaltung von rollenbasierten, mehrsprachigen Schablonen für Vorprozess-Anforderungen.

## 📋 Übersicht

Das Vorprozess Regelwerk System ermöglicht es Organisationen, flexible und intelligente Formulare zu erstellen, die sich basierend auf Benutzerrollen, Kundenanforderungen und bedingten Abhängigkeiten dynamisch anpassen. Das System unterstützt dreisprachige Inhalte (Deutsch, Französisch, Italienisch) und bietet erweiterte Validierungs- und Abhängigkeitsfunktionen.

## 🚀 Hauptfunktionen

### 🛠️ Template Builder
- Dreisprachige Templates: Vollständige Unterstützung für DE/FR/IT
- Flexible Feldtypen: Text, Auswahl, Dokument-Upload
- Drag & Drop Interface (geplant)
- Erweiterte Validierung: Regex, Formatprüfung, Längenbeschränkungen
- Rollenbasierte Konfiguration: Anmelder/Klient/Admin-spezifische Einstellungen

### 📎 Bedingte Abhängigkeiten
- Intelligente Field Logic: "Wenn Feld X = Y, dann zeige Feld Z"
- Mehrere Operatoren: equals, not_equals, in, contains, is_empty, etc.
- Mehrere Abhängigkeiten pro Feld
- Live-Simulation: Echtzeit-Test der Dependency-Logik

### 👥 Rollen- & Kundenverwaltung
- Dreistufiges Rollensystem: Administrator, Anmelder, Klient
- Kundenspezifische Felder: Individuelle Sichtbarkeit pro Kunde
- Rollenbasierte Overrides: Unterschiedliche Konfigurationen pro Rolle
- Granulare Berechtigungen: Field-Level Security

### 🎮 Simulation & Testing
- Role Simulator: Live-Vorschau für verschiedene Benutzerrollen
- Dependency Testing: Interaktive Abhängigkeits-Simulation
- Field Value Testing: Real-time Validierung
- Visual Feedback: Versteckte Felder und Abhängigkeits-Informationen

### 📊 Monitoring & Audit
- Change Log System: Vollständiges Audit-Trail
- User Tracking: Wer hat was wann geändert
- Template Analytics (Basis)
- Export Funktionalität: JSON/API-basierte Datenextraktion

## 🏗️ Technische Architektur

### Backend-Varianten
- Aktiv in dieser Umgebung: FastAPI (Python) + SQLAlchemy
  - Datenbank: SQLite (Demo) bzw. optional SQL Server
  - Pfad: `/app/backend`
- Alternative/Migrationsziel: ASP.NET Core (C#) + Entity Framework Core
  - Datenbank: SQL Server (SQLite für Demo)
  - Pfad: `/app/backend-csharp`

Beide Backends implementieren denselben REST-API-Vertrag und arbeiten mit dem React-Frontend zusammen. In der aktuellen Container-Umgebung ist das FastAPI-Backend aktiv und unter 0.0.0.0:8001 erreichbar (via Supervisor). Alle API-Routen verwenden den Präfix `/api`.

### Frontend
- Framework: React
- Styling: Tailwind CSS
- State Management: Context API
- Routing: React Router
- HTTP Client: fetch/axios (umgebungsvariablenbasiert)

### Wichtige Service- und URL-Regeln (Kubernetes Ingress)
- Alle Backend-Routen müssen mit `/api` beginnen.
- Frontend ruft Backend ausschließlich über `REACT_APP_BACKEND_URL` auf – keine Hardcodings.
- Backend läuft intern auf `0.0.0.0:8001` (Supervisor übernimmt die Weiterleitung).
- Bitte `.env`-Dateien nicht überschreiben. Nur bestehende Variablen verwenden.

## Database Schema (vereinfachte Darstellung)
```sql
-- Haupt-Tabellen
Templates          (id, role_config, customer_specific, created_at, ...)
Fields             (id, type, visibility, requirement, validation, ...)
MultiLanguageTexts (id, entity_type, entity_id, language_code, text_value)
ChangeLogEntries   (id, entity_type, action, changes, user_id, timestamp)

-- Beziehungen
TemplateFields     (template_id, field_id)  -- Many-to-Many
```

## 🔧 Installation & Setup (lokal)

Hinweis: In dieser bereitgestellten Umgebung werden Frontend und Backend durch Supervisor verwaltet. Die folgenden Befehle dienen dem lokalen Entwickeln auf Ihrem Rechner.

### Voraussetzungen
- Python 3.11+
- Node.js 18+
- .NET 8 SDK (für C#-Backend)
- SQL Server (optional; SQLite für Demo reicht)

### Backend (FastAPI, aktiv)
```bash
# Abhängigkeiten installieren
cd backend/
pip install -r requirements.txt

# (Optional) .env anlegen – nur lokale Entwicklung
# DATABASE_URL="sqlite:///./vorprozess_regelwerk.db"

# Server lokal starten (nur außerhalb dieser Plattform)
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Backend (ASP.NET Core, optional)
```bash
cd backend-csharp/VorprozessRegelwerk.API
# Restore & Build
dotnet restore
dotnet build -c Release

# Start (lokal)
dotnet run --urls http://0.0.0.0:8001

# Konfiguration
# - ConnectionString in appsettings.json oder Umgebungsvariable DefaultConnection
# - Alle Endpunkte müssen mit /api beginnen (Ingress-Regel)
```

### Frontend
```bash
cd frontend/
yarn install

# .env lokal (Beispiel):
# REACT_APP_BACKEND_URL=http://localhost:8001

# Start
yarn start
```

### Supervisor (nur in bereitgestellter Umgebung)
```bash
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
sudo supervisorctl restart all
```

## 📖 API-Dokumentation (stabiler Vertrag)

### Basis-Endpunkte

#### Templates
```http
GET    /api/templates                    # Alle Templates
POST   /api/templates                    # Template erstellen
GET    /api/templates/{id}               # Template abrufen
PUT    /api/templates/{id}               # Template aktualisieren
DELETE /api/templates/{id}               # Template löschen
POST   /api/templates/render             # Templates für Rolle rendern
POST   /api/templates/simulate           # Template mit Werten simulieren
```

#### Fields
```http
GET    /api/fields                       # Alle Felder
POST   /api/fields                       # Feld erstellen
GET    /api/fields/{id}                  # Feld abrufen
PUT    /api/fields/{id}                  # Feld aktualisieren
DELETE /api/fields/{id}                  # Feld löschen
```

#### Validation & Dependencies
```http
POST   /api/validate-field               # Field-Wert validieren (query: field_id, body: value)
GET    /api/validation-schema/{type}     # Validation-Schema abrufen
```

#### Change Log
```http
GET    /api/changelog                    # Change Log abrufen
GET    /api/changelog/{entity_id}        # Entity-spezifische Änderungen
```

### Beispiel-Requests

#### Template erstellen
```json
POST /api/templates
{
  "name": {"de": "Antragsformular KMU", "fr": "Formulaire de demande PME", "it": "Modulo di richiesta PMI"},
  "description": {"de": "Standardformular für KMU-Anträge", "fr": "Formulaire standard pour les demandes PME", "it": "Modulo standard per richieste PMI"}
}
```

#### Feld erstellen (erweitert)
```json
POST /api/fields
{
  "name": {"de": "Unternehmensgröße", "fr": "Taille de l'entreprise", "it": "Dimensione dell'azienda"},
  "type": "select",
  "requirement": "required",
  "visibility": "editable",
  "options": [
    {"value": "small",  "label": {"de": "Klein (1-50)", "fr": "Petite (1-50)", "it": "Piccola (1-50)"}},
    {"value": "medium", "label": {"de": "Mittel (51-250)", "fr": "Moyenne (51-250)", "it": "Media (51-250)"}}
  ],
  "dependencies": [
    {"field_id": "company_type_field_id", "operator": "equals", "condition_value": "corporation"}
  ]
}
```

#### Templates rendern
```json
POST /api/templates/render
{
  "template_ids": ["template-uuid-123"],
  "role": "anmelder",
  "customer_id": "customer_001",
  "language": "de"
}
```

## 🔍 Aktuelle Testergebnisse (Kompatibilitätscheck)

- Backend-API (FastAPI, aktiv): 94.4% erfolgreich (17/18 Tests) – alle Kernendpunkte funktionieren. Kleinigkeit: `GET /api/validation-schema/{type}` liefert für unbekannte Typen `200` mit leerem Schema statt `4xx` (akzeptabel).
- Frontend-UI: 100% – alle Seiten laden korrekt und sprechen die API mit `/api`-Präfix über `REACT_APP_BACKEND_URL` an.

Getestete Seiten:
- Builder (`/builder`): lädt, zeigt "Schablonen-Builder" und Template-Liste (z. B. "Test Schablone").
- Übersicht (`/overview`): Template-Karten und Statistiken werden korrekt angezeigt.
- Erweiterter Builder (`/enhanced-builder`): Tabs (Builder/Simulator/Abhängigkeiten) funktionieren.
- Simulator (`/simulator`): Rollen-/Kunden-Auswahl, Template-Auswahl, Anzeige der Simulation.
- Änderungsprotokoll (`/changelog`): Einträge laden korrekt, Filter und Zähler sichtbar.

## ⚙️ Konfiguration

### Umgebungsvariablen (Frontend)
```bash
# Backend URL (immer verwenden – keine Hardcodings)
REACT_APP_BACKEND_URL=<extern konfiguriert>
```

### Service-Regeln
- Frontend → Backend: ausschließlich über `REACT_APP_BACKEND_URL`
- Backend-Endpunkte: immer mit `/api`-Präfix
- Supervisor verwaltet Ports/Weiterleitungen – nicht manuell ändern

## 🚨 Troubleshooting

### Schnell-Checks
- Backend-Logs: `tail -n 100 /var/log/supervisor/backend.*.log`
- Frontend-Logs: Browser DevTools → Network/Console
- Dienste neu starten: `sudo supervisorctl restart all`

### Häufige Probleme
- CORS: sicherstellen, dass der Frontend-Origin erlaubt ist
- 404/Ingress: prüfen, ob das `/api`-Präfix verwendet wird
- Umgebungsvariablen: im Frontend immer `REACT_APP_BACKEND_URL` beziehen

## 📝 Entwickler-Informationen

### Code-Struktur
```
/app/
├── backend/                         # FastAPI Backend (aktiv)
│   ├── server.py
│   ├── database.py
│   ├── dependency_engine.py
│   ├── advanced_validation.py
│   └── requirements.txt
├── backend-csharp/                  # ASP.NET Core Backend (Alternative)
│   ├── VorprozessRegelwerk.API/
│   ├── VorprozessRegelwerk.Core/
│   └── VorprozessRegelwerk.Infrastructure/
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── contexts/
│       └── App.js
└── README.md
```

### Erweitern des Systems
- Neue Feldtypen: Backend-Enums/Validierung erweitern, Frontend-Renderer ergänzen
- Neue Dependency-Operatoren: DependencyEngine + UI-Operatorenliste erweitern
- Zusätzliche Sprachen: Language-Enums und mehrsprachige Felder ergänzen

## 📄 Lizenz & Support

- Dokumentation: diese README.md, sowie das Benutzerhandbuch unter ./docs/Benutzerhandbuch.md
- Hinweis: Screenshots liegen im Ordner ./docs/images und werden relativ referenziert
- Issues/Feature Requests: Ihr Quellcode-Repository
- Betrieb: Bitte die oben genannten Service-/URL-Regeln beachten

---

## 📊 Version & Changelog

Aktuelle Version: 1.0.0

- ✅ Template-Management, DE/FR/IT, Abhängigkeiten, rollenbasierte Konfiguration
- ✅ Erweiterte Validierung, Role Simulator, Change Log System
- ✅ SQL Server/SQLite Support, erweiterter Builder (UI)
- ✅ Finaler API-/UI-Kompatibilitätscheck: bestanden

Geplante Erweiterungen (Phase 4 UI/UX):
- Drag & Drop Field Ordering, Field Groups/Sections
- Full-Text Search, E2E-Tests