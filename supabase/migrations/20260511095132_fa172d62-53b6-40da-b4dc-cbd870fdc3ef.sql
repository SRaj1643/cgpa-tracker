
-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- SEMESTERS
create table public.semesters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  semester_number int not null,
  semester_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.semesters enable row level security;
create index semesters_user_id_idx on public.semesters(user_id);

create policy "Users view own semesters" on public.semesters for select using (auth.uid() = user_id);
create policy "Users insert own semesters" on public.semesters for insert with check (auth.uid() = user_id);
create policy "Users update own semesters" on public.semesters for update using (auth.uid() = user_id);
create policy "Users delete own semesters" on public.semesters for delete using (auth.uid() = user_id);

create trigger semesters_updated_at before update on public.semesters
  for each row execute function public.set_updated_at();

-- SUBJECTS
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  semester_id uuid not null references public.semesters(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_name text not null,
  course_code text,
  credits numeric(4,2) not null default 0,
  grade numeric(4,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.subjects enable row level security;
create index subjects_semester_id_idx on public.subjects(semester_id);
create index subjects_user_id_idx on public.subjects(user_id);

create policy "Users view own subjects" on public.subjects for select using (auth.uid() = user_id);
create policy "Users insert own subjects" on public.subjects for insert with check (auth.uid() = user_id);
create policy "Users update own subjects" on public.subjects for update using (auth.uid() = user_id);
create policy "Users delete own subjects" on public.subjects for delete using (auth.uid() = user_id);

create trigger subjects_updated_at before update on public.subjects
  for each row execute function public.set_updated_at();
