import { useState, useEffect } from "react";
import Onboarding from "./Onboarding";
import Feed from "./Feed";
import Training from "./Training";
import Meals from "./Meals";
import Rankings from "./Rankings";
import Profile from "./Profile";
import PRModal from "./PRModal";
import BottomNav from "./BottomNav";
import HeaderLogo from "./HeaderLogo";

const ONBOARDED_KEY = "centuria_onboarded";

export default function Shell() {
  const [onboarded, setOnboarded] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(ONBOARDED_KEY) === "true";
  });
  const [tab, setTab] = useState("feed");
  const [showPR, setShowPR] = useState(false);

  const handleOnboardingDone = () => {
    localStorage.setItem(ONBOARDED_KEY, "true");
    setOnboarded(true);
  };

  if (!onboarded) return <Onboarding onDone={handleOnboardingDone} />;

  return (
    <div className="relative mx-auto flex h-dvh max-w-md flex-col overflow-hidden bg-background">
      <HeaderLogo />
      <div className="flex-1 overflow-y-auto scrollbar-hide pb-20">
        {tab === "feed" && <Feed onCreate={() => setShowPR(true)} />}
        {tab === "training" && <Training onPR={() => setShowPR(true)} />}
        {tab === "meals" && <Meals />}
        {tab === "rank" && <Rankings />}
        {tab === "profile" && <Profile />}
      </div>
      <BottomNav active={tab} setActive={setTab} />
      {showPR && <PRModal onClose={() => setShowPR(false)} />}
    </div>
  );
}
