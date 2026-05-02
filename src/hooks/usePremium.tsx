import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { paymentService, setOnPremiumStatusChange } from '../services/payments';
import { trackEvent } from '../services/analyticsService';

// ─── Types ───────────────────────────────────────────────────────

type PaywallTrigger =
  | 'plant_limit'
  | 'weather_alert'
  | 'daily_tip'
  | 'premium_feature'
  | 'settings'
  | 'diagnosis-resume'   // Phase 9 (DIAG-01..02) — continue/reopen from past diagnosis
  | 'diagnosis-limit'    // Phase 9 (DIAG-06..07) — send-tap at 0 remaining messages
  | 'dev_test'
  | string;

/**
 * Phase 9 (PAY-03): Deferred callback pair attached to a paywall invocation.
 * onSuccess fires when purchase completes (gated action proceeds without re-tap).
 * onCancel fires when user closes paywall without purchasing.
 * BOTH are cleared idempotently on either path.
 */
export interface PaywallCallbackOptions {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface PremiumContextType {
  isPremium: boolean;
  // Paywall
  isPaywallVisible: boolean;
  paywallTrigger: PaywallTrigger | null;
  pendingCallback: PaywallCallbackOptions | null;
  showPaywall: (trigger: PaywallTrigger, options?: PaywallCallbackOptions) => void;
  hidePaywall: () => void;
  consumePendingCallback: () => PaywallCallbackOptions | null;
  // Dev tools (mock mode only)
  toggleMockPremium: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────

const PremiumContext = createContext<PremiumContextType | null>(null);

// ─── Provider ────────────────────────────────────────────────────

interface PremiumProviderProps {
  children: ReactNode;
}

export function PremiumProvider({ children }: PremiumProviderProps) {
  const [isPremium, setIsPremium] = useState(false);
  const [isPaywallVisible, setIsPaywallVisible] = useState(false);
  const [paywallTrigger, setPaywallTrigger] = useState<PaywallTrigger | null>(null);
  const [pendingCallback, setPendingCallback] = useState<PaywallCallbackOptions | null>(null);

  // Register the callback so payment service can push status updates
  useEffect(() => {
    setOnPremiumStatusChange((value: boolean) => {
      setIsPremium(value);
    });

    // Initialize payment service and check status
    paymentService.initialize().then(() => {
      paymentService.checkPremiumStatus();
    });
  }, []);

  const showPaywall = useCallback((trigger: PaywallTrigger, options?: PaywallCallbackOptions) => {
    // Pitfall 2: ALWAYS overwrite — new paywall implicitly cancels prior context.
    setPendingCallback(options ?? null);
    setPaywallTrigger(trigger);
    setIsPaywallVisible(true);
    trackEvent('paywall_shown', { trigger });
  }, []);

  const hidePaywall = useCallback(() => {
    trackEvent('paywall_dismissed', { trigger: paywallTrigger });
    // Capture-then-clear-then-fire ordering (Pitfall 7 lock for cancel path).
    const cb = pendingCallback;
    setPendingCallback(null);
    cb?.onCancel?.();
    setIsPaywallVisible(false);
    setPaywallTrigger(null);
  }, [paywallTrigger, pendingCallback]);

  const consumePendingCallback = useCallback((): PaywallCallbackOptions | null => {
    const cb = pendingCallback;
    setPendingCallback(null);
    return cb;
  }, [pendingCallback]);

  const toggleMockPremium = useCallback(async () => {
    if (paymentService.mockSetPremium) {
      await paymentService.mockSetPremium(!isPremium);
    }
  }, [isPremium]);

  const value: PremiumContextType = {
    isPremium,
    isPaywallVisible,
    paywallTrigger,
    pendingCallback,
    showPaywall,
    hidePaywall,
    consumePendingCallback,
    toggleMockPremium,
  };

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────

export function usePremium(): PremiumContextType {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
}
