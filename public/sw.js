/* ==========================================================================
   FMV Erenköy Işık Lisesi ve Fen Lisesi | Sürdürülebilirlik Portalı
   Gelişmiş PWA Servis Çalışanı (Service Worker) - Unlimited Cache Edition
   ========================================================================== */

const CACHE_VERSION = 'erenkoy-isik-sdg-pwa-v1';
const STATIC_CACHE_NAME = `static-${CACHE_VERSION}`;
const FONT_CACHE_NAME = `fonts-${CACHE_VERSION}`;
const RUNTIME_CACHE_NAME = `runtime-${CACHE_VERSION}`;

// Kurumsal Temel Varlıklar (Önceden Önbelleğe Alınacak)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/logo.png',
  '/favicon.svg',
  '/pwa-192.png',
  '/pwa-512.png',
  '/pwa-maskable.png'
];

// 1. KURULUM AŞAMASI (INSTALL)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      // Temel varlıkları önbelleğe al
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Precache partial warning:', err);
      });
    }).then(() => {
      // Beklemeden derhal aktifleş (Anında PWA geçişi)
      return self.skipWaiting();
    })
  );
});

// 2. AKTİVASYON AŞAMASI (ACTIVATE)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (
            key !== STATIC_CACHE_NAME && 
            key !== FONT_CACHE_NAME && 
            key !== RUNTIME_CACHE_NAME
          ) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      // Açık olan tüm sekmeleri ve pencereleri derhal devral
      return self.clients.claim();
    })
  );
});

// 3. AĞ İSTEKLERİNİ YÖNETME (FETCH STRATEGIES)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Yalnızca HTTP / HTTPS ve GET isteklerini önbellekle
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Firebase Auth ve Firestore API istekleri:
  // Firestore kendi sınırsız IndexedDB kalıcı önbelleğine (persistentLocalCache) sahip olduğu için
  // bu istekler doğrudan ağa bırakılır, çakışma ve gecikme önlenir.
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com/v1')
  ) {
    return;
  }

  // A. Google Fonts Yazı Tipleri (Cache-First)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONT_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          return cachedResponse || Response.error();
        }
      })
    );
    return;
  }

  // B. Navigasyon İstekleri (Sayfa Açılışı / HTML): Network-First, Çevrimdışıysa Cache Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const cloned = networkResponse.clone();
          caches.open(STATIC_CACHE_NAME).then((cache) => cache.put(request, cloned));
        }
        return networkResponse;
      }).catch(async () => {
        // Çevrimdışı mod: Önbellekteki index.html'i sun
        const cached = await caches.match(request);
        if (cached) return cached;
        const fallback = await caches.match('/index.html');
        return fallback || Response.error();
      })
    );
    return;
  }

  // C. Statik Kod ve Medya Paketleri (JS, CSS, PNG, SVG, vb.): Stale-While-Revalidate
  const isStaticAsset = 
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.ico');

  if (isStaticAsset) {
    event.respondWith(
      caches.open(RUNTIME_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);

        // Arka planda güncelleme getirişi (Stale-While-Revalidate)
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => null);

        // Önbellekte varsa anında 0 ms'de teslim et, yoksa ağı bekle
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // D. Diğer Genel İstekler: Önbellek, Yoksa Ağ
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(RUNTIME_CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});
