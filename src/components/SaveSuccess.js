import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, typography } from '../theme/theme';

export default function SaveSuccess({ visible, label = 'Saved' }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0)).current;
  const ringOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!visible) {
      scale.setValue(0);
      opacity.setValue(0);
      ringScale.setValue(0);
      ringOpacity.setValue(0.6);
      return;
    }
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 120 }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(ringScale, { toValue: 2.4, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(ringOpacity, { toValue: 0, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [visible, scale, opacity, ringScale, ringOpacity]);

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.center}>
        <Animated.View
          style={[
            styles.ring,
            { transform: [{ scale: ringScale }], opacity: ringOpacity },
          ]}
        />
        <Animated.View style={[styles.badge, { transform: [{ scale }], opacity }]}>
          <Ionicons name="checkmark" size={42} color={colors.bg} />
        </Animated.View>
        <Animated.Text style={[typography.h3, styles.label, { opacity }]}>
          {label}
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 15, 26, 0.7)',
  },
  ring: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.gold,
  },
  badge: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gold,
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  label: {
    marginTop: 16,
    color: colors.gold,
    fontWeight: '700',
  },
});
