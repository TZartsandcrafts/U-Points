// U-Points service worker
// 简单的"离线优先"缓存：把 index.html 本体缓存下来，
// 这样即使没有网络，重新打开 PWA 也能正常显示（数据仍在 localStorage 里，不受影响）。
//
// v3.13.0 更新（较大改动）：
// 1. 孩子端不再需要先进"选自己是谁"的卡片页——如果家里只有一个孩子，这台设备一选"孩子模式"
//    就直接绑定，进到自己的专属页面；家里不止一个孩子才会弹出选择页。
// 2. 孩子端打开 app 现在直接落在"积分"标签页。
// 3. 孩子端首页从原来单独的一块拼版，改成跟家长端管理孩子档案时完全一样的标签页组件
//    （积分/健康/记账/兑换/档案），标签顺序、内容排版家长端和孩子端统一，家长看得到的
//    管理按钮/删除按钮/性别年龄编辑，孩子端仍然照常隐藏。
// 4. 标签顺序调整为：积分、健康、记账、兑换、档案（"档案"挪到了最后，紧跟在"兑换"右边）。
var CACHE_NAME = 'u-points-cache-v3.13.0';
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
