import { User } from "lucide-react";

export default function UserAvatar({
  src,
  pseudo,
  size = 40,
  className = "",
}: {
  src: string | null | undefined;
  pseudo: string | null | undefined;
  size?: number;
  className?: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={pseudo ?? "avatar"}
        style={{ width: size, height: size }}
        className={`rounded-full object-cover ring-2 ring-arena-border ${className}`}
      />
    );
  }
  const initials = (pseudo ?? "?").replace(/^@/, "").slice(0, 2).toUpperCase();
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className={`flex items-center justify-center rounded-full bg-arena/20 font-black text-arena ring-2 ring-arena-border ${className}`}
    >
      {initials || <User size={size * 0.5} />}
    </div>
  );
}
