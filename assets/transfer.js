/* 畅途 · 学以致用
 * 首页「学以致用」板块的唯一数据源：6 个学科方向 + 3 个日常场景。
 * 改文案只动下面两个数组，HTML 一行不用碰。
 *
 * 6 个学科按方向合并（政史地并成人文社会，理化生并成科学探究），
 * 2 列 3 行排完，桌面和手机都不需要折叠。
 */
(function () {
  'use strict';

  /* 每项一句说明：前半句写「在什么场景里做什么」，后半句写「带走什么」。 */
  var SUBJECTS = [
    {
      name: '语文',
      desc: '在主持、演讲与辩论中完成主旨提炼、论证组织与质疑回应，迁移到阅读理解、写作和课堂表达。'
    },
    {
      name: '英语',
      desc: '在双语主持、英语演讲与模联中练习听辨、释义转述和即席回应，让词汇与语法转化为真实沟通能力。'
    },
    {
      name: '数学与逻辑',
      desc: '在辩题分析、项目研究与数据判断中界定概念、拆解条件、辨析因果并检验反例，形成严谨推理习惯。'
    },
    {
      name: '人文社会（政史地）',
      desc: '在模联、研学与公共议题讨论中连接历史背景、制度规则、地域条件和多方利益，形成有依据的判断。'
    },
    {
      name: '科学探究',
      desc: '围绕环境、健康、能源与科技议题提出问题、识别变量、判断证据，并认识结论成立的条件与边界。'
    },
    {
      name: '信息科技',
      desc: '在课程准备、项目研究与成果展示中设计检索路径、核验来源、整理数据，并用数字工具呈现结论。'
    }
  ];

  /* 融入日常：离开课堂之后的三个场景，横排成一条深色带。 */
  var DAILY = [
    {
      name: '课堂表达',
      desc: '敢于提问与发言，能够说清观点、依据和思考过程。'
    },
    {
      name: '项目协作',
      desc: '在分工、讨论与复盘中学会倾听、协商并对结果负责。'
    },
    {
      name: '独立行动',
      desc: '面对陌生任务，能够查找信息、判断取舍，把想法推进为行动。'
    }
  ];

  function subjectHtml(s) {
    return '<div class="tr-s" role="listitem"><b>' + s.name + '</b><p>' + s.desc + '</p></div>';
  }

  function dailyHtml(d) {
    return '<div class="tr-d" role="listitem"><b>' + d.name + '</b><p>' + d.desc + '</p></div>';
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
