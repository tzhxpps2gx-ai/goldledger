# GoldLedger — Personal Trading Journal

## Obsidian Second Brain

Vault-Pfad (iCloud): `~/Library/Mobile Documents/com~apple~CloudDocs/B-Business/GoldLedger-Brain/`

Lese- und Schreibrechte vorhanden. Nutzen für Etappe-Zusammenfassungen, Entscheidungen, Bugs und Lerneffekte.

**Ordnerstruktur:**
- `00 - Dashboard/` — Startseite-Notiz
- `01 - Projekt-Status/` — Roadmap, Vision
- `02 - Etappen/` — Eine Notiz pro Etappe (Format: `Etappe X - Name.md`)
- `03 - Entscheidungen/` — Architektur-Entscheidungen
- `04 - Bugs & Lerneffekte/` — Bug-Reports + was ich daraus gelernt habe
- `05 - Feature-Ideen/` — Inbox für spontane Ideen
- `06 - Trading-Insights/` — Trading-Erkenntnisse aus Journal-Nutzung
- `07 - Setup-Doku/` — Vercel, Supabase, etc.
- `08 - Anhänge/` — Screenshots, Diagramme
- `Templates/` — Vorlagen (Etappe.md, Entscheidung.md, Bug-Lerneffekt.md, Feature-Idee.md)

**Regeln:**
- Neue Notizen IMMER mit YAML-Frontmatter (typ, datum, tags)
- Bei Etappe-Notizen: Template aus `Templates/Etappe.md` als Vorlage nehmen
- Bei Verlinkungen: `[[Notiz-Name]]`-Syntax verwenden
- Dateinamen: keine Sonderzeichen, deutsche Umlaute OK

**WICHTIG — Datei-Sicherheit:**
- NIEMALS Notizen löschen ohne explizite Bestätigung des Users
- BESTEHENDE Notizen nur ergänzen (append), NICHT überschreiben
- Bei Konflikten oder Unklarheit: erst nachfragen, nicht handeln
- Dateipfade IMMER doppelt prüfen vor dem Schreiben


## Projekt-Kontext
GoldLedger ist ein persönliches Trading-Journal für XAUUSD (Gold) Daytrading auf Vantage.
User: Solo-Trader in Deutschland, EUR-Konto, 2–5 Trades/Tag, 5 Tage/Woche.
User hat KEINE Coding-Erfahrung — arbeitet mit Claude Code.

## Arbeitsweise & Autonomie-Regeln

### Rolle
Claude Code ist Prompt-Architekt UND Umsetzer: Etappen planen, umsetzen, testen, dokumentieren. User ist Solo-Daytrader ohne Coding-Erfahrung — alles verständlich auf Deutsch erklären.

### Wann der User gefragt werden MUSS (wichtige Entscheidungen)
Bei folgenden Punkten NIEMALS eigenmächtig handeln — erst fragen und auf Antwort warten:
- Welche Etappe / welches große Feature als nächstes kommt
- Architektur-Entscheidungen (neue Bibliotheken, Schema-Design, größere Umbauten oder Refactorings)
- Alles, was bestehende Daten verändert (Migrationen, Spalten ändern oder löschen)
- Alles Unumkehrbare (Dateien löschen, force-push, DB-Daten löschen)
- Design-/UX-Entscheidungen, die das Aussehen spürbar verändern
- Trade-offs mit mehreren sinnvollen Optionen → Optionen mit Vor- und Nachteilen vorlegen, User wählt
- Alles Kostenrelevante (neue kostenpflichtige Dienste)
- Auth- und Sicherheits-Änderungen
- Alles, was P/L- oder Trade-Berechnungen betrifft — das Herz des Trading-Journals, maximale Vorsicht

### Was selbst entschieden werden darf (danach kurz berichten)
- Umsetzungs-Details innerhalb einer abgestimmten Etappe
- Bug-Fixes
- Code-Stil und Refactoring innerhalb einer Datei
- Schreiben der Obsidian-Notizen
- Routine-Arbeit nach etablierten Mustern

### Modell-Empfehlung (Opus 4.8 vs Sonnet 4.6)
Zu Beginn jeder Etappe/Aufgabe UND wenn sich die Komplexität unterwegs ändert: proaktiv kurzen Hinweis geben, welches Modell besser passt.
- **OPUS empfehlen bei:** komplexen Architektur-Entscheidungen, kniffligem Debugging (wenn etwas wiederholt fehlschlägt), großen Refactorings mit vielen Abhängigkeiten, sensibler Logik (P/L-Berechnungen, Zeitzonen, Edge-Cases) — überall, wo Reasoning-Tiefe zählt.
- **SONNET empfehlen bei:** Routine-Umsetzung nach klarem Plan, einfachen UI-/CRUD-Komponenten, simplen Bug-Fixes, Doku-Schreiben — überall, wo Tempo und Limit-Schonung wichtiger sind und die Aufgabe klar ist.
- Hinweise kurz halten, z.B.: "Hinweis: Diese Etappe ist überwiegend Routine-UI — Sonnet reicht. Falls du auf Opus bist: /model sonnet spart Limit." Oder: "Hinweis: Hier geht es um die P/L-Berechnung mit Edge-Cases — ich empfehle Opus. Wechsel mit /model opus."
- Wenn der User schon auf dem passenden Modell ist: nur kurz bestätigen oder nichts sagen.
- Finale Entscheidung liegt immer beim User.

### Etappen-Workflow (Standard-Ablauf)
1. User sagt "plane die nächste Etappe" → echten Code + CLAUDE.md analysieren, nächste sinnvolle Etappe MIT Begründung und Modell-Hinweis (Opus/Sonnet) vorschlagen, fragen ob Richtung passt. NICHT direkt drauflos planen.
2. Nach Bestätigung: vollständiger strukturierter Etappe-Plan (Ziel, alle Schritte, Schema-Änderungen, Tests).
3. User gibt grünes Licht → Umsetzung. Bei wichtigen Teil-Entscheidungen unterwegs (siehe oben): erst fragen.
4. SQL-Migrationen generieren und ZEIGEN — User führt sie selbst in Supabase aus. Nicht selbst ausführen.
5. Lokal testen (npm run dev).
6. User bitten, alles auf der Live-Website (goldledger-fi24.vercel.app) zu testen, auf "Läuft" warten.
7. Erst nach "Läuft": CLAUDE.md aktualisieren + committen + pushen.
8. Danach: Obsidian-Notiz(en) direkt in den Vault schreiben.
9. Kurze Zusammenfassung dessen, was erledigt wurde.

### CLAUDE.md Pflege (nach jeder Etappe)
- Etappe als erledigt markieren
- Kurze Zusammenfassung des Gebauten
- Schema-Änderungen
- Neue/umgebaute Komponenten + neue Bibliotheken
- Nächste geplante Schritte
- Relevante Architektur-Entscheidungen in die Entscheidungs-Liste

Kompakt halten, kein Roman.

### Obsidian-Vault
- Nach jeder Etappe: Notiz in `02 - Etappen/Etappe X - Name.md` (Vorlage: `Templates/Etappe.md`, mit Frontmatter, Lerneffekten, Verknüpfungen `[[...]]`)
- Bei Architektur-Entscheidung: zusätzlich Notiz in `03 - Entscheidungen/` (Vorlage: `Templates/Entscheidung.md`)
- Bei Bug: Notiz in `04 - Bugs & Lerneffekte/` (Vorlage: `Templates/Bug-Lerneffekt.md`)
- SICHERHEIT: bestehende Notizen NIE überschreiben oder löschen — nur ergänzen, bei Konflikt nachfragen. Dateipfade doppelt prüfen.

### Feste Projekt-Regeln
- Sprache: Deutsch (UI, Kommentare, Kommunikation)
- Design: Premium Dark Mode + Gold-Akzente (#D4AF37), Logo Hexagon-G (Variante 3)
- Mobile-tauglich als Standard
- Keine Template Literals in JSX-Attributen
- P/L-Anzeige in EUR
- Hauptschritte einzeln bestätigen statt alles auf einmal

## Tech-Stack
- Next.js 14.2.15 + TypeScript + Tailwind CSS
- Supabase (Postgres + Auth + Storage, EU-Frankfurt Region)
- Vercel auto-deployment vom GitHub main-branch
- Recharts für Charts, Lucide-React für Icons
- lightweight-charts + TwelveData API für TradingView-Charts
- react-confetti (6.x) für Konfetti-Overlay
- Vitest 2.x + jsdom 25.x für Unit-Tests

## Wichtige URLs
- Production: https://goldledger-fi24.vercel.app
- GitHub: https://github.com/tzhxpps2gx-ai/goldledger
- Supabase: Frankfurt-Projekt "goldledger" (Free Tier)

## Erledigte Etappen
- **Etappen 1–10:** Foundation — Auth, Dashboard, Trade-CRUD, P/L EUR, Logo, Mobile-Nav, simple TradeChart
- **Etappe 11:** Interaktive Features — Calendar-Modal mit Day-Drilldown, Trade-List mit Live-Filter, flexible TradeChart
- **Etappe 12:** TradingView-Chart pro Trade (lightweight-charts + TwelveData API)
- **Etappe 13:** Tag-System — Zuweisung, Anzeige, Filter
- **Etappe 14:** Tag-Management in Settings + Tag-Stats in Analytics
- **Etappe 15:** Goals-System — täglich/wöchentlich/monatlich + Custom, mit Dashboard-Widget
- **Etappe 16:** User-Preferences in DB (statt localStorage) + Konfetti bei Goal-Erreichung + Streak-Tracking
- **Etappe 17:** MT5 Trade-Import (HTML/CSV, client-seitig, mit Duplicate-Detection)
- **Etappe 18:** Erweiterte Analytics — Zeit-Heatmap + Setup-Stats + Insights-Cards
- **Etappe 19:** Reviews-System — Wochen-/Monatsreviews mit geführten Fragen, Auto-Stats-Sidebar, Trade-Verlinkung via #ID
- **Etappe 20:** Pre-Trading-Checklist (8 Default-Items inkl. News-Check) + Disziplin-Score (Dashboard-Widget + Korrelationsanalyse in Analytics)
- **Etappe 21:** ForexFactory News-Integration — /news-Seite, NextNewsWidget, NewsWarningModal beim Trade-Anlegen, News-Status in Checklist, News-Preferences in Settings
- **Etappe 22:** Multi-Account-Management — Live/Demo/Prop-Typ, Archivierung statt Löschen, AccountSwitcher mit Type-Badges und Archiv-Sektion, Settings-Tab "Konten" mit vollem CRUD
- **Etappe 23:** Multi-Account-Vergleich in Analytics — neue Sektion "Konto-Vergleich" mit Win-Rate, Gesamt-P/L, Ø P/L pro Trade pro Konto; aktives Konto gold hervorgehoben; Bugfix: is_archived Filter in Analytics page

## Aktueller Stand
Etappe 23 abgeschlossen. Nächste Etappe noch offen.

## Wichtige Architektur-Entscheidungen
- **User-Preferences in profiles-Tabelle** — Spalten: `streak_mode`, `sound_enabled`, `active_account_id`, `celebrated_goal_ids`, `news_currencies`, `news_min_impact`, `news_warning_minutes` — nicht in localStorage
- **Keine Template-Literals in JSX-Attributen** — cn() oder String-Konkatenation verwenden
- **HTML-Entities statt Unicode-Escapes** — `&#246;` statt `ö` in JSX-Markup; aber Vorsicht: in JS-String-Expressions (`{"..."}`) werden Entities NICHT dekodiert — dort echte Unicode-Zeichen verwenden
- **Tag-System** für Trade-Klassifizierung statt freier Notizen-Suche
- **Pre-Trading-Checklist** mit selbst-definierbaren Items — KEIN harter Block bei niedriger Disziplin, nur Tracking
- **economic_news global** (nicht per User) — öffentliche Daten, RLS = authenticated can do all
- **ForexFactory-API stale-while-revalidate** — 1h Cache in DB; Fetch läuft server-seitig mit Browser-Headers (User-Agent + Referer), da nfs.faireconomy.media Vercel-IPs sonst blockiert
- **Importierte Trades zählen nicht zum Disziplin-Score** — faire Behandlung, da nachträglich keine Checklist möglich
- **Symbol-Normalisierung beim MT5-Import** — XAU-Varianten → XAUUSD
- **NewsWarningModal nur bei /trades/new** — nicht bei /trades/[id]/edit (kein unnötiger Friction bei Korrekturen)
- **Konten werden archiviert (soft-delete), nicht hart gelöscht** — Trades bleiben einsehbar. Hartes Löschen nur bei 0 Trades möglich.
- **Aktives Konto kann nicht archiviert werden** — Schutz davor, sich auszusperren. Letztes aktives Konto ebenfalls nicht archivierbar.
- **account_type IN ('live','demo','prop')** — CHECK-Constraint in DB; Farben konsistent: LIVE=grün, DEMO=blau, PROP=gold
- **macOS TCC/Sandbox blockiert alle Schreibzugriffe auf ~/Documents/goldledger** — Workaround: alle Dateiänderungen via `gh api repos/{REPO}/contents/{path} --method PUT --input tmpfile.json` mit base64-kodiertem Inhalt

## Database-Schema (Supabase, RLS überall aktiv)
12 Tabellen: `profiles`, `accounts`, `trades`, `tags`, `trade_tags`, `screenshots`, `goals`, `reviews`, `checklist_items`, `trade_checklist_completions`, `economic_news`

Wichtige Spalten / Hinweise:
- `economic_news`: id, external_id, event_datetime, currency, impact (low/medium/high), event_name, forecast, previous, actual, fetched_at; UNIQUE(event_datetime, currency, event_name)
- `profiles`: news_currencies text[] default '{"USD"}', news_min_impact text default 'medium', news_warning_minutes integer default 30
- `checklist_items`: "label" muss gequotet werden (reserviertes Wort in PostgreSQL)
- `trades`: checklist_used boolean default false
- `accounts`: account_type text CHECK IN ('live','demo','prop'), is_archived boolean default false, archived_at timestamptz nullable; Index auf (user_id, is_archived)

## Wichtige Routinen für Claude Code
Bei JEDER neuen Etappe, am Ende:
1. CLAUDE.md aktualisieren — Etappe-Liste, Architektur-Entscheidungen, Aktueller Stand
2. SQL-Migrationen NICHT selbst ausführen — dem User zeigen, er führt sie in Supabase aus
3. Hauptschritte einzeln bestätigen statt alles auf einmal
4. TypeScript-Check nach jeder Etappe: frischen Clone in /tmp, `npm install --legacy-peer-deps`, `npx tsc --noEmit`
5. TWELVEDATA_API_KEY nur server-side (Vercel Env Vars) — nie client-seitig

## Backlog / Spätere Ideen
- **Anti-News-Trade-Flag:** Bei "Trotzdem anlegen"-Klick im NewsWarningModal ein Flag setzen und in Analytics auswerten ob diese Trades schlechter performen
- **PDF-Export** der Reviews und Analytics
- **Disziplin-Score in Reviews** — Wochenscore direkt im Review-Header anzeigen
- **Trade-Templates** für schnelle Wiederholung typischer Setups
- ~~**Multi-Account-Vergleich** in Analytics~~ — erledigt in Etappe 23
- **Custom-Email-Absender** mit Resend (braucht eigene Domain)
- **iOS-App** via Capacitor
- **MT5 EA-Bridge** für Realtime-Trade-Sync
- MT5-Import testen — User muss noch Vantage-Portal auf Mac aufrufen und Export laden

## User-Vorlieben
- **Sprache:** Deutsch (UI + Kommunikation mit Claude)
- **Design:** Premium Dark Mode + Gold-Akzente (#D4AF37), Logo Hexagon-G (Variante 3) aktiv
- **Mobile-tauglich** — alle Seiten responsive
- **Strukturierte etappen-basierte Lieferung** bei größeren Features
- **Klare Schritt-für-Schritt-Anweisungen** bei SQL-Migrationen und Deployments
