/* 畅途 · 未来领袖 —— 咨询留资数据层 + 轻埋点
 *
 * ── 数据现在提交到哪里 ──────────────────────────────────────────
 * 本项目目前没有留资后端。CT.Lead.ENDPOINT 为空时，提交写入本机
 * localStorage['changtu_lead_v1']，控制台会打出「未接后端」的提示。
 * 写入成功才返回成功：隐私模式、配额满、接口报错都走失败分支，
 * 页面不会在数据没落下来的情况下显示「已收到」。
 *
 * ── 接入真实后端时只改 ENDPOINT ────────────────────────────────
 *   1. 把 ENDPOINT 设为接口地址，例如 '/api/leads'
 *   2. 接口约定：
 *        POST {ENDPOINT}
 *        Content-Type: application/json
 *        body: {
 *          intent,       // child | school | venue
 *          intentLabel,  // 中文选项原文，便于后台直接看
 *          age,          // 孩子的年龄或年级；intent=child 时必填
 *          topics,       // string[]；intent=child 时选填
 *          org,          // 单位名称；intent=school|venue 时必填
 *          need,         // 合作需求，选填，≤200 字
 *          name, phone,
 *          source,       // 来源标识，如 index#contact
 *          page, ua, ts
 *        }
 *        成功：HTTP 2xx 且 { ok: true, id: "..." }
 *        失败：非 2xx 或 { ok: false, message: "..." }，message 直接显示给用户
 *   3. 服务端还要补三件事：
 *        · 手机号二次校验（前端校验不算数）
 *        · 限流：同 IP / 同号码 60 秒 1 次
 *        · 隐私政策版本留痕（请求体加 consentVersion）
 */
(function (global) {
  'use strict';

  var CT = global.CT = global.CT || {};

  var KEY = 'changtu_lead_v1';
  var ENDPOINT = '';          /* 留空 = 只落本机，等后端就位再填 */
  var TIMEOUT = 12000;

  var INTENTS = {
    child: '孩子的课程或活动',
    school: '学校或机构合作',
    venue: '场地或活动合作'
  };

  function trim(v) {
    return String(v == null ? '' : v).replace(/^\s+|\s+$/g, '');
  }

  function normPhone(p) {
    return String(p || '').replace(/[\s-]/g, '');
  }

  /* ── 校验：字段名 → 提示文案。页面拿到后逐字段挂到对应控件下方 ── */
  function validate(d) {
    var e = {};
    if (!d.intent) {
      e.intent = '请选择咨询类型';
    } else if (d.intent === 'child') {
      if (!trim(d.age)) e.age = '请填写孩子的年龄或年级';
    } else {
      if (!trim(d.org)) e.org = '请填写单位名称';
    }
    if (!trim(d.name)) e.name = '请填写您的称呼';
    if (!/^1[3-9]\d{9}$/.test(normPhone(d.phone))) e.phone = '请填写正确的手机号';
    return e;
  }

  /* ── 本机存储 ── */
  function readAll() {
    try {
      var raw = global.localStorage.getItem(KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Object.prototype.toString.call(list) === '[object Array]' ? list : [];
    } catch (e) {
      return [];
    }
  }

  function writeAll(list) {
    /* 配额满或隐私模式会 throw，故意不吞，让上层走失败分支 */
    global.localStorage.setItem(KEY, JSON.stringify(list));
  }

  function newId() {
    return 'L' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function buildRow(form, source) {
    var intent = form.intent || '';
    var isChild = intent === 'child';
    return {
      id: newId(),
      intent: intent,
      intentLabel: INTENTS[intent] || '',
      age: isChild ? trim(form.age) : '',
      topics: isChild && form.topics && form.topics.length ? form.topics.slice() : [],
      org: isChild ? '' : trim(form.org),
      need: isChild ? '' : trim(form.need).slice(0, 200),
      name: trim(form.name),
      phone: normPhone(form.phone),
      source: source || '',
      page: global.location ? global.location.href : '',
      ua: global.navigator ? global.navigator.userAgent : '',
      ts: new Date().toISOString()
    };
  }

  /* ── 真实接口 ── */
  function post(row) {
    var ctl = typeof global.AbortController !== 'undefined' ? new global.AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, TIMEOUT);

    return global.fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row),
      signal: ctl ? ctl.signal : undefined
    }).then(function (res) {
      clearTimeout(timer);
      return res.json().catch(function () { return {}; }).then(function (body) {
        if (!res.ok || body.ok === false) {
          throw new Error(body.message || ('提交失败（HTTP ' + res.status + '），请稍后重试'));
        }
        return body.id || row.id;
      });
    }, function (err) {
      clearTimeout(timer);
      if (err && err.name === 'AbortError') throw new Error('提交超时，请检查网络后重试');
      throw new Error('网络连接失败，请检查网络后重试');
    });
  }

  /* ── 提交：成功 resolve(id)，失败 reject(Error)，校验不过时 Error.fields ── */
  function submit(form, opts) {
    opts = opts || {};
    return new Promise(function (resolve, reject) {
      var fields = validate(form);
      if (Object.keys(fields).length) {
        var e = new Error('请检查填写的内容');
        e.fields = fields;
        return reject(e);
      }

      var row = buildRow(form, opts.source);

      if (!ENDPOINT) {
        try {
          var list = readAll();
          list.push(row);
          writeAll(list);
        } catch (err) {
          return reject(new Error('本机存储写入失败，请换一个浏览器或关闭无痕模式后重试'));
        }
        if (global.console && console.warn) {
          console.warn('[CT.Lead] 未配置留资接口，本条已存入 localStorage["' + KEY + '"]。' +
            '上线前请在 assets/lead.js 把 ENDPOINT 指向后端。', row);
        }
        return resolve(row.id);
      }

      post(row).then(resolve, reject);
    });
  }

  CT.Lead = {
    KEY: KEY,
    INTENTS: INTENTS,
    isConfigured: function () { return !!ENDPOINT; },
    validate: validate,
    submit: submit,
    /* 后台/运营导出用：拿到本机已提交的全部记录 */
    all: readAll
  };

  /* ── 轻埋点 ──
     项目没有 GA / GTM。这里只做统一出口：有 dataLayer 就推进去，
     同时在 window.__ct_events 留一份（上限 200 条），方便本地核对。
     接第三方统计时改这一个函数，页面里的调用不用动。 */
  CT.track = function (name, props) {
    var ev = { name: name, ts: Date.now() };
    if (props) {
      for (var k in props) {
        if (Object.prototype.hasOwnProperty.call(props, k)) ev[k] = props[k];
      }
    }
    try {
      var buf = global.__ct_events = global.__ct_events || [];
      buf.push(ev);
      if (buf.length > 200) buf.shift();
      if (global.dataLayer && typeof global.dataLayer.push === 'function') {
        var dl = { event: name };
        for (var j in props) {
          if (Object.prototype.hasOwnProperty.call(props, j)) dl[j] = props[j];
        }
        global.dataLayer.push(dl);
      }
    } catch (e) { /* 埋点失败不能影响提交 */ }
    if (global.console && console.debug) console.debug('[ct]', name, props || '');
  };
})(typeof window !== 'undefined' ? window : this);
