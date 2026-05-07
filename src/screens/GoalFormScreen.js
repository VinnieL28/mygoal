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
import { addMonths, format } from 'date-fns';

import { colors, radius, spacing, typography, shadow } from '../theme/theme';
import { useApp } from '../state/AppContext';
import { CURRENCIES, formatAmount } from '../utils/currency';
import { createGoal, deleteGoal, getGoal, updateGoal } from '../db/db';

const DEADLINE_PRESETS = [
  { id: 'none', label: 'No deadline', months: null },
  { id: '1m',   label: '1 month',     months: 1 },
  { id: '3m',   label: '3 months',    months: 3 },
  { id: '6m',   label: '6 months',    months: 6 },
  { id: '12m',  label: '1 year',      months: 12 },
];

export default function GoalFormScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const editingId = route.params?.id;
  const { wallets, currency, refresh } = useApp();

  const [title, setTitle] = useState('');
  const [targetStr, setTargetStr] = useState('');
  const [walletId, setWalletId] = useState(null);
  const [deadlinePreset, setDeadlinePreset] = useState('3m');
  const [savedDeadline, setSavedDeadline] = useState(null);
  const [loading, setLoading] = useState(!!editingId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!editingId) return;
      const g = await getGoal(editingId);
      if (g) {
        setTitle(g.title);
        const rate = CURRENCIES[currency]?.rateFromMKD || 1;
        setTargetStr(String(Math.round((g.target * rate) * 100) / 100));
        setWalletId(g.wallet_id);
        if (g.deadline) {
          setDeadlinePreset('custom');
          setSavedDeadline(g.deadline);
        } else {
          setDeadlinePreset('none');
        }
      }
      setLoading(false);
    })();
  }, [editingId, currency]);

  const savingsWallets = useMemo(
    () => wallets.filter((w) => w.type === 'savings'),
    [wallets],
  );

  const computedDeadline = useMemo(() => {
    if (deadlinePreset === 'none') return null;
    if (deadlinePreset === 'custom') return savedDeadline;
    const preset = DEADLINE_PRESETS.find((p) => p.id === deadlinePreset);
    if (!preset?.months) return null;
    return addMonths(new Date(), preset.months).getTime();
  }, [deadlinePreset, savedDeadline]);

  const onSubmit = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      Alert.alert('Title required', 'Give your goal a name.');
      return;
    }
    const target = parseFloat(targetStr) || 0;
    if (target <= 0) {
      Alert.alert('Target required', 'Set an amount you want to save.');
      return;
    }
    setSaving(true);
    const rate = CURRENCIES[currency]?.rateFromMKD || 1;
    const targetMKD = target / rate;

    try {
      if (editingId) {
        await updateGoal(editingId, {
          wallet_id: walletId,
          title: trimmed,
          target: targetMKD,
          deadline: computedDeadline,
        });
      } else {
        await createGoal({
          wallet_id: walletId,
          title: trimmed,
          target: targetMKD,
          deadline: computedDeadline,
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
    if (!editingId) return;
    Alert.alert('Delete goal', 'This goal will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteGoal(editingId);
          await refresh();
          navigation.goBack();
        },
      },
    ]);
  };

  if (loading) {
    return <View style={styles.root} />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
        <Text style={typography.h3}>{editingId ? 'Edit goal' : 'New goal'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 160 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.preview, shadow.card]}>
          <View style={[styles.iconWrap, { backgroundColor: 'rgba(245, 200, 66, 0.18)' }]}>
            <Ionicons name="flag" size={22} color={colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={typography.caption}>Target</Text>
            <Text style={[typography.h1, { marginTop: 2 }]} numberOfLines={1}>
              {formatAmount((parseFloat(targetStr) || 0) / (CURRENCIES[currency]?.rateFromMKD || 1), currency)}
            </Text>
            <Text style={[typography.bodyMuted, { fontSize: 12 }]}>
              {title.trim() || 'Goal title'}
              {computedDeadline ? ` · by ${format(new Date(computedDeadline), 'MMM d, yyyy')}` : ''}
            </Text>
          </View>
        </View>

        <SectionLabel>Title</SectionLabel>
        <TextInput
          style={styles.input}
          placeholder="e.g. New laptop"
          placeholderTextColor={colors.textFaint}
          value={title}
          onChangeText={setTitle}
          maxLength={50}
        />

        <SectionLabel>Target amount ({currency})</SectionLabel>
        <TextInput
          style={styles.input}
          placeholder="0"
          placeholderTextColor={colors.textFaint}
          value={targetStr}
          onChangeText={(v) => setTargetStr(v.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
        />

        <SectionLabel>Wallet</SectionLabel>
        <View style={styles.chipRow}>
          <Chip
            label="All wallets"
            icon="wallet-outline"
            active={walletId == null}
            onPress={() => setWalletId(null)}
          />
          {savingsWallets.map((w) => (
            <Chip
              key={w.id}
              label={w.name}
              icon={w.icon}
              accent={w.color}
              active={walletId === w.id}
              onPress={() => setWalletId(w.id)}
            />
          ))}
          {savingsWallets.length === 0 && (
            <Text style={[typography.bodyMuted, { fontSize: 12 }]}>
              Tip: create a Savings-type wallet to track per-wallet goals.
            </Text>
          )}
        </View>

        <SectionLabel>Deadline</SectionLabel>
        <View style={styles.chipRow}>
          {DEADLINE_PRESETS.map((p) => (
            <Chip
              key={p.id}
              label={p.label}
              active={deadlinePreset === p.id}
              onPress={() => setDeadlinePreset(p.id)}
            />
          ))}
          {deadlinePreset === 'custom' && savedDeadline && (
            <Chip
              label={`Saved · ${format(new Date(savedDeadline), 'MMM d, yyyy')}`}
              active
              onPress={() => {}}
            />
          )}
        </View>

        {editingId && (
          <Pressable onPress={onDelete} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
            <Text style={[typography.label, { color: colors.danger, marginLeft: 8 }]}>
              Delete goal
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
          <Text style={styles.saveText}>{editingId ? 'Save changes' : 'Create goal'}</Text>
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
      style={[
        styles.chip,
        active && { borderColor: accent, backgroundColor: hexA(accent, 0.14) },
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={active ? accent : colors.textMuted}
          style={{ marginRight: 6 }}
        />
      )}
      <Text style={[
        typography.label,
        { color: active ? colors.text : colors.textMuted },
      ]}>{label}</Text>
    </Pressable>
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
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 48,
    height: 48,
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },
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
