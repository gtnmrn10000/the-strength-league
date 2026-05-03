import { useState } from "react";
import Onboarding from "./Onboarding";
import Feed from "./Feed";
import Training from "./Training";
import Meals from "./Meals";
import Rankings from "./Rankings";
import Profile from "./Profile";
import PRModal from "./PRModal";
import BottomNav from "./BottomNav";
import HeaderLogo from "./HeaderLogo";

export default function Shell() {
  const [onboarded, setOnboarded] = useState(false);
  const [tab, setTab] = useState("feed");
  const [showPR, setShowPR] = useState(false);

  if (!onboarded) return <Onboarding onDone={() => setOnboarded(true)} />;

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
