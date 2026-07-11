import { Component, type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";
import Onboarding from "./Onboarding";
import Feed from "./Feed";
import Training from "./Training";
import Meals from "./Meals";
import Rankings from "./Rankings";
import Profile from "./Profile";
import PRFlow from "./PRFlow";
import BottomNav from "./BottomNav";
import HeaderLogo from "./HeaderLogo";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import Paywall from "./paywall/Paywall";
import { supabase } from "@/integrations/supabase/client";

const ONBOARDED_KEY = "centuria_onboarded";

class TabErrorBoundary extends Component<
  { resetKey: string; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: { resetKey: string }) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error: unknown) {
    console.warn("tab render failed", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="m-4 rounded-2xl border border-arena-border bg-arena-surface p-6 text-center">
          <p className="text-sm font-bold text-foreground">Cette section n’a pas pu se charger.</p>
          <p className="mt-2 text-xs text-arena-muted">Change d’onglet ou réessaie dans un instant.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Shell() {
  const [hydrated, setHydrated] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [tab, setTab] = useState("feed");
  const [showPR, setShowPR] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setOnboarded(localStorage.getItem(ONBOARDED_KEY) === "true");
    setHydrated(true);
  }, []);

  const handleOnboardingDone = () => {
    localStorage.setItem(ONBOARDED_KEY, "true");
    setOnboarded(true);
  };

  const handlePROpenChange = (isOpen: boolean, prValidated?: boolean) => {
    setShowPR(isOpen);
    if (!isOpen && prValidated) {
      setRefreshKey((k) => k + 1);
    }
  };

  // Render nothing until hydrated to avoid mismatch
  if (!hydrated) {
    return <div className="mx-auto flex h-dvh max-w-md items-center justify-center bg-background" />;
  }

  if (!onboarded) return <Onboarding onDone={handleOnboardingDone} />;

  return (
    <SubscriptionProvider>
      <div className="relative mx-auto flex h-dvh max-w-md flex-col overflow-hidden bg-background">
        <HeaderLogo />
        <div className="flex-1 overflow-y-auto scrollbar-hide pb-20">
          <TabErrorBoundary resetKey={tab}>
            {tab === "feed" && <Feed onCreate={() => setShowPR(true)} />}
            {tab === "training" && <Training onPR={() => setShowPR(true)} refreshKey={refreshKey} />}
            {tab === "meals" && <Meals />}
            {tab === "rank" && <Rankings />}
            {tab === "profile" && <Profile key={refreshKey} />}
          </TabErrorBoundary>
        </div>
        <BottomNav active={tab} setActive={setTab} />
        <PRFlow open={showPR} onOpenChange={handlePROpenChange} />
        <Paywall />
      </div>
    </SubscriptionProvider>
  );
}

