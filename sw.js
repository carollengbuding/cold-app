// Service Worker for 冷不丁就厉害了 (v17)
const CACHE = 'cold-app-v17';

// 预缓存清单：核心文件。图标走网络，不预缓存（避免安装时图标被污染成截图）
const PRECACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/data.js',
  './manifest.json'
];

// 单个资源缓存，失败不影响整体安装
async function cacheOne(cache, url) {
  try {
    const resp = await fetch(url, { cache: 'reload' });
    if (resp && resp.ok) await cache.put(url, resp);
  } catch (e) { /* 忽略单个失败 */ }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(PRECACHE.map(u => cacheOne(cache, u)));
  })());
  self.skipWaiting(); // 立即激活新版本，避免旧 SW 卡住
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // 图标与 manifest：直接走网络，绝不经过 SW 缓存
  // 这样安装/添加到桌面时拿到的永远是真实熊图，不会退化成网页截图
  if (url.pathname.includes('app-icon') || url.pathname.endsWith('manifest.json')) {
    return;
  }

  // 导航请求：网络优先，失败回退缓存首页
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('./index.html')));
    return;
  }

  // 其余静态资源：网络优先，失败回退缓存（绝不返回 HTML）
  event.respondWith((async () => {
    try {
      const resp = await fetch(event.request);
      if (resp && resp.ok && resp.type !== 'opaqueredirect') {
        const clone = resp.clone();
        const cache = await caches.open(CACHE);
        cache.put(event.request, clone).catch(() => {});
      }
      return resp;
    } catch (e) {
      const cached = await caches.match(event.request);
      return cached || Response.error();
    }
  })());
});
