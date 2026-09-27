# Mongewell Byre — Family Hub

A small static website: calendar, shopping list, school dates and holidays with
packing lists, shared between you and your wife. Same approach as
bcinvitational.com — static HTML/CSS/JS on GitHub Pages, with Supabase behind
it for the shared data and sign-in.

## 1. Create a Supabase project (free)

1. Go to supabase.com, sign up, and create a new project. Any region close to
   the UK is fine. Pick a database password and keep it somewhere safe (you
   won't need it day to day).
2. Once the project is ready, open the SQL Editor and paste in the contents
   of `schema.sql` from this folder, then run it. This creates the five
   tables the site needs and turns on realtime sync.
3. Go to Authentication -> Sign In / Providers and make sure Email is
   enabled. Under Authentication -> URL Configuration, set the Site URL to
   where you'll host this (see step 3 below) once you know it — you can
   come back and update this later.
4. Go to Project Settings -> API. You'll need the "Project URL" and the
   "anon public" key.

## 2. Add your keys

Open `config.js` and replace the two placeholder values with the
Project URL and anon key from the step above. This file is safe to be
public — the anon key is designed to be used from the browser, and the
row-level security rules in `schema.sql` are what actually control access.

## 3. Put it on GitHub Pages

1. Create a new GitHub repository (public or private, both work with Pages
   on a personal account) and push everything in this folder to it.
2. In the repo's Settings -> Pages, set the source to the main branch,
   root folder.
3. GitHub will give you a URL like `https://yourname.github.io/family-hub/`.
   Go back to Supabase's Authentication -> URL Configuration and set that as
   the Site URL, so sign-in links work.

## 4. Try it

Open the site, tap Sign in in the top corner, enter your email, and follow
the link that arrives. Do the same on your wife's phone with her email.
Once signed in, everything either of you adds — events, shopping items,
school dates, holidays, packing items — appears for the other in real time.

## What's here

- `index.html` — home dashboard: today's events, today's clubs, birthdays
  and anniversaries in the next month, shopping snapshot, next school
  date, next holiday countdown
- `calendar.html` — full calendar with category filters, including
  birthdays and anniversaries as yearly-recurring entries with an optional
  reminder (used once push notifications are wired up — see below)
- `shopping.html` — shared shopping list, tagged by where you buy each
  thing (general / Sainsbury's / Gousto / Amazon), plus a meal ideas
  section: save a dish with its ingredients once, then "Add to list"
  drops every ingredient onto the shopping list in one tap
- `clubs.html` — recurring weekly clubs (swimming, gymnastics, etc) with
  who it's for, address and timings, grouped by day
- `school.html` — term dates and school events
- `holidays.html` — trips with countdowns and a packing list per trip
- `schema.sql` — run once in Supabase
- `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png` — makes the site
  installable as a PWA (add to home screen, opens full screen like an app)
- `style.css`, `db.js`, `layout.js`, `icons.js`, `config.js` — shared styles,
  the icon set, the Supabase client, and the header/nav. Everything sits
  flat at the repo root, no subfolders, since that's the most reliable way
  to upload from a phone

## On Sainsbury's, Gousto and Amazon

None of the three publish a real API for a personal account's basket,
orders or delivery slots. What exists for Sainsbury's and Gousto is
unofficial scraping tooling built by third parties, which sits outside
their terms of service and isn't something worth building a family tool
on top of — it'll break without warning and isn't really yours to rely on.

So for now the shopping list just tags each item by where you'll buy it,
which is enough to glance at "what needs a Sainsbury's shop this week" vs
"what's an Amazon job", and Amazon items get a one-tap link straight to
an Amazon search for that item. If Sainsbury's or Gousto ever publish a
real partner API this could plug in properly, but nothing today makes
that reliable.

## Push notifications and the Sunday week-ahead image

This isn't built yet, on purpose: it needs two extra accounts before any
code is worth writing, so say the word once you've got them and I'll wire
it up in the same style as bcinvitational.com's push flow.

1. A Firebase project (free) for Firebase Cloud Messaging, the same as
   BCI uses — gives you a VAPID key pair for web push.
2. A Supabase Edge Function on a schedule (`pg_cron`), one job that runs
   daily and checks for birthdays/anniversaries whose reminder falls
   today, and a second that runs Sunday morning for the week-ahead image.
3. For the image itself, the reliable route is rendering the week's
   events to an actual PNG via a headless-rendering service (rather than
   trying to draw one inside the Edge Function, which is fiddly and
   fragile in that environment) — something like screenshotone.com or
   htmlcsstoimage.com, both with a workable free tier.

The site, manifest and service worker are already set up to receive and
show these once that backend exists — `sw.js` has the push handler
ready and waiting.

## Natural next steps

- A custom domain instead of the github.io address, whenever you want one
- The push notifications and weekly look-ahead image above
- Splitting "clubs" further if term-time and holiday-time schedules
  genuinely differ
