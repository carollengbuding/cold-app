// Service Worker for 冷不丁就厉害了
const CACHE = 'cold-app-v10';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/data.js',
  './manifest.json',
  './assets/app-icon.jpg',
  './assets/app-icon.png',
  './assets/app-icon-192.png',
  './assets/app-icon-maskable.png',
  './assets/reward.jpg',
  './assets/penalty.jpg',
  './assets/task-1.jpg',
  './assets/task-2.jpg',
  './assets/task-3.jpg',
  './assets/task-4.jpg',
  './assets/task-5.jpg',
  './assets/task-6.jpg',
  './assets/task-7.jpg',
  './assets/task-8.jpg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
      if (resp.ok) {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return resp;
    }).catch(() => caches.match('./index.html')))
  );
});
