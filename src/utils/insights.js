import { addMonths, endOfMonth, startOfMonth, subDays } from 'date-fns';

import { getCategory } from './categories';

const DAY = 24 * 60 * 60 * 1000;

export function monthSpendCompare(transactions, ref = new Date()) {
  const thisFrom = startOfMonth(ref).getTime();
  const thisTo   = endOfMonth(ref).getTime();
  const lastFrom = startOfMonth(addMonths(ref, -1)).getTime();
  const lastTo   = endOfMonth(addMonths(ref, -1)).getTime();

  const sum = (from, to) => transactions
    .filter((t) => t.kind === 'expense' && t.occurred_at >= from && t.occurred_at <= to)
    .reduce((s, t) => s + t.amount, 0);

  const thisTotal = sum(thisFrom, thisTo);
  const lastTotal = sum(lastFrom, lastTo);
  const delta = lastTotal > 0 ? (thisTotal - lastTotal) / lastTotal : null;

  return { thisTotal, lastTotal, delta };
}

export function categoryCompare(transactions, ref = new Date()) {
  const thisFrom = startOfMonth(ref).getTime();
  const thisTo   = endOfMonth(ref).getTime();
  const lastFrom = startOfMonth(addMonths(ref, -1)).getTime();
  const lastTo   = endOfMonth(addMonths(ref, -1)).getTime();

  const bucket = (from, to) => {
    const m = {};
    for (const t of transactions) {
      if (t.kind !== 'expense') continue;
      if (t.occurred_at < from || t.occurred_at > to) continue;
      m[t.category] = (m[t.category] || 0) + t.amount;
    }
    return m;
  };

  const cur  = bucket(thisFrom, thisTo);
  const prev = bucket(lastFrom, lastTo);

  const ids = new Set([...Object.keys(cur), ...Object.keys(prev)]);
  const rows = Array.from(ids).map((id) => {
    const cat = getCategory(id);
    return {
      id,
      label: cat.label,
      color: cat.color,
      icon: cat.icon,
      current: cur[id] || 0,
      previous: prev[id] || 0,
    };
  });

  const max = rows.reduce((m, r) => Math.max(m, r.current, r.previous), 0);
  rows.sort((a, b) => b.current - a.current);
  return { rows, max };
}

export function spikeAlerts(transactions, ref = new Date(), { multiplier = 1.6, minAmount = 200 } = {}) {
  const now = ref.getTime();
  const last7From  = now - 7  * DAY;
  const prior28From = now - 35 * DAY;
  const prior28To   = now - 7  * DAY - 1;

  const recent = {};
  const baseline = {};

  for (const t of transactions) {
    if (t.kind !== 'expense') continue;
    if (t.occurred_at >= last7From && t.occurred_at <= now) {
      recent[t.category] = (recent[t.category] || 0) + t.amount;
    } else if (t.occurred_at >= prior28From && t.occurred_at <= prior28To) {
      baseline[t.category] = (baseline[t.category] || 0) + t.amount;
    }
  }

  const out = [];
  for (const id of Object.keys(recent)) {
    const cat = getCategory(id);
    const recentAmt = recent[id];
    if (recentAmt < minAmount) continue;

    const baselineWeekly = (baseline[id] || 0) / 4;
    if (baselineWeekly <= 0) {
      if (recentAmt >= minAmount * 2) {
        out.push({
          id,
          label: cat.label,
          color: cat.color,
          icon: cat.icon,
          recent: recentAmt,
          baselineWeekly,
          ratio: null,
          newCategory: true,
        });
      }
      continue;
    }

    const ratio = recentAmt / baselineWeekly;
    if (ratio >= multiplier) {
      out.push({
        id,
        label: cat.label,
        color: cat.color,
        icon: cat.icon,
        recent: recentAmt,
        baselineWeekly,
        ratio,
        newCategory: false,
      });
    }
  }

  out.sort((a, b) => (b.ratio || Infinity) - (a.ratio || Infinity));
  return out;
}

export function savingsForecast(transactions, ref = new Date(), { windowDays = 60 } = {}) {
  const since = ref.getTime() - windowDays * DAY;
  const total = transactions
    .filter((t) => t.kind === 'savings' && t.occurred_at >= since)
    .reduce((s, t) => s + t.amount, 0);

  const weeks = windowDays / 7;
  const weeklyRate = total / weeks;
  const monthlyProjection = weeklyRate * (52 / 12);
  const yearlyProjection  = weeklyRate * 52;

  return {
    weeklyRate,
    monthlyProjection,
    yearlyProjection,
    totalInWindow: total,
    windowDays,
  };
}
