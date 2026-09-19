-- =========================================================================
-- First-party product analytics + client error logging (no external SaaS)
-- =========================================================================

-- ---------- analytics_events ----------
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete cascade,
  event text not null,
  -- IMPORTANT: `props` must never contain PII (no email, no name, no phone,
  -- no free-text user content, no IP, no precise geolocation). Only small,
  -- non-identifying attributes (ids, enums, counts, durations, booleans).
  props jsonb not null default '{}'::jsonb,
  app_version text,
  platform text,
  created_at timestamptz not null default now()
);

comment on table public.analytics_events is
  'First-party product analytics. props must never contain PII (emails, names, tokens, free text). See docs/analytics.md.';

create index if not exists analytics_events_event_created_idx
  on public.analytics_events (event, created_at desc);

create index if not exists analytics_events_user_created_idx
  on public.analytics_events (user_id, created_at desc);

alter table public.analytics_events enable row level security;

-- Only authenticated users may insert, and only rows attributed to themselves.
drop policy if exists "analytics_events_insert_own" on public.analytics_events;
create policy "analytics_events_insert_own"
  on public.analytics_events
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Users may only read their own events (no cross-user analytics access from the client).
drop policy if exists "analytics_events_select_own" on public.analytics_events;
create policy "analytics_events_select_own"
  on public.analytics_events
  for select
  to authenticated
  using (user_id = auth.uid());

grant select, insert on public.analytics_events to authenticated;
revoke all on public.analytics_events from anon;

-- Rate limit: max 300 events / hour / user.
create or replace function public.enforce_analytics_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
begin
  if new.user_id is null then
    return new;
  end if;

  select count(*) into recent_count
  from public.analytics_events
  where user_id = new.user_id
    and created_at > now() - interval '1 hour';

  if recent_count >= 300 then
    raise exception 'Rate limit exceeded: max 300 analytics events per hour per user';
  end if;

  return new;
end;
$$;

drop trigger if exists analytics_events_rate_limit on public.analytics_events;
create trigger analytics_events_rate_limit
  before insert on public.analytics_events
  for each row
  execute function public.enforce_analytics_rate_limit();

-- ---------- client_errors ----------
create table if not exists public.client_errors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete cascade,
  -- message/context are truncated client-side and must never contain
  -- tokens, secrets, emails, or full URLs with query strings.
  message text not null,
  context text,
  app_version text,
  platform text,
  created_at timestamptz not null default now()
);

comment on table public.client_errors is
  'Client-side error reports. message/context must never contain tokens, secrets, emails or full URLs with query strings. See docs/analytics.md.';

create index if not exists client_errors_created_idx
  on public.client_errors (created_at desc);

create index if not exists client_errors_user_created_idx
  on public.client_errors (user_id, created_at desc);

alter table public.client_errors enable row level security;

drop policy if exists "client_errors_insert_own" on public.client_errors;
create policy "client_errors_insert_own"
  on public.client_errors
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "client_errors_select_own" on public.client_errors;
create policy "client_errors_select_own"
  on public.client_errors
  for select
  to authenticated
  using (user_id = auth.uid());

grant select, insert on public.client_errors to authenticated;
revoke all on public.client_errors from anon;

-- Rate limit: max 30 errors / hour / user.
create or replace function public.enforce_client_errors_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
begin
  if new.user_id is null then
    return new;
  end if;

  select count(*) into recent_count
  from public.client_errors
  where user_id = new.user_id
    and created_at > now() - interval '1 hour';

  if recent_count >= 30 then
    raise exception 'Rate limit exceeded: max 30 client error reports per hour per user';
  end if;

  return new;
end;
$$;

drop trigger if exists client_errors_rate_limit on public.client_errors;
create trigger client_errors_rate_limit
  before insert on public.client_errors
  for each row
  execute function public.enforce_client_errors_rate_limit();
