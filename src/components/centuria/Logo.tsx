import centuriaLogo from "@/assets/centuria-logo.png";

const sizes = {
  sm: "h-7 w-7 rounded-lg",
  lg: "h-20 w-20 rounded-2xl",
} as const;

export default function Logo({ size = "sm" }: { size?: keyof typeof sizes }) {
  return (
    <img
      src={centuriaLogo}
      alt="Centuria"
      className={`object-contain ${sizes[size]}`}
    />
  );
}
