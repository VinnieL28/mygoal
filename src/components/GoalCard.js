import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { colors, radius, spacing, typography, shadow } from '../theme/theme';
import { formatAmount } from '../utils/currency';
import ProgressBar from './ProgressBar';

export default function GoalCard({ goal, progress, wallet, currency, onPress }) {
  const pct = Math.round(progress.percent * 100);
  const accent = progress.complete ? colors.success : colors.gold;

  return (
    <Pressable onPress={onPress} style={[styles.card, shadow.card]}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          {wallet ? (
            <View style={[styles.iconWrap, { backgroundColor: hexA(wallet.color, 0.18) }]}>
              <Ionicons name={wallet.icon} size={16} color={wallet.color} />
            </View>
          ) : (
            <View style={[styles.iconWrap, { backgroundColor: hexA(colors.gold, 0.18) }]}>
              <Ionicons name="flag" size={16} color={colors.gold} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={typography.h3} numberOfLines={1}>{goal.title}</Text>
            <Text style={[typography.bodyMuted, { fontSize: 12 }]} numberOfLines={1}>
              {wallet ? wallet.name : 'All wallets'}
              {goal.deadline ? `  ·  by ${format(new Date(goal.deadline), 'MMM d, yyyy')}` : ''}
            </Text>
          </View>
        </View>
        <Text style={[typography.h2, { color: accent }]}>{pct}%</Text>
      </View>

      <View style={{ marginTop: spacing.md }}>
        <ProgressBar percent={progress.percent} color={accent} />
      </View>

      <View style={styles.amountRow}>
        <Text style={typography.bodyMuted}>
          <Text style={[typography.body, { color: colors.text }]}>
            {formatAmount(progress.saved, currency, { compact: true })}
          </Text>
          {`  of ${formatAmount(progress.target, currency, { compact: true })}`}
        </Text>
        {!progress.complete && (
          <Text style={[typography.bodyMuted, { fontSize: 12 }]}>
            {formatAmount(progress.remaining, currency, { compact: true })} to go
          </Text>
        )}
      </View>

      <View style={styles.forecastRow}>
        {progress.complete ? (
          <Badge icon="checkmark-circle" color={colors.success} text="Goal reached" />
        ) : progress.weeksLeft != null ? (
          <Badge
            icon="trending-up"
            color={statusColor(progress.deadlineStatus)}
            text={`${progress.weeksLeft} ${progress.weeksLeft === 1 ? 'week' : 'weeks'} at this pace`}
          />
        ) : (
          <Badge icon="time-outline" color={colors.textMuted} text="Save to unlock forecast" />
        )}
        {progress.eta && !progress.complete && (
          <Text style={[typography.caption, { fontSize: 10 }]}>
            ETA {format(new Date(progress.eta), 'MMM d')}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function Badge({ icon, color, text }) {
  return (
    <View style={[styles.badge, { backgroundColor: hexA(color, 0.14), borderColor: hexA(color, 0.4) }]}>
      <Ionicons name={icon} size={12} color={color} style={{ marginRight: 6 }} />
      <Text style={[typography.label, { color, fontSize: 12 }]}>{text}</Text>
    </View>
  );
}

function statusColor(s) {
  if (s === 'on-track') return colors.success;
  if (s === 'behind')   return colors.warning;
  return colors.gold;
}

function hexA(hex, alpha) {
  const h = hex.replace('#', '');
  const i = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(i >> 16) & 255}, ${(i >> 8) & 255}, ${i & 255}, ${alpha})`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
