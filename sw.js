const CACHE_NAME = 'vitals-ai-v2'; // Updated version
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './script.js',
  './manifest.json',
  './siren.mp3',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js' // Added QR Library
];

// Install: Save files to phone memory
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('VitalsAI: caching assets for offline use');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate: Clean up old versions to force update
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// Fetch: Serve from cache if offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
