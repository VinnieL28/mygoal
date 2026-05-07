import React from 'react';
import { Pressable, View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { colors, shadow } from '../theme/theme';

export default function AddTabButton({ onPress, accessibilityState }) {
  const handlePress = (e) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress?.(e);
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      style={styles.wrap}
      hitSlop={12}
    >
      <View style={styles.glow} />
      <View style={styles.button}>
        <Ionicons name="add" size={30} color="#0B0F1A" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    top: -22,
  },
  glow: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.goldGlow,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.gold,
  },
});
