import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'mygoal:v1';

const DEFAULT = {
  wallets: [],
  transactions: [],
  goals: [],
  bills: [],
  settings: {},
};

let cache = null;
let loadPromise = null;

async function ensureLoaded() {
  if (cache) return cache;
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      cache = raw
        ? { ...DEFAULT, ...JSON.parse(raw) }
        : { ...DEFAULT, wallets: [], transactions: [], goals: [], bills: [], settings: {} };
      // ensure shape
      cache.wallets ??= [];
      cache.transactions ??= [];
      cache.goals ??= [];
      cache.bills ??= [];
      cache.settings ??= {};
    } catch {
      cache = { wallets: [], transactions: [], goals: [], bills: [], settings: {} };
    }
    return cache;
  })();
  return loadPromise;
}

async function commit() {
  await AsyncStorage.setItem(KEY, JSON.stringify(cache));
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export async function getDb() {
  return ensureLoaded();
}

export async function getSetting(key, fallback = null) {
  await ensureLoaded();
  return Object.prototype.hasOwnProperty.call(cache.settings, key) ? cache.settings[key] : fallback;
}

export async function setSetting(key, value) {
  await ensureLoaded();
  cache.settings[key] = String(value);
  await commit();
}

export async function listWallets() {
  await ensureLoaded();
  return [...cache.wallets].sort((a, b) => a.created_at - b.created_at);
}

export async function getWallet(id) {
  await ensureLoaded();
  return cache.wallets.find((w) => w.id === id) || null;
}

export async function createWallet({ name, type, icon, color, starting_balance = 0 }) {
  await ensureLoaded();
  const id = uid();
  cache.wallets.push({
    id, name, type, icon, color,
    starting_balance: Number(starting_balance) || 0,
    created_at: Date.now(),
  });
  await commit();
  return id;
}

export async function updateWallet(id, { name, type, icon, color, starting_balance }) {
  await ensureLoaded();
  const w = cache.wallets.find((x) => x.id === id);
  if (!w) return;
  Object.assign(w, {
    name, type, icon, color,
    starting_balance: Number(starting_balance) || 0,
  });
  await commit();
}

export async function deleteWallet(id) {
  await ensureLoaded();
  cache.wallets = cache.wallets.filter((w) => w.id !== id);
  cache.transactions = cache.transactions.filter((t) => t.wallet_id !== id);
  await commit();
}

export async function listTransactions({ from, to, walletId } = {}) {
  await ensureLoaded();
  let arr = cache.transactions;
  if (from != null) arr = arr.filter((t) => t.occurred_at >= from);
  if (to != null) arr = arr.filter((t) => t.occurred_at <= to);
  if (walletId) arr = arr.filter((t) => t.wallet_id === walletId);
  return [...arr].sort((a, b) => b.occurred_at - a.occurred_at);
}

export async function createTransaction({ wallet_id, kind, amount, category, note, photo_uri, occurred_at }) {
  await ensureLoaded();
  const id = uid();
  cache.transactions.push({
    id, wallet_id, kind,
    amount: Number(amount) || 0,
    category,
    note: note ?? null,
    photo_uri: photo_uri ?? null,
    occurred_at,
    created_at: Date.now(),
  });
  await commit();
  return id;
}

export async function deleteTransaction(id) {
  await ensureLoaded();
  cache.transactions = cache.transactions.filter((t) => t.id !== id);
  await commit();
}

export async function listGoals() {
  await ensureLoaded();
  return [...cache.goals].sort((a, b) => a.created_at - b.created_at);
}

export async function getGoal(id) {
  await ensureLoaded();
  return cache.goals.find((g) => g.id === id) || null;
}

export async function createGoal({ wallet_id, title, target, deadline }) {
  await ensureLoaded();
  const id = uid();
  cache.goals.push({
    id,
    wallet_id: wallet_id ?? null,
    title,
    target: Number(target) || 0,
    deadline: deadline ?? null,
    created_at: Date.now(),
  });
  await commit();
  return id;
}

export async function updateGoal(id, { wallet_id, title, target, deadline }) {
  await ensureLoaded();
  const g = cache.goals.find((x) => x.id === id);
  if (!g) return;
  Object.assign(g, {
    wallet_id: wallet_id ?? null,
    title,
    target: Number(target) || 0,
    deadline: deadline ?? null,
  });
  await commit();
}

export async function deleteGoal(id) {
  await ensureLoaded();
  cache.goals = cache.goals.filter((g) => g.id !== id);
  await commit();
}

export async function listBills() {
  await ensureLoaded();
  return [...cache.bills].sort((a, b) => a.day_of_month - b.day_of_month || a.created_at - b.created_at);
}

export async function getBill(id) {
  await ensureLoaded();
  return cache.bills.find((b) => b.id === id) || null;
}

export async function createBill({ name, amount, day_of_month, category, color, icon, wallet_id }) {
  await ensureLoaded();
  const id = uid();
  cache.bills.push({
    id,
    name,
    amount: Number(amount) || 0,
    day_of_month: clampDay(day_of_month),
    category: category || 'bills',
    color: color || '#FFB155',
    icon: icon || 'receipt',
    wallet_id: wallet_id ?? null,
    paid_months: [],
    created_at: Date.now(),
  });
  await commit();
  return id;
}

export async function updateBill(id, patch) {
  await ensureLoaded();
  const b = cache.bills.find((x) => x.id === id);
  if (!b) return;
  if (patch.name != null) b.name = patch.name;
  if (patch.amount != null) b.amount = Number(patch.amount) || 0;
  if (patch.day_of_month != null) b.day_of_month = clampDay(patch.day_of_month);
  if (patch.category != null) b.category = patch.category;
  if (patch.color != null) b.color = patch.color;
  if (patch.icon != null) b.icon = patch.icon;
  if (patch.wallet_id !== undefined) b.wallet_id = patch.wallet_id;
  await commit();
}

export async function deleteBill(id) {
  await ensureLoaded();
  cache.bills = cache.bills.filter((b) => b.id !== id);
  await commit();
}

export async function setBillPaid(id, monthKey, paid) {
  await ensureLoaded();
  const b = cache.bills.find((x) => x.id === id);
  if (!b) return;
  const set = new Set(b.paid_months || []);
  if (paid) set.add(monthKey);
  else set.delete(monthKey);
  b.paid_months = Array.from(set);
  await commit();
}

function clampDay(v) {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return 1;
  return Math.max(1, Math.min(31, n));
}

export async function wipeAllData() {
  cache = {
    wallets: [],
    transactions: [],
    goals: [],
    bills: [],
    settings: {
      seeded_v1: '1',
      currency: cache?.settings?.currency || 'MKD',
    },
  };
  await commit();
}

export async function ensureSeed() {
  await ensureLoaded();
  if (cache.settings.seeded_v1 !== '1') {
    cache.settings.seeded_v1 = '1';
    await commit();
  }
}
