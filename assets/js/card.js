/**
 * デジタル名刺（3D）
 *
 * assets/card/front.webp / back.webp をテクスチャにして、
 * Three.js で厚みのある一枚の名刺として表示する。
 *
 * 画像は名刺の PDF から tools/card-to-webp.py で書き出したもの。
 * PDF をブラウザ上で直接描画する方式も試したが、PDF.js が名刺に使われている
 * CFF フォントの文字幅を正しく扱えず欧文が潰れたため、画像方式にしている。
 *
 *  - 画像が置かれていない場合はセクションごと表示しない
 *  - Three.js は、名刺が画面に近づいてから読み込む
 *  - WebGL が使えない環境では、両面を並べた平面表示に切り替える
 */

const el = document.getElementById('card3d');
const section = document.getElementById('card');

/** 名刺の実寸（日本の標準サイズ 91×55mm）。1 unit = 10mm として扱う */
const CARD_W = 9.1;
const CARD_H = 5.5;
const CARD_D = 0.045;   // 紙の厚み 0.45mm 相当

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * 名刺セクションは CSS で最初から隠してある。
 * 画像が揃っていることを確認できたときだけ表示し、番号とナビを振り直させる。
 * こうしておくと、このスクリプトが動かない環境でも中途半端な枠が残らない。
 */
function enableSection() {
  section.classList.add('is-available');
  document.querySelectorAll('.nav__item--card').forEach((n) => n.classList.add('is-available'));
  document.dispatchEvent(new CustomEvent('portfolio:layoutchange'));
}

/** 表示を取りやめる（初期状態に戻すだけ） */
function disableSection(reason) {
  section.classList.remove('is-available');
  document.querySelectorAll('.nav__item--card').forEach((n) => n.classList.remove('is-available'));
  document.dispatchEvent(new CustomEvent('portfolio:layoutchange'));
  if (reason) console.info('[card] 表示しません:', reason);
}

/** 画像を読み込む。置かれていなければ null を返す */
function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img.naturalWidth > 0 ? img : null);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) {
    return false;
  }
}

/* ---------------------------------------------------------------- */

async function boot() {
  if (!el || !section) return;

  const [front, back] = await Promise.all([
    loadImage(el.dataset.front),
    loadImage(el.dataset.back),
  ]);

  if (!front || !back) return disableSection('名刺の画像が見つかりません');

  enableSection();

  // Three.js はセクションが近づいてから読み込む
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        start(front, back);
      });
    }, { rootMargin: '600px 0px' });
    io.observe(el);
  } else {
    start(front, back);
  }
}

async function start(front, back) {
  const statusEl = el.querySelector('.card3d__status');
  const canvas = el.querySelector('.card3d__canvas');

  try {
    if (hasWebGL()) {
      const THREE = await import('../vendor/three.module.min.js');
      buildScene(THREE, canvas, front, back);
      el.querySelectorAll('.card3d__btn').forEach((b) => { b.disabled = false; });
    } else {
      showFlat(canvas, front, back);
    }

    if (statusEl) statusEl.remove();
    el.classList.add('is-ready');
  } catch (err) {
    // 画像は読めているので、黙って消さずに平面表示へ落とす
    console.error('[card] 3D表示に失敗しました', err);
    showFlat(canvas, front, back);
    if (statusEl) statusEl.remove();
    el.classList.add('is-ready');
  }
}

/** 3D が使えないときのフォールバック。両面を並べて表示する */
function showFlat(canvas, front, back) {
  const stage = canvas.parentElement;
  if (!stage || stage.querySelector('.card3d__flat')) return;
  canvas.remove();

  const wrap = document.createElement('div');
  wrap.className = 'card3d__flat';
  [[front, '名刺の表面'], [back, '名刺の裏面']].forEach(([src, alt]) => {
    const img = new Image();
    img.src = src.src;
    img.alt = alt;
    wrap.appendChild(img);
  });
  stage.appendChild(wrap);

  const ui = document.querySelector('.card3d__ui');
  if (ui) ui.querySelectorAll('.card3d__btn').forEach((b) => b.remove());

  // 回せないので、操作の案内も差し替える
  const hint = document.querySelector('.card3d__hint');
  if (hint && hint.firstChild && hint.firstChild.nodeType === Node.TEXT_NODE) {
    hint.firstChild.nodeValue = 'この環境では平面で表示しています';
  }
}

/* ---------------------------------------------------------------- */

function buildScene(THREE, canvas, frontImg, backImg) {
  const stage = canvas.parentElement;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const FOV = 30;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.set(0, 0.8, 18);

  /* --- 名刺本体 --- */
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const toTexture = (img) => {
    const tex = new THREE.Texture(img);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAniso;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.needsUpdate = true;
    return tex;
  };

  // 印刷面はマットな紙。少しだけ光沢を残して、光の当たり方が分かるようにする
  const face = (img) => new THREE.MeshStandardMaterial({
    map: toTexture(img), roughness: 0.7, metalness: 0.0,
  });
  // 小口は印刷面より少しだけ沈ませ、紙の断面に見えるようにする
  const edge = new THREE.MeshStandardMaterial({
    color: 0xe6e2d8, roughness: 0.95, metalness: 0.0,
  });

  // 用紙のアスペクト比は画像に合わせる（変型サイズでも破綻させない）
  const w = CARD_W;
  const h = +(CARD_W * (frontImg.naturalHeight / frontImg.naturalWidth)).toFixed(4) || CARD_H;

  const card = new THREE.Mesh(new THREE.BoxGeometry(w, h, CARD_D), [
    edge, edge, edge, edge,   // 側面（紙の小口）
    face(frontImg),           // 表
    face(backImg),            // 裏
  ]);
  card.castShadow = true;
  scene.add(card);

  /* --- 影を受ける床 --- */
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.ShadowMaterial({ opacity: 0.1 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -h / 2 - 0.85;
  floor.receiveShadow = true;
  scene.add(floor);

  /* --- 照明 --- */
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb4ada0, 1.5));

  const key = new THREE.DirectionalLight(0xffffff, 1.7);
  key.position.set(-3.2, 9.5, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 40;
  key.shadow.camera.left = -10;
  key.shadow.camera.right = 10;
  key.shadow.camera.top = 10;
  key.shadow.camera.bottom = -10;
  key.shadow.radius = 7;
  key.shadow.bias = -0.0006;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 0.55);
  fill.position.set(6, -1.5, 5);
  scene.add(fill);

  /* --- 操作 --- */
  const state = {
    rotX: -0.13, rotY: -0.3,       // 現在の角度
    targetX: -0.13, targetY: -0.3, // 目標の角度
    dragging: false,
    lastX: 0, lastY: 0,
    idleAt: performance.now(),
    restY: null,                   // 待機中に基準とする向き
  };

  /** 操作されたら待機アニメーションをリセットする */
  function touched() {
    state.idleAt = performance.now();
    state.restY = null;
  }

  const MAX_TILT = 0.85;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  canvas.addEventListener('pointerdown', (e) => {
    state.dragging = true;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!state.dragging) return;
    state.targetY += (e.clientX - state.lastX) * 0.011;
    state.targetX = clamp(state.targetX + (e.clientY - state.lastY) * 0.008, -MAX_TILT, MAX_TILT);
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    touched();
  });
  const release = (e) => {
    state.dragging = false;
    touched();
    if (canvas.hasPointerCapture?.(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  el.querySelector('[data-card-flip]').addEventListener('click', () => {
    state.targetY += Math.PI;
    touched();
  });
  el.querySelector('[data-card-reset]').addEventListener('click', () => {
    // いちばん近い「表向き」に戻す
    state.targetY = Math.round(state.targetY / (Math.PI * 2)) * Math.PI * 2;
    state.targetX = -0.13;
    touched();
  });

  /* --- 描画ループ --- */
  function resize() {
    const w2 = stage.clientWidth;
    const h2 = stage.clientHeight;
    if (!w2 || !h2) return;

    renderer.setSize(w2, h2, false);
    const aspect = w2 / h2;
    camera.aspect = aspect;

    // 名刺が縦横どちらでも収まる距離を求める。
    // 回転したときにはみ出さないよう、実寸に少し余白を足している。
    const k = 2 * Math.tan((FOV * Math.PI / 180) / 2);
    camera.position.z = Math.max((h * 1.55) / k, (w * 1.25) / (k * aspect));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
  window.addEventListener('resize', resize);
  resize();

  function tick(now) {
    // しばらく触られていなければ、いちばん近い面を向いたまま静かに揺らす
    const idleFor = now - state.idleAt;
    if (!reduceMotion && !state.dragging && idleFor > 2400) {
      if (state.restY === null) state.restY = Math.round(state.targetY / Math.PI) * Math.PI;
      const t = (idleFor - 2400) * 0.00055;
      const ramp = Math.min(1, t);                 // 動き出しを滑らかに
      state.targetY = state.restY + Math.sin(t) * 0.3 * ramp;
      state.targetX = -0.13 + Math.sin(t * 0.62) * 0.06 * ramp;
    }

    const ease = reduceMotion ? 1 : 0.09;
    state.rotX += (state.targetX - state.rotX) * ease;
    state.rotY += (state.targetY - state.rotY) * ease;
    card.rotation.x = state.rotX;
    card.rotation.y = state.rotY;

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

boot();
