// Supabase Edge Function: send-bin-reminder
//
// Deploy the same way as the others: Edge Functions -> Deploy a new
// function -> Via Editor -> name it exactly send-bin-reminder -> paste this
// in -> deploy. Reuses the same VAPID secrets as send-birthday-reminders.
//
// Runs in the evening and checks whether any bin's next collection is
// TOMORROW, so the reminder actually arrives in time to put it out.

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

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowISO = tomorrow.getFullYear() + "-" + String(tomorrow.getMonth() + 1).padStart(2, "0") + "-" + String(tomorrow.getDate()).padStart(2, "0");

  function nextBinDate(day: number, frequency: string, anchor: string | null): string {
    let candidate = new Date(today);
    const diff = (day - candidate.getDay() + 7) % 7;
    candidate.setDate(candidate.getDate() + diff);
    if (frequency === "fortnightly" && anchor) {
      const anchorDate = new Date(anchor + "T00:00:00");
      const weeksBetween = Math.round((candidate.getTime() - anchorDate.getTime()) / (7 * 86400000));
      if (((weeksBetween % 2) + 2) % 2 !== 0) candidate.setDate(candidate.getDate() + 7);
    }
    return candidate.getFullYear() + "-" + String(candidate.getMonth() + 1).padStart(2, "0") + "-" + String(candidate.getDate()).padStart(2, "0");
  }

  const { data: bins, error } = await supabase.from("bin_reminders").select("*");
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const due = (bins || []).filter((b) => nextBinDate(b.day_of_week, b.frequency, b.anchor_date) === tomorrowISO);
  if (due.length === 0) {
    return new Response(JSON.stringify({ sent: 0, reason: "no bins tomorrow" }), { status: 200 });
  }

  const { data: subs } = await supabase.from("push_subscriptions").select("*");
  if (!subs || subs.length === 0) {
    return new Response(JSON.stringify({ sent: 0, reason: "no subscribed devices" }), { status: 200 });
  }

  const names = due.map((b) => b.name).join(" and ");
  const payload = JSON.stringify({
    title: "Bin night",
    body: (due.length === 1 ? names + " bin" : names + " bins") + " go out tomorrow — worth putting out tonight.",
    url: "bins.html",
  });

  let sent = 0;
  const staleEndpoints: string[] = [];
  for (const sub of subs) {
    const pushSubscription = { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } };
    try {
      await webpush.sendNotification(pushSubscription, payload);
      sent++;
    } catch (err: any) {
      if (err && (err.statusCode === 404 || err.statusCode === 410)) staleEndpoints.push(sub.endpoint);
    }
  }
  if (staleEndpoints.length > 0) {
    await supabase.from("push_subscriptions").delete().in("endpoint", staleEndpoints);
  }

  return new Response(JSON.stringify({ sent, bins: due.length, staleRemoved: staleEndpoints.length }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
