import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { addMonths, endOfMonth, format, isSameMonth, startOfMonth } from 'date-fns';

import { colors, radius, spacing, typography, shadow } from '../theme/theme';
import { useApp } from '../state/AppContext';
import { listBills } from '../db/db';
import { formatAmount } from '../utils/currency';
import {
  expensesByCategory,
  sumExpenses,
  sumIncome,
  sumSavings,
} from '../utils/aggregations';
import { billsTotalsForMonth } from '../utils/bills';
import RingChart from '../components/RingChart';
import MonthSwitcher from '../components/MonthSwitcher';

export default function MonthlyOverviewScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { transactions, currency } = useApp();
  const [bills, setBills] = useState([]);
  const [month, setMonth] = useState(startOfMonth(new Date()));

  const reload = useCallback(async () => setBills(await listBills()), []);
  useEffect(() => { reload(); }, [reload]);
  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const stepMonth = useCallback((delta) => {
    setMonth((m) => {
      const next = addMonths(m, delta);
      const today = new Date();
      // disallow future months
      if (next > startOfMonth(today)) return m;
      return next;
    });
  }, []);

  const swipe = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onUpdate((e) => {
      translateX.value = e.translationX;
      opacity.value = 1 - Math.min(0.4, Math.abs(e.translationX) / 600);
    })
    .onEnd((e) => {
      const threshold = 80;
      if (e.translationX < -threshold) {
        // swipe left → next month
        translateX.value = withTiming(-300, { duration: 150 }, () => {
          translateX.value = 300;
          translateX.value = withSpring(0);
          runOnJS(stepMonth)(1);
        });
        opacity.value = withTiming(1);
      } else if (e.translationX > threshold) {
        // swipe right → previous month
        translateX.value = withTiming(300, { duration: 150 }, () => {
          translateX.value = -300;
          translateX.value = withSpring(0);
          runOnJS(stepMonth)(-1);
        });
        opacity.value = withTiming(1);
      } else {
        translateX.value = withSpring(0);
        opacity.value = withTiming(1);
      }
    });

  const pageStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const monthFrom = useMemo(() => startOfMonth(month).getTime(), [month]);
  const monthTo   = useMemo(() => endOfMonth(month).getTime(),   [month]);

  const income = useMemo(() => sumIncome(transactions, monthFrom, monthTo),    [transactions, monthFrom, monthTo]);
  const spent  = useMemo(() => sumExpenses(transactions, monthFrom, monthTo),  [transactions, monthFrom, monthTo]);
  const saved  = useMemo(() => sumSavings(transactions, monthFrom, monthTo),   [transactions, monthFrom, monthTo]);
  const cats   = useMemo(() => expensesByCategory(transactions, monthFrom, monthTo), [transactions, monthFrom, monthTo]);
  const billsTotals = useMemo(() => billsTotalsForMonth(bills, month), [bills, month]);

  const left = income - spent - saved - billsTotals.due;

  const isThisMonth = isSameMonth(month, new Date());

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={typography.h3}>Monthly</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ paddingHorizontal: spacing.lg }}>
        <MonthSwitcher value={month} onChange={setMonth} />
      </View>

      <GestureDetector gesture={swipe}>
        <Animated.View style={[{ flex: 1 }, pageStyle]}>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.md,
              paddingBottom: 120 + insets.bottom,
            }}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.heroCard, shadow.card]}>
              <Text style={typography.caption}>{format(month, 'MMMM yyyy')}</Text>
              <Text style={[typography.display, {
                fontSize: 36,
                marginTop: 4,
                color: left >= 0 ? colors.gold : colors.danger,
              }]} numberOfLines={1}>
                {left >= 0 ? '' : '−'}{formatAmount(Math.abs(left), currency)}
              </Text>
              <Text style={[typography.bodyMuted, { fontSize: 12 }]}>
                {left >= 0 ? 'left after expenses, savings & bills' : 'over budget this month'}
              </Text>
              {!isThisMonth && (
                <View style={styles.archiveBadge}>
                  <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                  <Text style={[typography.label, { color: colors.textMuted, fontSize: 11 }]}>
                    historical
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.statsGrid}>
              <Stat label="Income"   value={formatAmount(income, currency, { compact: true })} icon="trending-up" tone={colors.success} />
              <Stat label="Spent"    value={formatAmount(spent,  currency, { compact: true })} icon="trending-down" tone={colors.danger} />
              <Stat label="Bills"    value={formatAmount(billsTotals.total, currency, { compact: true })} icon="receipt"  tone={colors.warning} sub={`${formatAmount(billsTotals.paid, currency, { compact: true })} paid`} />
              <Stat label="Saved"    value={formatAmount(saved,  currency, { compact: true })} icon="lock-closed" tone={colors.gold} />
            </View>

            <View style={[styles.card, { marginTop: spacing.lg }]}>
              <View style={styles.ringHeader}>
                <Text style={typography.h3}>Spending breakdown</Text>
                <Text style={typography.bodyMuted}>{format(month, 'MMM')}</Text>
              </View>
              <View style={{ alignItems: 'center', marginVertical: spacing.lg }}>
                <RingChart
                  size={200}
                  thickness={18}
                  data={cats}
                  centerLabel="Spent"
                  centerValue={formatAmount(spent, currency, { compact: true })}
                  centerHint={`${cats.length} categories`}
                />
              </View>
              {cats.length === 0 ? (
                <Text style={typography.bodyMuted}>No expenses logged this month.</Text>
              ) : (
                cats.slice(0, 6).map((c) => {
                  const pct = spent > 0 ? Math.round((c.value / spent) * 100) : 0;
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
                })
              )}
            </View>

            <Text style={[typography.caption, { textAlign: 'center', marginTop: spacing.xl, opacity: 0.6 }]}>
              ← swipe between months →
            </Text>
          </ScrollView>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

function Stat({ label, value, icon, tone, sub }) {
  return (
    <View style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: hexA(tone, 0.16) }]}>
        <Ionicons name={icon} size={14} color={tone} />
      </View>
      <Text style={[typography.caption, { fontSize: 10 }]}>{label}</Text>
      <Text style={[typography.h3, { marginTop: 2 }]} numberOfLines={1}>{value}</Text>
      {sub && <Text style={[typography.bodyMuted, { fontSize: 10, marginTop: 1 }]}>{sub}</Text>}
    </View>
  );
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
  heroCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
  },
  archiveBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  stat: {
    width: '48%',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.xs },
});
