import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isToday,
  startOfMonth,
} from 'date-fns';

import { colors, radius, spacing, typography } from '../theme/theme';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function Heatmap({ month, daySpend, selectedDate, onSelectDate }) {
  const { cells, max } = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const days = eachDayOfInterval({ start, end });

    const offset = (getDay(start) + 6) % 7;
    const leading = Array.from({ length: offset }, () => null);

    const dayValues = days.map((d) => {
      const key = format(d, 'yyyy-MM-dd');
      return { date: d, value: daySpend[key] || 0 };
    });

    const m = Math.max(0, ...dayValues.map((d) => d.value));

    return { cells: [...leading, ...dayValues], max: m };
  }, [month, daySpend]);

  return (
    <View>
      <View style={styles.weekRow}>
        {WEEKDAYS.map((w, i) => (
          <Text key={i} style={styles.weekday}>{w}</Text>
        ))}
      </View>
      <View style={styles.grid}>
        {chunk(cells, 7).map((row, ri) => (
          <View key={`r-${ri}`} style={styles.gridRow}>
            {row.map((cell, ci) => {
              if (!cell) return <View key={`e-${ri}-${ci}`} style={styles.cell} />;
              const intensity = max > 0 ? cell.value / max : 0;
              const bg = cell.value === 0 ? colors.surface : intensityColor(intensity);
              const today = isToday(cell.date);
              const selected = selectedDate && isSameDay(selectedDate, cell.date);
              return (
                <Pressable
                  key={`c-${ri}-${ci}`}
                  onPress={() => onSelectDate(cell.date)}
                  style={[
                    styles.cell,
                    styles.dayCell,
                    { backgroundColor: bg },
                    today && { borderColor: colors.gold, borderWidth: 1.5 },
                    selected && {
                      borderColor: colors.text,
                      borderWidth: 2,
                      transform: [{ scale: 1.05 }],
                    },
                  ]}
                >
                  <Text style={[
                    styles.dayNum,
                    cell.value > 0 && intensity > 0.55 && { color: colors.bg, fontWeight: '700' },
                    today && { color: colors.gold, fontWeight: '700' },
                  ]}>
                    {format(cell.date, 'd')}
                  </Text>
                </Pressable>
              );
            })}
            {row.length < 7 && Array.from({ length: 7 - row.length }).map((_, k) => (
              <View key={`pad-${ri}-${k}`} style={styles.cell} />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <Text style={[typography.caption, { fontSize: 10 }]}>Less</Text>
        <View style={styles.legendCells}>
          {[0, 0.2, 0.45, 0.7, 0.95].map((i, idx) => (
            <View
              key={idx}
              style={[
                styles.legendCell,
                { backgroundColor: i === 0 ? colors.surface : intensityColor(i) },
              ]}
            />
          ))}
        </View>
        <Text style={[typography.caption, { fontSize: 10 }]}>More</Text>
      </View>
    </View>
  );
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function intensityColor(t) {
  const clamped = Math.max(0.12, Math.min(1, t));
  const alpha = 0.18 + clamped * 0.82;
  return `rgba(245, 200, 66, ${alpha.toFixed(3)})`;
}

const styles = StyleSheet.create({
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    color: colors.textFaint,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  grid: { gap: 6 },
  gridRow: {
    flexDirection: 'row',
    gap: 6,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
  },
  dayCell: {
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayNum: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  legendCells: {
    flexDirection: 'row',
    gap: 4,
  },
  legendCell: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
});
