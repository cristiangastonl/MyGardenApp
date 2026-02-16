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
  | 'dev_test'
  | string;

interface PremiumContextType {
  isPremium: boolean;
  // Paywall
  isPaywallVisible: boolean;
  paywallTrigger: PaywallTrigger | null;
  showPaywall: (trigger: PaywallTrigger) => void;
  hidePaywall: () => void;
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

  const showPaywall = useCallback((trigger: PaywallTrigger) => {
    setPaywallTrigger(trigger);
    setIsPaywallVisible(true);
    trackEvent('paywall_shown', { trigger });
  }, []);

  const hidePaywall = useCallback(() => {
    trackEvent('paywall_dismissed', { trigger: paywallTrigger });
    setIsPaywallVisible(false);
    setPaywallTrigger(null);
  }, [paywallTrigger]);

  const toggleMockPremium = useCallback(async () => {
    if (paymentService.mockSetPremium) {
      await paymentService.mockSetPremium(!isPremium);
    }
  }, [isPremium]);

  const value: PremiumContextType = {
    isPremium,
    isPaywallVisible,
    paywallTrigger,
    showPaywall,
    hidePaywall,
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
