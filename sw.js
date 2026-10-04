// U-Points service worker
// 简单的"离线优先"缓存：把 index.html 本体缓存下来，
// 这样即使没有网络，重新打开 PWA 也能正常显示（数据仍在 localStorage 里，不受影响）。
//
// v3.13.47 更新：记账页「手动记一笔」平时收支功能，从原来只有家长能用，开放给
// 孩子自己也能记（比如收到的零花钱、自己买了什么）。孩子只能新增，不能修改或
// 删除——流水列表里的✕删除按钮仍然只在家长身份下才会出现，App 里本来就没有
// "改"这条流水的功能，家长也一样不能改，只能删了重记。汇率设置、限时优惠、货币
// 互转、调整初始金额这几项账户管理功能，仍然只有家长能看到。
var CACHE_NAME = 'u-points-cache-v3.13.47';
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
