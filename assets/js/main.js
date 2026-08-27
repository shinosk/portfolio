/**
 * 榛葉多翼 Portfolio
 *  1. 表示モード切替（就活 / 事業）
 *  2. セクション番号の採番
 *  3. 任意画像（置かれていれば表示する画像）
 *  4. モバイルメニュー
 *  5. スクロールスパイ
 *  6. フェードイン / 西暦
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var MODES = ['career', 'business'];
  var STORAGE_KEY = 'portfolio-mode';

  /* ---------- 2. セクション番号 ---------- */
  /**
   * 画面上の並び順にあわせて 01, 02… を振り直す。
   * モードで order と表示・非表示が変わるため、DOM 順ではなく毎回計算する。
   */
  function numberSections() {
    var visible = Array.prototype.slice.call(document.querySelectorAll('main > section'))
      .filter(function (el) { return getComputedStyle(el).display !== 'none'; })
      .sort(function (a, b) {
        return (parseInt(getComputedStyle(a).order, 10) || 0) - (parseInt(getComputedStyle(b).order, 10) || 0);
      });

    var n = 0;
    visible.forEach(function (el, i) {
      el.classList.toggle('is-first', i === 1); // ヒーローの次＝本文の1つ目
      var num = el.querySelector('.section__num');
      if (!num) return;
      n += 1;
      num.textContent = (n < 10 ? '0' : '') + n;
    });
  }

  /* ---------- 1. 表示モード切替 ---------- */
  var modeButtons = Array.prototype.slice.call(document.querySelectorAll('[data-mode-btn]'));

  function readInitialMode() {
    // 優先順位: URLパラメータ ?mode=business > localStorage > 既定値(career)
    var param = new URLSearchParams(window.location.search).get('mode');
    if (MODES.indexOf(param) !== -1) return param;
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (MODES.indexOf(saved) !== -1) return saved;
    } catch (e) { /* localStorage が使えない環境は既定値 */ }
    return 'career';
  }

  function applyMode(mode, options) {
    var opts = options || {};
    root.setAttribute('data-mode', mode);

    modeButtons.forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.dataset.modeBtn === mode));
    });

    try { localStorage.setItem(STORAGE_KEY, mode); } catch (e) {}

    if (opts.updateUrl) {
      var url = new URL(window.location.href);
      if (mode === 'career') { url.searchParams.delete('mode'); }
      else { url.searchParams.set('mode', mode); }
      history.replaceState(null, '', url.toString().replace(/\?$/, ''));
    }

    numberSections();
    revealVisible();
    updateActiveNav();
  }

  modeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = btn.dataset.modeBtn;
      if (root.getAttribute('data-mode') === next) return;
      applyMode(next, { updateUrl: true });
    });
  });

  /* ---------- 3. 任意画像 ---------- */
  // data-optional の画像は、ファイルが存在するときだけ枠ごと表示する。
  // 未設置でもレイアウトが崩れないので、写真は後から差し込める。
  Array.prototype.slice.call(document.querySelectorAll('img[data-optional]')).forEach(function (img) {
    var frame = img.closest('.opt-img');
    if (!frame) return;

    var show = function () {
      frame.classList.add('is-shown');
      if (frame.classList.contains('hero__media')) {
        document.querySelector('.hero').classList.add('has-photo');
      }
    };

    if (img.complete) {
      if (img.naturalWidth > 0) show();
    } else {
      img.addEventListener('load', show);
    }
  });

  /* ---------- 4. モバイルメニュー ---------- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');

  function closeNav() {
    if (!nav || !burger) return;
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'メニューを開く');
  }

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
  }

  /* ---------- 5. スクロールスパイ ---------- */
  var navItems = Array.prototype.slice.call(document.querySelectorAll('.nav__item'));
  var sections = navItems
    .map(function (item) {
      var link = item.querySelector('a');
      var id = link ? link.getAttribute('href').slice(1) : '';
      var el = id ? document.getElementById(id) : null;
      return el ? { item: item, el: el } : null;
    })
    .filter(Boolean);

  function updateActiveNav() {
    var line = window.scrollY + window.innerHeight * 0.32;
    var current = null;

    sections.forEach(function (s) {
      if (s.el.offsetParent === null) return; // 非表示のセクションは対象外
      if (s.el.offsetTop <= line) current = s;
    });

    navItems.forEach(function (item) {
      item.classList.toggle('is-active', current !== null && item === current.item);
    });
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      updateActiveNav();
      ticking = false;
    });
  }, { passive: true });
  window.addEventListener('resize', updateActiveNav, { passive: true });

  /* ---------- 6. フェードイン ---------- */
  var revealTargets = Array.prototype.slice.call(
    document.querySelectorAll('.section__head, .prose, .row, .work, .tl, .note')
  );
  revealTargets.forEach(function (el) { el.classList.add('reveal'); });

  function revealVisible() {
    revealTargets.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.94 && rect.bottom > 0) {
        el.classList.add('is-visible');
      }
    });
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });

    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // 名刺セクションのように、あとから表示・非表示が決まる要素があるため
  document.addEventListener('portfolio:layoutchange', function () {
    numberSections();
    updateActiveNav();
  });

  /* ---------- 初期化 ---------- */
  applyMode(readInitialMode(), { updateUrl: false });
  updateActiveNav();

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
