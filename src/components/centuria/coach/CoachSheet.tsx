import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MessageCircle, Activity, BarChart3 } from "lucide-react";
import CoachChat from "./CoachChat";
import CoachRecovery from "./CoachRecovery";
import CoachAnalyse from "./CoachAnalyse";
import PremiumGate from "../paywall/PremiumGate";

type Tab = "chat" | "recovery" | "analyse";

export default function CoachSheet({
  open,
  onOpenChange,
  onSessionStarted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSessionStarted?: () => void;
}) {
  const [tab, setTab] = useState<Tab>("chat");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSessionStarted = () => {
    setRefreshKey((k) => k + 1);
    onSessionStarted?.();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92dvh] max-w-md mx-auto p-0 flex flex-col bg-background border-arena-border">
        <SheetHeader className="border-b border-arena-border px-4 py-3">
          <SheetTitle className="text-sm font-black tracking-widest text-foreground">COACH IA</SheetTitle>
        </SheetHeader>

        <PremiumGate
          reason="coach"
          title="Coach IA Premium"
          description="Chat illimité, séances perso générées à la volée et suivi de récupération musculaire — réservé aux abonnés."
        >
          <div className="grid grid-cols-3 border-b border-arena-border bg-background">
            <TabBtn active={tab === "chat"} onClick={() => setTab("chat")} icon={MessageCircle} label="Chat" />
            <TabBtn active={tab === "recovery"} onClick={() => setTab("recovery")} icon={Activity} label="Récup" />
            <TabBtn active={tab === "analyse"} onClick={() => setTab("analyse")} icon={BarChart3} label="Analyse" />
          </div>
          <div className="flex-1 overflow-hidden">
            {tab === "chat" && <CoachChat onSessionStarted={handleSessionStarted} />}
            {tab === "recovery" && <CoachRecovery refreshKey={refreshKey} />}
            {tab === "analyse" && <CoachAnalyse refreshKey={refreshKey} />}
          </div>
        </PremiumGate>
      </SheetContent>
    </Sheet>
  );
}

function TabBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 py-3 text-[11px] font-black tracking-widest ${
        active ? "border-b-2 border-arena text-arena" : "text-arena-muted"
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}
