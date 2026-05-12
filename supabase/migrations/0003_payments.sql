-- Payment fields on `plans`. `txn_ref` is the Cashfree order_id; `payment_method`
-- is the gateway name. Defaults are historical (₹50 / upi); current writes
-- always set explicit values (₹99 / cashfree), so the defaults are only used
-- by ad-hoc inserts during data backfills.

alter table public.plans
  add column if not exists txn_ref text,
  add column if not exists amount_paise integer default 9900,
  add column if not exists payment_method text default 'cashfree';

create index if not exists idx_plans_paid on public.plans(user_id, paid);
