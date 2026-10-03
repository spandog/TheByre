// Supabase Edge Function: send-daily-digest
//
// Deploy the same way as send-birthday-reminders: Edge Functions -> Deploy a
// new function -> Via Editor -> name it exactly send-daily-digest -> paste
// this in -> deploy.
//
// Uses the same three secrets as send-birthday-reminders (VAPID_PUBLIC_KEY,
// VAPID_PRIVATE_KEY, VAPID_SUBJECT) — no new secrets needed if that function
// is already set up.

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
  const todayISO = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
  const dow = today.getDay();

  function formatTime(t: string | null): string {
    if (!t) return "";
    const [h, m] = t.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "pm" : "am";
    const h12 = ((hour + 11) % 12) + 1;
    return m === "00" ? h12 + ampm : h12 + ":" + m + ampm;
  }

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

  const bits: string[] = [];

  // Calendar events dated today (one-off; recurring birthdays/anniversaries
  // are handled separately by send-birthday-reminders, so skipped here).
  const { data: events } = await supabase.from("events").select("*").eq("date", todayISO).eq("recurring", false);
  (events || [])
    .sort((a, b) => (a.time || "99").localeCompare(b.time || "99"))
    .forEach((e) => bits.push(e.title + (e.time ? " at " + formatTime(e.time) : "")));

  // Clubs on today
  const { data: clubs } = await supabase.from("clubs").select("*").eq("day_of_week", dow);
  (clubs || []).forEach((c) => bits.push(c.name + (c.start_time ? " at " + formatTime(c.start_time) : "")));

  // Bin day
  const { data: bins } = await supabase.from("bin_reminders").select("*");
  (bins || []).forEach((b) => {
    if (nextBinDate(b.day_of_week, b.frequency, b.anchor_date) === todayISO) bits.push(b.name + " bin");
  });

  // School events today
  const { data: school } = await supabase.from("school_dates").select("*").eq("date", todayISO);
  (school || []).forEach((s) => bits.push(s.title));

  // To-dos due today or overdue, still unchecked
  const { data: todos } = await supabase.from("todo_items").select("*").eq("checked", false).lte("due_date", todayISO).not("due_date", "is", null);
  if (todos && todos.length) {
    bits.push(todos.length === 1 ? "1 thing due on the to-do list" : todos.length + " things due on the to-do list");
  }

  // A holiday starting today
  const { data: holidays } = await supabase.from("holidays").select("*").eq("start_date", todayISO);
  (holidays || []).forEach((h) => bits.push(h.title + " starts today"));

  if (bits.length === 0) {
    return new Response(JSON.stringify({ sent: 0, reason: "nothing on today" }), { status: 200 });
  }

  const body = bits.length <= 4 ? bits.join(", ") : bits.slice(0, 4).join(", ") + ", and " + (bits.length - 4) + " more";

  const { data: subs } = await supabase.from("push_subscriptions").select("*");
  if (!subs || subs.length === 0) {
    return new Response(JSON.stringify({ sent: 0, reason: "no subscribed devices" }), { status: 200 });
  }

  const payload = JSON.stringify({ title: "Good morning", body, url: "index.html" });
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

  return new Response(JSON.stringify({ sent, items: bits.length, staleRemoved: staleEndpoints.length }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
