// U-Points service worker
// 简单的"离线优先"缓存：把 index.html 本体缓存下来，
// 这样即使没有网络，重新打开 PWA 也能正常显示（数据仍在 localStorage 里，不受影响）。
//
// v3.13.56 更新：新增阶梯翻倍减分项「成长期已满、减分降级」的提醒弹窗（逻辑都在 index.html 里，这里只升缓存版本号）。
//
// v3.13.55 更新：积分页三处界面调整（调整初始积分按钮居中、「全部积分项」改「打卡项」、预警阈值键样式统一）（逻辑都在
// index.html 里，这里只升缓存版本号）。
//
// v3.13.54 更新：积分页改版（卡片左右分栏、加减分规则列表搬到新列表页）、头像和规则图标改为输入法自由输入 emoji（逻辑都在
// index.html 里，这里只升缓存版本号）。
//
// v3.13.53 更新：全局排查并统一按"就近操作"重做交互（选中反馈、运动时长弹窗、奖励/惩罚/优惠整页表单、
// 食物目标两步、返回恢复滚动位置）（逻辑都在 index.html 里，这里只升缓存版本号）。
//
// v3.13.52 更新：新增营养达标里的「食物目标」；前一天没记录扣分改成必须有三餐记录（逻辑都在
// index.html 里，这里只升缓存版本号）。
//
// v3.13.51 更新：新增全局规则（前一天没有任何三餐/运动记录，次日扣 1 分）、营养达标设置界面改成每项一行（逻辑都在
// index.html 里，这里只升缓存版本号）。
//
// v3.13.50 更新：自动还款改成按结算日的限时优惠汇率换算，设置入口挪到「调整平时汇率」下面（逻辑都在
// index.html 里，这里只升缓存版本号）。
//
// v3.13.49 更新：新增「账户余额为负时，每天结算的积分自动按比例还款」功能（逻辑都在
// index.html 里，这里没有改动，只是同步升了缓存版本号，让两台设备都拿到新的 index.html）。
//
// v3.13.48 更新（修复家长端收不到孩子端最新记录、要反复开关 App 才同步的问题）：
// 之前这里的 fetch 处理器会拦截"所有"GET 请求，连 Firestore 的跨域长连接请求
// （firestore.googleapis.com 的 WebChannel / long polling 下行通道，本质上是一条
// 挂起很久的 GET）也被 Service Worker 代理了一遍，还会把响应 clone 后试图写进缓存。
// iOS 会很快回收闲置的 Service Worker，被它代理着的长连接就会无声地卡住或断掉，
// 表现就是：实时监听不再收到新数据，直到整个 App 被划掉重开。
// 现在只处理同源的 GET 请求（也就是 index.html / sw.js 自己），所有跨域请求
// （Firestore、Firebase 登录、gstatic 的 SDK 脚本）一律不拦截，直接走网络。
//
// v3.13.47 更新：记账页「手动记一笔」平时收支功能，从原来只有家长能用，开放给
// 孩子自己也能记（比如收到的零花钱、自己买了什么）。孩子只能新增，不能修改或
// 删除——流水列表里的✕删除按钮仍然只在家长身份下才会出现，App 里本来就没有
// "改"这条流水的功能，家长也一样不能改，只能删了重记。汇率设置、限时优惠、货币
// 互转、调整初始金额这几项账户管理功能，仍然只有家长能看到。
var CACHE_NAME = 'u-points-cache-v3.13.56';
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
  var req = event.request;
  var url = new URL(req.url);

  // 只处理同源 GET：跨域请求（Firestore 长连接、Firebase Auth、gstatic SDK 等）
  // 直接放行，不经过 Service Worker，也不进缓存。
  if(req.method !== 'GET' || url.origin !== self.location.origin){
    return;
  }

  event.respondWith(
    fetch(req, { cache: 'no-store' }).then(function(res){
      if(res && res.status === 200){
        var resClone = res.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(req, resClone); });
      }
      return res;
    }).catch(function(){
      return caches.match(req).then(function(cached){
        return cached || caches.match('./index.html');
      });
    })
  );
});
