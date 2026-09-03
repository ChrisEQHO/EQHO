/*
 * EQHO Player — service-worker KILL-SWITCH.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The app's earlier PWA/mobile era registered a real service worker at
 * `/sw.js`. That worker used a cache-first strategy and, on returning
 * browsers, keeps serving the OLD, genuinely-broken JS chunks — which throws
 * a minified React error #310 ("Rendered more hooks than during the previous
 * render") even though the current deployed source is provably clean. Because
 * the current app no longer ships a service worker, nothing ever takes over to
 * evict that stale worker, so affected users stay broken forever.
 *
 * A browser with the old worker registered re-checks `/sw.js` on navigation.
 * Serving THIS file at that path lets the browser install a replacement whose
 * only job is to erase every cache, unregister itself, and reload open tabs so
 * they fetch the current, correct bundles directly from the network. After it
 * runs once, no service worker remains registered for this origin.
 *
 * DO NOT turn this back into a caching service worker. The app intentionally
 * ships no SW; this file must stay a pure self-destruct.
 */

self.addEventListener('install', () => {
  // Take over immediately instead of waiting for existing tabs to close.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // 1. Delete every Cache Storage entry the old worker created.
      try {
        const keys = await caches.keys()
        await Promise.all(keys.map((key) => caches.delete(key)))
      } catch (e) {
        // Best-effort: continue to unregister even if cache eviction fails.
      }

      // 2. Unregister this worker so the origin is SW-free afterwards.
      try {
        await self.registration.unregister()
      } catch (e) {}

      // 3. Force every controlled tab to reload from the network, picking up
      //    the current, correct chunks with no stale worker in the way.
      try {
        const clients = await self.clients.matchAll({ type: 'window' })
        for (const client of clients) {
          client.navigate(client.url)
        }
      } catch (e) {}
    })()
  )
})

// Never intercept fetches. If a request reaches this handler, always go to the
// network — no cache lookups, so no stale bundle can ever be served again.
self.addEventListener('fetch', () => {})
