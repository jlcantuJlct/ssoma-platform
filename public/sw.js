// ─── CACHÉ INDEPENDIENTE DE IMÁGENES DE REFERENCIA ───────────────────────────
// Este Service Worker tiene DOS cachés separados:
//   1. "referencias-imagenes" → fotos de fondo del Generador Dinámico.
//      NUNCA se borra con actualizaciones del sistema. Persiste hasta que
//      el usuario borre manualmente el almacenamiento del sitio.
//   2. "app-cache-v1" → caché general del sitio (se renueva con cada deploy).
//
// Estrategia para referencias: Cache-First (si ya está guardada, la devuelve
// al instante sin tocar la red. Si no, la descarga y la guarda para siempre).
// ─────────────────────────────────────────────────────────────────────────────

const REFERENCIAS_CACHE = 'referencias-imagenes'; // NUNCA cambia el nombre → nunca se borra
const APP_CACHE         = 'app-cache-v1';         // Cambiar versión en cada deploy si se quiere limpiar

// Rutas que pertenecen al caché de referencias (independiente)
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

// ── Instalación ───────────────────────────────────────────────────────────────
self.addEventListener('install', (e) => {
  self.skipWaiting(); // Activa inmediatamente sin esperar a cerrar pestañas
});

// ── Activación ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          // Borramos versiones antiguas del caché de APP, pero NUNCA el de referencias
          .filter(k => k !== REFERENCIAS_CACHE && k.startsWith('app-cache-') && k !== APP_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return; // Solo interceptamos GET

  const url = new URL(e.request.url);

  // ── Estrategia para IMÁGENES DE REFERENCIA: Cache-First permanente ─────────
  if (esReferencia(url)) {
    e.respondWith(
      caches.open(REFERENCIAS_CACHE).then(async cache => {
        const cached = await cache.match(e.request);
        if (cached) {
          // ✅ Ya está guardada → respuesta instantánea, sin red
          return cached;
        }
        // 🌐 Primera vez → descargamos, guardamos y devolvemos
        try {
          const response = await fetch(e.request);
          if (response.ok) {
            // Clonamos porque el stream solo se puede leer una vez
            cache.put(e.request, response.clone());
          }
          return response;
        } catch {
          // Sin conexión y sin caché → devolver vacío
          return new Response('', { status: 503 });
        }
      })
    );
    return;
  }

  // ── Estrategia para el RESTO DEL SITIO: Network-First ─────────────────────
  // Intenta la red primero; si falla usa el caché de app.
  e.respondWith(
    fetch(e.request)
      .then(response => {
        if (response.ok) {
          caches.open(APP_CACHE).then(cache => cache.put(e.request, response.clone()));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
