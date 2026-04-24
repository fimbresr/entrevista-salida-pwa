const CACHE_NAME = 'hsda-exit-interview-v9';
const ASSETS = [
  'index.html',
  'css/style.css',
  'js/script.js',
  'assets/logo.png',
  'fonts/Avenir-Light.ttf',
  'fonts/Avenir-Medium.ttf',
  'fonts/Avenir-Black.ttf'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
