-- Run once, after all three functions below are deployed:
--   send-bin-reminder, send-weekly-lookahead, send-todo-reminders
--
-- Reuses the project_url and publishable_key already stored in Vault from
-- the earlier reminder setup — nothing new to create there.

-- Bin reminder: evening before, so there's time to put it out.
-- 19:00 UTC ≈ 7-8pm UK depending on the time of year.
select
  cron.schedule(
    'evening-bin-reminder',
    '0 19 * * *',
    $$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/send-bin-reminder',
      headers := jsonb_build_object(
        'Content-type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key')
      ),
      body := '{}'::jsonb
    ) as request_id;
    $$
  );

-- Weekly lookahead: Sunday evening, covering the Monday-Sunday ahead.
select
  cron.schedule(
    'weekly-lookahead',
    '0 18 * * 0',  -- Sunday, 18:00 UTC
    $$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/send-weekly-lookahead',
      headers := jsonb_build_object(
        'Content-type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key')
      ),
      body := '{}'::jsonb
    ) as request_id;
    $$
  );

-- To-do reminders: once daily, same time as the morning digest works well.
select
  cron.schedule(
    'todo-reminders',
    '0 7 * * *',  -- 7am UTC
    $$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/send-todo-reminders',
      headers := jsonb_build_object(
        'Content-type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key')
      ),
      body := '{}'::jsonb
    ) as request_id;
    $$
  );

-- Check what's scheduled: select * from cron.job;
-- Remove one later: select cron.unschedule('evening-bin-reminder'); (etc)
