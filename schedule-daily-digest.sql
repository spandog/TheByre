-- Run once, after the send-daily-digest Edge Function is deployed and its
-- secrets are set (same three as send-birthday-reminders).
--
-- Reuses the project_url and publishable_key already stored in Vault from
-- setting up the birthday reminders — no need to create them again. If you
-- haven't set those up yet, see schedule-reminders.sql first.

select
  cron.schedule(
    'daily-morning-digest',
    '0 7 * * *',  -- 7am UTC — adjust the "7" for a different time
    $$
    select
      net.http_post(
          url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/send-daily-digest',
          headers := jsonb_build_object(
            'Content-type', 'application/json',
            'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key')
          ),
          body := '{}'::jsonb
      ) as request_id;
    $$
  );

-- To check it's registered: select * from cron.job;
-- To remove it later: select cron.unschedule('daily-morning-digest');
