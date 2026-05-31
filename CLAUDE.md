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
- Wochen- und Monatsreviews, Auto-Save, Lazy-Create, Trade-Referenz-Links
- Dashboard-Banner wenn Review fällig (Sonntag/Montag für Weekly, 1.–3. für Monthly)
- "Reviews"-Tab in Navigation (BookOpen-Icon)

Etappe 20 (Pre-Trading-Checklist + Disziplin-Score) — ABGESCHLOSSEN:
- `src/lib/checklist.ts`: ChecklistItem-Typ, DEFAULT_CHECKLIST_ITEMS (8 Items), ensureDefaultChecklistItems()
- `src/lib/disciplineScore.ts`: calculateTradeScore, calculatePeriodScore, calculatePerItemCompliance, calculateScoreVsPnlCorrelation
- `src/app/actions/checklist.ts`: Server Actions für CRUD + saveTradeChecklistAction
- `src/components/ChecklistSection.tsx`: Checklist-Block für Trade-Formulare (Live-Score-Bar)
- `src/components/ChecklistManager.tsx`: Settings-Verwaltung mit Up/Down, Inline-Edit, Add, Reset
- `src/components/DisciplineScoreWidget.tsx`: Dashboard-Widget mit Score-Ring, Woche/Vorwoche/All-Time
- `src/components/DisciplineCorrelation.tsx`: 3 Buckets (Hoch/Mittel/Niedrig) mit P/L-Vergleich + Insight
- `src/components/ItemComplianceList.tsx`: Compliance-Tabelle sortiert nach schlechtester Rate
- Settings: neuer Tab "Checklist" (ist jetzt Default-Tab)
- Dashboard: DisciplineScoreWidget unter StreakWidget, über Equity-Chart
- Analytics: neue Sektion "Disziplin & Performance" mit Correlation + Compliance-List
- Trade-Form (new + edit): Checklist-Sektion zwischen Pre-Trade-Plan und Ausführung
- Trade-Detail: zeigt Checklist-Stand mit Score, oder "Jetzt nachpflegen"-Link
- Importierte Trades: "Importierter Trade — Checklist nicht verfügbar"
- Score-Farben: <50% rot, 50–80% gelb, >80% grün (konsistent überall)

## Database-Schema (Supabase, RLS überall aktiv)
10 Tabellen: profiles, accounts, trades, tags, trade_tags, screenshots, goals, reviews, checklist_items, trade_checklist_completions
- checklist_items: id, user_id, "label", description, sort_order, is_active, created_at, updated_at
- trade_checklist_completions: trade_id, item_id, is_checked (PK: trade_id+item_id)
- trades: neu checklist_used (boolean, default false)
- reviews: id, user_id, period_type, period_start, period_end, status, answers (jsonb), submitted_at, updated_at

## Wichtige Technische Details
- Datei-Struktur: src/app/(app)/... für Auth-Seiten, src/lib/ für Hilfsfunktionen
- Supabase Server/Client-Helper in src/lib/supabase/
- Zeitzone Europe/Berlin: toLocaleString("sv-SE", {timeZone:"Europe/Berlin"}) → YYYY-MM-DD HH:MM:SS
- Unicode-Escape-Sequenzen (\uXXXX) NICHT in JSX — HTML-Entities verwenden (&#NNNN;)
- Keine Template-Literals in JSX-Attributen — cn() oder Konkatenation
- TWELVEDATA_API_KEY nur server-side (Vercel Env Vars)
- checklist_items.label muss als "label" (gequotet) in SQL angesprochen werden (reserviertes Wort)

## Roadmap
- Phase 3: PDF-Export, Disziplin-Score in Reviews integrieren
- Phase 4: Capacitor iOS-App, MT5-EA-Bridge für Realtime-Trade-Sync
- Offen: MT5-Import testen (User muss erst Vantage-Export laden)
