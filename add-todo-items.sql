-- Run once in the SQL Editor. Only adds the new to-do table — everything
-- else in schema.sql is unchanged.

create table if not exists todo_items (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  checked boolean not null default false,
  due_date date,
  notes text,
  added_at timestamptz not null default now()
);

alter table todo_items enable row level security;

create policy "family read/write todo" on todo_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter publication supabase_realtime add table todo_items;
