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
import { WALLET_COLORS, WALLET_ICONS, WALLET_TYPES } from '../utils/walletPresets';
import { createWallet, deleteWallet, updateWallet } from '../db/db';
import { appConfirm } from '../utils/confirm';

export default function WalletFormScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const editingId = route.params?.id;
  const { wallets, transactions, currency, refresh } = useApp();

  const editing = useMemo(
    () => wallets.find((w) => w.id === editingId),
    [wallets, editingId],
  );

  const [name, setName] = useState('');
  const [type, setType] = useState('cash');
  const [icon, setIcon] = useState('wallet');
  const [color, setColor] = useState(colors.gold);
  const [startingStr, setStartingStr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setType(editing.type);
      setIcon(editing.icon);
      setColor(editing.color);
      const rate = CURRENCIES[currency]?.rateFromMKD || 1;
      const display = (editing.starting_balance || 0) * rate;
      setStartingStr(display ? String(Math.round(display * 100) / 100) : '');
    }
  }, [editing, currency]);

  const txCount = useMemo(
    () => (editing ? transactions.filter((t) => t.wallet_id === editing.id).length : 0),
    [editing, transactions],
  );

  const onSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Give your wallet a name.');
      return;
    }
    setSaving(true);
    const rate = CURRENCIES[currency]?.rateFromMKD || 1;
    const startMKD = (parseFloat(startingStr) || 0) / rate;

    try {
      if (editing) {
        await updateWallet(editing.id, {
          name: trimmed,
          type,
          icon,
          color,
          starting_balance: startMKD,
        });
      } else {
        await createWallet({
          name: trimmed,
          type,
          icon,
          color,
          starting_balance: startMKD,
        });
      }
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await refresh();
      navigation.goBack();
    } catch (e) {
      setSaving(false);
      Alert.alert('Could not save', String(e?.message || e));
    }
  };

  const onDelete = () => {
    if (!editing) return;
    const message = txCount > 0
      ? `This will permanently delete "${editing.name}" and ${txCount} transaction${txCount === 1 ? '' : 's'} on it.`
      : `Delete "${editing.name}"?`;
    appConfirm({
      title: 'Delete wallet',
      message,
      confirmText: 'Delete',
      destructive: true,
      onConfirm: async () => {
        await deleteWallet(editing.id);
        await refresh();
        navigation.popToTop();
        navigation.navigate('Wallets');
      },
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
        <Text style={typography.h3}>{editing ? 'Edit wallet' : 'New wallet'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 160 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.preview, { borderColor: hexA(color, 0.5) }, shadow.card]}>
          <View style={[styles.previewIcon, { backgroundColor: hexA(color, 0.22) }]}>
            <Ionicons name={icon} size={26} color={color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={typography.caption}>Preview</Text>
            <Text style={[typography.h2, { marginTop: 2 }]} numberOfLines={1}>
              {name.trim() || 'Wallet name'}
            </Text>
            <Text style={[typography.bodyMuted, { fontSize: 12 }]}>
              {formatAmount((parseFloat(startingStr) || 0) / (CURRENCIES[currency]?.rateFromMKD || 1), currency)}
            </Text>
          </View>
        </View>

        <SectionLabel>Name</SectionLabel>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Daily card"
          placeholderTextColor={colors.textFaint}
          maxLength={40}
        />

        <SectionLabel>Starting balance ({currency})</SectionLabel>
        <TextInput
          style={styles.input}
          value={startingStr}
          onChangeText={(v) => setStartingStr(v.replace(/[^0-9.]/g, ''))}
          placeholder="0"
          placeholderTextColor={colors.textFaint}
          keyboardType="decimal-pad"
        />

        <SectionLabel>Type</SectionLabel>
        <View style={styles.typeRow}>
          {WALLET_TYPES.map((t) => {
            const active = type === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => setType(t.id)}
                style={[styles.typeChip, active && styles.typeChipActive]}
              >
                <Ionicons name={t.icon} size={16} color={active ? colors.gold : colors.textMuted} />
                <Text style={[
                  typography.label,
                  { color: active ? colors.text : colors.textMuted, marginLeft: 6 },
                ]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <SectionLabel>Color</SectionLabel>
        <View style={styles.swatchRow}>
          {WALLET_COLORS.map((c) => {
            const active = c === color;
            return (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.swatch,
                  { backgroundColor: c },
                  active && styles.swatchActive,
                ]}
              >
                {active && <Ionicons name="checkmark" size={16} color={colors.bg} />}
              </Pressable>
            );
          })}
        </View>

        <SectionLabel>Icon</SectionLabel>
        <View style={styles.iconRow}>
          {WALLET_ICONS.map((ic) => {
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

        {editing && (
          <Pressable onPress={onDelete} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
            <Text style={[typography.label, { color: colors.danger, marginLeft: 8 }]}>
              Delete wallet
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
          <Text style={styles.saveText}>{editing ? 'Save changes' : 'Create wallet'}</Text>
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

function hexA(hex, alpha) {
  const h = hex.replace('#', '');
  const i = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
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
    borderWidth: 1,
    padding: spacing.lg,
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
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  typeChipActive: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(245, 200, 66, 0.12)',
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchActive: {
    borderColor: colors.text,
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
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
  saveText: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: '700',
  },
});
