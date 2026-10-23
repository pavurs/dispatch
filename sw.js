// Service worker: приложение открывается без интернета и быстро стартует.
const VERSION = 'dm-5167e732';
const SHELL = [
  './', 'index.html', 'styles.css', 'app.js', 'config.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png',
];
const LIB_HOSTS = ['cdn.jsdelivr.net', 'unpkg.com', 'cdnjs.cloudflare.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== 'dm-libs').map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Библиотеки с CDN: из кэша, если уже скачаны
  if (LIB_HOSTS.includes(url.hostname)) {
    e.respondWith(caches.open('dm-libs').then(async (c) => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    }));
    return;
  }

  // Файлы самого приложения: сначала сеть (чтобы приходили обновления), без сети — кэш
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))
    );
  }
  // Остальное (Supabase, карта, геокодер) — напрямую в сеть
});

// Нажатие на уведомление «уехал без отметки» — открыть диспетчерскую
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    const w = list.find((c) => 'focus' in c);
    return w ? w.focus() : self.clients.openWindow('./');
  }));
});

// Уведомление с сервера (функция alert-push) — показать, даже если диспетчерская закрыта
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Диспетчерская', {
    body: d.body || '', tag: d.tag || undefined, renotify: true, requireInteraction: true,
    icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', vibrate: [200, 100, 200], data: { url: d.url || './' },
  }));
});
