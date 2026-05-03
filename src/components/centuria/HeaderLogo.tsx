import centuriaLogo from "@/assets/centuria-logo.png";

export default function HeaderLogo() {
  return (
    <div className="flex items-center gap-2 px-5 pt-4 pb-2">
      <img src={centuriaLogo} alt="Centuria" className="h-6 w-6 rounded" />
      <span className="text-sm font-black tracking-[0.2em] text-foreground">CENTURIA</span>
    </div>
  );
}
