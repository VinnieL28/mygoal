import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing, typography } from '../theme/theme';

export default function WalletCard({ wallet, balanceMKD, formatted, onPress, active }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, active && { borderColor: colors.gold }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: hexA(wallet.color, 0.18) }]}>
        <Ionicons name={wallet.icon} size={18} color={wallet.color} />
      </View>
      <Text style={typography.caption} numberOfLines={1}>{wallet.name}</Text>
      <Text style={[typography.h3, styles.amount]} numberOfLines={1}>{formatted}</Text>
    </Pressable>
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
  card: {
    width: 140,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.md,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  amount: {
    marginTop: 2,
    fontSize: 17,
  },
});
