import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

import { colors, radius, spacing, typography, shadow } from '../theme/theme';
import { useApp } from '../state/AppContext';
import { CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/categories';
import { CURRENCIES, formatAmount } from '../utils/currency';
import { createTransaction } from '../db/db';

import KindToggle from '../components/KindToggle';
import Numpad from '../components/Numpad';
import CategoryGrid from '../components/CategoryGrid';
import WalletPicker from '../components/WalletPicker';
import SaveSuccess from '../components/SaveSuccess';

const SAVINGS_CATEGORY = CATEGORIES.find((c) => c.id === 'savings');

export default function AddTransactionScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { wallets, currency, refresh } = useApp();

  const initialKind = route?.params?.kind || 'expense';
  const [kind, setKind] = useState(initialKind);
  const [amountStr, setAmountStr] = useState('0');
  const [walletId, setWalletId] = useState(null);
  const [category, setCategory] = useState('food');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const amountPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!walletId && wallets.length > 0) {
      const pref = kind === 'savings'
        ? wallets.find((w) => w.type === 'savings')?.id
        : wallets.find((w) => w.type !== 'savings')?.id;
      setWalletId(pref || wallets[0].id);
    }
  }, [wallets, walletId, kind]);

  useEffect(() => {
    if (kind === 'expense') {
      if (!EXPENSE_CATEGORIES.find((c) => c.id === category)) setCategory('food');
    } else if (kind === 'income') {
      setCategory('income');
    } else if (kind === 'savings') {
      setCategory('savings');
    }
  }, [kind]); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleCategories = useMemo(() => {
    if (kind === 'expense') return EXPENSE_CATEGORIES;
    if (kind === 'income')  return INCOME_CATEGORIES;
    return [SAVINGS_CATEGORY];
  }, [kind]);

  const amountNum = parseFloat(amountStr) || 0;
  const amountValid = amountNum > 0;

  const onKey = (k) => {
    Animated.sequence([
      Animated.timing(amountPulse, { toValue: 1.06, duration: 60, useNativeDriver: true }),
      Animated.spring(amountPulse, { toValue: 1, useNativeDriver: true, friction: 5 }),
    ]).start();

    setAmountStr((prev) => {
      if (k === 'back') {
        const next = prev.slice(0, -1);
        return next.length === 0 ? '0' : next;
      }
      if (k === '.') {
        if (prev.includes('.')) return prev;
        return prev + '.';
      }
      if (prev === '0') return k;
      const [, dec] = prev.split('.');
      if (dec && dec.length >= 2) return prev;
      return prev + k;
    });
  };

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to attach an image.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });
    if (!res.canceled) setPhoto(res.assets[0].uri);
  };

  const save = async () => {
    if (!amountValid || !walletId || saving) return;
    setSaving(true);

    const rate = CURRENCIES[currency]?.rateFromMKD || 1;
    const amountMKD = amountNum / rate;

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    try {
      await createTransaction({
        wallet_id: walletId,
        kind,
        amount: amountMKD,
        category,
        note: note.trim() || null,
        photo_uri: photo,
        occurred_at: Date.now(),
      });
      await refresh();
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigation.goBack();
      }, 850);
    } catch (e) {
      setSaving(false);
      Alert.alert('Could not save', String(e?.message || e));
    }
  };

  const accent =
    kind === 'expense' ? colors.danger :
    kind === 'income'  ? colors.success :
    colors.gold;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
        <Text style={typography.h3}>New transaction</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, maxWidth: 640, width: '100%', alignSelf: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <KindToggle value={kind} onChange={setKind} />

        {Platform.OS === 'web' ? (
          <View style={styles.webAmount}>
            <Text style={typography.caption}>
              {kind === 'savings' ? 'Saving' : kind === 'income' ? 'Income' : 'Expense'} · {currency}
            </Text>
            <TextInput
              style={[styles.webAmountInput, { color: accent }]}
              value={amountStr === '0' ? '' : amountStr}
              onChangeText={(v) => {
                const cleaned = v.replace(/[^0-9.]/g, '');
                const parts = cleaned.split('.');
                const safe = parts.length > 2
                  ? `${parts[0]}.${parts.slice(1).join('')}`
                  : cleaned;
                setAmountStr(safe || '0');
              }}
              placeholder="0"
              placeholderTextColor={colors.textFaint}
              keyboardType="decimal-pad"
              autoFocus
              selectTextOnFocus
            />
          </View>
        ) : (
          <View style={styles.amountWrap}>
            <Text style={[typography.caption, { textAlign: 'center' }]}>
              {kind === 'savings' ? 'Saving' : kind === 'income' ? 'Income' : 'Expense'} · {currency}
            </Text>
            <Animated.Text
              style={[
                styles.amountText,
                { color: accent, transform: [{ scale: amountPulse }] },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatAmount(amountNum, currency)}
            </Animated.Text>
          </View>
        )}

        <SectionLabel>Wallet</SectionLabel>
        <WalletPicker wallets={wallets} value={walletId} onChange={setWalletId} />
        {wallets.length === 0 && (
          <Text style={[typography.bodyMuted, { fontSize: 12, marginTop: 6 }]}>
            No wallets yet — create one first from Dashboard › Manage.
          </Text>
        )}

        {kind === 'expense' && (
          <>
            <SectionLabel style={{ marginTop: spacing.lg }}>Category</SectionLabel>
            <CategoryGrid
              categories={visibleCategories}
              value={category}
              onChange={setCategory}
            />
          </>
        )}

        <SectionLabel style={{ marginTop: spacing.lg }}>Note</SectionLabel>
        <View style={styles.noteRow}>
          <TextInput
            style={styles.noteInput}
            placeholder="Add a note (optional)"
            placeholderTextColor={colors.textFaint}
            value={note}
            onChangeText={setNote}
            maxLength={120}
            returnKeyType="done"
          />
          {Platform.OS !== 'web' && (
            <Pressable onPress={pickPhoto} style={styles.photoBtn}>
              <Ionicons
                name={photo ? 'image' : 'image-outline'}
                size={20}
                color={photo ? colors.gold : colors.textMuted}
              />
            </Pressable>
          )}
        </View>

        {photo && (
          <View style={styles.photoPreview}>
            <Image source={{ uri: photo }} style={styles.photoImg} />
            <Pressable onPress={() => setPhoto(null)} style={styles.photoClear} hitSlop={10}>
              <Ionicons name="close" size={16} color={colors.text} />
            </Pressable>
          </View>
        )}

        {Platform.OS !== 'web' && (
          <>
            <View style={{ height: spacing.lg }} />
            <Numpad onKey={onKey} />
          </>
        )}

        {(!amountValid || !walletId) && (
          <Text style={[typography.bodyMuted, { fontSize: 12, textAlign: 'center', marginTop: spacing.md }]}>
            {!amountValid ? 'Enter an amount' : 'Pick a wallet'} to continue
          </Text>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable
          onPress={save}
          disabled={!amountValid || !walletId || saving}
          style={[
            styles.saveBtn,
            (!amountValid || !walletId) && styles.saveBtnDisabled,
            shadow.gold,
          ]}
        >
          <Ionicons name="checkmark" size={20} color={colors.bg} />
          <Text style={styles.saveText}>
            {kind === 'savings' ? 'Save it' : kind === 'income' ? 'Add income' : 'Add expense'}
          </Text>
        </Pressable>
      </View>

      <SaveSuccess
        visible={showSuccess}
        label={kind === 'savings' ? 'Saved!' : 'Logged'}
      />
    </KeyboardAvoidingView>
  );
}

function SectionLabel({ children, style }) {
  return (
    <Text style={[typography.caption, { marginTop: spacing.lg, marginBottom: spacing.sm }, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
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
  webAmount: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginVertical: spacing.lg,
  },
  webAmountInput: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
    paddingVertical: 8,
    color: colors.text,
    outlineStyle: 'none',
  },
  amountWrap: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  amountText: {
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: -1.5,
    marginVertical: 6,
    fontVariant: ['tabular-nums'],
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.md,
  },
  noteInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: 14,
  },
  photoBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  photoPreview: {
    marginTop: spacing.sm,
    height: 120,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoImg: { width: '100%', height: '100%' },
  photoClear: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
    paddingVertical: 16,
    borderRadius: radius.lg,
    gap: 8,
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveText: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
