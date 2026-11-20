/* Rentab'Pass — raccourcis clavier sur grand écran (site web uniquement) */
(function () {
  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (document.querySelector('.scrim')) return;
    var view = document.getElementById('view');
    var tab = view && view.getAttribute('data-tab');
    function click(sel) { var b = document.querySelector(sel); if (b) { b.click(); e.preventDefault(); } }
    if (tab === 'home' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      click('[data-act="month"][data-v="' + (e.key === 'ArrowLeft' ? '-1' : '1') + '"]');
    } else if (tab === 'films' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      var tabs = ['now', 'up', 'watch'], cur = document.querySelector('[data-act="filmsTab"][aria-pressed="true"]');
      var i = cur ? tabs.indexOf(cur.getAttribute('data-v')) : 0, j = i + (e.key === 'ArrowLeft' ? -1 : 1);
      if (j >= 0 && j < tabs.length) click('[data-act="filmsTab"][data-v="' + tabs[j] + '"]');
    } else if (e.key === 'n' && tab !== 'form') {
      click('.fab');
    }
  });
})();
