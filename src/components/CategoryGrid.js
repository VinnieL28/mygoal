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
            style={[
              styles.item,
              active && { borderColor: c.color, backgroundColor: hexA(c.color, 0.12) },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: hexA(c.color, 0.18) }]}>
              <Ionicons name={c.icon} size={18} color={c.color} />
            </View>
            <Text
              style={[
                typography.label,
                { color: active ? colors.text : colors.textMuted, marginTop: 6 },
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

function hexA(hex, alpha) {
  const h = hex.replace('#', '');
  const i = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(i >> 16) & 255}, ${(i >> 8) & 255}, ${i & 255}, ${alpha})`;
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  item: {
    width: '23.5%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
