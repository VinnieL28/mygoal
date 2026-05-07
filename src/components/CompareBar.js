import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing, typography } from '../theme/theme';
import { formatAmount } from '../utils/currency';

export default function CompareBar({ row, max, currency }) {
  const curW  = max > 0 ? (row.current  / max) * 100 : 0;
  const prevW = max > 0 ? (row.previous / max) * 100 : 0;
  const delta = row.previous > 0 ? (row.current - row.previous) / row.previous : null;
  const deltaUp = delta != null && delta > 0;
  const deltaColor = deltaUp ? colors.danger : delta != null && delta < 0 ? colors.success : colors.textMuted;

  return (
    <View style={styles.row}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <View style={[styles.iconWrap, { backgroundColor: hexA(row.color, 0.18) }]}>
            <Ionicons name={row.icon} size={14} color={row.color} />
          </View>
          <Text style={typography.body} numberOfLines={1}>{row.label}</Text>
        </View>
        {delta != null && (
          <View style={styles.deltaPill}>
            <Ionicons
              name={deltaUp ? 'arrow-up' : delta < 0 ? 'arrow-down' : 'remove'}
              size={11}
              color={deltaColor}
              style={{ marginRight: 2 }}
            />
            <Text style={[typography.label, { color: deltaColor, fontSize: 11 }]}>
              {Math.abs(Math.round(delta * 100))}%
            </Text>
          </View>
        )}
      </View>

      <View style={styles.bars}>
        <Bar widthPct={curW}  color={row.color} value={formatAmount(row.current, currency, { compact: true })} bold />
        <Bar widthPct={prevW} color={hexA(row.color, 0.4)} value={formatAmount(row.previous, currency, { compact: true })} muted />
      </View>
    </View>
  );
}

function Bar({ widthPct, color, value, bold, muted }) {
  return (
    <View style={styles.barRow}>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.max(2, widthPct)}%`, backgroundColor: color }]} />
      </View>
      <Text style={[
        typography.mono,
        { fontSize: 12, marginLeft: spacing.sm, minWidth: 70, textAlign: 'right' },
        bold && { fontWeight: '700' },
        muted && { color: colors.textMuted },
      ]}>
        {value}
      </Text>
    </View>
  );
}

function hexA(hex, alpha) {
  const h = hex.replace('#', '');
  const i = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(i >> 16) & 255}, ${(i >> 8) & 255}, ${i & 255}, ${alpha})`;
}

const styles = StyleSheet.create({
  row: { marginBottom: spacing.md },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  bars: { gap: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center' },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 4 },
});
