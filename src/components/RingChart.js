import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { colors, typography } from '../theme/theme';

export default function RingChart({
  size = 220,
  thickness = 18,
  data = [],
  centerLabel,
  centerValue,
  centerHint,
}) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((s, d) => s + (d.value > 0 ? d.value : 0), 0);

  let offset = 0;
  const segments = total > 0
    ? data
        .filter((d) => d.value > 0)
        .map((d, i) => {
          const fraction = d.value / total;
          const length = fraction * circumference;
          const seg = {
            color: d.color,
            length,
            gap: circumference - length,
            offset,
            key: d.id || `seg-${i}`,
          };
          offset -= length;
          return seg;
        })
    : [];

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.surface}
            strokeWidth={thickness}
            fill="none"
          />
          {segments.map((s) => (
            <Circle
              key={s.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={s.color}
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeDasharray={`${Math.max(0, s.length - 2)} ${s.gap + 2}`}
              strokeDashoffset={s.offset}
              fill="none"
            />
          ))}
        </G>
      </Svg>

      <View style={styles.center} pointerEvents="none">
        {!!centerLabel && <Text style={[typography.caption]}>{centerLabel}</Text>}
        {!!centerValue && (
          <Text style={[typography.h1, { marginTop: 4 }]} numberOfLines={1}>
            {centerValue}
          </Text>
        )}
        {!!centerHint && (
          <Text style={[typography.bodyMuted, { fontSize: 12, marginTop: 2 }]}>
            {centerHint}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
});
