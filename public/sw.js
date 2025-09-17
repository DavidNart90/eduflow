// EduFlow PWA Service Worker
// Version 2.2 - Auto-updating cache management for seamless updates

// Dynamic cache versioning based on build time
const CACHE_VERSION = Date.now().toString();
const STATIC_CACHE = `eduflow-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `eduflow-dynamic-v${CACHE_VERSION}`;
const API_CACHE = `eduflow-api-v${CACHE_VERSION}`;

// Files to cache on install
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/auth/login',
  '/offline',
  '/manifest.json',
  // Add your key static assets here
];

// Install event - cache static assets and force immediate activation
self.addEventListener('install', event => {
  // eslint-disable-next-line no-console
  console.log(`SW installing: ${CACHE_VERSION}`);

  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        // eslint-disable-next-line no-console
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Force immediate activation to replace old service worker
      self.skipWaiting(),
    ])
  );
});

// Activate event - clean up old caches and take immediate control
self.addEventListener('activate', event => {
  // eslint-disable-next-line no-console
  console.log(`SW activating: ${CACHE_VERSION}`);

  event.waitUntil(
    Promise.all([
      // Clean up ALL old caches aggressively
      caches.keys().then(cacheNames => {
        const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];
        const cachesToDelete = cacheNames.filter(cacheName => {
          // Delete any cache that doesn't match current version
          return (
            !currentCaches.includes(cacheName) &&
            cacheName.startsWith('eduflow-')
          );
        });

        // eslint-disable-next-line no-console
        console.log('Deleting old caches:', cachesToDelete);
        return Promise.all(
          cachesToDelete.map(cacheName => caches.delete(cacheName))
        );
      }),
      // Take immediate control of all clients (force reload)
      self.clients.claim().then(() => {
        // eslint-disable-next-line no-console
        console.log('SW claimed all clients');
        // Notify all clients about the update
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SW_UPDATED',
              version: CACHE_VERSION,
              message: 'Service Worker updated successfully',
            });
          });
        });
      }),
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

// Handle API requests with network-first strategy (with performance optimization)
async function handleApiRequest(request) {
  // Skip caching for POST/PUT/DELETE requests
  if (request.method !== 'GET') {
    try {
      return await fetch(request);
    } catch {
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

  const cache = await caches.open(API_CACHE);

  try {
    // Try network first with timeout
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Network timeout')), 5000)
      ),
    ]);

    if (networkResponse.ok) {
      // Only cache successful GET responses
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
      return networkResponse;
    }

    throw new Error('Network response not ok');
  } catch {
    // Network failed for API request, trying cache
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

// Handle navigation requests with network-first strategy for better updates
async function handleNavigationRequest(request) {
  const cache = await caches.open(STATIC_CACHE);

  try {
    // Try network first to get fresh content
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Network timeout')), 3000)
      ),
    ]);

    if (networkResponse.ok) {
      // Cache the fresh response
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }

    throw new Error('Network response not ok');
  } catch {
    // eslint-disable-next-line no-console
    console.log('Network failed for navigation, trying cache');

    // Network failed, check cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

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
