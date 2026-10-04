/* Motion-styles compositor runtime.
 *
 * Deterministic: everything is driven by paused GSAP timelines that render.mjs seeks frame by frame.
 *
 * Layer stack (bottom → top):
 *   #plateWrap  canvas: source frame — camera, grade and overlays (vignette/tint) are drawn INTO it
 *   #bg / #bgW            background replacements, backdrop graphics
 *   (#ovl)                optional: style overlays drawn ABOVE replaced backdrops (overlays.applyToBackdrop)
 *   #behind / #behindW    graphics the presenter occludes
 *   #talentWrap canvas: presenter cut-out = graded plate × camera-transformed person matte
 *   #front / #frontW      graphics over the presenter
 *   #fx                   flashes / light leaks (screen space, above everything)
 * Layers ending in W are "world-locked" (preset/cue `worldLock: true`): text parented to a pull-back shrinks and
 * drops with the footage. Since engine v2 the W layer divs themselves are NOT transformed: every direct child of a
 * W layer is wrapped in its own camera-following `.mg-cam` div, so mix-blend-mode (e.g. Difference) on world-locked
 * graphics still blends with the plate/talent (a transformed layer would be an isolated group).
 * The grade and overlays are applied to footage only — graphics are never graded.
 *
 * Config arrives as window.__MG__ = { meta, faces, style, scene, plateUrl, assetBase, styleBase }.
 * See engine/README.md for every option; "Changelog" there lists what changed in v2.
 */
(() => {
  const C = window.__MG__;
  const W = C.meta.width;
  const H = C.meta.height;
  const FPS = C.meta.fps;
  const stage = document.getElementById('stage');
  stage.style.width = W + 'px';
  stage.style.height = H + 'px';

  // Every render seeks the timelines to t + EPS, never onto t itself. GSAP does not render a child timeline whose
  // first render lands EXACTLY on its local time 0 (Timeline.render() skips when totalTime === _tTime === 0 and the
  // child has a duration), so position-0 sets of a cue that starts on a frame boundary — and everything at t = 0 on
  // frame 0 — would be skipped for one frame. 1e-5 s is far above GSAP's 1e-7 rounding and far below a frame.
  const EPS = 1e-5;

  const MG = (window.MG = window.MG || {});
  // feature flags so a style's components.js can skip its own workaround for something the engine now does
  const FEATURES = {
    version: 2,
    primedTimelines: true, // masters primed in mgInit, every frame seeks t + EPS (frame-0 / frame-boundary sets render)
    cameraCuts: true, // camera state = latest started camera cue; handheld/wobble is additive; no blur across a cut
    staticCamera: true, // type "static" camera moves apply scaleTo + focus
    worldRest: true, // camera cue / preset / cameraDefaults "worldRest": "final" | "start" | number | {scale,x,y,...}
    worldWrappers: true, // W layers untransformed; each child in a camera-following .mg-cam wrapper
    blendHoist: true, // mix-blend-mode of a wrapped/filtered child is hoisted onto its top-level wrapper
    textHooks: true, // data-cue / data-preset, MG.textBuilders, MG.onText, ctx.master/camAt/registerPostLayout/matteCanvas
    persistentProps: true, // scene.persistentProps[id] merged into persistent cue.props
    tatweelUnit: true, // preset in.tatweelUnit: "run" | "each"
    gradientGlowFilter: true, // glow/extrusion on gradient-filled text → drop-shadow chain on a host wrapper
    tightHalo: true, // fonts[].effects.tightHalo = alias of glowTight
    unitGating: true, // staggered units stay hidden until their own start
    groupedKeyframesFix: true, // grouped keyframes: every group's frame[0] at t = 0; in.from/to never override keyframed props
    hardCutAtEnd: true, // text is hidden at cue.end even if its type-on is still running
    lifecycleDisplay: true, // cue DOM gets display:none (class .mg-off) outside [start, end]
    inkAnchor: true, // position.anchor "ink" | "ink-top" | "ink-bottom" | "ink-left" | "ink-right" (+ combos)
    gradeControl: true, // scene.grade string/object/true, scene.gradeCss, meta.preGraded, overlays.applyToBackdrop
    animatedBackgrounds: true, // split gradient text follows a tweened background-position/size of its element
    matteCanvas: true, // ctx.matteCanvas: raw camera-transformed matte of the current frame
  };
  MG.engineFeatures = Object.assign(MG.engineFeatures || {}, FEATURES);
  const textBuilders = (MG.textBuilders = MG.textBuilders || {});
  const textHooks = (MG.textHooks = MG.textHooks || []);
  MG.onText = MG.onText || ((fn) => { if (typeof fn === 'function') textHooks.push(fn); return fn; });

  const $ = (id) => document.getElementById(id);
  const layers = { bg: $('bg'), behind: $('behind'), front: $('front'), fx: $('fx'), bgW: $('bgW'), behindW: $('behindW'), frontW: $('frontW') };
  const worldLayers = [layers.bgW, layers.behindW, layers.frontW];
  const screenLayers = [layers.bg, layers.behind, layers.front, layers.fx];
  function layerFor(name, worldLock) {
    const n = name === 'behindTalent' ? 'behind' : name || 'front';
    if (n.endsWith('W')) return layers[n] || layers.frontW;
    if (worldLock && layers[n + 'W']) return layers[n + 'W'];
    return layers[n] || layers.front;
  }
  const plateCanvas = $('plate');
  const talentCanvas = $('talent');
  for (const c of [plateCanvas, talentCanvas]) { c.width = W; c.height = H; }
  const pctx = plateCanvas.getContext('2d');
  const tctx = talentCanvas.getContext('2d');
  const scratch = document.createElement('canvas');
  scratch.width = W; scratch.height = H;
  const sctx = scratch.getContext('2d');
  // raw camera-transformed matte of the current frame (alpha = presenter coverage), for occlusion effects
  const matteCanvas = document.createElement('canvas');
  matteCanvas.width = W; matteCanvas.height = H;
  const mctx = matteCanvas.getContext('2d');

  gsap.registerPlugin(CustomEase);
  gsap.ticker.lagSmoothing(0);
  gsap.ticker.sleep();

  // ---------- helpers ----------
  let easeId = 0;
  const easeCache = {};
  function ease(e) {
    if (!e) return 'power2.out';
    if (typeof e !== 'string') return e;
    if (easeCache[e]) return easeCache[e];
    const m = e.match(/cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/);
    let out = e;
    if (m) out = CustomEase.create('cb' + easeId++, `M0,0 C${m[1]},${m[2]} ${m[3]},${m[4]} 1,1`);
    else if (e === 'linear') out = 'none';
    else if (e === 'ease') out = CustomEase.create('cb' + easeId++, 'M0,0 C0.25,0.1 0.25,1 1,1');
    else if (e === 'ease-out') out = CustomEase.create('cb' + easeId++, 'M0,0 C0,0 0.58,1 1,1');
    else if (e === 'ease-in') out = CustomEase.create('cb' + easeId++, 'M0,0 C0.42,0 1,1 1,1');
    else if (e === 'ease-in-out') out = CustomEase.create('cb' + easeId++, 'M0,0 C0.42,0 0.58,1 1,1');
    easeCache[e] = out;
    return out;
  }

  // mulberry32 — seeded randomness so renders are reproducible
  function rng(seed) {
    let a = (typeof seed === 'string' ? [...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7) : seed) >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const ms = (v, d = 0) => (v == null ? d : v / 1000);
  const px = (v) => (typeof v === 'number' ? v + 'px' : v);

  // Translate style.json animation props into GSAP vars. Filter-type props are merged into one filter
  // string with a fixed function order so from/to always interpolate.
  const FILTER_KEYS = ['blur', 'brightness', 'saturate', 'contrast', 'hueRotate'];
  const META_KEYS = new Set(['note', 'measured', 'tF', 'tMs', 'easing', 'unit', 'durationMs', 'durationF']);
  function mapVars(o = {}, filterTemplate) {
    const v = {};
    const f = {};
    const clip = {};
    for (const [k, val] of Object.entries(o || {})) {
      if (val == null || META_KEYS.has(k)) continue;
      switch (k) {
        case 'rotate': v.rotation = val; break;
        case 'blur': case 'brightness': case 'saturate': case 'contrast': case 'hueRotate': f[k] = val; break;
        case 'clip': case 'clipPath': v.clipPath = val; break;
        case 'clipLeftPct': clip.l = val; break;
        case 'clipRightPct': clip.r = val; break;
        case 'clipTopPct': clip.t = val; break;
        case 'clipBottomPct': clip.b = val; break;
        case 'letterSpacing': v.letterSpacing = px(val); break;
        case 'glowStrength': case 'glow': v['--glow-k'] = val; break;
        default: v[k] = val;
      }
    }
    if (Object.keys(clip).length) v.clipPath = `inset(${clip.t ?? 0}% ${clip.r ?? 0}% ${clip.b ?? 0}% ${clip.l ?? 0}%)`;
    const keys = filterTemplate || Object.keys(f);
    if (keys.length) {
      v.filter = FILTER_KEYS.filter((k) => keys.includes(k)).map((k) => {
        const val = f[k] ?? ({ blur: 0, brightness: 1, saturate: 1, contrast: 1, hueRotate: 0 })[k];
        return k === 'blur' ? `blur(${val}px)` : k === 'hueRotate' ? `hue-rotate(${val}deg)` : `${k}(${val})`;
      }).join(' ');
    }
    return v;
  }
  function filterKeysOf(...objs) {
    const s = new Set();
    for (const o of objs) for (const k of Object.keys(o || {})) if (FILTER_KEYS.includes(k)) s.add(k);
    return [...s];
  }
  // the CSS/GSAP channel a style.json prop writes (props sharing a channel overwrite each other)
  function channelOf(k) {
    if (FILTER_KEYS.includes(k)) return 'filter';
    if (k === 'clip' || k === 'clipPath' || /^clip(Left|Right|Top|Bottom)Pct$/.test(k)) return 'clipPath';
    if (k === 'rotate') return 'rotation';
    if (k === 'glowStrength' || k === 'glow') return '--glow-k';
    return k;
  }

  // ---------- Arabic-safe text splitting ----------
  // Letters that never connect to the following letter.
  const NON_JOIN_LEFT = new Set(['ا', 'أ', 'إ', 'آ', 'ٱ', 'د', 'ذ', 'ر', 'ز', 'و', 'ؤ', 'ة', 'ء']);
  const isArabic = (c) => /[؀-ۿݐ-ݿࢠ-ࣿ]/.test(c);
  const isMark = (c) => /[ً-ٰٟۖ-ۭ]/.test(c);
  const ZWJ = '‍';
  const TATWEEL = 'ـ';

  function graphemes(word) {
    const out = [];
    const chars = [...word];
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i];
      if (isMark(c) && out.length) { out[out.length - 1] += c; continue; }
      if (c === 'ل' && /[اأإآ]/.test(chars[i + 1] || '')) { out.push(c + chars[i + 1]); i++; continue; }
      out.push(c);
    }
    return out;
  }
  const baseChar = (g) => [...g].filter((c) => !isMark(c)).pop();
  const joinsLeft = (g) => isArabic(g[0]) && !NON_JOIN_LEFT.has(baseChar(g)) && !/^ل[اأإآ]/.test(g);
  const isTatweelRun = (g) => g.length > 0 && [...g].every((c) => c === TATWEEL);

  // insert n tatweels after letter `at` (or the first joinable letter) of a word
  function tatweel(word, n, at) {
    if (!n) return word;
    const g = graphemes(word);
    const ok = (i) => i < g.length - 1 && joinsLeft(g[i]) && isArabic(g[i + 1][0]);
    const i = at != null && ok(at) ? at : g.findIndex((_, k) => ok(k));
    if (i < 0) return word;
    g[i] += TATWEEL.repeat(n);
    return g.join('');
  }

  // style.json kashida spec → stretched text (skipped when the author already typed tatweels)
  function applyKashida(text, k) {
    if (!k || typeof text !== 'string' || text.includes(TATWEEL)) return text;
    const words = text.split(' ');
    if (k.perJoint) {
      let left = k.joints || 1;
      return words.map((w) => {
        if (!left) return w;
        const g = graphemes(w);
        for (let i = 0; i < g.length - 1 && left; i++) {
          if (joinsLeft(g[i]) && isArabic(g[i + 1][0])) { g[i] += TATWEEL.repeat(k.perJoint); left--; break; }
        }
        return g.join('');
      }).join(' ');
    }
    if (k.count) {
      // stretch the longest word (the one the eye reads as the "rule")
      let best = 0;
      words.forEach((w, i) => { if (graphemes(w).length > graphemes(words[best]).length) best = i; });
      words[best] = tatweel(words[best], k.count, k.afterLetterIndex);
      return words.join(' ');
    }
    return text;
  }

  // segments: string | [{text, style}] ; unit: letter | word | line | none
  // opts.tatweelUnit: "each" (default — every tatweel is its own letter unit) | "run" (a run of consecutive
  // tatweels is ONE letter unit, so it fades/scales as one stroke)
  function buildUnits(container, segments, unit, opts = {}) {
    const units = [];
    const segs = typeof segments === 'string' ? [{ text: segments }] : segments;
    const lines = [[]];
    for (const s of segs) {
      const parts = s.text.split('\n');
      parts.forEach((p, i) => { if (i > 0) lines.push([]); if (p) lines[lines.length - 1].push({ ...s, text: p }); });
    }
    for (const line of lines) {
      const lineEl = document.createElement('span');
      lineEl.className = 'mg-line';
      container.appendChild(lineEl);
      if (unit === 'line') units.push(lineEl);
      line.forEach((seg) => {
        const words = seg.text.split(/(\s+)/);
        for (const w of words) {
          if (!w) continue;
          if (/^\s+$/.test(w)) {
            const sp = document.createElement('span');
            sp.className = 'mg-space';
            sp.textContent = ' ';
            lineEl.appendChild(sp);
            if (unit === 'letter') sp.dataset.space = '1';
            continue;
          }
          const wEl = document.createElement('span');
          wEl.className = 'mg-word';
          if (seg.style) applyTextStyle(wEl, seg.style);
          if (seg.className) wEl.classList.add(seg.className);
          lineEl.appendChild(wEl);
          if (unit === 'letter') {
            let g = graphemes(w);
            if (opts.tatweelUnit === 'run') {
              const merged = [];
              for (const gr of g) {
                if (gr === TATWEEL && merged.length && isTatweelRun(merged[merged.length - 1])) merged[merged.length - 1] += gr;
                else merged.push(gr);
              }
              g = merged;
            }
            g.forEach((gr, gi) => {
              const l = document.createElement('span');
              l.className = 'mg-letter';
              if (isTatweelRun(gr)) l.dataset.tatweel = String(gr.length);
              const prevJoins = gi > 0 && joinsLeft(g[gi - 1]) && isArabic(gr[0]);
              const nextJoins = gi < g.length - 1 && joinsLeft(gr) && isArabic(g[gi + 1][0]);
              l.textContent = (prevJoins ? ZWJ : '') + gr + (nextJoins ? ZWJ : '');
              wEl.appendChild(l);
              units.push(l);
            });
          } else {
            wEl.textContent = w;
            if (unit === 'word') units.push(wEl);
          }
        }
      });
    }
    return units;
  }

  // glow layers scale with the animatable CSS variable --glow-k (style presets tween `glowStrength`)
  const glowColor = (color) => `rgb(from ${color} r g b / calc(alpha * var(--glow-k, 1)))`;
  function glowLayers(g) {
    if (!g || !g.color) return [];
    const r = g.radiusPx ?? 20;
    const s = g.strength ?? 1;
    const c = glowColor(g.color);
    const out = [[Math.round(r * 0.25), c], [Math.round(r * 0.6), c], [r, c]];
    if (s > 1) out.push([Math.round(r * 1.8), c]);
    if (s > 1.6) out.push([Math.round(r * 3), c]);
    return out;
  }
  function glowShadow(g) {
    return glowLayers(g).map(([r, c]) => `0 0 ${r}px ${c}`).join(', ');
  }

  function extrusionSteps(e) {
    if (!e || e.css) return null;
    const n = Math.max(1, Math.round(e.depthPx ?? 8));
    const ox = e.offsetX ?? n * 0.6;
    const oy = e.offsetY ?? n;
    return { n, ox, oy, color: e.color || e.sideColor || '#000' };
  }
  function extrusionShadow(e) {
    const s = extrusionSteps(e);
    if (!s) return '';
    const out = [];
    for (let i = 1; i <= s.n; i++) out.push(`${((s.ox * i) / s.n).toFixed(1)}px ${((s.oy * i) / s.n).toFixed(1)}px 0 ${s.color}`);
    return out.join(', ');
  }
  function shadowCss(shadow) {
    if (!shadow) return '';
    return typeof shadow === 'string' ? shadow : `${shadow.x ?? shadow.offsetX ?? 0}px ${shadow.y ?? shadow.offsetY ?? 4}px ${shadow.blurPx ?? 12}px ${shadow.color || 'rgba(0,0,0,.5)'}`;
  }

  function fontFor(role) {
    return (C.style.fonts || []).find((x) => x.role === role) || (C.style.fonts || [])[0] || {};
  }

  const famId = (s) => String(s).replace(/^@fontsource\//, '').toLowerCase().replace(/\s+/g, '-');

  // Per-element record of what applyTextStyle put into text-shadow, so the post-layout pass can tell whether a
  // component replaced it (then the component owns the effect and the engine leaves it alone).
  const fxRecords = new WeakMap();
  function applyTextStyle(el, st = {}) {
    const f = st.fontRole ? fontFor(st.fontRole) : {};
    const fx = { ...(f.effects || {}), ...(st.effects || {}) };
    const fam = st.family || st.fontsource || f.fontsource || f.family;
    if (fam) el.style.fontFamily = `'${famId(fam)}', 'noto-sans-arabic', sans-serif`;
    const weight = st.weight ?? f.weight;
    if (weight) el.style.fontWeight = weight;
    const size = st.sizePx ?? f.sizePx;
    if (size) el.style.fontSize = size + 'px';
    const lh = st.lineHeight ?? f.lineHeight;
    if (lh) el.style.lineHeight = lh;
    const ls = st.letterSpacing ?? f.letterSpacing;
    if (ls != null) el.style.letterSpacing = px(ls);
    const fill = st.fill ?? f.fill;
    const color = st.color ?? (fill && fill.type === 'solid' ? fill.color : null) ?? f.color;
    if (color) el.style.color = color;
    let gradient = false;
    if (fill && (fill.gradient || typeof fill === 'string') && st.color == null) {
      el.style.backgroundImage = fill.gradient || fill;
      el.style.webkitBackgroundClip = 'text';
      el.style.backgroundClip = 'text';
      el.style.color = 'transparent';
      el.dataset.gradient = '1';
      gradient = true;
    }
    const glow = st.glow !== undefined ? st.glow : fx.glow;
    const shadow = st.shadow !== undefined ? st.shadow : fx.shadow;
    // tightHalo = alias of glowTight (style-2 neon). Applied by the post-layout pass, and only if no component has
    // rewritten text-shadow by then (style workarounds that add their own halo keep working unchanged).
    const tight = fx.glowTight || null;
    const tightAlias = !fx.glowTight && fx.tightHalo && fx.tightHalo.color ? fx.tightHalo : null;
    const neon = fx.neonRim ? { color: fx.neonRim.color, radiusPx: fx.neonRim.glowPx ?? 9 } : null;
    const ts = [
      extrusionShadow(fx.extrusion),
      glowShadow(tight),
      glowShadow(glow),
      neon ? glowShadow(neon) : '',
      shadowCss(shadow),
    ].filter(Boolean).join(', ');
    if (ts) el.style.textShadow = ts;
    const wrapperFilter = [fx.extrusion?.css, fx.bevel?.implementation && fx.bevel.highlight ? `drop-shadow(0 -1px 0 ${fx.bevel.highlight}) drop-shadow(0 2px 2px ${fx.bevel.shadow || 'rgba(0,0,0,.35)'})` : ''].filter(Boolean).join(' ');
    if (wrapperFilter) el.dataset.wrapperFilter = wrapperFilter;
    if (ts || tightAlias) {
      // the same effects as a drop-shadow filter chain (used for gradient fills, where text-shadow would paint OVER
      // the background-clip:text fill). drop-shadow blur = text-shadow blur radius (both σ = r / 2).
      const chain = [];
      const ex = extrusionSteps(fx.extrusion);
      // n hard drop-shadows of one step each compound into the full extrusion (every pass shifts content + the
      // previous copies by one more step)
      if (ex) for (let i = 0; i < ex.n; i++) chain.push(`drop-shadow(${(ex.ox / ex.n).toFixed(2)}px ${(ex.oy / ex.n).toFixed(2)}px 0 ${ex.color})`);
      for (const g of [tightAlias || tight, glow, neon]) for (const [r, c] of glowLayers(g)) chain.push(`drop-shadow(0 0 ${r}px ${c})`);
      const sh = shadow && typeof shadow === 'object' ? `drop-shadow(${shadow.x ?? shadow.offsetX ?? 0}px ${shadow.y ?? shadow.offsetY ?? 4}px ${shadow.blurPx ?? 12}px ${shadow.color || 'rgba(0,0,0,.5)'})` : '';
      if (sh) chain.push(sh);
      fxRecords.set(el, { ts: el.style.textShadow, gradient, chain: chain.join(' '), tight: tightAlias ? glowShadow(tightAlias) : '' });
    }
    const stroke = st.stroke !== undefined ? st.stroke : fx.stroke;
    if (stroke && stroke.widthPx) el.style.webkitTextStroke = `${stroke.widthPx}px ${stroke.color}`;
    const blend = st.blend || st.blendMode || fx.blendMode;
    if (blend) el.style.mixBlendMode = blend;
    if (fx.scaleX) el.dataset.scaleX = fx.scaleX;
    if (st.opacity != null) el.style.opacity = st.opacity;
    if (st.css) Object.assign(el.style, st.css);
  }

  function place(el, pos = {}) {
    const anchor = pos.anchor || 'center';
    el.style.position = 'absolute';
    const xy = pos.centrePct || pos.centerPct;
    el.style.left = (xy ? xy[0] : pos.xPct ?? 50) + '%';
    el.style.top = (xy ? xy[1] : pos.yPct ?? 50) + '%';
    if (pos.widthPct) el.style.width = pos.widthPct + '%';
    if (pos.maxWidthPct) el.style.maxWidth = pos.maxWidthPct + '%';
    // "ink..." anchors: the box is centred here; the ink pass (after fonts load) moves the measured INK box onto
    // the anchor point
    const ink = /^ink/.test(anchor);
    if (ink) el.dataset.inkAnchor = anchor;
    let ax = -50, ay = -50;
    if (!ink) {
      ax = anchor.includes('left') ? 0 : anchor.includes('right') ? -100 : -50;
      ay = anchor.includes('top') ? 0 : anchor.includes('bottom') ? -100 : -50;
    }
    gsap.set(el, { xPercent: ax, yPercent: ay });
    el.style.textAlign = pos.align || 'center';
  }

  // ---------- face lookup (for camera focus + face-relative placement) ----------
  function face(t) {
    const i = Math.max(0, Math.min(C.faces.length - 1, Math.round(t * FPS)));
    const f = C.faces[i] || { x: 0.4, y: 0.2, w: 0.2, h: 0.12 };
    return { x: f.x * W, y: f.y * H, w: f.w * W, h: f.h * H, cx: (f.x + f.w / 2) * W, cy: (f.y + f.h / 2) * H };
  }

  // ---------- ink measurement (anchor: "ink…", ctx.measureInk) ----------
  const inkCtx = document.createElement('canvas').getContext('2d');
  // Ink box of a text element in its own untransformed px (relative to its border box): canvas font metrics per
  // word (actualBoundingBox*) around the DOM baseline of the word's line. Transforms on the element and its units
  // (from-states rendered by immediateRender) are switched off while measuring.
  function measureInk(el) {
    const saved = [];
    for (const n of [el, ...el.querySelectorAll('*')]) {
      if (n.style && n.style.transform) { saved.push([n, n.style.transform]); n.style.transform = 'none'; }
    }
    try {
      const er = el.getBoundingClientRect();
      const sx = er.width / (el.offsetWidth || 1) || 1;
      const sy = er.height / (el.offsetHeight || 1) || 1;
      let box = null;
      const words = el.querySelectorAll('.mg-word');
      const items = words.length ? [...words] : [el];
      for (const w of items) {
        const text = (w.textContent || '').replace(/‍/g, '');
        if (!text.trim()) continue;
        const cs = getComputedStyle(w);
        inkCtx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        inkCtx.direction = /[؀-ۿ]/.test(text) ? 'rtl' : 'ltr';
        inkCtx.textAlign = 'left';
        const m = inkCtx.measureText(text);
        const r = w.getBoundingClientRect();
        if (!r.width && !r.height) continue;
        // baseline: a zero-size inline-block sits ON the baseline of the line it is in
        const mk = document.createElement('span');
        mk.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline;';
        w.appendChild(mk);
        const by = mk.getBoundingClientRect().top;
        mk.remove();
        const b = {
          x0: r.left - m.actualBoundingBoxLeft * sx,
          x1: r.right + (m.actualBoundingBoxRight - m.width) * sx,
          y0: by - m.actualBoundingBoxAscent * sy,
          y1: by + m.actualBoundingBoxDescent * sy,
        };
        box = box ? { x0: Math.min(box.x0, b.x0), x1: Math.max(box.x1, b.x1), y0: Math.min(box.y0, b.y0), y1: Math.max(box.y1, b.y1) } : b;
      }
      if (!box) return null;
      return { x0: (box.x0 - er.left) / sx, x1: (box.x1 - er.left) / sx, y0: (box.y0 - er.top) / sy, y1: (box.y1 - er.top) / sy, w: el.offsetWidth, h: el.offsetHeight };
    } finally {
      for (const [n, v] of saved) n.style.transform = v;
    }
  }
  const inkQueue = [];
  function runInkAnchors() {
    while (inkQueue.length) {
      const el = inkQueue.shift();
      const anchor = el.dataset.inkAnchor || 'ink';
      const b = measureInk(el);
      if (!b) continue;
      const sxk = Number(el.dataset.scaleX || 1);
      const ix = anchor.includes('left') ? b.x0 : anchor.includes('right') ? b.x1 : (b.x0 + b.x1) / 2;
      const iy = anchor.includes('top') ? b.y0 : anchor.includes('bottom') ? b.y1 : (b.y0 + b.y1) / 2;
      // the box centre sits on (left, top) (xPercent/yPercent -50) and scaleX acts about the box centre
      const dx = -(ix - b.w / 2) * sxk;
      const dy = -(iy - b.h / 2);
      el.style.left = `calc(${el.style.left || '50%'} + ${dx.toFixed(2)}px)`;
      el.style.top = `calc(${el.style.top || '50%'} + ${dy.toFixed(2)}px)`;
      el.dataset.inkBox = [b.x0, b.y0, b.x1, b.y1].map((v) => v.toFixed(1)).join(',');
    }
  }

  // ---------- text cue builder (generic preset interpreter) ----------
  function presetById(id) {
    const p = (C.style.textPresets || []).find((x) => x.id === id);
    if (!p && id) console.warn('unknown text preset', id);
    return p || {};
  }

  function deepMerge(a, b) {
    if (!b) return a;
    const o = Array.isArray(a) ? [...a] : { ...a };
    for (const [k, v] of Object.entries(b)) {
      o[k] = v && typeof v === 'object' && !Array.isArray(v) && a && typeof a[k] === 'object' && a[k] ? deepMerge(a[k], v) : v;
    }
    return o;
  }

  const postLayout = [];
  const registerPostLayout = (fn) => { if (typeof fn === 'function') postLayout.push(fn); return fn; };

  // animate `targets` through a keyframe list [{tMs, ...props, easing}] (first entry = start state)
  function keyframeTweens(tl, targets, frames, at, staggerEach = 0) {
    const fk = filterKeysOf(...frames);
    tl.set(targets, { ...mapVars(frames[0], fk), immediateRender: false }, at);
    for (let k = 1; k < frames.length; k++) {
      const a = frames[k - 1];
      const b = frames[k];
      const dur = Math.max(1 / FPS / 4, ((b.tMs ?? 0) - (a.tMs ?? 0)) / 1000);
      tl.to(targets, { ...mapVars(b, fk), duration: dur, ease: ease(b.easing || 'linear'), stagger: staggerEach, immediateRender: false }, at + (a.tMs ?? 0) / 1000);
    }
    return ((frames[frames.length - 1].tMs ?? 0) / 1000) + staggerEach * Math.max(0, targets.length - 1);
  }

  // cue currently being built (for data-cue tagging of every text it creates)
  let building = null;
  const textFxQueue = []; // {el, host} with an fxRecord, finalised after postLayout
  const animBgEls = []; // split gradient text whose element background is tweened

  function makeTextBase(cue, tl, opts = {}) {
    const p = deepMerge(presetById(cue.preset), cue.override);
    const st = deepMerge(p.style || {}, cue.style);
    const pos = deepMerge(p.position || {}, cue.position);
    const unit = cue.unit || p.unit || 'word';
    const worldLock = cue.worldLock ?? p.worldLock ?? false;
    const pin = deepMerge(p.in || {}, cue.in);
    const el = document.createElement('div');
    el.className = 'mg-text ' + (p.className || '') + ' ' + (cue.className || '');
    el.dir = cue.dir || p.dir || 'auto';
    if (building && building.index != null) el.dataset.cue = String(building.index);
    if (cue.preset) el.dataset.preset = cue.preset;
    applyTextStyle(el, st);
    place(el, pos);
    if (el.dataset.inkAnchor) inkQueue.push(el);
    if (el.dataset.scaleX) gsap.set(el, { scaleX: Number(el.dataset.scaleX) });
    let host = el;
    if (el.dataset.wrapperFilter) {
      // filter-chain effects (bevel, drop-shadow extrusion) live on a wrapper so unit filters don't fight them
      host = document.createElement('div');
      host.className = 'mg-text-host';
      host.style.position = 'absolute';
      host.style.inset = '0';
      host.style.filter = el.dataset.wrapperFilter;
      host.appendChild(el);
    }
    (opts.parent || layerFor(cue.layer || p.layer || 'front', worldLock)).appendChild(host);
    if (fxRecords.has(el)) textFxQueue.push({ el, host });
    let segments = cue.segments || cue.text || '';
    if (cue.words) segments = cue.words.map((w) => w.text).join(' ');
    if (cue.tatweel && typeof segments === 'string') segments = segments.split(' ').map((w) => tatweel(w, cue.tatweel)).join(' ');
    else if (p.kashida && cue.kashida !== false && typeof segments === 'string') segments = applyKashida(segments, cue.kashida || p.kashida);
    const tatweelUnit = cue.tatweelUnit ?? pin.tatweelUnit ?? p.tatweelUnit ?? 'each';
    const units = buildUnits(el, segments, unit === 'none' ? 'word' : unit, { tatweelUnit });
    const targets = unit === 'none' ? [el] : units;
    gsap.set(el, { autoAlpha: 0 });

    const reflow = (cue.reflow ?? p.reflow ?? pin.reflow) && unit !== 'none';
    const inDur = ms(pin.durationMs, 0.4);
    const stagger = ms(pin.staggerMs, 0);
    if (pin.transformOrigin) gsap.set(targets, { transformOrigin: pin.transformOrigin });
    tl.set(el, { autoAlpha: 1, immediateRender: false }, 0);

    // when each unit starts
    const startOf = (i) => (cue.words ? Math.max(0, (cue.words[i]?.t ?? cue.t) - cue.t) : i * stagger);
    if (reflow) {
      // live reflow: a unit takes up space only once it starts (type-on look)
      postLayout.push(() => gsap.set(units, { display: 'none' }));
      el.querySelectorAll('.mg-space').forEach((s) => postLayout.push(() => gsap.set(s, { display: 'none' })));
      units.forEach((u, i) => {
        tl.set(u, { display: 'inline-block', immediateRender: false }, startOf(i));
        // spaces appear with the next word's first letter
        const prev = u.parentElement?.previousSibling;
        if (prev && prev.classList?.contains('mg-space') && u === u.parentElement.firstChild) tl.set(prev, { display: 'inline', immediateRender: false }, startOf(i));
      });
    }

    // Unit gating: a staggered fromTo with immediateRender renders EVERY unit's from-state at the cue start, so a
    // visible from-state (from.opacity > 0, or a scale/offset-only from) pre-shows later units. Each split unit stays
    // `visibility: hidden` until the first tween that animates it starts.
    const gateAt = new Map();
    const noteStart = (u, s) => { if (unit === 'none' || !u) return; const prev = gateAt.get(u); if (prev == null || s < prev) gateAt.set(u, s); };

    const tracks = Array.isArray(pin.tracks) ? pin.tracks : [];
    const trackProps = new Set(tracks.map((t) => t.prop));
    const baseFrom = { ...(pin.from || {}) };
    const baseTo = { ...(pin.to || {}) };
    for (const k of trackProps) { delete baseFrom[k]; delete baseTo[k]; }
    // tracks for filter props are merged into one filter tween (they share the CSS `filter` property)
    const filterTracks = tracks.filter((t) => FILTER_KEYS.includes(t.prop));
    const otherTracks = tracks.filter((t) => !FILTER_KEYS.includes(t.prop));
    const staggerSpec = pin.staggerFrom ? { each: stagger, from: pin.staggerFrom } : stagger;
    // per-target stagger offsets exactly as GSAP distributes them (stagger number or {each, from})
    const staggerOffsets = () => {
      if (!stagger || targets.length < 2) return targets.map(() => 0);
      const fn = gsap.utils.distribute(typeof staggerSpec === 'number' ? { each: staggerSpec } : staggerSpec);
      return targets.map((t, i) => fn(i, t, targets));
    };
    const tweenUnits = (from, to, dur, easing, at0 = 0) => {
      const fk = filterKeysOf(from, to);
      if (!Object.keys(from).length && !Object.keys(to).length) return;
      // only a from-state with real values is an entrance (a component may null the preset's from/to and run its own
      // per-unit timing, e.g. style-2's type-on retime; mapVars would still emit a neutral default filter for it)
      const animates = Object.keys(from).some((k) => from[k] != null && !META_KEYS.has(k));
      if (cue.words) {
        cue.words.forEach((w, i) => {
          if (!targets[i]) return;
          tl.fromTo(targets[i], mapVars(from, fk), { ...mapVars(to, fk), duration: dur, ease: ease(easing), immediateRender: true }, at0 + startOf(i));
          if (animates) noteStart(targets[i], at0 + startOf(i));
        });
      } else {
        tl.fromTo(targets, mapVars(from, fk), { ...mapVars(to, fk), duration: dur, ease: ease(easing), stagger: staggerSpec, immediateRender: true }, at0);
        if (animates) staggerOffsets().forEach((o, i) => noteStart(targets[i], at0 + o));
      }
    };
    let inEnd = 0;
    if (Array.isArray(pin.keyframes) && pin.keyframes.length && pin.keyframes[0].steps == null) {
      inEnd = keyframeTweens(tl, targets, pin.keyframes, 0, stagger);
      targets.forEach((u, i) => noteStart(u, i * stagger));
      // in.from / in.to must not override what the keyframes animate (props sharing a CSS channel included)
      const kfChannels = new Set();
      for (const fr of pin.keyframes) for (const k of Object.keys(fr || {})) if (!META_KEYS.has(k)) kfChannels.add(channelOf(k));
      for (const o of [baseFrom, baseTo]) for (const k of Object.keys(o)) if (kfChannels.has(channelOf(k))) delete o[k];
      if (Object.keys(baseFrom).length || Object.keys(baseTo).length) tweenUnits(baseFrom, baseTo, inDur, pin.easing);
    } else if (Array.isArray(pin.keyframes) && pin.keyframes.length) {
      // grouped keyframes: [{unit: 'first'|'last'|'all'|'rest', steps:[...]}] — every group's start state applies at
      // the cue start (not only at the group's own start), so later groups never show their rest state early
      for (const g of pin.keyframes) {
        const sel = String(g.unit || 'all');
        const tg = sel.startsWith('first') ? targets.slice(0, 1) : sel.startsWith('last') ? targets.slice(-1) : sel.startsWith('rest') ? targets.slice(1) : targets;
        if (!tg.length || !Array.isArray(g.steps) || !g.steps.length) continue;
        const idx0 = targets.indexOf(tg[0]);
        const at = startOf(Math.max(0, idx0));
        if (at > 0) tl.set(tg, { ...mapVars(g.steps[0], filterKeysOf(...g.steps)), immediateRender: false }, 0);
        inEnd = Math.max(inEnd, keyframeTweens(tl, tg, g.steps, at, stagger));
        tg.forEach((u, i) => noteStart(u, at + i * stagger));
      }
    } else {
      tweenUnits(baseFrom, baseTo, inDur, pin.easing);
    }
    if (filterTracks.length) {
      const longest = filterTracks.reduce((a, b) => ((b.durationMs ?? 0) > (a.durationMs ?? 0) ? b : a));
      const from = Object.fromEntries(filterTracks.map((t) => [t.prop, t.from]));
      const to = Object.fromEntries(filterTracks.map((t) => [t.prop, t.to]));
      tweenUnits(from, to, ms(longest.durationMs, inDur), longest.easing || pin.easing);
    }
    for (const tr of otherTracks) tweenUnits({ [tr.prop]: tr.from }, { [tr.prop]: tr.to }, ms(tr.durationMs, inDur), tr.easing || pin.easing, ms(tr.delayMs, 0));
    const lastStart = cue.words ? startOf(cue.words.length - 1) : stagger * Math.max(0, targets.length - 1);
    const longestTrack = tracks.reduce((m, t) => Math.max(m, ms(t.durationMs, 0) + ms(t.delayMs, 0)), 0);
    inEnd = Math.max(inEnd, lastStart + Math.max(inDur, longestTrack));
    if (cue.gate !== false && p.gate !== false) {
      for (const [u, s] of gateAt) {
        if (s <= 1e-6) continue;
        gsap.set(u, { visibility: 'hidden' });
        tl.set(u, { visibility: 'inherit', immediateRender: false }, s);
      }
    }

    const pout = cue.out === null ? null : deepMerge(p.out || {}, cue.out);
    const hasOut = pout && (pout.to || pout.from);
    const outDur = hasOut ? ms(pout.durationMs, 0.3) : 0;
    const outSpan = hasOut ? outDur + ms(pout.staggerMs, 0) * Math.max(0, (pout.unit === 'none' ? 1 : targets.length) - 1) : 0;
    let outStart;
    if (cue.end != null) outStart = Math.max(inEnd, cue.end - cue.t - outSpan);
    else outStart = inEnd + ms(cue.holdMs ?? p.holdMs, 1.5);

    // settle (tracking tighten), hold loops, drift — between in and out
    if (p.settle && p.settle.property) {
      const s = p.settle;
      const unitSuffix = s.fromEm != null ? 'em' : 'px';
      tl.fromTo(targets, { [s.property]: (s.fromEm ?? s.from) + unitSuffix }, { [s.property]: (s.toEm ?? s.to) + unitSuffix, duration: ms(s.durationMs, 0.4), ease: ease(s.easing), immediateRender: false }, inEnd);
    }
    const hold = p.hold || {};
    if (hold.to && !p.settle) {
      const hk = filterKeysOf(hold.from, hold.to);
      const holdLen = Math.max(0.1, outStart - inEnd);
      tl.fromTo(hold.target === 'units' ? targets : el, mapVars(hold.from || {}, hk), { ...mapVars(hold.to, hk), duration: ms(hold.durationMs, holdLen), ease: ease(hold.easing || 'linear'), immediateRender: false }, inEnd);
    }
    if (p.drift) {
      const { durationMs, easing, appliesTo, measured, ...props } = p.drift;
      tl.to(el, { ...mapVars(props), duration: ms(durationMs, 0.4), ease: ease(easing), immediateRender: false }, inEnd);
    }

    let hideAt = null;
    if (hasOut) {
      const ok = filterKeysOf(pout.from, pout.to);
      const outTargets = pout.unit === 'none' ? [el] : targets;
      tl.to(outTargets, { ...mapVars(pout.to || {}, ok), duration: outDur, ease: ease(pout.easing || 'power2.in'), stagger: pout.staggerFrom ? { each: ms(pout.staggerMs, 0), from: pout.staggerFrom } : ms(pout.staggerMs, 0), immediateRender: false }, outStart);
      tl.set(el, { autoAlpha: 0, immediateRender: false }, outStart + outSpan);
      hideAt = outStart + outSpan;
    } else if (cue.end != null || cue.holdMs != null || p.holdMs != null) {
      tl.set(el, { autoAlpha: 0, immediateRender: false }, outStart);
      hideAt = outStart;
    }
    // hard cut: the element is gone at cue.end even when its type-on (inEnd) runs past it
    if (cue.end != null && cue.end - cue.t >= 0 && (cue.hardCut ?? p.hardCut) !== false) {
      tl.set(el, { autoAlpha: 0, immediateRender: false }, cue.end - cue.t);
      hideAt = hideAt == null ? cue.end - cue.t : Math.min(hideAt, cue.end - cue.t);
    }

    // split gradient text whose ELEMENT background is tweened (hold/drift/out on the element, e.g. a sweep band):
    // the post-layout gradient split freezes a copy per unit, so it is re-projected from the element every frame
    if (el.dataset.gradient && units.length) {
      const bgKeys = (o) => o && Object.keys(o).some((k) => /^background(Position|Size)/.test(k));
      const animated = cue.animatedBackground ?? p.animatedBackground
        ?? ((hold.target !== 'units' && (bgKeys(hold.from) || bgKeys(hold.to))) || bgKeys(p.drift) || (hasOut && pout.unit === 'none' && (bgKeys(pout.from) || bgKeys(pout.to))));
      if (animated) el.dataset.animBg = '1';
    }
    return { el, host, units, inEnd, outStart, hideAt };
  }

  // makeText = textBuilders router + onText hooks around the generic interpreter
  const buildersActive = new Set();
  let textDepth = 0;
  function makeText(cue, tl, opts = {}) {
    textDepth++;
    let res;
    try {
      const id = cue && cue.preset;
      const builder = id && !opts.raw && !cue.raw && !buildersActive.has(id) ? textBuilders[id] : null;
      if (builder) {
        buildersActive.add(id);
        try {
          res = builder({ ...ctxBase, cue, tl, opts, presetId: id, preset: deepMerge(presetById(id), cue.override), layer: (n) => layerFor(n || cue.layer || presetById(id).layer, cue.worldLock ?? presetById(id).worldLock) });
        } finally { buildersActive.delete(id); }
        if (res && res.el) {
          if (building && building.index != null && !res.el.dataset.cue) res.el.dataset.cue = String(building.index);
          if (!res.el.dataset.preset) res.el.dataset.preset = id;
        }
      }
      if (!res) res = makeTextBase(cue, tl, opts);
    } finally { textDepth--; }
    if (textDepth === 0 && res && res.el) {
      const info = { cue, preset: deepMerge(presetById(cue.preset), cue.override), presetId: cue.preset, el: res.el, host: res.host || res.el, units: res.units || [], tl, inEnd: res.inEnd, outStart: res.outStart, ctx: ctxBase };
      for (const fn of textHooks) {
        try { fn(info); } catch (e) { console.error('onText hook failed', e.stack || e); }
      }
    }
    return res;
  }

  // ---------- camera ----------
  // Every camera cue owns its own state proxy {scale, x, y, rotation, ox, oy} on its own child timeline of
  // camMaster. The camera at time T is the state of the LATEST camera cue that has started (a later cue fully replaces
  // the earlier one at its start: cues are cuts), plus the additive tracks (handheld / wobble / additive keyframes)
  // that have started. A cue without scaleFrom (or without x/y/rotation) starts from the previous cue's state at its
  // start time, exactly like the old shared-proxy behaviour, but a still-running earlier tween can no longer win.
  const CAM0 = { scale: 1, x: 0, y: 0, rotation: 0, ox: W / 2, oy: H / 2 };
  const cam = { ...CAM0, blur: 0 };
  const camRecs = [];
  let camActive = null; // base record behind the last composition into `cam`
  function camMatrix(s = cam) {
    // translate(x,y) · translate(o) · rotate · scale · translate(-o)
    const r = ((s.rotation || 0) * Math.PI) / 180;
    const a = Math.cos(r) * s.scale;
    const b = Math.sin(r) * s.scale;
    return [a, b, -b, a, s.ox + s.x - a * s.ox + b * s.oy, s.oy + s.y - b * s.ox - a * s.oy];
  }
  function mulM(m, n) {
    return [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
      m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
  }
  function invM(m) {
    const det = m[0] * m[3] - m[1] * m[2] || 1e-9;
    const a = m[3] / det, b = -m[1] / det, c = -m[2] / det, d = m[0] / det;
    return [a, b, c, d, -(a * m[4] + c * m[5]), -(b * m[4] + d * m[5])];
  }
  // matrix for world-locked layers: the camera, or the camera relative to the active cue's rest framing
  function worldMatrix(s = cam) {
    const m = camMatrix(s);
    return s.rest ? mulM(m, invM(camMatrix(s.rest))) : m;
  }
  function focusOf(c, t) {
    const f = face(t);
    let ox = W / 2, oy = H / 2;
    const focus = c.focus ?? 'face';
    if (focus === 'face') { ox = f.cx; oy = f.cy; }
    else if (focus === 'centre' || focus === 'center') { ox = W / 2; oy = H / 2; }
    else if (Array.isArray(focus)) { ox = focus[0] * (focus[0] > 1 ? 1 : W); oy = focus[1] * (focus[1] > 1 ? 1 : H); }
    if (c.focusPx) { ox = c.focusPx[0]; oy = c.focusPx[1]; }
    return [ox, oy];
  }
  function buildCamera(cue, idx) {
    const preset = (C.style.cameraMoves || []).find((m) => m.id === cue.preset) || {};
    const c = { ...(C.style.cameraDefaults || {}), ...(C.scene.cameraDefaults || {}), ...preset, ...cue };
    // the cue's own `type` is "camera", so the MOVE type comes from cue.move / cue.moveType or the preset (v1 merged
    // {...preset, ...cue} and lost it: static / handheld presets were never recognised)
    const move = cue.move ?? cue.moveType ?? (cue.type && cue.type !== 'camera' ? cue.type : null) ?? preset.type ?? (c.keyframes ? 'keyframes' : 'scale');
    c.move = move;
    const tl = gsap.timeline();
    const rec = { cue, c, tl, idx, kind: 'base', st: null, inherit: [], rest: null };
    const d0 = ms(c.delayMs, 0);
    if (move === 'handheld' || move === 'wobble') {
      // additive wobble: offsets around whatever the base camera does
      rec.kind = 'add';
      const st = (rec.st = { x: 0, y: 0, rotation: 0, scale: 1 });
      const amp = c.amplitudePx ?? 8;
      const period = ms(c.durationMs, 1.5);
      const span = cue.end != null ? cue.end - cue.t : 6;
      const r = rng(Math.round(cue.t * 1000) + 7);
      // the last swing is clipped at the span, so it can never outlive the return to rest (a later-starting tween on
      // the same prop does not stop an earlier one that is still running in GSAP: both write, the earlier one last)
      // The return to rest must FINISH at the span (cue end), so the swings stop 0.2 s before it.
      const ret = Math.min(0.2, span / 2);
      const swingEnd = span - ret;
      for (let k = 0, at = 0; at < swingEnd - 1e-6; k++, at += period / 2) {
        tl.to(st, { x: (r() - 0.5) * 2 * amp, y: (r() - 0.5) * 2 * amp, duration: Math.min(period / 2, swingEnd - at), ease: 'sine.inOut', immediateRender: false }, at);
      }
      tl.to(st, { x: 0, y: 0, duration: ret, ease: 'sine.inOut', immediateRender: false }, swingEnd);
      return rec;
    }
    const [ox, oy] = focusOf(c, cue.t);
    if (Array.isArray(c.keyframes) && c.keyframes.length) {
      const k0 = c.keyframes[0];
      if (c.additive) {
        // additive keyframes: x/y/rotation are offsets, scale a multiplier
        rec.kind = 'add';
        const st = (rec.st = { x: k0.x ?? 0, y: k0.y ?? 0, rotation: k0.rotate ?? 0, scale: k0.scale ?? 1 });
        for (let k = 1; k < c.keyframes.length; k++) {
          const a = c.keyframes[k - 1];
          const b = c.keyframes[k];
          const dur = Math.max(1 / FPS / 4, ((b.tMs ?? 0) - (a.tMs ?? 0)) / 1000);
          tl.to(st, { scale: b.scale ?? a.scale ?? 1, x: b.x ?? 0, y: b.y ?? 0, rotation: b.rotate ?? 0, duration: dur, ease: ease(b.easing || 'linear'), immediateRender: false }, d0 + (a.tMs ?? 0) / 1000);
        }
        return rec;
      }
      rec.st = { ox, oy, scale: k0.scale ?? 1, x: k0.x ?? 0, y: k0.y ?? 0, rotation: k0.rotate ?? 0, dx: 0, dy: 0 };
      for (let k = 1; k < c.keyframes.length; k++) {
        const a = c.keyframes[k - 1];
        const b = c.keyframes[k];
        const dur = Math.max(1 / FPS / 4, ((b.tMs ?? 0) - (a.tMs ?? 0)) / 1000);
        tl.to(rec.st, { scale: b.scale ?? a.scale ?? 1, x: b.x ?? 0, y: b.y ?? 0, rotation: b.rotate ?? 0, duration: dur, ease: ease(b.easing || 'linear'), immediateRender: false }, d0 + (a.tMs ?? 0) / 1000);
      }
    } else if (move === 'static') {
      // a static crop / reframe: scaleTo (or scale, scaleFrom) about the focus, from the cue start
      rec.st = { ox, oy, scale: c.scaleTo ?? c.scale ?? c.scaleFrom ?? 1, x: c.x || 0, y: c.y || 0, rotation: c.rotate || 0, dx: 0, dy: 0 };
    } else {
      const from = c.scaleFrom ?? null;
      const to = c.scaleTo ?? c.scale ?? 1;
      const dur = ms(c.durationMs, 0);
      rec.st = { ox, oy, scale: from ?? 1, x: 0, y: 0, rotation: 0, dx: 0, dy: 0 };
      rec.inherit = from == null ? ['scale', 'x', 'y', 'rotation'] : ['x', 'y', 'rotation'];
      if (dur > 0) tl.to(rec.st, { scale: to, x: c.x || 0, y: c.y || 0, rotation: c.rotate || 0, duration: dur, ease: ease(c.easing || 'power2.inOut'), immediateRender: false }, d0);
      else tl.set(rec.st, { scale: to, x: c.x || 0, y: c.y || 0, rotation: c.rotate || 0, immediateRender: false }, d0);
      if (c.shake) {
        const r = rng(cue.t * 1000);
        const n = Math.round((c.shake.durationMs || 300) / (1000 / FPS));
        for (let k = 0; k < n; k++) tl.to(rec.st, { dx: (r() - 0.5) * c.shake.px, dy: (r() - 0.5) * c.shake.px, duration: 1 / FPS, ease: 'none', immediateRender: false }, d0 + k / FPS);
        tl.to(rec.st, { dx: 0, dy: 0, duration: 1 / FPS, immediateRender: false }, d0 + n / FPS);
      }
    }
    return rec;
  }
  // state of one record's own timeline at a local time (used at build time, before the records join camMaster)
  function recStateAt(rec, local) {
    rec.tl.time(Math.max(0, local) + EPS, true);
    return { ...rec.st };
  }
  const restOf = (st) => ({ scale: st.scale, x: st.x + (st.dx || 0), y: st.y + (st.dy || 0), rotation: st.rotation || 0, ox: st.ox, oy: st.oy });
  function finishCameras() {
    const order = [...camRecs].sort((a, b) => a.cue.t - b.cue.t || a.idx - b.idx);
    let prev = null;
    for (const rec of order) {
      if (rec.kind !== 'base') continue;
      if (rec.inherit.length) {
        const s = prev ? recStateAt(prev, rec.cue.t - prev.cue.t) : { ...CAM0 };
        for (const k of rec.inherit) rec.st[k] = s[k] ?? CAM0[k];
      }
      const wr = rec.c.worldRest;
      if (wr != null && wr !== false) {
        const fin = restOf(recStateAt(rec, rec.tl.duration()));
        const st0 = restOf(recStateAt(rec, 0));
        if (wr === 'start') rec.rest = st0;
        else if (typeof wr === 'number') rec.rest = { ...fin, scale: wr };
        else if (typeof wr === 'object') rec.rest = { ...fin, ...wr };
        else rec.rest = fin; // "final" | true
      }
      prev = rec;
    }
    // joining camMaster re-renders an already-evaluated child at the parent's time 0 (before its start), which
    // puts every proxy back to its initial state (GSAP _postAddChecks)
    for (const rec of order) camMaster.add(rec.tl, rec.cue.t);
  }
  function composeCam(T, out = {}) {
    let base = null;
    let bs = -Infinity;
    for (const r of camRecs) {
      if (r.kind !== 'base') continue;
      const s = r.tl.startTime();
      if (s <= T + 1e-6 && (s > bs || (s === bs && base && r.idx > base.idx))) { base = r; bs = s; }
    }
    const s = base ? base.st : CAM0;
    out.scale = s.scale;
    out.x = s.x + (s.dx || 0);
    out.y = s.y + (s.dy || 0);
    out.rotation = s.rotation || 0;
    out.ox = s.ox;
    out.oy = s.oy;
    for (const a of camRecs) {
      if (a.kind !== 'add' || a.tl.startTime() > T + 1e-6) continue;
      // additive tracks stop at their cue end (a wobble / additive keyframe offset must not leak into later shots)
      if (a.cue.end != null && T >= a.cue.end - 1e-6) continue;
      out.x += a.st.x || 0;
      out.y += a.st.y || 0;
      out.rotation += a.st.rotation || 0;
      out.scale *= a.st.scale ?? 1;
    }
    out.motionBlur = base ? base.c.motionBlur : undefined;
    out.rest = base ? base.rest : null;
    out.cueIndex = base ? base.idx : -1;
    return base;
  }
  // camera state at any time, without disturbing what is rendered (camMaster is put back where it was)
  function camAt(t) {
    const saved = camMaster.time();
    camMaster.time(Math.max(0, t) + EPS, true);
    const out = {};
    composeCam(Math.max(0, t) + EPS, out);
    camMaster.time(saved, true);
    return { ...out, matrix: camMatrix(out), world: worldMatrix(out) };
  }

  // ---------- frame hooks (image sequences, particles, grain) ----------
  const frameHooks = [];
  const onFrame = (fn) => frameHooks.push(fn);
  const assetUrl = (p) => (/^(file|https?|data):/.test(p) ? p : C.assetBase + p.replace(/^\.?\//, ''));

  // ---------- footage grade + overlays (drawn into the plate canvas, never over graphics) ----------
  const overlayImgs = [];
  let gradeCss = 'none';
  let overlaysOnBackdrop = false;
  function cssImage(background) {
    // rasterise any CSS background (gradients incl. elliptical radial) through SVG foreignObject
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${W}px;height:${H}px;background:${background.replace(/"/g, "'")}"></div></foreignObject></svg>`;
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    return img;
  }
  function gradeCssOf(g) {
    if (!g) return 'none';
    if (typeof g === 'string') return g.trim() || 'none';
    return g.css || [g.brightness != null && `brightness(${g.brightness})`, g.contrast != null && `contrast(${g.contrast})`, g.saturate != null && `saturate(${g.saturate})`, g.hueRotate != null && `hue-rotate(${g.hueRotate}deg)`].filter(Boolean).join(' ') || 'none';
  }
  async function buildGrade() {
    const sg = C.scene.grade;
    const preGraded = !!C.meta.preGraded;
    // scene.grade: false = off | true = style grade (even on a preGraded plate) | "css" | {css} or {brightness,...}
    if (sg === false) gradeCss = 'none';
    else if (sg === true) gradeCss = gradeCssOf(C.style.grade);
    else if (typeof sg === 'string' || (sg && typeof sg === 'object')) gradeCss = gradeCssOf(sg);
    else gradeCss = preGraded ? 'none' : gradeCssOf(C.style.grade);
    // scene.gradeCss: a per-plate trim appended after the resolved grade (e.g. "brightness(1.2)")
    if (C.scene.gradeCss) gradeCss = (gradeCss === 'none' ? '' : gradeCss + ' ') + C.scene.gradeCss;
    const so = C.scene.overlays;
    let ov;
    if (so === false) ov = {};
    else if (so === true) ov = { ...(C.style.overlays || {}) };
    else if (so && typeof so === 'object') ov = { ...(C.style.overlays || {}), ...so };
    else ov = preGraded ? {} : { ...(C.style.overlays || {}) };
    overlaysOnBackdrop = !!ov.applyToBackdrop;
    const items = [];
    if (ov.tint && ov.tint.color) items.push({ bg: ov.tint.color, blend: ov.tint.blend === 'normal' ? 'source-over' : ov.tint.blend || 'soft-light', opacity: ov.tint.opacity ?? 0.3 });
    if (ov.vignette) {
      const v = ov.vignette;
      items.push({ bg: `radial-gradient(ellipse ${v.shape || '75% 60%'} at ${v.centerXPct ?? 50}% ${v.centerYPct ?? 45}%, transparent ${v.innerPct ?? 55}%, ${v.color || 'rgba(0,0,0,0.65)'} 100%)`, blend: 'source-over', opacity: v.strength ?? 1 });
    }
    if (ov.bottomFade && ov.bottomFade.gradient) items.push({ bg: ov.bottomFade.gradient, blend: 'source-over', opacity: 1 });
    for (const it of items) {
      const img = cssImage(it.bg);
      await img.decode();
      overlayImgs.push({ img, blend: it.blend, opacity: it.opacity, bg: it.bg });
    }
    if (overlaysOnBackdrop && overlayImgs.length) {
      // overlay layer between the backdrop layers (bg/bgW) and #behind: the overlays then darken/tint a replaced
      // backdrop as well as the plate (drawn once: the plate canvas skips them, the talent gets them baked in)
      const ovl = document.createElement('div');
      ovl.id = 'ovl';
      ovl.className = 'layer';
      layers.bgW.after(ovl);
      layers.ovl = ovl;
      for (const o of overlayImgs) {
        const d = document.createElement('div');
        Object.assign(d.style, { position: 'absolute', left: '0px', top: '0px', width: '100%', height: '100%', background: o.bg, opacity: String(o.opacity), mixBlendMode: o.blend === 'source-over' ? 'normal' : o.blend });
        ovl.appendChild(d);
      }
    }
    if (ov.grain) {
      const cv = document.createElement('canvas');
      cv.width = W / 4; cv.height = H / 4;
      Object.assign(cv.style, { position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: ov.grain.amount ?? 0.06, mixBlendMode: 'overlay', imageRendering: 'pixelated' });
      layers.fx.appendChild(cv);
      const gctx = cv.getContext('2d');
      const img = gctx.createImageData(cv.width, cv.height);
      onFrame((t, i) => {
        const r = rng(i + 1);
        for (let k = 0; k < img.data.length; k += 4) { const v = r() * 255; img.data[k] = img.data[k + 1] = img.data[k + 2] = v; img.data[k + 3] = 255; }
        gctx.putImageData(img, 0, 0);
      });
    }
  }
  function drawOverlays(g) {
    for (const o of overlayImgs) {
      g.globalCompositeOperation = o.blend;
      g.globalAlpha = o.opacity;
      g.drawImage(o.img, 0, 0, W, H);
    }
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
  }

  // ---------- build the master timeline ----------
  const master = gsap.timeline({ paused: true });
  // Camera tweens live on their own timeline so motion-blur sub-samples never seek the graphics backwards. Its
  // onUpdate re-composes `cam` whenever someone seeks it with events on (e.g. camMaster.time(x, false) in a
  // component, to read the camera at another time); the runtime's own seeks suppress events and compose explicitly.
  const camMaster = gsap.timeline({ paused: true, onUpdate: () => { camActive = composeCam(camMaster.time(), cam); } });
  const registry = (MG.components = MG.components || {});
  const ctxBase = {
    W, H, FPS, style: C.style, scene: C.scene, meta: C.meta, layers, cam, camMaster, master, camAt, camMatrix, worldMatrix,
    makeText, makeTextBase, mapVars, filterKeysOf, ease, rng, face, onFrame, assetUrl, tatweel, applyKashida, graphemes,
    applyTextStyle, place, gsap, ms, keyframeTweens, postLayout, registerPostLayout, matteCanvas, measureInk,
    textBuilders, onText: MG.onText, engineFeatures: MG.engineFeatures, EPS,
  };
  MG.ctx = ctxBase;

  // ---------- cue lifecycle (display:none outside a cue's lifetime) ----------
  // Every DOM node a cue adds to a layer is taken out of the render tree (class .mg-off = display:none !important)
  // outside [start - ½ frame, end + ½ frame]. Hidden nodes keep their inline styles, so GSAP state and component
  // toggles are untouched underneath. A node that adopted earlier cues' nodes (e.g. a ghost wrapper) is not tracked.
  const lifecycle = [];
  const allLayers = () => [...screenLayers, ...worldLayers];
  function snapshotLayers() {
    const s = new Set();
    for (const L of allLayers()) for (const ch of L.children) s.add(ch);
    return s;
  }
  function trackNewNodes(before, t0, t1) {
    for (const L of allLayers()) {
      for (const ch of L.children) {
        if (before.has(ch)) continue;
        let adopted = false;
        for (const old of before) if (old !== ch && ch.contains(old)) { adopted = true; break; }
        if (!adopted) lifecycle.push({ node: ch, t0, t1, top: null, on: null });
      }
    }
  }
  const isFrame = (n) => !n || n === stage || n === document.body || (n.classList && (n.classList.contains('layer') || n.classList.contains('mg-cam')));
  function syncLifecycle(t) {
    // Exact [start, end) window: a cue whose end falls before a frame time is gone on that frame (hard cut), and
    // the outgoing shot's DOM never shares the frame before a cut with the incoming one. scene.lifecycleHalfFrame
    // restores the old lenient ±½-frame window.
    const half = C.scene.lifecycleHalfFrame ? 0.5 / FPS : 0;
    const tol = 1e-4;
    for (const r of lifecycle) {
      if (!r.top) {
        // The outermost wrapper that holds nothing of any OTHER cue: postLayout glow / filter wrappers a component put
        // around this cue's node (and its own extra copies) are hidden with it — a hidden node inside a still
        // displayed full-frame filter wrapper keeps costing a filter pass every frame. Never a layer / camera wrapper.
        let n = r.node;
        while (n.parentElement && !isFrame(n.parentElement)) {
          const P = n.parentElement;
          if (lifecycle.some((o) => o.node !== r.node && P.contains(o.node))) break;
          n = P;
        }
        r.top = n;
      }
      const on = t >= r.t0 - half - tol && (r.t1 == null || (half ? t <= r.t1 + half : t < r.t1 - tol));
      if (on !== r.on) { r.top.classList.toggle('mg-off', !on); r.on = on; }
    }
  }

  function build() {
    const all = C.scene.cues || [];
    const cues = all.map((cue, index) => ({ cue, index })).sort((a, b) => a.cue.t - b.cue.t);
    // cameras first, so components can ask ctx.camAt() while they build
    for (const { cue, index } of cues) {
      if (cue.type !== 'camera') continue;
      try { camRecs.push(buildCamera(cue, index)); } catch (e) { console.error('camera cue failed', JSON.stringify(cue).slice(0, 200), e.stack || e); }
    }
    finishCameras();
    // persistent style-level components (e.g. sunburst halo), registered by components.js
    const persistent = C.scene.persistent === false ? [] : [...(C.style.persistent || []), ...(C.scene.persistent || [])];
    const pprops = C.scene.persistentProps || {};
    persistent.forEach((p, k) => {
      const fn = registry[p.component];
      if (!fn) { console.warn('missing persistent component', p.component); return; }
      const tl = gsap.timeline();
      const extra = pprops[p.component];
      const cue = { t: p.t || 0, ...p, ...(extra ? { props: { ...(p.props || {}), ...extra } } : {}) };
      const before = snapshotLayers();
      building = { index: 'p' + k, cue };
      try {
        fn({ ...ctxBase, cue, tl, layer: (n) => layerFor(n || p.layer || 'bg', cue.worldLock) });
      } catch (e) {
        console.error('persistent component failed', p.component, e.stack || e);
      }
      building = null;
      trackNewNodes(before, cue.t, cue.end ?? null);
      master.add(tl, cue.t);
    });
    for (const { cue, index } of cues) {
      if (cue.type === 'camera') continue;
      const tl = gsap.timeline();
      const before = snapshotLayers();
      let end = cue.end ?? null;
      building = { index, cue };
      try {
        if (cue.type === 'text') {
          const res = makeText(cue, tl);
          if (end == null && res && res.hideAt != null) end = cue.t + res.hideAt;
        } else if (cue.type === 'component' || cue.type === 'background' || cue.type === 'image' || cue.type === 'sequence') {
          const id = cue.component || cue.id || (cue.type === 'background' ? 'bg-replace' : cue.type);
          const fn = registry[id];
          if (!fn) { console.warn('missing component', id); building = null; continue; }
          const spec = (C.style.graphicComponents || []).find((g) => g.id === id) || {};
          fn({ ...ctxBase, cue, spec, tl, cueIndex: index, layer: (n) => layerFor(n || cue.layer || spec.layer, cue.worldLock ?? spec.worldLock) });
        } else { building = null; continue; }
      } catch (e) {
        console.error('cue failed', JSON.stringify(cue).slice(0, 200), e.stack || e);
        building = null;
        continue;
      }
      building = null;
      trackNewNodes(before, cue.t, end);
      master.add(tl, cue.t);
    }
  }

  // gradient text inside split units: give every unit the gradient of the whole element (screen-space band)
  function fixSplitGradients() {
    document.querySelectorAll('.mg-text').forEach((el) => {
      if (!el.dataset.gradient) return;
      const prev = el.style.visibility;
      const box = el.getBoundingClientRect();
      const units = [...el.querySelectorAll('.mg-letter, .mg-word')];
      units.forEach((u) => {
        const r = u.getBoundingClientRect();
        u.style.backgroundImage = el.style.backgroundImage;
        u.style.backgroundSize = `${box.width}px ${box.height}px`;
        u.style.backgroundPosition = `${box.left - r.left}px ${box.top - r.top}px`;
        u.style.webkitBackgroundClip = 'text';
        u.style.backgroundClip = 'text';
        u.style.color = 'transparent';
      });
      el.style.visibility = prev;
      if (el.dataset.animBg && units.length) {
        // layout offsets of the units inside the element (transform-free), for the per-frame re-projection
        const offs = units.map((u) => {
          let x = 0, y = 0, n = u;
          while (n && n !== el) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
          return n === el ? [x, y] : null;
        });
        if (offs.every(Boolean)) animBgEls.push({ el, units, offs, img: units[0].style.backgroundImage, off: false, last: '' });
      }
    });
  }
  // background-size / background-position (CSS strings) → px for a gradient image in a w × h positioning area
  function bgSizePx(str, w, h) {
    const t = String(str || 'auto').trim().split(/\s+/);
    if (t[0] === 'cover' || t[0] === 'contain') return [w, h];
    const one = (v, box) => (v == null || v === 'auto' ? null : v.endsWith('%') ? (parseFloat(v) / 100) * box : parseFloat(v));
    const a = one(t[0], w);
    const b = one(t[1], h);
    return [a ?? w, b ?? h];
  }
  function bgPosPx(str, w, h, iw, ih) {
    const t = String(str || '0% 0%').trim().split(/\s+/);
    const kw = { left: '0%', center: '50%', right: '100%', top: '0%', bottom: '100%' };
    let xs = t[0] ?? '0%';
    let ys = t[1] ?? '50%';
    if (xs === 'top' || xs === 'bottom') [xs, ys] = [ys === 'center' || ys == null ? '50%' : ys, xs];
    xs = kw[xs] || xs;
    ys = kw[ys] || ys;
    const one = (v, box, img) => (v.endsWith('%') ? ((box - img) * parseFloat(v)) / 100 : parseFloat(v) || 0);
    return [one(xs, w, iw), one(ys, h, ih)];
  }
  function syncAnimatedBackgrounds() {
    for (const a of animBgEls) {
      if (a.off) continue;
      // a component replaced the unit backgrounds (e.g. its own sweep band): it owns them from now on
      if (a.units[0].style.backgroundImage !== a.img) { a.off = true; continue; }
      const w = a.el.offsetWidth, h = a.el.offsetHeight;
      if (!w || !h) continue; // not rendered (lifecycle display:none): nothing to project, keep the cache invalid
      const cs = getComputedStyle(a.el);
      const key = cs.backgroundSize + '|' + cs.backgroundPosition + '|' + w + 'x' + h;
      if (key === a.last) continue;
      a.last = key;
      const [iw, ih] = bgSizePx(cs.backgroundSize, w, h);
      const [bx, by] = bgPosPx(cs.backgroundPosition.split(',')[0], w, h, iw, ih);
      a.units.forEach((u, i) => {
        u.style.backgroundSize = `${iw.toFixed(2)}px ${ih.toFixed(2)}px`;
        u.style.backgroundPosition = `${(bx - a.offs[i][0]).toFixed(2)}px ${(by - a.offs[i][1]).toFixed(2)}px`;
      });
    }
  }

  // post-layout text effects: move glows of gradient fills onto a drop-shadow host, add tightHalo — only where no
  // component rewrote the element's text-shadow during build / postLayout (then the component owns the effect)
  const glowHosts = [];
  function finalizeTextFx() {
    while (textFxQueue.length) {
      const { el } = textFxQueue.shift();
      const rec = fxRecords.get(el);
      if (!rec || el.style.textShadow !== rec.ts) continue;
      if (rec.gradient && rec.chain && el.parentElement) {
        let h = el.parentElement;
        const ownHost = h.classList.contains('mg-text-host') && h.childElementCount === 1;
        if (!ownHost) {
          h = document.createElement('div');
          h.className = 'mg-text-host';
          Object.assign(h.style, { position: 'absolute', inset: '0' });
          el.parentElement.insertBefore(h, el);
          h.appendChild(el);
        }
        h.style.filter = [h.style.filter && h.style.filter !== 'none' ? h.style.filter : '', rec.chain].filter(Boolean).join(' ');
        el.style.textShadow = 'none';
        el.querySelectorAll('.mg-word, .mg-letter').forEach((u) => { u.style.textShadow = 'none'; });
        el.dataset.glowHost = '1';
        glowHosts.push({ el, host: h, k: null });
      } else if (rec.tight) {
        el.style.textShadow = [rec.tight, el.style.textShadow].filter((s) => s && s !== 'none').join(', ');
      }
    }
  }
  function syncGlowHosts() {
    // the chain colours use var(--glow-k): follow the element's animated glowStrength
    for (const g of glowHosts) {
      const k = g.el.style.getPropertyValue('--glow-k');
      if (k !== g.k) { g.k = k; if (k) g.host.style.setProperty('--glow-k', k); else g.host.style.removeProperty('--glow-k'); }
    }
  }

  // ---------- world wrappers + blend hoisting ----------
  const camWrappers = [];
  function blendOf(n) {
    if (!n || !n.style) return null;
    const m = n.style.mixBlendMode || getComputedStyle(n).mixBlendMode;
    return m && m !== 'normal' ? m : null;
  }
  // a single blend mode shared by all the visible content of a subtree (null when mixed / none)
  function effectiveBlend(n, depth = 0) {
    const own = blendOf(n);
    if (own) return own;
    if (depth > 8 || !n.children || !n.children.length) return null;
    let m = null;
    for (const k of n.children) {
      const b = effectiveBlend(k, depth + 1);
      if (!b || (m && b !== m)) return null;
      m = b;
    }
    return m;
  }
  function clearBlend(n, depth = 0) {
    if (blendOf(n)) { n.style.mixBlendMode = 'normal'; return; }
    if (depth > 8) return;
    for (const k of n.children || []) clearBlend(k, depth + 1);
  }
  function isolates(n) {
    if (!n || !n.style) return false;
    const cs = getComputedStyle(n);
    return cs.transform !== 'none' || cs.filter !== 'none' || Number(cs.opacity) < 1 || cs.isolation === 'isolate'
      || (cs.maskImage && cs.maskImage !== 'none') || (cs.webkitMaskImage && cs.webkitMaskImage !== 'none')
      || (cs.clipPath && cs.clipPath !== 'none') || (cs.backdropFilter && cs.backdropFilter !== 'none');
  }
  // move the blend mode of a subtree onto `top` when something between them isolates it (filter host, glow
  // wrapper, camera wrapper): a blend inside an isolated group only blends with that group
  function hoistBlend(top, force) {
    if (blendOf(top)) return;
    const m = effectiveBlend(top);
    if (!m) return;
    let isolated = force;
    if (!isolated) {
      // walk the single-child path down to the blended element
      let n = top;
      while (n && !blendOf(n)) {
        if (isolates(n)) { isolated = true; break; }
        n = n.children.length === 1 ? n.children[0] : null;
      }
      if (!n) isolated = isolates(top);
    }
    if (!isolated) return;
    clearBlend(top);
    top.style.mixBlendMode = m;
    top.dataset.blendHoisted = m;
  }
  let hoistedScreen = false;
  function syncWorldWrappers() {
    for (const L of worldLayers) {
      for (const ch of [...L.children]) {
        if (ch.classList.contains('mg-cam')) continue;
        const w = document.createElement('div');
        w.className = 'mg-cam';
        L.insertBefore(w, ch);
        w.appendChild(ch);
        camWrappers.push({ w, L, child: ch, z: null });
        hoistBlend(w, true);
      }
    }
    // stacking: a z-index on a world child must compete with its siblings, i.e. live on its wrapper
    for (const c of camWrappers) {
      const z = c.child.parentElement === c.w ? c.child.style.zIndex : '';
      if (z !== c.z) { c.z = z; c.w.style.zIndex = z || ''; }
    }
    if (!hoistedScreen) {
      hoistedScreen = true;
      for (const L of screenLayers) for (const ch of [...L.children]) hoistBlend(ch, false);
    }
  }
  const IDENT = 'matrix(1,0,0,1,0,0)';

  // ---------- per-frame drawing ----------
  const frameImg = new Image();
  const matteImg = new Image();
  const pad = (i) => String(i).padStart(5, '0');
  let initP = null;

  async function loadImg(img, url) {
    if (img.dataset.url === url) return;
    img.src = url;
    await img.decode();
    img.dataset.url = url;
  }

  function drawFootage(ctx, img, m, filter) {
    ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
    ctx.filter = filter;
    ctx.drawImage(img, 0, 0, W, H);
    ctx.filter = 'none';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function camSamples(t) {
    // motion blur: average a few sub-frame camera states when the camera moves fast — never across a camera cut
    // (the half-frame-earlier sample must belong to the same camera cue)
    const tp = Math.max(0, t - 0.5 / FPS) + EPS;
    camMaster.time(tp, true);
    const prev = {};
    const prevBase = composeCam(tp, prev);
    const T = t + EPS;
    camMaster.time(T, true);
    camActive = composeCam(T, cam);
    const now = { ...cam };
    if (prevBase !== camActive || now.motionBlur === false) return [now];
    const ds = Math.abs(now.scale - prev.scale) / Math.max(0.01, now.scale) * Math.max(W, H) + Math.hypot(now.x - prev.x, now.y - prev.y);
    if (ds < 4) return [now];
    const n = Math.min(8, Math.ceil(ds / 6));
    const out = [];
    for (let k = 0; k < n; k++) {
      const a = k / Math.max(1, n - 1);
      out.push({ ...now, scale: prev.scale + (now.scale - prev.scale) * a, x: prev.x + (now.x - prev.x) * a, y: prev.y + (now.y - prev.y) * a, ox: now.ox, oy: now.oy, rotation: prev.rotation + (now.rotation - prev.rotation) * a });
    }
    return out;
  }

  window.mgInit = () => {
    initP = initP || (async () => {
      await Promise.all((C.style.fonts || []).map((f) => document.fonts.load(`${f.weight || 400} 40px '${famId(f.fontsource || f.family)}'`, 'ابت abc').catch(() => null)));
      // load EVERY declared face (all weights) of the families in play, so canvas text drawn by components in a
      // weight other than fonts[].weight is ready too (document.fonts.ready only waits for faces in use)
      const fams = new Set((C.style.fonts || []).map((f) => famId(f.fontsource || f.family)));
      await Promise.all([...document.fonts].filter((ff) => fams.has(ff.family.replace(/['"]/g, ''))).map((ff) => ff.load().catch(() => null)));
      await buildGrade();
      build();
      await document.fonts.ready;
      runInkAnchors();
      fixSplitGradients();
      for (let k = 0; k < postLayout.length; k++) postLayout[k]();
      runInkAnchors(); // texts created during postLayout
      finalizeTextFx();
      // Prime both masters onto the first frame (t = 0 + EPS): a fresh paused timeline seeked to exactly 0 renders
      // nothing, so without this the t = 0 sets would only appear once the playhead moved. Forward only: a backward
      // pass would revert every later cue to the start values GSAP recorded at init, and for autoAlpha sets those
      // come from immediateRender from-states (e.g. opacity 0.45 → visible), i.e. NOT the pristine hidden state.
      // So frames must be rendered in ascending order per page (render.mjs does; stills are sorted).
      const dur = Math.max(master.duration(), camMaster.duration());
      master.time(EPS, false);
      camMaster.time(EPS, true);
      camActive = composeCam(EPS, cam);
      return dur;
    })();
    return initP;
  };

  window.renderFrame = async (i) => {
    await window.mgInit();
    const t = i / FPS;
    const fi = Math.min(i, C.meta.frames - 1);
    await loadImg(frameImg, `${C.plateUrl}frames/${pad(fi)}.jpg`);
    if (C.meta.matte) await loadImg(matteImg, `${C.plateUrl}matte/${pad(fi)}.png`);
    master.time(t + EPS, false);
    const samples = camSamples(t); // leaves the camera at time t (+EPS)

    // plate: camera → grade → overlays (screen space)
    pctx.globalAlpha = 1;
    pctx.fillStyle = C.scene.voidColor || C.style.voidColor || '#000';
    pctx.fillRect(0, 0, W, H);
    samples.forEach((s, k) => {
      pctx.globalAlpha = 1 / (k + 1);
      drawFootage(pctx, frameImg, camMatrix(s), gradeCss);
    });
    pctx.globalAlpha = 1;
    if (!overlaysOnBackdrop) drawOverlays(pctx);

    // talent: camera-transformed matte (kept in ctx.matteCanvas), filled with the graded plate (+ overlays)
    if (C.meta.matte) {
      mctx.clearRect(0, 0, W, H);
      samples.forEach((s, k) => {
        mctx.globalAlpha = 1 / (k + 1);
        drawFootage(mctx, matteImg, camMatrix(s), 'none');
      });
      mctx.globalAlpha = 1;
      let fill = plateCanvas;
      if (overlaysOnBackdrop && overlayImgs.length) {
        sctx.globalCompositeOperation = 'copy';
        sctx.drawImage(plateCanvas, 0, 0);
        sctx.globalCompositeOperation = 'source-over';
        drawOverlays(sctx);
        fill = scratch;
      }
      tctx.globalCompositeOperation = 'copy';
      tctx.drawImage(matteCanvas, 0, 0);
      tctx.globalCompositeOperation = 'source-in';
      tctx.drawImage(fill, 0, 0);
      tctx.globalCompositeOperation = 'source-over';
    }

    // world-locked children follow the camera (relative to the active cue's rest framing when it has one)
    syncWorldWrappers();
    const m = worldMatrix(cam);
    const css = `matrix(${m.map((v) => v.toFixed(5)).join(',')})`;
    for (const L of worldLayers) { L.style.transform = ''; L.style.transformOrigin = ''; }
    for (const c of camWrappers) c.w.style.transform = css;

    syncLifecycle(t);
    syncAnimatedBackgrounds();
    syncGlowHosts();
    for (const fn of frameHooks) await fn(t, i);

    // children a hook added to a world layer this frame follow the camera this frame too
    const nw = camWrappers.length;
    syncWorldWrappers();
    for (let k = nw; k < camWrappers.length; k++) camWrappers[k].w.style.transform = css;
    // Legacy: a component that transforms a W layer itself (e.g. a "world-rest" helper written for engine v1) owns
    // the camera for that layer this frame — its children's wrappers stay untransformed so nothing is applied twice.
    for (const L of worldLayers) {
      const tf = L.style.transform;
      if (tf && tf !== 'none') for (const c of camWrappers) if (c.L === L) c.w.style.transform = IDENT;
    }
    return true;
  };
})();
