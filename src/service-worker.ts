/**
 * IT Help Desk PWA Service Worker
 * Handles caching, offline support, and service worker lifecycle
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `ithelp-desk-${CACHE_VERSION}`;
const RUNTIME_CACHE = `ithelp-desk-runtime-${CACHE_VERSION}`;
const API_CACHE = `ithelp-desk-api-${CACHE_VERSION}`;

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

// Cache strategies
const CACHE_FIRST = 'cache-first';
const NETWORK_FIRST = 'network-first';
const STALE_WHILE_REVALIDATE = 'stale-while-revalidate';

// API endpoint caching configuration
const apiCacheConfig = {
  '/api/assets/': { strategy: CACHE_FIRST, maxAge: 3600000, maxSize: 20 },
  '/api/asset/': { strategy: CACHE_FIRST, maxAge: 3600000, maxSize: 20 },
  '/api/tickets/': { strategy: CACHE_FIRST, maxAge: 1800000, maxSize: 50 },
  '/api/ticket/': { strategy: CACHE_FIRST, maxAge: 1800000, maxSize: 50 },
  '/api/employees/': { strategy: CACHE_FIRST, maxAge: 86400000, maxSize: 30 },
  '/api/employee/': { strategy: CACHE_FIRST, maxAge: 86400000, maxSize: 30 },
  '/api/dashboard/': { strategy: NETWORK_FIRST, maxAge: 600000, maxSize: 5 },
};

/**
 * Install event - cache essential files
 */
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching app shell');
      return cache.addAll(urlsToCache).catch((err) => {
        console.warn('Some files could not be cached:', err);
      });
    })
  );
  self.skipWaiting();
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== RUNTIME_CACHE && 
              cacheName !== API_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    return event.respondWith(handleApiRequest(request));
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request).then((fetchResponse) => {
          // Clone before using to avoid "body already used" errors
          if (fetchResponse.status === 200) {
            try {
              const responseClone = fetchResponse.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            } catch (e) {
              console.warn('Failed to cache response:', e);
            }
          }
          return fetchResponse;
        }).catch(() => {
          // Return index.html as fallback for failed navigation
          return caches.match('/index.html');
        });
      })
    );
    return;
  }

  // Handle other requests with cache-first strategy
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }
      
      return fetch(request).then((fetchResponse) => {
        // Clone before using to avoid "body already used" errors
        if (fetchResponse.status === 200 && fetchResponse.type !== 'error') {
          try {
            const responseClone = fetchResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          } catch (e) {
            console.warn('Failed to cache response:', e);
          }
        }
        return fetchResponse;
      }).catch((error) => {
        console.error('Fetch failed:', error);
        // Return a custom offline page or response
        return new Response('Offline - Resource not available', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain',
          }),
        });
      });
    })
  );
});

/**
 * Handle API requests with configured caching strategies
 */
function handleApiRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Find matching cache config
  let config = null;
  for (const [pattern, cfg] of Object.entries(apiCacheConfig)) {
    if (pathname.includes(pattern)) {
      config = cfg;
      break;
    }
  }

  // Use default network-first if no config matches
  if (!config) {
    config = { strategy: NETWORK_FIRST, maxAge: 300000 };
  }

  if (config.strategy === CACHE_FIRST) {
    return cacheThenNetwork(request, config);
  } else if (config.strategy === NETWORK_FIRST) {
    return networkThenCache(request, config);
  } else {
    return staleWhileRevalidate(request, config);
  }
}

/**
 * Cache-first strategy: try cache first, fallback to network
 */
function cacheThenNetwork(request, config) {
  return caches.open(API_CACHE).then((cache) => {
    return cache.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // Fetch from network
      return fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            // Clone BEFORE returning to avoid body consumption
            const responseClone = networkResponse.clone();
            cache.put(request, responseClone).catch((e) => {
              console.warn('Failed to cache response:', e);
            });
          }
          return networkResponse;
        })
        .catch((error) => {
          console.error('Fetch failed:', error);
          return cachedResponse || new Response(JSON.stringify({ 
            error: 'Offline - Data not available' 
          }), {
            status: 503,
            headers: new Headers({ 'Content-Type': 'application/json' }),
          });
        });
    });
  });
}

/**
 * Network-first strategy: try network first, fallback to cache
 */
function networkThenCache(request, config) {
  return fetch(request)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        // Clone BEFORE returning to avoid body consumption
        const responseClone = networkResponse.clone();
        caches.open(API_CACHE).then((cache) => {
          cache.put(request, responseClone).catch((e) => {
            console.warn('Failed to cache response:', e);
          });
        });
      }
      return networkResponse;
    })
    .catch((error) => {
      console.error('Network request failed:', error);
      // Try cache on network failure
      return caches.open(API_CACHE).then((cache) => {
        return cache.match(request) || new Response(JSON.stringify({ 
          error: 'Offline - Data not available' 
        }), {
          status: 503,
          headers: new Headers({ 'Content-Type': 'application/json' }),
        });
      });
    });
}

/**
 * Stale-while-revalidate strategy
 */
function staleWhileRevalidate(request, config) {
  return caches.open(API_CACHE).then((cache) => {
    return cache.match(request).then((cachedResponse) => {
      // Start fetching in background
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            // Clone BEFORE caching to avoid body consumption
            const responseClone = networkResponse.clone();
            cache.put(request, responseClone).catch((e) => {
              console.warn('Failed to update cached response:', e);
            });
          }
          return networkResponse;
        })
        .catch((error) => {
          console.error('Background fetch failed:', error);
          // Return cached response if network fails
          return cachedResponse;
        });

      // Return cached immediately if available, otherwise wait for network
      return cachedResponse || fetchPromise;
    });
  });
}

/**
 * Message event - handle messages from clients
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).catch((e) => {
      console.warn('Failed to clear caches:', e);
    });
  }
});

console.log('✓ Service Worker loaded');
