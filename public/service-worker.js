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
  '/styles-*.css',
  '/main-*.js',
  '/polyfills-*.js',
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
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((err) => {
      });
    })
  );
  self.skipWaiting();
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== RUNTIME_CACHE && 
              cacheName !== API_CACHE) {
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
        return response || fetch(request).then((response) => {
          // Cache successful navigations
          if (response.status === 200) {
            const cache = caches.open(RUNTIME_CACHE);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
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
      return response || fetch(request).then((response) => {
        // Cache successful responses
        if (response.status === 200 && response.type !== 'error') {
          const cache = caches.open(RUNTIME_CACHE);
          cache.then((c) => c.put(request, response.clone()));
        }
        return response;
      }).catch((error) => {
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

  // NEVER cache chat endpoints - they have dynamic content
  if (pathname.includes('/chat/') || pathname.includes('/chatbot/')) {
    console.log('🚀 Skipping cache for chat endpoint:', pathname);
    return fetch(request).catch(() => {
      return new Response('Offline - Chat unavailable', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
      });
    });
  }

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
            const clonedForCache = networkResponse.clone();
            cache.put(request, clonedForCache).catch((cacheError) => {
              console.error('Failed to cache response:', cacheError);
            });
          }
          return networkResponse;
        })
        .catch((error) => {
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
    .then((response) => {
      if (response.status === 200) {
        // Clone response ONCE before doing anything else
        const clonedForCache = response.clone();
        
        // Cache successful response in background (don't block)
        caches.open(API_CACHE).then((cache) => {
          cache.put(request, clonedForCache).catch((cacheError) => {
            console.error('Failed to cache response:', cacheError);
          });
        }).catch((cacheError) => {
          console.error('Failed to open cache:', cacheError);
        });
      }
      return response;
    })
    .catch(() => {
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
    return cache.match(request).then((response) => {
      // Revalidate in background
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      });

      return response || fetchPromise;
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
    });
  }
});

