// EduFlow PWA Service Worker
// Version 1.0 - Modern caching strategies for optimal performance

const STATIC_CACHE = 'eduflow-static-v1';
const DYNAMIC_CACHE = 'eduflow-dynamic-v1';
const API_CACHE = 'eduflow-api-v1';

// Files to cache on install
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/auth/login',
  '/offline',
  '/manifest.json',
  // Add your key static assets here
];

// Install event - cache static assets
self.addEventListener('install', event => {
  // Installing service worker...

  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        // Caching static assets
        return cache.addAll(STATIC_ASSETS);
      }),
      // Skip waiting to activate immediately
      self.skipWaiting(),
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  // Activating service worker...

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return (
                cacheName !== STATIC_CACHE &&
                cacheName !== DYNAMIC_CACHE &&
                cacheName !== API_CACHE
              );
            })
            .map(cacheName => {
              // Deleting old cache
              return caches.delete(cacheName);
            })
        );
      }),
      // Take control of all pages
      self.clients.claim(),
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Route requests to appropriate strategies
  if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  } else if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// Check if request is an API call
function isApiRequest(url) {
  return (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('paystack')
  );
}

// Check if request is navigation
function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

// Check if request is for static assets
function isStaticAsset(url) {
  const staticExtensions = [
    '.js',
    '.css',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.ico',
    '.woff',
    '.woff2',
  ];
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);

  try {
    // Try network first
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful responses
      const responseClone = networkResponse.clone();

      // Only cache GET requests and successful responses
      if (request.method === 'GET') {
        await cache.put(request, responseClone);
      }

      return networkResponse;
    }

    throw new Error('Network response not ok');
  } catch {
    // Network failed for API request, trying cache

    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline response for API failures
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This feature requires an internet connection',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Handle navigation requests with cache-first strategy
async function handleNavigationRequest(request) {
  const cache = await caches.open(STATIC_CACHE);

  try {
    // Check cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Try network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache the response
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }

    throw new Error('Network response not ok');
  } catch {
    // Navigation request failed, serving offline page

    // Serve offline page
    const offlineResponse = await cache.match('/offline');
    return offlineResponse || new Response('Offline', { status: 503 });
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);

  // Check cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Failed to fetch static asset
    return new Response('Asset not available offline', { status: 503 });
  }
}

// Handle dynamic requests with stale-while-revalidate strategy
async function handleDynamicRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);

  // Serve from cache while fetching fresh content
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then(async networkResponse => {
      if (networkResponse.ok) {
        await cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => {
      // Network failed for dynamic request
      return null;
    });

  // Return cached response immediately if available
  if (cachedResponse) {
    // Update cache in background
    fetchPromise.catch(() => {
      // Ignore errors from background updates
    });
    return cachedResponse;
  }

  // Wait for network if no cache
  return (
    fetchPromise ||
    new Response('Content not available offline', { status: 503 })
  );
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  // Background sync triggered

  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Handle background sync
async function doBackgroundSync() {
  // Performing background sync

  try {
    // Sync any pending offline data
    // This is where you'd implement offline form submissions, etc.
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC',
        message: 'Background sync completed',
      });
    });
  } catch (syncError) {
    // Background sync failed
    throw syncError;
  }
}

// Push notification handling
self.addEventListener('push', event => {
  // Push notification received

  const options = {
    body: event.data ? event.data.text() : 'New notification from EduFlow',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'Open EduFlow',
        icon: '/icons/icon-72x72.png',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-72x72.png',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification('EduFlow', options));
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  // Notification click received

  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(clients.openWindow('/dashboard'));
  }
});

// Message handling for communication with main thread
self.addEventListener('message', event => {
  // Message received

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_CACHE_NAMES') {
    event.ports[0].postMessage({
      cacheNames: [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE],
    });
  }
});

// Service worker loaded and ready
