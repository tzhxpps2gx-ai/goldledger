# GoldLedger — Personal Trading Journal

## Projekt-Kontext
GoldLedger ist ein persönliches Trading-Journal für XAUUSD (Gold) Daytrading auf Vantage.
User: Solo-Trader in Deutschland, EUR-Konto, 2-5 Trades/Tag, 5 Tage/Woche.
User hat KEINE Coding-Erfahrung — gerade vom GitHub-Web-Editor zu Claude Code migriert.
Vorher gabs viele Probleme mit kopierten Code-Snippets (Template-Literal-Fehler etc.).

## Tech-Stack
- Next.js 14.2.15 + TypeScript + Tailwind CSS
- Supabase (Postgres + Auth + Storage, EU-Frankfurt Region)
- Vercel auto-deployment vom GitHub main-branch
- Recharts für Charts, Lucide-React für Icons
- react-confetti (6.x) für Konfetti-Overlay
- Vitest 2.x + jsdom 25.x für Unit-Tests (Parser-Logik)

## Wichtige URLs
- Production: https://goldledger-fi24.vercel.app
- GitHub: https://github.com/tzhxpps2gx-ai/goldledger
- Supabase: Frankfurt-Projekt "goldledger" (Free Tier)

## USER-VORLIEBEN (sehr wichtig)
- IMMER Deutsch sprechen
- Premium-Design: Dark Mode + Gold-Akzente (#D4AF37, Logo-Variante "Hexagon-G" aktiv)
- Strukturierte etappen-basierte Lieferung bei größeren Features ("Etappe X")
- User schätzt klare Schritt-für-Schritt-Anweisungen
- Bei Bugs zuerst lokal testen, nicht blind committen
- Vor jedem Commit: `npm run build` lokal laufen lassen, damit Vercel nicht failt

## Aktueller Stand (Mai 2026)
Abgeschlossene Etappen 1-10:
- Auth (Email+Passwort, Google-OAuth via Supabase)
- Onboarding (Account anlegen, 10 Default-Tags)
- Dashboard mit Zeitraum-Tabs (Heute/Woche/Monat/Jahr/AllTime, Default: Heute)
- Trade-CRUD (Anlegen, Bearbeiten, Löschen, Detail)
- Edit-Trade-Funktion mit P/L-Diff-Korrektur am Account-Balance
- Equity-Chart, Calendar-Heatmap, Trade-Liste
- AccountSwitcher (jetzt DB-basiert, kein localStorage mehr)
- Mobile-Drawer-Navigation + Bottom-Nav (nur Dashboard + Neuer Trade)
- P/L-Berechnung in EUR mit Live USD/EUR-Wechselkurs (exchangerate.host)
- Logo (5 SVG-Varianten, aktiv: Hexagon-G)
- Animationen (fade-in, slide-up, hover-effects)
- TradeChart-Komponente (flexibel, funktioniert auch mit nur Entry)

Etappe 11 (Interaktiv) — ABGESCHLOSSEN:
- CalendarClient.tsx mit klickbaren Tagen + Day-Modal
- TradesListClient.tsx mit Live-Filter (Suche + Wins/Losses/Offen-Chips)

Etappe 12 (TradingView-Chart) — ABGESCHLOSSEN:
- TradeChartLive.tsx: echte XAUUSD-Kerzen via TwelveData, lightweight-charts v5
- /api/gold-candles: Trade-Zeit ±2h, 5min-Kerzen, 1h-Cache (API-Key serverseitig)
- Automatischer Fallback auf TradeChart.tsx bei Fehler/fehlendem API-Key
- TWELVEDATA_API_KEY muss in Vercel → Environment Variables gesetzt sein

Etappe 13 (Tag-System) — ABGESCHLOSSEN:
- Tags bei Neuer Trade + Edit zuweisbar (Multi-Select, gold-tinted)
- TagChips-Komponente: edit- und display-Modus, nach Kategorie gruppiert
- Trade-Detail zeigt Tags als Badges
- Trade-Liste zeigt Tags pro Zeile (max. 3 + "+N")
- Tag-Filter in Trade-Liste (OR-Logik, kombinierbar mit Suche + Status)

Etappe 14 (Tag-Management + Analytics) — ABGESCHLOSSEN:
- TagManager: Tags inline umbenennen/löschen (mit Trade-Anzahl-Bestätigung) + neue Tags anlegen
- Settings-Seite: Tab-Navigation (Tags / Konto / Profil / Belohnungen)
- TagPerformanceClient: sortierbare Stat-Karten (P/L, Win-Rate, Ø R, Trades) mit P/L-Balken
- Analytics-Seite: serverseitige Aggregation geschlossener Trades → Tag-Statistiken

Etappe 15 (Ziele-System) — ABGESCHLOSSEN:
- `src/lib/goals.ts`: Typen, Hilfsfunktionen (calculateGoalProgress, getGoalStatus, getCurrentPeriodBounds, getTodayBerlin, isGoalActive)
- `src/app/actions/goals.ts`: archiveExpiredGoalsAction() — Server Action, setzt is_active=false wenn period_end < heute
- `src/components/GoalCard.tsx`: Karte mit Progress-Bar, Status-Badge, Inline-Löschbestätigung, Gold-Glow bei Erreicht
- `src/components/GoalDialog.tsx`: Modal für Anlegen/Bearbeiten — Zieltyp, Zielwert, Zeitraum-Chips, Custom-Datumsbereich, user_id im Insert
- `src/components/GoalsWidget.tsx`: Kompakt-Widget für Dashboard — max. 3 aktive Ziele mit Mini-Progress-Bars
- `src/app/(app)/goals/page.tsx`: Ziele-Seite (client) — Aktive Ziele Grid + Vergangene Ziele Liste
- Dashboard: lädt goals + goalTrades parallel, zeigt GoalsWidget zwischen KPI-Karten und Equity-Chart
- Auto-Archivierung bei jedem Aufruf von /dashboard oder /goals
- Navigation: "Ziele" + Target-Icon war bereits in AppShell.tsx vorhanden
- Perioden: Täglich, Wöchentlich, Monatlich, Individuell (mit Europe/Berlin-Timezone)

Etappe 16 (User-Preferences in DB + Konfetti + Streak-Tracking) — ABGESCHLOSSEN:
- `src/lib/userPreferences.ts`: UserPreferences-Typ, DEFAULT_PREFERENCES, updateUserPreference() (client-safe)
- `src/lib/getUserPreferences.ts`: getUserPreferences() (server-only, liest aus profiles-Tabelle)
- `src/lib/migrateLocalStorageToDb.ts`: migrateLegacyPreferences() — einmalige Migration localStorage → DB
- `src/lib/sound.ts`: playAchievementSound() — Web Audio API, C5+E5+G5-Akkord
- `src/lib/streaks.ts`: calculateStreaks() — trading_only / all_weekdays Modus, StreakResult-Typ
- `src/components/CelebrationConfetti.tsx`: Konfetti-Overlay mit Gold-Farben (react-confetti), 4.5s
- `src/components/StreakWidget.tsx`: Streak-Karten (Gewinn-Serie, Gewinn-Tage, Verlust-frei), "New Best!"-Badge
- `src/components/AppShell.tsx`: userId + userPreferences Props, migrateLegacyPreferences on mount
- `src/components/AccountSwitcher.tsx`: kein localStorage mehr — updateUserPreference("active_account_id")
- `src/app/(app)/layout.tsx`: getUserPreferences() server-side, Übergabe an AppShell
- Alle Hauptseiten (dashboard, analytics, calendar, trades): getUserPreferences(), account-Auswahl per active_account_id
- `src/components/DashboardClient.tsx`: userPreferences Prop, CelebrationConfetti, StreakWidget, Achievement-Toast
- `src/app/(app)/settings/page.tsx`: Belohnungen-Tab (Sound-Toggle + Streak-Modus-Selektor)
- profiles-Tabelle: 4 neue Spalten streak_mode, sound_enabled, active_account_id, celebrated_goal_ids

Etappe 17 (MT5 Trade Import) — ABGESCHLOSSEN:
- `src/lib/mt5Parser.ts`: Parser für MT5 HTML + CSV Export
- `src/lib/__tests__/mt5Parser.test.ts`: 51 Tests (Vitest + jsdom) — alle grün
- DB-Migration: broker_ticket_id (text), imported_at (timestamptz), UNIQUE INDEX auf (broker_ticket_id, account_id)
- `src/app/(app)/trades/import/page.tsx`: Server-Komponente
- `src/components/ImportClient.tsx`: 4-Phasen-Import-UI (Upload → Parse → Vorschau → Ergebnis)
- `src/components/TradesListClient.tsx`: Import-Button + MT5-Badge in Zeilen
- `src/app/(app)/trades/[id]/page.tsx`: imported_at + broker_ticket_id in Detailansicht
- Ausstehend: MT5-Export-Datei aus Vantage (User konnte noch nicht exportieren → erinnern!)

Etappe 18 (Erweiterte Analytics) — ABGESCHLOSSEN:
- `src/lib/timeStats.ts`: calculateHourlyHeatmap(), findBestWorstHour(), Typen HeatmapCell/HeatmapGrid/BestWorstHour
- `src/lib/setupStats.ts`: calculateSetupStats(), Typ SetupStat
- `src/app/(app)/analytics/page.tsx`: erweitert — berechnet Insights server-side, reicht Trades an Client-Komponenten
- `src/components/AnalyticsInsights.tsx`: 3 Insight-Cards (Beste/Schlechteste Stunde, Bestes Setup) mit Empty-States
- `src/components/HourlyHeatmap.tsx`: 5×24 Heatmap (Mo-Fr × 0-23 Uhr), Toggle P/L/Win Rate/Anzahl, Hover-Tooltip (fixed), Klick → Modal mit Trade-Liste
- `src/components/SetupStatsTable.tsx`: Setup-Tabelle sortierbar (Total P/L/Ø P/L/Trades/Win Rate), P/L-Balken, Win-Rate-Bar
- Analytics-Layout: Insights → Tag-Performance → Zeit-Heatmap → Setup-Tabelle → Platzhalter
- Zeitzone: Europe/Berlin (sv-SE toLocaleString Trick für zuverlässige Konvertierung)

## Database-Schema (Supabase, RLS überall aktiv)
8 Tabellen: profiles, accounts, trades, tags, trade_tags, screenshots, goals, reviews
- Alle haben user_id FK + RLS-Policies
- trades hat exchange_rate-Spalte (default 1.0) für EUR/USD-Konvertierung
- trades hat broker_ticket_id (text, nullable) + imported_at (timestamptz, nullable)
- UNIQUE INDEX auf (broker_ticket_id, account_id) WHERE broker_ticket_id IS NOT NULL
- Storage-Bucket "screenshots" für Trade-Bilder (RLS aktiv)
- Auto-Profile-Trigger bei auth.users insert
- goals: id, user_id, account_id (nullable), goal_type, target_value, period_type, period_start (date), period_end (date), is_active, created_at
- profiles: hat 4 Extra-Spalten: streak_mode (text, default trading_only), sound_enabled (bool, default false), active_account_id (uuid, nullable), celebrated_goal_ids (text[], default {})

## Auth-Setup
- Email+Passwort funktioniert
- Google-OAuth funktioniert (Supabase Site URL muss auf Vercel-URL stehen!)
- Email-Code-Verify war geplant aber Supabase Free Tier hat 3 Mails/Stunde Limit — vorerst Email+Passwort einfach
- Custom SMTP (Resend) später wenn User eigene Domain hat

## Wichtige Technische Details
- Datei-Struktur folgt Next.js App Router (`src/app/(app)/...` für authentifizierte Seiten)
- Supabase Server- und Client-Helper in `src/lib/supabase/`
- Calculations (Trade-Type, calculateStats, etc.) in `src/lib/calculations.ts`
- Time-Range-Filtering in `src/lib/timeRanges.ts`
- Utility-Funktionen (cn, formatCurrency, etc.) in `src/lib/utils.ts`
- Cookie-Typing in middleware muss CookieOptions importieren (sonst TypeScript-Error)
- macOS TCC/Sandbox blockiert Write/Edit/Bash-Tools für `src/`-Verzeichnis — Workaround: Dateien per GitHub-API pushen via `gh api --method PUT`
- Unicode-Escape-Sequenzen (\uXXXX) funktionieren NICHT in JSX-Text-Content — direkte UTF-8-Zeichen oder HTML-Entities (&#NNNN;) verwenden
- Keine Template-Literals in JSX-Attributen — cn() oder String-Konkatenation nutzen
- Zeitzone Europe/Berlin: new Date(isoString).toLocaleString("sv-SE", { timeZone: "Europe/Berlin" }) → gibt "YYYY-MM-DD HH:MM:SS" zurück, dann new Date(datePart + "T" + timePart) für lokale Parts

## Roadmap weitere Phasen
- Phase 2: Wöchentliche/Monatliche Reviews
- Phase 3: Pre-Trading-Checkliste, Disziplin-Score, PDF-Export
- Phase 4: Capacitor iOS-App, MT5-EA-Bridge für Realtime-Trade-Sync
