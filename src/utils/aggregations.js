import { startOfMonth, endOfMonth } from 'date-fns';

import { getCategory } from './categories';

export function monthRange(date = new Date()) {
  return { from: startOfMonth(date).getTime(), to: endOfMonth(date).getTime() };
}

export function inRange(tx, from, to) {
  return tx.occurred_at >= from && tx.occurred_at <= to;
}

export function sumExpenses(transactions, from, to) {
  return transactions
    .filter((t) => t.kind === 'expense' && inRange(t, from, to))
    .reduce((s, t) => s + t.amount, 0);
}

export function sumSavings(transactions, from, to) {
  return transactions
    .filter((t) => t.kind === 'savings' && inRange(t, from, to))
    .reduce((s, t) => s + t.amount, 0);
}

export function sumIncome(transactions, from, to) {
  return transactions
    .filter((t) => t.kind === 'income' && inRange(t, from, to))
    .reduce((s, t) => s + t.amount, 0);
}

export function expensesByCategory(transactions, from, to) {
  const map = {};
  for (const t of transactions) {
    if (t.kind !== 'expense' || !inRange(t, from, to)) continue;
    map[t.category] = (map[t.category] || 0) + t.amount;
  }
  return Object.entries(map)
    .map(([id, value]) => {
      const cat = getCategory(id);
      return { id, label: cat.label, color: cat.color, icon: cat.icon, value };
    })
    .sort((a, b) => b.value - a.value);
}

export function walletBalance(wallet, transactions) {
  let balance = wallet.starting_balance || 0;
  for (const t of transactions) {
    if (t.wallet_id !== wallet.id) continue;
    if (t.kind === 'income' || t.kind === 'savings') balance += t.amount;
    else if (t.kind === 'expense') balance -= t.amount;
  }
  return balance;
}
