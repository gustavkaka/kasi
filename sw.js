const CACHE_NAME = 'lyric-collection-v3'; // ★更新時はここを v2, v3 と上げていきます
const ASSETS = [
'./',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './start1.wav',
  './start2.wav',
  './start3.wav',
  './start4.wav',
  './start5.wav'
];

// インストール時：ファイルをキャッシュ ＋ 即座に適用準備
self.addEventListener('install', (event) => {
  self.skipWaiting(); // ★新しいService Workerを待機させずに即時有効化
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
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
            return caches.delete(key); // ★'lyric-collection-v1' などの古いキャッシュだけを削除
          }
        })
      );
    }).then(() => self.clients.claim()) // ★すぐに新しいSWの制御下に置く
  );
});

// ネットワーク優先（Network First）戦略：常に最新を取得し、オフライン時のみキャッシュを利用
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // ネットワークから最新が取れたら、キャッシュも最新に更新しておく
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // オフライン等で通信できない場合のみ、キャッシュから読み込む
        return caches.match(event.request);
      })
  );
});
