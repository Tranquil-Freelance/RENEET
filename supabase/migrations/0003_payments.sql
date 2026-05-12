-- UPI payment fields on plans. Replaces the Razorpay-only flow.

alter table public.plans
  add column if not exists txn_ref text,
  add column if not exists amount_paise integer default 5000,
  add column if not exists payment_method text default 'upi';

create index if not exists idx_plans_paid on public.plans(user_id, paid);
