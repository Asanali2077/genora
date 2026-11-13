-- Business Cup starter: схема + RLS. Выполнить в Supabase SQL Editor целиком (или `supabase db push`).
-- Включите в Auth → Providers: Anonymous sign-ins и Email (magic link).

create extension if not exists "pgcrypto";

-- Профили: 1 строка на auth.users (в т.ч. анонимного гостя)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  locale text not null default 'ru',
  is_premium boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_responses (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  answers jsonb not null default '{}'::jsonb,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id)
);

create table if not exists public.ai_results (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  share_id text not null unique default encode(gen_random_bytes(6), 'hex'),
  result jsonb not null,
  provider text not null default 'mock',
  locale text not null default 'ru',
  created_at timestamptz not null default now()
);
create index if not exists ai_results_session_idx on public.ai_results(session_id);

create table if not exists public.events (
  id bigint generated always as identity primary key,
  session_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,           -- landing_view, quiz_step_view, quiz_step_answer, result_view, paywall_view, purchase ...
  props jsonb not null default '{}'::jsonb,
  variant text,                 -- 'a' | 'b'
  is_seed boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists events_name_idx on public.events(name, created_at);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  plan_id text not null,
  status text not null default 'trialing',  -- trialing | active | canceled
  price numeric(10,2) not null default 0,
  variant text,
  is_seed boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists subscriptions_session_idx on public.subscriptions(session_id);

-- RLS: клиент (anon/authenticated) видит только свои строки; запись и админ-чтение идут через сервер (service_role обходит RLS).
alter table public.profiles enable row level security;
alter table public.quiz_responses enable row level security;
alter table public.ai_results enable row level security;
alter table public.events enable row level security;
alter table public.subscriptions enable row level security;

create policy "profiles_own_select" on public.profiles for select using (id = auth.uid());
create policy "profiles_own_update" on public.profiles for update using (id = auth.uid());
create policy "quiz_own_select" on public.quiz_responses for select using (user_id = auth.uid());
create policy "ai_own_select" on public.ai_results for select using (user_id = auth.uid());
create policy "subs_own_select" on public.subscriptions for select using (user_id = auth.uid());
-- events: клиенту доступа нет вообще (пишет только сервер).

-- Автосоздание профиля для каждого нового пользователя (включая анонимного)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email) on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Публичный просмотр шаринг-ссылки без авторизации — только через сервер (service_role) по share_id.
