/* 畅途 · 图片位
 * 课程与实践（A / B1–B6）与活动与机会（C / 每场活动一条）共用一套映射。
 *
 * 用法：HTML 里写一个空盒子 <figure class="img-ph" data-img="B1"></figure>，
 * 本文件在 DOM ready 后扫描一遍，按 MAP 里该条的 src 决定渲染占位还是真图。
 * 活动卡由 projects.js 动态生成，生成后调 CTMedia.mount(那个容器) 再扫一次。
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
 * - MAP 里没有登记的 id 不报错：读 figure 上的 data-label / data-hint 兜底。
 *   所以给活动加一条数据不用同步改这个文件，忘了登记也不会掉图。
 */
(function (global) {
  'use strict';

  var MAP = {
    /* ── 课程与实践 ─────────────────────────────── */
    A:  { label: '课程主视觉', hint: '学生演讲、课堂讨论或师生互动', ratio: '3 / 2',  src: '', alt: '' },
    B1: { label: '中英双语主持', hint: '主持、舞台表达',           ratio: '3 / 2',  src: '', alt: '' },
    B2: { label: '中文演讲',   hint: '学生面对观众演讲',           ratio: '3 / 2',  src: '', alt: '' },
    B3: { label: '英语交流与演讲', hint: '英语演讲或交流场景',      ratio: '3 / 2',  src: '', alt: '' },
    B4: { label: '逻辑思维与辩论', hint: '辩论赛或课堂思辨',        ratio: '3 / 2',  src: '', alt: '' },
    B5: { label: '模拟联合国', hint: '模联会议、代表发言',          ratio: '3 / 2',  src: '', alt: '' },
    B6: { label: '思考、表达与自主学习', hint: '项目式学习、小组协作', ratio: '3 / 2', src: '', alt: '' },

    /* ── 活动与机会 ─────────────────────────────── */
    C:  { label: '活动主视觉', hint: '比赛、舞台或学生活动现场',    ratio: '3 / 2',  src: '', alt: '' },

    /* ── 活动卡：键就是 assets/projects.js 里的活动 id ──
       一场活动一个位置。这里只放提示文案，src 空着就是占位；
       填 src 时把 hint 那句换成 alt 的画面说明。 */
    'sdg-2026a':      { label: '联合国 SDG 发言人', hint: '演讲台或线上答辩现场', ratio: '16 / 9', src: '', alt: '' },
    'mun-2027w':      { label: '模拟联合国',          hint: '会议现场、代表发言',   ratio: '16 / 9', src: '', alt: '' },
    'debate-2027':    { label: '华语辩论世界杯',    hint: '赛场、选手对辩',       ratio: '16 / 9', src: '', alt: '' },
    'youth-2027':     { label: '亚青辩',            hint: '赛场、选手对辩',       ratio: '16 / 9', src: '', alt: '' },
    'bilingual-2026a':{ label: '雏英杯双语主持',    hint: '主持台、双语报幕',     ratio: '16 / 9', src: '', alt: '' },
    'caocan-2027':    { label: '曹灿杯',            hint: '朗诵展演现场',         ratio: '16 / 9', src: '', alt: '' },
    'caocan-2026':    { label: '曹灿杯',            hint: '朗诵展演现场',         ratio: '16 / 9', src: '', alt: '' },
    'brtv-2027w':     { label: '北京广播电视台考级', hint: '考级考场或测评现场',   ratio: '16 / 9', src: '', alt: '' },
    'zjcm-2027w':     { label: '浙江音乐学院考级',  hint: '考级考场或测评现场',   ratio: '16 / 9', src: '', alt: '' },
    'geneva-2027':    { label: '日内瓦联合国研学营', hint: '万国宫、营地课程现场', ratio: '16 / 9', src: '', alt: '' },
    'hangzhou-2027':  { label: '科技与艺术研学',    hint: '企业展厅、参访现场',   ratio: '16 / 9', src: '', alt: '' }
  };

  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2.5"/>' +
    '<circle cx="8.5" cy="9.5" r="1.6"/><path d="M21 16.5l-4.6-4.3L8 20"/></svg>';

  /* 没登记的 id：读卡片自己带的提示。这样给活动加一条数据不用同步改这里。 */
  function conf(el) {
    var id = el.getAttribute('data-img');
    if (MAP[id]) return MAP[id];
    return {
      label: el.getAttribute('data-label') || '活动现场',
      hint: el.getAttribute('data-hint') || '活动现场照片',
      ratio: el.getAttribute('data-ratio') || '16 / 9',
      src: '', alt: ''
    };
  }

  function paint(el) {
    var id = el.getAttribute('data-img');
    var m = conf(el);
    if (!m || el.getAttribute('data-ph-done')) return;
    el.setAttribute('data-ph-done', '1');

    /* 比例走自定义属性，不直接写 aspect-ratio：
       媒体查询里要能按断点改比例（手机端首屏图扁一档），
       内联 aspect-ratio 会把它压死，内联变量不会。 */
    if (m.ratio) el.style.setProperty('--ph-ratio', m.ratio);

    if (m.src) {
      var img = document.createElement('img');
      img.src = m.src;
      img.alt = m.alt || m.label;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.addEventListener('error', function () {
        el.classList.remove('is-filled');
        el.setAttribute('role', 'img');
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
