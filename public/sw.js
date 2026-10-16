// public/sw.js — Service Worker للعمل Offline
// استراتيجية: Cache First للأصول الثابتة، Network First للبيانات

const CACHE_NAME      = 'hsepro-v2';
const STATIC_CACHE    = 'hsepro-static-v2';
const DYNAMIC_CACHE   = 'hsepro-dynamic-v2';

// الأصول الأساسية التي تُكَشَّف في الـ build
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
];

// ── Install: تخزين الأصول الأساسية ───────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: حذف الكاش القديم ───────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: استراتيجية ذكية حسب نوع الطلب ─────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // تجاهل طلبات Firebase / Gemini API
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('firestore') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('generativelanguage') ||
    request.method !== 'GET'
  ) {
    return;
  }

  // الأصول الثابتة — Cache First
  if (
    url.pathname.match(/\.(js|css|png|svg|ico|woff2?|ttf)$/) ||
    url.pathname === '/' ||
    url.pathname === '/index.html'
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) => cached || fetchAndCache(request, STATIC_CACHE)
      )
    );
    return;
  }

  // باقي الطلبات — Network First مع Fallback للكاش
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || offlinePage()))
  );
});

async function fetchAndCache(request, cacheName) {
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

function offlinePage() {
  return new Response(
    `<html dir="rtl" lang="ar"><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0f172a;color:#94a3b8;text-align:center">
      <div><h2 style="color:#10b981;margin-bottom:8px">HSEPro — وضع عدم الاتصال</h2>
      <p>لا يوجد اتصال بالإنترنت حالياً.<br>ستُحفظ بياناتك وتُرفع عند استعادة الاتصال.</p></div>
    </body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

// ── Background Sync: رفع البيانات المحفوظة offline ────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  // يُنفَّذ من الـ client عبر IndexedDB — هنا فقط trigger
  const clients = await self.clients.matchAll();
  clients.forEach((client) => client.postMessage({ type: 'SYNC_REQUESTED' }));
}
