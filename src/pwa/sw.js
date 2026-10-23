/* Only this public fallback is cached. No app HTML, API responses or user data. */
const CACHE_PREFIX = 'pennywings-offline-'
const CACHE_NAME = CACHE_PREFIX + '__OFFLINE_VERSION__'
const OFFLINE_URL = '/offline.html'

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add(new Request(OFFLINE_URL, { cache: 'reload' }))))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)))))
  // Normal activation waits for open app windows to close; never reload a draft.
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET' || request.mode !== 'navigate' || new URL(request.url).origin !== self.location.origin) return
  event.respondWith(fetch(request).catch(async () => {
    const fallback = await caches.open(CACHE_NAME).then((cache) => cache.match(OFFLINE_URL))
    return fallback ?? new Response('Connection unavailable. Reconnect and reload this page.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }))
})
