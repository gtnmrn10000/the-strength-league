import { useEffect, useState } from "react";
import { follow, unfollow, isFollowing } from "@/lib/social";

export default function FollowButton({
  targetId,
  initialFollowing,
  onChange,
  size = "md",
}: {
  targetId: string;
  initialFollowing?: boolean;
  onChange?: (nowFollowing: boolean) => void;
  size?: "sm" | "md";
}) {
  const [following, setFollowing] = useState<boolean>(initialFollowing ?? false);
  const [loading, setLoading] = useState(initialFollowing === undefined);

  useEffect(() => {
    if (initialFollowing !== undefined) return;
    let cancelled = false;
    isFollowing(targetId).then((v) => {
      if (!cancelled) {
        setFollowing(v);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [targetId, initialFollowing]);

  const toggle = async () => {
    const next = !following;
    setFollowing(next);
    onChange?.(next);
    try {
      if (next) await follow(targetId);
      else await unfollow(targetId);
    } catch (err) {
      // rollback
      setFollowing(!next);
      onChange?.(!next);
      console.error("Follow error", err);
    }
  };

  const base =
    size === "sm"
      ? "px-3 py-1 text-[11px]"
      : "px-4 py-2 text-xs";

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded-full font-black transition-all active:scale-95 ${base} ${
        following
          ? "border border-arena-border bg-transparent text-arena-sub"
          : "bg-arena text-arena-foreground shadow-[0_0_16px_var(--arena-glow)]"
      }`}
    >
      {loading ? "…" : following ? "Suivi" : "Suivre"}
    </button>
  );
}
