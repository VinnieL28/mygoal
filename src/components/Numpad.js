import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { colors, radius, spacing, typography } from '../theme/theme';

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'back'],
];

export default function Numpad({ onKey }) {
  const handle = (k) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    onKey(k);
  };

  return (
    <View style={styles.wrap}>
      {KEYS.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((k) => (
            <Pressable
              key={k}
              onPress={() => handle(k)}
              style={({ pressed }) => [
                styles.key,
                pressed && styles.keyPressed,
              ]}
            >
              {k === 'back' ? (
                <Ionicons name="backspace-outline" size={22} color={colors.text} />
              ) : (
                <Text style={styles.keyText}>{k}</Text>
              )}
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  key: {
    flex: 1,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPressed: {
    backgroundColor: colors.surfaceHigh,
    borderColor: colors.border,
  },
  keyText: {
    ...typography.h2,
    fontVariant: ['tabular-nums'],
  },
});
