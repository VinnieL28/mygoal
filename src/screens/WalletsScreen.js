import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { colors, radius, spacing, typography, shadow } from '../theme/theme';
import { useApp } from '../state/AppContext';
import { formatAmount } from '../utils/currency';
import { walletBalance } from '../utils/aggregations';
import { getWalletTypeLabel } from '../utils/walletPresets';

export default function WalletsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { wallets, transactions, currency } = useApp();

  const total = useMemo(
    () => wallets.reduce((s, w) => s + walletBalance(w, transactions), 0),
    [wallets, transactions],
  );

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={typography.h3}>Wallets</Text>
        <Pressable
          onPress={() => navigation.navigate('WalletForm', {})}
          hitSlop={12}
          style={[styles.iconBtn, { backgroundColor: colors.gold, borderColor: colors.gold }]}
        >
          <Ionicons name="add" size={22} color={colors.bg} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: 120 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.totalCard, shadow.card]}>
          <Text style={typography.caption}>Combined balance</Text>
          <Text style={[typography.display, { fontSize: 36, marginTop: 4 }]} numberOfLines={1}>
            {formatAmount(total, currency)}
          </Text>
          <Text style={[typography.bodyMuted, { fontSize: 12 }]}>
            {wallets.length} {wallets.length === 1 ? 'wallet' : 'wallets'}
          </Text>
        </View>

        {wallets.map((w) => {
          const bal = walletBalance(w, transactions);
          const txCount = transactions.filter((t) => t.wallet_id === w.id).length;
          return (
            <Pressable
              key={w.id}
              onPress={() => navigation.navigate('WalletDetail', { id: w.id })}
              style={styles.row}
            >
              <View style={[styles.iconWrap, { backgroundColor: hexA(w.color, 0.18) }]}>
                <Ionicons name={w.icon} size={22} color={w.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={typography.body} numberOfLines={1}>{w.name}</Text>
                <Text style={[typography.bodyMuted, { fontSize: 12 }]}>
                  {getWalletTypeLabel(w.type)} · {txCount} {txCount === 1 ? 'transaction' : 'transactions'}
                </Text>
              </View>
              <Text style={typography.mono} numberOfLines={1}>
                {formatAmount(bal, currency, { compact: true })}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textFaint} style={{ marginLeft: 6 }} />
            </Pressable>
          );
        })}

        {wallets.length === 0 && (
          <View style={styles.empty}>
            <Text style={typography.bodyMuted}>No wallets yet — tap + to create one.</Text>
          </View>
        )}
      </ScrollView>
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
  totalCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
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
