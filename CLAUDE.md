# GoldLedger — Personal Trading Journal

## Projekt-Kontext
GoldLedger ist ein persönliches Trading-Journal für XAUUSD (Gold) Daytrading auf Vantage.
User: Solo-Trader in Deutschland, EUR-Konto, 2–5 Trades/Tag, 5 Tage/Woche.
User hat KEINE Coding-Erfahrung — arbeitet mit Claude Code.

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

## Aktueller Stand
Etappe 21 abgeschlossen. Nächste Etappe noch offen.

## Wichtige Architektur-Entscheidungen
- **User-Preferences in profiles-Tabelle** — Spalten: `streak_mode`, `sound_enabled`, `active_account_id`, `celebrated_goal_ids`, `news_currencies`, `news_min_impact`, `news_warning_minutes` — nicht in localStorage
- **Keine Template-Literals in JSX-Attributen** — cn() oder String-Konkatenation verwenden
- **HTML-Entities statt Unicode-Escapes** — `&#246;` statt `\u00f6` in JSX-Markup; aber Vorsicht: in JS-String-Expressions (`{"..."}`) werden Entities NICHT dekodiert — dort echte Unicode-Zeichen verwenden
- **Tag-System** für Trade-Klassifizierung statt freier Notizen-Suche
- **Pre-Trading-Checklist** mit selbst-definierbaren Items — KEIN harter Block bei niedriger Disziplin, nur Tracking
- **economic_news global** (nicht per User) — öffentliche Daten, RLS = authenticated can do all
- **ForexFactory-API stale-while-revalidate** — 1h Cache in DB; Fetch läuft server-seitig mit Browser-Headers (User-Agent + Referer), da nfs.faireconomy.media Vercel-IPs sonst blockiert
- **Importierte Trades zählen nicht zum Disziplin-Score** — faire Behandlung, da nachträglich keine Checklist möglich
- **Symbol-Normalisierung beim MT5-Import** — XAU-Varianten → XAUUSD
- **NewsWarningModal nur bei /trades/new** — nicht bei /trades/[id]/edit (kein unnötiger Friction bei Korrekturen)
- **macOS TCC/Sandbox blockiert alle Schreibzugriffe auf ~/Documents/goldledger** — Workaround: alle Dateiänderungen via `gh api repos/{REPO}/contents/{path} --method PUT --input tmpfile.json` mit base64-kodiertem Inhalt

## Database-Schema (Supabase, RLS überall aktiv)
12 Tabellen: `profiles`, `accounts`, `trades`, `tags`, `trade_tags`, `screenshots`, `goals`, `reviews`, `checklist_items`, `trade_checklist_completions`, `economic_news`

Wichtige Spalten / Hinweise:
- `economic_news`: id, external_id, event_datetime, currency, impact (low/medium/high), event_name, forecast, previous, actual, fetched_at; UNIQUE(event_datetime, currency, event_name)
- `profiles`: news_currencies text[] default '{"USD"}', news_min_impact text default 'medium', news_warning_minutes integer default 30
- `checklist_items`: "label" muss gequotet werden (reserviertes Wort in PostgreSQL)
- `trades`: checklist_used boolean default false

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
- **Multi-Account-Vergleich** in Analytics
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
