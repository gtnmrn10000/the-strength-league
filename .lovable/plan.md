
# Réseau social Centuria — Feed public, profils, follow

## 1. Nettoyage league (à finir)

- Migration : `ALTER TABLE profiles DROP COLUMN league;` + `DROP TYPE league_type;` (goal_type conservé).
- Retirer `league` de `saveProfile` / `getMyProfile` (Zod, upsert, types).
- Supprimer `src/components/centuria/LeagueIcon.tsx` et l'appel « Guerre de factions » restant dans `Onboarding.tsx` (HeroCard).
- L'onboarding reste : hero → auth → stats (pseudo, âge, taille, poids) → objectif.

## 2. Base de données (une migration)

**Étendre `profiles`** : `bio text`, `avatar_url text`, `cover_url text`, `posts_count int default 0`, `followers_count int default 0`, `following_count int default 0`.

**Table `follows`**
```
follower_id uuid → profiles.user_id
following_id uuid → profiles.user_id
created_at timestamptz
PRIMARY KEY (follower_id, following_id)
CHECK (follower_id <> following_id)
```

**Table `posts`**
```
id uuid, user_id uuid, type post_type,
media_url text, caption text,
muscle_groups text[], macros jsonb,
pr_id uuid (nullable, FK prs.id), hype_count int default 0,
created_at timestamptz
```
Enum `post_type` : `pr | meal | workout | level_up`.

**Table `post_hypes`** (pour compter proprement)
```
post_id uuid, user_id uuid, created_at
PK (post_id, user_id)
```

**Triggers** :
- `follows` insert/delete → maj `profiles.followers_count` / `following_count`.
- `posts` insert/delete → maj `profiles.posts_count`.
- `post_hypes` insert/delete → maj `posts.hype_count`.

**GRANTs + RLS** :
- `profiles` : `SELECT` public (anon + authenticated) — profils publics.
- `posts` : `SELECT` public. `INSERT/UPDATE/DELETE` seulement pour `auth.uid() = user_id`.
- `follows` : `SELECT` public. `INSERT` si `auth.uid() = follower_id` et != following_id. `DELETE` si `auth.uid() = follower_id`.
- `post_hypes` : `SELECT` public. `INSERT/DELETE` si `auth.uid() = user_id`.

## 3. Server functions (`src/lib/social.functions.ts`)

- `getFeed({ cursor })` — public, publishable client. Récupère les 100 posts récents + counts + auteurs, applique le score côté serveur `0.5·recency + 0.3·hype_norm + 0.2·follow_bonus` (follow_bonus lu si utilisateur authentifié via header optionnel), retourne 20 posts.
- `getPublicProfile({ userId })` — public. Profil + is_following (si connecté).
- `getUserPosts({ userId, cursor })` — public.
- `getSuggestions()` — public. Top comptes par hype récent, exclut ceux déjà suivis si connecté.
- `getFollowers({ userId })` / `getFollowing({ userId })` — public.
- `follow({ userId })` / `unfollow({ userId })` — `requireSupabaseAuth`.
- `createPost({ type, mediaUrl, caption, ... })` — `requireSupabaseAuth`.
- `toggleHype({ postId })` — `requireSupabaseAuth`.
- `updateMyProfile({ bio, avatarUrl, coverUrl, pseudo })` — `requireSupabaseAuth`.

Extension : à la validation d'un PR (`verifyPR`), insérer automatiquement un `posts` de type `pr` lié.

## 4. Routes / pages

- `src/routes/profile.$userId.tsx` — profil public. Cover, avatar, pseudo, grade, bio, compteurs cliquables (followers/following ouvrent une `Sheet` avec la liste), bouton **Follow / Unfollow** (optimiste) ou **Éditer** si own profile, grille de posts (3 colonnes), onglets Posts / PR épinglés.
- `src/routes/discover.tsx` — suggestions de comptes (carte compte avec avatar, pseudo, grade, bouton Follow inline).
- Feed principal reste dans l'onglet actuel (`Feed.tsx`), refait pour appeler `getFeed`.

Grade / duels / classements existants : intacts.

## 5. Composants UI (`src/components/centuria/social/`)

- `PostCard.tsx` — carte adaptative (variant selon `type`) : header (avatar → link profil, pseudo, grade, timestamp), media, caption, muscle_groups (workout), macros (meal), badge grade (level_up), footer (bouton hype ❤ + count).
- `FollowButton.tsx` — état optimiste, gère loading + rollback via `useMutation` React Query.
- `Avatar.tsx` — fallback initiales quand pas d'`avatar_url`.
- `UserListSheet.tsx` — liste de profils (avatar + pseudo + grade + Follow button), utilisée pour followers/following.
- `EditProfileSheet.tsx` — édition bio, avatar (upload bucket `avatars`), pseudo.

Nouveau bucket Storage `avatars` (public read, owner write).

## 6. Feed algorithme (détail technique)

Côté serveur :
```
recency_score = exp(-age_hours / 24)          // decay 24h
hype_norm     = hype_count / (max_hype + 1)   // normalisé sur la fenêtre
follow_bonus  = is_followed ? 1 : 0
score = 0.5*recency + 0.3*hype_norm + 0.2*follow_bonus
```
Trie par score desc, limite 20, curseur = dernier `created_at`.

## 7. Adaptations existantes

- `Feed.tsx` : remplacer les données mockées par `getFeed` + `PostCard`.
- `BottomNav.tsx` : ajouter icône « Découverte » (loupe) si la nav actuelle a la place, sinon accessible depuis le feed via un bouton header.
- `Profile.tsx` (onglet perso actuel) : lien « Voir mon profil public » → `/profile/$myUserId`.
- `Training.tsx` : après un PR vérifié, un post est déjà créé côté serveur — pas de changement UI.

## 8. Ce qui ne bouge pas

- Système de grades individuels (Recrue → Légende) et `grades.ts`.
- Table `prs` et flow PR.
- Classements globaux + duels 1v1.

## Ordre d'exécution

1. Migration DB (drop league + nouvelles tables/triggers/RLS/GRANTs).
2. Nettoyage code league (Zod, server, LeagueIcon, HeroCard).
3. Server functions social.
4. Composants UI social + Avatar/FollowButton.
5. Routes `/profile/$userId` et `/discover`.
6. Rebrancher `Feed.tsx` sur `getFeed`.
7. Bucket `avatars` + EditProfileSheet.
8. Auto-post PR à la vérification.
