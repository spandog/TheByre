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
- `todo.html` — a shared to-do list, with an optional due date per item
  (skip it in the prompt if it's not needed) — items due within a week
  surface on the home dashboard
- `bins.html` — which bin goes out and when, weekly or fortnightly
- `contacts.html` — GP, school office, emergency numbers, grouped by
  whatever category you give each one, with one-tap calling
- `more.html` — the "More" tab: links to Clubs, School, Holidays, Bins
  and Contacts, since the bottom bar only fits five tabs
- `school.html` — term dates and school events

Calendar events and to-do items can also be tagged with who they're for
(a plain name, in the same "Who's this for" field in each one's add/edit
sheet) — once two or more names are in use, a filter row appears on that
page automatically.
- `holidays.html` — trips with countdowns and a packing list per trip
- `schema.sql` — run once in Supabase. `add-push-subscriptions.sql`,
  `add-todo-items.sql` and `add-bins-contacts-child-tags.sql` are small
  incremental additions to it, for whenever those features were set up
  after the initial run
- `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png` — makes the site
  installable as a PWA (add to home screen, opens full screen like an app)
- `style.css`, `db.js`, `layout.js`, `icons.js`, `config.js`, `push.js` —
  shared styles, the icon set, the Supabase client, the header/nav, and
  push notification subscription. Everything sits flat at the repo root,
  no subfolders, since that's the most reliable way to upload from a phone
- `edge-function-send-birthday-reminders.ts`, `schedule-reminders.sql` —
  not part of the website itself; paste these into Supabase as described
  under Push notifications below

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

## Push notifications (birthdays and anniversaries)

Built and ready to switch on. It uses standard Web Push (VAPID) rather than
Firebase — one less account to create, and it works the same way in every
browser. Here's what's involved and how to finish setting it up:

1. **Add the new table.** In the SQL Editor, run `add-push-subscriptions.sql`
   (schema.sql itself is unchanged apart from this, no need to re-run it).
2. **Deploy the Edge Function.** In the Supabase Dashboard, go to Edge
   Functions -> Deploy a new function -> Via Editor. Name it exactly
   `send-birthday-reminders`, paste in the contents of
   `edge-function-send-birthday-reminders.ts`, and deploy.
3. **Set its secrets.** Still on that function, add three secrets:
   - `VAPID_PUBLIC_KEY`: `BPLXQX7H-5xgFMGoRGHAEDm57LvjLnxaXl745PI9hehEdAOb-3W3JrCOtGIuGXUwfCsQe9o25GpKykBiMGGCgTo`
     (same value already in `config.js`)
   - `VAPID_PRIVATE_KEY`: `NZ47IwLj4oOqjd4iod3CBrQY68SkY8IexmRGaXaWMxk`
     (keep this one private — don't put it in the site's own files)
   - `VAPID_SUBJECT`: `mailto:` followed by whichever email address you're
     happy to have attached to the push messages
4. **Schedule it.** In the SQL Editor, run `schedule-reminders.sql`. It
   sets up a daily cron job (7am UTC by default) that calls the function.
5. **Turn on notifications on each phone.** Once signed in on the live
   site, an "Enable notifications" button appears next to your email in
   the header. Tap it on both your phone and your wife's, and allow the
   browser's permission prompt.

That's it from there: any birthday or anniversary with a reminder set (in
the calendar's add/edit sheet) will trigger a push on whichever day you
chose, on every device that's turned notifications on.

The Sunday week-ahead image isn't built yet — it needs one more decision,
which headless-rendering service to use for turning the week's events into
an actual picture (screenshotone.com and htmlcsstoimage.com both have a
workable free tier), since generating an image inside the Edge Function
itself is fragile. Worth doing once the birthday reminders above are
confirmed working on both your phones.

## Natural next steps

- A custom domain instead of the github.io address, whenever you want one
- The Sunday week-ahead image, once you've picked a rendering service
- Splitting "clubs" further if term-time and holiday-time schedules
  genuinely differ
