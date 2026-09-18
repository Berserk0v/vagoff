// При изменении списка файлов увеличить версию — старый кэш удалится
const CACHE = 'fmc-v1';

const ASSETS = [
    './',
    'index.html',
    'manifest.json',
    'favicon.png',
    'apple-touch-icon.png',
    'icon-192.png',
    'icon-512.png'
];

self.addEventListener('install', function(event){
    event.waitUntil(
        caches.open(CACHE).then(function(cache){
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', function(event){
    event.waitUntil(
        caches.keys()
        .then(function(keys){
            return Promise.all(
                keys
                .filter(function(key){ return key !== CACHE; })
                .map(function(key){ return caches.delete(key); })
            );
        })
        .then(function(){
            return self.clients.claim();
        })
    );
});

// Сначала сеть (онлайн всегда свежая версия), без сети — из кэша
self.addEventListener('fetch', function(event){

    const request = event.request;

    if(request.method !== 'GET' ||
       new URL(request.url).origin !== self.location.origin){
        return;
    }

    event.respondWith(
        fetch(request)
        .then(function(response){
            if(response.ok){
                const copy = response.clone();
                caches.open(CACHE).then(function(cache){
                    cache.put(request, copy);
                });
            }
            return response;
        })
        .catch(function(){
            return caches.match(request, { ignoreSearch: true })
            .then(function(cached){
                if(cached){
                    return cached;
                }
                if(request.mode === 'navigate'){
                    return caches.match('index.html');
                }
                return Response.error();
            });
        })
    );
});
