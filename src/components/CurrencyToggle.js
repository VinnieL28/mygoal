import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { colors, radius, typography } from '../theme/theme';
import { CURRENCY_LIST } from '../utils/currency';

export default function CurrencyToggle({ value, onChange }) {
  return (
    <View style={styles.wrap}>
      {CURRENCY_LIST.map((c) => {
        const active = c.code === value;
        return (
          <Pressable
            key={c.code}
            onPress={() => onChange(c.code)}
            style={[styles.btn, active && styles.btnActive]}
          >
            <Text style={[
              typography.label,
              { fontSize: 10, letterSpacing: 0.5, color: active ? colors.bg : colors.textMuted },
            ]}>
              {c.code}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  btnActive: {
    backgroundColor: colors.gold,
  },
});
