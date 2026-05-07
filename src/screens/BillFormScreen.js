import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { colors, radius, spacing, typography, shadow } from '../theme/theme';
import { useApp } from '../state/AppContext';
import { CURRENCIES, formatAmount } from '../utils/currency';
import { createBill, deleteBill, getBill, updateBill } from '../db/db';
import { scheduleBillReminders } from '../utils/notifications';

const COLORS = ['#FFB155', '#FF6B6B', '#7FE0D4', '#5BA8FF', '#B07BFF', '#4ADE80', '#F5C842', '#FF8FB1'];
const ICONS  = ['receipt', 'home', 'flash', 'wifi', 'water', 'phone-portrait', 'tv', 'car', 'flame', 'school', 'medkit', 'card'];

export default function BillFormScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const editingId = route.params?.id;
  const { wallets, currency } = useApp();

  const [name, setName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [dayStr, setDayStr] = useState('1');
  const [color, setColor] = useState('#FFB155');
  const [icon, setIcon] = useState('receipt');
  const [walletId, setWalletId] = useState(null);
  const [loading, setLoading] = useState(!!editingId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!editingId) return;
      const b = await getBill(editingId);
      if (b) {
        const rate = CURRENCIES[currency]?.rateFromMKD || 1;
        setName(b.name);
        setAmountStr(String(Math.round(b.amount * rate * 100) / 100));
        setDayStr(String(b.day_of_month));
        setColor(b.color);
        setIcon(b.icon);
        setWalletId(b.wallet_id ?? null);
      }
      setLoading(false);
    })();
  }, [editingId, currency]);

  const previewAmountMKD = useMemo(() => {
    const rate = CURRENCIES[currency]?.rateFromMKD || 1;
    return (parseFloat(amountStr) || 0) / rate;
  }, [amountStr, currency]);

  const onSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) { Alert.alert('Name required', 'Give your bill a name.'); return; }
    const amount = parseFloat(amountStr) || 0;
    if (amount <= 0) { Alert.alert('Amount required', 'Enter the monthly amount.'); return; }
    const day = parseInt(dayStr, 10) || 1;
    if (day < 1 || day > 31) { Alert.alert('Invalid day', 'Day must be between 1 and 31.'); return; }

    setSaving(true);
    const rate = CURRENCIES[currency]?.rateFromMKD || 1;
    const amountMKD = amount / rate;

    try {
      if (editingId) {
        await updateBill(editingId, {
          name: trimmed, amount: amountMKD, day_of_month: day,
          color, icon, wallet_id: walletId,
        });
      } else {
        await createBill({
          name: trimmed, amount: amountMKD, day_of_month: day,
          color, icon, wallet_id: walletId,
        });
      }
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      scheduleBillReminders(currency).catch(() => {});
      navigation.goBack();
    } catch (e) {
      setSaving(false);
      Alert.alert('Could not save', String(e?.message || e));
    }
  };

  const onDelete = () => {
    if (!editingId) return;
    Alert.alert('Delete bill', 'This bill will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteBill(editingId);
          scheduleBillReminders(currency).catch(() => {});
          navigation.goBack();
        },
      },
    ]);
  };

  if (loading) return <View style={styles.root} />;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
        <Text style={typography.h3}>{editingId ? 'Edit bill' : 'New bill'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 160 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.preview, shadow.card, { borderColor: hexA(color, 0.4) }]}>
          <View style={[styles.previewIcon, { backgroundColor: hexA(color, 0.22) }]}>
            <Ionicons name={icon} size={22} color={color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={typography.caption}>Monthly bill</Text>
            <Text style={[typography.h2, { marginTop: 2 }]} numberOfLines={1}>
              {name.trim() || 'Bill name'}
            </Text>
            <Text style={[typography.bodyMuted, { fontSize: 12 }]}>
              {formatAmount(previewAmountMKD, currency)} on day {dayStr}
            </Text>
          </View>
        </View>

        <SectionLabel>Name</SectionLabel>
        <TextInput
          style={styles.input}
          placeholder="e.g. Rent, Internet, Electric"
          placeholderTextColor={colors.textFaint}
          value={name}
          onChangeText={setName}
          maxLength={40}
        />

        <SectionLabel>Amount ({currency})</SectionLabel>
        <TextInput
          style={styles.input}
          placeholder="0"
          placeholderTextColor={colors.textFaint}
          value={amountStr}
          onChangeText={(v) => setAmountStr(v.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
        />

        <SectionLabel>Due day of month (1–31)</SectionLabel>
        <TextInput
          style={styles.input}
          placeholder="1"
          placeholderTextColor={colors.textFaint}
          value={dayStr}
          onChangeText={(v) => setDayStr(v.replace(/[^0-9]/g, '').slice(0, 2))}
          keyboardType="number-pad"
        />

        <SectionLabel>Wallet</SectionLabel>
        <View style={styles.chipRow}>
          <Chip label="None" icon="wallet-outline" active={walletId == null} onPress={() => setWalletId(null)} />
          {wallets.map((w) => (
            <Chip
              key={w.id}
              label={w.name}
              icon={w.icon}
              accent={w.color}
              active={walletId === w.id}
              onPress={() => setWalletId(w.id)}
            />
          ))}
        </View>

        <SectionLabel>Color</SectionLabel>
        <View style={styles.swatchRow}>
          {COLORS.map((c) => {
            const active = c === color;
            return (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[styles.swatch, { backgroundColor: c }, active && styles.swatchActive]}
              >
                {active && <Ionicons name="checkmark" size={16} color={colors.bg} />}
              </Pressable>
            );
          })}
        </View>

        <SectionLabel>Icon</SectionLabel>
        <View style={styles.iconRow}>
          {ICONS.map((ic) => {
            const active = ic === icon;
            return (
              <Pressable
                key={ic}
                onPress={() => setIcon(ic)}
                style={[
                  styles.iconBox,
                  active && { borderColor: color, backgroundColor: hexA(color, 0.14) },
                ]}
              >
                <Ionicons name={ic} size={20} color={active ? color : colors.textMuted} />
              </Pressable>
            );
          })}
        </View>

        {editingId && (
          <Pressable onPress={onDelete} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
            <Text style={[typography.label, { color: colors.danger, marginLeft: 8 }]}>
              Delete bill
            </Text>
          </Pressable>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable
          onPress={onSubmit}
          disabled={saving}
          style={[styles.saveBtn, saving && { opacity: 0.5 }, shadow.gold]}
        >
          <Ionicons name="checkmark" size={20} color={colors.bg} />
          <Text style={styles.saveText}>{editingId ? 'Save changes' : 'Add bill'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function SectionLabel({ children }) {
  return (
    <Text style={[typography.caption, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>
      {children}
    </Text>
  );
}

function Chip({ label, icon, active, accent = colors.gold, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && { borderColor: accent, backgroundColor: hexA(accent, 0.14) }]}
    >
      {icon && (
        <Ionicons name={icon} size={14} color={active ? accent : colors.textMuted} style={{ marginRight: 6 }} />
      )}
      <Text style={[typography.label, { color: active ? colors.text : colors.textMuted }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function hexA(hex, alpha) {
  const h = hex.replace('#', '');
  const i = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(i >> 16) & 255}, ${(i >> 8) & 255}, ${i & 255}, ${alpha})`;
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
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
  },
  previewIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  swatch: {
    width: 40, height: 40, borderRadius: radius.pill,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  swatchActive: { borderColor: colors.text },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  iconBox: {
    width: 52, height: 52, borderRadius: radius.lg,
    backgroundColor: colors.bgElevated,
    borderWidth: 1, borderColor: colors.borderSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 122, 0.4)',
    backgroundColor: 'rgba(255, 92, 122, 0.08)',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    backgroundColor: colors.bg,
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
  saveText: { color: colors.bg, fontSize: 16, fontWeight: '700' },
});
