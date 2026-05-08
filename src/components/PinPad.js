import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { colors, radius, spacing, typography } from '../theme/theme';

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['',  '0', 'back'],
];

export default function PinPad({ onKey }) {
  const tap = (k) => {
    if (!k) return;
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    onKey(k);
  };

  return (
    <View style={styles.wrap}>
      {KEYS.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((k, ci) => {
            if (!k) return <View key={`e-${ri}-${ci}`} style={styles.key} />;
            return (
              <Pressable
                key={k}
                onPress={() => tap(k)}
                style={({ pressed }) => [styles.key, styles.keyBtn, pressed && styles.keyBtnPressed]}
              >
                {k === 'back'
                  ? <Ionicons name="backspace-outline" size={24} color={colors.text} />
                  : <Text style={styles.keyText}>{k}</Text>}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function PinDots({ length, filled }) {
  return (
    <View style={dotStyles.row}>
      {Array.from({ length }).map((_, i) => (
        <View
          key={i}
          style={[
            dotStyles.dot,
            i < filled ? dotStyles.dotFilled : null,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 320,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  key: {
    flex: 1,
    aspectRatio: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyBtn: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  keyBtnPressed: {
    backgroundColor: colors.surfaceHigh,
    borderColor: colors.gold,
  },
  keyText: {
    ...typography.h1,
    fontVariant: ['tabular-nums'],
  },
});

const dotStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.textFaint,
  },
  dotFilled: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
});
