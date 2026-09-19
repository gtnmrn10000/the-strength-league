import { useState } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { reportContent, REPORT_REASONS, type ReportTarget } from "@/lib/moderation";
import { friendlyError } from "@/lib/errors";

export default function ReportSheet({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetUserId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  targetType: ReportTarget;
  targetId: string;
  targetUserId?: string | null;
}) {
  const [reason, setReason] = useState<string>("spam");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    setSending(true);
    try {
      await reportContent({ targetType, targetId, targetUserId, reason, details });
      toast.success("Signalement envoyé. Merci.");
      onOpenChange(false);
      setDetails("");
    } catch (e) {
      toast.error(friendlyError(e, "Signalement impossible."));
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-arena-border bg-background pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
      >
        <SheetHeader>
          <SheetTitle className="text-foreground">Signaler</SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex flex-col gap-2">
          {REPORT_REASONS.map((r) => (
            <button
              key={r.value}
              onClick={() => setReason(r.value)}
              className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${
                reason === r.value
                  ? "border-arena bg-arena/10 text-foreground"
                  : "border-arena-border bg-arena-surface text-arena-sub"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          maxLength={400}
          rows={3}
          placeholder="Détails (optionnel)"
          className="mt-3 w-full rounded-2xl border border-arena-border bg-arena-surface px-4 py-3 text-sm text-foreground outline-none focus:border-arena/50"
        />

        <button
          onClick={submit}
          disabled={sending}
          className="mt-4 w-full rounded-full bg-arena py-3.5 text-sm font-black text-arena-foreground disabled:opacity-50"
        >
          {sending ? "Envoi…" : "Envoyer le signalement"}
        </button>
      </SheetContent>
    </Sheet>
  );
}
