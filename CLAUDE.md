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

## Aktueller Stand (Juni 2026)

Etappen 1–19 abgeschlossen (Auth, Dashboard, Trade-CRUD, Analytics, Tags, Ziele, Preferences, Streaks, Konfetti, MT5-Import, Erw. Analytics, Reviews).

Etappe 20 (Pre-Trading-Checklist + Disziplin-Score) — ABGESCHLOSSEN:
- Settings: Tab "Checklist" mit 8 Default-Items, inline Edit, Sort, Delete, Reset
- Trade-Form (new+edit): ChecklistSection mit Live-Score-Bar
- Dashboard: DisciplineScoreWidget (Score-Ring, Woche/Vorwoche/All-Time)
- Analytics: Sektion "Disziplin & Performance" (3 Buckets + Compliance-List)
- Score-Farben: <50% rot, 50-80% gelb, >80% grün

Etappe 21 (ForexFactory News-Integration) — ABGESCHLOSSEN:
- `src/lib/news/forexFactoryFetcher.ts`: fetchForexFactoryNews(), NewsEvent-Typ
- `src/lib/news/newsStatus.ts`: getNewsStatus(), formatTimeUntil()
- `src/app/api/news/route.ts`: GET /api/news mit 1h DB-Cache, upsert, Housekeeping
- `src/app/(app)/news/page.tsx` + `src/components/NewsClient.tsx`: News-Seite mit Datum/Impact/Currency-Filter
- `src/components/NewsWarningModal.tsx`: Bestätigungs-Modal beim Trade-Submit bei News im Warn-Zeitraum
- `src/components/NextNewsWidget.tsx`: Dashboard-Widget mit Countdown zur nächsten News
- `src/components/ChecklistSection.tsx`: News-Status-Anzeige unter News-Checklist-Item
- `src/components/NewsPreferences.tsx`: Settings-Sektion für News-Präferenzen
- Settings: neuer Tab "News" (Währungen, Impact, Warn-Zeitraum)
- Dashboard: NextNewsWidget unter DisciplineScoreWidget
- Navigation: "News"-Link (Newspaper-Icon) in AppShell
- Warning-Modal: NUR bei /trades/new, nicht bei /trades/[id]/edit
- ForexFactory-API: unofficial, defensiv programmiert (try-catch, 10s Timeout)

## Database-Schema (Supabase, RLS überall aktiv)
11 Tabellen: profiles, accounts, trades, tags, trade_tags, screenshots, goals, reviews, checklist_items, trade_checklist_completions, economic_news
- economic_news: id, external_id, event_datetime, currency, impact (low/medium/high), event_name, forecast, previous, actual, fetched_at; UNIQUE(event_datetime,currency,event_name); RLS: authenticated read
- profiles: neu news_currencies (text[], default '{"USD"}'), news_min_impact (text default 'medium'), news_warning_minutes (integer default 30)
- checklist_items: "label" (quoted, reserviertes Wort in Postgres)
- trades: checklist_used (boolean, default false)

## Wichtige Technische Details
- Datei-Struktur: src/app/(app)/... für Auth-Seiten, src/lib/ für Hilfsfunktionen
- Supabase Server/Client-Helper in src/lib/supabase/
- Zeitzone Europe/Berlin: toLocaleString("sv-SE", {timeZone:"Europe/Berlin"}) → YYYY-MM-DD
- Unicode-Escape-Sequenzen (\uXXXX) NICHT in JSX — HTML-Entities verwenden (&#NNNN;)
- Keine Template-Literals in JSX-Attributen — cn() oder Konkatenation
- TWELVEDATA_API_KEY nur server-side (Vercel Env Vars)
- Impact-Farben: rot=high, orange=medium, grau=low (konsistent überall)

## Roadmap
- Phase 3: PDF-Export, Disziplin-Score in Reviews integrieren
- Phase 4: Capacitor iOS-App, MT5-EA-Bridge für Realtime-Trade-Sync
- Offen: MT5-Import testen (User muss erst Vantage-Export laden)
