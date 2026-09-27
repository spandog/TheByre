-- Run once in the SQL Editor. Adds bins, contacts, and lets you tag
-- calendar events and to-dos by which child they're for. Everything else
-- in schema.sql is unchanged.

create table if not exists bin_reminders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  day_of_week integer not null,
  frequency text not null default 'weekly',
  anchor_date date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz not null default now()
);

alter table events add column if not exists child text;
alter table todo_items add column if not exists child text;

alter table bin_reminders enable row level security;
alter table contacts enable row level security;

create policy "family read/write bins" on bin_reminders
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "family read/write contacts" on contacts
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter publication supabase_realtime add table bin_reminders;
alter publication supabase_realtime add table contacts;
