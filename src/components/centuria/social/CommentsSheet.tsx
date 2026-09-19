import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import CommentsPanel from "./CommentsPanel";

export default function CommentsSheet({
  open,
  onOpenChange,
  postId,
  onCountChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  postId: string;
  onCountChange?: (n: number) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex h-[85dvh] flex-col rounded-t-3xl border-arena-border bg-background p-0"
      >
        <SheetHeader className="border-b border-arena-border px-4 py-3">
          <SheetTitle className="text-sm font-semibold text-foreground">Commentaires</SheetTitle>
        </SheetHeader>
        {open && <CommentsPanel postId={postId} onCountChange={onCountChange} />}
      </SheetContent>
    </Sheet>
  );
}
