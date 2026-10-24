/* 入口弹窗：data-mo="弹窗id" 触发，[data-mo-close] 关闭，ESC / 点遮罩关闭，Tab 焦点循环。
   关闭时派发 ctmodal:close 事件（detail.id），页面可借此重置表单。
   无依赖，不依赖 CT。 */
(function () {
  var lastBtn = null;

  function focusables(mo) {
    return [].slice.call(mo.querySelectorAll(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
    )).filter(function (el) {
      return el.offsetParent !== null || el === document.activeElement;
    });
  }

  function open(id, btn) {
    var mo = document.getElementById(id);
    if (!mo || !mo.hidden) {
      if (mo) return mo;
      return null;
    }
    mo.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    lastBtn = btn || null;
    var panel = mo.querySelector('.mo-panel');
    if (panel && panel.getAttribute('tabindex') === '-1') {
      panel.focus();
    } else {
      var f = focusables(mo)[0];
      if (f) f.focus();
    }
    return mo;
  }

  function close(mo) {
    if (!mo || mo.hidden) return;
    mo.hidden = true;
    if (!document.querySelector('.mo:not([hidden])')) {
      document.documentElement.style.overflow = '';
    }
    if (lastBtn) { lastBtn.focus(); lastBtn = null; }
    document.dispatchEvent(new CustomEvent('ctmodal:close', { detail: { id: mo.id } }));
  }

  function bind() {
    [].slice.call(document.querySelectorAll('[data-mo]')).forEach(function (b) {
      if (b.dataset.moBound) return;
      b.dataset.moBound = '1';
      b.addEventListener('click', function () { open(b.getAttribute('data-mo'), b); });
    });
    [].slice.call(document.querySelectorAll('.mo')).forEach(function (mo) {
      if (mo.dataset.moBound) return;
      mo.dataset.moBound = '1';
      mo.addEventListener('click', function (e) {
        var t = e.target;
        if (t && t.closest && t.closest('[data-mo-close]')) close(mo);
      });
      mo.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { e.preventDefault(); close(mo); return; }
        if (e.key !== 'Tab') return;
        var f = focusables(mo);
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });
    });
  }

  window.CTModal = { open: open, close: close, bind: bind };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
