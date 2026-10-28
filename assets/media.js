/* 畅途 · 图片位
 * 课程与实践（A / B1–B5）与活动与机会（C / 每场活动一条）共用一套映射。
 *
 * 用法：HTML 里写一个空盒子 <figure class="img-ph" data-img="B1"></figure>，
 * 本文件在 DOM ready 后扫描一遍，按 MAP 里该条的 src 决定渲染占位还是真图。
 * 活动卡由 projects.js 动态生成，生成后调 CTMedia.mount(那个容器) 再扫一次。
 *
 * 换图：把照片放进 assets/，跑 _ref/optimize_images.py 出 .webp 与 -720 小图，
 * 在下面 MAP 里把 src 填成 'assets/xxx.webp'，w 填原图宽度，alt 填一句画面说明。
 *
 * 约定：
 * - 编号只给开发阶段认，src 一填就不再出现在页面上。
 * - 占位块用 aria-hidden，读屏读的是 figure 上的 aria-label（图片类型），
 *   不会把 "B1" 念出来。
 * - 加载失败回到占位状态，不留白框。
 * - MAP 里没有登记的 id 不报错：读 figure 上的 data-label / data-hint 兜底。
 *   所以给活动加一条数据不用同步改这个文件，忘了登记也不会掉图。
 * - 首屏大图（A / C）给 priority，剩下的都 lazy。首屏图挂 lazy 会拖慢 LCP。
 */
(function (global) {
  'use strict';

  /* sizes 按各页的列数写死：
     课程卡 2 列（catalog.css .crs-grid），活动卡桌面 3 列、1020 以下 2 列、760 以下 1 列。 */
  var SZ_CRS = '(max-width: 820px) 100vw, 50vw';
  var SZ_PJ = '(max-width: 760px) 100vw, (max-width: 1020px) 50vw, 33vw';
  var SZ_HERO = '100vw';

  var MAP = {
    /* ── 课程与实践 ─────────────────────────────── */
    A:  { label: '课程主视觉', hint: '学生演讲、课堂讨论或师生互动', ratio: '1920 / 720',
          src: 'assets/hero-courses.webp', w: 1920, sizes: SZ_HERO, priority: true,
          alt: '教师与学生在明亮的教室里讨论，玻璃板书上是思维导图图标' },
    B1: { label: '中英双语主持', hint: '主持、舞台表达', ratio: '3 / 2',
          src: 'assets/course-host.webp', w: 1440, sizes: SZ_CRS, alt: '两名学生主持人在舞台上报幕' },
    B2: { label: '中文演讲', hint: '学生面对观众演讲', ratio: '3 / 2',
          src: 'assets/course-speech.webp', w: 1440, sizes: SZ_CRS, alt: '学生在红色舞台上做主题演讲' },
    B3: { label: '英语交流与演讲', hint: '英语演讲或交流场景', ratio: '3 / 2',
          src: 'assets/course-english.webp', w: 1440, sizes: SZ_CRS, alt: '学生在教室用英语交流讨论' },
    B4: { label: '逻辑思维与辩论', hint: '辩论赛或课堂思辨', ratio: '3 / 2',
          src: 'assets/course-logic.webp', w: 1440, sizes: SZ_CRS, alt: '学生在教室里分列两侧进行辩论，一人起身陈述观点' },
    B5: { label: '模拟联合国', hint: '模联会议、代表发言', ratio: '3 / 2',
          src: 'assets/course-mun.webp', w: 1440, sizes: SZ_CRS, alt: '模拟联合国会场，各国代表围坐在弧形会议桌前发言' },

    /* ── 活动与机会 ─────────────────────────────── */
    C:  { label: '活动主视觉', hint: '比赛、舞台或学生活动现场', ratio: '1920 / 767',
          src: 'assets/hero-activities.webp', w: 1920, sizes: SZ_HERO, priority: true,
          alt: '学生围在展台前讨论作品' },

    /* ── 活动卡：键就是 assets/projects.js 里的活动 id ──
       一场活动一个位置。这里只放提示文案，src 空着就是占位；
       填 src 时把 hint 那句换成 alt 的画面说明。 */
    'sdg-2026a':      { label: '联合国 SDG 发言人', hint: '演讲台或线上答辩现场', ratio: '16 / 9',
                        src: 'assets/act-sdg.webp', w: 1200, sizes: SZ_PJ, alt: 'AI for Good 全球峰会会场，舞台上是 SDG 主题标识与灯光' },
    'mun-2027w':      { label: '模拟联合国', hint: '会议现场、代表发言', ratio: '16 / 9',
                        src: 'assets/act-mun.webp', w: 768, sizes: SZ_PJ, alt: '模拟联合国会场，代表在讲台发言，手边是中国代表牌' },
    'debate-2027':    { label: '华语辩论世界杯', hint: '赛场、选手对辩', ratio: '16 / 9',
                        src: 'assets/act-debate.webp', w: 1080, sizes: SZ_PJ, alt: '辩论赛主视觉：红蓝两色人物侧脸与城市剪影，标语「敢辩，才有答案」' },
    'youth-2027':     { label: '亚青辩', hint: '赛场、选手对辩', ratio: '16 / 9',
                        src: 'assets/act-debate.webp', w: 1080, sizes: SZ_PJ, alt: '辩论赛主视觉：红蓝两色人物侧影与城市剪影，标语「敢辩，才有答案」' },
    'bilingual-2026a':{ label: '雏英杯双语主持', hint: '主持台、双语报幕', ratio: '16 / 9',
                        src: 'assets/act-bilingual.webp', w: 1058, sizes: SZ_PJ, alt: '中英双语青少年主持大会主视觉，绿色水波纹背景与大会标题' },
    'caocan-2027':    { label: '曹灿杯', hint: '朗诵展演现场', ratio: '16 / 9',
                        src: 'assets/act-caocan.webp', w: 1200, sizes: SZ_PJ, alt: '曹灿杯 2027 主视觉，红色绸带与香港城市剪影' },
    'caocan-2026':    { label: '曹灿杯', hint: '朗诵展演现场', ratio: '16 / 9', src: '', alt: '' },
    'brtv-2027w':     { label: '北京广播电视台考级', hint: '考级考场或测评现场', ratio: '16 / 9',
                        src: 'assets/act-brtv.webp', w: 1200, sizes: SZ_PJ, alt: '北京广播电视台社会艺术水平考级主视觉，朗诵·主持·课本剧' },
    'zjcm-2027w':     { label: '浙江音乐学院考级', hint: '考级考场或测评现场', ratio: '16 / 9', src: '', alt: '' },
    'geneva-2027':    { label: '日内瓦联合国研学营', hint: '万国宫、营地课程现场', ratio: '16 / 9',
                        src: 'assets/act-geneva.webp', w: 1200, sizes: SZ_PJ, alt: '学生在万国宫庭院里听讲解员介绍建筑' },
    'hangzhou-2027':  { label: '科技与艺术研学', hint: '企业展厅、参访现场', ratio: '16 / 9',
                        src: 'assets/act-hangzhou.webp', w: 1200, sizes: SZ_PJ, alt: '两名学生在科技馆里遥控机器狗' }
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

  /* 小图按命名约定取：xxx.webp 旁边就是 xxx-720.webp。
     有 w 才拼 srcset——宽度是浏览器挑图的依据，写错不如不写。 */
  function srcset(m) {
    if (!m.w || m.w <= 720) return '';
    return m.src.replace(/\.webp$/, '-720.webp') + ' 720w, ' + m.src + ' ' + m.w + 'w';
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
      img.decoding = 'async';

      var ss = srcset(m);
      if (ss) {
        img.srcset = ss;
        img.sizes = m.sizes || '100vw';
      }

      /* 首屏大图要抢在其它资源前面，挂 lazy 等于把 LCP 往后推。 */
      if (m.priority) {
        img.loading = 'eager';
        img.setAttribute('fetchpriority', 'high');
      } else {
        img.loading = 'lazy';
      }

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
    /* 运行期替换：CTMedia.set('B1', 'assets/img/b1.webp', '主持课堂') */
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
