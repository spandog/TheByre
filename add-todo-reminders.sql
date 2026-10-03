-- Run once in the SQL Editor. Adds a reminder field to the to-do list.
alter table todo_items add column if not exists remind_days_before integer;
