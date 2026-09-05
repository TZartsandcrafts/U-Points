// U-Points service worker
// 简单的"离线优先"缓存：把 index.html 本体缓存下来，
// 这样即使没有网络，重新打开 PWA 也能正常显示（数据仍在 localStorage 里，不受影响）。
//
// v3.13.6 更新：消除上一版修复带来的一个小副作用——加入房间等场景短时间内连续
// 触发好几次重绘（加入成功→同步中→同步完成），每次重绘都顺手模拟一次"下拉"，
// 叠加起来会让页面肉眼可见地自己慢慢往下滑一截。现在改成"防抖"：连续重绘时只在
// 停下来后才真正模拟一次下拉，同时给模拟下拉本身加了"进行中不重复触发"的保护，
// 不再有肉眼可见的位移，白条修复效果不受影响。
var CACHE_NAME = 'u-points-cache-v3.13.6';
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
