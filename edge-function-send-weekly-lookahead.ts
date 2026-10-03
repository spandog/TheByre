// Supabase Edge Function: send-weekly-lookahead
//
// Deploy the same way as the others: Edge Functions -> Deploy a new
// function -> Via Editor -> name it exactly send-weekly-lookahead -> paste
// this in -> deploy. Reuses the same VAPID secrets as send-birthday-reminders.
//
// Looks at the 7 days starting tomorrow (so running it Sunday evening
// covers Monday through Sunday) and sends one push summarising the week.

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
  const start = new Date(today); start.setDate(start.getDate() + 1);
  const end = new Date(today); end.setDate(end.getDate() + 7);
  const iso = (d: Date) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const startISO = iso(start), endISO = iso(end);

  function occursOn(date: Date, dow: number, frequency: string, anchor: string | null): boolean {
    if (date.getDay() !== dow) return false;
    if (frequency !== "fortnightly" || !anchor) return true;
    const anchorDate = new Date(anchor + "T00:00:00");
    const weeks = Math.round((date.getTime() - anchorDate.getTime()) / (7 * 86400000));
    return ((weeks % 2) + 2) % 2 === 0;
  }

  const bits: string[] = [];

  // One-off calendar events in the window
  const { data: events } = await supabase.from("events").select("*").eq("recurring", false).gte("date", startISO).lte("date", endISO);
  (events || []).sort((a, b) => a.date.localeCompare(b.date)).forEach((e) => {
    const d = new Date(e.date + "T00:00:00");
    bits.push(e.title + " (" + DAY_ABBR[d.getDay()] + ")");
  });

  // Recurring birthdays/anniversaries landing in the window this year
  const { data: recEvents } = await supabase.from("events").select("*").eq("recurring", true);
  (recEvents || []).forEach((e) => {
    const orig = new Date(e.date + "T00:00:00");
    let occ = new Date(today.getFullYear(), orig.getMonth(), orig.getDate());
    if (iso(occ) < iso(today)) occ = new Date(today.getFullYear() + 1, orig.getMonth(), orig.getDate());
    if (iso(occ) >= startISO && iso(occ) <= endISO) bits.push(e.title + " (" + DAY_ABBR[occ.getDay()] + ")");
  });

  // Clubs and bins, day by day across the window
  const { data: clubs } = await supabase.from("clubs").select("*");
  const { data: bins } = await supabase.from("bin_reminders").select("*");
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayAbbr = DAY_ABBR[d.getDay()];
    (clubs || []).filter((c) => c.day_of_week === d.getDay()).forEach((c) => bits.push(c.name + " (" + dayAbbr + ")"));
    (bins || []).filter((b) => occursOn(d, b.day_of_week, b.frequency, b.anchor_date)).forEach((b) => bits.push(b.name + " bin (" + dayAbbr + ")"));
  }

  // School events in the window
  const { data: school } = await supabase.from("school_dates").select("*").gte("date", startISO).lte("date", endISO);
  (school || []).forEach((s) => {
    const d = new Date(s.date + "T00:00:00");
    bits.push(s.title + " (" + DAY_ABBR[d.getDay()] + ")");
  });

  // To-dos due in the window
  const { data: todos } = await supabase.from("todo_items").select("*").eq("checked", false).gte("due_date", startISO).lte("due_date", endISO);
  if (todos && todos.length) bits.push(todos.length + (todos.length === 1 ? " thing due" : " things due"));

  // A holiday starting in the window
  const { data: holidays } = await supabase.from("holidays").select("*").gte("start_date", startISO).lte("start_date", endISO);
  (holidays || []).forEach((h) => bits.push(h.title + " begins"));

  if (bits.length === 0) {
    return new Response(JSON.stringify({ sent: 0, reason: "nothing in the week ahead" }), { status: 200 });
  }

  const body = bits.length <= 6 ? bits.join(", ") : bits.slice(0, 6).join(", ") + ", and " + (bits.length - 6) + " more";

  const { data: subs } = await supabase.from("push_subscriptions").select("*");
  if (!subs || subs.length === 0) {
    return new Response(JSON.stringify({ sent: 0, reason: "no subscribed devices" }), { status: 200 });
  }

  const payload = JSON.stringify({ title: "The week ahead", body, url: "calendar.html" });
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
