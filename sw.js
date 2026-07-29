// Service Worker for 冷不丁就厉害了
const CACHE = 'cold-app-v14';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/data.js',
  './manifest.json',
  './assets/app-icon.jpg',
  './assets/app-icon.png',
  './assets/app-icon-180.png',
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
  const url = new URL(e.request.url);
  // 导航请求：优先网络，离线才回退 index.html
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('./index.html')));
    return;
  }
  // 资源/图标：网络优先，失败再回退缓存；【绝不返回 HTML】
  // 这样 iOS 取 apple-touch-icon 时永远拿到真实图片，不会退化成网页截图
  e.respondWith(
    fetch(e.request).then(resp => {
      if (resp.ok && resp.type !== 'opaqueredirect') {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return resp;
    }).catch(() => caches.match(e.request))
  );
});
