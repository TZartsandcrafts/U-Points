// U-Points service worker
// 简单的"离线优先"缓存：把 index.html 本体缓存下来，
// 这样即使没有网络，重新打开 PWA 也能正常显示（数据仍在 localStorage 里，不受影响）。
//
// v3.13.43 更新：修复记账页两处货币符号错误——"当前汇率"和"即将开始的限时优惠"
// 这两行文字之前写死用的是人民币符号¥，不管孩子当前选的是CAD/USD/CNY哪个币种都
// 显示¥，而且正常汇率那行还会在¥后面再多显示一次正确的币种符号，变成"¥1 C$"这种
// 重复又矛盾的样子。现在这两处都统一用孩子当前选中币种的真实符号（C$/US$/¥），不
// 会再显示错的或重复的符号了。
var CACHE_NAME = 'u-points-cache-v3.13.43';
var APP_SHELL = ['./', './index.html'];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event){
  if(event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request, { cache: 'no-store' }).then(function(res){
      var resClone = res.clone();
      caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, resClone); });
      return res;
    }).catch(function(){
      return caches.match(event.request).then(function(cached){
        return cached || caches.match('./index.html');
      });
    })
  );
});
