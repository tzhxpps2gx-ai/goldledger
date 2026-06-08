import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import { ReviewPDFDocument } from '@/lib/reviewPDF';
import { TEMPLATES } from '@/lib/reviewTemplates';
import { calculateReviewStats, getPeriodLabel } from '@/lib/reviews';
import { getUserPreferences } from '@/lib/getUserPreferences';
import type { Review, ReviewTrade } from '@/lib/reviews';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { data: review, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !review || review.status !== 'submitted') {
    return new Response('Not Found', { status: 404 });
  }

  const r = review as Review;

  const userPreferences = await getUserPreferences();
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, currency')
    .eq('is_archived', false);
  const account = accounts?.find((a) => a.id === userPreferences.active_account_id) ?? accounts?.[0];
  const currency = account?.currency ?? 'EUR';

  let trades: ReviewTrade[] = [];
  if (account) {
    const { data } = await supabase
      .from('trades')
      .select('id, symbol, direction, pnl_currency, r_multiple, entry_time, exit_time, status')
      .eq('account_id', account.id)
      .gte('exit_time', r.period_start + 'T00:00:00')
      .lte('exit_time', r.period_end + 'T23:59:59')
      .eq('status', 'closed');
    trades = (data ?? []) as ReviewTrade[];
  }

  const stats = calculateReviewStats(trades, r.period_start, r.period_end);
  const template = TEMPLATES[r.period_type] ?? TEMPLATES.weekly;
  const periodLabel = getPeriodLabel(r.period_type, r.period_end);

  const buffer = await renderToBuffer(
    React.createElement(ReviewPDFDocument, { review: r, stats, template, currency, periodLabel })
  );

  const safeName = 'GoldLedger-' + periodLabel.replace(/\s*·\s*/g, '-').replace(/\s+/g, '-') + '.pdf';

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="' + safeName + '"',
    },
  });
}
