import { useEffect, RefObject } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { usePremium } from './usePremium';

/**
 * Subscribes to PaywallContext.isPaywallVisible. When the paywall opens,
 * dismisses the bottom sheet referenced by sheetRef. Implements the
 * close-then-trigger contract from Phase 9 PaywallContext (CRIT-1 lock).
 *
 * Phase 13 ships this hook unused; Phase 14 (educational modal) and
 * Phase 21 (journal quick-add) sheet callers will opt in via:
 *   const sheetRef = useRef<BottomSheetModal>(null);
 *   useDismissOnPaywall(sheetRef);
 */
export function useDismissOnPaywall(sheetRef: RefObject<BottomSheetModal | null>): void {
  const { isPaywallVisible } = usePremium();
  useEffect(() => {
    if (isPaywallVisible) {
      sheetRef.current?.dismiss();
    }
  }, [isPaywallVisible, sheetRef]);
}
