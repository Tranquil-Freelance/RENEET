-- PrepInsight initial schema. Run this in Supabase SQL editor (or via the CLI).
-- All tables are written through the API layer using the service role key.
-- The anon key has zero access; RLS is enabled but no anon policies exist.

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text unique not null,
  state       text,
  attempt_no  integer default 1,
  target      text,
  study_hours text,
  exam_feel   text,
  created_at  timestamptz default now()
);

create table if not exists public.responses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users(id) on delete cascade,
  answers     jsonb not null,
  derived     jsonb,
  created_at  timestamptz default now()
);

create table if not exists public.analyses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users(id) on delete cascade,
  swot        jsonb not null,
  score_band  text,
  created_at  timestamptz default now()
);

create table if not exists public.plans (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users(id) on delete cascade,
  plan_json   jsonb,
  paid        boolean default false,
  payment_id  text,
  order_id    text,
  created_at  timestamptz default now()
);

create table if not exists public.checkins (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users(id) on delete cascade,
  day_number  integer,
  quiz        jsonb,
  score       integer,
  completed   boolean default false,
  created_at  timestamptz default now(),
  unique (user_id, day_number)
);

create index if not exists idx_responses_user on public.responses(user_id);
create index if not exists idx_analyses_user on public.analyses(user_id);
create index if not exists idx_plans_user on public.plans(user_id);
create index if not exists idx_checkins_user_day on public.checkins(user_id, day_number);

alter table public.users     enable row level security;
alter table public.responses enable row level security;
alter table public.analyses  enable row level security;
alter table public.plans     enable row level security;
alter table public.checkins  enable row level security;

-- Intentionally no anon policies. The service role key bypasses RLS and is used
-- exclusively from server-side API routes.
