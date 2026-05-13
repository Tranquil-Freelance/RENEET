-- RLS policies on payments, plans, responses, etc. call public.current_user_id().
-- Without EXECUTE for the session role, Postgres raises:
--   "permission denied for function current_user_id"
-- Authenticated API routes (anon key + user JWT) run as role `authenticated`.

grant execute on function public.current_user_id() to authenticated;
grant execute on function public.current_user_id() to service_role;
