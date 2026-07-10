import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { paywallProvider, EntitlementStatus } from "@/lib/paywall/provider";
import type { PlanId } from "@/lib/paywall/plans";

type PaywallReason = "coach" | "photo-ia" | "analyse" | "generic";

type SubscriptionContextValue = {
  status: EntitlementStatus | null;
  isPremium: boolean;
  loading: boolean;
  purchasing: PlanId | null;
  paywallOpen: boolean;
  paywallReason: PaywallReason;
  openPaywall: (reason?: PaywallReason) => void;
  closePaywall: () => void;
  purchase: (planId: PlanId) => Promise<void>;
  restore: () => Promise<void>;
  refresh: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

const DEFAULT_STATUS: EntitlementStatus = {
  isPremium: false,
  activePlan: null,
  expiresAt: null,
  willRenew: false,
  provider: "mock",
};

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<EntitlementStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<PlanId | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallReason, setPaywallReason] = useState<PaywallReason>("generic");
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const s = await paywallProvider.getStatus();
      if (mounted.current) setStatus(s);
    } catch {
      if (mounted.current) setStatus(DEFAULT_STATUS);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        refresh();
      }
    });
    return () => {
      mounted.current = false;
      sub.subscription.unsubscribe();
    };
  }, [refresh]);

  const openPaywall = useCallback((reason: PaywallReason = "generic") => {
    setPaywallReason(reason);
    setPaywallOpen(true);
  }, []);
  const closePaywall = useCallback(() => setPaywallOpen(false), []);

  const purchase = useCallback(async (planId: PlanId) => {
    setPurchasing(planId);
    try {
      const next = await paywallProvider.purchase(planId);
      setStatus(next);
      setPaywallOpen(false);
    } finally {
      setPurchasing(null);
    }
  }, []);

  const restore = useCallback(async () => {
    setLoading(true);
    try {
      const next = await paywallProvider.restore();
      setStatus(next);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      status,
      isPremium: !!status?.isPremium,
      loading,
      purchasing,
      paywallOpen,
      paywallReason,
      openPaywall,
      closePaywall,
      purchase,
      restore,
      refresh,
    }),
    [status, loading, purchasing, paywallOpen, paywallReason, openPaywall, closePaywall, purchase, restore, refresh]
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription doit être utilisé dans <SubscriptionProvider>.");
  return ctx;
}
