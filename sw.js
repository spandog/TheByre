// Bump this on every deploy so returning visitors pick up new files
// (same convention as bcinvitational.com's sw.js).
const CACHE_NAME = 'family-hub-v3';

const SHELL_FILES = [
  'index.html',
  'calendar.html',
  'shopping.html',
  'clubs.html',
  'school.html',
  'holidays.html',
  'style.css',
  'db.js',
  'layout.js',
  'push.js',
  'manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network first for Supabase API calls (always want live data);
  // cache-first for the app shell so it still opens offline.
  if (event.request.url.includes('supabase.co')) return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

// --- Push notifications ---
// Standard Web Push (VAPID) — sent by the send-birthday-reminders Supabase
// Edge Function via the web-push library, as a plain JSON payload:
// { "title": "...", "body": "...", "url": "index.html" }
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data;
  try {
    data = event.data.json();
  } catch (e) {
    return;
  }
  const title = data.title || 'Family Hub';
  const options = {
    body: data.body || '',
    icon: 'icon-192.png',
    data: { url: data.url || 'index.html' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || 'index.html';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.endsWith(url) && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
