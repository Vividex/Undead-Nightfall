
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

const CACHE_NAME = "undead-nightfall-external-assets-v4-vividex-bumper";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./assets/CAMPFIRE_SRC.mp3",
  "./assets/CHARGED_WAV.mp3",
  "./assets/LARGE_FIRE.mp3",
  "./assets/LARGE_FIREBALL_WAV.mp3",
  "./assets/LEVEL_WAV.mp3",
  "./assets/NORMAL_WAV.mp3",
  "./assets/SMALL_FIRE.mp3",
  "./assets/asset14.png",
  "./assets/asset8.png",
  "./assets/begin-bg.png",
  "./assets/bootLayoutSplash.png",
  "./assets/btn10-pressed.png",
  "./assets/btn12-normal.png",
  "./assets/btn13-pressed.png",
  "./assets/btn15-normal.png",
  "./assets/btn16-pressed.png",
  "./assets/btn18-normal.png",
  "./assets/btn19-pressed.png",
  "./assets/btn21-normal.png",
  "./assets/btn22-pressed.png",
  "./assets/btn3-normal.png",
  "./assets/btn4-pressed.png",
  "./assets/btn6-normal.png",
  "./assets/btn7-pressed.png",
  "./assets/btn9-normal.png",
  "./assets/extrasBtn-bg.png",
  "./assets/fire.mp3",
  "./assets/fireCharged.mp3",
  "./assets/lightning.mp3",
  "./assets/lightningCharged.mp3",
  "./assets/muteTitle-bg.png",
  "./assets/showControls-bg.png",
  "./assets/titleVideo.mp4",
  "./assets/usernameBtn-bg.png",
  "./assets/vividex-splash-v.png",
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request).then(response => {
      const copy=response.clone();
      caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)).catch(()=>{});
      return response;
    }).catch(() => caches.match(event.request).then(cached => cached || caches.match("./index.html")))
  );
});
