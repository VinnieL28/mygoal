import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { colors, radius, spacing, typography } from '../theme/theme';
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
            <Text
              style={[
                typography.caption,
                { fontSize: 11 },
                active && { color: colors.bg },
              ]}
            >
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
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  btnActive: {
    backgroundColor: colors.gold,
  },
});
