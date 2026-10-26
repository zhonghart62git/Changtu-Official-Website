/* 畅途 · 图片位
 * 课程与实践（A / B1–B6）与活动与机会（C / D1）共 9 个位置。
 *
 * 用法：HTML 里写一个空盒子 <figure class="img-ph" data-img="B1"></figure>，
 * 本文件在 DOM ready 后扫描一遍，按 MAP 里该条的 src 决定渲染占位还是真图。
 *
 * 换图：把照片放进 assets/img/，在下面 MAP 里把 src 填成 'assets/img/xxx.jpg'，
 * alt 填一句画面说明。只有这一步，不用改 HTML，也不会改变卡片尺寸
 * （比例由 ratio 写死，真图 object-fit:cover 裁进去）。
 *
 * 约定：
 * - 编号只给开发阶段认，src 一填就不再出现在页面上。
 * - 占位块用 aria-hidden，读屏读的是 figure 上的 aria-label（图片类型），
 *   不会把 "B1" 念出来。
 * - 加载失败回到占位状态，不留白框。
 */
(function (global) {
  'use strict';

  var MAP = {
    /* ── 课程与实践 ─────────────────────────────── */
    A:  { label: '课程主视觉', hint: '学生演讲、课堂讨论或师生互动', ratio: '3 / 2',  src: '', alt: '' },
    B1: { label: '中英双语主持', hint: '主持、舞台表达',           ratio: '4 / 3',  src: '', alt: '' },
    B2: { label: '中文演讲',   hint: '学生面对观众演讲',           ratio: '4 / 3',  src: '', alt: '' },
    B3: { label: '英语交流与演讲', hint: '英语演讲或交流场景',      ratio: '4 / 3',  src: '', alt: '' },
    B4: { label: '逻辑思维与辩论', hint: '辩论赛或课堂思辨',        ratio: '4 / 3',  src: '', alt: '' },
    B5: { label: '模拟联合国', hint: '模联会议、代表发言',          ratio: '4 / 3',  src: '', alt: '' },
    B6: { label: '思考、表达与自主学习', hint: '项目式学习、小组协作', ratio: '4 / 3', src: '', alt: '' },

    /* ── 活动与机会 ─────────────────────────────── */
    C:  { label: '活动主视觉', hint: '比赛、舞台或学生活动现场',    ratio: '3 / 2',  src: '', alt: '' },
    D1: { label: '精选活动主图', hint: '当前主推活动的现场照片',    ratio: '16 / 9', src: '', alt: '' }
  };

  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2.5"/>' +
    '<circle cx="8.5" cy="9.5" r="1.6"/><path d="M21 16.5l-4.6-4.3L8 20"/></svg>';

  function paint(el) {
    var id = el.getAttribute('data-img');
    var m = MAP[id];
    if (!m || el.getAttribute('data-ph-done')) return;
    el.setAttribute('data-ph-done', '1');

    if (m.ratio) el.style.aspectRatio = m.ratio;

    if (m.src) {
      var img = document.createElement('img');
      img.src = m.src;
      img.alt = m.alt || m.label;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.addEventListener('error', function () {
        el.classList.remove('is-filled');
        el.removeAttribute('role');
        el.setAttribute('aria-label', m.label);
        el.innerHTML = emptyHtml(id, m);
      });
      el.innerHTML = '';
      el.appendChild(img);
      el.classList.add('is-filled');
      el.removeAttribute('role');
      el.removeAttribute('aria-label');
      return;
    }

    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', m.label);
    el.classList.add('is-empty');
    el.innerHTML = emptyHtml(id, m);
  }

  function emptyHtml(id, m) {
    return '<span class="ph-in" aria-hidden="true">' +
        '<span class="ph-ico">' + ICON + '</span>' +
        '<b>' + id + '</b>' +
        '<span class="ph-label">' + m.label + '</span>' +
        '<i>' + m.hint + '</i>' +
      '</span>';
  }

  function mount(root) {
    var scope = root || document;
    var nodes = scope.querySelectorAll('[data-img]');
    for (var i = 0; i < nodes.length; i++) paint(nodes[i]);
  }

  global.CTMedia = {
    map: MAP,
    mount: mount,
    /* 运行期替换：CTMedia.set('B1', 'assets/img/b1.jpg', '主持课堂') */
    set: function (id, src, alt) {
      if (!MAP[id]) return;
      MAP[id].src = src || '';
      if (alt) MAP[id].alt = alt;
      var el = document.querySelector('[data-img="' + id + '"]');
      if (el) { el.removeAttribute('data-ph-done'); el.className = 'img-ph'; paint(el); }
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { mount(); });
  else mount();
})(window);
