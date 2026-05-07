import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  endOfMonth,
  format,
  isSameDay,
  isToday,
  isYesterday,
  startOfMonth,
} from 'date-fns';

import { colors, radius, spacing, typography, shadow } from '../theme/theme';
import { useApp } from '../state/AppContext';
import { formatAmount } from '../utils/currency';
import { sumExpenses, sumSavings } from '../utils/aggregations';
import TransactionRow from '../components/TransactionRow';
import MonthSwitcher from '../components/MonthSwitcher';
import Heatmap from '../components/Heatmap';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { transactions, wallets, currency } = useApp();

  const [mode, setMode] = useState('heatmap');
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(null);

  const walletNameById = useMemo(
    () => wallets.reduce((acc, w) => ((acc[w.id] = w.name), acc), {}),
    [wallets],
  );

  const monthFrom = useMemo(() => startOfMonth(month).getTime(), [month]);
  const monthTo   = useMemo(() => endOfMonth(month).getTime(),   [month]);

  const monthTx = useMemo(
    () => transactions.filter((t) => t.occurred_at >= monthFrom && t.occurred_at <= monthTo),
    [transactions, monthFrom, monthTo],
  );

  const totalSpent = useMemo(() => sumExpenses(monthTx, monthFrom, monthTo), [monthTx, monthFrom, monthTo]);
  const totalSaved = useMemo(() => sumSavings(monthTx, monthFrom, monthTo), [monthTx, monthFrom, monthTo]);
  const txCount = monthTx.length;

  const daySpend = useMemo(() => {
    const map = {};
    for (const t of monthTx) {
      if (t.kind !== 'expense') continue;
      const key = format(new Date(t.occurred_at), 'yyyy-MM-dd');
      map[key] = (map[key] || 0) + t.amount;
    }
    return map;
  }, [monthTx]);

  const dayTx = useMemo(() => {
    if (!selectedDate) return [];
    return monthTx.filter((t) => isSameDay(new Date(t.occurred_at), selectedDate));
  }, [monthTx, selectedDate]);

  const grouped = useMemo(() => groupByDay(monthTx), [monthTx]);

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
          <View>
            <Text style={typography.caption}>History</Text>
            <Text style={typography.h1}>Your money map</Text>
          </View>
          <View style={styles.toggle}>
            <ToggleBtn
              icon="grid"
              active={mode === 'heatmap'}
              onPress={() => setMode('heatmap')}
            />
            <ToggleBtn
              icon="list"
              active={mode === 'list'}
              onPress={() => setMode('list')}
            />
          </View>
        </View>

        <MonthSwitcher value={month} onChange={(d) => { setMonth(d); setSelectedDate(null); }} />

        <View style={styles.summaryRow}>
          <SummaryCard label="Spent"  value={formatAmount(totalSpent, currency, { compact: true })} accent={colors.danger} />
          <SummaryCard label="Saved"  value={formatAmount(totalSaved, currency, { compact: true })} accent={colors.gold} />
          <SummaryCard label="Logged" value={String(txCount)} accent={colors.info} />
        </View>

        {mode === 'heatmap' ? (
          <>
            <View style={[styles.card, shadow.card]}>
              <Heatmap
                month={month}
                daySpend={daySpend}
                selectedDate={selectedDate}
                onSelectDate={(d) => setSelectedDate(prev => prev && isSameDay(prev, d) ? null : d)}
              />
            </View>

            <Text style={[typography.h3, { marginTop: spacing.lg, marginBottom: spacing.md }]}>
              {selectedDate
                ? format(selectedDate, 'EEEE, MMM d')
                : 'Tap a day to see what you spent'}
            </Text>

            {selectedDate && dayTx.length === 0 && (
              <View style={styles.empty}>
                <Text style={typography.bodyMuted}>Nothing logged on this day.</Text>
              </View>
            )}

            {selectedDate && dayTx.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                currency={currency}
                walletName={walletNameById[tx.wallet_id]}
              />
            ))}
          </>
        ) : (
          <>
            {grouped.length === 0 ? (
              <View style={[styles.empty, { marginTop: spacing.lg }]}>
                <Text style={typography.bodyMuted}>No transactions in {format(month, 'MMMM')}.</Text>
              </View>
            ) : (
              grouped.map((group) => (
                <View key={group.key} style={{ marginTop: spacing.lg }}>
                  <View style={styles.dayHeader}>
                    <Text style={typography.label}>{group.label}</Text>
                    <Text style={[typography.bodyMuted, { fontSize: 12 }]}>
                      −{formatAmount(group.spent, currency, { compact: true })}
                      {group.saved > 0 ? `  ·  +${formatAmount(group.saved, currency, { compact: true })} saved` : ''}
                    </Text>
                  </View>
                  {group.items.map((tx) => (
                    <TransactionRow
                      key={tx.id}
                      tx={tx}
                      currency={currency}
                      walletName={walletNameById[tx.wallet_id]}
                    />
                  ))}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function ToggleBtn({ icon, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.toggleBtn, active && styles.toggleBtnActive]}
    >
      <Ionicons name={icon} size={16} color={active ? colors.bg : colors.textMuted} />
    </Pressable>
  );
}

function SummaryCard({ label, value, accent }) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryDot, { backgroundColor: accent }]} />
      <Text style={[typography.caption, { fontSize: 10 }]}>{label}</Text>
      <Text style={[typography.body, { marginTop: 2 }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function groupByDay(txs) {
  const map = new Map();
  for (const t of txs) {
    const key = format(new Date(t.occurred_at), 'yyyy-MM-dd');
    if (!map.has(key)) map.set(key, { key, date: new Date(t.occurred_at), items: [], spent: 0, saved: 0 });
    const g = map.get(key);
    g.items.push(t);
    if (t.kind === 'expense') g.spent += t.amount;
    if (t.kind === 'savings') g.saved += t.amount;
  }
  const groups = Array.from(map.values()).sort((a, b) => b.date - a.date);
  for (const g of groups) {
    if (isToday(g.date))      g.label = 'Today';
    else if (isYesterday(g.date)) g.label = 'Yesterday';
    else g.label = format(g.date, 'EEE, MMM d');
  }
  return groups;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  toggleBtn: {
    width: 36,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: colors.gold,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
});
