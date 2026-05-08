import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { format, isSameMonth } from 'date-fns';
import * as Haptics from 'expo-haptics';

import { colors, radius, spacing, typography, shadow } from '../theme/theme';
import { useApp } from '../state/AppContext';
import { listBills, setBillPaid } from '../db/db';
import { formatAmount } from '../utils/currency';
import {
  billStatus,
  billsTotalsForMonth,
  isPaid,
  monthKey,
} from '../utils/bills';
import MonthSwitcher from '../components/MonthSwitcher';
import { scheduleBillReminders } from '../utils/notifications';

export default function BillsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { currency, wallets, refresh: refreshApp } = useApp();

  const [bills, setBills] = useState([]);
  const [month, setMonth] = useState(new Date());

  const reload = useCallback(async () => setBills(await listBills()), []);

  useEffect(() => { reload(); }, [reload]);
  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const walletNameById = useMemo(
    () => wallets.reduce((acc, w) => ((acc[w.id] = w.name), acc), {}),
    [wallets],
  );

  const totals = useMemo(() => billsTotalsForMonth(bills, month), [bills, month]);
  const paidCount = bills.filter((b) => isPaid(b, month)).length;
  const isThisMonth = isSameMonth(month, new Date());

  const togglePaid = async (bill) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    const key = monthKey(month);
    await setBillPaid(bill.id, key, !isPaid(bill, month));
    await reload();
    await refreshApp();
    scheduleBillReminders(currency).catch(() => {});
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={typography.h3}>Bills</Text>
        <Pressable
          onPress={() => navigation.navigate('BillForm', {})}
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
        <MonthSwitcher value={month} onChange={setMonth} />

        <View style={[styles.summaryCard, shadow.card]}>
          <View style={{ flex: 1 }}>
            <Text style={typography.caption}>{format(month, 'MMMM')} bills</Text>
            <Text style={[typography.display, { fontSize: 28, marginTop: 4 }]} numberOfLines={1}>
              {formatAmount(totals.due, currency, { compact: true })}
            </Text>
            <Text style={[typography.bodyMuted, { fontSize: 12 }]}>
              {totals.paid > 0
                ? `${formatAmount(totals.paid, currency, { compact: true })} already paid`
                : 'still to pay'}
            </Text>
          </View>
          <View style={styles.progressBubble}>
            <Text style={[typography.h2, { color: colors.gold }]}>{paidCount}</Text>
            <Text style={[typography.caption, { fontSize: 10 }]}>of {bills.length}</Text>
          </View>
        </View>

        <Text style={[typography.h3, { marginTop: spacing.lg, marginBottom: spacing.md }]}>
          {isThisMonth ? 'This month' : format(month, 'MMMM yyyy')}
        </Text>

        {bills.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={36} color={colors.textFaint} />
            <Text style={[typography.h3, { marginTop: spacing.md }]}>No bills yet</Text>
            <Text style={[typography.bodyMuted, { textAlign: 'center', marginTop: 6 }]}>
              Add your monthly bills (rent, internet, electricity) to track and get reminders 2 days before they're due.
            </Text>
            <Pressable
              onPress={() => navigation.navigate('BillForm', {})}
              style={[styles.cta, shadow.gold]}
            >
              <Ionicons name="add" size={18} color={colors.bg} />
              <Text style={styles.ctaText}>Add your first bill</Text>
            </Pressable>
          </View>
        ) : (
          bills.map((bill) => {
            const status = billStatus(bill, month);
            const paid = status.id === 'paid';
            const accent = statusAccent(status.id);
            return (
              <View key={bill.id} style={[styles.card, paid && { opacity: 0.65 }]}>
                <Pressable
                  onPress={() => togglePaid(bill)}
                  style={[
                    styles.checkbox,
                    paid && { backgroundColor: colors.success, borderColor: colors.success },
                  ]}
                  hitSlop={8}
                >
                  {paid && <Ionicons name="checkmark" size={14} color={colors.bg} />}
                </Pressable>

                <Pressable
                  onPress={() => navigation.navigate('BillForm', { id: bill.id })}
                  style={styles.cardBody}
                >
                  <View style={[styles.iconWrap, { backgroundColor: hexA(bill.color, 0.18) }]}>
                    <Ionicons name={bill.icon} size={18} color={bill.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        typography.body,
                        paid && { textDecorationLine: 'line-through', color: colors.textMuted },
                      ]}
                      numberOfLines={1}
                    >
                      {bill.name}
                    </Text>
                    <Text style={[typography.bodyMuted, { fontSize: 12 }]} numberOfLines={1}>
                      Due day {bill.day_of_month}
                      {bill.wallet_id ? `  ·  ${walletNameById[bill.wallet_id] || ''}` : ''}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={typography.mono}>
                      {formatAmount(bill.amount, currency, { compact: true })}
                    </Text>
                    <View style={[styles.statusPill, { backgroundColor: hexA(accent, 0.16), borderColor: accent }]}>
                      <Text style={[typography.label, { fontSize: 10, color: accent }]}>
                        {status.label}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function statusAccent(id) {
  if (id === 'paid')    return colors.success;
  if (id === 'overdue') return colors.danger;
  if (id === 'today')   return colors.warning;
  if (id === 'soon')    return colors.warning;
  return colors.info;
}

function hexA(hex, alpha) {
  const h = hex.replace('#', '');
  const i = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
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
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
  },
  progressBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 200, 66, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(245, 200, 66, 0.4)',
  },
  card: {
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
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginTop: 4,
  },
  empty: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.pill,
    gap: 6,
    marginTop: spacing.lg,
  },
  ctaText: {
    color: colors.bg,
    fontSize: 14,
    fontWeight: '700',
  },
});
