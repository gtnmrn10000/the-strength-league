# Analytics & Observability (first-party, no external SaaS)

## Events (`public.analytics_events`)

Written via `src/lib/analytics.ts` — `track(event, props)`. Non-blocking, never
throws, no-ops when signed out, lightly batched (flush every ~2s or 10 events).

| Event | Where | Key props |
|---|---|---|
| `signup_completed` | AuthPanel (email/OAuth signup) | `method` |
| `onboarding_completed` | Onboarding (final step) | `goal`, `pseudo` |
| `workout_started` | WorkoutLogger (template picked / coach session) | `source` |
| `workout_completed` | WorkoutLogger (save success) | `exercises`, `sets`, `duration_min`, `records` |
| `workout_sync_failed` | WorkoutLogger (offline / network error) | `reason` |
| `exercise_added` | WorkoutLogger (add from library) | `name` (exercise id) |
| `pr_created` | PRFlow (submit success) | `exercise`, `reps` |
| `pr_verified` | PostCard (community vote crosses threshold) | `exercise` |
| `post_created` | PostComposer (publish success) | `media_type` |
| `paywall_viewed` | Paywall (sheet opens) | `reason` |
| `purchase_started` | Paywall (subscribe tapped) | `plan` |
| `grade_unlocked` | WorkoutLogger (XP award leveled up) | `grade`, `previous_grade` |
| `account_deleted` | AccountSection (deletion confirmed) | — |

## Privacy

`props` (and `client_errors.message`/`context`) must **never** contain:
emails, names, phone numbers, precise location, tokens/secrets, or free-text
user content. Only small, non-identifying attributes (ids, enums, counts,
durations, booleans). `analytics.ts` also defensively strips any prop key
matching `email|token|password|phone|secret|address|firstname|lastname`.

RLS: authenticated users may only INSERT/SELECT their own rows
(`user_id = auth.uid()`). A DB trigger rate-limits inserts to 300/hour/user.

## SQL — ready to run (Supabase SQL editor / service role)

**Activation rate** (signed up and completed onboarding within 7 days):
```sql
with signups as (
  select user_id, min(created_at) as signed_up_at
  from analytics_events where event = 'signup_completed'
  group by user_id
),
activated as (
  select distinct user_id from analytics_events where event = 'onboarding_completed'
)
select
  count(*) filter (where a.user_id is not null) as activated,
  count(*) as total_signups,
  round(100.0 * count(*) filter (where a.user_id is not null) / nullif(count(*), 0), 1) as activation_rate_pct
from signups s
left join activated a on a.user_id = s.user_id;
```

**Weekly sessions per user** (distinct workout_started per user per ISO week):
```sql
select
  date_trunc('week', created_at) as week,
  count(*)::float / nullif(count(distinct user_id), 0) as avg_sessions_per_user
from analytics_events
where event = 'workout_started'
group by 1
order by 1 desc;
```

**D1 / D7 / D30 retention** (based on `signup_completed` as day 0, any event as return):
```sql
with signups as (
  select user_id, min(created_at)::date as d0
  from analytics_events where event = 'signup_completed'
  group by user_id
),
activity as (
  select user_id, created_at::date as d from analytics_events
)
select
  s.user_id,
  s.d0,
  bool_or(a.d = s.d0 + 1) as d1_retained,
  bool_or(a.d = s.d0 + 7) as d7_retained,
  bool_or(a.d = s.d0 + 30) as d30_retained
from signups s
left join activity a on a.user_id = s.user_id
group by s.user_id, s.d0;
-- aggregate:
-- select avg(d1_retained::int)*100, avg(d7_retained::int)*100, avg(d30_retained::int)*100 from (…above…) t;
```

## Client error logging (`public.client_errors`)

`src/lib/errorLog.ts` exposes `logClientError(error, context?)` — non-blocking,
never throws, truncates messages (500 chars) / context (300 chars), and
scrubs emails, bearer/JWT-looking tokens, and query strings/fragments off
URLs before anything is stored or sent. RLS is insert/select-own only, with
a DB trigger rate-limiting inserts to 30/hour/user.

The global `ErrorBoundary` (`src/components/system/ErrorBoundary.tsx`,
wired into `src/routes/__root.tsx`) shows a calm French screen ("Un imprévu
s'est produit… Réessayer") with no stack trace, and calls `logClientError`
from `componentDidCatch`.

No token, secret, or full URL with a query string is ever `console.log`ed
in production code paths; the only remaining `console.*` calls in the app
are for local dev warnings and always deal with generic error messages.

## Optional Sentry adapter

`src/lib/sentryAdapter.ts` reads `import.meta.env.VITE_SENTRY_DSN`. We do
**not** install the Sentry SDK and do **not** invent a DSN — if the env var
is absent (the default in this project), `reportToSentry()` is a pure no-op.
If a deployment later sets `VITE_SENTRY_DSN` and adds a real Sentry SDK
dependency, wire the actual `Sentry.captureMessage` call inside
`reportToSentry`; nothing else needs to change since `logClientError`
already calls it unconditionally.
