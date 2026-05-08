import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing, typography } from '../theme/theme';

export default function CategoryGrid({ categories, value, onChange }) {
  return (
    <View style={styles.grid}>
      {categories.map((c) => {
        const active = value === c.id;
        return (
          <Pressable
            key={c.id}
            onPress={() => onChange(c.id)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Ionicons
              name={c.icon}
              size={14}
              color={active ? colors.gold : colors.textMuted}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                typography.label,
                { color: active ? colors.text : colors.textMuted },
              ]}
              numberOfLines={1}
            >
              {c.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  chipActive: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(212, 166, 64, 0.10)',
  },
});
