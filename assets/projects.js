/* 畅途 · 活动与机会 —— 项目目录
 * 唯一数据源：活动与机会页取每类前 3 条做预览，四个品类页用同一份数据渲染完整列表。
 * 加一场活动只改下面的 LIST，五个页面同时生效。
 * 纯前端、无依赖，不碰 store.js（那是报名订单的库）。
 */
(function (global) {
  'use strict';

  var CATS = [
    { id: 'competition', name: '赛事', en: 'Competitions',
      desc: '演讲、辩论、模拟联合国、SDG 主题表达等项目。',
      page: 'activities-competition.html' },
    { id: 'showcase', name: '展演', en: 'Showcases',
      desc: '主持、朗诵、音乐及其他舞台展示项目。',
      page: 'activities-showcase.html' },
    { id: 'tour', name: '研学', en: 'Study Tours',
      desc: '高校、企业、场馆及城市主题研学项目。',
      page: 'activities-tour.html' },
    { id: 'grading', name: '考级', en: 'Grading',
      desc: '语言、音乐等专业等级测评。',
      page: 'activities-grading.html' }
  ];

  var STATUS = {
    open: { label: '报名中', order: 0 },
    soon: { label: '待开启', order: 1 },
    done: { label: '已结束', order: 2 }
  };

  var PAGE_SIZE = 10;

  /* start 只用来排序，不直接展示；time 是给人看的时间。
     时间没定的写「待公布」，排序时按 start 排到最后面。 */
  var LIST = [
    /* ── 赛事 ─────────────────────────────────────────── */
    {
      id: 'sdg-2026a', cat: 'competition', series: '联合国 SDG 发言人',
      name: 'ART FOR SDGs · 2026 秋季青少年领袖发言人',
      time: '2026 年 11–12 月', start: '2026-11-20',
      city: '线上初选 · 广州复选', ages: '6–17 岁',
      deadline: '11 月 8 日', status: 'open', href: 'sdg.html'
    },
    {
      id: 'mun-2027w', cat: 'competition', series: '破界 MUN',
      name: '破界 MUN · 2027 冬季校际会议',
      time: '待公布', start: '2027-01-15',
      city: '广州', ages: '初中 – 高中',
      deadline: '待公布', status: 'soon', href: 'mun.html'
    },
    {
      id: 'debate-2027', cat: 'competition', series: '华语辩论世界杯 · 亚青辩',
      name: '华语辩论世界杯 · 2027 岭南赛区',
      time: '待公布', start: '2027-03-20',
      city: '广州', ages: '小学 4 年级 – 高中',
      deadline: '待公布', status: 'soon', href: 'debate.html'
    },
    {
      id: 'youth-2027', cat: 'competition', series: '华语辩论世界杯 · 亚青辩',
      name: '亚青辩 · 2027 岭南赛区',
      time: '待公布', start: '2027-04-18',
      city: '广州', ages: '初中 – 高中',
      deadline: '待公布', status: 'soon', href: 'debate.html'
    },

    /* ── 展演 ─────────────────────────────────────────── */
    {
      id: 'bilingual-2026a', cat: 'showcase', series: '雏英杯',
      name: '雏英杯 · 2026 中英双语主持人大会',
      time: '2026 年 11–12 月', start: '2026-11-15',
      city: '线上初选 · 广州', ages: '4–15 岁',
      deadline: '11 月 8 日', status: 'open', href: 'bilingual.html'
    },
    {
      id: 'caocan-2027', cat: 'showcase', series: '曹灿杯',
      name: '曹灿杯 · 2027 广东展演',
      time: '2027 年 6 月', start: '2027-06-15',
      city: '广东 21 市', ages: '4–18 岁',
      deadline: '2027 年 3 月', status: 'soon', href: 'caocan.html'
    },
    {
      id: 'caocan-2026', cat: 'showcase', series: '曹灿杯',
      name: '曹灿杯 · 2026 广东省级展演',
      time: '2026 年 6 月', start: '2026-06-15',
      city: '广州', ages: '4–18 岁',
      deadline: '2026 年 3 月', status: 'done', href: 'caocan.html'
    },

    /* ── 考级 ─────────────────────────────────────────── */
    {
      id: 'brtv-2027w', cat: 'grading', series: '北京广播电视台考级',
      name: '北京广播电视台 · 2027 冬季语言类考级',
      time: '待公布', start: '2027-01-10',
      city: '广州', ages: '5 岁以上',
      deadline: '待公布', status: 'soon', href: 'brtv.html'
    },
    {
      id: 'zjcm-2027w', cat: 'grading', series: '浙江音乐学院考级',
      name: '浙江音乐学院 · 2027 冬季音乐类考级',
      time: '待公布', start: '2027-01-22',
      city: '广州', ages: '不限年龄',
      deadline: '待公布', status: 'soon', href: 'zjcm.html'
    },

    /* ── 研学 ─────────────────────────────────────────── */
    /* 日内瓦营的名额是「公开招募 10 人」，主办方没给报名截止日，
       按额满即止写；杭州研学跟雏英杯全国盛典同期，日期未定。 */
    {
      id: 'geneva-2027', cat: 'tour', series: '华语辩论世界杯 · 官方营地',
      name: '日内瓦联合国青年研学营',
      time: '2027 年 1 月 25 日 – 2 月 3 日', start: '2027-01-25',
      city: '瑞士 · 日内瓦 / 伯尔尼 / 苏黎世', ages: '青少年独立参营',
      deadline: '额满即止', status: 'open', href: 'tour-geneva.html'
    },
    {
      id: 'hangzhou-2027', cat: 'tour', series: '雏英杯',
      name: '雏英杯 · 科技与艺术主题研学',
      time: '2027 年 1 月下旬', start: '2027-01-22',
      city: '杭州', ages: '4–15 岁',
      deadline: '待公布', status: 'soon', href: 'bilingual.html#tour'
    }
  ];

  /* ---------- 工具 ---------- */

  function catById(id) {
    for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i];
    return null;
  }

  /* 状态分组优先，组内按活动开始日期升序 */
  function sortAll(list) {
    return list.slice().sort(function (a, b) {
      var d = STATUS[a.status].order - STATUS[b.status].order;
      if (d) return d;
      return String(a.start).localeCompare(String(b.start));
    });
  }

  function countIn(list, status) {
    return list.filter(function (p) { return p.status === status; }).length;
  }

  function meta(p) {
    return [p.time, p.city, p.ages].join('｜');
  }

  /* ---------- 模板 ---------- */

  /* 活动卡：图在上、字在下。
     图片位的 data-img 直接用活动 id，素材映射在 assets/media.js；
     没有登记 id 时 media.js 用 data-label / data-hint 兜底，加活动不会掉图。 */
  function card(p) {
    return '' +
      '<article class="pj-card">' +
        '<figure class="img-ph" data-img="' + p.id + '" data-label="' + p.series +
          '" data-hint="活动现场或舞台照片"></figure>' +
        '<div class="pj-body">' +
          '<span class="pj-st" data-s="' + p.status + '">' + STATUS[p.status].label + '</span>' +
          '<h3>' + p.name + '</h3>' +
          '<p class="pj-meta">' + meta(p) + '</p>' +
          '<p class="pj-dl">报名截止：' + p.deadline + '</p>' +
          '<a class="pj-go" href="' + p.href + '">查看详情' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>' +
          '</a>' +
        '</div>' +
      '</article>';
  }

  function row(p) {
    return '' +
      '<div class="pj-row">' +
        '<div class="pj-name">' +
          '<a href="' + p.href + '">' + p.name + '</a>' +
          '<span class="pj-series">' + p.series + '</span>' +
        '</div>' +
        '<div class="pj-col pj-col-meta">' + meta(p) + '</div>' +
        '<div class="pj-col pj-col-dl">报名截止<br><b>' + p.deadline + '</b></div>' +
        '<a class="pj-row-go" href="' + p.href + '">查看详情' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>' +
        '</a>' +
      '</div>';
  }

  function emptyBox(cat, inList) {
    if (inList) {
      return '<div class="pj-empty">这个系列下暂时没有项目。<button type="button" class="pj-empty-btn" data-reset>看全部' +
        cat.name + '</button></div>';
    }
    return '<div class="pj-empty">' + cat.name + '暂时没有开放场次。' +
      '新的场次会在这里更新，也可以直接电话问当期安排：' +
      '<a href="tel:18038829261">180 3882 9261</a>。</div>';
  }

  /* ---------- 活动与机会页：精选 ----------
     只用「报名中」的活动，按开始日期排，最多四条（两行两列）。
     一条都没有就整节隐藏——没有数据就不出精选区，不凑数。
     精选和下面四类共用同一张卡，不再另做「一大两小」的版式：
     同一页出现两种活动卡，读者会以为它们是两种东西。 */

  function featured(n) {
    return sortAll(LIST.filter(function (p) { return p.status === 'open'; })).slice(0, n || 4);
  }

  function mountFeatured() {
    var host = document.getElementById('featWrap');
    if (!host) return;
    var sec = document.getElementById('featured');
    var items = featured(4);

    if (!items.length) {
      if (sec) { sec.hidden = true; sec.setAttribute('data-empty', '1'); }
      return;
    }

    host.innerHTML = items.map(card).join('');
    if (sec) sec.hidden = false;
    if (global.CTMedia) global.CTMedia.mount(host);
  }

  /* ---------- 活动与机会页：每类前 4 条预览 ---------- */

  function mountPreview() {
    CATS.forEach(function (c) {
      var box = document.querySelector('[data-cat="' + c.id + '"]');
      if (!box) return;
      var live = sortAll(LIST.filter(function (p) {
        return p.cat === c.id && p.status !== 'done';
      })).slice(0, 4);

      if (!live.length) {
        box.innerHTML = '<div class="pj-empty">暂无开放报名的' + c.name + '活动。</div>';
        return;
      }
      box.innerHTML = '<div class="pj-grid">' + live.map(card).join('') + '</div>';
      if (global.CTMedia) global.CTMedia.mount(box);
    });
  }

  /* ---------- 品类页：完整行列表 + 分组 + 分页 + 系列筛选 ---------- */

  function mountCategory(catId) {
    var cat = catById(catId);
    var listEl = document.getElementById('pjList');
    var pageEl = document.getElementById('pjPage');
    var filterEl = document.getElementById('pjFilter');
    if (!cat || !listEl) return;

    var all = LIST.filter(function (p) { return p.cat === catId; });
    var state = { series: '', page: 1 };

    function seriesList() {
      var out = [];
      all.forEach(function (p) { if (out.indexOf(p.series) < 0) out.push(p.series); });
      return out;
    }

    function renderFilter() {
      if (!filterEl) return;
      var opts = seriesList();
      if (opts.length < 2) { filterEl.hidden = true; return; }
      filterEl.hidden = false;
      filterEl.innerHTML = '<b>活动系列</b>' +
        '<button type="button" data-s="" aria-pressed="' + (state.series === '' ? 'true' : 'false') + '">全部</button>' +
        opts.map(function (s) {
          return '<button type="button" data-s="' + s + '" aria-pressed="' +
            (state.series === s ? 'true' : 'false') + '">' + s + '</button>';
        }).join('');
    }

    function render() {
      var list = sortAll(all.filter(function (p) {
        return !state.series || p.series === state.series;
      }));

      if (!list.length) {
        listEl.innerHTML = emptyBox(cat, !!state.series);
        if (pageEl) pageEl.innerHTML = '';
        return;
      }

      var pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
      if (state.page > pages) state.page = pages;
      var from = (state.page - 1) * PAGE_SIZE;
      var slice = list.slice(from, from + PAGE_SIZE);

      var html = '';
      var last = '';
      slice.forEach(function (p) {
        if (p.status !== last) {
          html += '<div class="pj-grp"><b>' + STATUS[p.status].label + '</b>' +
            '<span>' + countIn(list, p.status) + ' 项</span></div>';
          last = p.status;
        }
        html += row(p);
      });
      listEl.innerHTML = html;

      if (pageEl) {
        if (pages < 2) { pageEl.innerHTML = ''; }
        else {
          var btns = '';
          for (var i = 1; i <= pages; i++) {
            btns += '<button type="button" data-p="' + i + '" aria-current="' +
              (i === state.page ? 'true' : 'false') + '">' + i + '</button>';
          }
          pageEl.innerHTML = '<button type="button" data-p="' + (state.page - 1) + '"' +
            (state.page === 1 ? ' disabled' : '') + '>上一页</button>' + btns +
            '<button type="button" data-p="' + (state.page + 1) + '"' +
            (state.page === pages ? ' disabled' : '') + '>下一页</button>';
        }
      }
    }

    if (filterEl) {
      filterEl.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b) return;
        state.series = b.getAttribute('data-s') || '';
        state.page = 1;
        renderFilter();
        render();
      });
    }
    if (pageEl) {
      pageEl.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b || b.disabled) return;
        var n = parseInt(b.getAttribute('data-p'), 10);
        if (!n || n < 1) return;
        state.page = n;
        render();
        var top = document.getElementById('pjList');
        if (top) window.scrollTo({ top: top.getBoundingClientRect().top + window.pageYOffset - 132, behavior: 'smooth' });
      });
    }
    listEl.addEventListener('click', function (e) {
      if (e.target.closest('[data-reset]')) {
        state.series = '';
        state.page = 1;
        renderFilter();
        render();
      }
    });

    renderFilter();
    render();
  }

  function boot() {
    if (document.body.classList.contains('page-activities')) {
      mountFeatured();
      mountPreview();
    }
    var host = document.querySelector('[data-pj-cat]');
    if (host) mountCategory(host.getAttribute('data-pj-cat'));
  }

  global.CTProjects = {
    cats: CATS, status: STATUS, list: LIST, featured: featured,
    sortAll: sortAll, mountPreview: mountPreview, mountCategory: mountCategory
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
