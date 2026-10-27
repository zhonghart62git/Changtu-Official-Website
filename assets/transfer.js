/* 畅途 · 学以致用
 * 首页「学以致用」板块的唯一数据源：6 个学科方向 + 3 个日常场景。
 * 改文案只动下面两个数组，HTML 一行不用碰。
 *
 * 学科从十项合并成六项之后，桌面 3 行、手机 6 行，一屏能看完，
 * 折叠那套（0fr → 1fr + inert）整套撤掉了，别再加回来。
 */
(function () {
  'use strict';

  /* 迁移学习：学科方向 + 一句说明 + 四个可迁移的方法。
     说明写「在什么场景里做什么」，方法写「能带走的具体动作」，
     两者分工，不重复。 */
  var SUBJECTS = [
    {
      name: '语文',
      desc: '在主持、演讲与辩论中提炼主题、筛选材料、组织论证，并根据对象调整语言。迁移到阅读理解、议论文写作、课堂发言与答辩。',
      method: ['主题提炼', '材料组织', '论证结构', '修辞表达']
    },
    {
      name: '英语',
      desc: '在双语主持、英语演讲、辩论与模联中听取关键信息，用英语复述、陈述、追问和回应，让词汇与语法进入真实沟通。',
      method: ['信息捕捉', '语块运用', '释义转述', '跨文化沟通']
    },
    {
      name: '数学与逻辑',
      desc: '通过概念界定、条件拆解、因果辨析和反例检验，判断一项主张是否成立，强化严谨推理、过程表达与数据意识。',
      method: ['概念界定', '条件分析', '逻辑推演', '反例检验']
    },
    {
      name: '人文社会（政史地）',
      desc: '在模联、辩论与研学中，从历史背景、制度规则、地域条件和多方利益分析议题，形成有依据的立场与解决方案。',
      method: ['背景研究', '多方视角', '因果分析', '政策论证']
    },
    {
      name: '科学探究',
      desc: '面对环境、健康、能源与科技议题，从现象中提出问题、识别变量、判断证据，并说明结论成立的条件与边界。',
      method: ['问题提出', '变量识别', '证据判断', '结论审慎']
    },
    {
      name: '信息科技',
      desc: '从课程准备到赛事、展演和项目成果，设计检索路径、核验信息来源、整理数据，并用图表、演示或数字作品呈现研究。',
      method: ['信息检索', '来源核验', '数据整理', '数字呈现']
    }
  ];

  /* 融入日常：离开课堂之后的三个场景。icon 只放路径，外壳由 icon() 统一包。 */
  var DAILY = [
    {
      name: '课堂表达',
      desc: '敢于提问与发言，能够说清观点、依据和思考过程。',
      icon: '<rect x="3" y="4" width="18" height="12.5" rx="2"/><path d="M8 20.5h8M12 16.5v4"/>'
    },
    {
      name: '项目协作',
      desc: '在分工、讨论与复盘中学会倾听、协商，并对共同结果负责。',
      icon: '<circle cx="12" cy="6.5" r="2.4"/><circle cx="6" cy="17" r="2.4"/>' +
        '<circle cx="18" cy="17" r="2.4"/><path d="M10.8 8.6 7.2 14.9M13.2 8.6l3.6 6.3M8.4 17h7.2"/>'
    },
    {
      name: '独立行动',
      desc: '面对陌生任务，能够查找信息、判断取舍，把想法推进为行动。',
      icon: '<circle cx="12" cy="12" r="8.6"/><path d="M12 16.4V7.9M8.6 11.3 12 7.9l3.4 3.4"/>'
    }
  ];

  function icon(path) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + '</svg>';
  }

  function subjectHtml(s) {
    /* 方法词单独成 span：窄屏折行时整词换行，不会把「修辞表达」劈成两半。
       分隔符挂在词的 ::before 上，跟着词走，行尾不会孤零零留一根竖线。 */
    var method = s.method.map(function (w) { return '<i>' + w + '</i>'; }).join('');
    return '<div class="tr-s" role="listitem">' +
      '<b>' + s.name + '</b>' +
      '<p>' + s.desc + '</p>' +
      '<p class="tr-m"><span class="tr-mk">方法</span>' + method + '</p>' +
      '</div>';
  }

  function dailyHtml(d) {
    return '<div class="tr-d" role="listitem">' +
      '<span class="tr-di" aria-hidden="true">' + icon(d.icon) + '</span>' +
      '<div><b>' + d.name + '</b><p>' + d.desc + '</p></div>' +
      '</div>';
  }

  function init() {
    var subj = document.querySelector('[data-transfer="subjects"]');
    var daily = document.querySelector('[data-transfer="daily"]');
    if (subj) subj.innerHTML = SUBJECTS.map(subjectHtml).join('');
    if (daily) daily.innerHTML = DAILY.map(dailyHtml).join('');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
