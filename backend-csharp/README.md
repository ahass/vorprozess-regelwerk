# Vorprozess Regelwerk - C# ASP.NET Core Backend

Ein vollständig in C# ASP.NET Core implementiertes Backend für das Vorprozess Regelwerk System mit Entity Framework Core und SQL Server/SQLite Unterstützung.

## 🏗️ Architektur

### Clean Architecture Pattern
- **VorprozessRegelwerk.API** - Web API Layer (Controllers, Startup)
- **VorprozessRegelwerk.Core** - Domain Layer (Entities, Interfaces, DTOs)
- **VorprozessRegelwerk.Infrastructure** - Data Layer (DbContext, Services)

### Technologie-Stack
- **Framework**: ASP.NET Core 8.0
- **ORM**: Entity Framework Core 8.0
- **Database**: SQL Server / SQLite
- **Documentation**: Swagger/OpenAPI
- **Logging**: Serilog + Console
- **Mapping**: AutoMapper
- **Validation**: FluentValidation

## 🚀 Features

### ✅ Vollständig portierte Features:
- **Template Management** (CRUD mit dreisprachiger Unterstützung)
- **Field Management** (Alle Feldtypen: Text, Select, Document)
- **Conditional Dependencies** (Dependency Engine mit 8+ Operatoren)
- **Advanced Validation** (String/Number/Date/File Validation)
- **Role-based Access** (Anmelder/Klient/Admin)
- **Change Log System** (Vollständiges Audit-Trail)
- **Multi-language Support** (DE/FR/IT)

### 🔧 Advanced Engines:
- **DependencyEngine**: Komplexe bedingte Logik
- **ValidationEngine**: Erweiterte Validation Rules
- **Multi-language Text Management**: Relationale mehrsprachige Texte

## 📦 Installation & Setup

### Voraussetzungen
- .NET 8.0 SDK
- SQL Server (oder SQLite für Development)
- Visual Studio 2022 oder VS Code

### 1. Dependencies installieren
```bash
cd /app/backend-csharp
dotnet restore
```

### 2. Database konfigurieren

#### SQLite (Development):
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=vorprozess_regelwerk.db"
  }
}
```

#### SQL Server (Production):
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=VorprozessRegelwerk;Trusted_Connection=true;MultipleActiveResultSets=true"
  }
}
```

### 3. Anwendung starten
```bash
cd VorprozessRegelwerk.API
dotnet run
```

### 4. Swagger UI öffnen
```
http://localhost:8001/swagger
```

## 📊 Datenbank-Schema

### Entity Relationships
```
Templates (1) ←→ (N) TemplateFields (N) ←→ (1) Fields
Templates (1) ←→ (N) MultiLanguageTexts
Fields (1) ←→ (N) MultiLanguageTexts
ChangeLogEntries (Independent)
```

### Core Entities
- **Template**: Schablonen-Definitionen
- **Field**: Feld-Definitionen mit Validation/Dependencies
- **TemplateField**: Many-to-Many Junction mit Order
- **MultiLanguageText**: Dreisprachige Texte (DE/FR/IT)
- **ChangeLogEntry**: Audit-Trail für alle Änderungen

## 🔌 API Endpoints

### Templates
```http
GET    /api/templates                    # Alle Templates
POST   /api/templates                    # Template erstellen
GET    /api/templates/{id}               # Template abrufen
PUT    /api/templates/{id}               # Template aktualisieren
DELETE /api/templates/{id}               # Template löschen
POST   /api/templates/render             # Template für Rolle rendern
POST   /api/templates/simulate           # Template mit Werten simulieren
```

### Fields
```http
GET    /api/fields                       # Alle Felder
POST   /api/fields                       # Feld erstellen
GET    /api/fields/{id}                  # Feld abrufen
PUT    /api/fields/{id}                  # Feld aktualisieren
DELETE /api/fields/{id}                  # Feld löschen
POST   /api/fields/validate-field        # Field-Wert validieren
GET    /api/fields/validation-schema/{type} # Validation-Schema abrufen
```

### Change Log
```http
GET    /api/changelog                    # Change Log abrufen
GET    /api/changelog/{entityId}         # Entity-spezifische Änderungen
```

## 🧪 Beispiel-Usage

### Template erstellen
```csharp
POST /api/templates
{
  "name": {
    "de": "KMU-Antrag",
    "fr": "Demande PME", 
    "it": "Domanda PMI"
  },
  "description": {
    "de": "Förderantrag für KMU",
    "fr": "Demande de subvention PME",
    "it": "Domanda di sovvenzione PMI"
  }
}
```

### Erweiterte Field-Erstellung
```csharp
POST /api/fields
{
  "name": {
    "de": "Unternehmensgröße",
    "fr": "Taille de l'entreprise",
    "it": "Dimensione dell'azienda"
  },
  "type": "Select",
  "requirement": "Required",
  "visibility": "Editable",
  "selectType": "Radio",
  "options": [
    {
      "value": "small",
      "label": {
        "de": "Klein (1-50)",
        "fr": "Petite (1-50)",
        "it": "Piccola (1-50)"
      }
    }
  ]
}
```

### Template für Rolle rendern
```csharp
POST /api/templates/render
{
  "templateIds": ["template-uuid"],
  "role": "Anmelder",
  "customerId": "customer_001",
  "language": "De"
}
```

## ⚙️ Konfiguration

### appsettings.json
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=vorprozess_regelwerk.db"
  },
  "CORS_ORIGINS": "*",
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.EntityFrameworkCore": "Information"
    }
  }
}
```

### Environment Variables
```bash
# Database
ConnectionStrings__DefaultConnection="Data Source=vorprozess_regelwerk.db"

# CORS (für Production spezifische Origins)
CORS_ORIGINS="https://app.example.com,https://admin.example.com"

# Logging Level
Logging__LogLevel__Default="Information"
```

## 🐳 Docker Deployment

### Build Image
```bash
cd /app/backend-csharp
docker build -t vorprozess-regelwerk-api .
```

### Run Container
```bash
docker run -p 8001:8001 \
  -e ConnectionStrings__DefaultConnection="Data Source=/app/data/vorprozess_regelwerk.db" \
  -v $(pwd)/data:/app/data \
  vorprozess-regelwerk-api
```

## 🔧 Development

### Migration Commands
```bash
# Add Migration
dotnet ef migrations add InitialCreate -p VorprozessRegelwerk.Infrastructure -s VorprozessRegelwerk.API

# Update Database
dotnet ef database update -p VorprozessRegelwerk.Infrastructure -s VorprozessRegelwerk.API
```

### Build & Test
```bash
# Build Solution
dotnet build

# Run Tests (wenn vorhanden)
dotnet test

# Publish für Production
dotnet publish -c Release -o ./publish
```

## 📝 Code-Struktur

```
VorprozessRegelwerk.API/
├── Controllers/           # API Controllers
│   ├── TemplatesController.cs
│   ├── FieldsController.cs
│   └── ChangeLogController.cs
├── Program.cs            # Startup Configuration
└── appsettings.json      # Configuration

VorprozessRegelwerk.Core/
├── Entities/             # Domain Models
│   ├── Template.cs
│   ├── Field.cs
│   └── MultiLanguageText.cs
├── DTOs/                # Data Transfer Objects
├── Interfaces/          # Service Interfaces
├── Services/            # Domain Services
│   ├── DependencyEngine.cs
│   └── ValidationEngine.cs
└── Enums/              # Enumerations

VorprozessRegelwerk.Infrastructure/
├── Data/               # EF Core DbContext
│   └── ApplicationDbContext.cs
└── Services/           # Service Implementations
    ├── TemplateService.cs
    ├── FieldService.cs
    └── ChangeLogService.cs
```

## 🚨 Troubleshooting

### Database Connection Issues
```bash
# Check connection string
dotnet ef dbcontext info -p VorprozessRegelwerk.Infrastructure -s VorprozessRegelwerk.API

# Recreate database
dotnet ef database drop -p VorprozessRegelwerk.Infrastructure -s VorprozessRegelwerk.API
dotnet ef database update -p VorprozessRegelwerk.Infrastructure -s VorprozessRegelwerk.API
```

### Common Issues
1. **Port bereits belegt**: Port 8001 in launchSettings.json ändern
2. **EF Core Fehler**: `dotnet ef` tool installieren: `dotnet tool install --global dotnet-ef`
3. **SQLite Permissions**: Schreibrechte für SQLite-Datei prüfen
4. **CORS Probleme**: CORS_ORIGINS in appsettings.json konfigurieren

## 🔄 Migration von Python

### Was wurde portiert:
✅ **Komplette API-Kompatibilität** - Alle Endpunkte 1:1 portiert
✅ **Dependency Engine** - Conditional Logic vollständig implementiert
✅ **Validation Engine** - Erweiterte Validation Rules
✅ **Multi-language Support** - Dreisprachige Texte (DE/FR/IT)
✅ **Change Log System** - Audit-Trail mit User-Tracking
✅ **Role-based Access** - Rollenbasierte Field-Konfiguration
✅ **JSON Compatibility** - Gleiche Request/Response Formate

### Verbesserungen gegenüber Python:
🚀 **Performance** - Kompilierte Sprache, optimierte Queries
🔧 **Type Safety** - Starke Typisierung, Compile-Zeit Fehlerprüfung  
📊 **Enterprise Ready** - Skalierbarkeit, Dependency Injection
🛠️ **Tooling** - Visual Studio, IntelliSense, Debugging
🔄 **Async/Await** - Native asynchrone Programmierung
📦 **NuGet Ecosystem** - Reiche Package-Bibliothek

## 📄 Lizenz

Gleiche Lizenz wie das Hauptprojekt.

---

**🚀 Entwickelt mit ASP.NET Core 8.0 + Entity Framework Core + SQL Server**

*Vollständig kompatibel mit dem Python FastAPI Backend*