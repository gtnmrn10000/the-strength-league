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
import { getPaywallProvider } from "@/lib/paywall/provider";
import { NO_ENTITLEMENT, type EntitlementStatus } from "@/lib/paywall/entitlement";
import { isDevPaywallEnabled } from "@/lib/paywall/dev.functions";
import { missingSetup, paywallMode, type PaywallMode } from "@/lib/paywall/config";
import type { PlanId } from "@/lib/paywall/plans";

type PaywallReason = "coach" | "photo-ia" | "analyse" | "recipes" | "video" | "generic";

type SubscriptionContextValue = {
  status: EntitlementStatus | null;
  isPremium: boolean;
  /** Alias sémantique de `isPremium` — préférer `isPaid` pour les gates d'accès payant. */
  isPaid: boolean;
  loading: boolean;
  purchasing: PlanId | null;
  paywallOpen: boolean;
  paywallReason: PaywallReason;
  /** "revenuecat" = achats in-app réels ; "dev" = mode dev non production. */
  mode: PaywallMode;
  /** Vrai si la server function de mode dev est activée (PAYWALL_DEV_MODE). */
  devUnlockEnabled: boolean;
  /** Ce qu'il reste à brancher pour des paiements réels. */
  setupTodo: string[];
  openPaywall: (reason?: PaywallReason) => void;
  closePaywall: () => void;
  purchase: (planId: PlanId) => Promise<void>;
  restore: () => Promise<void>;
  refresh: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<EntitlementStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<PlanId | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallReason, setPaywallReason] = useState<PaywallReason>("generic");
  const [mode, setMode] = useState<PaywallMode>("dev");
  const [devUnlockEnabled, setDevUnlockEnabled] = useState(false);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const s = await getPaywallProvider().getStatus();
      if (mounted.current) setStatus(s);
    } catch {
      if (mounted.current) setStatus(NO_ENTITLEMENT);
    } finally {
      if (mounted.current) {
        setMode(paywallMode());
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh();
    isDevPaywallEnabled()
      .then((r) => {
        if (mounted.current) setDevUnlockEnabled(!!r?.enabled);
      })
      .catch(() => undefined);
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (
        event === "INITIAL_SESSION" ||
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "USER_UPDATED" ||
        event === "TOKEN_REFRESHED"
      ) {
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
      const next = await getPaywallProvider().purchase(planId);
      setStatus(next);
      if (next.isPremium) setPaywallOpen(false);
    } finally {
      setPurchasing(null);
    }
  }, []);

  const restore = useCallback(async () => {
    setLoading(true);
    try {
      const next = await getPaywallProvider().restore();
      setStatus(next);
    } finally {
      setLoading(false);
    }
  }, []);

  const setupTodo = useMemo(() => missingSetup(), []);

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      status,
      isPremium: !!status?.isPremium,
      isPaid: !!status?.isPremium,
      loading,
      purchasing,
      paywallOpen,
      paywallReason,
      mode,
      devUnlockEnabled,
      setupTodo,
      openPaywall,
      closePaywall,
      purchase,
      restore,
      refresh,
    }),
    [
      status,
      loading,
      purchasing,
      paywallOpen,
      paywallReason,
      mode,
      devUnlockEnabled,
      setupTodo,
      openPaywall,
      closePaywall,
      purchase,
      restore,
      refresh,
    ]
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription doit être utilisé dans <SubscriptionProvider>.");
  return ctx;
}
