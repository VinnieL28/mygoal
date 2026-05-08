export const colors = {
  bg: '#0A0B10',
  bgElevated: '#13141B',
  surface: '#191B24',
  surfaceHigh: '#22242F',
  border: '#262833',
  borderSoft: '#1C1E27',

  gold: '#D4A640',
  goldDim: '#A88330',
  goldGlow: 'rgba(212, 166, 64, 0.12)',

  text: '#E8EBF0',
  textMuted: '#8A92A6',
  textFaint: '#535A6E',

  success: '#3DB976',
  danger:  '#E45757',
  info:    '#5B8DEF',
  warning: '#E0A848',

  cat: {
    food: '#8A92A6',
    transport: '#8A92A6',
    shopping: '#8A92A6',
    bills: '#D4A640',
    fun: '#8A92A6',
    health: '#8A92A6',
    home: '#8A92A6',
    other: '#535A6E',
    income: '#3DB976',
    savings: '#D4A640',
  },
};

export const spacing = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
  xxxl: 40,
};

export const radius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  pill: 999,
};

export const typography = {
  display: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: colors.text,
  },
  h1: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: colors.text,
  },
  h2: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: colors.text,
  },
  h3: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  body: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  bodyMuted: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  },
  caption: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  mono: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 2,
  },
  gold: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
};

export default { colors, spacing, radius, typography, shadow };
