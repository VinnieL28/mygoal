import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addMonths, format, isSameMonth } from 'date-fns';

import { colors, radius, spacing, typography } from '../theme/theme';

export default function MonthSwitcher({ value, onChange }) {
  const isCurrent = isSameMonth(value, new Date());
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onChange(addMonths(value, -1))}
        style={styles.btn}
        hitSlop={12}
      >
        <Ionicons name="chevron-back" size={18} color={colors.text} />
      </Pressable>
      <View style={styles.label}>
        <Text style={typography.h3}>{format(value, 'MMMM yyyy')}</Text>
        {isCurrent && <Text style={[typography.caption, { color: colors.gold, marginTop: 2 }]}>This month</Text>}
      </View>
      <Pressable
        onPress={() => onChange(addMonths(value, 1))}
        disabled={isCurrent}
        style={[styles.btn, isCurrent && { opacity: 0.3 }]}
        hitSlop={12}
      >
        <Ionicons name="chevron-forward" size={18} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.sm,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { alignItems: 'center', flex: 1 },
});
