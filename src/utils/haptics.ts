import * as Haptics from 'expo-haptics';

export type HapticKind =
  | 'impactLight'
  | 'impactMedium'
  | 'impactHeavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection';

/**
 * Fire-and-forget haptic feedback wrapper.
 * - Returns void synchronously (Haptics.*Async promises discarded internally).
 * - Errors are silently swallowed in production; logged via console.warn in __DEV__.
 * - Mirrors the silent-error pattern from src/services/unknownPlantTracker.ts (Phase 12).
 */
export function triggerHaptic(kind: HapticKind): void {
  try {
    switch (kind) {
      case 'impactLight':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'impactMedium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'impactHeavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'selection':
        Haptics.selectionAsync();
        break;
    }
  } catch (err) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[haptics] triggerHaptic failed:', err);
    }
    // production: swallow
  }
}
