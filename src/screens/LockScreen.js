import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { colors, radius, spacing, typography } from '../theme/theme';
import { PIN_LENGTH, verifyPin } from '../utils/pin';
import PinPad, { PinDots } from '../components/PinPad';

export default function LockScreen({ onUnlock }) {
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(Date.now());

  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (lockedUntil <= 0) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  useEffect(() => {
    if (pin.length !== PIN_LENGTH) return;
    (async () => {
      setBusy(true);
      const r = await verifyPin(pin);
      setBusy(false);
      if (r.ok) {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onUnlock?.();
        return;
      }
      if (r.locked) {
        setLockedUntil(Date.now() + (r.remainingMs || 60000));
      }
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(r.locked
        ? 'Too many attempts. Try again soon.'
        : `Wrong PIN${r.attemptsLeft != null ? ` · ${r.attemptsLeft} left` : ''}`);
      Animated.sequence([
        Animated.timing(shake, { toValue: 12, duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -12, duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 8,  duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 60, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]).start();
      setPin('');
    })();
  }, [pin, onUnlock, shake]);

  const onKey = (k) => {
    if (busy) return;
    if (lockedUntil > now) return;
    if (k === 'back') { setPin((p) => p.slice(0, -1)); setError(null); return; }
    setPin((p) => (p.length >= PIN_LENGTH ? p : p + k));
    setError(null);
  };

  const remaining = Math.max(0, Math.ceil((lockedUntil - now) / 1000));
  const isLocked = remaining > 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.top}>
        <View style={styles.logoCircle}>
          <Ionicons name="lock-closed" size={28} color={colors.gold} />
        </View>
        <Text style={[typography.h1, { marginTop: spacing.lg }]}>MyGoal</Text>
        <Text style={[typography.bodyMuted, { marginTop: 4 }]}>
          {isLocked ? `Locked · try in ${remaining}s` : 'Enter your PIN to unlock'}
        </Text>
      </View>

      <Animated.View style={{ transform: [{ translateX: shake }] }}>
        <PinDots length={PIN_LENGTH} filled={pin.length} />
        {!!error && (
          <Text style={[typography.label, { color: colors.danger, textAlign: 'center', marginTop: spacing.md }]}>
            {error}
          </Text>
        )}
      </Animated.View>

      <View style={styles.padWrap}>
        <PinPad onKey={onKey} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
  },
  top: { alignItems: 'center', marginTop: spacing.xxxl },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245, 200, 66, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(245, 200, 66, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  padWrap: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
});
