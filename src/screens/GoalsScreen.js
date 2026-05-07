import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { colors, radius, spacing, typography, shadow } from '../theme/theme';
import { useApp } from '../state/AppContext';
import { listGoals } from '../db/db';
import { computeGoalProgress } from '../utils/goals';
import { formatAmount } from '../utils/currency';
import GoalCard from '../components/GoalCard';

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { wallets, transactions, currency } = useApp();
  const [goals, setGoals] = useState([]);

  const reload = useCallback(async () => {
    const g = await listGoals();
    setGoals(g);
  }, []);

  useEffect(() => { reload(); }, [reload]);
  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const walletById = useMemo(
    () => wallets.reduce((acc, w) => ((acc[w.id] = w), acc), {}),
    [wallets],
  );

  const progressByGoal = useMemo(
    () => goals.map((g) => ({ goal: g, progress: computeGoalProgress(g, transactions) })),
    [goals, transactions],
  );

  const totalSaved   = progressByGoal.reduce((s, x) => s + x.progress.saved,  0);
  const totalTarget  = progressByGoal.reduce((s, x) => s + x.progress.target, 0);
  const overallPct   = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

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
            <Text style={typography.caption}>Goals</Text>
            <Text style={typography.h1}>What you're saving for</Text>
          </View>
          <Pressable
            hitSlop={12}
            onPress={() => navigation.navigate('GoalForm', {})}
            style={styles.addBtn}
          >
            <Ionicons name="add" size={22} color={colors.bg} />
          </Pressable>
        </View>

        {goals.length > 0 && (
          <View style={[styles.summary, shadow.card]}>
            <View style={{ flex: 1 }}>
              <Text style={typography.caption}>Total saved across goals</Text>
              <Text style={[typography.display, { fontSize: 30, marginTop: 4 }]} numberOfLines={1}>
                {formatAmount(totalSaved, currency, { compact: true })}
              </Text>
              <Text style={[typography.bodyMuted, { fontSize: 12 }]}>
                of {formatAmount(totalTarget, currency, { compact: true })} target
              </Text>
            </View>
            <View style={styles.summaryPct}>
              <Text style={[typography.h1, { color: colors.gold }]}>{overallPct}%</Text>
            </View>
          </View>
        )}

        {progressByGoal.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="flag-outline" size={36} color={colors.textFaint} />
            <Text style={[typography.h3, { marginTop: spacing.md }]}>No goals yet</Text>
            <Text style={[typography.bodyMuted, { textAlign: 'center', marginTop: 6 }]}>
              Set a target — we'll project when you'll hit it based on your saving pace.
            </Text>
            <Pressable
              onPress={() => navigation.navigate('GoalForm', {})}
              style={[styles.cta, shadow.gold]}
            >
              <Ionicons name="add" size={18} color={colors.bg} />
              <Text style={styles.ctaText}>Create your first goal</Text>
            </Pressable>
          </View>
        ) : (
          progressByGoal.map(({ goal, progress }) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              progress={progress}
              wallet={goal.wallet_id ? walletById[goal.wallet_id] : null}
              currency={currency}
              onPress={() => navigation.navigate('GoalForm', { id: goal.id })}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  summaryPct: {
    paddingLeft: spacing.md,
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
