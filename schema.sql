-- Run this once in your Supabase project's SQL editor (Project -> SQL Editor -> New query).

create extension if not exists "pgcrypto";

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  time time,
  category text not null default 'general', -- general | holiday | school | activity | birthday | anniversary
  notes text,
  recurring boolean not null default false, -- true for birthdays/anniversaries: `date` is the ORIGINAL date, and the app works out each year's occurrence from it
  remind_days_before integer, -- e.g. 3 = notify 3 days before this year's occurrence; null = no reminder
  created_at timestamptz not null default now()
);

create table if not exists shopping_items (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  checked boolean not null default false,
  source text not null default 'general', -- general | sainsburys | gousto | amazon
  added_at timestamptz not null default now()
);

create table if not exists school_dates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  term text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists holidays (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  start_date date not null,
  end_date date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,          -- e.g. "Swimming", "Gymnastics"
  child text,                  -- who it's for, if you want to note it
  address text,
  day_of_week integer not null, -- 0 = Sunday .. 6 = Saturday
  start_time time,
  end_time time,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists meal_ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  ingredients text, -- one per line
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz not null default now()
);

create table if not exists packing_items (
  id uuid primary key default gen_random_uuid(),
  holiday_id uuid not null references holidays(id) on delete cascade,
  text text not null,
  packed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Row Level Security: any signed-in user (i.e. anyone in the family who has
-- signed in via the email link) can read and write everything. There is no
-- per-person separation here on purpose, since this is shared family data.

alter table events enable row level security;
alter table shopping_items enable row level security;
alter table school_dates enable row level security;
alter table holidays enable row level security;
alter table packing_items enable row level security;
alter table clubs enable row level security;
alter table meal_ideas enable row level security;
alter table push_subscriptions enable row level security;

create policy "family read/write events" on events
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "family read/write shopping" on shopping_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "family read/write school" on school_dates
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "family read/write holidays" on holidays
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "family read/write packing" on packing_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "family read/write clubs" on clubs
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "family read/write meal ideas" on meal_ideas
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Each signed-in device manages only its own subscription row. The Edge
-- Function that actually sends push notifications uses the service role key,
-- which bypasses RLS entirely, so it can read every row regardless.
create policy "own push subscription" on push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Turn on realtime so both phones see changes live.
alter publication supabase_realtime add table events;
alter publication supabase_realtime add table shopping_items;
alter publication supabase_realtime add table school_dates;
alter publication supabase_realtime add table holidays;
alter publication supabase_realtime add table packing_items;
alter publication supabase_realtime add table clubs;
alter publication supabase_realtime add table meal_ideas;
