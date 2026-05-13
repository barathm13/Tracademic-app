-- Smart Student Task & Attendance Tracker - Supabase schema
-- Run this file in the Supabase SQL editor before using the application.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  due_date date not null,
  status text not null default 'Pending' check (status in ('Pending', 'Completed')),
  created_at timestamptz not null default now()
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  status text not null check (status in ('Present', 'Absent')),
  unique (user_id, date)
);

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.attendance enable row level security;

create policy "Students can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Students can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Students can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Students can manage their own tasks"
  on public.tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Students can manage their own attendance"
  on public.attendance for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Automatically create a profile when a user registers.
-- This keeps registration working even when email confirmation is enabled.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do update
    set name = excluded.name,
        email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create index if not exists tasks_user_id_created_at_idx on public.tasks (user_id, created_at desc);
create index if not exists attendance_user_id_date_idx on public.attendance (user_id, date desc);
