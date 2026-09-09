// U-Points service worker
// 简单的"离线优先"缓存：把 index.html 本体缓存下来，
// 这样即使没有网络，重新打开 PWA 也能正常显示（数据仍在 localStorage 里，不受影响）。
//
// v3.13.26 更新：三餐页面重新排版 + 新增三餐月历（默认展开，可收起）——现在
// 支持翻到别的日期查看/修改/补记三餐，不再只能记今天。搜索框下方"已有食物"
// 浏览列表默认整个折叠，点了才展开（不影响搜索，输入关键词照样直接出结果）。
// 顺手修了一个 bug：中文拼音输入法拼字过程中搜索框会拿还没拼完的拼音去搜，
// 导致明明加过的自定义食物却搜不出来——现在拼字结束（compositionend）才真正
// 触发搜索。四餐记录从"今天全部平铺"改成标签页形式，点哪餐看哪餐，点已有
// 记录可以编辑（改数量/改餐次），不只是删除。
var CACHE_NAME = 'u-points-cache-v3.13.26';
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
