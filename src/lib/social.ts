import { supabase } from "@/integrations/supabase/client";

export type PostType = "pr" | "meal" | "workout" | "level_up";

export interface FeedPost {
  id: string;
  user_id: string;
  type: PostType;
  media_url: string | null;
  caption: string | null;
  muscle_groups: string[] | null;
  macros: Record<string, number> | null;
  pr_id: string | null;
  hype_count: number;
  created_at: string;
  author: {
    user_id: string;
    pseudo: string;
    avatar_url: string | null;
    current_grade: string;
  };
  hyped_by_me: boolean;
  pr?: {
    exercise: string;
    weight_kg: number;
    reps: number;
  } | null;
}

export interface PublicProfile {
  user_id: string;
  pseudo: string;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  current_grade: string;
  xp: number;
  posts_count: number;
  followers_count: number;
  following_count: number;
}

export interface SuggestedProfile extends PublicProfile {
  recent_hype: number;
}

type PostRow = {
  id: string;
  user_id: string;
  type: PostType;
  media_url: string | null;
  caption: string | null;
  muscle_groups: string[] | null;
  macros: Record<string, number> | null;
  pr_id: string | null;
  hype_count: number;
  created_at: string;
};

type ProfilePreview = {
  user_id: string;
  pseudo: string | null;
  avatar_url: string | null;
  current_grade: string | null;
};

type PrPreview = {
  id: string;
  exercise: string;
  weight_kg: number;
  reps: number;
};

function fallbackAuthor(userId: string): FeedPost["author"] {
  return {
    user_id: userId,
    pseudo: "Athlète Centuria",
    avatar_url: null,
    current_grade: "recruit",
  };
}

async function attachFeedRelations(rows: PostRow[], hypedSet = new Set<string>()): Promise<FeedPost[]> {
  if (rows.length === 0) return [];

  const userIds = [...new Set(rows.map((p) => p.user_id))];
  const prIds = [...new Set(rows.map((p) => p.pr_id).filter(Boolean) as string[])];

  const [profilesRes, prsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id, pseudo, avatar_url, current_grade")
      .in("user_id", userIds),
    prIds.length > 0
      ? supabase
          .from("prs")
          .select("id, exercise, weight_kg, reps")
          .in("id", prIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const profilesByUser = new Map<string, ProfilePreview>();
  if (!profilesRes.error) {
    (profilesRes.data ?? []).forEach((profile: any) => {
      profilesByUser.set(profile.user_id, profile as ProfilePreview);
    });
  }

  const prsById = new Map<string, PrPreview>();
  if (!prsRes.error) {
    (prsRes.data ?? []).forEach((pr: any) => {
      prsById.set(pr.id, pr as PrPreview);
    });
  }

  return rows.map((post) => {
    const profile = profilesByUser.get(post.user_id);
    const author = profile
      ? {
          user_id: profile.user_id,
          pseudo: profile.pseudo ?? "Athlète Centuria",
          avatar_url: profile.avatar_url,
          current_grade: profile.current_grade ?? "recruit",
        }
      : fallbackAuthor(post.user_id);

    return {
      ...post,
      author,
      hyped_by_me: hypedSet.has(post.id),
      pr: post.pr_id ? prsById.get(post.pr_id) ?? null : null,
    };
  });
}

/* ── Feed with mix algorithm ── */
export async function fetchFeed(): Promise<FeedPost[]> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, user_id, type, media_url, caption, muscle_groups, macros, pr_id, hype_count, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  if (!posts) return [];

  // Load follows and hypes for current user
  let followingSet = new Set<string>();
  let hypedSet = new Set<string>();
  if (user) {
    const [followsRes, hypesRes] = await Promise.all([
      supabase.from("follows").select("following_id").eq("follower_id", user.id),
      supabase.from("post_hypes").select("post_id").eq("user_id", user.id),
    ]);
    followingSet = new Set((followsRes.data ?? []).map((r: any) => r.following_id));
    hypedSet = new Set((hypesRes.data ?? []).map((r: any) => r.post_id));
  }

  // Score: 0.5*recency + 0.3*hype_norm + 0.2*follow_bonus
  const maxHype = Math.max(1, ...posts.map((p: any) => p.hype_count));
  const now = Date.now();
  const feedPosts = await attachFeedRelations(posts as PostRow[], hypedSet);
  const scored = feedPosts.map((p) => {
    const ageHours = (now - new Date(p.created_at).getTime()) / 3_600_000;
    const recency = Math.exp(-ageHours / 24);
    const hypeNorm = p.hype_count / (maxHype + 1);
    const followBonus = user && followingSet.has(p.user_id) ? 1 : 0;
    const score = 0.5 * recency + 0.3 * hypeNorm + 0.2 * followBonus;
    return {
      ...p,
      hyped_by_me: hypedSet.has(p.id),
      _score: score,
    };
  });

  scored.sort((a: any, b: any) => b._score - a._score);
  return scored.slice(0, 20) as any as FeedPost[];
}

/* ── Public profile ── */
export async function fetchPublicProfile(userId: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, pseudo, bio, avatar_url, cover_url, current_grade, xp, posts_count, followers_count, following_count")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as PublicProfile | null;
}

export async function fetchUserPosts(userId: string): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("id, user_id, type, media_url, caption, muscle_groups, macros, pr_id, hype_count, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return attachFeedRelations((data ?? []) as PostRow[]);
}

/* ── Follows ── */
export async function isFollowing(targetId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id === targetId) return false;
  const { data } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("following_id", targetId)
    .maybeSingle();
  return !!data;
}

export async function follow(targetId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Connecte-toi pour suivre.");
  const { error } = await supabase.from("follows").insert({
    follower_id: user.id,
    following_id: targetId,
  });
  if (error) throw error;
}

export async function unfollow(targetId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Connecte-toi.");
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", targetId);
  if (error) throw error;
}

async function fetchFollowRows(column: "follower_id" | "following_id", userId: string, other: "follower_id" | "following_id") {
  const { data, error } = await supabase
    .from("follows")
    .select(`profile:profiles!follows_${other}_fkey(user_id, pseudo, avatar_url, current_grade, followers_count)`)
    .eq(column, userId);
  if (error) return [];
  return (data ?? []).map((r: any) => r.profile).filter(Boolean);
}

export async function fetchFollowers(userId: string): Promise<PublicProfile[]> {
  const { data, error } = await supabase
    .from("follows")
    .select("follower_id, profile:profiles!follows_follower_id_fkey(user_id, pseudo, bio, avatar_url, cover_url, current_grade, xp, posts_count, followers_count, following_count)")
    .eq("following_id", userId);
  if (error) return [];
  return (data ?? []).map((r: any) => r.profile).filter(Boolean);
}

export async function fetchFollowing(userId: string): Promise<PublicProfile[]> {
  const { data, error } = await supabase
    .from("follows")
    .select("following_id, profile:profiles!follows_following_id_fkey(user_id, pseudo, bio, avatar_url, cover_url, current_grade, xp, posts_count, followers_count, following_count)")
    .eq("follower_id", userId);
  if (error) return [];
  return (data ?? []).map((r: any) => r.profile).filter(Boolean);
}

/* ── Suggestions ── */
export async function fetchSuggestions(): Promise<PublicProfile[]> {
  const { data: { user } } = await supabase.auth.getUser();

  let excludeIds: string[] = [];
  if (user) {
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);
    excludeIds = (follows ?? []).map((f: any) => f.following_id);
    excludeIds.push(user.id);
  }

  let query = supabase
    .from("profiles")
    .select("user_id, pseudo, bio, avatar_url, cover_url, current_grade, xp, posts_count, followers_count, following_count")
    .order("followers_count", { ascending: false })
    .order("posts_count", { ascending: false })
    .limit(20);

  if (excludeIds.length > 0) {
    query = query.not("user_id", "in", `(${excludeIds.map((id) => `"${id}"`).join(",")})`);
  }

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as PublicProfile[];
}

/* ── Hype ── */
export async function toggleHype(postId: string, currentlyHyped: boolean) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Connecte-toi.");
  if (currentlyHyped) {
    const { error } = await supabase
      .from("post_hypes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("post_hypes")
      .insert({ post_id: postId, user_id: user.id });
    if (error) throw error;
  }
}

/* ── Create post ── */
export async function createPost(input: {
  type: PostType;
  media_url?: string | null;
  caption?: string | null;
  muscle_groups?: string[] | null;
  macros?: Record<string, number> | null;
  pr_id?: string | null;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Connecte-toi.");
  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      type: input.type,
      media_url: input.media_url ?? null,
      caption: input.caption ?? null,
      muscle_groups: input.muscle_groups ?? null,
      macros: input.macros ?? null,
      pr_id: input.pr_id ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

/* ── Update own profile ── */
export async function updateMyProfile(patch: {
  pseudo?: string;
  bio?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Connecte-toi.");
  const { error } = await supabase
    .from("profiles")
    .update({
      ...(patch.pseudo !== undefined && { pseudo: patch.pseudo }),
      ...(patch.bio !== undefined && { bio: patch.bio }),
      ...(patch.avatar_url !== undefined && { avatar_url: patch.avatar_url }),
      ...(patch.cover_url !== undefined && { cover_url: patch.cover_url }),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);
  if (error) throw error;
}
