# GoldLedger — Personal Trading Journal

## Projekt-Kontext
GoldLedger ist ein persönliches Trading-Journal für XAUUSD (Gold) Daytrading auf Vantage.
User: Solo-Trader in Deutschland, EUR-Konto, 2-5 Trades/Tag, 5 Tage/Woche.
User hat KEINE Coding-Erfahrung — gerade vom GitHub-Web-Editor zu Claude Code migriert.

## Tech-Stack
- Next.js 14.2.15 + TypeScript + Tailwind CSS
- Supabase (Postgres + Auth + Storage, EU-Frankfurt Region)
- Vercel auto-deployment vom GitHub main-branch
- Recharts für Charts, Lucide-React für Icons
- react-confetti (6.x) für Konfetti-Overlay
- Vitest 2.x + jsdom 25.x für Unit-Tests

## Wichtige URLs
- Production: https://goldledger-fi24.vercel.app
- GitHub: https://github.com/tzhxpps2gx-ai/goldledger
- Supabase: Frankfurt-Projekt "goldledger" (Free Tier)

## USER-VORLIEBEN (sehr wichtig)
- IMMER Deutsch sprechen
- Premium-Design: Dark Mode + Gold-Akzente (#D4AF37, Logo-Variante "Hexagon-G" aktiv)
- Strukturierte etappen-basierte Lieferung bei größeren Features ("Etappe X")
- SQL-Migrations NICHT selbst ausführen — dem User zeigen, er führt sie in Supabase aus
- macOS TCC/Sandbox blockiert Write/Edit/Bash-Tools für src/ — Workaround: GitHub-API push

## Abgeschlossene Etappen

### Etappen 1–19
Auth, Dashboard, Trade-CRUD, Analytics, Tags, Ziele, Preferences, Streaks, Konfetti, MT5-Import, Erweiterte Analytics, Reviews.

### Etappe 20 — Pre-Trading-Checklist + Disziplin-Score
- Settings: Tab "Checklist" mit 8 Default-Items, inline Edit, Sort, Delete, Reset
- Trade-Form (new+edit): ChecklistSection mit Live-Score-Bar
- Dashboard: DisciplineScoreWidget (Score-Ring, Woche/Vorwoche/All-Time)
- Analytics: Sektion "Disziplin & Performance" (3 Buckets + Compliance-List)
- Score-Farben: <50% rot, 50–80% gelb, >80% grün

**Schema:** Neue Tabellen `checklist_items` und `trade_checklist_completions`; `trades.checklist_used` (boolean, default false).

### Etappe 21 — ForexFactory News-Integration
- `src/lib/news/forexFactoryFetcher.ts`: fetchForexFactoryNews(), NewsEvent-Typ; defensiv programmiert (try-catch, 10s Timeout)
- `src/lib/news/newsStatus.ts`: getNewsStatus(), formatTimeUntil()
- `src/app/api/news/route.ts`: GET /api/news mit 1h DB-Cache, upsert, 30-Tage-Housekeeping
- `src/app/(app)/news/page.tsx` + `src/components/NewsClient.tsx`: News-Seite mit Datum-, Impact- und Währungs-Filter
- `src/components/NewsWarningModal.tsx`: Bestätigungs-Modal beim Trade-Submit, wenn News im Warn-Zeitraum liegt — NUR bei /trades/new
- `src/components/NextNewsWidget.tsx`: Dashboard-Widget mit Countdown zur nächsten relevanten News
- `src/components/ChecklistSection.tsx`: News-Status-Zeile unter News-Checklist-Item (kein Auto-Tick)
- `src/components/NewsPreferences.tsx`: Währungs-Chips, Impact-Radio-Cards, Warn-Minuten-Selector
- Settings: neuer Tab "News"; Navigation: "News"-Link (Newspaper-Icon) in AppShell

**Schema:** Neue Tabelle `economic_news`; `profiles` um `news_currencies`, `news_min_impact`, `news_warning_minutes` erweitert.

## Database-Schema (Supabase, RLS überall aktiv)

11 Tabellen: `profiles`, `accounts`, `trades`, `tags`, `trade_tags`, `screenshots`, `goals`, `reviews`, `checklist_items`, `trade_checklist_completions`, `economic_news`

| Tabelle | Wichtige Spalten / Hinweise |
|---|---|
| `economic_news` | id, external_id, event_datetime, currency, impact (low/medium/high), event_name, forecast, previous, actual, fetched_at; UNIQUE(event_datetime,currency,event_name); RLS: authenticated read |
| `profiles` | news_currencies text[] default '{"USD"}', news_min_impact text default 'medium', news_warning_minutes integer default 30 |
| `checklist_items` | "label" muss gequotet werden (reserviertes Wort in Postgres) |
| `trades` | checklist_used boolean default false |

## Wichtige Technische Details
- Datei-Struktur: `src/app/(app)/...` für Auth-Seiten, `src/lib/` für Hilfsfunktionen
- Supabase Server/Client-Helper in `src/lib/supabase/`
- Zeitzone Europe/Berlin: `toLocaleString("sv-SE", {timeZone:"Europe/Berlin"})` → YYYY-MM-DD
- Unicode-Escape-Sequenzen (`\uXXXX`) NICHT in JSX — HTML-Entities verwenden (`&#NNNN;`)
- Keine Template-Literals in JSX-Attributen — `cn()` oder String-Konkatenation
- TWELVEDATA_API_KEY nur server-side (Vercel Env Vars)
- Impact-Farben: rot=high, orange=medium, grau=low (konsistent überall)
- ForexFactory-API ist unofficial — immer defensiv programmieren

## Nächste Schritte (geplant)

- PDF-Export der Trade-Statistiken und Reviews
- Disziplin-Score direkt in Reviews integrieren (Wochenscore im Review-Header)
- MT5-Import testen — User muss noch Vantage-Portal auf Mac aufrufen und Export laden
- Capacitor iOS-App für mobilen Zugriff
- MT5-EA-Bridge für Realtime-Trade-Sync
