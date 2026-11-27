const CACHE_NAME = 'lyric-collection-v8'; // ★更新時はここを v5, v6 と上げていきます

// アプリの動作に必須のもの：どれか失敗したらインストール自体を失敗扱いにする
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 無くてもアプリは動くもの：1個失敗しても全体を巻き込まないよう、個別にキャッシュする
const OPTIONAL_ASSETS = [
  './start1.wav',
  './start2.wav',
  './start3.wav',
  './start4.wav',
  './start5.wav'
];

// インストール時：必須をキャッシュ ＋ 即座に適用準備。任意ファイルは失敗を無視する
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(CORE_ASSETS);
      await Promise.allSettled(
        OPTIONAL_ASSETS.map((url) => cache.add(url))
      );
    })
  );
});

// アクティベート時：古いキャッシュの自動削除 ＋ 画面の制御開始
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ネットワーク優先（Network First）戦略：常に最新を取得し、オフライン時のみキャッシュを利用
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
