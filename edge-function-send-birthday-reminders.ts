// Supabase Edge Function: send-birthday-reminders
//
// Set up in the Supabase Dashboard under Edge Functions -> Deploy a new
// function -> Via Editor. Name it exactly send-birthday-reminders, paste
// this in, and deploy.
//
// Needs three function secrets (Edge Functions -> Manage secrets):
//   VAPID_PUBLIC_KEY   — same value as VAPID_PUBLIC_KEY in config.js
//   VAPID_PRIVATE_KEY  — the matching private key (keep this one secret)
//   VAPID_SUBJECT      — "mailto:you@example.com" (any contact address)
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically —
// no need to set those yourself.

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

  // --- Work out which birthdays/anniversaries are due a reminder today ---
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("*")
    .eq("recurring", true)
    .in("category", ["birthday", "anniversary"])
    .not("remind_days_before", "is", null);

  if (eventsError) {
    return new Response(JSON.stringify({ error: eventsError.message }), { status: 500 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function nextOccurrence(origDateStr: string): Date {
    const orig = new Date(origDateStr + "T00:00:00");
    let occ = new Date(today.getFullYear(), orig.getMonth(), orig.getDate());
    if (occ < today) occ = new Date(today.getFullYear() + 1, orig.getMonth(), orig.getDate());
    return occ;
  }

  function daysUntil(d: Date): number {
    return Math.round((d.getTime() - today.getTime()) / 86400000);
  }

  const due = (events || []).filter((e) => {
    const occ = nextOccurrence(e.date);
    return daysUntil(occ) === e.remind_days_before;
  });

  if (due.length === 0) {
    return new Response(JSON.stringify({ sent: 0, reason: "nothing due today" }), { status: 200 });
  }

  // --- Get every device that's subscribed ---
  const { data: subs, error: subsError } = await supabase
    .from("push_subscriptions")
    .select("*");

  if (subsError) {
    return new Response(JSON.stringify({ error: subsError.message }), { status: 500 });
  }
  if (!subs || subs.length === 0) {
    return new Response(JSON.stringify({ sent: 0, reason: "no subscribed devices" }), { status: 200 });
  }

  let sent = 0;
  const staleEndpoints: string[] = [];

  for (const ev of due) {
    const daysLeft = ev.remind_days_before as number;
    const when = daysLeft === 0 ? "today" : "in " + daysLeft + " day" + (daysLeft === 1 ? "" : "s");
    const payload = JSON.stringify({
      title: ev.category === "anniversary" ? "Anniversary coming up" : "Birthday coming up",
      body: ev.title + " is " + when + ".",
      url: "calendar.html",
    });

    for (const sub of subs) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth_key },
      };
      try {
        await webpush.sendNotification(pushSubscription, payload);
        sent++;
      } catch (err: any) {
        // 404/410 means the browser has dropped this subscription for good
        if (err && (err.statusCode === 404 || err.statusCode === 410)) {
          staleEndpoints.push(sub.endpoint);
        }
      }
    }
  }

  if (staleEndpoints.length > 0) {
    await supabase.from("push_subscriptions").delete().in("endpoint", staleEndpoints);
  }

  return new Response(JSON.stringify({ sent, dueEvents: due.length, staleRemoved: staleEndpoints.length }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
