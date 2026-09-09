// U-Points service worker
// 简单的"离线优先"缓存：把 index.html 本体缓存下来，
// 这样即使没有网络，重新打开 PWA 也能正常显示（数据仍在 localStorage 里，不受影响）。
//
// v3.13.27 更新：找到并修复了"孩子自己的设备上，食物/运动搜索框中英文都搜
// 不出结果"的真正原因——孩子端渲染详情页时没有真的走 screenStack 导航，导致
// 搜索框的事件绑定判断"当前在看哪个孩子"时永远拿不到结果，输入框看着能打字
// 实际完全没反应（不是输入法拼音的问题，之前 v3.13.26 那个修复是真实但次要
// 的问题，这次是根本原因）。顺带修好了同样受影响的兑换积分预览、货币互转
// 预览、食物数量卡路里预览——这几个输入框在孩子模式下也一样失灵。
var CACHE_NAME = 'u-points-cache-v3.13.27';
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
