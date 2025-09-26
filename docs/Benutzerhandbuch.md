# Benutzerhandbuch – Vorprozess Regelwerk System

Version: 1.0.0

Dieses Benutzerhandbuch richtet sich an Endanwender und Administratoren. Es beschreibt die Bedienung der Web‑Applikation zur Erstellung, Verwaltung und Simulation von Schablonen (Templates) mit mehrsprachigen Feldern, Abhängigkeiten und Rollenlogik.

Inhalt
- Einleitung und Grundprinzipien
- Schnellstart (für Anwender)
- Modul: Schablonen‑Builder (Basis)
- Modul: Erweiterter Schablonen‑Builder (Builder, Simulator, Abhängigkeiten)
- Modul: Übersicht (Templates & Statistiken)
- Modul: Rollen‑Simulator
- Modul: Änderungsprotokoll (Change Log)
- Mehrsprachigkeit & Rollen
- Validierung & Dokument‑Felder
- Administration (Tipps, Konfiguration, Best Practices)
- Troubleshooting (Kurz)
- Anhang: Tastenkürzel & Begriffe

---

## 1. Einleitung und Grundprinzipien

Das System ermöglicht die strukturierte Erfassung von Informationen über Schablonen. Jede Schablone besteht aus beliebig vielen Feldern. Felder können:
- mehrsprachige Bezeichnungen (DE/FR/IT) besitzen
- verschiedene Typen haben (Text, Auswahl, Dokument)
- Abhängigkeiten zu anderen Feldern aufweisen (z. B.: „zeige Feld B nur wenn Feld A = Wert X“)
- je Rolle (Admin, Anmelder, Klient) unterschiedliche Sichtbarkeit/Verpflichtungen besitzen

Alle Daten sind über eine klar definierte JSON‑API erreichbar. Die Web‑Oberfläche nutzt diese API für Erstellen, Bearbeiten, Löschen, Rendern und Simulieren.

---

## 2. Schnellstart (für Anwender)

1) Öffnen Sie die Anwendung (Startseite leitet auf den Schablonen‑Builder um).
2) Legen Sie über „+ Neue Schablone“ eine Schablone an und vergeben Sie Namen/Beschreibung in DE/FR/IT.
3) Legen Sie über „+ Neues Feld“ Felder an (z. B. Text‑ oder Auswahlfeld) und pflegen Sie die mehrsprachigen Labels.
4) Ordnen Sie Felder der Schablone zu und konfigurieren Sie ggf. Abhängigkeiten.
5) Prüfen Sie die Darstellung je Rolle in „Simulator“ bzw. im Tab „Simulator“ des erweiterten Builders.
6) Nach Änderungen sehen Sie den Verlauf im Modul „Änderungsprotokoll“.

---

## 3. Schablonen‑Builder (Basis)

Zweck: Schnelles Anlegen von Schablonen und Feldern.

Bereiche:
- Schablonen: Liste Ihrer Schablonen (z. B. „Test Schablone“)
- Schablonen‑Felder: Zeigt/ordnet Felder der ausgewählten Schablone
- Verfügbare Felder: Globale Felder, die Sie zuweisen können

Aktionen:
- + Neue Schablone: Erzeugt eine neue Schablone mit DE/FR/IT‑Name und optionaler Beschreibung
- + Neues Feld: Erzeugt ein globales Feld (Typ, Sichtbarkeit, Pflicht, Optionen, Validierung)
- Zuordnung: Feld aus „Verfügbare Felder“ einer Schablone hinzufügen

Screenshot (Builder):
![Builder](./images/builder.png)

Tipps:
- Verwenden Sie klare, kurze Feldnamen in allen Sprachen
- Planen Sie Abhängigkeiten früh (welche Felder steuern andere?)

---

## 4. Erweiterter Schablonen‑Builder

Zweck: Fortgeschrittene Konfiguration mit drei Tabs.

Tabs:
- Builder: Wie im Basis‑Builder – Schablonen und Felder verwalten
- Simulator: Direkter Test der Sichtbarkeit/Verpflichtung je Rolle/Kunde
- Abhängigkeiten: Visualisierung und Pflege von Feld‑Abhängigkeiten

Screenshot (Erweiterter Builder):
![Erweiterter Builder](./images/enhanced_builder.png)

Empfohlener Workflow:
1) Builder: Felder anlegen und zuordnen
2) Abhängigkeiten: Regeln definieren (Operatoren: equals, not_equals, in, contains, is_empty, …)
3) Simulator: Ohne Datenverlust live testen und iterativ nachschärfen

---

## 5. Übersicht

Zweck: Schnelle Bestandsaufnahme aller Schablonen inkl. Kennzahlen.

Funktionen:
- Liste aller Schablonen mit Kurzinfos (Beschreibung, Anzahl Felder)
- Suchfeld und Filter
- Kennzahlen: Anzahl Schablonen, Felder, Textfelder, Pflichtfelder

Screenshot (Übersicht):
![Übersicht](./images/overview.png)

---

## 6. Rollen‑Simulator

Zweck: Anzeige der Schablonen, wie sie für eine bestimmte Rolle/Kunde erscheinen würden.

Bedienung:
- Rolle wählen (Admin, Anmelder, Klient)
- Optional: Kundenkontext wählen
- Schablonen anhaken und Simulation starten
- Ergebnis zeigt nur die sichtbaren Felder, inkl. Pflicht/Optional‑Status

Screenshot (Simulator):
![Simulator](./images/simulator.png)

Hinweise:
- Admin sieht typischerweise alle Felder
- Anmelder/Klient sehen ggf. reduzierte Sichten entsprechend der Konfiguration

---

## 7. Änderungsprotokoll (Change Log)

Zweck: Vollständiger Verlauf aller Änderungen an Schablonen und Feldern.

Funktionen:
- Liste chronologischer Einträge (Erstellt/Aktualisiert/Gelöscht)
- Filter nach Typ und Anzahl
- Detailansicht: Geänderte Werte, Zeitstempel, Benutzer

Screenshot (Änderungsprotokoll):
![Changelog](/app/screenshots/changelog.png)

Best Practices:
- Vor größeren Umbauten kurz durchsehen, ob vorherige Änderungen konsistent waren
- Für Audits Einträge exportieren (API verfügbar)

---

## 8. Mehrsprachigkeit & Rollen

Mehrsprachigkeit (DE/FR/IT):
- Jeder Feld‑/Schablonenname kann dreisprachig gepflegt werden
- Anzeige folgt der im UI gewählten Sprache

Rollen:
- Admin: Vollzugriff / sieht alles
- Anmelder: Eingeschränkte Sicht und Bearbeitung
- Klient: Meist Read‑only, fokussiert auf Sichtbarkeit

---

## 9. Validierung & Dokument‑Felder

Feldtypen:
- Text: min/max Länge, Muster (Regex), Format (z. B. Email)
- Auswahl: Radio (ein Wert) oder Multiple (mehrere Werte), mehrsprachige Optionen
- Dokument: Upload/Download, zulässige Formate/Größen

Validierungslogik:
- Prüfungen werden serverseitig bereitgestellt (z. B. /api/validate-field)
- Schema‑Infos pro Feldtyp: /api/validation-schema/{type}

---

## 10. Administration

Konfiguration & Regeln:
- Alle Backend‑Routen beginnen mit /api (Ingress‑Regel)
- Frontend nutzt ausschließlich REACT_APP_BACKEND_URL (keine Hardcodings)
- Dienste werden durch Supervisor verwaltet (nur bei dieser Bereitstellung)

Empfehlungen:
- Vor Produktivsetzungen: Simulator und Übersicht kontrollieren
- Benennungs‑Konventionen etablieren (eindeutige IDs, saubere Labels)
- Abhängigkeiten sparsam, aber klar verwenden

Sicherheit & Daten:
- IDs sind sprachunabhängig und stabil
- Beachten Sie Dateigrößen‑/Formateinschränkungen bei Dokumentenfeldern

---

## 11. Troubleshooting (Kurz)

- UI lädt nicht: Browser‑Konsole prüfen, Netzwerk‑Tab → sind /api‑Requests erfolgreich?
- 404: Prüfen, ob das /api‑Präfix im Request vorhanden ist
- CORS/Verbindungsfehler: Frontend‑Origin im Backend erlauben (Admin‑Thema)
- Dienste neu starten (in dieser Umgebung): `sudo supervisorctl restart all`

---

## 12. Anhang: Tastenkürzel & Begriffe

Tastenkürzel: – (N. n.)

Begriffe:
- Schablone (Template): Container für Felder
- Feld: Datenelement mit Typ und Regeln
- Abhängigkeit (Dependency): Regel, wann ein Feld sichtbar/erforderlich ist
- Rolle: Sichten/Verhalten unterscheiden (Admin/Anmelder/Klient)

---

© Vorprozess Regelwerk System – Benutzerhandbuch (Markdown). Für PDF‑Export dieses Dokument z. B. mit einem Markdown‑zu‑PDF‑Tool in PDF umwandeln.
