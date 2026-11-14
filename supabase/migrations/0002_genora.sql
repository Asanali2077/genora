-- GENORA schema: household-centric, RLS by household membership.
-- Replaces the generic starter tables from 0001 (they held no data).

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.ai_results;
drop table if exists public.quiz_responses;
drop table if exists public.profiles;
drop table if exists public.subscriptions;

-- Household: one family. `profile` holds the onboarding answers, validated by Zod in the app (lib/domain/profile.ts).
create table public.households (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My family',
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'partner')),
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);
create index household_members_user_idx on public.household_members(user_id);

-- Snapshot of each optimizer run (inputs + result), so savings are traceable over time.
create table public.benefit_plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  engine_version text not null,
  inputs jsonb not null,
  result jsonb not null,
  found_money numeric(10,2) not null,
  created_at timestamptz not null default now()
);
create index benefit_plans_household_idx on public.benefit_plans(household_id, created_at desc);

-- Childcare payments that can be reimbursed from the Dependent Care FSA.
create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  provider text not null,
  category text not null check (category in ('daycare', 'preschool', 'after_school', 'nanny', 'day_camp', 'overnight_camp', 'other')),
  amount numeric(10,2) not null check (amount > 0),
  service_from date not null,
  service_to date not null,
  provider_tin_last4 text check (provider_tin_last4 ~ '^[0-9]{4}$'),
  eligible boolean not null default true,
  status text not null default 'logged' check (status in ('logged', 'claimed', 'reimbursed')),
  source text not null default 'manual' check (source in ('manual', 'ai')),
  file_path text,
  created_at timestamptz not null default now(),
  check (service_to >= service_from)
);
create index receipts_household_idx on public.receipts(household_id, service_from desc);

-- School calendar (raw text pasted by the parent + no-school days extracted by AI or entered manually).
create table public.school_calendars (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  school_year text not null,
  raw_text text,
  days jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (household_id, school_year)
);

-- Coverage plan result (gaps + assignments), recomputed by the engine.
create table public.coverage_plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  school_year text not null,
  result jsonb not null,
  gap_budget numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);
create index coverage_plans_household_idx on public.coverage_plans(household_id, created_at desc);

-- Subscription state. `source = 'mock'` until a real payment provider is connected.
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  plan_id text not null,
  status text not null default 'active' check (status in ('trialing', 'active', 'canceled')),
  price numeric(10,2) not null,
  source text not null default 'mock',
  created_at timestamptz not null default now()
);
create index subscriptions_household_idx on public.subscriptions(household_id);

-- Funnel analytics: written by the server only.
alter table public.events add column if not exists household_id uuid references public.households(id) on delete set null;

-- Membership helper (security definer avoids recursive RLS on household_members).
create or replace function public.is_household_member(hid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.household_members m where m.household_id = hid and m.user_id = auth.uid());
$$;

-- Creating a household also makes the creator its owner member.
create or replace function public.add_owner_member() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.household_members (household_id, user_id, role) values (new.id, new.owner_id, 'owner');
  return new;
end $$;
create trigger households_add_owner after insert on public.households
  for each row execute procedure public.add_owner_member();

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create trigger households_touch before update on public.households
  for each row execute procedure public.touch_updated_at();

-- RLS
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.benefit_plans enable row level security;
alter table public.receipts enable row level security;
alter table public.school_calendars enable row level security;
alter table public.coverage_plans enable row level security;
alter table public.subscriptions enable row level security;

create policy households_insert on public.households for insert with check (owner_id = auth.uid());
create policy households_select on public.households for select using (public.is_household_member(id));
create policy households_update on public.households for update using (public.is_household_member(id));
create policy households_delete on public.households for delete using (owner_id = auth.uid());

create policy members_select on public.household_members for select using (public.is_household_member(household_id));

create policy plans_all on public.benefit_plans for all using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
create policy receipts_all on public.receipts for all using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
create policy calendars_all on public.school_calendars for all using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
create policy coverage_all on public.coverage_plans for all using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
-- Subscriptions are readable by members; only the server (service role) writes them.
create policy subscriptions_select on public.subscriptions for select using (public.is_household_member(household_id));

-- Private storage for receipt images: <household_id>/<file>
insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false) on conflict (id) do nothing;
create policy receipts_storage_rw on storage.objects for all
  using (bucket_id = 'receipts' and public.is_household_member(((storage.foldername(name))[1])::uuid))
  with check (bucket_id = 'receipts' and public.is_household_member(((storage.foldername(name))[1])::uuid));
