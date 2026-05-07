import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { format } from 'date-fns';

import { listBills, listTransactions, getSetting, setSetting } from '../db/db';
import { sumExpenses, sumSavings } from './aggregations';
import { spikeAlerts } from './insights';
import { formatAmount } from './currency';
import { reminderDate, nextDueDate, isPaid } from './bills';

const DAY = 24 * 60 * 60 * 1000;
const WEEKLY_ID_KEY = 'weekly_summary_notification_id';
export const WEEKLY_ENABLED_KEY = 'weekly_summary_enabled';
export const WEEKLY_HOUR_KEY = 'weekly_summary_hour';
export const WEEKLY_MIN_KEY  = 'weekly_summary_minute';
const BILL_IDS_KEY = 'bill_reminder_ids';

const isWeb = Platform.OS === 'web';

if (!isWeb) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function ensurePermissions() {
  if (isWeb) return false;
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === 'granted';
}

async function buildWeeklySummary(currency) {
  const now = Date.now();
  const from = now - 7 * DAY;
  const all = await listTransactions();

  const spent = sumExpenses(all, from, now);
  const saved = sumSavings(all, from, now);
  const spikes = spikeAlerts(all, new Date());

  const headline = saved > spent ? 'Strong saving week' : 'Weekly check-in';

  let body = `Spent ${formatAmount(spent, currency, { compact: true })} · Saved ${formatAmount(saved, currency, { compact: true })}`;
  if (spikes[0]) body += ` · Spike on ${spikes[0].label}`;

  return { title: headline, body };
}

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('weekly-summary', {
    name: 'Weekly summary',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200, 200, 200],
    lightColor: '#F5C842',
  });
  await Notifications.setNotificationChannelAsync('bills', {
    name: 'Bills',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 200, 200],
    lightColor: '#FFB155',
  });
}

export async function scheduleWeeklySummary({ hour = 19, minute = 0, currency = 'MKD' }) {
  if (isWeb) return { ok: false, reason: 'web' };

  const ok = await ensurePermissions();
  if (!ok) return { ok: false, reason: 'permission' };

  await ensureChannel();
  await cancelWeeklySummary();

  const { title, body } = await buildWeeklySummary(currency);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title, body, sound: 'default',
      ...(Platform.OS === 'android' ? { channelId: 'weekly-summary' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1,
      hour,
      minute,
    },
  });

  await setSetting(WEEKLY_ID_KEY, id);
  await setSetting(WEEKLY_ENABLED_KEY, '1');
  await setSetting(WEEKLY_HOUR_KEY, String(hour));
  await setSetting(WEEKLY_MIN_KEY, String(minute));

  return { ok: true, id };
}

export async function cancelWeeklySummary() {
  if (isWeb) return;
  const id = await getSetting(WEEKLY_ID_KEY, null);
  if (id) {
    try { await Notifications.cancelScheduledNotificationAsync(id); } catch {}
  }
  await setSetting(WEEKLY_ID_KEY, '');
  await setSetting(WEEKLY_ENABLED_KEY, '0');
}

export async function refreshWeeklyIfEnabled(currency) {
  if (isWeb) return;
  const enabled = await getSetting(WEEKLY_ENABLED_KEY, '0');
  if (enabled !== '1') return;
  const hour   = parseInt(await getSetting(WEEKLY_HOUR_KEY, '19'), 10);
  const minute = parseInt(await getSetting(WEEKLY_MIN_KEY,  '0'),  10);
  await scheduleWeeklySummary({ hour, minute, currency });
}

export async function getWeeklySettings() {
  const enabled = (await getSetting(WEEKLY_ENABLED_KEY, '0')) === '1';
  const hour    = parseInt(await getSetting(WEEKLY_HOUR_KEY, '19'), 10);
  const minute  = parseInt(await getSetting(WEEKLY_MIN_KEY,  '0'),  10);
  return { enabled, hour, minute };
}

export async function sendTestNotification(currency) {
  if (isWeb) return false;
  const ok = await ensurePermissions();
  if (!ok) return false;
  await ensureChannel();
  const { title, body } = await buildWeeklySummary(currency);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Test · ${title}`, body, sound: 'default',
      ...(Platform.OS === 'android' ? { channelId: 'weekly-summary' } : {}),
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2 },
  });
  return true;
}

export async function cancelBillReminders() {
  if (isWeb) return;
  const stored = await getSetting(BILL_IDS_KEY, '[]');
  let ids = [];
  try { ids = JSON.parse(stored); } catch {}
  for (const id of ids) {
    try { await Notifications.cancelScheduledNotificationAsync(id); } catch {}
  }
  await setSetting(BILL_IDS_KEY, '[]');
}

export async function scheduleBillReminders(currency = 'MKD') {
  if (isWeb) return { ok: false, reason: 'web' };

  const granted = await ensurePermissions();
  if (!granted) return { ok: false, reason: 'permission' };

  await ensureChannel();
  await cancelBillReminders();

  const bills = await listBills();
  const now = new Date();
  const newIds = [];

  for (const bill of bills) {
    if (isPaid(bill, now)) continue;
    const remind = reminderDate(bill, now);
    if (remind <= now) continue;

    const due = nextDueDate(bill, now);
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${bill.name} due in 2 days`,
        body: `${formatAmount(bill.amount, currency, { compact: true })} due ${format(due, 'EEE MMM d')}`,
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: 'bills' } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: remind,
      },
    });
    newIds.push(id);
  }

  await setSetting(BILL_IDS_KEY, JSON.stringify(newIds));
  return { ok: true, count: newIds.length };
}
