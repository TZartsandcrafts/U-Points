// U-Points service worker
// 简单的"离线优先"缓存：把 index.html 本体缓存下来，
// 这样即使没有网络，重新打开 PWA 也能正常显示（数据仍在 localStorage 里，不受影响）。
//
// v3.13.42 更新：上一版把"当前积分"卡片错改成了整体居中的横排三等分，这版改回
// 左右两栏——左边"当前积分"+数字两行，右边"行为规则与积分项/预警阈值设置/调整
// 初始积分"三行，各占一半宽度；这次两栏内部的文字都改成了水平居中（之前是靠左），
// "当前积分"四个字和数字之间的间距也拉大了，字号跟着放大加粗，三个操作项的字也
// 比之前大。孩子端没有那三个操作项，不受影响。
var CACHE_NAME = 'u-points-cache-v3.13.42';
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
