-- Email-OTP auth integration. Links public.users to auth.users (Supabase Auth).
-- Phone becomes optional; email is the new soft identity.

alter table public.users
  add column if not exists email text,
  add column if not exists auth_id uuid references auth.users(id) on delete cascade;

create unique index if not exists users_email_unique on public.users(email) where email is not null;
create unique index if not exists users_auth_id_unique on public.users(auth_id) where auth_id is not null;

-- Make phone optional (was NOT NULL in 0001).
alter table public.users alter column phone drop not null;
-- Name has a placeholder until onboarding fills it in.
alter table public.users alter column name set default 'Student';

-- RLS policies: authenticated users see only their own row.
drop policy if exists "users own row read" on public.users;
create policy "users own row read"
  on public.users for select
  using (auth_id = auth.uid());

drop policy if exists "users own row insert" on public.users;
create policy "users own row insert"
  on public.users for insert
  with check (auth_id = auth.uid());

drop policy if exists "users own row update" on public.users;
create policy "users own row update"
  on public.users for update
  using (auth_id = auth.uid())
  with check (auth_id = auth.uid());

-- Helper: resolve internal users.id from the current auth session.
create or replace function public.current_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.users where auth_id = auth.uid() limit 1;
$$;

-- Per-user policies on derived tables.
drop policy if exists "responses own rows" on public.responses;
create policy "responses own rows"
  on public.responses for all
  using (user_id = public.current_user_id())
  with check (user_id = public.current_user_id());

drop policy if exists "analyses own rows" on public.analyses;
create policy "analyses own rows"
  on public.analyses for all
  using (user_id = public.current_user_id())
  with check (user_id = public.current_user_id());

drop policy if exists "plans own rows" on public.plans;
create policy "plans own rows"
  on public.plans for all
  using (user_id = public.current_user_id())
  with check (user_id = public.current_user_id());

drop policy if exists "checkins own rows" on public.checkins;
create policy "checkins own rows"
  on public.checkins for all
  using (user_id = public.current_user_id())
  with check (user_id = public.current_user_id());
