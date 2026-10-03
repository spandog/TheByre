// Supabase Edge Function: send-todo-reminders
//
// Deploy the same way as the others: Edge Functions -> Deploy a new
// function -> Via Editor -> name it exactly send-todo-reminders -> paste
// this in -> deploy. Reuses the same VAPID secrets as send-birthday-reminders.

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  webpush.setVapidDetails(
    Deno.env.get("VAPID_SUBJECT")!,
    Deno.env.get("VAPID_PUBLIC_KEY")!,
    Deno.env.get("VAPID_PRIVATE_KEY")!
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  function daysUntil(iso: string): number {
    const d = new Date(iso + "T00:00:00");
    return Math.round((d.getTime() - today.getTime()) / 86400000);
  }

  const { data: todos, error } = await supabase
    .from("todo_items")
    .select("*")
    .eq("checked", false)
    .not("due_date", "is", null)
    .not("remind_days_before", "is", null);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const due = (todos || []).filter((t) => daysUntil(t.due_date) === t.remind_days_before);
  if (due.length === 0) {
    return new Response(JSON.stringify({ sent: 0, reason: "nothing due a reminder today" }), { status: 200 });
  }

  const { data: subs } = await supabase.from("push_subscriptions").select("*");
  if (!subs || subs.length === 0) {
    return new Response(JSON.stringify({ sent: 0, reason: "no subscribed devices" }), { status: 200 });
  }

  let sent = 0;
  const staleEndpoints: string[] = [];
  for (const item of due) {
    const daysLeft = item.remind_days_before as number;
    const when = daysLeft === 0 ? "today" : "in " + daysLeft + " day" + (daysLeft === 1 ? "" : "s");
    const payload = JSON.stringify({
      title: "To do reminder",
      body: item.text + " is due " + when + ".",
      url: "todo.html",
    });
    for (const sub of subs) {
      const pushSubscription = { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } };
      try {
        await webpush.sendNotification(pushSubscription, payload);
        sent++;
      } catch (err: any) {
        if (err && (err.statusCode === 404 || err.statusCode === 410)) staleEndpoints.push(sub.endpoint);
      }
    }
  }
  if (staleEndpoints.length > 0) {
    await supabase.from("push_subscriptions").delete().in("endpoint", staleEndpoints);
  }

  return new Response(JSON.stringify({ sent, dueItems: due.length, staleRemoved: staleEndpoints.length }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
