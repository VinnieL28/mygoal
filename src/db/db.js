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
  if (cache.settings.seeded_v1 === '1') return;

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const cashId = uid();
  const cardId = uid();
  const savingsId = uid();

  cache.wallets.push(
    { id: cashId,    name: 'Cash',    type: 'cash',    icon: 'cash',        color: '#4ADE80', starting_balance: 4500,  created_at: now },
    { id: cardId,    name: 'Card',    type: 'card',    icon: 'card',        color: '#5BA8FF', starting_balance: 32000, created_at: now },
    { id: savingsId, name: 'Savings', type: 'savings', icon: 'lock-closed', color: '#F5C842', starting_balance: 18000, created_at: now },
  );

  const seed = [
    { d: 1,  w: cardId,    k: 'expense', a:  450, c: 'food',      n: 'Lunch' },
    { d: 2,  w: cashId,    k: 'expense', a:  120, c: 'transport', n: 'Bus' },
    { d: 3,  w: cardId,    k: 'expense', a: 1800, c: 'bills',     n: 'Internet' },
    { d: 4,  w: cardId,    k: 'expense', a:  890, c: 'shopping',  n: 'Shoes' },
    { d: 5,  w: savingsId, k: 'savings', a: 2000, c: 'savings',   n: 'Weekly save' },
    { d: 6,  w: cardId,    k: 'expense', a:  320, c: 'food',      n: 'Groceries' },
    { d: 7,  w: cashId,    k: 'expense', a:  200, c: 'fun',       n: 'Cinema' },
    { d: 9,  w: cardId,    k: 'income',  a:30000, c: 'income',    n: 'Salary' },
    { d: 10, w: cardId,    k: 'expense', a:  650, c: 'food',      n: 'Dinner' },
    { d: 12, w: cardId,    k: 'expense', a: 2400, c: 'shopping',  n: 'Jacket' },
    { d: 14, w: cashId,    k: 'expense', a:  150, c: 'transport', n: 'Taxi' },
    { d: 15, w: savingsId, k: 'savings', a: 2500, c: 'savings',   n: 'Weekly save' },
    { d: 17, w: cardId,    k: 'expense', a:  480, c: 'health',    n: 'Pharmacy' },
    { d: 19, w: cardId,    k: 'expense', a:  390, c: 'food',      n: 'Coffee runs' },
    { d: 21, w: cashId,    k: 'expense', a:  220, c: 'fun',       n: 'Concert ticket' },
    { d: 23, w: cardId,    k: 'expense', a: 1100, c: 'home',      n: 'Cleaning supplies' },
    { d: 25, w: cardId,    k: 'expense', a:  540, c: 'food',      n: 'Groceries' },
  ];
  for (const s of seed) {
    cache.transactions.push({
      id: uid(),
      wallet_id: s.w,
      kind: s.k,
      amount: s.a,
      category: s.c,
      note: s.n,
      photo_uri: null,
      occurred_at: now - s.d * day,
      created_at: now,
    });
  }

  cache.goals.push({
    id: uid(),
    wallet_id: savingsId,
    title: 'New laptop',
    target: 90000,
    deadline: now + 90 * day,
    created_at: now,
  });

  cache.bills.push(
    {
      id: uid(),
      name: 'Rent',
      amount: 18000,
      day_of_month: 1,
      category: 'home',
      color: '#7FE0D4',
      icon: 'home',
      wallet_id: cardId,
      paid_months: [],
      created_at: now,
    },
    {
      id: uid(),
      name: 'Electric',
      amount: 1500,
      day_of_month: 15,
      category: 'bills',
      color: '#FFB155',
      icon: 'flash',
      wallet_id: cardId,
      paid_months: [],
      created_at: now,
    },
    {
      id: uid(),
      name: 'Internet',
      amount: 1200,
      day_of_month: 20,
      category: 'bills',
      color: '#5BA8FF',
      icon: 'wifi',
      wallet_id: cardId,
      paid_months: [],
      created_at: now,
    },
  );

  cache.settings.seeded_v1 = '1';
  await commit();
}
