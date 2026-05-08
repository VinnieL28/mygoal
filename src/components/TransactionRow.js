import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { colors, radius, spacing, typography } from '../theme/theme';
import { getCategory } from '../utils/categories';
import { formatAmount } from '../utils/currency';

export default function TransactionRow({ tx, currency, walletName }) {
  const cat = getCategory(tx.category);
  const isOut  = tx.kind === 'expense';
  const isSave = tx.kind === 'savings';
  const sign = isOut ? '−' : '+';
  const amountColor = isOut ? colors.danger : isSave ? colors.gold : colors.success;

  return (
    <View style={styles.row}>
      <Ionicons name={cat.icon} size={14} color={colors.textMuted} style={{ width: 18 }} />
      <View style={styles.middle}>
        <Text style={typography.body} numberOfLines={1}>
          {tx.note?.trim() ? tx.note : cat.label}
        </Text>
        <Text style={[typography.bodyMuted, { fontSize: 11 }]} numberOfLines={1}>
          {cat.label}{walletName ? ` · ${walletName}` : ''} · {format(new Date(tx.occurred_at), 'MMM d')}
        </Text>
      </View>
      <Text style={[typography.mono, { color: amountColor }]} numberOfLines={1}>
        {sign}{formatAmount(tx.amount, currency)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    marginBottom: 6,
    gap: spacing.md,
  },
  middle: { flex: 1 },
});
