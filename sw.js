// U-Points service worker
// 简单的"离线优先"缓存：把 index.html 本体缓存下来，
// 这样即使没有网络，重新打开 PWA 也能正常显示（数据仍在 localStorage 里，不受影响）。
//
// v3.13.33 更新：修复"添加自定义食物"填了"基准数量"却总是提示"请填写食物名称
// 和热量"保存不了的 bug——根因是这个输入框之前是 type=number，苹果系统对这种
// 输入框有个隐藏规则：只要打进去的内容不是合法数字（比如打了"2/3"这种分数），
// 整个输入框的值就会被浏览器悄悄清空成空字符串，导致保存时校验失败还看不出是
// 哪个框的问题。这次把"基准数量"和记录三餐时的"用量"两个输入框都改成了支持
// 分数写法（比如"2/3"）的文本框，不会再出现这种情况。
var CACHE_NAME = 'u-points-cache-v3.13.33';
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
