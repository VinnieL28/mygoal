export const colors = {
  bg: '#0B0F1A',
  bgElevated: '#121826',
  surface: '#1A2233',
  surfaceHigh: '#222C42',
  border: '#2A3450',
  borderSoft: '#1F2A3F',

  gold: '#F5C842',
  goldDim: '#C9A22F',
  goldGlow: 'rgba(245, 200, 66, 0.18)',

  text: '#F5F7FB',
  textMuted: '#9AA4BF',
  textFaint: '#5C6680',

  success: '#4ADE80',
  danger: '#FF5C7A',
  info: '#5BA8FF',
  warning: '#FFB155',

  cat: {
    food: '#FF6B6B',
    transport: '#5BA8FF',
    shopping: '#B07BFF',
    bills: '#FFB155',
    fun: '#4ADE80',
    health: '#FF8FB1',
    home: '#7FE0D4',
    other: '#9AA4BF',
    income: '#F5C842',
    savings: '#4ADE80',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const typography = {
  display: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
    color: colors.text,
  },
  h1: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.text,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: colors.text,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  body: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  bodyMuted: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textMuted,
  },
  caption: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  mono: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  gold: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
};

export default { colors, spacing, radius, typography, shadow };
