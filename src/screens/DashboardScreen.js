import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { format, startOfDay, endOfDay } from 'date-fns';

import { colors, radius, spacing, typography } from '../theme/theme';
import { useApp } from '../state/AppContext';
import { formatAmount } from '../utils/currency';
import {
  expensesByCategory,
  monthRange,
  sumExpenses,
  sumIncome,
  sumSavings,
  walletBalance,
} from '../utils/aggregations';
import TransactionRow from '../components/TransactionRow';
import CurrencyToggle from '../components/CurrencyToggle';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { ready, currency, setCurrency, wallets, transactions, bills } = useApp();

  const { from, to } = useMemo(() => monthRange(new Date()), []);
  const today = useMemo(() => ({
    from: startOfDay(new Date()).getTime(),
    to: endOfDay(new Date()).getTime(),
  }), []);

  const monthSpent  = useMemo(() => sumExpenses(transactions, from, to), [transactions, from, to]);
  const monthIncome = useMemo(() => sumIncome(transactions, from, to),   [transactions, from, to]);
  const monthSaved  = useMemo(() => sumSavings(transactions, from, to),  [transactions, from, to]);
  const monthNet    = monthIncome - monthSpent - monthSaved;

  const todaySpent  = useMemo(() => sumExpenses(transactions, today.from, today.to), [transactions, today]);
  const todayIncome = useMemo(() => sumIncome(transactions, today.from, today.to),   [transactions, today]);

  const byCategory = useMemo(() => expensesByCategory(transactions, from, to), [transactions, from, to]);
  const totalBalance = useMemo(
    () => wallets.reduce((s, w) => s + walletBalance(w, transactions), 0),
    [wallets, transactions],
  );
  const recent = useMemo(() => transactions.slice(0, 6), [transactions]);
  const walletNameById = useMemo(
    () => wallets.reduce((acc, w) => ((acc[w.id] = w.name), acc), {}),
    [wallets],
  );

  const monthKey = new Date().toISOString().slice(0, 7);
  const unpaidBills = (bills || []).filter((b) => !(b.paid_months || []).includes(monthKey));
  const unpaidBillsSum = unpaidBills.reduce((s, b) => s + b.amount, 0);

  const maxCat = byCategory[0]?.value || 0;

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.md }]}>
        <View>
          <Text style={typography.caption}>{format(new Date(), 'EEEE · MMM d, yyyy')}</Text>
          <Text style={[typography.h2, { marginTop: 2 }]}>MyGoal</Text>
        </View>
        <View style={styles.topActions}>
          <CurrencyToggle value={currency} onChange={setCurrency} />
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            hitSlop={10}
            style={styles.iconBtn}
          >
            <Ionicons name="settings-outline" size={16} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xxxl + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        {ready && wallets.length === 0 && (
          <View style={styles.setupCard}>
            <Ionicons name="wallet-outline" size={20} color={colors.gold} />
            <View style={{ flex: 1, marginHorizontal: spacing.md }}>
              <Text style={typography.body}>Set up your first wallet</Text>
              <Text style={[typography.bodyMuted, { fontSize: 12, marginTop: 2 }]}>
                e.g. "Store register", "Personal card". Then start logging.
              </Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate('WalletForm', {})}
              style={styles.setupBtn}
            >
              <Text style={[typography.label, { color: colors.bg, fontSize: 12 }]}>Create</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <Text style={typography.caption}>Total balance</Text>
            <Pressable
              onPress={() => navigation.navigate('Wallets')}
              hitSlop={8}
            >
              <Text style={[typography.label, { color: colors.gold }]}>{wallets.length} wallets ›</Text>
            </Pressable>
          </View>
          <Text style={[typography.display, { marginTop: 6 }]} numberOfLines={1}>
            {ready ? formatAmount(totalBalance, currency) : '—'}
          </Text>
          <View style={styles.netRow}>
            <Text style={typography.bodyMuted}>This month</Text>
            <Text style={[
              typography.mono,
              { color: monthNet >= 0 ? colors.success : colors.danger },
            ]}>
              {monthNet >= 0 ? '+' : '−'}{formatAmount(Math.abs(monthNet), currency, { compact: true })}
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <Stat label="Income"   value={formatAmount(monthIncome, currency, { compact: true })} accent={colors.success} />
          <Stat label="Spent"    value={formatAmount(monthSpent,  currency, { compact: true })} accent={colors.danger} />
          <Stat label="Saved"    value={formatAmount(monthSaved,  currency, { compact: true })} accent={colors.gold} />
        </View>

        <View style={styles.todayCard}>
          <View style={styles.todayLeft}>
            <Text style={typography.caption}>Today</Text>
            <Text style={[typography.mono, { color: colors.success, marginTop: 4 }]}>
              +{formatAmount(todayIncome, currency, { compact: true })}
            </Text>
            <Text style={[typography.mono, { color: colors.danger }]}>
              −{formatAmount(todaySpent, currency, { compact: true })}
            </Text>
          </View>
          <View style={styles.quickActions}>
            <QuickBtn
              icon="arrow-up"
              label="Add income"
              onPress={() => navigation.navigate('AddTransaction', { kind: 'income' })}
            />
            <QuickBtn
              icon="arrow-down"
              label="Add expense"
              onPress={() => navigation.navigate('AddTransaction', { kind: 'expense' })}
            />
          </View>
        </View>

        <View style={styles.linksRow}>
          <LinkBtn
            icon="receipt-outline"
            label="Bills"
            sub={unpaidBills.length > 0
              ? `${unpaidBills.length} due · ${formatAmount(unpaidBillsSum, currency, { compact: true })}`
              : 'All paid'}
            badge={unpaidBills.length || null}
            onPress={() => navigation.navigate('Bills')}
          />
          <LinkBtn
            icon="bar-chart-outline"
            label="Monthly"
            sub={format(new Date(), 'MMMM')}
            onPress={() => navigation.navigate('MonthlyOverview')}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={typography.h3}>Spending by category</Text>
            <Text style={typography.caption}>{format(new Date(), 'MMM')}</Text>
          </View>
          {byCategory.length === 0 ? (
            <Text style={[typography.bodyMuted, { paddingVertical: spacing.md }]}>
              No expenses logged this month.
            </Text>
          ) : (
            byCategory.slice(0, 6).map((c, i) => {
              const pct = maxCat > 0 ? c.value / maxCat : 0;
              const isTop = i === 0;
              return (
                <View key={c.id} style={styles.barRow}>
                  <Text style={[typography.body, { width: 90 }]} numberOfLines={1}>{c.label}</Text>
                  <View style={styles.barTrack}>
                    <View style={[
                      styles.barFill,
                      { width: `${Math.max(2, pct * 100)}%`, backgroundColor: isTop ? colors.gold : colors.surfaceHigh },
                    ]} />
                  </View>
                  <Text style={[typography.mono, { minWidth: 80, textAlign: 'right' }]}>
                    {formatAmount(c.value, currency, { compact: true })}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {wallets.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={typography.h3}>Wallets</Text>
              <Pressable hitSlop={8} onPress={() => navigation.navigate('Wallets')}>
                <Text style={[typography.label, { color: colors.gold }]}>Manage</Text>
              </Pressable>
            </View>
            {wallets.map((w) => {
              const bal = walletBalance(w, transactions);
              return (
                <Pressable
                  key={w.id}
                  onPress={() => navigation.navigate('WalletDetail', { id: w.id })}
                  style={styles.walletRow}
                >
                  <Ionicons name={w.icon} size={16} color={colors.textMuted} style={{ width: 22 }} />
                  <Text style={[typography.body, { flex: 1 }]} numberOfLines={1}>{w.name}</Text>
                  <Text style={typography.mono}>
                    {formatAmount(bal, currency, { compact: true })}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={typography.h3}>Recent</Text>
            <Pressable hitSlop={8} onPress={() => navigation.navigate('History')}>
              <Text style={[typography.label, { color: colors.gold }]}>See all</Text>
            </Pressable>
          </View>
          {recent.length === 0 ? (
            <View style={styles.empty}>
              <Text style={typography.bodyMuted}>No transactions yet.</Text>
              <Pressable
                onPress={() => navigation.navigate('AddTransaction')}
                style={styles.emptyCta}
              >
                <Ionicons name="add" size={14} color={colors.bg} />
                <Text style={[typography.label, { color: colors.bg, marginLeft: 4 }]}>Log first</Text>
              </Pressable>
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
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ label, value, accent }) {
  return (
    <View style={styles.stat}>
      <View style={[styles.statBar, { backgroundColor: accent }]} />
      <View style={{ paddingLeft: spacing.md, flex: 1 }}>
        <Text style={[typography.caption, { fontSize: 9 }]}>{label}</Text>
        <Text style={[typography.h2, { marginTop: 2 }]} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

function QuickBtn({ icon, label, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.quickBtn}>
      <Ionicons name={icon} size={14} color={colors.gold} />
      <Text style={[typography.label, { color: colors.text, marginLeft: 6, fontSize: 12 }]}>{label}</Text>
    </Pressable>
  );
}

function LinkBtn({ icon, label, sub, badge, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.linkBtn}>
      <View style={styles.linkTop}>
        <Ionicons name={icon} size={16} color={colors.textMuted} />
        {badge != null && (
          <View style={styles.linkBadge}>
            <Text style={[typography.caption, { color: colors.bg, fontSize: 9, letterSpacing: 0 }]}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={[typography.body, { marginTop: spacing.sm }]}>{label}</Text>
      <Text style={[typography.bodyMuted, { fontSize: 11 }]} numberOfLines={1}>{sub}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  setupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 166, 64, 0.08)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 166, 64, 0.4)',
    padding: spacing.md,
    marginTop: spacing.md,
  },
  setupBtn: {
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  heroCard: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  stat: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    minHeight: 56,
  },
  statBar: {
    width: 2,
    borderRadius: 1,
  },
  todayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.md,
  },
  todayLeft: { flex: 1 },
  quickActions: { gap: spacing.sm },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linksRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  linkBtn: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
  },
  linkTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: spacing.md,
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
});
