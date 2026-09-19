import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { resolveStorageUrl } from "@/lib/media";

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
  const [resolved, setResolved] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setResolved(null);
    void resolveStorageUrl("avatars", src ?? null).then((url) => active && setResolved(url));
    return () => { active = false; };
  }, [src]);

  if (resolved) {
    return (
      <img
        src={resolved}
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
