/**
 * デジタル名刺（3D）
 *
 * assets/card/front.pdf / back.pdf を PDF.js で描画してテクスチャにし、
 * Three.js で厚みのある一枚の名刺として表示する。
 *
 *  - PDF が置かれていない場合はセクションごと非表示にする
 *  - 重いライブラリは、名刺が画面に入ってから読み込む
 *  - WebGL が使えない環境ではセクションを隠し、他の表示には影響させない
 */

const el = document.getElementById('card3d');
const section = document.getElementById('card');

/** 名刺の実寸（日本の標準サイズ 91×55mm）。1 unit = 10mm として扱う */
const CARD_W = 9.1;
const CARD_H = 5.5;
const CARD_D = 0.045;          // 紙の厚み 0.45mm 相当
const TEXTURE_WIDTH = 2048;    // PDF を描き出す横幅（px）

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * 名刺セクションは CSS で最初から隠してある。
 * PDF の存在が確認できたときだけ表示し、番号とナビを振り直させる。
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

/**
 * PDF を読み込む。名刺は数十KB程度なので、置かれているかの確認を兼ねて
 * 先に取得しておく（HEAD が正しく返らないサーバーでも確実に判定できる）。
 */
async function fetchPdf(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch (e) {
    return null;
  }
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

  const frontUrl = el.dataset.front;
  const backUrl = el.dataset.back;

  const [frontData, backData] = await Promise.all([fetchPdf(frontUrl), fetchPdf(backUrl)]);
  if (!frontData || !backData) return disableSection('名刺の PDF が見つかりません');

  enableSection();

  // 重いライブラリはセクションが近づいてから読み込む。
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        start(frontData, backData);
      });
    }, { rootMargin: '400px 0px' });
    io.observe(el);
  } else {
    start(frontData, backData);
  }
}

async function start(frontData, backData) {
  const statusEl = el.querySelector('.card3d__status');
  const canvas = el.querySelector('.card3d__canvas');

  try {
    const pdfjs = await import('../vendor/pdf.min.mjs');

    pdfjs.GlobalWorkerOptions.workerSrc =
      new URL('../vendor/pdf.worker.min.mjs', import.meta.url).href;

    const [frontCanvas, backCanvas] = await Promise.all([
      renderPdf(pdfjs, frontData),
      renderPdf(pdfjs, backData),
    ]);

    if (hasWebGL()) {
      const THREE = await import('../vendor/three.module.min.js');
      buildScene(THREE, canvas, frontCanvas, backCanvas);
      el.querySelectorAll('.card3d__btn').forEach((b) => { b.disabled = false; });
    } else {
      // 3D が使えない環境では、両面を並べた平面表示にする
      showFlat(canvas, frontCanvas, backCanvas);
    }

    statusEl.remove();
    el.classList.add('is-ready');
  } catch (err) {
    console.error('[card] 読み込みに失敗しました', err);
    disableSection('読み込みに失敗しました');
  }
}

/** PDF の1ページ目を canvas に描き出す */
async function renderPdf(pdfjs, data) {
  // pdf.js は渡した ArrayBuffer を破棄するので、複製を渡す
  const doc = await pdfjs.getDocument({ data: data.slice(0) }).promise;
  const page = await doc.getPage(1);

  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: TEXTURE_WIDTH / base.width });

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';            // 透過部分は紙の白で埋める
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  return canvas;
}

/** 3D が使えないときのフォールバック。両面を画像として並べる */
function showFlat(canvas, frontCanvas, backCanvas) {
  const stage = canvas.parentElement;
  canvas.remove();

  const wrap = document.createElement('div');
  wrap.className = 'card3d__flat';
  [frontCanvas, backCanvas].forEach((src, i) => {
    const img = new Image();
    img.src = src.toDataURL('image/png');
    img.alt = i === 0 ? '名刺の表面' : '名刺の裏面';
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

function buildScene(THREE, canvas, frontCanvas, backCanvas) {
  const stage = canvas.parentElement;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const FOV = 30;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.set(0, 0.8, 18);

  /* --- 名刺本体 --- */
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const toTexture = (src) => {
    const tex = new THREE.CanvasTexture(src);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAniso;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    return tex;
  };

  // 印刷面はマットな紙。少しだけ光沢を残して、光の当たり方が分かるようにする
  const face = (tex) => new THREE.MeshStandardMaterial({
    map: tex, roughness: 0.7, metalness: 0.0,
  });
  // 小口は印刷面より少しだけ沈ませ、紙の断面に見えるようにする
  const edge = new THREE.MeshStandardMaterial({
    color: 0xe6e2d8, roughness: 0.95, metalness: 0.0,
  });

  // 用紙のアスペクト比は PDF 側に合わせる（横長・縦長どちらでも破綻させない）
  const ratio = frontCanvas.height / frontCanvas.width;
  const w = CARD_W;
  const h = +(CARD_W * ratio).toFixed(4) || CARD_H;

  const geometry = new THREE.BoxGeometry(w, h, CARD_D);
  const card = new THREE.Mesh(geometry, [
    edge, edge, edge, edge,               // 側面（紙の小口）
    face(toTexture(frontCanvas)),         // 表
    face(toTexture(backCanvas)),          // 裏
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
    restY: null,          // 待機中に基準とする向き
  };

  /** 操作されたら待機アニメーションをリセットする */
  function touched() {
    state.idleAt = performance.now();
    state.restY = null;
  }

  const MAX_TILT = 0.85;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  function pointerDown(e) {
    state.dragging = true;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  }
  function pointerMove(e) {
    if (!state.dragging) return;
    state.targetY += (e.clientX - state.lastX) * 0.011;
    state.targetX = clamp(state.targetX + (e.clientY - state.lastY) * 0.008, -MAX_TILT, MAX_TILT);
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    touched();
  }
  function pointerUp(e) {
    state.dragging = false;
    touched();
    if (canvas.hasPointerCapture?.(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
  }

  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', pointerUp);
  canvas.addEventListener('pointercancel', pointerUp);

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
