import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

import { colors, radius, spacing, typography, shadow } from '../theme/theme';
import { useApp } from '../state/AppContext';
import { formatAmount } from '../utils/currency';
import { monthRange, sumExpenses, sumIncome, sumSavings, walletBalance } from '../utils/aggregations';
import { getWalletTypeLabel } from '../utils/walletPresets';
import TransactionRow from '../components/TransactionRow';

export default function WalletDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { wallets, transactions, currency } = useApp();

  const wallet = useMemo(
    () => wallets.find((w) => w.id === route.params?.id),
    [wallets, route.params?.id],
  );

  const walletTx = useMemo(
    () => transactions.filter((t) => t.wallet_id === wallet?.id),
    [transactions, wallet?.id],
  );

  const balance = useMemo(
    () => (wallet ? walletBalance(wallet, transactions) : 0),
    [wallet, transactions],
  );

  const { from, to } = useMemo(() => monthRange(new Date()), []);

  const monthSpent  = sumExpenses(walletTx, from, to);
  const monthIncome = sumIncome(walletTx, from, to);
  const monthSaved  = sumSavings(walletTx, from, to);

  if (!wallet) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={[typography.bodyMuted, { padding: spacing.lg }]}>Wallet not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={typography.h3}>{wallet.name}</Text>
        <Pressable
          onPress={() => navigation.navigate('WalletForm', { id: wallet.id })}
          hitSlop={12}
          style={styles.iconBtn}
        >
          <Ionicons name="create-outline" size={20} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: 120 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { borderColor: hexA(wallet.color, 0.4) }, shadow.card]}>
          <View style={styles.heroTop}>
            <View style={[styles.iconWrap, { backgroundColor: hexA(wallet.color, 0.22) }]}>
              <Ionicons name={wallet.icon} size={26} color={wallet.color} />
            </View>
            <View style={styles.tag}>
              <Text style={[typography.caption, { color: wallet.color }]}>
                {getWalletTypeLabel(wallet.type)}
              </Text>
            </View>
          </View>
          <Text style={typography.caption}>Current balance</Text>
          <Text style={[typography.display, { fontSize: 38, marginTop: 4 }]} numberOfLines={1}>
            {formatAmount(balance, currency)}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <Stat label="Spent (mo)"  value={formatAmount(monthSpent,  currency, { compact: true })} accent={colors.danger} />
          <Stat label="Income (mo)" value={formatAmount(monthIncome, currency, { compact: true })} accent={colors.success} />
          <Stat label="Saved (mo)"  value={formatAmount(monthSaved,  currency, { compact: true })} accent={colors.gold} />
        </View>

        <Text style={[typography.h3, { marginTop: spacing.lg, marginBottom: spacing.md }]}>
          Transactions
        </Text>

        {walletTx.length === 0 ? (
          <View style={styles.empty}>
            <Text style={typography.bodyMuted}>No transactions yet on this wallet.</Text>
          </View>
        ) : (
          walletTx.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} currency={currency} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function Stat({ label, value, accent }) {
  return (
    <View style={styles.stat}>
      <View style={[styles.statDot, { backgroundColor: accent }]} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  hero: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
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
