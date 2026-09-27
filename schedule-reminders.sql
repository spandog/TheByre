-- Run once, after the send-birthday-reminders Edge Function is deployed.
-- Schedules it to run every morning and check for due reminders.

-- 1. Make sure the scheduler and HTTP extensions are on.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. Store your project URL and anon (publishable) key somewhere the cron
--    job can read them without hardcoding secrets into the schedule itself.
--    Replace the two values below with your real ones before running this.
select vault.create_secret('https://tnhfweacsybmnzfjknnw.supabase.co', 'project_url');
select vault.create_secret('sb_publishable_jdRVyvbFgTX75ltbVpbZ3A_hXD5BcTt', 'publishable_key');

-- 3. Schedule the daily check. 7am UTC ≈ 8am UK time in winter, 7am in
--    British Summer Time — adjust the "7" if you'd rather it landed at a
--    different hour.
select
  cron.schedule(
    'daily-birthday-reminders',
    '0 7 * * *',
    $$
    select
      net.http_post(
          url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/send-birthday-reminders',
          headers := jsonb_build_object(
            'Content-type', 'application/json',
            'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key')
          ),
          body := '{}'::jsonb
      ) as request_id;
    $$
  );

-- To check it's registered:
--   select * from cron.job;
-- To remove it later:
--   select cron.unschedule('daily-birthday-reminders');
