import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
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
  const [mounted, setMounted] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [tab, setTab] = useState("feed");
  const [showPR, setShowPR] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <span className="text-sm text-muted-foreground">Chargement...</span>
      </div>
    );
  }

  if (!onboarded) return <Onboarding onDone={() => setOnboarded(true)} />;

  return (
    <div className="relative mx-auto flex h-dvh max-w-md flex-col overflow-hidden bg-background">
      <HeaderLogo />
      <div className="flex-1 overflow-y-auto scrollbar-hide pb-20">
        <AnimatePresence mode="wait">
          {tab === "feed" && <Feed key="feed" onCreate={() => setShowPR(true)} />}
          {tab === "training" && <Training key="training" onPR={() => setShowPR(true)} />}
          {tab === "meals" && <Meals key="meals" />}
          {tab === "rank" && <Rankings key="rank" />}
          {tab === "profile" && <Profile key="profile" />}
        </AnimatePresence>
      </div>
      <BottomNav active={tab} setActive={setTab} />
      {showPR && <PRModal onClose={() => setShowPR(false)} />}
    </div>
  );
}
