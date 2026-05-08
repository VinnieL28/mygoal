import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { colors, radius, spacing, typography, shadow } from '../theme/theme';
import { useApp } from '../state/AppContext';
import CurrencyToggle from '../components/CurrencyToggle';
import {
  cancelBillReminders,
  cancelWeeklySummary,
  ensurePermissions,
  getWeeklySettings,
  scheduleWeeklySummary,
  sendTestNotification,
} from '../utils/notifications';
import { exportCSV, exportJSON } from '../utils/exporter';
import { wipeAllData } from '../db/db';
import { appConfirm } from '../utils/confirm';

const TIME_OPTIONS = [
  { id: '09:00', label: '9:00 AM',  hour: 9,  minute: 0 },
  { id: '12:00', label: '12:00 PM', hour: 12, minute: 0 },
  { id: '17:00', label: '5:00 PM',  hour: 17, minute: 0 },
  { id: '19:00', label: '7:00 PM',  hour: 19, minute: 0 },
  { id: '21:00', label: '9:00 PM',  hour: 21, minute: 0 },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { currency, setCurrency, refresh } = useApp();

  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(19);
  const [minute, setMinute] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getWeeklySettings();
      setEnabled(s.enabled);
      setHour(s.hour);
      setMinute(s.minute);
    })();
  }, []);

  const haptic = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
  };

  const toggleWeekly = async (next) => {
    haptic();
    setBusy(true);
    try {
      if (next) {
        const ok = await ensurePermissions();
        if (!ok) {
          Alert.alert(
            'Notifications disabled',
            'Enable notifications for MyGoal in your system settings to receive your weekly summary.',
          );
          setBusy(false);
          return;
        }
        const r = await scheduleWeeklySummary({ hour, minute, currency });
        setEnabled(r.ok);
      } else {
        await cancelWeeklySummary();
        setEnabled(false);
      }
    } finally {
      setBusy(false);
    }
  };

  const setTime = async (h, m) => {
    haptic();
    setHour(h);
    setMinute(m);
    if (enabled) {
      setBusy(true);
      await scheduleWeeklySummary({ hour: h, minute: m, currency });
      setBusy(false);
    }
  };

  const onTest = async () => {
    haptic();
    const ok = await sendTestNotification(currency);
    if (!ok) {
      Alert.alert('Notifications disabled', 'Enable notifications first.');
    }
  };

  const onReset = () => {
    appConfirm({
      title: 'Reset all data?',
      message: 'This permanently deletes every wallet, transaction, goal, and bill. This cannot be undone.',
      confirmText: 'Reset everything',
      destructive: true,
      onConfirm: async () => {
        haptic();
        setBusy(true);
        try {
          await Promise.all([
            cancelWeeklySummary().catch(() => {}),
            cancelBillReminders().catch(() => {}),
          ]);
          await wipeAllData();
          await refresh();
          setEnabled(false);
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.alert('All data has been reset.');
          }
          navigation.goBack();
        } catch (e) {
          Alert.alert('Reset failed', String(e?.message || e));
        } finally {
          setBusy(false);
        }
      },
    });
  };

  const onExport = async (kind) => {
    haptic();
    setBusy(true);
    try {
      const fn = kind === 'csv' ? exportCSV : exportJSON;
      const r = await fn();
      // sharing dialog already opened; nothing else to do
      // the file remains in document directory at r.uri
      void r;
    } catch (e) {
      Alert.alert('Export failed', String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const activeTime = TIME_OPTIONS.find((t) => t.hour === hour && t.minute === minute)?.id;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={typography.h3}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: 120 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        <SectionTitle icon="cash" title="Currency" />
        <View style={[styles.card, shadow.card]}>
          <Text style={[typography.bodyMuted, { fontSize: 13, marginBottom: spacing.md }]}>
            All amounts are stored in MKD. Toggle changes display only.
          </Text>
          <CurrencyToggle value={currency} onChange={setCurrency} />
        </View>

        <SectionTitle icon="notifications" title="Weekly summary" />
        <View style={[styles.card, shadow.card]}>
          <View style={styles.rowSplit}>
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text style={typography.body}>Sunday push notification</Text>
              <Text style={[typography.bodyMuted, { fontSize: 12, marginTop: 2 }]}>
                A summary of the past week, sent every Sunday.
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={toggleWeekly}
              disabled={busy}
              trackColor={{ false: colors.surface, true: colors.gold }}
              thumbColor={enabled ? colors.bg : '#fff'}
              ios_backgroundColor={colors.surface}
            />
          </View>

          {enabled && (
            <>
              <Text style={[typography.caption, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>
                Time
              </Text>
              <View style={styles.timeRow}>
                {TIME_OPTIONS.map((opt) => {
                  const active = activeTime === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => setTime(opt.hour, opt.minute)}
                      style={[styles.timeChip, active && styles.timeChipActive]}
                    >
                      <Text style={[
                        typography.label,
                        { color: active ? colors.bg : colors.textMuted, fontSize: 12 },
                      ]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable onPress={onTest} style={styles.linkBtn}>
                <Ionicons name="paper-plane-outline" size={16} color={colors.gold} />
                <Text style={[typography.label, { color: colors.gold, marginLeft: 8 }]}>
                  Send test notification
                </Text>
              </Pressable>
            </>
          )}
        </View>

        <SectionTitle icon="download" title="Export data" />
        <View style={[styles.card, shadow.card]}>
          <Text style={[typography.bodyMuted, { fontSize: 13, marginBottom: spacing.md }]}>
            All data lives on your device. Export anytime — open in Excel/Numbers (CSV) or save a full backup (JSON).
          </Text>
          <Pressable onPress={() => onExport('csv')} disabled={busy} style={[styles.exportBtn, busy && { opacity: 0.5 }]}>
            <View style={[styles.exportIcon, { backgroundColor: 'rgba(91, 168, 255, 0.18)' }]}>
              <Ionicons name="grid-outline" size={18} color={colors.info} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={typography.body}>Export CSV</Text>
              <Text style={[typography.bodyMuted, { fontSize: 12 }]}>Transactions only · spreadsheet-ready</Text>
            </View>
            <Ionicons name="share-outline" size={18} color={colors.textMuted} />
          </Pressable>

          <View style={{ height: spacing.sm }} />

          <Pressable onPress={() => onExport('json')} disabled={busy} style={[styles.exportBtn, busy && { opacity: 0.5 }]}>
            <View style={[styles.exportIcon, { backgroundColor: 'rgba(245, 200, 66, 0.18)' }]}>
              <Ionicons name="archive-outline" size={18} color={colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={typography.body}>Export JSON backup</Text>
              <Text style={[typography.bodyMuted, { fontSize: 12 }]}>Wallets, goals, transactions</Text>
            </View>
            <Ionicons name="share-outline" size={18} color={colors.textMuted} />
          </Pressable>
        </View>

        <SectionTitle icon="warning" title="Danger zone" />
        <View style={[styles.card]}>
          <Text style={[typography.bodyMuted, { fontSize: 13, marginBottom: spacing.md }]}>
            Wipes all wallets, transactions, and goals (including the sample data). Cannot be undone.
          </Text>
          <Pressable onPress={onReset} disabled={busy} style={[styles.resetBtn, busy && { opacity: 0.5 }]}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
            <Text style={[typography.label, { color: colors.danger, marginLeft: 8 }]}>
              Reset all data
            </Text>
          </Pressable>
        </View>

        <SectionTitle icon="information-circle" title="About" />
        <View style={[styles.card]}>
          <Row label="Version" value="1.0.0" />
          <Row label="Storage" value="On-device SQLite" />
          <Row label="Privacy" value="100% offline" last />
        </View>
      </ScrollView>
    </View>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <View style={styles.sectionTitle}>
      <Ionicons name={icon} size={14} color={colors.gold} style={{ marginRight: 6 }} />
      <Text style={typography.h3}>{title}</Text>
    </View>
  );
}

function Row({ label, value, last }) {
  return (
    <View style={[styles.aboutRow, !last && { borderBottomWidth: 1, borderBottomColor: colors.borderSoft }]}>
      <Text style={typography.bodyMuted}>{label}</Text>
      <Text style={typography.body}>{value}</Text>
    </View>
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
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowSplit: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  timeChipActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(245, 200, 66, 0.4)',
    backgroundColor: 'rgba(245, 200, 66, 0.08)',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    gap: spacing.md,
  },
  exportIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 122, 0.4)',
    backgroundColor: 'rgba(255, 92, 122, 0.08)',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
});
