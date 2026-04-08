// MediBot AI - Service Worker for Offline Support
importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

const CACHE_NAME = 'medibot-ai-v1';
const offlineFallbackPage = '/offline.html';

// Activate immediately when updated
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Install & cache key files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([
        offlineFallbackPage,
        '/',
        '/index.html',
        '/icons/logo-192.png',
        '/icons/logo-512.png'
      ])
    )
  );
});

// Enable navigation preload
if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

// Serve navigation requests with network-first strategy + offline fallback
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preloadResponse = await event.preloadResponse;
        if (preloadResponse) return preloadResponse;
        return await fetch(event.request);
      } catch (error) {
        const cache = await caches.open(CACHE_NAME);
        return await cache.match(offlineFallbackPage);
      }
    })());
  }
});

// Cache CSS, JS, and images
workbox.routing.registerRoute(
  ({request}) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'medibot-static-cache',
  })
);
