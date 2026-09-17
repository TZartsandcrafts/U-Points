// U-Points service worker
// 简单的"离线优先"缓存：把 index.html 本体缓存下来，
// 这样即使没有网络，重新打开 PWA 也能正常显示（数据仍在 localStorage 里，不受影响）。
//
// v3.13.38 更新：行为规则的分类标签行改版——原来固定的"学习/生活/礼貌/家务/其他"
// 五个标签太繁琐，现在改成"加分/减分"两大项（有打卡类规则的孩子还会多一个"打卡"
// 标签），家长可以在加分或减分下面自己填小分类（比如"阅读打卡""态度"），填了才会
// 出现二级筛选，不填的规则就只按加分/减分归类，不会被硬塞进某个分类。旧数据里的
// 学习/生活/礼貌/家务/其他会自动变成对应大类下的小分类，不会丢。
var CACHE_NAME = 'u-points-cache-v3.13.38';
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
