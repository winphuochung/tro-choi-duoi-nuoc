/* ============================================================
   Service Worker - Chiến lược Stale-While-Revalidate (SWR)
   PWA Offline 100% cho nền tảng trò chơi giáo dục
   ============================================================ */
'use strict';

const CACHE_NAME = 'duoi-nuoc-v2';
const PRECACHE_URLS = [
  './index.html',
  './manifest.json',
  './icon.svg',
  './games/index.html',
  './games/13_mn_phong_tranh_duoi_nuoc/index.html',
  './games/13_mn_phong_tranh_duoi_nuoc/game_01_Bat_dau.html',
  './games/13_mn_phong_tranh_duoi_nuoc/img/q1_be_boi.webp',
  './games/13_mn_phong_tranh_duoi_nuoc/img/q2_aophao.jpg',
  './games/13_mn_phong_tranh_duoi_nuoc/img/q3_camta.jpg',
  './games/13_mn_phong_tranh_duoi_nuoc/img/q4_chautam.webp',
  './games/13_mn_phong_tranh_duoi_nuoc/img/q5_cuu.jpg',
  './games/13_mn_phong_tranh_duoi_nuoc/img/q6_camta.jpg',
  './games/13_mn_phong_tranh_duoi_nuoc/img/q7_khoi_dong.jpg',
  './games/13_mn_phong_tranh_duoi_nuoc/img/q8_noi_nua.png',
  './games/13_mn_phong_tranh_duoi_nuoc/img/q9_lu.webp',
  './games/13_mn_phong_tranh_duoi_nuoc/img/q10_cu_ho.jpg'
];

const RUNTIME_CACHE = 'duoi-nuoc-runtime';

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE_URLS).catch(function (err) {
        console.warn('[SW] Precache một phần (lỗi cho phép khi offline):', err.message);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) {
          return k !== CACHE_NAME && k !== RUNTIME_CACHE;
        }).map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

/* ---------- HTTP Request (nội dung tĩnh / mạng) ---------- */
self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  var isSameOrigin = url.origin === self.location.origin;
  // Chỉ xử lý request http(s) cùng origin hoặc tài nguyên tĩnh an toàn
  if (!isSameOrigin && !/^https?:$/.test(url.protocol)) return;

  event.respondWith(swResponse(req));
});

/* Stale-While-Revalidate: trả cache cũ trước, fetch sau, cập nhật cache */
function swResponse(request) {
  return caches.open(RUNTIME_CACHE).then(function (cache) {
    var isHTML = /\.[hH][tT][mM][lL]?(\?|#|$)/.test(request.url);
    if (isHTML) {
      // HTML: Network-first (always get latest code; cache only as offline fallback)
      return fetch(request).then(function (res) {
        if (res && res.ok) cache.put(request, res.clone());
        return res;
      }).catch(function () {
        return cache.match(request).then(function (c) { return c || Response.error(); });
      });
    }
    // Assets: Stale-While-Revalidate (fast, still updates in background)
    return cache.match(request).then(function (cached) {
      var network = fetch(request).then(function (res) {
        if (res && res.ok) cache.put(request, res.clone());
        return res;
      }).catch(function () {
        return cached || Response.error();
      });
      return cached || network;
    });
  });
}
