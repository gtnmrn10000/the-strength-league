import { supabase } from "@/integrations/supabase/client";
import { fetchBlockedIds } from "./moderation";

export type PostType = "pr" | "meal" | "workout" | "level_up";

export interface MealInfo {
  name: string | null;
  kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
}

export interface FeedPost {
  /** Clé unique dans le fil (identifiant du repost si c'en est un). */
  feed_key: string;
  /** Identifiant du post source : cible des hypes, commentaires, enregistrements. */
  id: string;
  user_id: string;
  type: PostType;
  media_url: string | null;
  media_type: "image" | "video" | null;
  caption: string | null;
  muscle_groups: string[] | null;
  macros: Record<string, number> | null;
  meal: MealInfo | null;
  pr_id: string | null;
  hype_count: number;
  comment_count: number;
  repost_count: number;
  created_at: string;
  author: {
    user_id: string;
    pseudo: string;
    avatar_url: string | null;
    current_grade: string;
  };
  hyped_by_me: boolean;
  saved_by_me: boolean;
  /** Identifiant de MON repost de ce post (permet d'annuler). */
  my_repost_id: string | null;
  /** Renseigné quand l'entrée du fil est une republication. */
  reposter: { user_id: string; pseudo: string; avatar_url: string | null; created_at: string } | null;
  pr?: {
    id: string;
    exercise: string;
    exercise_name?: string | null;
    weight_kg: number;
    reps: number;
    status: "pending" | "verified" | "contested" | "rejected" | "suspect";
    lift: "squat" | "bench" | "deadlift" | null;
    ai_status: "unavailable" | "queued" | "passed" | "failed";
    valid_count: number;
    doubt_count: number;
    my_vote: "valid" | "doubt" | null;
    is_own: boolean;
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

const POST_COLUMNS =
  "id, user_id, type, media_url, media_type, caption, muscle_groups, macros, pr_id, hype_count, comment_count, repost_count, repost_of, meal_name, meal_kcal, meal_protein_g, meal_carbs_g, meal_fat_g, created_at, hidden_at";

type PostRow = {
  id: string;
  user_id: string;
  type: PostType;
  media_url: string | null;
  media_type: "image" | "video" | null;
  caption: string | null;
  muscle_groups: string[] | null;
  macros: Record<string, number> | null;
  pr_id: string | null;
  hype_count: number;
  comment_count: number;
  repost_count: number | null;
  repost_of: string | null;
  meal_name: string | null;
  meal_kcal: number | null;
  meal_protein_g: number | null;
  meal_carbs_g: number | null;
  meal_fat_g: number | null;
  created_at: string;
  hidden_at?: string | null;
};

type ProfilePreview = {
  user_id: string;
  pseudo: string | null;
  avatar_url: string | null;
  current_grade: string | null;
};

type PrPreview = {
  id: string;
  user_id: string;
  exercise: string;
  exercise_name: string | null;
  weight_kg: number;
  reps: number;
  status: "pending" | "verified" | "contested" | "rejected" | "suspect";
  lift: "squat" | "bench" | "deadlift" | null;
  ai_status: "unavailable" | "queued" | "passed" | "failed";
};

function fallbackAuthor(userId: string): FeedPost["author"] {
  return {
    user_id: userId,
    pseudo: "Athlète Centuria",
    avatar_url: null,
    current_grade: "recruit",
  };
}

function mealOf(row: PostRow): MealInfo | null {
  if (
    row.meal_name === null &&
    row.meal_kcal === null &&
    row.meal_protein_g === null &&
    row.meal_carbs_g === null &&
    row.meal_fat_g === null
  ) {
    return null;
  }
  return {
    name: row.meal_name,
    kcal: row.meal_kcal,
    protein_g: row.meal_protein_g,
    carbs_g: row.meal_carbs_g,
    fat_g: row.meal_fat_g,
  };
}

/** Contexte utilisateur partagé par les hydratations de fil. */
interface ViewerContext {
  meId: string | null;
  hyped: Set<string>;
  saved: Set<string>;
  /** post source -> id de mon repost */
  myReposts: Map<string, string>;
}

async function loadViewerContext(postIds: string[]): Promise<ViewerContext> {
  const { data: { user } } = await supabase.auth.getUser();
  const meId = user?.id ?? null;
  const ctx: ViewerContext = { meId, hyped: new Set(), saved: new Set(), myReposts: new Map() };
  if (!meId || postIds.length === 0) return ctx;

  const [hypesRes, savesRes, repostsRes] = await Promise.all([
    supabase.from("post_hypes").select("post_id").eq("user_id", meId).in("post_id", postIds),
    supabase.from("post_saves").select("post_id").eq("user_id", meId).in("post_id", postIds),
    supabase.from("posts").select("id, repost_of").eq("user_id", meId).in("repost_of", postIds),
  ]);
  (hypesRes.data ?? []).forEach((r: any) => ctx.hyped.add(r.post_id));
  (savesRes.data ?? []).forEach((r: any) => ctx.saved.add(r.post_id));
  (repostsRes.data ?? []).forEach((r: any) => {
    if (r.repost_of) ctx.myReposts.set(r.repost_of, r.id);
  });
  return ctx;
}

/** Hydrate une liste de posts sources (auteur, PR, votes) sans requêtes N+1. */
async function hydrateSourcePosts(rows: PostRow[], ctx: ViewerContext): Promise<Map<string, FeedPost>> {
  const out = new Map<string, FeedPost>();
  if (rows.length === 0) return out;

  const userIds = [...new Set(rows.map((p) => p.user_id))];
  const prIds = [...new Set(rows.map((p) => p.pr_id).filter(Boolean) as string[])];

  const [profilesRes, prsRes, votesRes] = await Promise.all([
    supabase
      .from("profiles_public")
      .select("user_id, pseudo, avatar_url, current_grade")
      .in("user_id", userIds),
    prIds.length > 0
      ? supabase
          .from("prs")
          .select("id, user_id, exercise, exercise_name, weight_kg, reps, status, lift, ai_status")
          .in("id", prIds)
      : Promise.resolve({ data: [], error: null }),
    prIds.length > 0
      ? supabase.from("pr_votes").select("pr_id, user_id, vote").in("pr_id", prIds)
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
    (prsRes.data ?? []).forEach((pr: any) => prsById.set(pr.id, pr as PrPreview));
  }

  const voteAgg = new Map<string, { valid: number; doubt: number; mine: "valid" | "doubt" | null }>();
  if (!votesRes.error) {
    (votesRes.data ?? []).forEach((v: any) => {
      const agg = voteAgg.get(v.pr_id) ?? { valid: 0, doubt: 0, mine: null };
      if (v.vote === "valid") agg.valid++;
      else if (v.vote === "doubt") agg.doubt++;
      if (ctx.meId && v.user_id === ctx.meId) agg.mine = v.vote;
      voteAgg.set(v.pr_id, agg);
    });
  }

  rows.forEach((post) => {
    const profile = profilesByUser.get(post.user_id);
    const author = profile
      ? {
          user_id: profile.user_id,
          pseudo: profile.pseudo ?? "Athlète Centuria",
          avatar_url: profile.avatar_url,
          current_grade: profile.current_grade ?? "recruit",
        }
      : fallbackAuthor(post.user_id);

    let prBlock: FeedPost["pr"] = null;
    if (post.pr_id) {
      const raw = prsById.get(post.pr_id);
      if (raw) {
        const agg = voteAgg.get(raw.id) ?? { valid: 0, doubt: 0, mine: null };
        prBlock = {
          id: raw.id,
          exercise: raw.exercise,
          exercise_name: raw.exercise_name,
          weight_kg: raw.weight_kg,
          reps: raw.reps,
          status: raw.status,
          lift: raw.lift ?? null,
          ai_status: raw.ai_status ?? "unavailable",
          valid_count: agg.valid,
          doubt_count: agg.doubt,
          my_vote: agg.mine,
          is_own: ctx.meId === raw.user_id,
        };
      }
    }

    out.set(post.id, {
      feed_key: post.id,
      id: post.id,
      user_id: post.user_id,
      type: post.type,
      media_url: post.media_url,
      media_type: post.media_type,
      caption: post.caption,
      muscle_groups: post.muscle_groups,
      macros: post.macros,
      meal: mealOf(post),
      pr_id: post.pr_id,
      hype_count: post.hype_count,
      comment_count: post.comment_count,
      repost_count: post.repost_count ?? 0,
      created_at: post.created_at,
      author,
      hyped_by_me: ctx.hyped.has(post.id),
      saved_by_me: ctx.saved.has(post.id),
      my_repost_id: ctx.myReposts.get(post.id) ?? null,
      reposter: null,
      pr: prBlock,
    });
  });

  return out;
}

/**
 * Transforme des lignes brutes (posts + reposts) en entrées de fil unifiées.
 * Un repost affiche le contenu du post source : aucun média dupliqué.
 */
async function buildFeedEntries(rows: PostRow[]): Promise<FeedPost[]> {
  if (rows.length === 0) return [];
  const blocked = await fetchBlockedIds();

  const repostRows = rows.filter((r) => r.repost_of);
  const directRows = rows.filter((r) => !r.repost_of && !blocked.has(r.user_id));

  let originals: PostRow[] = [];
  if (repostRows.length > 0) {
    const ids = [...new Set(repostRows.map((r) => r.repost_of as string))];
    const { data } = await supabase.from("posts").select(POST_COLUMNS).in("id", ids);
    originals = ((data ?? []) as PostRow[]).filter((p) => !p.hidden_at && !blocked.has(p.user_id));
  }

  const sources = new Map<string, PostRow>();
  directRows.forEach((r) => sources.set(r.id, r));
  originals.forEach((r) => sources.set(r.id, r));

  const sourceIds = [...sources.keys()];
  const ctx = await loadViewerContext(sourceIds);
  const hydrated = await hydrateSourcePosts([...sources.values()], ctx);

  // Auteurs des reposts
  const reposterIds = [...new Set(repostRows.map((r) => r.user_id))].filter((id) => !blocked.has(id));
  const reposterById = new Map<string, ProfilePreview>();
  if (reposterIds.length > 0) {
    const { data } = await supabase
      .from("profiles_public")
      .select("user_id, pseudo, avatar_url, current_grade")
      .in("user_id", reposterIds);
    (data ?? []).forEach((p: any) => reposterById.set(p.user_id, p));
  }

  const entries: FeedPost[] = [];
  rows.forEach((row) => {
    if (blocked.has(row.user_id)) return;
    if (!row.repost_of) {
      const base = hydrated.get(row.id);
      if (base) entries.push(base);
      return;
    }
    const base = hydrated.get(row.repost_of);
    if (!base) return;
    const reposter = reposterById.get(row.user_id);
    entries.push({
      ...base,
      feed_key: row.id,
      reposter: {
        user_id: row.user_id,
        pseudo: reposter?.pseudo ?? "Athlète Centuria",
        avatar_url: reposter?.avatar_url ?? null,
        created_at: row.created_at,
      },
    });
  });

  return entries;
}

/* ── Fil unique ── */
/** Page de fil : 15 entrées par défaut, curseur sur `created_at`. */
export const FEED_PAGE_SIZE = 15;

export async function fetchFeed(options: { limit?: number; before?: string } = {}): Promise<FeedPost[]> {
  const limit = options.limit ?? FEED_PAGE_SIZE;

  let query = supabase
    .from("posts")
    .select(POST_COLUMNS)
    .is("hidden_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (options.before) query = query.lt("created_at", options.before);
  const { data: posts, error } = await query;
  if (error) throw error;

  return buildFeedEntries((posts ?? []) as PostRow[]);
}

/* ── Public profile ── */
export async function fetchPublicProfile(userId: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase
    .from("profiles_public")
    .select("user_id, pseudo, bio, avatar_url, cover_url, current_grade, xp, posts_count, followers_count, following_count")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as PublicProfile | null;
}

/** Publications originales d'un profil (les reposts ont leur propre onglet). */
export async function fetchUserPosts(userId: string): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("user_id", userId)
    .is("repost_of", null)
    .is("hidden_at", null)
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw error;
  return buildFeedEntries((data ?? []) as PostRow[]);
}

/** Republications d'un profil. */
export async function fetchUserReposts(userId: string): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("user_id", userId)
    .not("repost_of", "is", null)
    .is("hidden_at", null)
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw error;
  return buildFeedEntries((data ?? []) as PostRow[]);
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
    const blocked = await fetchBlockedIds();
    excludeIds.push(...blocked);
  }

  let query = supabase
    .from("profiles_public")
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

/* ── Enregistrements privés ── */
export async function toggleSave(postId: string, currentlySaved: boolean) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Connecte-toi.");
  if (currentlySaved) {
    const { error } = await supabase
      .from("post_saves")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("post_saves").insert({ post_id: postId, user_id: user.id });
    // 23505 = déjà enregistré : l'état voulu est déjà atteint.
    if (error && (error as any).code !== "23505") throw error;
  }
}

export const SAVED_PAGE_SIZE = 18;

export async function fetchSavedPosts(options: { limit?: number; before?: string } = {}): Promise<FeedPost[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  let q = supabase
    .from("post_saves")
    .select("post_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(options.limit ?? SAVED_PAGE_SIZE);
  if (options.before) q = q.lt("created_at", options.before);
  const { data: saves, error } = await q;
  if (error || !saves || saves.length === 0) return [];

  const ids = saves.map((s: any) => s.post_id);
  const { data: posts } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .in("id", ids)
    .is("hidden_at", null);

  const rows = (posts ?? []) as PostRow[];
  const byId = new Map(rows.map((r) => [r.id, r]));
  // Conserve l'ordre d'enregistrement ; les posts supprimés/masqués disparaissent.
  const ordered = ids.map((id: string) => byId.get(id)).filter(Boolean) as PostRow[];
  return buildFeedEntries(ordered);
}

/** Curseur de pagination pour « Enregistrés ». */
export async function fetchSavedCursor(lastPostId: string): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("post_saves")
    .select("created_at")
    .eq("user_id", user.id)
    .eq("post_id", lastPostId)
    .maybeSingle();
  return (data as any)?.created_at ?? null;
}

/* ── Republication ── */
export async function repost(postId: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Connecte-toi.");
  const { data, error } = await supabase
    .from("posts")
    .insert({ user_id: user.id, type: "workout", media_type: "image", repost_of: postId })
    .select("id")
    .single();
  if (error) {
    if ((error as any).code === "23505") throw new Error("Tu as déjà republié cette publication.");
    throw error;
  }
  return data.id as string;
}

export async function undoRepost(repostId: string) {
  const { error } = await supabase.from("posts").delete().eq("id", repostId);
  if (error) throw error;
}

/* ── Create post ── */
export async function createPost(input: {
  type: PostType;
  media_url?: string | null;
  media_type?: "image" | "video" | null;
  caption?: string | null;
  muscle_groups?: string[] | null;
  macros?: Record<string, number> | null;
  pr_id?: string | null;
  meal_name?: string | null;
  meal_kcal?: number | null;
  meal_protein_g?: number | null;
  meal_carbs_g?: number | null;
  meal_fat_g?: number | null;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Connecte-toi.");
  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      type: input.type,
      media_url: input.media_url ?? null,
      media_type: input.media_type ?? "image",
      caption: input.caption ?? null,
      muscle_groups: input.muscle_groups ?? null,
      macros: input.macros ?? null,
      pr_id: input.pr_id ?? null,
      meal_name: input.meal_name ?? null,
      meal_kcal: input.meal_kcal ?? null,
      meal_protein_g: input.meal_protein_g ?? null,
      meal_carbs_g: input.meal_carbs_g ?? null,
      meal_fat_g: input.meal_fat_g ?? null,
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

/* ── Recherche d'athlètes ── */
export async function searchProfiles(term: string, limit = 20): Promise<PublicProfile[]> {
  const q = term.trim();
  if (q.length < 2) return [];
  const { data, error } = await supabase
    .from("profiles_public")
    .select("user_id, pseudo, bio, avatar_url, cover_url, current_grade, xp, posts_count, followers_count, following_count")
    .ilike("pseudo", `%${q}%`)
    .order("followers_count", { ascending: false })
    .limit(limit);
  if (error) return [];
  const [{ data: { user } }, blocked] = await Promise.all([
    supabase.auth.getUser(),
    fetchBlockedIds(),
  ]);
  return ((data ?? []) as PublicProfile[]).filter(
    (p) => !blocked.has(p.user_id) && p.user_id !== user?.id,
  );
}

/* ── Commentaires ── */
export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  like_count: number;
  liked_by_me: boolean;
  author: { pseudo: string; avatar_url: string | null; current_grade: string } | null;
  is_mine: boolean;
}

export interface CommentThread extends PostComment {
  replies: PostComment[];
}

export const COMMENTS_PAGE_SIZE = 20;

/**
 * Commentaires racines paginés (les plus récents d'abord côté requête,
 * réaffichés du plus ancien au plus récent) + toutes leurs réponses.
 */
export async function fetchCommentThreads(
  postId: string,
  options: { before?: string } = {},
): Promise<{ threads: CommentThread[]; hasMore: boolean; total: number }> {
  const [{ data: { user } }, blocked] = await Promise.all([
    supabase.auth.getUser(),
    fetchBlockedIds(),
  ]);

  let rootQuery = supabase
    .from("post_comments")
    .select("id, post_id, user_id, parent_id, body, created_at, like_count")
    .eq("post_id", postId)
    .is("parent_id", null)
    .is("hidden_at", null)
    .order("created_at", { ascending: false })
    .limit(COMMENTS_PAGE_SIZE + 1);
  if (options.before) rootQuery = rootQuery.lt("created_at", options.before);

  const { data: rootData, error } = await rootQuery;
  if (error || !rootData) return { threads: [], hasMore: false, total: 0 };

  const hasMore = rootData.length > COMMENTS_PAGE_SIZE;
  const roots = rootData.slice(0, COMMENTS_PAGE_SIZE).filter((c: any) => !blocked.has(c.user_id));

  let replies: any[] = [];
  if (roots.length > 0) {
    const { data } = await supabase
      .from("post_comments")
      .select("id, post_id, user_id, parent_id, body, created_at, like_count")
      .in("parent_id", roots.map((r: any) => r.id))
      .is("hidden_at", null)
      .order("created_at", { ascending: true });
    replies = (data ?? []).filter((c: any) => !blocked.has(c.user_id));
  }

  const all = [...roots, ...replies];
  if (all.length === 0) return { threads: [], hasMore, total: 0 };

  const userIds = [...new Set(all.map((c: any) => c.user_id))];
  const commentIds = all.map((c: any) => c.id);
  const [profilesRes, likesRes] = await Promise.all([
    supabase.from("profiles_public").select("user_id, pseudo, avatar_url, current_grade").in("user_id", userIds),
    user
      ? supabase.from("comment_likes").select("comment_id").eq("user_id", user.id).in("comment_id", commentIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);
  const byUser = new Map((profilesRes.data ?? []).map((p: any) => [p.user_id as string, p]));
  const likedSet = new Set(((likesRes as any).data ?? []).map((l: any) => l.comment_id as string));

  const toComment = (c: any): PostComment => {
    const p = byUser.get(c.user_id);
    return {
      id: c.id,
      post_id: c.post_id,
      user_id: c.user_id,
      parent_id: c.parent_id ?? null,
      body: c.body,
      created_at: c.created_at,
      like_count: c.like_count ?? 0,
      liked_by_me: likedSet.has(c.id),
      author: p
        ? {
            pseudo: (p as any).pseudo ?? "Athlète",
            avatar_url: (p as any).avatar_url,
            current_grade: (p as any).current_grade ?? "recruit",
          }
        : null,
      is_mine: !!user && user.id === c.user_id,
    };
  };

  const repliesByParent = new Map<string, PostComment[]>();
  replies.forEach((r) => {
    const list = repliesByParent.get(r.parent_id) ?? [];
    list.push(toComment(r));
    repliesByParent.set(r.parent_id, list);
  });

  const threads: CommentThread[] = roots
    .slice()
    .reverse()
    .map((r: any) => ({ ...toComment(r), replies: repliesByParent.get(r.id) ?? [] }));

  return { threads, hasMore, total: all.length };
}

export async function addComment(postId: string, body: string, parentId?: string | null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Connecte-toi pour commenter.");
  const text = body.trim();
  if (!text) throw new Error("Commentaire vide.");
  const { data, error } = await supabase
    .from("post_comments")
    .insert({
      post_id: postId,
      user_id: user.id,
      body: text.slice(0, 500),
      parent_id: parentId ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteComment(id: string) {
  const { error } = await supabase.from("post_comments").delete().eq("id", id);
  if (error) throw error;
}

export async function toggleCommentLike(commentId: string, currentlyLiked: boolean) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Connecte-toi.");
  if (currentlyLiked) {
    const { error } = await supabase
      .from("comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", user.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: user.id });
    if (error && (error as any).code !== "23505") throw error;
  }
}

/** Nombre total de commentaires visibles d'un post (réponses incluses). */
export async function countComments(postId: string): Promise<number> {
  const { count } = await supabase
    .from("post_comments")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId)
    .is("hidden_at", null);
  return count ?? 0;
}
