-- Canonical payment ledger for Cashfree transactions.
-- `plans` keeps the effective unlock flag; this table stores the payment trail.

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  provider text not null default 'cashfree',
  order_id text not null,
  status text not null default 'created',
  amount_paise integer not null default 0,
  currency text not null default 'INR',
  txn_ref text,
  raw_order jsonb,
  created_at timestamptz default now()
);

create unique index if not exists payments_order_id_unique on public.payments(order_id);
create index if not exists idx_payments_user_created on public.payments(user_id, created_at desc);
create index if not exists idx_payments_user_status on public.payments(user_id, status);

alter table public.payments enable row level security;

drop policy if exists "payments own rows" on public.payments;
create policy "payments own rows"
  on public.payments for all
  using (user_id = public.current_user_id())
  with check (user_id = public.current_user_id());

