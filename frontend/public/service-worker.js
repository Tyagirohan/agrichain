// AgriChain Service Worker
// Provides offline support and caching for PWA

const CACHE_NAME = 'agrichain-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/manifest.json'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[PWA] Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[PWA] Caching app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[PWA] Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[PWA] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip WebSocket requests
  if (event.request.url.startsWith('ws://') || event.request.url.startsWith('wss://')) {
    return;
  }

  // Skip API requests (let them go to network)
  if (event.request.url.includes('/api/') || event.request.url.includes('localhost:8000')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the fetched response for future use
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Network failed, show offline page
            return caches.match(OFFLINE_URL);
          });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[PWA] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[PWA] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'agrichain-notification',
    requireInteraction: false,
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'close', title: 'Close' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('AgriChain', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[PWA] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper functions
async function syncMessages() {
  try {
    // Sync pending messages when back online
    const cache = await caches.open(CACHE_NAME);
    const pendingMessages = await cache.match('/pending-messages');
    
    if (pendingMessages) {
      const messages = await pendingMessages.json();
      // Send pending messages to server
      for (const msg of messages) {
        await fetch('/chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msg)
        });
      }
      // Clear pending messages
      await cache.delete('/pending-messages');
    }
  } catch (error) {
    console.error('[PWA] Error syncing messages:', error);
  }
}

console.log('[PWA] Service Worker loaded');

