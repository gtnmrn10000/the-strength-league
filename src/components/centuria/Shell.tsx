import { Component, type ReactNode, useCallback, useEffect, useState } from "react";
import Onboarding from "./Onboarding";
import Home from "./Home";
import Community from "./Community";
import Training from "./Training";
import Meals from "./Meals";
import Profile from "./Profile";
import PRFlow from "./PRFlow";
import BottomNav from "./BottomNav";
import HeaderLogo from "./HeaderLogo";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import Paywall from "./paywall/Paywall";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { fetchMyProfile } from "@/lib/profileStore";
import { saveUserProfile } from "./userProfile";
import { initNativeShell } from "@/lib/native";

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

function Splash() {
  return <div className="mx-auto flex h-dvh max-w-md items-center justify-center bg-background" />;
}

function ShellInner() {
  const { user, loading } = useAuth();
  const [profileState, setProfileState] = useState<"idle" | "loading" | "ready">("idle");
  const [onboarded, setOnboarded] = useState(false);
  const [tab, setTab] = useState("home");
  const [autoStart, setAutoStart] = useState(0);
  const [showPR, setShowPR] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadProfile = useCallback(async () => {
    setProfileState("loading");
    try {
      const profile = await fetchMyProfile();
      if (profile?.onboarded && profile.pseudo) {
        setOnboarded(true);
        // Cache local pour les écrans qui lisent encore le profil hors-ligne.
        saveUserProfile({
          pseudo: profile.pseudo,
          age: profile.age != null ? String(profile.age) : "",
          taille: profile.taille != null ? String(profile.taille) : "",
          poids: profile.poids != null ? String(profile.poids) : "",
          goal: profile.goal ?? null,
        });
      } else {
        setOnboarded(false);
      }
    } catch (e) {
      console.error("[profile] load failed", e);
      setOnboarded(false);
    } finally {
      setProfileState("ready");
    }
  }, []);

  // Plugins natifs (status bar, clavier, splash) + retour OAuth par deep link.
  useEffect(() => {
    void initNativeShell(() => void loadProfile());
  }, [loadProfile]);

  useEffect(() => {
    if (!user) {
      setOnboarded(false);
      setProfileState("idle");
      return;
    }
    void loadProfile();
  }, [user, loadProfile]);

  const handlePROpenChange = (isOpen: boolean, prValidated?: boolean) => {
    setShowPR(isOpen);
    if (!isOpen && prValidated) setRefreshKey((k) => k + 1);
  };

  if (loading) return <Splash />;

  // Pas de session → onboarding avec l'étape auth réelle. Aucune session
  // anonyme n'est recréée automatiquement.
  if (!user) return <Onboarding authed={false} onDone={() => {}} />;

  if (profileState !== "ready") return <Splash />;

  if (!onboarded) return <Onboarding authed onDone={() => void loadProfile()} />;

  return (
    <SubscriptionProvider>
      <div className="relative mx-auto flex h-dvh max-w-md flex-col overflow-hidden bg-background">
        <HeaderLogo />
        <div className="flex-1 overflow-y-auto scrollbar-hide pb-[calc(5rem+env(safe-area-inset-bottom))]">
          <TabErrorBoundary resetKey={tab}>
            {tab === "home" && (
              <Home
                refreshKey={refreshKey}
                onOpenTraining={() => setTab("training")}
                onStartWorkout={() => {
                  setAutoStart((n) => n + 1);
                  setTab("training");
                }}
              />
            )}
            {tab === "training" && (
              <Training onPR={() => setShowPR(true)} refreshKey={refreshKey} autoStart={autoStart} />
            )}
            {tab === "community" && <Community onCreate={() => setShowPR(true)} />}
            {tab === "meals" && <Meals />}
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

export default function Shell() {
  return (
    <AuthProvider>
      <ShellInner />
    </AuthProvider>
  );
}
