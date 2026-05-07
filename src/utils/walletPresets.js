export const WALLET_TYPES = [
  { id: 'cash',    label: 'Cash',    icon: 'cash' },
  { id: 'card',    label: 'Card',    icon: 'card' },
  { id: 'savings', label: 'Savings', icon: 'lock-closed' },
  { id: 'other',   label: 'Other',   icon: 'wallet' },
];

export const WALLET_COLORS = [
  '#F5C842', '#4ADE80', '#5BA8FF', '#B07BFF',
  '#FF6B6B', '#FFB155', '#7FE0D4', '#FF8FB1',
];

export const WALLET_ICONS = [
  'wallet', 'cash', 'card', 'lock-closed',
  'gift', 'briefcase', 'airplane', 'home',
  'star', 'heart', 'paw', 'leaf',
];

export function getWalletTypeLabel(type) {
  return WALLET_TYPES.find((t) => t.id === type)?.label || 'Other';
}
