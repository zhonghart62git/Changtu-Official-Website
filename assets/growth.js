/* 成长路径：四个站点滚到视口中段时点亮圆环。
   复用 site.css 的 .path-list 组件，这里只管 class 切换。
   零依赖，rAF 合并滚动事件；关掉动效时直接全亮。 */
(function () {
  var list = document.querySelector('#path .path-list');
  if (!list) return;

  var steps = [].slice.call(list.children);
  if (!steps.length) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function paint() {
    if (reduce) {
      steps.forEach(function (s) { s.classList.add('on'); });
      return;
    }
    var line = (window.innerHeight || 800) * 0.72;
    for (var i = 0; i < steps.length; i++) {
      var on = steps[i].getBoundingClientRect().top < line;
      if (on !== steps[i].classList.contains('on')) steps[i].classList.toggle('on', on);
    }
  }

  var tick = false;
  function onScroll() {
    if (tick) return;
    tick = true;
    requestAnimationFrame(function () { tick = false; paint(); });
  }

  paint();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
})();
