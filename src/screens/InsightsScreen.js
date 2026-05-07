import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { format, addMonths } from 'date-fns';

import { colors, radius, spacing, typography, shadow } from '../theme/theme';
import { useApp } from '../state/AppContext';
import { listGoals } from '../db/db';
import { formatAmount } from '../utils/currency';
import {
  categoryCompare,
  monthSpendCompare,
  savingsForecast,
  spikeAlerts,
} from '../utils/insights';
import { computeGoalProgress } from '../utils/goals';
import CompareBar from '../components/CompareBar';

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const { transactions, currency } = useApp();
  const [goals, setGoals] = useState([]);

  useEffect(() => { (async () => setGoals(await listGoals()))(); }, []);
  useFocusEffect(useCallback(() => { (async () => setGoals(await listGoals()))(); }, []));

  const compare    = useMemo(() => monthSpendCompare(transactions),  [transactions]);
  const cats       = useMemo(() => categoryCompare(transactions),    [transactions]);
  const spikes     = useMemo(() => spikeAlerts(transactions),        [transactions]);
  const forecast   = useMemo(() => savingsForecast(transactions),    [transactions]);

  const goalForecasts = useMemo(
    () => goals
      .map((g) => ({ goal: g, p: computeGoalProgress(g, transactions) }))
      .filter((x) => !x.p.complete)
      .sort((a, b) => (a.p.weeksLeft ?? 9999) - (b.p.weeksLeft ?? 9999))
      .slice(0, 3),
    [goals, transactions],
  );

  const thisLabel = format(new Date(), 'MMM');
  const lastLabel = format(addMonths(new Date(), -1), 'MMM');

  const deltaPct = compare.delta != null ? Math.round(compare.delta * 100) : null;
  const deltaUp = deltaPct != null && deltaPct > 0;
  const deltaColor = deltaPct == null ? colors.textMuted
    : deltaUp ? colors.danger
    : deltaPct < 0 ? colors.success
    : colors.textMuted;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingBottom: 120 + insets.bottom,
          paddingHorizontal: spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={typography.caption}>Insights</Text>
          <Text style={typography.h1}>Patterns & forecasts</Text>
        </View>

        <View style={[styles.heroCard, shadow.card]}>
          <Text style={typography.caption}>This month vs last</Text>
          <View style={styles.heroAmounts}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.display, { fontSize: 30 }]} numberOfLines={1}>
                {formatAmount(compare.thisTotal, currency, { compact: true })}
              </Text>
              <Text style={[typography.bodyMuted, { fontSize: 12 }]}>{thisLabel} spent</Text>
            </View>
            {deltaPct != null && (
              <View style={[styles.deltaBig, { backgroundColor: hexA(deltaColor, 0.16) }]}>
                <Ionicons
                  name={deltaUp ? 'arrow-up' : deltaPct < 0 ? 'arrow-down' : 'remove'}
                  size={14}
                  color={deltaColor}
                />
                <Text style={[typography.label, { color: deltaColor }]}>
                  {Math.abs(deltaPct)}%
                </Text>
              </View>
            )}
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={[typography.h3, { color: colors.textMuted }]} numberOfLines={1}>
                {formatAmount(compare.lastTotal, currency, { compact: true })}
              </Text>
              <Text style={[typography.bodyMuted, { fontSize: 12 }]}>{lastLabel} spent</Text>
            </View>
          </View>
          {deltaPct != null && (
            <Text style={[typography.bodyMuted, { fontSize: 13, marginTop: spacing.sm }]}>
              {deltaUp
                ? `You're spending ${Math.abs(deltaPct)}% more than ${lastLabel}.`
                : deltaPct < 0
                  ? `Nice — ${Math.abs(deltaPct)}% less than ${lastLabel}.`
                  : `On par with ${lastLabel}.`}
            </Text>
          )}
        </View>

        <SectionTitle icon="alert-circle" title="Spike alerts" hint="Last 7 days vs prior 4-week average" />
        {spikes.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[typography.bodyMuted, { marginLeft: spacing.sm }]}>
              Spending looks normal this week.
            </Text>
          </View>
        ) : (
          spikes.map((s) => (
            <View key={s.id} style={[styles.spikeCard, { borderColor: hexA(s.color, 0.4) }]}>
              <View style={[styles.iconWrap, { backgroundColor: hexA(s.color, 0.18) }]}>
                <Ionicons name={s.icon} size={18} color={s.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={typography.body}>
                  {s.newCategory
                    ? `New spending on ${s.label}`
                    : `You spent ${ratioLabel(s.ratio)} on ${s.label} this week`}
                </Text>
                <Text style={[typography.bodyMuted, { fontSize: 12 }]}>
                  {formatAmount(s.recent, currency, { compact: true })}
                  {!s.newCategory && ` vs avg ${formatAmount(s.baselineWeekly, currency, { compact: true })}/wk`}
                </Text>
              </View>
            </View>
          ))
        )}

        <SectionTitle icon="bar-chart" title="Category compare" hint={`${thisLabel} vs ${lastLabel}`} />
        <View style={styles.card}>
          {cats.rows.length === 0 ? (
            <Text style={typography.bodyMuted}>No category data yet.</Text>
          ) : (
            cats.rows.slice(0, 8).map((row) => (
              <CompareBar key={row.id} row={row} max={cats.max} currency={currency} />
            ))
          )}
        </View>

        <SectionTitle icon="trending-up" title="Saving forecast" hint="Based on the last 60 days" />
        <View style={[styles.card, shadow.card]}>
          <View style={styles.forecastRow}>
            <ForecastStat
              label="Per week"
              value={formatAmount(forecast.weeklyRate, currency, { compact: true })}
              accent={colors.gold}
            />
            <ForecastStat
              label="Per month"
              value={formatAmount(forecast.monthlyProjection, currency, { compact: true })}
              accent={colors.success}
            />
            <ForecastStat
              label="Per year"
              value={formatAmount(forecast.yearlyProjection, currency, { compact: true })}
              accent={colors.info}
            />
          </View>
          {forecast.weeklyRate <= 0 && (
            <Text style={[typography.bodyMuted, { fontSize: 13, marginTop: spacing.md }]}>
              Log your first save to unlock projections.
            </Text>
          )}
        </View>

        {goalForecasts.length > 0 && (
          <>
            <SectionTitle icon="flag" title="Goal ETAs" hint="At your current pace" />
            {goalForecasts.map(({ goal, p }) => (
              <View key={goal.id} style={styles.etaCard}>
                <Ionicons name="flag" size={16} color={colors.gold} />
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={typography.body} numberOfLines={1}>{goal.title}</Text>
                  <Text style={[typography.bodyMuted, { fontSize: 12 }]}>
                    {formatAmount(p.saved, currency, { compact: true })} of {formatAmount(p.target, currency, { compact: true })}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={typography.body}>
                    {p.weeksLeft != null ? `${p.weeksLeft}w` : '—'}
                  </Text>
                  <Text style={[typography.bodyMuted, { fontSize: 11 }]}>
                    {p.eta ? format(new Date(p.eta), 'MMM d') : 'save more'}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function ratioLabel(r) {
  if (r == null) return 'much more';
  if (r >= 3)   return `${Math.round(r)}× more`;
  if (r >= 2)   return `${r.toFixed(1)}× more`;
  return `${Math.round((r - 1) * 100)}% more`;
}

function SectionTitle({ icon, title, hint }) {
  return (
    <View style={styles.sectionTitle}>
      <Ionicons name={icon} size={14} color={colors.gold} style={{ marginRight: 6 }} />
      <Text style={typography.h3}>{title}</Text>
      {hint && <Text style={[typography.caption, { fontSize: 10, marginLeft: spacing.sm }]}>{hint}</Text>}
    </View>
  );
}

function ForecastStat({ label, value, accent }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.dot, { backgroundColor: accent }]} />
      <Text style={[typography.caption, { fontSize: 10 }]}>{label}</Text>
      <Text style={[typography.body, { marginTop: 2 }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function hexA(hex, alpha) {
  const h = hex.replace('#', '');
  const i = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(i >> 16) & 255}, ${(i >> 8) & 255}, ${i & 255}, ${alpha})`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { marginBottom: spacing.lg },
  heroCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroAmounts: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  deltaBig: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    gap: 4,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
  },
  spikeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forecastRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  etaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
});
