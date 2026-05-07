import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { colors, radius, spacing, typography, shadow } from '../theme/theme';
import { useApp } from '../state/AppContext';
import { formatAmount } from '../utils/currency';
import {
  expensesByCategory,
  monthRange,
  sumExpenses,
  sumSavings,
  walletBalance,
} from '../utils/aggregations';
import RingChart from '../components/RingChart';
import WalletCard from '../components/WalletCard';
import TransactionRow from '../components/TransactionRow';
import CurrencyToggle from '../components/CurrencyToggle';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { ready, currency, setCurrency, wallets, transactions, bills } = useApp();

  const { from, to } = useMemo(() => monthRange(new Date()), []);

  const totalSpent  = useMemo(() => sumExpenses(transactions, from, to), [transactions, from, to]);
  const totalSaved  = useMemo(() => sumSavings(transactions, from, to),  [transactions, from, to]);
  const byCategory  = useMemo(() => expensesByCategory(transactions, from, to), [transactions, from, to]);
  const totalAcross = useMemo(
    () => wallets.reduce((s, w) => s + walletBalance(w, transactions), 0),
    [wallets, transactions],
  );
  const recent = useMemo(() => transactions.slice(0, 5), [transactions]);
  const walletNameById = useMemo(
    () => wallets.reduce((acc, w) => ((acc[w.id] = w.name), acc), {}),
    [wallets],
  );

  const monthName = new Date().toLocaleString('default', { month: 'long' });

  const billsThisMonth = useMemo(() => {
    const key = new Date().toISOString().slice(0, 7);
    return (bills || []).map((b) => ({
      ...b,
      paid: (b.paid_months || []).includes(key),
    }));
  }, [bills]);
  const unpaidBillsCount = billsThisMonth.filter((b) => !b.paid).length;
  const unpaidBillsSum = billsThisMonth.filter((b) => !b.paid).reduce((s, b) => s + b.amount, 0);

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
          <View style={{ flex: 1 }}>
            <Text style={typography.caption}>{monthName} · Total balance</Text>
            <Text style={[typography.display, { fontSize: 34, marginTop: 4 }]} numberOfLines={1}>
              {ready ? formatAmount(totalAcross, currency) : '—'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <CurrencyToggle value={currency} onChange={setCurrency} />
            <Pressable
              onPress={() => navigation.navigate('Settings')}
              hitSlop={10}
              style={styles.gearBtn}
            >
              <Ionicons name="settings-outline" size={18} color={colors.text} />
            </Pressable>
          </View>
        </View>

        <View style={styles.quickRow}>
          <QuickAction
            icon="receipt"
            label="Bills"
            value={unpaidBillsCount > 0
              ? `${unpaidBillsCount} unpaid · ${formatAmount(unpaidBillsSum, currency, { compact: true })}`
              : 'All paid'}
            tone={unpaidBillsCount > 0 ? colors.warning : colors.success}
            badge={unpaidBillsCount > 0 ? unpaidBillsCount : null}
            onPress={() => navigation.navigate('Bills')}
          />
          <QuickAction
            icon="bar-chart"
            label="Monthly"
            value={`${monthName} overview`}
            tone={colors.gold}
            onPress={() => navigation.navigate('MonthlyOverview')}
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            label="Spent"
            value={formatAmount(totalSpent, currency, { compact: true })}
            tone="danger"
            icon="arrow-up"
          />
          <StatCard
            label="Saved"
            value={formatAmount(totalSaved, currency, { compact: true })}
            tone="gold"
            icon="lock-closed"
          />
        </View>

        <View style={styles.ringCard}>
          <View style={styles.ringHeader}>
            <Text style={typography.h3}>Spending breakdown</Text>
            <Text style={typography.bodyMuted}>{monthName}</Text>
          </View>

          <View style={{ alignItems: 'center', marginVertical: spacing.lg }}>
            <RingChart
              size={220}
              thickness={20}
              data={byCategory}
              centerLabel="Spent"
              centerValue={formatAmount(totalSpent, currency, { compact: true })}
              centerHint={`${byCategory.length} categories`}
            />
          </View>

          <View style={styles.legend}>
            {byCategory.length === 0 && (
              <Text style={typography.bodyMuted}>No expenses this month yet.</Text>
            )}
            {byCategory.slice(0, 6).map((c) => {
              const pct = totalSpent > 0 ? Math.round((c.value / totalSpent) * 100) : 0;
              return (
                <View key={c.id} style={styles.legendRow}>
                  <View style={[styles.dot, { backgroundColor: c.color }]} />
                  <Text style={[typography.body, { flex: 1 }]} numberOfLines={1}>{c.label}</Text>
                  <Text style={typography.bodyMuted}>{pct}%</Text>
                  <Text style={[typography.mono, { marginLeft: spacing.md, minWidth: 80, textAlign: 'right' }]}>
                    {formatAmount(c.value, currency, { compact: true })}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={typography.h3}>Wallets</Text>
          <Pressable hitSlop={12} onPress={() => navigation.navigate('Wallets')}>
            <Text style={[typography.label, { color: colors.gold }]}>Manage</Text>
          </Pressable>
        </View>

        <FlatList
          data={wallets}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(w) => w.id}
          renderItem={({ item }) => (
            <WalletCard
              wallet={item}
              balanceMKD={walletBalance(item, transactions)}
              formatted={formatAmount(walletBalance(item, transactions), currency, { compact: true })}
              onPress={() => navigation.navigate('WalletDetail', { id: item.id })}
            />
          )}
          contentContainerStyle={{ paddingVertical: spacing.sm }}
        />

        <View style={styles.sectionHeader}>
          <Text style={typography.h3}>Recent</Text>
          <Pressable hitSlop={12} onPress={() => navigation.navigate('History')}>
            <Text style={[typography.label, { color: colors.gold }]}>See all</Text>
          </Pressable>
        </View>

        {recent.length === 0 ? (
          <View style={styles.empty}>
            <Text style={typography.bodyMuted}>No transactions yet — tap + to add one.</Text>
          </View>
        ) : (
          recent.map((tx) => (
            <TransactionRow
              key={tx.id}
              tx={tx}
              currency={currency}
              walletName={walletNameById[tx.wallet_id]}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function QuickAction({ icon, label, value, tone, badge, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.quickCard, shadow.card]}>
      <View style={styles.quickTop}>
        <View style={[styles.quickIcon, { backgroundColor: hexA(tone, 0.16) }]}>
          <Ionicons name={icon} size={16} color={tone} />
        </View>
        {badge != null && (
          <View style={styles.quickBadge}>
            <Text style={[typography.label, { color: colors.bg, fontSize: 10 }]}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={typography.caption}>{label}</Text>
      <Text style={[typography.body, { marginTop: 2 }]} numberOfLines={1}>{value}</Text>
    </Pressable>
  );
}

function StatCard({ label, value, tone, icon }) {
  const accent = tone === 'gold' ? colors.gold : tone === 'danger' ? colors.danger : colors.success;
  return (
    <View style={[styles.stat, shadow.card]}>
      <View style={[styles.statIcon, { backgroundColor: hexA(accent, 0.16) }]}>
        <Ionicons name={icon} size={16} color={accent} />
      </View>
      <Text style={typography.caption}>{label}</Text>
      <Text style={[typography.h2, { marginTop: 2 }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function hexA(hex, alpha) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  gearBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  quickCard: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  ringCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  ringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legend: { gap: spacing.md, marginTop: spacing.sm },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
