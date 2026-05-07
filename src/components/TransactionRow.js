import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { colors, radius, spacing, typography } from '../theme/theme';
import { getCategory } from '../utils/categories';
import { formatAmount } from '../utils/currency';

export default function TransactionRow({ tx, currency, walletName }) {
  const cat = getCategory(tx.category);
  const isOut = tx.kind === 'expense';
  const isSave = tx.kind === 'savings';
  const sign = isOut ? '−' : '+';
  const amountColor = isOut ? colors.text : isSave ? colors.gold : colors.success;

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: hexA(cat.color, 0.18) }]}>
        <Ionicons name={cat.icon} size={18} color={cat.color} />
      </View>
      <View style={styles.middle}>
        <Text style={typography.body} numberOfLines={1}>
          {tx.note?.trim() ? tx.note : cat.label}
        </Text>
        <Text style={[typography.bodyMuted, { fontSize: 12 }]} numberOfLines={1}>
          {cat.label}{walletName ? ` · ${walletName}` : ''} · {format(new Date(tx.occurred_at), 'MMM d')}
        </Text>
      </View>
      <Text style={[typography.mono, { color: amountColor }]} numberOfLines={1}>
        {sign}{formatAmount(tx.amount, currency)}
      </Text>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: { flex: 1 },
});
