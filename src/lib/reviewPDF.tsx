import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ReviewTemplate } from '@/lib/reviewTemplates';
import type { ReviewStats } from '@/lib/reviews';
import type { Review } from '@/lib/reviews';

const GOLD = '#D4AF37';
const BLACK = '#111827';
const GRAY = '#6B7280';
const LIGHT_GRAY = '#9CA3AF';
const BORDER = '#E5E7EB';
const SUCCESS = '#16a34a';
const DANGER = '#dc2626';

const S = StyleSheet.create({
  page: { padding: 50, backgroundColor: '#FFFFFF', fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  logo: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: GOLD, letterSpacing: 1.5 },
  periodBadge: { fontSize: 9, color: GRAY, marginTop: 3 },
  title: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: BLACK, marginBottom: 3 },
  dateRange: { fontSize: 10, color: GRAY, marginBottom: 18 },
  divider: { borderBottomWidth: 1, borderBottomColor: BORDER, marginBottom: 18 },
  sectionLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: LIGHT_GRAY, letterSpacing: 1, marginBottom: 10 },
  statsRow: { flexDirection: 'row', marginBottom: 22 },
  statBox: { flex: 1, paddingRight: 16, marginRight: 16, borderRightWidth: 1, borderRightColor: BORDER },
  statBoxLast: { flex: 1 },
  statName: { fontSize: 8, color: LIGHT_GRAY, marginBottom: 3 },
  statValue: { fontSize: 15, fontFamily: 'Helvetica-Bold' },
  positive: { color: SUCCESS },
  negative: { color: DANGER },
  neutral: { color: BLACK },
  questionBlock: { marginBottom: 18 },
  questionLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: GOLD, letterSpacing: 0.5, marginBottom: 5 },
  answerText: { fontSize: 10, color: '#374151', lineHeight: 1.65 },
  footer: { position: 'absolute', bottom: 28, left: 50, right: 50, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: LIGHT_GRAY },
});

function fmtCurrency(val: number, currency: string): string {
  try {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency, minimumFractionDigits: 2 }).format(val);
  } catch {
    return val.toFixed(2) + ' ' + currency;
  }
}

function fmtDate(s: string): string {
  try {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return s;
  }
}

type Props = {
  review: Review;
  stats: ReviewStats;
  template: ReviewTemplate;
  currency: string;
  periodLabel: string;
};

export function ReviewPDFDocument({ review, stats, template, currency, periodLabel }: Props) {
  const answers = review.answers ?? {};
  const filledQuestions = template.questions.filter((q) => (answers[q.key] ?? '').trim().length > 0);
  const generatedAt = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Document title={template.title + ' ' + periodLabel} author="GoldLedger">
      <Page size="A4" style={S.page}>
        {/* Header */}
        <View style={S.header}>
          <Text style={S.logo}>GOLDLEDGER</Text>
          <Text style={S.periodBadge}>{periodLabel}</Text>
        </View>

        {/* Title */}
        <Text style={S.title}>{template.title}</Text>
        <Text style={S.dateRange}>{fmtDate(review.period_start)} – {fmtDate(review.period_end)}</Text>
        <View style={S.divider} />

        {/* Stats */}
        <Text style={S.sectionLabel}>PERFORMANCE</Text>
        <View style={S.statsRow}>
          <View style={S.statBox}>
            <Text style={S.statName}>Total P/L</Text>
            <Text style={[S.statValue, stats.totalPnl >= 0 ? S.positive : S.negative]}>
              {stats.totalPnl >= 0 ? '+' : ''}{fmtCurrency(stats.totalPnl, currency)}
            </Text>
          </View>
          <View style={S.statBox}>
            <Text style={S.statName}>Trades</Text>
            <Text style={[S.statValue, S.neutral]}>{stats.tradeCount}</Text>
          </View>
          <View style={S.statBox}>
            <Text style={S.statName}>Win Rate</Text>
            <Text style={[S.statValue, S.neutral]}>{Math.round(stats.winRate)} %</Text>
          </View>
          <View style={S.statBoxLast}>
            <Text style={S.statName}>{'Ø'} R</Text>
            <Text style={[S.statValue, S.neutral]}>
              {stats.avgRMultiple != null ? stats.avgRMultiple.toFixed(2) + 'R' : '–'}
            </Text>
          </View>
        </View>
        <View style={S.divider} />

        {/* Questions */}
        {filledQuestions.length > 0 ? (
          filledQuestions.map((q) => (
            <View key={q.key} style={S.questionBlock}>
              <Text style={S.questionLabel}>{q.label.toUpperCase()}</Text>
              <Text style={S.answerText}>{(answers[q.key] ?? '').trim()}</Text>
            </View>
          ))
        ) : (
          <Text style={S.answerText}>Keine Antworten eingetragen.</Text>
        )}

        {/* Footer */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>GoldLedger – Persönliches Trading-Journal</Text>
          <Text style={S.footerText}>Erstellt am {generatedAt}</Text>
        </View>
      </Page>
    </Document>
  );
}
