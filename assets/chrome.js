/* 站点外壳的视觉行为，只管 class，不碰内容和业务。
 *
 * 现在只有一件事：导航滚动后加深底色。
 * 顶部导航是轻度玻璃（半透明 + 背景模糊），页面向下滚时如果底色不变，
 * 下面滚过的彩色内容会透上来，菜单文字就不稳了。滚动超过 8px 时加 .is-scrolled，
 * 把底色的不透明度从 .72 提到 .93。
 *
 * 用 rAF 节流，滚动回调只置标记；监听是 passive 的，不阻塞滚动。
 */
(function () {
  'use strict';

  var nav = document.querySelector('header.nav');
  if (!nav) return;

  var ticking = false;

  function sync() {
    ticking = false;
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    nav.classList.toggle('is-scrolled', y > 8);
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(sync);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  sync();

  /* 从 bfcache 回来时滚动位置会复原，class 要跟着复原 */
  window.addEventListener('pageshow', sync);
})();
