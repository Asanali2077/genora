-- Partner invite: the second parent joins the household with a private link.
-- Run in the Supabase SQL Editor.

alter table public.households add column if not exists invite_token uuid not null default gen_random_uuid();

-- Joins the signed-in user (anonymous or email) to the household that owns the token.
-- security definer: clients cannot insert into household_members directly under RLS.
create or replace function public.join_household(token uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select id into hid from public.households where invite_token = token;
  if hid is null then raise exception 'invalid invite'; end if;
  insert into public.household_members (household_id, user_id, role) values (hid, auth.uid(), 'partner')
    on conflict (household_id, user_id) do nothing;
  return hid;
end $$;

revoke all on function public.join_household(uuid) from public;
grant execute on function public.join_household(uuid) to authenticated;
