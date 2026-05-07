import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';

import { listBills, listGoals, listTransactions, listWallets } from '../db/db';

function csvEscape(v) {
  if (v == null) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function exportCSV() {
  const [transactions, wallets] = await Promise.all([listTransactions(), listWallets()]);
  const walletNameById = wallets.reduce((m, w) => ((m[w.id] = w.name), m), {});

  const header = ['date', 'kind', 'amount_mkd', 'category', 'wallet', 'note'];
  const rows = transactions.map((t) => [
    format(new Date(t.occurred_at), 'yyyy-MM-dd HH:mm'),
    t.kind,
    t.amount,
    t.category,
    walletNameById[t.wallet_id] || t.wallet_id,
    t.note || '',
  ]);

  const csv = [header, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n');
  const filename = `mygoal-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  return writeAndShare(filename, csv, 'text/csv');
}

export async function exportJSON() {
  const [transactions, wallets, goals, bills] = await Promise.all([
    listTransactions(),
    listWallets(),
    listGoals(),
    listBills(),
  ]);

  const payload = {
    app: 'MyGoal',
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    base_currency: 'MKD',
    wallets,
    goals,
    bills,
    transactions,
  };

  const filename = `mygoal-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
  return writeAndShare(filename, JSON.stringify(payload, null, 2), 'application/json');
}

async function writeAndShare(filename, contents, mime) {
  if (Platform.OS === 'web') {
    const blob = new Blob([contents], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { uri: url, filename };
  }

  const uri = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, contents, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const available = await Sharing.isAvailableAsync();
  if (available) {
    await Sharing.shareAsync(uri, {
      mimeType: mime,
      dialogTitle: 'Export MyGoal data',
      UTI: mime === 'text/csv' ? 'public.comma-separated-values-text' : 'public.json',
    });
  }
  return { uri, filename };
}
