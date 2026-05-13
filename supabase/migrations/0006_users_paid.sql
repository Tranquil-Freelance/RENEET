-- Store the paid/unlock flag directly on users.
--
-- Why: plans.paid is the current canonical flag, but it requires resolving
-- users.id from auth_id first (via getOrCreateAppUserId), and if that
-- lookup ever returns a wrong/new ID the plans row is never found.
-- Having paid directly on users allows a single direct lookup by auth_id.
--
-- Backward-compat: existing paid users will have paid = false until they
-- next call /api/payment/confirm or until a backfill is run. The status
-- API falls back to plans/payments for all rows where users.paid IS NULL.

alter table public.users
  add column if not exists paid     boolean     default false,
  add column if not exists paid_at  timestamptz;

-- Index for the direct auth_id lookup used by status + getOrCreateAppUserId.
create index if not exists idx_users_auth_id on public.users(auth_id);

-- Backfill: mark users as paid if they already have a paid plan row.
update public.users u
set    paid    = true,
       paid_at = p.created_at
from   public.plans p
where  p.user_id = u.id
  and  p.paid    = true
  and  u.paid    = false;
