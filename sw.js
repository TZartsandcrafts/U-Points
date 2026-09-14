// U-Points service worker
// 简单的"离线优先"缓存：把 index.html 本体缓存下来，
// 这样即使没有网络，重新打开 PWA 也能正常显示（数据仍在 localStorage 里，不受影响）。
//
// v3.13.36 更新：上一版把分数输入四舍五入成小数显示，用户反馈更希望界面上保留
// 原始输入的样子（比如就显示"2/3"），换算和计分这些后台逻辑该怎么算还是怎么算，
// 不用管界面。这次改成额外存一份"当初打进去的原始文本"，界面统一显示这份原始
// 文本，数字换算继续用四舍五入后的干净数值，两不耽误——不管是自定义食物的基准
// 数量、还是三餐记录的用量，只要当初填的是"2/3"，回头看的时候就还是"2/3"，不会
// 变成 0.667 这种小数。
var CACHE_NAME = 'u-points-cache-v3.13.36';
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
