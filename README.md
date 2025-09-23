# Vorprozess Regelwerk System

Ein umfassendes Template-Management-System zur Erstellung und Verwaltung von rollenbasierten, mehrsprachigen Schablonen für Vorprozess-Anforderungen.

## 📋 Übersicht

Das Vorprozess Regelwerk System ermöglicht es Organisationen, flexible und intelligente Formulare zu erstellen, die sich basierend auf Benutzerrollen, Kundenanforderungen und bedingten Abhängigkeiten dynamisch anpassen. Das System unterstützt dreisprachige Inhalte (Deutsch, Französisch, Italienisch) und bietet erweiterte Validierungs- und Abhängigkeitsfunktionen.

## 🚀 Hauptfunktionen

### 🛠️ Template Builder
- **Dreisprachige Templates**: Vollständige Unterstützung für DE/FR/IT
- **Flexible Feldtypen**: Text, Auswahl, Dokument-Upload
- **Drag & Drop Interface**: Intuitive Benutzeroberfläche
- **Erweiterte Validierung**: Regex, Formatprüfung, Längenbeschränkungen
- **Rollenbasierte Konfiguration**: Anmelder/Klient/Admin-spezifische Einstellungen

### 📎 Bedingte Abhängigkeiten
- **Intelligente Field Logic**: "Wenn Feld X = Y, dann zeige Feld Z"
- **Mehrere Operatoren**: equals, not_equals, in, contains, is_empty, etc.
- **Komplexe Bedingungen**: Mehrere Abhängigkeiten pro Feld
- **Live-Simulation**: Echtzeit-Test der Dependency-Logik

### 👥 Rollen- & Kundenverwaltung
- **Dreistufiges Rollensystem**: Administrator, Anmelder, Klient
- **Kundenspezifische Felder**: Individuelle Sichtbarkeit pro Kunde
- **Rollenbasierte Overrides**: Unterschiedliche Konfigurationen pro Rolle
- **Granulare Berechtigungen**: Field-Level Security

### 🎮 Simulation & Testing
- **Role Simulator**: Live-Vorschau für verschiedene Benutzerrollen
- **Dependency Testing**: Interaktive Abhängigkeits-Simulation
- **Field Value Testing**: Real-time Validierung
- **Visual Feedback**: Versteckte Felder und Abhängigkeits-Informationen

### 📊 Monitoring & Audit
- **Change Log System**: Vollständiges Audit-Trail
- **User Tracking**: Wer hat was wann geändert
- **Template Analytics**: Nutzungsstatistiken
- **Export Funktionalität**: JSON/API-basierte Datenextraktion

## 🏗️ Technische Architektur

### Backend
- **Framework**: FastAPI (Python)
- **Database**: SQL Server (SQLite für Demo)
- **ORM**: SQLAlchemy
- **Validation**: Pydantic Models
- **API**: RESTful mit JSON

### Frontend
- **Framework**: React 19.x
- **Styling**: Tailwind CSS + Radix UI
- **State Management**: Context API
- **Routing**: React Router
- **HTTP Client**: Axios

### Database Schema
```sql
-- Haupt-Tabellen
Templates          (id, role_config, customer_specific, created_at, ...)
Fields             (id, type, visibility, requirement, validation, ...)
MultiLanguageTexts (id, entity_type, entity_id, language_code, text_value)
ChangeLogEntries   (id, entity_type, action, changes, user_id, timestamp)

-- Beziehungen
TemplateFields     (template_id, field_id)  -- Many-to-Many
```

## 🔧 Installation & Setup

### Voraussetzungen
- Python 3.11+
- Node.js 18+
- SQL Server (oder SQLite für Demo)

### Backend Setup
```bash
# Backend-Abhängigkeiten installieren
cd backend/
pip install -r requirements.txt

# Umgebungsvariablen konfigurieren
# .env Datei erstellen:
DATABASE_URL="sqlite:///./vorprozess_regelwerk.db"
# Für SQL Server:
# DATABASE_URL="mssql+pyodbc://user:password@server/database?driver=ODBC+Driver+17+for+SQL+Server"

# Server starten
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend Setup
```bash
# Frontend-Abhängigkeiten installieren
cd frontend/
yarn install

# Umgebungsvariablen konfigurieren
# .env Datei erstellen:
REACT_APP_BACKEND_URL=http://localhost:8001

# Development Server starten
yarn start
```

## 📖 API-Dokumentation

### Basis-Endpunkte

#### Templates
```http
GET    /api/templates                    # Alle Templates
POST   /api/templates                    # Template erstellen
GET    /api/templates/{id}               # Template abrufen
PUT    /api/templates/{id}               # Template aktualisieren
DELETE /api/templates/{id}               # Template löschen
POST   /api/templates/render             # Template für Rolle rendern
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
POST   /api/validate-field               # Field-Wert validieren
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
  "name": {
    "de": "Antragsformular KMU",
    "fr": "Formulaire de demande PME", 
    "it": "Modulo di richiesta PMI"
  },
  "description": {
    "de": "Standardformular für KMU-Anträge",
    "fr": "Formulaire standard pour les demandes PME",
    "it": "Modulo standard per richieste PMI"
  }
}
```

#### Erweiteres Feld erstellen
```json
POST /api/fields
{
  "name": {
    "de": "Unternehmensgröße",
    "fr": "Taille de l'entreprise",
    "it": "Dimensione dell'azienda"
  },
  "type": "select",
  "requirement": "required",
  "visibility": "editable",
  "options": [
    {
      "value": "small",
      "label": {
        "de": "Klein (1-50 Mitarbeiter)",
        "fr": "Petite (1-50 employés)",
        "it": "Piccola (1-50 dipendenti)"
      }
    },
    {
      "value": "medium", 
      "label": {
        "de": "Mittel (51-250 Mitarbeiter)",
        "fr": "Moyenne (51-250 employés)",
        "it": "Media (51-250 dipendenti)"
      }
    }
  ],
  "dependencies": [
    {
      "field_id": "company_type_field_id",
      "operator": "equals",
      "condition_value": "corporation"
    }
  ],
  "role_config": {
    "anmelder": {
      "visible": true,
      "requirement": "required"
    },
    "klient": {
      "visible": true,
      "visibility": "visible"
    }
  }
}
```

#### Template für Rolle rendern
```json
POST /api/templates/render
{
  "template_ids": ["template-uuid-123"],
  "role": "anmelder",
  "customer_id": "customer_001",
  "language": "de"
}
```

### Antwort-Beispiele

#### Template-Antwort
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": {
    "de": "Antragsformular KMU",
    "fr": "Formulaire de demande PME",
    "it": "Modulo di richiesta PMI"
  },
  "description": {
    "de": "Standardformular für KMU-Anträge",
    "fr": "Formulaire standard pour les demandes PME", 
    "it": "Modulo standard per richieste PMI"
  },
  "fields": ["field-uuid-1", "field-uuid-2"],
  "role_config": {},
  "customer_specific": false,
  "visible_for_customers": [],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "created_by": "admin",
  "updated_by": "admin"
}
```

#### Gerendertes Template (mit Abhängigkeiten)
```json
{
  "templates": [
    {
      "id": "template-uuid-123",
      "name": {"de": "Antragsformular", "fr": "Formulaire", "it": "Modulo"},
      "fields": [
        {
          "id": "field-uuid-1",
          "name": {"de": "Unternehmensname", "fr": "Nom de l'entreprise", "it": "Nome dell'azienda"},
          "type": "text",
          "visibility": "editable",
          "requirement": "required",
          "validation": {
            "string": {
              "min_length": 2,
              "max_length": 100
            }
          }
        }
      ]
    }
  ],
  "fields": [...] // Alle sichtbaren Felder für die Rolle
}
```

#### Change Log Eintrag
```json
{
  "id": "log-uuid-123",
  "entity_type": "template",
  "entity_id": "template-uuid-123",
  "action": "updated",
  "changes": {
    "fields": ["added field-uuid-2"],
    "description": {"de": "Neue Beschreibung"}
  },
  "user_id": "admin",
  "user_name": "System Administrator",
  "timestamp": "2024-01-15T15:45:00Z"
}
```

## 🎯 Benutzerhandbuch

### Template-Erstellung

1. **Basis Template Builder** (`/builder`)
   - Einfache Template-Erstellung
   - Grundlegende Feld-Zuordnung
   - Standard-Funktionalitäten

2. **Erweiterte Template Builder** (`/enhanced-builder`)
   - **Builder Tab**: Template und Feld-Management
   - **Simulator Tab**: Live-Test der Dependencies
   - **Dependencies Tab**: Übersicht aller Abhängigkeiten

### Feld-Konfiguration

#### Feldtypen
- **Text**: Einfache/mehrzeilige Eingabe, Validierung, Format-Prüfung
- **Auswahl**: Radio-Buttons oder Checkboxes, mehrsprachige Optionen
- **Dokument**: Download/Upload, Größen-/Format-Beschränkungen

#### Validierungsregeln
```javascript
// Text-Validierung
{
  "string": {
    "min_length": 5,
    "max_length": 100,
    "pattern": "^[A-Za-z0-9]+$",
    "format": "email" // email, phone, url
  }
}

// Datei-Validierung  
{
  "file": {
    "max_size_mb": 10,
    "allowed_extensions": ["pdf", "doc", "docx"],
    "allowed_mime_types": ["application/pdf"]
  }
}
```

#### Abhängigkeiten konfigurieren
```javascript
{
  "dependencies": [
    {
      "field_id": "company_type",
      "operator": "equals", 
      "condition_value": "corporation"
    },
    {
      "field_id": "annual_revenue",
      "operator": "greater_than",
      "condition_value": "1000000"
    }
  ]
}
```

### Rollen-Simulation

Der Role Simulator (`/simulator`) ermöglicht:
- **Template-Auswahl**: Mehrere Templates gleichzeitig testen
- **Rollen-Umschaltung**: Anmelder/Klient/Admin Perspektiven
- **Kunden-Filter**: Kundenspezifische Ansichten
- **Live-Updates**: Sofortige Änderungen bei Eingaben

## 🔍 Ausgabe-Beispiele

### Webapp-Interface

#### Template Builder Interface
```
┌─────────────────────────────────────────────────────────────────┐
│ Erweiterter Schablonen-Builder                    [+ Schablone] │
├─────────────────────────────────────────────────────────────────┤
│ 🛠️ Builder  🧪 Simulator  📎 Abhängigkeiten                    │
├─────────────────────────────────────────────────────────────────┤
│ ┌─ Schablonen ────┐ ┌─ Schablonen-Felder ─┐ ┌─ Verfügbare ─┐   │
│ │ ✓ KMU Antrag    │ │ 📝 Unternehmensname  │ │ 📊 Umsatz     │   │
│ │   (3 Felder)    │ │    [required][edit]  │ │   + hinzufügen│   │
│ │                 │ │ 📎 Abhängig von:     │ │ 📄 Dokument   │   │
│ │ ○ Vollmacht     │ │    company_type =    │ │   + hinzufügen│   │
│ │   (1 Feld)      │ │    "corporation"     │ │               │   │
│ └─────────────────┘ └─────────────────────┘ └───────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

#### Role Simulator Interface
```
┌─────────────────────────────────────────────────────────────────┐
│ 🧪 Abhängigkeiten-Simulator                                     │
├─────────────────────────────────────────────────────────────────┤
│ Rolle: [Anmelder ▼] Kunde: [Kunde A ▼]  Sichtbare: 3/5 Felder │
├─────────────────────────────────────────────────────────────────┤
│ ┌─ Unternehmenstyp ─────────────────────────────────────────┐   │
│ │ ● Einzelunternehmen  ○ GmbH  ○ AG                        │   │
│ └───────────────────────────────────────────────────────────┘   │
│ ┌─ Unternehmensgröße (abhängig) ────────────────────────────┐   │
│ │ [AUSGEBLENDET - Bedingung nicht erfüllt]                 │   │
│ │ 📎 Nur sichtbar wenn: company_type = "corporation"       │   │
│ └───────────────────────────────────────────────────────────┘   │
│ ┌─ Ausgeblendete Felder (2) ────────────────────────────────┐   │
│ │ • Jahresumsatz (abhängig von Unternehmensgröße)          │   │
│ │ • Mitarbeiteranzahl (nur für Admin sichtbar)             │   │
│ └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### JSON API Output

#### Vollständiges Template mit Dependencies
```json
{
  "template": {
    "id": "kmu-antrag-template",
    "name": {
      "de": "KMU-Förderantrag",
      "fr": "Demande de subvention PME",
      "it": "Domanda di sovvenzione PMI"
    },
    "fields": [
      {
        "id": "company-name",
        "name": {"de": "Unternehmensname", "fr": "Nom de l'entreprise"},
        "type": "text",
        "requirement": "required",
        "visibility": "editable",
        "validation": {
          "string": {"min_length": 2, "max_length": 100}
        }
      },
      {
        "id": "company-size", 
        "name": {"de": "Unternehmensgröße", "fr": "Taille de l'entreprise"},
        "type": "select",
        "dependencies": [
          {
            "field_id": "company-type",
            "operator": "in",
            "condition_value": ["gmbh", "ag"]
          }
        ],
        "options": [
          {"value": "small", "label": {"de": "Klein", "fr": "Petite"}},
          {"value": "medium", "label": {"de": "Mittel", "fr": "Moyenne"}}
        ]
      }
    ]
  },
  "visible_field_count": 2,
  "simulation_info": {
    "role": "anmelder",
    "customer_id": "customer_001", 
    "dependencies_processed": true
  }
}
```

#### Change Log Output
```json
[
  {
    "id": "change-001",
    "entity_type": "field",
    "entity_id": "company-size",
    "action": "updated", 
    "changes": {
      "dependencies": [
        {
          "added": {
            "field_id": "company-type",
            "operator": "equals",
            "condition_value": "corporation"
          }
        }
      ],
      "validation": {
        "string": {"min_length": 1}
      }
    },
    "user_id": "admin",
    "user_name": "System Administrator",
    "timestamp": "2024-01-15T14:23:45Z"
  }
]
```

## 🔧 Konfiguration

### Umgebungsvariablen

#### Backend (.env)
```bash
# Database
DATABASE_URL="sqlite:///./vorprozess_regelwerk.db"
# Für SQL Server:
# DATABASE_URL="mssql+pyodbc://user:pass@server/db?driver=ODBC+Driver+17+for+SQL+Server"

# CORS
CORS_ORIGINS="*"
# Für Produktion spezifische Origins verwenden:
# CORS_ORIGINS="https://app.example.com,https://admin.example.com"
```

#### Frontend (.env)
```bash
# Backend URL
REACT_APP_BACKEND_URL=http://localhost:8001
# Für Produktion:
# REACT_APP_BACKEND_URL=https://api.yourcompany.com

# WebSocket (falls implementiert)
WDS_SOCKET_PORT=443
```

### Supervisor Configuration
```ini
[program:backend]
command=uvicorn server:app --host 0.0.0.0 --port 8001
directory=/app/backend
autostart=true
autorestart=true

[program:frontend] 
command=yarn start
directory=/app/frontend
autostart=true
autorestart=true
```

## 🚨 Troubleshooting

### Häufige Probleme

#### Backend startet nicht
```bash
# Logs prüfen
tail -f /var/log/supervisor/backend.*.log

# Dependencies neu installieren
pip install -r requirements.txt

# Datenbank-Verbindung testen
python -c "from database import engine; print(engine.execute('SELECT 1').fetchone())"
```

#### Frontend-Fehler
```bash
# Node modules neu installieren
rm -rf node_modules yarn.lock
yarn install

# Build-Fehler prüfen
yarn build

# Environment Variables prüfen
echo $REACT_APP_BACKEND_URL
```

#### Database-Probleme
```bash
# SQLite DB neu erstellen
rm vorprozess_regelwerk.db
python -c "from database import create_tables; create_tables()"

# SQL Server Verbindung testen
sqlcmd -S server -U username -P password -Q "SELECT 1"
```

#### API-Verbindungsprobleme
```bash
# Backend erreichbar?
curl http://localhost:8001/api/

# CORS-Probleme? Frontend URL in Backend .env prüfen
# Network-Requests im Browser Developer Tools prüfen
```

## 📝 Entwickler-Informationen

### Code-Struktur

```
/app/
├── backend/
│   ├── server.py              # FastAPI Hauptanwendung
│   ├── database.py            # SQLAlchemy Models & DB Setup
│   ├── dependency_engine.py   # Conditional Logic Engine
│   ├── advanced_validation.py # Validation Rules Engine
│   └── requirements.txt       # Python Dependencies
├── frontend/
│   ├── src/
│   │   ├── components/        # React Components
│   │   │   ├── AdvancedFieldEditor.js
│   │   │   ├── DependencySimulator.js
│   │   │   ├── MultiLanguageInput.js
│   │   │   └── Layout.js
│   │   ├── pages/            # Route Components
│   │   │   ├── TemplateBuilder.js
│   │   │   ├── EnhancedTemplateBuilder.js
│   │   │   ├── TemplateOverview.js
│   │   │   ├── RoleSimulator.js
│   │   │   └── ChangeLog.js
│   │   ├── contexts/         # React Context
│   │   │   └── AppContext.js
│   │   └── App.js           # Main App Component
│   └── package.json         # Node Dependencies
└── README.md               # Diese Dokumentation
```

### Erweitern des Systems

#### Neue Feldtypen hinzufügen
1. Backend: Enum in `server.py` erweitern
2. Validation: Rule in `advanced_validation.py` hinzufügen  
3. Frontend: Component in `AdvancedFieldEditor.js` ergänzen
4. Simulator: Rendering in `DependencySimulator.js` implementieren

#### Neue Dependency-Operatoren
1. Backend: `DependencyEngine.evaluate_condition()` erweitern
2. Frontend: Operator-Liste in `AdvancedFieldEditor.js` ergänzen
3. Tests: Neue Operatoren in Simulator testen

#### Zusätzliche Sprachen
1. Backend: Language Enum erweitern
2. Frontend: Language-Arrays in allen Komponenten ergänzen
3. Database: Neue Language-Codes in MultiLanguageTexts unterstützen

## 📄 Lizenz & Support

### Lizenz
Dieses Projekt steht unter [Ihre Lizenz hier einfügen].

### Support
- **Dokumentation**: Siehe diese README.md
- **Issues**: GitHub Issues für Bug-Reports
- **Feature Requests**: GitHub Discussions
- **Entwickler-Support**: [Kontakt-Informationen]

### Beitragen
1. Fork des Repositories
2. Feature Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Änderungen committen (`git commit -m 'Add AmazingFeature'`)
4. Push to Branch (`git push origin feature/AmazingFeature`)
5. Pull Request erstellen

---

## 📊 Version & Changelog

**Aktuelle Version**: 1.0.0

### Version 1.0.0 (Aktuell)
- ✅ Grundlegendes Template-Management
- ✅ Dreisprachige Unterstützung (DE/FR/IT)
- ✅ Bedingte Abhängigkeiten
- ✅ Rollenbasierte Konfiguration
- ✅ Erweiterte Validierung
- ✅ Role Simulator
- ✅ Change Log System
- ✅ SQL Server Support
- ✅ Advanced Field Editor
- ✅ Dependency Simulation

### Geplante Features (v1.1.0)
- 🔄 Drag & Drop Field Ordering  
- 📁 Field Groups/Sections
- 🔍 Full-Text Search
- 📧 Email Notifications
- 🧪 End-to-End Testing

---

**🚀 Entwickelt mit FastAPI + React + SQL Server**

*Für weitere Informationen und Updates besuchen Sie [Ihr Repository/Website]*
