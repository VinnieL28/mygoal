import { Alert, Platform } from 'react-native';

export function appConfirm({
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}) {
  if (Platform.OS === 'web') {
    const ok = typeof window !== 'undefined' && window.confirm(`${title}\n\n${message || ''}`.trim());
    if (ok) {
      Promise.resolve().then(() => onConfirm?.());
    } else {
      onCancel?.();
    }
    return;
  }

  Alert.alert(
    title,
    message,
    [
      { text: cancelText, style: 'cancel', onPress: () => onCancel?.() },
      {
        text: confirmText,
        style: destructive ? 'destructive' : 'default',
        onPress: () => onConfirm?.(),
      },
    ],
    { cancelable: true },
  );
}
