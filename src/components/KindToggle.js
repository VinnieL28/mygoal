import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing, typography } from '../theme/theme';

const OPTIONS = [
  { id: 'expense', label: 'Expense', icon: 'remove-circle' },
  { id: 'income',  label: 'Income',  icon: 'add-circle' },
  { id: 'savings', label: 'Save',    icon: 'lock-closed' },
];

export default function KindToggle({ value, onChange }) {
  return (
    <View style={styles.wrap}>
      {OPTIONS.map((o) => {
        const active = value === o.id;
        const accent =
          o.id === 'expense' ? colors.danger :
          o.id === 'income'  ? colors.success :
          colors.gold;
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            style={[
              styles.btn,
              active && { backgroundColor: hexA(accent, 0.18), borderColor: accent },
            ]}
          >
            <Ionicons
              name={o.icon}
              size={16}
              color={active ? accent : colors.textMuted}
              style={{ marginRight: 6 }}
            />
            <Text style={[
              typography.label,
              { color: active ? accent : colors.textMuted },
            ]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function hexA(hex, alpha) {
  const h = hex.replace('#', '');
  const i = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(i >> 16) & 255}, ${(i >> 8) & 255}, ${i & 255}, ${alpha})`;
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'transparent',
  },
});
