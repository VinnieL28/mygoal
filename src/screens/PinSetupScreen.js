import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { colors, radius, spacing, typography } from '../theme/theme';
import { PIN_LENGTH, clearPin, hasPin, setPin as savePin } from '../utils/pin';
import PinPad, { PinDots } from '../components/PinPad';
import { appConfirm } from '../utils/confirm';

export default function PinSetupScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [step, setStep] = useState('enter'); // enter | confirm
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState(null);
  const [existing, setExisting] = useState(false);

  useEffect(() => { (async () => setExisting(await hasPin()))(); }, []);

  useEffect(() => {
    if (pin.length !== PIN_LENGTH) return;
    if (step === 'enter') {
      setFirstPin(pin);
      setPin('');
      setStep('confirm');
      setError(null);
      return;
    }
    if (step === 'confirm') {
      if (pin !== firstPin) {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError("PINs didn't match. Try again.");
        setPin('');
        setFirstPin('');
        setStep('enter');
        return;
      }
      (async () => {
        await savePin(pin);
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.goBack();
      })();
    }
  }, [pin, step, firstPin, navigation]);

  const onKey = (k) => {
    if (k === 'back') { setPin((p) => p.slice(0, -1)); setError(null); return; }
    setPin((p) => (p.length >= PIN_LENGTH ? p : p + k));
    setError(null);
  };

  const onRemove = () => {
    appConfirm({
      title: 'Remove PIN?',
      message: 'Anyone who opens MyGoal will be able to see your data.',
      confirmText: 'Remove',
      destructive: true,
      onConfirm: async () => {
        await clearPin();
        navigation.goBack();
      },
    });
  };

  const heading = step === 'enter'
    ? (existing ? 'Enter a new PIN' : 'Choose a PIN')
    : 'Confirm your PIN';
  const subtitle = step === 'enter'
    ? `${PIN_LENGTH} digits — used to unlock MyGoal`
    : 'Enter the same PIN again';

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
        <Text style={typography.h3}>{existing ? 'Change PIN' : 'Set PIN'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.body}>
        <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
          <Text style={[typography.h2, { textAlign: 'center' }]}>{heading}</Text>
          <Text style={[typography.bodyMuted, { textAlign: 'center', marginTop: 6 }]}>{subtitle}</Text>
        </View>

        <PinDots length={PIN_LENGTH} filled={pin.length} />
        {!!error && (
          <Text style={[typography.label, { color: colors.danger, textAlign: 'center', marginTop: spacing.md }]}>
            {error}
          </Text>
        )}

        <View style={{ marginTop: spacing.xxl }}>
          <PinPad onKey={onKey} />
        </View>

        {existing && step === 'enter' && (
          <Pressable onPress={onRemove} style={styles.removeBtn}>
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
            <Text style={[typography.label, { color: colors.danger, marginLeft: 8 }]}>
              Remove PIN
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  body: { flex: 1, justifyContent: 'center' },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xxl,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 122, 0.4)',
    backgroundColor: 'rgba(255, 92, 122, 0.08)',
  },
});
