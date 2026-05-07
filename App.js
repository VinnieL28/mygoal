import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import RootNavigator from './src/navigation/RootNavigator';
import { AppProvider } from './src/state/AppContext';

function setupWebPwa() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;

  const ensure = (selector, build) => {
    if (document.head.querySelector(selector)) return;
    document.head.appendChild(build());
  };

  ensure('link[rel="manifest"]', () => {
    const el = document.createElement('link');
    el.rel = 'manifest';
    el.href = '/manifest.webmanifest';
    return el;
  });
  ensure('link[rel="icon"][type="image/svg+xml"]', () => {
    const el = document.createElement('link');
    el.rel = 'icon';
    el.type = 'image/svg+xml';
    el.href = '/icon.svg';
    return el;
  });
  ensure('link[rel="apple-touch-icon"]', () => {
    const el = document.createElement('link');
    el.rel = 'apple-touch-icon';
    el.href = '/icon.svg';
    return el;
  });
  ensure('meta[name="theme-color"]', () => {
    const el = document.createElement('meta');
    el.name = 'theme-color';
    el.content = '#0B0F1A';
    return el;
  });
  ensure('meta[name="apple-mobile-web-app-capable"]', () => {
    const el = document.createElement('meta');
    el.name = 'apple-mobile-web-app-capable';
    el.content = 'yes';
    return el;
  });
  ensure('meta[name="apple-mobile-web-app-status-bar-style"]', () => {
    const el = document.createElement('meta');
    el.name = 'apple-mobile-web-app-status-bar-style';
    el.content = 'black-translucent';
    return el;
  });
  ensure('meta[name="apple-mobile-web-app-title"]', () => {
    const el = document.createElement('meta');
    el.name = 'apple-mobile-web-app-title';
    el.content = 'MyGoal';
    return el;
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

export default function App() {
  useEffect(() => { setupWebPwa(); }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AppProvider>
          <RootNavigator />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
