// Bump this on every deploy so returning visitors pick up new files
// (same convention as bcinvitational.com's sw.js).
const CACHE_NAME = 'family-hub-v1';

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
// Not wired up yet: this fires once you add Firebase Cloud Messaging and a
// server-side sender (see README's "Push notifications" section). FCM sends
// "data"-type messages nested one level deeper than a plain payload, same
// as on bcinvitational.com, so unwrap it the same way here.
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    return;
  }
  const data = payload.data || payload;
  const title = data.title || 'Family Hub';
  const options = {
    body: data.body || '',
    icon: 'icon-192.png',
    image: data.image || undefined,
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
