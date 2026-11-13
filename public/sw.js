// ─── SERVICE WORKER SSOMA ANTIGRAVITY (OFFLINE + PWA READY) ───────────────────
// Maneja dos cachés independientes:
//   1. "referencias-imagenes" → fotos permanentes de fondo del Generador Dinámico.
//   2. "app-cache-v3" → caché de la aplicación, shell offline y navegación.
// ─────────────────────────────────────────────────────────────────────────────

const REFERENCIAS_CACHE = 'referencias-imagenes';
const APP_CACHE         = 'app-cache-v3';

// Rutas esenciales para navegación offline inmediata
const PRECACHE_URLS = [
  '/',
  '/dashboard',
  '/inspections',
  '/public/reporte-ac',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

const REFERENCIAS_PATHS = [
  '/referencias_pad/',
  '/referencias_chincha/',
  '/referencias_jahuay/',
  '/referencias_barandas/',
  '/api/generar-docx/foto-referencia',
];

function esReferencia(url) {
  return REFERENCIAS_PATHS.some(p => url.pathname.startsWith(p) || url.pathname.includes(p));
}

// ── Instalación (Pre-cacheo del App Shell) ──────────────────────────────────
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(APP_CACHE).then(cache => {
      return Promise.allSettled(
        PRECACHE_URLS.map(url => cache.add(url).catch(err => console.warn(`[SW] Precache fallo en ${url}:`, err)))
      );
    }).then(() => self.skipWaiting())
  );
});

// ── Activación ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== REFERENCIAS_CACHE && k.startsWith('app-cache-') && k !== APP_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // No interceptar llamadas internas de api en tiempo real o supabase
  if (url.pathname.startsWith('/api/') && !url.pathname.includes('foto-referencia')) {
    return;
  }

  // 1. Fotos de referencia fijas: Cache-first permanente
  if (esReferencia(url)) {
    e.respondWith(
      caches.open(REFERENCIAS_CACHE).then(async cache => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        try {
          const response = await fetch(e.request);
          if (response.ok) cache.put(e.request, response.clone());
          return response;
        } catch {
          return new Response('', { status: 503 });
        }
      })
    );
    return;
  }

  // 2. Navegación de páginas HTML (evita dinosaurio ERR_INTERNET_DISCONNECTED)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(APP_CACHE).then(cache => cache.put(e.request, clone));
          }
          return response;
        })
        .catch(async () => {
          // Si estamos offline: buscar página exacta en caché
          const cached = await caches.match(e.request);
          if (cached) return cached;

          // Si no está la URL exacta, devolver la pantalla principal o reporte offline en caché
          const fallbackReport = await caches.match('/public/reporte-ac');
          if (fallbackReport) return fallbackReport;

          const fallbackDashboard = await caches.match('/dashboard');
          if (fallbackDashboard) return fallbackDashboard;

          const fallbackRoot = await caches.match('/');
          if (fallbackRoot) return fallbackRoot;

          return new Response(
            `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>SSOMA Offline</title><style>body{background:#020617;color:#f8fafc;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;padding:20px;text-align:center;}h1{color:#10b981;margin-bottom:10px;}p{color:#94a3b8;font-size:14px;max-width:360px;}</style></head><body><div><h1>Modo Sin Conexión Activo</h1><p>Los datos registrados se guardan en la memoria de tu celular y se sincronizarán al recuperar señal.</p></div></body></html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // 3. Estilos, scripts JS, fuentes e imágenes estáticas
  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      const fetchPromise = fetch(e.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(APP_CACHE).then(cache => cache.put(e.request, networkResponse.clone()));
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      // Devolver de caché si existe (rápido), y actualizar en segundo plano
      return cachedResponse || fetchPromise;
    })
  );
});
