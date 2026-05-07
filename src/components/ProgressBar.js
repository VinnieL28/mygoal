import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

import { colors, radius } from '../theme/theme';

export default function ProgressBar({ percent, color = colors.gold, height = 10 }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.max(0, Math.min(1, percent)),
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [percent, anim]);

  const width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <Animated.View style={[styles.fill, { width, backgroundColor: color, borderRadius: height / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  fill: { height: '100%' },
});
