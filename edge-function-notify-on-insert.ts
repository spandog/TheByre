// Supabase Edge Function: notify-on-insert
//
// Deploy the same way as the others: Edge Functions -> Deploy a new
// function -> Via Editor -> name it exactly notify-on-insert -> paste this
// in -> deploy. Reuses the same VAPID secrets as send-birthday-reminders.
//
// This one isn't on a schedule — it's called by a Database Webhook each
// time a row is added to one of the tables below (see README for how to
// wire that up in the dashboard, no SQL needed).

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

function describe(table: string, record: any): { body: string; url: string } | null {
  switch (table) {
    case "events":
      return { body: "New on the calendar: " + record.title, url: "calendar.html" };
    case "shopping_items":
      return { body: "Added to the shopping list: " + record.text, url: "shopping.html" };
    case "todo_items":
      return { body: "Added to the to-do list: " + record.text, url: "todo.html" };
    case "clubs":
      return { body: "New club added: " + record.name, url: "clubs.html" };
    case "school_dates":
      return { body: "New school date: " + record.title, url: "school.html" };
    case "holidays":
      return { body: "New holiday planned: " + record.title, url: "holidays.html" };
    case "bin_reminders":
      return { body: "New bin added: " + record.name, url: "bins.html" };
    default:
      return null; // unknown table — say nothing rather than guess
  }
}

Deno.serve(async (req) => {
  const payload = await req.json().catch(() => null);
  if (!payload || payload.type !== "INSERT" || !payload.table || !payload.record) {
    return new Response(JSON.stringify({ sent: 0, reason: "not an insert payload" }), { status: 200 });
  }

  const info = describe(payload.table, payload.record);
  if (!info) {
    return new Response(JSON.stringify({ sent: 0, reason: "table not covered: " + payload.table }), { status: 200 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  webpush.setVapidDetails(
    Deno.env.get("VAPID_SUBJECT")!,
    Deno.env.get("VAPID_PUBLIC_KEY")!,
    Deno.env.get("VAPID_PRIVATE_KEY")!
  );

  const { data: subs } = await supabase.from("push_subscriptions").select("*");
  if (!subs || subs.length === 0) {
    return new Response(JSON.stringify({ sent: 0, reason: "no subscribed devices" }), { status: 200 });
  }

  const pushPayload = JSON.stringify({ title: "Family hub update", body: info.body, url: info.url });
  let sent = 0;
  const staleEndpoints: string[] = [];
  for (const sub of subs) {
    const pushSubscription = { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } };
    try {
      await webpush.sendNotification(pushSubscription, pushPayload);
      sent++;
    } catch (err: any) {
      if (err && (err.statusCode === 404 || err.statusCode === 410)) staleEndpoints.push(sub.endpoint);
    }
  }
  if (staleEndpoints.length > 0) {
    await supabase.from("push_subscriptions").delete().in("endpoint", staleEndpoints);
  }

  return new Response(JSON.stringify({ sent, staleRemoved: staleEndpoints.length }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
