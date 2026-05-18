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
- AccountSwitcher (localStorage-basiert)
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
- Settings-Seite: Tab-Navigation (Tags aktiv / Konto + Profil als Placeholder)
- TagPerformanceClient: sortierbare Stat-Karten (P/L, Win-Rate, Ø R, Trades) mit P/L-Balken
- Analytics-Seite: serverseitige Aggregation geschlossener Trades → Tag-Statistiken

## Database-Schema (Supabase, RLS überall aktiv)
8 Tabellen: profiles, accounts, trades, tags, trade_tags, screenshots, goals, reviews
- Alle haben user_id FK + RLS-Policies
- trades hat exchange_rate-Spalte (default 1.0) für EUR/USD-Konvertierung
- Storage-Bucket "screenshots" für Trade-Bilder (RLS aktiv)
- Auto-Profile-Trigger bei auth.users insert

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

## Roadmap weitere Phasen
- Phase 2: Vantage MT5 CSV/HTML Import, Goals-System, Wöchentliche/Monatliche Reviews
- Phase 3: Pre-Trading-Checkliste, Disziplin-Score, PDF-Export
- Phase 4: Capacitor iOS-App, MT5-EA-Bridge für Realtime-Trade-Sync
