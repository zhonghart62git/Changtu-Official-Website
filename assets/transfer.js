/* 畅途 · 学以致用
 * 首页「学以致用」板块的唯一数据源：10 个学科 + 4 个日常场景。
 * 改文案只动下面两个数组，HTML 一行不用碰。
 *
 * 窄屏默认只露前 6 个学科，其余收在「查看全部学科」后面；
 * 桌面端一律全开，不靠脚本控制——CSS 的 min-width:761px 直接给 1fr。
 * 折叠用 grid-template-rows:0fr → 1fr，和 FAQ 同一套，能平滑过渡。
 */
(function () {
  'use strict';

  /* 反哺学科：学科名 + 一句话说明。说明控制在一到两行，不写成长段落。 */
  var SUBJECTS = [
    { name: '语文', desc: '提炼主旨、分析论证、组织材料，让阅读、作文和课堂表达更有条理。' },
    { name: '英语', desc: '在真实议题中训练听说读写、即席回应与跨文化表达。' },
    { name: '数学', desc: '强化条件意识、逻辑推演、反例思维与数据判断。' },
    { name: '历史', desc: '理解时代背景、因果关系与不同群体的立场。' },
    { name: '地理', desc: '综合地图、人口、资源、气候与贸易信息分析区域问题。' },
    { name: '道法／政治', desc: '理解权利责任、公共规则、政策协商与国际组织。' },
    { name: '物理', desc: '识别变量和适用条件，运用规律与证据解释现象。' },
    { name: '化学', desc: '重视实验条件、变量控制、证据判断与结论边界。' },
    { name: '生物', desc: '建立系统思维，分析生态、健康、技术与科学伦理。' },
    { name: '信息科技', desc: '提升资料检索、来源核验、数据整理与可视化表达。' }
  ];

  /* 融入日常：离开课堂之后的四个场景。icon 只放路径，外壳由 ICON() 统一包。 */
  var DAILY = [
    {
      name: '课堂学习',
      desc: '敢提问、会发言，能够清楚说明自己的思考过程。',
      icon: '<rect x="3" y="4" width="18" height="12.5" rx="2"/><path d="M8 20.5h8M12 16.5v4"/>'
    },
    {
      name: '项目协作',
      desc: '学会倾听、分工、协商，并对共同结果负责。',
      icon: '<circle cx="12" cy="6.5" r="2.4"/><circle cx="6" cy="17" r="2.4"/>' +
        '<circle cx="18" cy="17" r="2.4"/><path d="M10.8 8.6 7.2 14.9M13.2 8.6l3.6 6.3M8.4 17h7.2"/>'
    },
    {
      name: '人际沟通',
      desc: '准确表达需求、理解差异，理性处理分歧。',
      icon: '<path d="M21 11.5a8.4 8.4 0 0 1-8.4 8.4H8l-4.4 2.8V11.5A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z"/>' +
        '<circle cx="8.5" cy="11" r=".9"/><circle cx="12" cy="11" r=".9"/><circle cx="15.5" cy="11" r=".9"/>'
    },
    {
      name: '独立成长',
      desc: '面对陌生任务，能够搜集信息、作出判断并付诸行动。',
      icon: '<circle cx="12" cy="12" r="8.6"/><path d="M12 16.4V7.9M8.6 11.3 12 7.9l3.4 3.4"/>'
    }
  ];

  /* 窄屏默认露出的学科条数。10 条排满会让手机端这一屏长得离谱。 */
  var PEEK = 6;

  function icon(path) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + '</svg>';
  }

  function subjectHtml(s) {
    return '<div class="tr-s" role="listitem"><b>' + s.name + '</b><p>' + s.desc + '</p></div>';
  }

  function dailyHtml(d) {
    return '<div class="tr-d" role="listitem">' +
      '<span class="tr-di" aria-hidden="true">' + icon(d.icon) + '</span>' +
      '<div><b>' + d.name + '</b><p>' + d.desc + '</p></div>' +
      '</div>';
  }

  function fill(sel, html) {
    var el = document.querySelector(sel);
    if (el) el.innerHTML = html;
  }

  function init() {
    fill('[data-transfer="subjects"]', SUBJECTS.slice(0, PEEK).map(subjectHtml).join(''));
    fill('[data-transfer="subjects-more"]', SUBJECTS.slice(PEEK).map(subjectHtml).join(''));
    fill('[data-transfer="daily"]', DAILY.map(dailyHtml).join(''));

    var btn = document.querySelector('[data-transfer-toggle]');
    var more = document.getElementById('trMore');
    if (!btn || !more) return;
    var label = btn.querySelector('[data-transfer-label]');
    var mq = window.matchMedia('(max-width:760px)');

    /* 收起时置 inert：Tab 跳不进去，读屏也不念折叠内容。
       桌面端一直展开，靠 CSS 的 1fr 兜底，这里同步把 inert 摘掉。 */
    function setOpen(open) {
      more.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (label) label.textContent = open ? '收起学科' : '查看全部学科';
      if (open) more.removeAttribute('inert');
      else more.setAttribute('inert', '');
    }

    setOpen(!mq.matches);

    if (mq.addEventListener) {
      mq.addEventListener('change', function (e) { setOpen(!e.matches); });
    } else if (mq.addListener) {
      mq.addListener(function (e) { setOpen(!e.matches); });
    }

    btn.addEventListener('click', function () {
      setOpen(btn.getAttribute('aria-expanded') !== 'true');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
