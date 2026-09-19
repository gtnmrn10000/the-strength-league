import { useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Video, Image as ImageIcon, Trophy, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createPost } from "@/lib/social";

type Mode = "choice" | "video" | "photo";

const MAX_BYTES = 80 * 1024 * 1024; // 80 Mo

export default function PostComposer({
  open,
  onOpenChange,
  onPickPR,
  onPosted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPickPR: () => void;
  onPosted?: () => void;
}) {
  const [mode, setMode] = useState<Mode>("choice");
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setMode("choice");
    setFile(null);
    setCaption("");
    setBusy(false);
  };

  const close = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const pick = (m: Mode) => {
    setMode(m);
    setTimeout(() => inputRef.current?.click(), 50);
  };

  const onFile = (f: File | null) => {
    if (!f) return;
    if (f.size > MAX_BYTES) {
      toast.error("Fichier trop lourd (80 Mo max).");
      return;
    }
    setFile(f);
  };

  const publish = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Connecte-toi pour publier.");

      const ext =
        (file.name.split(".").pop() || file.type.split("/")[1] || "bin")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .slice(0, 5) || "bin";
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("post-media")
        .upload(path, file, { contentType: file.type || undefined, upsert: false });
      if (upErr) throw new Error(`Envoi du média : ${upErr.message}`);

      await createPost({
        type: "workout",
        media_url: path,
        media_type: mode === "video" ? "video" : "image",
        caption: caption.trim() || null,
      });

      toast.success("Publié.");
      reset();
      onOpenChange(false);
      onPosted?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Publication impossible.");
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={close}>
      <SheetContent side="bottom" className="rounded-t-2xl border-arena-border bg-background pb-[env(safe-area-inset-bottom)]">
        <SheetHeader>
          <SheetTitle className="text-left text-base font-black">Publier</SheetTitle>
        </SheetHeader>

        {mode === "choice" ? (
          <div className="mt-4 space-y-2 pb-6">
            <ChoiceRow
              icon={<Video size={18} className="text-arena" />}
              title="Vidéo d'entraînement"
              desc="Une série, un exercice, ton ambiance de séance."
              onClick={() => pick("video")}
            />
            <ChoiceRow
              icon={<Trophy size={18} className="text-arena-gold" />}
              title="Record"
              desc="Vidéo vérifiée par la communauté, XP et badge à la clé."
              onClick={() => {
                close(false);
                onPickPR();
              }}
            />
            <ChoiceRow
              icon={<ImageIcon size={18} className="text-arena" />}
              title="Photo"
              desc="Physique, salle, matériel."
              onClick={() => pick("photo")}
            />
          </div>
        ) : (
          <div className="mt-4 space-y-3 pb-6">
            <input
              ref={inputRef}
              type="file"
              accept={mode === "video" ? "video/*" : "image/*"}
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />

            {file ? (
              <div className="flex items-center justify-between rounded-xl border border-arena-border bg-arena-surface px-3 py-2.5">
                <span className="truncate text-sm text-foreground">{file.name}</span>
                <button type="button" onClick={() => setFile(null)} className="ml-2 text-arena-muted">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="w-full rounded-xl border border-dashed border-arena-border bg-arena-surface px-3 py-6 text-sm text-arena-sub"
              >
                {mode === "video" ? "Choisir une vidéo" : "Choisir une photo"}
              </button>
            )}

            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Une légende ? (facultatif)"
              maxLength={280}
              className="min-h-20 resize-none"
            />

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setMode("choice")} disabled={busy}>
                Retour
              </Button>
              <Button className="flex-1" onClick={publish} disabled={!file || busy}>
                {busy ? <Loader2 size={16} className="animate-spin" /> : "Publier"}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ChoiceRow({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-arena-border bg-arena-surface px-3 py-3 text-left transition-transform active:scale-[0.99]"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-background">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-foreground">{title}</span>
        <span className="block truncate text-xs text-arena-sub">{desc}</span>
      </span>
    </button>
  );
}
