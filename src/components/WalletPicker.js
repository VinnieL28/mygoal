import React from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing, typography } from '../theme/theme';

export default function WalletPicker({ wallets, value, onChange }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {wallets.map((w) => {
        const active = value === w.id;
        return (
          <Pressable
            key={w.id}
            onPress={() => onChange(w.id)}
            style={[
              styles.chip,
              active && { borderColor: w.color, backgroundColor: hexA(w.color, 0.14) },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: w.color }]} />
            <Ionicons name={w.icon} size={14} color={active ? w.color : colors.textMuted} />
            <Text style={[
              typography.label,
              { color: active ? colors.text : colors.textMuted, marginLeft: 6 },
            ]}>
              {w.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function hexA(hex, alpha) {
  const h = hex.replace('#', '');
  const i = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(i >> 16) & 255}, ${(i >> 8) & 255}, ${i & 255}, ${alpha})`;
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingVertical: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
});
