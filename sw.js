// U-Points service worker
// 简单的"离线优先"缓存：把 index.html 本体缓存下来，
// 这样即使没有网络，重新打开 PWA 也能正常显示（数据仍在 localStorage 里，不受影响）。
//
// v3.13.5 更新：给"冷启动底部露白条"这个老毛病再补一刀——
// 之前那套"自动模拟下拉一下"的修复，前提是页面得有能滚动的空间才有效，
// 内容少的页面（比如只有一个孩子卡片的首页）整页还不到一屏，白划拉了。
// 现在把每个页面的最小高度都故意设成比屏幕实际高度多2px，保证无论内容
// 多少都有一点点真实可滚动的余量，让自动下拉的修复对短页面也能生效；
// 同时切换页面/标签时也会顺手再模拟一次，覆盖应用内导航的场景。
var CACHE_NAME = 'u-points-cache-v3.13.5';
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
