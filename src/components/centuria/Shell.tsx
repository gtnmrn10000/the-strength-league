import { useState, useEffect } from "react";
import Onboarding from "./Onboarding";
import Feed from "./Feed";
import Training from "./Training";
import Meals from "./Meals";
import Rankings from "./Rankings";
import Profile from "./Profile";
import PRFlow from "./PRFlow";
import BottomNav from "./BottomNav";
import HeaderLogo from "./HeaderLogo";

const ONBOARDED_KEY = "centuria_onboarded";

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
    <div className="relative mx-auto flex h-dvh max-w-md flex-col overflow-hidden bg-background">
      <HeaderLogo />
      <div className="flex-1 overflow-y-auto scrollbar-hide pb-20">
        {tab === "feed" && <Feed onCreate={() => setShowPR(true)} />}
        {tab === "training" && <Training onPR={() => setShowPR(true)} refreshKey={refreshKey} />}
        {tab === "meals" && <Meals />}
        {tab === "rank" && <Rankings />}
        {tab === "profile" && <Profile key={refreshKey} />}
      </div>
      <BottomNav active={tab} setActive={setTab} />
      <PRFlow open={showPR} onOpenChange={handlePROpenChange} />
    </div>
  );
}
