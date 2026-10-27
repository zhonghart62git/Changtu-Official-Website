/* 畅途 · 未来领袖 —— 报名 / 场次 / 缴费 数据层
 * 本文件是唯一的数据出入口：页面只调 CT.API，不直接碰存储。
 * 当前为本地存储实现（localStorage），接口全部返回 Promise，
 * 后续接入云数据库时只需替换 CT.Backend 的实现，页面代码不用改。
 */
(function (global) {
  'use strict';

  var KEY = 'changtu_leader_v1';

  /* ========== 业务线（与官网七大业务一一对应） ========== */
  var ACTIVITIES = [
    {
      id: 'caocan', no: '01', name: '曹灿杯', cat: '朗诵展演',
      full: '曹灿杯 · 青少年朗诵展示活动',
      fee: 280, open: true,
      groups: ['幼儿组（4-6 岁）', '少儿A组（7-9 岁）', '少儿B组（10-12 岁）', '少年组（13-15 岁）', '青年组（16-18 岁）'],
      items: ['朗诵', '主持', '演讲'],
      note: '广东展区报名费，含市级展区参评、评审与证书。晋级省级展演另按通知缴纳。'
    },
    {
      id: 'debate', no: '02', name: '辩论世界杯', cat: '思辨赛事',
      full: '华语辩论世界杯 · 亚青辩岭南挑战赛',
      fee: 380, open: true,
      groups: ['小学组（1V1）', '小学组（2V2）', '初中组（1V1）', '初中组（2V2）', '高中组（2V2）'],
      items: ['1V1 个人赛', '2V2 团队赛'],
      note: '含赛前 2 次训练、比赛日场次与赛事证书。2V2 按队伍计费，由队长统一报名。'
    },
    {
      id: 'bilingual', no: '03', name: '雏英杯', cat: '双语赛道',
      full: '雏英杯 · 中英双语青少年主持人大会',
      fee: 320, open: true,
      groups: ['幼儿组（4-6 岁）', '小学低年级组', '小学高年级组', '初中组'],
      items: ['主持', '配音', '朗诵', '即兴表达', '中考英语口语模拟'],
      note: '含初赛评审与双语能力测评报告。省展入选者另行通知。'
    },
    {
      id: 'sdg', no: '04', name: '联合国领袖发言人', cat: '国际赛道',
      full: 'ART FOR SDGs · 联合国青少年领袖发言人',
      fee: 680, open: true,
      groups: ['儿童组（6-11 岁）', '少年组（12-17 岁）', '青年组（18-35 岁）'],
      items: ['中文演讲', '英文演讲', '双语演讲'],
      note: '含线上初选评审、SDG 议题辅导 2 次、入围证书。'
    },
    {
      id: 'brtv', no: '05', name: '北广考级', cat: '语言认证',
      full: '北京广播电视台 · 语言类社会艺术水平考级',
      fee: 260, open: true,
      groups: ['1-3 级', '4-6 级', '7-8 级', '9-10 级'],
      items: ['主持', '朗诵', '戏剧（课本剧）'],
      note: '按级别收费，1-3 级 260 元，4-6 级 320 元，7-10 级 380 元。报名时按实际级别结算。'
    },
    {
      id: 'zjcm', no: '06', name: '浙音考级', cat: '音乐认证',
      full: '浙江音乐学院 · 社会艺术水平考级',
      fee: 280, open: true,
      groups: ['1-3 级', '4-6 级', '7-8 级', '9-10 级', '音乐基础知识'],
      items: ['钢琴', '古筝', '二胡', '竹笛', '小提琴', '萨克斯', '单簧管', '长笛', '少儿歌唱', '美声', '民族', '通俗', '爵士鼓'],
      note: '专业术科按级别收费；音乐基础知识初级 220 元 / 中级 300 元 / 高级 400 元。7 级及以上须逐级报考。'
    },
    {
      // 费用未定：mun.html 的两个「立刻报名」按钮带 ?act=mun 进来，
      // 目录里没有 mun 就会退回「请选择报名项目」，等于按钮点不通。
      // fee 先留 null，页面显示「按当期简章」，拿到准数直接填这里。
      id: 'mun', no: '07', name: '模拟联合国', cat: '模联赛道',
      kind: 'course',
      full: '模拟联合国 · 六阶课程体系（L0–L5）',
      fee: null, open: true,
      groups: ['L0 观察员（12 课时）', 'L1 见习代表（16 课时）', 'L2 正式代表（24 课时）',
               'L3 进阶代表（32 课时）', 'L4 竞赛代表（36 课时）', 'L5 主席团（36 课时）'],
      items: ['研·议题国家', '辨·立场论证', '写·文件条款', '说·演讲结构',
              '规·议事规则', '商·磋商结盟', '会·全真会议', '复·复盘归档'],
      note: '中英双轨，唯一换轨点在 L2 结业。费用与开班时间按当期招生简章，提交后老师联系确认。'
    }
  ];

  /* ========== 默认场次（可在后台增删改） ========== */
  var DEFAULT_SESSIONS = [
    { id: 'S-caocan-01', act: 'caocan', date: '2026-12-05', time: '09:00-12:00', place: '广州市 · 天河区（详细地址报名后短信通知）', cap: 120, tag: '市级展区 · 上午场' },
    { id: 'S-caocan-02', act: 'caocan', date: '2026-12-05', time: '14:00-17:30', place: '广州市 · 天河区（详细地址报名后短信通知）', cap: 120, tag: '市级展区 · 下午场' },
    { id: 'S-caocan-03', act: 'caocan', date: '2026-12-06', time: '09:00-12:00', place: '广州市 · 越秀区（详细地址报名后短信通知）', cap: 100, tag: '市级展区 · 越秀专场' },
    { id: 'S-debate-01', act: 'debate', date: '2027-01-02', time: '09:00-18:00', place: '广州市 · 大学城（详细地址报名后短信通知）', cap: 64, tag: '元旦挑战赛 · 第一天' },
    { id: 'S-debate-02', act: 'debate', date: '2027-01-03', time: '09:00-17:00', place: '广州市 · 大学城（详细地址报名后短信通知）', cap: 64, tag: '元旦挑战赛 · 第二天' },
    { id: 'S-bilingual-01', act: 'bilingual', date: '2026-11-22', time: '09:00-12:30', place: '广州市 · 海珠区（详细地址报名后短信通知）', cap: 90, tag: '初赛 · 上午场' },
    { id: 'S-bilingual-02', act: 'bilingual', date: '2026-11-22', time: '13:30-17:30', place: '广州市 · 海珠区（详细地址报名后短信通知）', cap: 90, tag: '初赛 · 下午场' },
    { id: 'S-bilingual-03', act: 'bilingual', date: '2026-12-13', time: '09:00-17:00', place: '广州市 · 待定（省展）', cap: 150, tag: '省展 · 晋级选手' },
    { id: 'S-sdg-01', act: 'sdg', date: '2026-11-29', time: '14:00-18:00', place: '线上（腾讯会议，链接报名后发放）', cap: 200, tag: '线上海选 · 第一场' },
    { id: 'S-sdg-02', act: 'sdg', date: '2026-12-20', time: '14:00-18:00', place: '线上（腾讯会议，链接报名后发放）', cap: 200, tag: '线上海选 · 第二场' },
    { id: 'S-brtv-01', act: 'brtv', date: '2026-12-27', time: '09:00-17:00', place: '广州市 · 考区指定考点（详细地址报名后通知）', cap: 160, tag: '冬季考期 · 第一天' },
    { id: 'S-brtv-02', act: 'brtv', date: '2027-01-17', time: '09:00-17:00', place: '广州市 · 考区指定考点（详细地址报名后通知）', cap: 160, tag: '冬季考期 · 第二天' },
    { id: 'S-zjcm-01', act: 'zjcm', date: '2027-01-10', time: '全天（按准考证分批）', place: '线上视频评审 + 广州考点复核', cap: 300, tag: '寒假批次' },
    { id: 'S-zjcm-02', act: 'zjcm', date: '2027-02-07', time: '全天（按准考证分批）', place: '线上视频评审 + 广州考点复核', cap: 300, tag: '春季批次' },
  ];

  var DEFAULT_SETTINGS = {
    brand: '畅途 · 未来领袖',
    tel: '180 3882 9261',
    tel2: '180 3882 9262',
    payee: '广州畅途文化科技有限公司',
    payNote: '转账请务必备注「订单号 + 学员姓名」，到账后 1 个工作日内后台确认。',
    wechat: '18038829261',
    enrollOpen: true,
    adminPass: 'changtu2026'
  };

  /* ========== 存储层 ========== */
  var memory = null;
  var hasLS = (function () {
    try {
      var t = '__ct__';
      localStorage.setItem(t, '1');
      localStorage.removeItem(t);
      return true;
    } catch (e) { return false; }
  })();

  function seed() {
    return {
      v: 1,
      settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
      sessions: JSON.parse(JSON.stringify(DEFAULT_SESSIONS)),
      orders: [],
      seq: 0
    };
  }

  function read() {
    if (!hasLS) return memory || (memory = seed());
    var raw = localStorage.getItem(KEY);
    if (!raw) {
      var fresh = seed();
      localStorage.setItem(KEY, JSON.stringify(fresh));
      return fresh;
    }
    try {
      var db = JSON.parse(raw);
      if (!db || !db.settings) throw new Error('bad');
      if (!Array.isArray(db.sessions) || !db.sessions.length) db.sessions = JSON.parse(JSON.stringify(DEFAULT_SESSIONS));
      if (!Array.isArray(db.orders)) db.orders = [];
      if (typeof db.seq !== 'number') db.seq = 0;
      // 新增业务线时补齐默认场次
      return db;
    } catch (e) {
      var reset = seed();
      localStorage.setItem(KEY, JSON.stringify(reset));
      return reset;
    }
  }

  function write(db) {
    if (!hasLS) { memory = db; return; }
    localStorage.setItem(KEY, JSON.stringify(db));
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ========== 工具 ========== */
  function pad(n, w) { n = String(n); while (n.length < w) n = '0' + n; return n; }

  function makeCode(db) {
    var d = new Date();
    var stamp = String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1, 2) + pad(d.getDate(), 2);
    var prefix = 'CT' + stamp + '-';
    var used = {};
    db.orders.forEach(function (o) { used[o.code] = 1; });
    var n;
    do {
      db.seq = (db.seq || 0) + 1;
      n = prefix + pad(db.seq, 4);
      if (db.seq > 9000) { db.seq = 0; }
    } while (used[n]);
    return n;
  }

  function nowISO() { return new Date().toISOString(); }

  function actById(id) {
    for (var i = 0; i < ACTIVITIES.length; i++) if (ACTIVITIES[i].id === id) return ACTIVITIES[i];
    return null;
  }

  function normPhone(p) { return String(p || '').replace(/\s|-/g, ''); }

  function validPhone(p) { return /^1\d{10}$/.test(normPhone(p)); }

  /* ========== 业务接口 ========== */
  var API = {};

  API.activities = function () {
    var db = read();
    return ACTIVITIES.map(function (a) {
      var s = db.sessions.filter(function (x) { return x.act === a.id; });
      var booked = 0;
      s.forEach(function (x) { booked += bookCount(db, x.id); });
      return Object.assign({}, a, {
        sessionCount: s.length,
        booked: booked,
        sessionCap: s.reduce(function (sum, x) { return sum + (x.cap || 0); }, 0)
      });
    });
  };

  function bookCount(db, sid) {
    return db.orders.filter(function (o) {
      return o.sessionId === sid && o.status !== 'cancelled' && o.status !== 'refunded';
    }).length;
  }

  /* 同步版：后台渲染用 */
  API.sessionsSync = function (actId) {
    var db = read();
    var list = db.sessions.filter(function (s) { return !actId || s.act === actId; });
    return list.map(function (s) {
      var used = bookCount(db, s.id);
      return Object.assign({}, s, {
        used: used,
        left: Math.max(0, (s.cap || 0) - used),
        full: (s.cap || 0) - used <= 0
      });
    });
  };

  /* 异步版：学员端页面统一用 then 调用 */
  API.sessions = function (actId) { return Promise.resolve(API.sessionsSync(actId)); };

  API.settings = function () {
    var db = read();
    var s = Object.assign({}, db.settings);
    delete s.adminPass;
    return s;
  };

  /* 提交报名 */
  API.submit = function (form) {
    return new Promise(function (resolve, reject) {
      var db = read();
      if (!db.settings.enrollOpen) return reject(new Error('当前未开放线上报名，请电话联系。'));
      var act = actById(form.act);
      if (!act) return reject(new Error('请选择要报名的项目。'));
      if (!form.student || !String(form.student).trim()) return reject(new Error('请填写学员姓名。'));
      if (!validPhone(form.phone)) return reject(new Error('请填写正确的 11 位家长手机号。'));
      if (!form.parent || !String(form.parent).trim()) return reject(new Error('请填写家长姓名。'));
      if (!form.group) return reject(new Error('请选择参赛组别。'));

      // 费用未定的项目（fee 为 null）保留 null，不要折算成 0，
      // 否则「按当期简章」会被记成 ¥0，在 my.html 与复制文案里都难看。
      var rawFee = form.fee != null ? form.fee : act.fee;
      var fee = rawFee == null ? null : (Number(rawFee) || 0);
      var order = {
        code: makeCode(db),
        act: act.id,
        actName: act.full,
        actShort: act.name,
        group: form.group,
        item: form.item || '',
        student: String(form.student).trim(),
        gender: form.gender || '',
        age: form.age || '',
        grade: form.grade || '',
        parent: String(form.parent).trim(),
        phone: normPhone(form.phone),
        city: form.city || '',
        school: form.school || '',
        teacher: form.teacher || '',
        note: form.note || '',
        fee: fee,
        status: 'pending',
        sessionId: null,
        createdAt: nowISO(),
        paidAt: null,
        updatedAt: nowISO(),
        channel: form.channel || 'web'
      };
      db.orders.unshift(order);
      write(db);
      resolve(clone(order));
    });
  };

  /* 查询自己的报名：手机号必填，报名号可选（填了更精确） */
  API.query = function (phone, code) {
    return new Promise(function (resolve, reject) {
      var db = read();
      if (!validPhone(phone)) return reject(new Error('请填写报名时使用的 11 位手机号。'));
      var p = normPhone(phone);
      var c = String(code || '').trim().toUpperCase();
      var list = db.orders.filter(function (o) {
        if (o.phone !== p) return false;
        if (c && String(o.code).toUpperCase() !== c) return false;
        return true;
      });
      list = list.map(function (o) { return decorate(db, clone(o)); });
      resolve(list);
    });
  };

  function decorate(db, o) {
    var act = actById(o.act);
    o.actData = act ? { name: act.name, cat: act.cat, items: act.items, note: act.note } : null;
    if (o.sessionId) {
      var s = db.sessions.filter(function (x) { return x.id === o.sessionId; })[0];
      o.session = s ? clone(s) : null;
    }
    return o;
  }

  /* 选场次 / 改期 */
  API.chooseSession = function (code, phone, sessionId) {
    return new Promise(function (resolve, reject) {
      var db = read();
      var p = normPhone(phone);
      var idx = -1;
      for (var i = 0; i < db.orders.length; i++) {
        if (String(db.orders[i].code).toUpperCase() === String(code).toUpperCase()) { idx = i; break; }
      }
      if (idx < 0) return reject(new Error('没有找到这个报名号。'));
      var o = db.orders[idx];
      if (o.phone !== p) return reject(new Error('手机号与报名记录不一致，无法修改场次。'));
      if (o.status === 'refunded' || o.status === 'cancelled') return reject(new Error('该报名已取消或已退款，不能选择场次。'));

      var s = db.sessions.filter(function (x) { return x.id === sessionId; })[0];
      if (!s) return reject(new Error('场次不存在。'));
      if (s.act !== o.act) return reject(new Error('这个场次不属于你报名的项目。'));


      o.sessionId = s.id;
      o.updatedAt = nowISO();
      write(db);
      resolve(decorate(db, clone(o)));
    });
  };

  /* 用户自己撤场次 */
  API.clearSession = function (code, phone) {
    return new Promise(function (resolve, reject) {
      var db = read();
      var p = normPhone(phone);
      var o = db.orders.filter(function (x) { return String(x.code).toUpperCase() === String(code).toUpperCase(); })[0];
      if (!o) return reject(new Error('没有找到这个报名号。'));
      if (o.phone !== p) return reject(new Error('手机号与报名记录不一致。'));
      o.sessionId = null;
      o.updatedAt = nowISO();
      write(db);
      resolve(decorate(db, clone(o)));
    });
  };

  /* ========== 后台 ========== */
  var Admin = {};

  Admin.login = function (pass) {
    var db = read();
    return Promise.resolve(String(pass) === String(db.settings.adminPass));
  };

  Admin.stats = function () {
    var db = read();
    var s = { total: 0, pending: 0, paid: 0, refunded: 0, picked: 0, amount: 0, paidAmount: 0 };
    db.orders.forEach(function (o) {
      if (o.status === 'refunded' || o.status === 'cancelled') { s.refunded++; return; }
      s.total++;
      if (o.status === 'paid') { s.paid++; s.paidAmount += Number(o.fee) || 0; }
      else s.pending++;
      if (o.sessionId) s.picked++;
      s.amount += Number(o.fee) || 0;
    });
    s.byAct = ACTIVITIES.map(function (a) {
      var rows = db.orders.filter(function (o) { return o.act === a.id && o.status !== 'refunded' && o.status !== 'cancelled'; });
      var paid = rows.filter(function (o) { return o.status === 'paid'; });
      return {
        id: a.id, name: a.name,
        count: rows.length,
        paid: paid.length,
        amount: paid.reduce(function (x, o) { return x + (Number(o.fee) || 0); }, 0)
      };
    });
    return s;
  };

  Admin.orders = function (filter) {
    var db = read();
    filter = filter || {};
    var rows = db.orders.slice();
    if (filter.act) rows = rows.filter(function (o) { return o.act === filter.act; });
    if (filter.status) {
      if (filter.status === 'active') rows = rows.filter(function (o) { return o.status !== 'refunded' && o.status !== 'cancelled'; });
      else rows = rows.filter(function (o) { return o.status === filter.status; });
    }
    if (filter.session === 'picked') rows = rows.filter(function (o) { return !!o.sessionId; });
    if (filter.session === 'unpicked') rows = rows.filter(function (o) { return !o.sessionId; });
    if (filter.q) {
      var q = String(filter.q).trim().toLowerCase();
      rows = rows.filter(function (o) {
        return [o.code, o.student, o.parent, o.phone, o.school, o.actShort].join(' ').toLowerCase().indexOf(q) >= 0;
      });
    }
    rows.sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; });
    return rows.map(function (o) { return decorate(db, clone(o)); });
  };

  Admin.setStatus = function (code, status) {
    return new Promise(function (resolve, reject) {
      var db = read();
      var o = db.orders.filter(function (x) { return String(x.code).toUpperCase() === String(code).toUpperCase(); })[0];
      if (!o) return reject(new Error('订单不存在。'));
      if (['pending', 'paid', 'refunded', 'cancelled'].indexOf(status) < 0) return reject(new Error('状态非法。'));
      o.status = status;
      o.paidAt = status === 'paid' ? nowISO() : (status === 'pending' ? null : o.paidAt);
      o.updatedAt = nowISO();
      write(db);
      resolve(decorate(db, clone(o)));
    });
  };

  Admin.remove = function (code) {
    return new Promise(function (resolve) {
      var db = read();
      db.orders = db.orders.filter(function (x) { return String(x.code).toUpperCase() !== String(code).toUpperCase(); });
      write(db);
      resolve(true);
    });
  };

  /* 手工录入（电话报名、现场报名） */
  Admin.manual = function (form) {
    return API.submit(Object.assign({}, form, { channel: 'manual' })).then(function (o) {
      if (form.status === 'paid') return Admin.setStatus(o.code, 'paid');
      return o;
    });
  };

  Admin.sessions = function () { return API.sessionsSync(); };

  /* 后台指派 / 改派场次：不需要学员手机号，供电话报名、现场调整使用 */
  Admin.assignSession = function (code, sessionId) {
    return new Promise(function (resolve, reject) {
      var db = read();
      var o = db.orders.filter(function (x) {
        return String(x.code).toUpperCase() === String(code).toUpperCase();
      })[0];
      if (!o) return reject(new Error('订单不存在。'));
      var s = db.sessions.filter(function (x) { return x.id === sessionId; })[0];
      if (!s) return reject(new Error('场次不存在。'));
      if (s.act !== o.act) return reject(new Error('该场次不属于这个报名项目。'));
      var used = bookCount(db, s.id);
      if (o.sessionId !== s.id && used >= (s.cap || 0)) return reject(new Error('该场次已满，请先调大容量或换一场。'));
      o.sessionId = s.id;
      o.updatedAt = nowISO();
      write(db);
      resolve(decorate(db, clone(o)));
    });
  };

  Admin.saveSession = function (s) {
    return new Promise(function (resolve, reject) {
      var db = read();
      if (!s.act || !actById(s.act)) return reject(new Error('请选择所属项目。'));
      if (!s.date) return reject(new Error('请填写日期。'));
      if (!s.time) return reject(new Error('请填写时段。'));
      if (!s.place) return reject(new Error('请填写地点。'));
      if (s.id) {
        var i = -1;
        for (var k = 0; k < db.sessions.length; k++) if (db.sessions[k].id === s.id) { i = k; break; }
        if (i < 0) return reject(new Error('场次不存在。'));
        db.sessions[i] = Object.assign({}, db.sessions[i], s, { cap: Number(s.cap) || 0 });
      } else {
        db.seq = db.seq || 0;
        s.id = 'S-' + s.act + '-' + Date.now().toString(36).slice(-5).toUpperCase();
        db.sessions.push({
          id: s.id, act: s.act, date: s.date, time: s.time, place: s.place,
          cap: Number(s.cap) || 0, tag: s.tag || ''
        });
      }
      write(db);
      resolve(true);
    });
  };

  Admin.removeSession = function (id) {
    return new Promise(function (resolve, reject) {
      var db = read();
      if (bookCount(db, id) > 0) return reject(new Error('这个场次已经有人选，不能直接删除。请先把学员改到其他场次。'));
      db.sessions = db.sessions.filter(function (s) { return s.id !== id; });
      write(db);
      resolve(true);
    });
  };

  Admin.settings = function () { return clone(read().settings); };

  Admin.saveSettings = function (patch) {
    return new Promise(function (resolve) {
      var db = read();
      db.settings = Object.assign({}, db.settings, patch);
      if (!db.settings.adminPass) db.settings.adminPass = 'changtu2026';
      write(db);
      resolve(true);
    });
  };

  Admin.fees = function () {
    var db = read();
    return ACTIVITIES.map(function (a) {
      var row = db.fees && db.fees[a.id];
      return { id: a.id, name: a.name, full: a.full, fee: row != null ? row : a.fee };
    });
  };

  Admin.saveFees = function (map) {
    var db = read();
    db.fees = db.fees || {};
    Object.keys(map).forEach(function (k) { db.fees[k] = Number(map[k]) || 0; });
    write(db);
    return Promise.resolve(true);
  };

  /* 整库备份 / 迁移（换设备时用） */
  Admin.exportBackup = function () {
    return JSON.stringify(read(), null, 2);
  };

  Admin.importBackup = function (text) {
    return new Promise(function (resolve, reject) {
      var db;
      try { db = JSON.parse(text); }
      catch (e) { return reject(new Error('不是有效的备份文件（JSON 解析失败）。')); }
      if (!db || !db.settings || !Array.isArray(db.orders) || !Array.isArray(db.sessions)) {
        return reject(new Error('备份文件结构不对，缺少 settings / orders / sessions。'));
      }
      write(db);
      resolve({ orders: db.orders.length, sessions: db.sessions.length });
    });
  };

  Admin.exportCsv = function (filter) {
    var rows = Admin.orders(filter);
    var head = ['报名号', '项目', '组别', '类别', '学员', '性别', '年龄', '年级', '家长', '手机', '城市', '学校/机构', '指导老师', '场次', '场次时间', '金额', '状态', '报名时间'];
    var lines = [head.join(',')];
    rows.forEach(function (o) {
      lines.push([
        o.code, o.actName, o.group, o.item, o.student, o.gender, o.age, o.grade,
        o.parent, o.phone, o.city, o.school, o.teacher,
        o.session ? o.session.tag : '未选场次',
        o.session ? o.session.date + ' ' + o.session.time : '',
        o.fee,
        o.status === 'paid' ? '已缴费' : o.status === 'pending' ? '待缴费' : o.status === 'refunded' ? '已退款' : '已取消',
        o.createdAt.replace('T', ' ').slice(0, 16)
      ].map(function (v) {
        var s = String(v == null ? '' : v);
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(','));
    });
    return lines.join('\r\n');
  };

  /* ========== 价格覆盖（后台改价后，报名时用新价） ========== */
  var rawActivities = API.activities;

  function activitiesWithFees() {
    var db = read();
    var fees = db.fees || {};
    return rawActivities().map(function (a) {
      return Object.assign({}, a, { fee: fees[a.id] != null ? fees[a.id] : a.fee });
    });
  }

  /* 同步版：后台页面直接取用 */
  API.activitiesSync = activitiesWithFees;
  /* 异步版：与其它接口保持一致的调用方式 */
  API.activities = function () { return Promise.resolve(activitiesWithFees()); };

  var rawSubmit = API.submit;
  API.submit = function (form) {
    var db = read();
    var fees = db.fees || {};
    if (form && form.act && fees[form.act] != null && form.fee == null) {
      form = Object.assign({}, form, { fee: fees[form.act] });
    }
    return rawSubmit(form);
  };

  /* 后台手工录入走同一套价格 */
  Admin.manual = function (form) {
    return API.submit(Object.assign({}, form, { channel: 'manual' })).then(function (o) {
      if (form.status === 'paid') return Admin.setStatus(o.code, 'paid');
      return o;
    });
  };

  API.admin = Admin;

  /* ========== 重置（仅开发自测用） ========== */
  API._reset = function () {
    if (hasLS) localStorage.removeItem(KEY);
    memory = null;
    return seed();
  };

  API._storage = hasLS ? 'localStorage' : 'memory';

  global.CT = { API: API, ACTIVITIES: ACTIVITIES };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.CT;
})(typeof window !== 'undefined' ? window : this);
