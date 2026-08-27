/**
 * Portfolio – main script
 *  1. 表示モード切替（就活 / 事業）
 *  2. モバイルメニュー
 *  3. ヘッダーの影 & スクロールスパイ
 *  4. スクロール連動フェードイン
 *  5. 西暦の自動更新
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var MODES = ['career', 'business'];
  var STORAGE_KEY = 'portfolio-mode';

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

    if (opts.animate) {
      document.body.classList.remove('mode-fade');
      void document.body.offsetWidth; // reflow を挟んでアニメーションを再生
      document.body.classList.add('mode-fade');
    }

    // 並び替えでレイアウトが変わるため、表示中の要素を再判定する
    paintSections();
    revealVisible();
    updateActiveNav();
  }

  modeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = btn.dataset.modeBtn;
      if (root.getAttribute('data-mode') === next) return;
      applyMode(next, { updateUrl: true, animate: true });
    });
  });

  /**
   * 背景の濃淡を「画面上の並び順」で交互に付け替える。
   * モードによってセクションの order と表示・非表示が変わるため、
   * HTML 側で固定せず、都度計算する。
   */
  function paintSections() {
    var visible = Array.prototype.slice.call(document.querySelectorAll('main > section'))
      .filter(function (el) { return getComputedStyle(el).display !== 'none'; })
      .sort(function (a, b) {
        return (parseInt(getComputedStyle(a).order, 10) || 0) - (parseInt(getComputedStyle(b).order, 10) || 0);
      });

    visible.forEach(function (el, i) {
      el.classList.toggle('section--tint', i % 2 === 1);
    });
  }

  /* ---------- 2. モバイルメニュー ---------- */
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

  /* ---------- 3. ヘッダー & スクロールスパイ ---------- */
  var header = document.getElementById('header');
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

  function onScroll() {
    if (header) header.classList.toggle('is-stuck', window.scrollY > 8);
    updateActiveNav();
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      onScroll();
      ticking = false;
    });
  }, { passive: true });

  window.addEventListener('resize', updateActiveNav, { passive: true });
  onScroll();

  /* ---------- 4. フェードイン ---------- */
  var revealTargets = Array.prototype.slice.call(
    document.querySelectorAll('.section__eyebrow, .section__title, .section__lead, .card, .tl, .contact, .contact__sites, .note')
  );
  revealTargets.forEach(function (el) { el.classList.add('reveal'); });

  function revealVisible() {
    // 画面内にすでにある要素は即座に表示（モード切替直後のちらつき防止）
    revealTargets.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
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
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-visible'); });
  }

  revealVisible();

  /* ---------- 初期モードの反映（DOM 参照の準備後に実行） ---------- */
  applyMode(readInitialMode(), { updateUrl: false });

  /* ---------- プロフィール写真 ---------- */
  // 画像が用意されている場合だけ 2カラムのヒーローに切り替える
  var heroFigure = document.querySelector('.hero__media');
  var heroImg = heroFigure ? heroFigure.querySelector('img') : null;
  if (heroImg) {
    var showPhoto = function () { document.querySelector('.hero').classList.add('has-photo'); };
    if (heroImg.complete) {
      if (heroImg.naturalWidth > 0) showPhoto();
    } else {
      heroImg.addEventListener('load', showPhoto);
    }
  }

  /* ---------- 5. 西暦 ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
