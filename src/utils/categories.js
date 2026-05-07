import { colors } from '../theme/theme';

export const CATEGORIES = [
  { id: 'food',      label: 'Food',       icon: 'fast-food',         color: colors.cat.food },
  { id: 'transport', label: 'Transport',  icon: 'car',               color: colors.cat.transport },
  { id: 'shopping',  label: 'Shopping',   icon: 'bag-handle',        color: colors.cat.shopping },
  { id: 'bills',     label: 'Bills',      icon: 'receipt',           color: colors.cat.bills },
  { id: 'fun',       label: 'Fun',        icon: 'game-controller',   color: colors.cat.fun },
  { id: 'health',    label: 'Health',     icon: 'fitness',           color: colors.cat.health },
  { id: 'home',      label: 'Home',       icon: 'home',              color: colors.cat.home },
  { id: 'other',     label: 'Other',      icon: 'ellipsis-horizontal', color: colors.cat.other },
  { id: 'income',    label: 'Income',     icon: 'trending-up',       color: colors.cat.income },
  { id: 'savings',   label: 'Savings',    icon: 'lock-closed',       color: colors.cat.savings },
];

export const CATEGORY_MAP = CATEGORIES.reduce((acc, c) => {
  acc[c.id] = c;
  return acc;
}, {});

export const EXPENSE_CATEGORIES = CATEGORIES.filter(
  (c) => c.id !== 'income' && c.id !== 'savings',
);

export const INCOME_CATEGORIES = CATEGORIES.filter((c) => c.id === 'income');

export function getCategory(id) {
  return CATEGORY_MAP[id] || CATEGORY_MAP.other;
}
