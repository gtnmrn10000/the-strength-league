import Logo from "./Logo";

export default function HeaderLogo() {
  return (
    <div className="flex items-center gap-2 px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-2">
      <Logo />
      <span className="text-sm font-black tracking-[0.2em] text-foreground">CENTURIA</span>
    </div>
  );
}
