import { useEffect, useState } from "react";
import { createFileRoute, useParams, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Settings, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchPublicProfile,
  fetchUserPosts,
  isFollowing,
  updateMyProfile,
  type PublicProfile,
  type FeedPost,
} from "@/lib/social";
import UserAvatar from "@/components/centuria/social/UserAvatar";
import FollowButton from "@/components/centuria/social/FollowButton";
import UserListSheet from "@/components/centuria/social/UserListSheet";
import { GRADE_LABELS, type Grade } from "@/lib/grades";
import { GradeIcon } from "@/lib/gradeIcons";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/profile/$userId")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Profil — Centuria" },
      { name: "description", content: "Découvre le profil, les PR et la progression de cet athlète Centuria." },
    ],
  }),
});

function ProfilePage() {
  const { userId } = useParams({ from: "/profile/$userId" });
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [initialFollowing, setInitialFollowing] = useState<boolean | undefined>(undefined);
  const [sheet, setSheet] = useState<"followers" | "following" | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: userRes }, prof] = await Promise.all([
      supabase.auth.getUser(),
      fetchPublicProfile(userId),
    ]);
    const myId = userRes.user?.id ?? null;
    setMe(myId);
    setProfile(prof);
    setPosts(await fetchUserPosts(userId));
    if (myId && myId !== userId) setInitialFollowing(await isFollowing(userId));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [userId]);

  const isMe = me && me === userId;

  if (loading) {
    return <div className="mx-auto flex h-dvh max-w-md items-center justify-center bg-background text-arena-muted">Chargement…</div>;
  }

  if (!profile) {
    return (
      <div className="mx-auto flex h-dvh max-w-md flex-col items-center justify-center gap-3 bg-background p-6 text-center">
        <p className="text-arena-muted">Profil introuvable.</p>
        <Link to="/" className="text-sm font-bold text-arena underline">Retour à l'accueil</Link>
      </div>
    );
  }

  const grade = (profile.current_grade || "recruit") as Grade;

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-background text-foreground">
      {/* Cover */}
      <div className="relative h-40 bg-gradient-to-br from-arena/40 via-arena-gold/20 to-background">
        {profile.cover_url && (
          <img src={profile.cover_url} alt="" className="h-full w-full object-cover" />
        )}
        <button
          onClick={() => navigate({ to: "/" })}
          className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/70 backdrop-blur"
        >
          <ChevronLeft size={18} />
        </button>
        {isMe && (
          <button
            onClick={() => setEditing(true)}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/70 backdrop-blur"
          >
            <Settings size={16} />
          </button>
        )}
      </div>

      {/* Header */}
      <div className="px-4 pb-4">
        <div className="-mt-10 flex items-end justify-between">
          <UserAvatar src={profile.avatar_url} pseudo={profile.pseudo} size={80} className="ring-4 ring-background" />
          {isMe ? (
            <button
              onClick={() => setEditing(true)}
              className="rounded-full border border-arena-border bg-arena-surface px-4 py-2 text-xs font-black text-foreground"
            >
              Éditer le profil
            </button>
          ) : (
            <FollowButton targetId={userId} initialFollowing={initialFollowing} onChange={load} />
          )}
        </div>

        <div className="mt-3">
          <h1 className="text-xl font-black">{profile.pseudo}</h1>
          <p className="mt-1 inline-flex items-center gap-1 text-xs font-black tracking-widest text-arena-gold">
            <GradeIcon grade={grade} size={12} /> {GRADE_LABELS[grade]?.toUpperCase()} · {profile.xp} XP
          </p>
          {profile.bio && (
            <p className="mt-2 text-sm text-foreground/90 whitespace-pre-line">{profile.bio}</p>
          )}
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-arena-border bg-arena-surface p-3">
          <StatCell label="Posts" value={profile.posts_count} />
          <StatCell
            label="Followers"
            value={profile.followers_count}
            onClick={() => setSheet("followers")}
          />
          <StatCell
            label="Suit"
            value={profile.following_count}
            onClick={() => setSheet("following")}
          />
        </div>

        {/* Posts grid */}
        <h2 className="mt-6 mb-3 text-xs font-black tracking-widest text-arena-muted">POSTS</h2>
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-arena-border p-6 text-center text-sm text-arena-muted">
            {isMe ? "Ton premier post arrivera ici." : "Aucun post pour l'instant."}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((p) => (
              <PostThumb key={p.id} post={p} />
            ))}
          </div>
        )}
      </div>

      {sheet && (
        <UserListSheet
          open={!!sheet}
          onOpenChange={(v) => !v && setSheet(null)}
          userId={userId}
          mode={sheet}
        />
      )}

      {isMe && (
        <EditProfileSheet
          open={editing}
          onOpenChange={setEditing}
          profile={profile}
          onSaved={load}
        />
      )}
    </div>
  );
}

function StatCell({ label, value, onClick }: { label: string; value: number; onClick?: () => void }) {
  const inner = (
    <>
      <p className="text-lg font-black text-foreground">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-arena-muted">{label}</p>
    </>
  );
  if (onClick) {
    return (
      <button onClick={onClick} className="flex flex-col items-center justify-center rounded-xl py-1 active:scale-95 transition-transform">
        {inner}
      </button>
    );
  }
  return <div className="flex flex-col items-center justify-center py-1">{inner}</div>;
}

function PostThumb({ post }: { post: FeedPost }) {
  const bg = post.media_url;
  return (
    <div className="relative aspect-square overflow-hidden rounded bg-arena-surface">
      {bg ? (
        <img src={bg} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-arena/20 to-arena-gold/10 p-2 text-center">
          <span className="text-[10px] font-black uppercase tracking-wider text-arena">
            {post.type === "pr" ? "PR" : post.type === "level_up" ? "LEVEL" : post.type}
          </span>
          {post.pr && (
            <span className="mt-1 text-xs font-black text-foreground">{post.pr.weight_kg}kg</span>
          )}
        </div>
      )}
    </div>
  );
}

function EditProfileSheet({
  open,
  onOpenChange,
  profile,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profile: PublicProfile;
  onSaved: () => void;
}) {
  const [pseudo, setPseudo] = useState(profile.pseudo);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");
      const path = `${user.id}/avatar-${Date.now()}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateMyProfile({ pseudo, bio: bio || null, avatar_url: avatarUrl });
      onOpenChange(false);
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl border-arena-border bg-background">
        <SheetHeader>
          <SheetTitle className="text-foreground">Éditer le profil</SheetTitle>
        </SheetHeader>
        <div className="mt-4 flex flex-col gap-4 pb-6">
          <div className="flex items-center gap-4">
            <UserAvatar src={avatarUrl} pseudo={pseudo} size={72} />
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-arena-border bg-arena-surface px-4 py-2 text-xs font-black">
              <Camera size={14} />
              {uploading ? "Envoi…" : "Changer la photo"}
              <input type="file" accept="image/*" className="hidden" onChange={upload} />
            </label>
          </div>
          <label className="text-xs font-bold text-arena-sub">
            Pseudo
            <input
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              className="mt-1 w-full rounded-xl border border-arena-border bg-arena-surface px-3 py-2 font-bold text-foreground outline-none focus:border-arena/50"
            />
          </label>
          <label className="text-xs font-bold text-arena-sub">
            Bio
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder="Deadlift addict. #teamforce"
              className="mt-1 w-full resize-none rounded-xl border border-arena-border bg-arena-surface px-3 py-2 text-foreground outline-none focus:border-arena/50"
            />
          </label>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-full bg-arena py-3 font-black text-arena-foreground shadow-[0_0_20px_var(--arena-glow)] active:scale-95 disabled:opacity-60"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
