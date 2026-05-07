import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../theme/theme';

export default function ScreenContainer({
  children,
  scroll = false,
  contentStyle,
  withTabBarPadding = true,
}) {
  const insets = useSafeAreaInsets();
  const paddingBottom = (withTabBarPadding ? 100 : 0) + insets.bottom;
  const paddingTop = insets.top + spacing.md;

  if (scroll) {
    return (
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={[
            { paddingTop, paddingBottom, paddingHorizontal: spacing.lg },
            contentStyle,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.root,
        { paddingTop, paddingBottom, paddingHorizontal: spacing.lg },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
