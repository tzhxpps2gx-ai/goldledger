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

## Aktueller Stand (Mai 2026)

Etappen 1–16 abgeschlossen (Auth, Dashboard, Trade-CRUD, Analytics, Tags, Ziele, Preferences, Streaks, Konfetti).

Etappe 17 (MT5 Trade Import) — ABGESCHLOSSEN:
- Parser + 51 Tests, 4-Phasen-Import-UI, Duplicate Detection, MT5-Badge
- Ausstehend: MT5-Export aus Vantage (User konnte noch nicht exportieren → erinnern!)

Etappe 18 (Erweiterte Analytics) — ABGESCHLOSSEN:
- Zeit-Performance-Heatmap (5×24, Mo–Fr × 0–23 Uhr), Toggle P/L/Win Rate/Anzahl, Hover-Tooltip, Klick→Modal
- Setup-Performance-Tabelle (sortierbar), Insights-Cards (Beste/Schlechteste Stunde, Bestes Setup)
- Tag-Performance + Setup-Performance: zeigen nur gewählte Metrik mit ausführlicher Kontext-Zeile

Etappe 19 (Reviews-System) — ABGESCHLOSSEN:
- `src/lib/reviewTemplates.ts`: WEEKLY_TEMPLATE (7 Fragen) + MONTHLY_TEMPLATE (5 Fragen)
- `src/lib/reviews.ts`: Review-Typ, calculateReviewStats(), getCurrentPeriodBounds(), getPreviousPeriodBounds(), isReviewDue(), parseTradeReferences(), renderTextWithTradeLinks()
- `src/app/(app)/reviews/page.tsx`: Liste aller Reviews mit Buttons "Wochenreview" + "Monatsreview"
- `src/components/ReviewsListClient.tsx`: Filter-Tabs (Alle/Wochenreviews/Monatsreviews/Entwürfe), Review-Cards mit Period-Badge + Status-Badge + Vorschau
- `src/app/(app)/reviews/new/page.tsx`: Server-Komponente, lädt Trades+Stats für Zeitraum, übergibt an Editor
- `src/components/ReviewEditorClient.tsx`: 2-Spalten-Layout (Desktop: Form+Sidebar, Mobile: gestapelt+einklappbar), Auto-Save (1s Debounce), Lazy-Create beim ersten Speichern, Abschließen-Workflow mit Bestätigungsdialog, "Trade als #ID kopieren"-Button in Sidebar
- `src/app/(app)/reviews/[id]/page.tsx`: Draft→Editor, Submitted→Detailansicht mit Trade-Referenz-Links
- `src/components/ReviewReopenButton.tsx`: "Wieder öffnen" mit Inline-Bestätigung
- `src/components/ReviewDueBanner.tsx`: Dashboard-Banner wenn Review fällig (Sonntag/Montag für Weekly, 1.–3. für Monthly), dismissbar
- `src/components/AppShell.tsx`: "Reviews" + BookOpen-Icon in Desktop-Navigation
- `src/components/DashboardClient.tsx`: ReviewDueBanner eingebaut (über GoalsWidget)
- Trade-Verlinkung via #UUID-Pattern in Antworten, in Detailansicht als klickbare Links gerendert
- DB-Migration: period_type, period_start, period_end, status, answers (jsonb), submitted_at, updated_at + Index reviews_user_period

## Database-Schema (Supabase, RLS überall aktiv)
8 Tabellen: profiles, accounts, trades, tags, trade_tags, screenshots, goals, reviews
- reviews: id, user_id, period_type (weekly/monthly), period_start (date), period_end (date), status (draft/submitted), answers (jsonb), submitted_at (timestamptz), created_at, updated_at
- trades: exchange_rate, broker_ticket_id, imported_at
- profiles: streak_mode, sound_enabled, active_account_id, celebrated_goal_ids

## Wichtige Technische Details
- Datei-Struktur: src/app/(app)/... für Auth-Seiten, src/lib/ für Hilfsfunktionen
- Supabase Server/Client-Helper in src/lib/supabase/
- Zeitzone Europe/Berlin: toLocaleString("sv-SE", {timeZone:"Europe/Berlin"}) → YYYY-MM-DD HH:MM:SS
- Unicode-Escape-Sequenzen (\uXXXX) NICHT in JSX — HTML-Entities verwenden (&#NNNN;)
- Keine Template-Literals in JSX-Attributen — cn() oder Konkatenation
- TWELVEDATA_API_KEY nur server-side (Vercel Env Vars)

## Roadmap
- Phase 3: Pre-Trading-Checkliste, Disziplin-Score, PDF-Export
- Phase 4: Capacitor iOS-App, MT5-EA-Bridge für Realtime-Trade-Sync
- Offen: MT5-Import testen (User muss erst Vantage-Export laden)
