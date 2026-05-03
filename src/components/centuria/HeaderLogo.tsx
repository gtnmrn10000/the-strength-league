import { Swords } from "lucide-react";

export default function HeaderLogo() {
  return (
    <div className="flex items-center gap-2 px-5 pt-4 pb-2">
      <Swords className="text-arena" size={20} />
      <span className="text-sm font-black tracking-[0.2em] text-foreground">CENTURIA</span>
    </div>
  );
}
