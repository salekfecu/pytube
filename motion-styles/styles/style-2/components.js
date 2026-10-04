/* Style 2 · Teal Spatial Glass — component library for the motion-styles engine.
 *
 * Loaded by render.mjs after compositor/components-shared.js and before compositor/runtime.js.
 * Registers every id in style.json "graphicComponents" plus helpers:
 *
 *   teal-grid-stage       product stage (teal gradient + flat 1.5 px grid)
 *   prop-3d-enter-spin    procedural 3D aligner tray / typodont (canvas mini-renderer), enter + slow yaw spin
 *   glass-pill-gold       frosted capsule with warm spill from the gold hero (+ optional typed label)
 *   glass-search-morph    glass ring → search pill, dark inner capsule, gold-ring arrow button
 *   visionos-glass-ui     tab bar + perspective window with a tray carousel + dock + grabber (world-locked)
 *   phone-glide-in        iPhone mockup gliding in from the left with yaw + tilt overshoot, live 3D screen
 *   teal-clinic-backdrop  procedural dark-teal clinic plate (WS / MCU) for background replacement
 *   cyan-rim-relight      soft-light cyan rim on the talent's right edge (uses the person matte)
 *   s2-text               style-aware text builder (see below)
 *
 * Text: at load time every scene cue {type:"text"} whose preset belongs to this style is routed to the
 * `s2-text` component. It still builds through ctx.makeText (same in/out semantics as a plain text cue) and
 * then adds what the generic interpreter cannot do:
 *   - world-locked text WITH a blend mode (the runtime's world layers are transformed → isolated groups, so
 *     mix-blend-mode would only blend with the layer itself): a camera-following wrapper in a screen layer
 *     carries the blend instead;
 *   - kashida auto-fit to a target ink width (cue.fit: true | widthPct), shrink-to-fit for long words;
 *   - per-glyph gold light panel (gold-light-panel-grow) and 3-layer cyan glass (hero-cyan-glass-rise);
 *   - glow under gradient fills (gold-spotlight-letters), tight 4 px neon halo, kashida glint,
 *     line float (neon-word-cascade-float), soft-edged centre-out reveal (english-ghost-centre-out),
 *     gradient fix for tracking-in, preset variants (cue.variant).
 * Set cue.raw = true to bypass s2-text and get the runtime's plain interpreter.
 *
 * Determinism: no CSS animations, timers, Math.random or Date. Motion is GSAP tweens on ctx.tl or pure
 * functions of time inside ctx.onFrame(t).
 */
(() => {
  'use strict';
  const MG = (window.MG = window.MG || {});
  const R = (MG.components = MG.components || {});
  const CFG = window.__MG__ || { style: {}, scene: {}, meta: {} };
  const STYLE = CFG.style || {};
  const META = CFG.meta || {};
  const W = META.width || 1080;
  const H = META.height || 1920;
  const FPS = META.fps || 30;
  const ZWJ = '‍';
  const TATWEEL = 'ـ';
  const S2 = (MG.s2 = MG.s2 || {});

  // ------------------------------------------------------------------ utils
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
  function deepMerge(a, b) {
    if (!b) return a;
    const o = Array.isArray(a) ? [...a] : { ...(a || {}) };
    for (const [k, v] of Object.entries(b)) o[k] = isObj(v) && isObj(o[k]) ? deepMerge(o[k], v) : v;
    return o;
  }
  const presetById = (id) => (STYLE.textPresets || []).find((p) => p.id === id) || {};
  const specById = (id) => (STYLE.graphicComponents || []).find((g) => g.id === id) || {};
  const fontFor = (role) => (STYLE.fonts || []).find((f) => f.role === role) || {};
  const famId = (s) => String(s || 'readex-pro').replace(/^@fontsource\//, '').toLowerCase().replace(/\s+/g, '-');
  const fam = (f) => `'${famId(f.fontsource || f.family)}', 'noto-sans-arabic', sans-serif`;
  const pctX = (v) => (v / 100) * W;
  const pctY = (v) => (v / 100) * H;

  // cubic-bezier evaluator (pure, deterministic) for onFrame-driven motion
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t;
    const sy = (t) => ((ay * t + by) * t + cy) * t;
    const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) {
        const e = sx(t) - x;
        if (Math.abs(e) < 1e-6) return sy(t);
        const d = dx(t);
        if (Math.abs(d) < 1e-6) break;
        t -= e / d;
      }
      let lo = 0, hi = 1;
      t = x;
      for (let i = 0; i < 40; i++) {
        const v = sx(t);
        if (Math.abs(v - x) < 1e-7) break;
        if (v < x) lo = t; else hi = t;
        t = (lo + hi) / 2;
      }
      return sy(t);
    };
  }
  const NAMED = { ease: [0.25, 0.1, 0.25, 1], 'ease-in': [0.42, 0, 1, 1], 'ease-out': [0, 0, 0.58, 1], 'ease-in-out': [0.42, 0, 0.58, 1] };
  const easeCache = {};
  function E(spec) {
    if (typeof spec === 'function') return spec;
    const key = spec || 'ease-out';
    if (easeCache[key]) return easeCache[key];
    let f;
    const m = String(key).match(/cubic-bezier\(([^)]+)\)/);
    if (m) f = bezier(...m[1].split(',').map(Number));
    else if (key === 'linear' || key === 'none') f = (x) => clamp(x);
    else f = bezier(...(NAMED[key] || NAMED['ease-out']));
    easeCache[key] = f;
    return f;
  }
  // value of a tween at time t (seconds), start t0, duration d
  const tween = (t, t0, d, a, b, ease) => a + (b - a) * E(ease)(clamp((t - t0) / Math.max(1e-6, d)));
  // keyframes [{tMs, [prop], easing}] → value at tMs (easing on the destination key, like style.json)
  function keyAt(keys, tMs, prop) {
    if (!keys.length) return 0;
    if (tMs <= (keys[0].tMs ?? 0)) return keys[0][prop];
    for (let k = 1; k < keys.length; k++) {
      const a = keys[k - 1], b = keys[k];
      if (tMs <= b.tMs) return lerp(a[prop], b[prop], E(b.easing || 'linear')((tMs - a.tMs) / Math.max(1e-6, b.tMs - a.tMs)));
    }
    return keys[keys.length - 1][prop];
  }

  // ------------------------------------------------------------------ camera / layers
  function camMatrix(c) {
    const r = ((c.rotation || 0) * Math.PI) / 180;
    const a = Math.cos(r) * c.scale;
    const b = Math.sin(r) * c.scale;
    return [a, b, -b, a, c.ox + c.x - a * c.ox + b * c.oy, c.oy + c.y - b * c.ox - a * c.oy];
  }
  const camCss = (c) => `matrix(${camMatrix(c).map((v) => v.toFixed(5)).join(',')})`;

  function baseLayerName(name) {
    let n = name === 'behindTalent' ? 'behind' : name || 'front';
    let w = false;
    if (n.endsWith('W')) { n = n.slice(0, -1); w = true; }
    return { n, w };
  }
  function layerEl(ctx, name, worldLock) {
    const { n, w } = baseLayerName(name);
    return ctx.layers[n + (w || worldLock ? 'W' : '')] || ctx.layers[n] || ctx.layers.front;
  }
  // camera-following wrapper inside a SCREEN layer, so a blend mode reaches the plate/talent
  function worldWrap(ctx, layerName, css = {}) {
    const el = document.createElement('div');
    Object.assign(el.style, { position: 'absolute', left: '0px', top: '0px', width: W + 'px', height: H + 'px', transformOrigin: '0 0' }, css);
    ctx.layers[baseLayerName(layerName).n].appendChild(el);
    ctx.onFrame(() => { el.style.transform = camCss(ctx.cam); });
    return el;
  }
  S2.worldWrap = worldWrap;
  S2.camCss = camCss;

  // GSAP does not render zero-position tweens when a paused timeline is seeked to 0 while its playhead already
  // sits at 0, so a camera / cue at t = 0 would only apply from frame 1 (frame 0 rendered un-punched). After the
  // build, nudge the master and camera timelines forward and back once (engine request: do this in the runtime).
  let booted = false;
  function boot(ctx) {
    if (booted || !ctx || !ctx.postLayout) return;
    booted = true;
    ctx.postLayout.push(() => {
      let m = ctx.tl;
      while (m && m.parent && m.parent !== ctx.gsap.globalTimeline) m = m.parent;
      for (const tl of [m, ctx.camMaster]) {
        if (!tl || tl.time() !== 0) continue;
        tl.time(1e-4, true);
        tl.time(0, true);
      }
    });
  }
  S2.boot = boot;

  // hard-cut visibility for a component element: visible from local `t0` until cue.end
  function cutVis(ctx, el, t0 = 0) {
    const { cue, tl, gsap } = ctx;
    gsap.set(el, { visibility: 'hidden' });
    tl.set(el, { visibility: 'visible', immediateRender: false }, t0);
    if (cue.end != null) tl.set(el, { visibility: 'hidden', immediateRender: false }, Math.max(t0, cue.end - cue.t));
  }
  const alive = (cue, t) => t >= cue.t && (cue.end == null || t < cue.end);

  function div(css = {}, parent) {
    const el = document.createElement('div');
    Object.assign(el.style, { position: 'absolute' }, css);
    if (parent) parent.appendChild(el);
    return el;
  }

  // ------------------------------------------------------------------ text helpers
  const NON_JOIN_LEFT = new Set(['ا', 'أ', 'إ', 'آ', 'ٱ', 'د', 'ذ', 'ر', 'ز', 'و', 'ؤ', 'ة', 'ء']);
  const isArabic = (c) => /[؀-ۿݐ-ݿࢠ-ࣿ]/.test(c || '');
  const isMark = (c) => /[ً-ٰٟۖ-ۭ]/.test(c || '');
  function graphemes(word) {
    const out = [];
    const ch = [...word];
    for (let i = 0; i < ch.length; i++) {
      const c = ch[i];
      if (isMark(c) && out.length) { out[out.length - 1] += c; continue; }
      if (c === 'ل' && /[اأإآ]/.test(ch[i + 1] || '')) { out.push(c + ch[i + 1]); i++; continue; }
      out.push(c);
    }
    return out;
  }
  const baseChar = (g) => [...g].filter((c) => !isMark(c)).pop();
  const joinsLeft = (g) => isArabic(g[0]) && !NON_JOIN_LEFT.has(baseChar(g)) && !/^ل[اأإآ]/.test(g);
  // split a word into shaped letters (ZWJ keeps the joining forms) — same rule as the runtime
  function shapedLetters(word) {
    const g = graphemes(word);
    return g.map((gr, i) => {
      const prev = i > 0 && joinsLeft(g[i - 1]) && isArabic(gr[0]);
      const next = i < g.length - 1 && joinsLeft(gr) && isArabic(g[i + 1][0]);
      return (prev ? ZWJ : '') + gr + (next ? ZWJ : '');
    });
  }

  function glowShadow(g, useVar = true) {
    if (!g || !g.color) return '';
    const r = g.radiusPx ?? 20;
    const s = g.strength ?? 1;
    const c = useVar ? `rgb(from ${g.color} r g b / calc(alpha * var(--glow-k, 1)))` : g.color;
    const out = [`0 0 ${Math.round(r * 0.25)}px ${c}`, `0 0 ${Math.round(r * 0.6)}px ${c}`, `0 0 ${r}px ${c}`];
    if (s > 1) out.push(`0 0 ${Math.round(r * 1.8)}px ${c}`);
    if (s > 1.6) out.push(`0 0 ${Math.round(r * 3)}px ${c}`);
    return out.join(', ');
  }

  // canvas text metrics (ink box relative to the baseline / start)
  const mcv = document.createElement('canvas').getContext('2d');
  function ink(text, weight, sizePx, family, dir = 'rtl') {
    mcv.font = `${weight} ${sizePx}px ${family}`;
    mcv.direction = dir;
    const m = mcv.measureText(text);
    return { asc: m.actualBoundingBoxAscent, desc: m.actualBoundingBoxDescent, left: m.actualBoundingBoxLeft, right: m.actualBoundingBoxRight, adv: m.width };
  }
  // baseline offset of a text element (px from its top), measured in the DOM
  function baselineOf(el) {
    const mk = document.createElement('span');
    mk.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline;';
    el.appendChild(mk);
    const top = mk.offsetTop;
    mk.remove();
    return top;
  }
  function measureText(ctx, text, st, dir = 'rtl') {
    const s = document.createElement('span');
    s.style.cssText = 'position:absolute;left:0;top:0;visibility:hidden;white-space:nowrap;';
    s.dir = dir;
    ctx.applyTextStyle(s, st);
    s.style.transform = 'none';
    s.textContent = text;
    ctx.layers.fx.appendChild(s);
    const w = s.offsetWidth;
    s.remove();
    return w;
  }
  // tatweel insertion on the longest word (or the only word) of a text
  function kashidaText(ctx, text, n, at) {
    const words = text.split(' ');
    let best = 0;
    words.forEach((w, i) => { if (graphemes(w).length > graphemes(words[best]).length) best = i; });
    words[best] = ctx.tatweel(words[best], n, at);
    return words.join(' ');
  }
  // fit order (STYLE.md §3.5): size from ink height → scaleX ≤ maxScaleX → kashida to the target ink width.
  // Long words that overflow the target shrink instead.
  function fitText(ctx, text, st, targetPx, at) {
    const f = st.fontRole ? fontFor(st.fontRole) : {};
    const sx = st.scaleX ?? f.effects?.scaleX ?? 1;
    const st2 = { ...st };
    let w0 = measureText(ctx, text, st2) * sx;
    if (w0 > targetPx * 1.02) {
      const size = (st.sizePx ?? f.sizePx ?? 100) * (targetPx / w0);
      return { text, style: { ...st2, sizePx: Math.round(size) }, n: 0 };
    }
    if (text.includes(TATWEEL)) return { text, style: st2, n: 0 };
    const w10 = measureText(ctx, kashidaText(ctx, text, 10, at), st2) * sx;
    const adv = (w10 - w0) / 10;
    if (adv <= 0.5) return { text, style: st2, n: 0 };
    const n = clamp(Math.round((targetPx - w0) / adv), 0, 90);
    return { text: kashidaText(ctx, text, n, at), style: st2, n };
  }
  S2.fitText = fitText;

  // apply a preset variant: style / position / in fields are routed to the right block
  const STYLE_KEYS = new Set(['sizePx', 'color', 'fill', 'css', 'opacity', 'blendMode', 'glow', 'shadow', 'weight', 'fontRole', 'letterSpacing']);
  const POS_KEYS = new Set(['xPct', 'yPct', 'anchor', 'spanPct', 'align']);
  const IN_KEYS = new Set(['durationMs', 'staggerMs', 'easing']);
  function withVariant(p, name) {
    const v = name && p.variants && p.variants[name];
    if (!v) return p;
    const o = { ...p, style: { ...(p.style || {}) }, position: { ...(p.position || {}) }, in: { ...(p.in || {}) } };
    for (const [k, val] of Object.entries(v)) {
      if (STYLE_KEYS.has(k)) {
        if (k === 'css') o.style.css = { ...(o.style.css || {}), ...val };
        else o.style[k] = val;
        if (k === 'color' && o.style.fill == null) o.style.fill = { type: 'solid', color: val };
      } else if (POS_KEYS.has(k)) o.position[k] = val;
      else if (IN_KEYS.has(k)) o.in[k] = val;
      else if (k === 'fit') o.fit = val;
    }
    return o;
  }

  // ------------------------------------------------------------------ text routing
  const S2_PRESETS = new Set((STYLE.textPresets || []).map((p) => p.id));
  for (const cue of (CFG.scene && CFG.scene.cues) || []) {
    if (cue && cue.type === 'text' && !cue.raw && S2_PRESETS.has(cue.preset)) {
      cue.type = 'component';
      cue.component = 's2-text';
    }
  }

  R['s2-text'] = (ctx) => {
    const cue = ctx.cue;
    let p = deepMerge(presetById(cue.preset), cue.override);
    p = withVariant(p, cue.variant);
    if (cue.preset === 'gold-light-panel-grow') return goldPanel(ctx, p);
    if (cue.preset === 'hero-cyan-glass-rise') return cyanGlass(ctx, p);
    return richText(ctx, p);
  };

  // nested text cue on a component's timeline (labels inside pills, etc.)
  function subText(ctx, sub, at) {
    const tl2 = ctx.gsap.timeline();
    const c = { type: 'component', component: 's2-text', ...sub, t: ctx.cue.t + at, end: sub.end ?? ctx.cue.end };
    R['s2-text']({ ...ctx, cue: c, tl: tl2, spec: {} });
    ctx.tl.add(tl2, at);
  }

  function richText(ctx, p) {
    const cue = { ...ctx.cue };
    const st0 = deepMerge(p.style || {}, cue.style);
    const f = st0.fontRole ? fontFor(st0.fontRole) : {};
    const worldLock = cue.worldLock ?? p.worldLock ?? false;
    const layerName = cue.layer || p.layer || 'front';
    const blend = st0.blend || st0.blendMode || st0.css?.mixBlendMode || f.effects?.blendMode;
    const hasBlend = blend && blend !== 'normal';
    const parent = hasBlend && worldLock ? worldWrap(ctx, layerName, { mixBlendMode: blend }) : layerEl(ctx, layerName, worldLock);

    // kashida fit
    let st = st0;
    let text = typeof cue.text === 'string' ? cue.text : null;
    const fitPct = cue.fit === true ? (p.position?.spanPct ?? f.fit?.targetInkWidthPct) : typeof cue.fit === 'number' ? cue.fit : cue.fit == null && cue.preset === 'hero-difference-world' && cue.tatweel == null ? f.fit?.targetInkWidthPct : null;
    if (text && fitPct) {
      const r = fitText(ctx, text, st, pctX(fitPct), cue.kashidaAt);
      text = r.text;
      st = r.style;
    }

    const ov = {};
    const unit = cue.unit || p.unit;
    const retime = unit === 'letter' && RETIME.has(cue.preset);
    if (retime) {
      const nul = (o) => Object.fromEntries(Object.keys(o || {}).map((k) => [k, null]));
      ov.in = { from: nul(p.in?.from), to: nul(p.in?.to), tracks: [], keyframes: null };
    }
    if (cue.preset === 'english-ghost-centre-out') ov.in = { from: { opacity: 0, clip: null }, to: { opacity: 1, clip: null } };
    const c2 = { ...cue, type: 'text', text: text ?? cue.text, style: st, override: deepMerge(cue.override || {}, deepMerge(stripPreset(p), ov)) };
    delete c2.component;
    const res = ctx.makeText(c2, ctx.tl, { parent });
    const el = res.el;
    if (hasBlend && worldLock) el.style.mixBlendMode = 'normal';

    // tight neon halo (style.json fonts[neon-thin].effects.tightHalo — the runtime only knows glowTight)
    const th = st.tightHalo ?? f.effects?.tightHalo;
    if (th && th.color && el.style.textShadow !== 'none') {
      el.style.textShadow = [`0 0 ${th.radiusPx ?? 4}px ${th.color}`, el.style.textShadow].filter(Boolean).join(', ');
    }

    if (retime) res.units = retimeLetters(ctx, res.units, p);
    // per-preset upgrades
    const id = cue.preset;
    if (id === 'neon-word-cascade-float') {
      const lt = p.in?.lineTrack;
      if (lt) ctx.tl.fromTo(el, { y: lt.from }, { y: lt.to, duration: (lt.durationMs ?? 867) / 1000, ease: ctx.ease(lt.easing), immediateRender: true }, 0);
    }
    if (id === 'neon-thin-blurfade' && cue.glint !== false && (c2.text || '').includes(TATWEEL)) addGlint(ctx, el, p, st);
    if (el.dataset.gradient && (st.glow ?? f.effects?.glow)) glowUnderlay(ctx, el, res.units, st.glow ?? f.effects?.glow, parent);
    if (id === 'english-ghost-centre-out') softReveal(ctx, el, res.units, p);
    if (id === 'english-tracking-in') ctx.postLayout.push(() => restGradient(el, res.units));
    return res;
  }
  // Letter type-ons: every tatweel run is merged into ONE span (separate per-tatweel inline-blocks leave
  // antialiasing seams) and drawn as one stroke growing from its joining side. search-typewriter (kashidaGrowTo):
  // the stroke starts kashidaLeadMs after its letter, grows over kashidaGrowMs and the next letter waits until it
  // is fully drawn, so joined letters never show a gap (reference F264-F276: ح, stroke grows 8-10 F, then ل).
  // Other type-ons draw the run inside its letter slot. gold-spotlight adds the 3 F word gap.
  const RETIME = new Set(['neon-thin-typeon', 'search-typewriter', 'pill-label-typeon', 'gold-spotlight-letters']);
  const TAT_RE = new RegExp('^' + TATWEEL + '+$');
  const isTatUnit = (u) => TAT_RE.test(u.textContent.replace(/\u200d/g, ''));
  function mergeTatweelRuns(units) {
    const out = [];
    for (const u of units) {
      const prev = out[out.length - 1];
      if (prev && isTatUnit(u) && isTatUnit(prev) && u.parentElement === prev.parentElement && u.previousSibling === prev) {
        const n = prev.textContent.replace(/\u200d/g, '').length + u.textContent.replace(/\u200d/g, '').length;
        prev.textContent = (prev.textContent.startsWith(ZWJ) ? ZWJ : '') + TATWEEL.repeat(n) + (u.textContent.endsWith(ZWJ) ? ZWJ : '');
        u.remove();
        continue;
      }
      out.push(u);
    }
    return out;
  }
  function retimeLetters(ctx, units0, p) {
    const units = mergeTatweelRuns(units0);
    const pin = p.in || {};
    const stagger = (pin.staggerMs ?? 40) / 1000;
    const gap = (pin.wordGapMs ?? 0) / 1000;
    const dur = (pin.durationMs ?? 100) / 1000;
    const grow = pin.kashidaGrowTo != null;
    const runLead = grow ? (pin.kashidaLeadMs ?? 100) / 1000 : 0;
    const runDur = grow ? (pin.kashidaGrowMs ?? 300) / 1000 : Math.max(stagger, 2 / FPS);
    const starts = new Array(units.length).fill(0);
    const isRun = units.map(isTatUnit);
    let tcur = 0, lastLetter = -1;
    for (let i = 0; i < units.length; i++) {
      if (isRun[i]) {
        const s0 = lastLetter >= 0 ? starts[lastLetter] : tcur;
        starts[i] = s0 + runLead;
        // the next letter appears only once the stroke reaches it
        tcur = Math.max(tcur, starts[i] + runDur);
        continue;
      }
      if (lastLetter >= 0 && units[i].parentElement !== units[lastLetter].parentElement) tcur += gap;
      starts[i] = tcur;
      tcur += stagger;
      lastLetter = i;
    }
    const from = pin.from || {}, to = pin.to || {};
    const fk = ctx.filterKeysOf(from, to);
    const gt = (pin.tracks || []).find((t) => t.prop === 'glowStrength');
    units.forEach((u, i) => {
      if (isRun[i]) {
        // RTL: the stroke leaves the letter on its right and grows towards the left
        ctx.gsap.set(u, { transformOrigin: '100% 50%' });
        const { opacity: o0, ...fromR } = from;
        const { opacity: o1, ...toR } = to;
        const fkR = ctx.filterKeysOf(fromR, toR);
        ctx.tl.fromTo(u, { ...ctx.mapVars(fromR, fkR), scaleX: 0 }, { ...ctx.mapVars(toR, fkR), scaleX: 1, duration: runDur, ease: ctx.ease(pin.kashidaEasing || 'cubic-bezier(0.3,0.1,0.3,1)'), immediateRender: true }, starts[i]);
        // the stroke is at full strength while it grows (its opacity uses the letter fade, not the run length)
        if (o0 != null) ctx.tl.fromTo(u, { opacity: o0 }, { opacity: o1 ?? 1, duration: Math.min(dur, runDur), ease: 'none', immediateRender: true }, starts[i]);
      } else {
        ctx.tl.fromTo(u, ctx.mapVars(from, fk), { ...ctx.mapVars(to, fk), duration: dur, ease: ctx.ease(pin.easing || 'ease-out'), immediateRender: true }, starts[i]);
      }
      if (gt) ctx.tl.fromTo(u, { '--glow-k': gt.from }, { '--glow-k': gt.to, duration: gt.durationMs / 1000, ease: ctx.ease(gt.easing || 'ease-out'), immediateRender: true }, starts[i]);
    });
    return units;
  }

  // the preset itself (with variant applied) becomes the override, so makeText sees the merged result
  function stripPreset(p) {
    const { id, use, examples, variants, note, ...rest } = p;
    return rest;
  }

  // glint: a short bright highlight running along the kashida (neon-thin-blurfade optionalGlint)
  function addGlint(ctx, el, p, st) {
    const g = p.in?.optionalGlint || { durationMs: 200, color: 'rgba(255,255,255,0.9)', widthPx: 60 };
    const glint = document.createElement('div');
    el.appendChild(glint);
    // a travelling flare: hot core on the stroke + a local bloom, so it reads on an already-white neon line
    const gw = (g.widthPx ?? 60) * 2.4, gh = 64;
    Object.assign(glint.style, { position: 'absolute', left: '0px', top: '0px', width: gw + 'px', height: gh + 'px', borderRadius: '50%', pointerEvents: 'none',
      background: `radial-gradient(closest-side, #fff 0%, ${g.color || 'rgba(255,255,255,0.9)'} 10%, rgba(220,245,255,0.35) 32%, rgba(220,245,255,0.12) 60%, rgba(220,245,255,0))`, mixBlendMode: 'plus-lighter', opacity: 0 });
    ctx.postLayout.push(() => {
      // find the tatweel run inside the word spans
      const box = el.getBoundingClientRect();
      let x0 = null, x1 = null, yMid = null;
      el.querySelectorAll('.mg-word').forEach((w) => {
        const tn = w.firstChild;
        if (!tn || tn.nodeType !== 3) return;
        const s = tn.textContent;
        const i0 = s.indexOf(TATWEEL);
        if (i0 < 0) return;
        let i1 = i0;
        while (s[i1] === TATWEEL) i1++;
        const r = document.createRange();
        r.setStart(tn, i0);
        r.setEnd(tn, i1);
        const rr = r.getBoundingClientRect();
        x0 = rr.left - box.left; x1 = rr.right - box.left;
        const size = parseFloat(getComputedStyle(w).fontSize) || 100;
        const bl = baselineOf(w.parentElement) + (w.parentElement.getBoundingClientRect().top - box.top);
        yMid = bl - size * 0.035;
      });
      if (x0 == null) { glint.remove(); return; }
      const d = (g.durationMs ?? 200) / 1000;
      const at = (p.in?.durationMs ?? 133) / 1000;
      ctx.gsap.set(glint, { x: x1 - gw / 2, y: yMid - gh / 2, opacity: 0 });
      // RTL: the glint runs right → left along the stroke
      ctx.tl.fromTo(glint, { x: x1 - gw / 2 }, { x: x0 - gw / 2, duration: d, ease: 'none', immediateRender: false }, at);
      ctx.tl.fromTo(glint, { opacity: 0 }, { opacity: 1, duration: d * 0.25, ease: 'none', immediateRender: false }, at);
      ctx.tl.to(glint, { opacity: 0, duration: d * 0.3, ease: 'none', immediateRender: false }, at + d * 0.7);
    });
  }

  // gradient-filled text + glow: text-shadow would paint OVER the background-clip:text fill. Move the glow to a
  // transparent-text underlay whose units mirror the face units every frame.
  function glowUnderlay(ctx, el, units, glow, parent) {
    const host = el.parentElement === parent ? el : el.parentElement;
    const under = el.cloneNode(true);
    under.className = el.className + ' s2-glow-under';
    under.style.whiteSpace = 'nowrap';
    delete under.dataset.gradient;
    under.style.backgroundImage = 'none';
    under.style.color = 'transparent';
    under.style.textShadow = glowShadow(glow);
    under.querySelectorAll('*').forEach((n) => { n.style.backgroundImage = 'none'; n.style.color = 'transparent'; n.style.textShadow = ''; });
    host.parentElement.insertBefore(under, host);
    el.style.textShadow = 'none';
    const uUnits = [...under.querySelectorAll(units[0]?.classList?.contains('mg-letter') ? '.mg-letter' : units[0]?.classList?.contains('mg-line') ? '.mg-line' : '.mg-word')];
    ctx.onFrame(() => {
      under.style.visibility = el.style.visibility;
      under.style.opacity = el.style.opacity;
      under.style.transform = el.style.transform;
      under.style.filter = el.style.filter;
      under.style.setProperty('--glow-k', el.style.getPropertyValue('--glow-k') || '1');
      for (let k = 0; k < units.length && k < uUnits.length; k++) {
        const a = units[k].style, b = uUnits[k].style;
        b.opacity = a.opacity; b.filter = a.filter; b.transform = a.transform; b.visibility = a.visibility; b.display = a.display;
        const gk = a.getPropertyValue('--glow-k');
        if (gk) b.setProperty('--glow-k', gk);
      }
    });
  }

  // centre-out reveal with a soft (90 px) edge, the centre letters lead
  function softReveal(ctx, el, units, p) {
    const soft = p.in?.softEdgePx ?? 90;
    const dur = (p.in?.durationMs ?? 633) / 1000;
    const ease = ctx.ease(p.in?.easing || 'cubic-bezier(0.2,0.6,0.35,1)');
    for (const line of units) {
      const m = `linear-gradient(90deg, transparent calc(50% - var(--rev) - ${soft}px), #000 calc(50% - var(--rev)), #000 calc(50% + var(--rev)), transparent calc(50% + var(--rev) + ${soft}px))`;
      line.style.webkitMaskImage = m;
      line.style.maskImage = m;
      const half = Math.max(10, line.offsetWidth / 2 + 4);
      ctx.tl.fromTo(line, { '--rev': '0px' }, { '--rev': half + 'px', duration: dur, ease, immediateRender: true }, 0);
    }
  }

  // tracking-in: recompute split gradients at the rest letter-spacing (the runtime measures the expanded state)
  function restGradient(el, units) {
    if (!el.dataset.gradient) return;
    const saved = units.map((u) => u.style.letterSpacing);
    units.forEach((u) => (u.style.letterSpacing = '0px'));
    const box = el.getBoundingClientRect();
    units.forEach((u) => {
      const r = u.getBoundingClientRect();
      u.style.backgroundSize = `${box.width}px ${box.height}px`;
      u.style.backgroundPosition = `${box.left - r.left}px ${box.top - r.top}px`;
    });
    units.forEach((u, i) => (u.style.letterSpacing = saved[i]));
  }

  // common scaffold for the bespoke heroes (gold panel, cyan glass)
  function heroScaffold(ctx, p, extraCss = {}) {
    const cue = ctx.cue;
    let st = deepMerge(p.style || {}, cue.style);
    const f = fontFor(st.fontRole);
    const worldLock = cue.worldLock ?? p.worldLock ?? false;
    const parent = layerEl(ctx, cue.layer || p.layer || 'front', worldLock);
    const pos = deepMerge(p.position || {}, cue.position);
    let text = String(cue.text || '');
    const fitPct = cue.fit === true ? f.fit?.targetInkWidthPct : typeof cue.fit === 'number' ? cue.fit : null;
    if (fitPct) {
      const r = fitText(ctx, text, { ...st, fontRole: st.fontRole }, pctX(fitPct), cue.kashidaAt);
      text = r.text;
      st = r.style;
    } else if (cue.tatweel) text = kashidaText(ctx, text, cue.tatweel, cue.kashidaAt);
    else if (p.kashida && cue.kashida !== false && !text.includes(TATWEEL)) text = ctx.applyKashida(text, cue.kashida || p.kashida);
    const size = st.sizePx ?? f.sizePx;
    const weight = st.weight ?? f.weight ?? 700;
    const family = fam(f);
    const el = div({ whiteSpace: 'nowrap', fontFamily: family, fontWeight: weight, fontSize: size + 'px', lineHeight: 1, direction: 'rtl', textAlign: 'center', ...extraCss }, parent);
    el.dir = 'rtl';
    el.className = 's2-hero';
    ctx.place(el, pos);
    return { cue, st, f, pos, text, size, weight, family, el, parent };
  }
  function heroEnd(ctx, p, inEnd) {
    const cue = ctx.cue;
    if (cue.end != null) return cue.end - cue.t;
    const hold = cue.holdMs ?? p.holdMs;
    return hold != null ? inEnd + hold / 1000 : null;
  }
  // align the INK box (not the line box) to the anchor (heroes are positioned by measured ink boxes)
  function alignInk(ctx, el, sample, pos, size, weight, family, lineEl) {
    const m = ink(sample, weight, size, family);
    const base = baselineOf(lineEl || el);
    const hBox = el.offsetHeight;
    const inkTop = base - m.asc;
    const inkBot = base + m.desc;
    const anchor = pos.anchor || 'center';
    let dy = 0;
    if (anchor.includes('bottom')) dy = hBox - inkBot;
    else if (anchor.includes('top')) dy = -inkTop;
    else dy = hBox / 2 - (inkTop + inkBot) / 2;
    return { dy, base, inkTop, inkBot, m };
  }

  // alpha stops of a CSS linear-gradient string → [[fraction, alpha]]
  function alphaStops(grad) {
    const out = [];
    const re = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))\s+([\d.]+)%/g;
    let m;
    while ((m = re.exec(grad || ''))) {
      const a = m[1].match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\s*\)/);
      out.push([parseFloat(m[2]) / 100, a ? parseFloat(a[1]) : 1]);
    }
    return out;
  }
  // vertical alpha mask in px (element box coordinates), clamped above/below the ink box
  function inkMask(stops, top, h) {
    if (!stops.length || stops.every(([, a]) => a >= 0.99)) return '';
    return `linear-gradient(180deg, ${stops.map(([f, a]) => `rgba(0,0,0,${a}) ${(top + f * h).toFixed(1)}px`).join(', ')})`;
  }
  const setMask = (s, m) => { s.style.webkitMaskImage = m; s.style.maskImage = m; s.style.webkitMaskRepeat = 'no-repeat'; s.style.maskRepeat = 'no-repeat'; };
  // letters whose dot can land after the skeleton (STYLE.md §7.2: ذ body at 0, ذ dot +7 F)
  const DOT_SKELETON = { 'ذ': 'د', 'ز': 'ر', 'ظ': 'ط', 'ض': 'ص', 'خ': 'ح', 'غ': 'ع' };
  // centroid (px, relative to the em box origin at the baseline) and top of the dot = glyph minus skeleton
  function dotGeometry(full, skel, weight, size, family) {
    const c = document.createElement('canvas');
    c.width = Math.ceil(size * 1.6); c.height = Math.ceil(size * 1.6);
    const g = c.getContext('2d');
    g.font = `${weight} ${size}px ${family}`;
    g.textBaseline = 'alphabetic';
    g.direction = 'rtl';
    g.textAlign = 'left';
    const ox = size * 0.3, oy = size * 1.2;
    g.fillStyle = '#fff';
    g.fillText(full, ox, oy);
    g.globalCompositeOperation = 'destination-out';
    g.lineWidth = 3;
    g.strokeStyle = '#000';
    g.fillText(skel, ox, oy);
    g.strokeText(skel, ox, oy);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let sx = 0, sy = 0, n = 0, yMax = -1;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      const a = d[(y * c.width + x) * 4 + 3];
      if (a > 128) { sx += x; sy += y; n++; yMax = Math.max(yMax, y); }
    }
    if (n < 20) return null;
    return { cx: sx / n - ox, cy: sy / n - oy, bottom: yMax - oy };
  }

  // ---------------------------------------------------------------- gold light panel (per glyph)
  // Each glyph = cell > [pre-glow, wrap > (face, emissive glow, rim)]. The token's per-glyph gradients carry the
  // light-panel alpha; the SAME alpha profile masks the glow, rim and pre-glow of that glyph so the transparent
  // ends of the outer alefs stay transparent. Entrance (render vs reference F155-F161): the glyph ignites small
  // and HOT in both axes from the baseline (scale 0.3 → 1.12 → 1, brightness 1.25 → 1, blur 6 → 0, glow already
  // on). Order: first-alef pre-glow at 0 (3 F lead), centre body +3 F, its dot +10 F, outer glyphs +12 / +13 F.
  function goldPanel(ctx, p) {
    const { tl, gsap } = ctx;
    const S = heroScaffold(ctx, p);
    const { el, f, st, size, weight, family } = S;
    const grads = (st.fill && st.fill.glyphGradients) || f.fill?.glyphGradients || [];
    const glow = st.glow ?? f.effects?.glow ?? { color: 'rgba(224,168,90,0.6)', radiusPx: 75, strength: 1.5 };
    const rim = f.effects?.rim ?? { color: '#FDD99B', widthPx: 3 };
    const letters = shapedLetters(S.text);
    const N = letters.length;
    const PAD = Math.round((glow.radiusPx ?? 75) * 3.2);
    const strip = (t) => t.replace(new RegExp(ZWJ, 'g'), '');
    const mkLayers = (txt, gradient) => {
      const wrap = document.createElement('span');
      wrap.style.cssText = 'display:inline-block;position:relative;transform-origin:50% 100%;';
      const face = document.createElement('span');
      face.textContent = txt;
      face.style.cssText = 'position:relative;display:inline-block;color:transparent;-webkit-background-clip:text;background-clip:text;background-repeat:no-repeat;padding:0.3em 0;margin:-0.3em 0;';
      face.style.backgroundImage = gradient;
      // padded so the halo is inside the box (a mask clips everything outside the border box)
      const glowS = document.createElement('span');
      const rimS = document.createElement('span');
      for (const s of [glowS, rimS]) {
        s.textContent = txt;
        s.style.cssText = `position:absolute;left:${-PAD}px;top:${-PAD}px;padding:${PAD}px;color:transparent;pointer-events:none;white-space:nowrap;`;
      }
      glowS.style.textShadow = glowShadow(glow);
      // the panel is emissive: its glow is ADDED over the glyph (screen) as well as around it
      glowS.style.mixBlendMode = 'screen';
      rimS.style.webkitTextStroke = `${rim.widthPx}px ${rim.color}`;
      rimS.style.opacity = 0.55;
      wrap.append(face, glowS, rimS);
      return { wrap, face, glowS, rimS };
    };
    const cells = letters.map((txt, i) => {
      const cell = document.createElement('span');
      cell.style.cssText = 'display:inline-block;position:relative;';
      el.appendChild(cell);
      const gi = i === 0 ? 0 : i === N - 1 ? Math.min(2, grads.length - 1) : Math.min(1, grads.length - 1);
      const gradient = (grads[gi] && grads[gi].gradient) || `linear-gradient(180deg, ${st.color || f.color || '#D5AD6A'}, ${st.color || f.color || '#D5AD6A'})`;
      const base = baseChar(txt);
      const centre = Math.abs(i - (N - 1) / 2) < 0.6;
      const skel = centre && DOT_SKELETON[base] && p.in?.dotSplit !== false ? txt.replace(base, DOT_SKELETON[base]) : null;
      // the body shows the undotted skeleton; the dot is the full glyph masked to the area above the skeleton
      const body = mkLayers(skel || txt, gradient);
      const dot = skel ? mkLayers(txt, gradient) : null;
      const pre = document.createElement('span');
      pre.textContent = txt;
      pre.style.cssText = `position:absolute;left:${-PAD}px;top:${-PAD}px;padding:${PAD}px;color:${rim.color};pointer-events:none;white-space:nowrap;opacity:0;`;
      pre.style.textShadow = glowShadow({ ...glow, strength: 1 }, false);
      cell.append(pre, body.wrap);
      if (dot) {
        dot.wrap.style.position = 'absolute';
        dot.wrap.style.left = '0px';
        dot.wrap.style.top = '0px';
        cell.appendChild(dot.wrap);
      }
      return { cell, body, dot, pre, txt, skel, gradient, i, alpha: alphaStops(gradient) };
    });
    // map each glyph's vertical gradient onto its ink box (not the 600 px line box) + the matching alpha masks
    for (const c of cells) {
      const baseY = baselineOf(c.body.wrap);
      const m = ink(strip(c.txt), weight, size, family);
      const padTop = parseFloat(getComputedStyle(c.body.face).paddingTop) || 0;
      const top = baseY - m.asc - 2;
      const h = m.asc + m.desc + 4;
      for (const L of [c.body, c.dot].filter(Boolean)) {
        L.face.style.backgroundSize = `100% ${h}px`;
        L.face.style.backgroundPosition = `0 ${top + padTop}px`;
      }
      const mk = inkMask(c.alpha, top + PAD, h);
      if (mk) for (const s of [c.body.glowS, c.body.rimS, c.pre]) setMask(s, mk);
      c.pre.style.transformOrigin = `${(PAD + c.body.wrap.offsetWidth / 2).toFixed(1)}px 50%`;
      if (c.dot) {
        const dg = dotGeometry(strip(c.txt), strip(c.skel), weight, size, family);
        const ms = ink(strip(c.skel), weight, size, family);
        // dot: everything above the skeleton's ink top (soft edge so the halo does not show a seam)
        const ySplit = baseY - ms.asc - size * 0.02;
        const fade = Math.max(8, size * 0.04);
        const dm = (o) => `linear-gradient(180deg, #000 ${(ySplit - fade + o).toFixed(1)}px, transparent ${(ySplit + o).toFixed(1)}px)`;
        setMask(c.dot.face, dm(padTop));
        setMask(c.dot.glowS, dm(PAD));
        setMask(c.dot.rimS, dm(PAD));
        // dg.cx is measured from the glyph's left edge (= the wrap's left edge)
        c.dot.wrap.style.transformOrigin = dg ? `${dg.cx.toFixed(1)}px ${(baseY + dg.cy).toFixed(1)}px` : `50% ${(ySplit - size * 0.08).toFixed(1)}px`;
      }
    }
    const { dy } = alignInk(ctx, el, strip(S.text), S.pos, size, weight, family);
    gsap.set(el, { y: dy });

    // timing (ms → s). staggerOrder: centre body, centre dot +7 F, outer glyphs +9 / +10 F (RTL first)
    const pin = p.in || {};
    const pg = pin.preGlow === null ? null : pin.preGlow || { opacity: 0.15, leadMs: 100 };
    const lead = pg && N > 1 ? (pg.leadMs ?? 100) / 1000 : 0;
    const stagger = (pin.staggerMs ?? 300) / 1000;
    const dotDelay = (pin.dotDelayMs ?? 233) / 1000;
    const centre = (N - 1) / 2;
    const startOf = (c) => {
      const ring = Math.ceil(Math.abs(c.i - centre) - 0.01);
      return lead + (ring <= 0 ? 0 : stagger * ring + (c.i > centre ? 1 / FPS : 0));
    };
    const kfs = pin.keyframes || [{ tMs: 0, scale: 0.3 }, { tMs: 333, scale: 1.12, easing: 'cubic-bezier(0.2,0.6,0.35,1)' }, { tMs: 733, scale: 1, easing: 'cubic-bezier(0.45,0,0.55,1)' }];
    const tracks = Object.fromEntries((pin.tracks || []).map((t) => [t.prop, t]));
    const bri = tracks.brightness || { from: 1.25, to: 1, durationMs: 1033, easing: 'ease-out' };
    const blur = tracks.blur || { from: 6, to: 0, durationMs: 1000, easing: 'ease-out' };
    const gk = tracks.glowStrength || { from: 1.0, to: 1.5, durationMs: 433, easing: 'ease-out' };
    const kMax = gk.to || 1.5;
    const s0 = kfs[0].scale ?? 0.3;
    let inEnd = 0;
    const grow = (L, at) => {
      gsap.set(L.wrap, { opacity: 0, scale: s0, filter: `blur(${blur.from}px) brightness(${bri.from})` });
      gsap.set(L.glowS, { '--glow-k': (gk.from ?? 1) / kMax });
      tl.to(L.wrap, { opacity: 1, duration: 2 / FPS, ease: 'none', immediateRender: false }, at);
      for (let j = 1; j < kfs.length; j++) {
        const a = kfs[j - 1], b = kfs[j];
        tl.to(L.wrap, { scale: b.scale, duration: (b.tMs - a.tMs) / 1000, ease: ctx.ease(b.easing || 'linear'), immediateRender: false }, at + a.tMs / 1000);
      }
      tl.to(L.wrap, { filter: `blur(${blur.to}px) brightness(${bri.to})`, duration: Math.max(blur.durationMs, bri.durationMs) / 1000, ease: ctx.ease(blur.easing || 'ease-out'), immediateRender: false }, at);
      tl.to(L.glowS, { '--glow-k': 1, duration: gk.durationMs / 1000, ease: ctx.ease(gk.easing || 'ease-out'), immediateRender: false }, at);
      inEnd = Math.max(inEnd, at + Math.max(kfs[kfs.length - 1].tMs, bri.durationMs) / 1000);
    };
    for (const c of cells) {
      const o = startOf(c);
      grow(c.body, o);
      if (c.dot) grow(c.dot, o + dotDelay);
      // pre-glow: a thin faint bar of the first (screen-right) glyph that leads the word by 3 F and holds until
      // the glyph itself grows
      if (c.i === 0 && pg && N > 1) {
        gsap.set(c.pre, { scaleX: 0.4, opacity: 0 });
        tl.to(c.pre, { opacity: pg.opacity ?? 0.15, duration: 3 / FPS, ease: 'none', immediateRender: false }, 0);
        tl.to(c.pre, { opacity: 0, duration: 6 / FPS, ease: 'none', immediateRender: false }, o + 2 / FPS);
      }
    }
    cutVis(ctx, el, 0);
    const endAt = heroEnd(ctx, p, inEnd);
    if (endAt != null && ctx.cue.end == null) tl.set(el, { visibility: 'hidden', immediateRender: false }, endAt);
    return { el };
  }

  // ---------------------------------------------------------------- cyan 3D glass (extrusion + neon rim + face)
  function cyanGlass(ctx, p) {
    const { cue, tl, gsap } = ctx;
    const S = heroScaffold(ctx, p);
    const { el, f, st, size } = S;
    const fx = { ...(f.effects || {}), ...(st.effects || {}) };
    const fill = st.fill || f.fill || {};
    const ex = fx.extrusion || { color: '#2E6E78', offsetX: -8, offsetY: 10, depthPx: 14 };
    const rim = fx.neonRim || { color: '#05F3F8', widthPx: 6, glowPx: 9 };
    const glow = st.glow ?? fx.glow;
    const fb = fx.fauxBold?.strokePx ?? 4;
    const tilt = fx.perspectiveTiltDeg || { rotateX: 6, rotateY: -4 };
    const k = size / 555; // effects were specified at 555 px
    const tiltEl = div({ position: 'relative', transform: `perspective(${Math.round(2.5 * size + 200)}px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`, transformStyle: 'flat' }, el);
    const mk = (css) => {
      const s = document.createElement('span');
      s.textContent = S.text;
      s.style.cssText = 'position:absolute;left:0;top:0;white-space:nowrap;pointer-events:none;';
      Object.assign(s.style, css);
      tiltEl.appendChild(s);
      return s;
    };
    const ox = ex.offsetX * k, oy = ex.offsetY * k;
    const depth = Math.max(4, Math.round((ex.depthPx ?? 14) * k));
    // 1) glow: a wide grey-white bloom plus a thin saturated cyan edge glow (k_020: #1C3941 → #51656C halo, not a
    //    saturated cyan sign glow)
    const gl = fx.glowLayers || [{ color: 'rgba(5,243,248,0.25)', radiusPx: 10 }, { color: 'rgba(170,225,230,0.28)', radiusPx: 32 }, { color: 'rgba(170,225,230,0.35)', radiusPx: 70 }, { color: 'rgba(170,225,230,0.20)', radiusPx: 120 }];
    const glowL = mk({ color: 'transparent', textShadow: gl.map((g) => `0 0 ${g.radiusPx}px ${g.color}`).join(', ') });
    // 2) extrusion
    const shadows = [];
    for (let i = 1; i <= depth; i++) {
      const a = i / depth;
      const c = i === depth ? '#24606A' : ex.color;
      shadows.push(`${(ox * a).toFixed(1)}px ${(oy * a).toFixed(1)}px 0 ${c}`);
    }
    const extL = mk({ color: ex.color, textShadow: shadows.join(', '), webkitTextStroke: `${fb * k}px ${ex.color}` });
    // 3) neon rim ABOVE the extrusion: a filled #05F3F8 copy shifted up-left under the face, so a crisp band of
    //    rimPx shows on the top/left outer contours and on the lower inner edges of the counters (k_020). Absolute
    //    width (never thinner than 6 px at 1080), with its 9 px glow.
    const rimPx = Math.max(6, (rim.widthPx ?? 6) * Math.min(1, k * 1.2));
    const rdx = -(rim.offsetDir?.[0] ?? 0.55) * rimPx, rdy = -(rim.offsetDir?.[1] ?? 0.85) * rimPx;
    const rimL = mk({ color: rim.color, transform: `translate(${rdx.toFixed(1)}px, ${rdy.toFixed(1)}px)`, webkitTextStroke: `2px ${rim.color}`, textShadow: `0 0 ${rim.glowPx ?? 9}px ${rim.color}, 0 0 ${Math.round(2.2 * (rim.glowPx ?? 9))}px rgba(5,243,248,0.35)` });
    // 4) inner light on the extrusion side walls (glassy, lighter towards the face)
    const wallL = mk({ color: 'transparent', webkitTextStroke: `${fb * k}px rgba(134,217,224,0.55)`, transform: `translate(${(ox * 0.45).toFixed(1)}px, ${(oy * 0.45).toFixed(1)}px)` });
    // 5) face
    const face = document.createElement('span');
    face.textContent = S.text;
    face.style.cssText = 'position:relative;display:inline-block;white-space:nowrap;color:transparent;-webkit-background-clip:text;background-clip:text;padding:0.35em 0;margin:-0.35em 0;';
    face.style.backgroundImage = [fill.verticalOverlay, fill.gradient].filter(Boolean).join(', ') || 'linear-gradient(90deg,#D7F1F2,#01B6C4,#C1E9EC)';
    face.style.webkitTextStroke = `${fb * k}px rgba(193,233,236,0.0)`;
    tiltEl.appendChild(face);
    // specular hairline on the top-right face edges
    const specL = mk({ color: 'transparent', webkitTextStroke: `${1.2 * k}px rgba(255,255,255,0.55)`, transform: `translate(${(1.5 * k).toFixed(1)}px, ${(-1.5 * k).toFixed(1)}px)`, webkitMaskImage: 'linear-gradient(200deg, #000 0%, rgba(0,0,0,0.6) 35%, transparent 60%)', maskImage: 'linear-gradient(200deg, #000 0%, rgba(0,0,0,0.6) 35%, transparent 60%)' });
    tiltEl.appendChild(specL);
    const { dy } = alignInk(ctx, el, S.text, S.pos, size, S.weight, S.family, tiltEl);

    // animation: rise (+234 px → 0), opacity in 4 F, saturate .35 → 1, neon rim .2 → 1
    const pin = p.in || {};
    const tracks = Object.fromEntries((pin.tracks || []).map((t) => [t.prop, t]));
    const yFrom = pin.from?.y ?? 234;
    const d = (pin.durationMs ?? 600) / 1000;
    const op = tracks.opacity || { durationMs: 133, easing: 'linear' };
    const sat = tracks.saturate || { from: 0.35, to: 1, durationMs: 400, easing: 'ease-out' };
    const nr = tracks.neonRimOpacity || { from: 0.2, to: 1, durationMs: 233, startOffsetMs: 67, easing: 'ease-out' };
    gsap.set(el, { y: dy + yFrom, opacity: 0, filter: `saturate(${sat.from})` });
    gsap.set(rimL, { opacity: nr.from });
    tl.to(el, { y: dy, duration: d, ease: ctx.ease(pin.easing), immediateRender: false }, 0);
    tl.to(el, { opacity: 1, duration: op.durationMs / 1000, ease: ctx.ease(op.easing || 'linear'), immediateRender: false }, 0);
    tl.to(el, { filter: `saturate(${sat.to})`, duration: sat.durationMs / 1000, ease: ctx.ease(sat.easing), immediateRender: false }, 0);
    tl.to(rimL, { opacity: nr.to, duration: nr.durationMs / 1000, ease: ctx.ease(nr.easing), immediateRender: false }, (nr.startOffsetMs ?? 67) / 1000);
    cutVis(ctx, el, 0);
    const endAt = heroEnd(ctx, p, d);
    if (endAt != null && ctx.cue.end == null) tl.set(el, { visibility: 'hidden', immediateRender: false }, endAt);
    return { el, layers: { glowL, rimL, extL, wallL, face } };
  }

  // ================================================================== 3D mini renderer (canvas 2D)
  // Painter's algorithm over flat-shaded quads. Enough for small product props (aligner trays, typodont).
  const P3 = (S2.p3d = {});
  const sgnPow = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);
  // half arch from the midline: [mesio-distal width, bucco-lingual depth, crown height, type] in mm
  const HALF_ARCH = [[8.6, 7.0, 10.5, 'inc'], [6.6, 6.0, 9.2, 'inc'], [7.6, 7.8, 10.2, 'can'], [7.0, 8.4, 8.4, 'pm'], [6.8, 8.6, 8.0, 'pm'], [10.4, 10.6, 7.4, 'mol'], [9.8, 10.2, 7.0, 'mol']];

  function archTable(A, B) {
    const N = 600, tmax = Math.PI * 0.72;
    const pts = [];
    let L = 0, px = 0, pz = B;
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * tmax;
      const x = A * Math.sin(t), z = B * Math.cos(t);
      if (i) L += Math.hypot(x - px, z - pz);
      pts.push({ t, L, x, z });
      px = x; pz = z;
    }
    return (s) => {
      const side = s < 0 ? -1 : 1;
      const a = Math.abs(s);
      let k = pts.findIndex((p) => p.L >= a);
      if (k < 0) k = N;
      const p = pts[Math.max(0, k)];
      const tx = A * Math.cos(p.t), tz = -B * Math.sin(p.t);
      const tl = Math.hypot(tx, tz) || 1;
      // tangent (pointing distally), outward normal (buccal)
      return { x: side * p.x, z: p.z, T: [side * tx / tl, 0, tz / tl], N: [side * (B * Math.sin(p.t)) / Math.hypot(B * Math.sin(p.t), A * Math.cos(p.t)), 0, (A * Math.cos(p.t)) / Math.hypot(B * Math.sin(p.t), A * Math.cos(p.t))] };
    };
  }

  function toothQuads(out, P, T, N, dims, type, up, mat, opt) {
    const [w0, d0, h0] = dims;
    const infl = opt.inflate || 1;
    const w = w0 * infl * (opt.inflateW || 1), d = d0 * infl, h = h0 * (opt.heightK || 1);
    const nu = opt.nu || 14, nv = opt.nv || 9;
    const v1 = opt.vMax ?? Math.PI * 0.62;
    const Y = [0, up, 0];
    const yBase = opt.yBase ?? 0; // cervical line height
    const grid = [];
    for (let iv = 0; iv <= nv; iv++) {
      const v = (iv / nv) * v1;
      const row = [];
      for (let iu = 0; iu < nu; iu++) {
        const u = (iu / nu) * Math.PI * 2;
        const r = Math.pow(Math.sin(v), 0.55);
        let lx = (w / 2) * r * sgnPow(Math.cos(u), 0.7);
        let lz = (d / 2) * r * sgnPow(Math.sin(u), 0.7);
        let ly = (h / 2) * sgnPow(Math.cos(v), 0.55);
        const hn = (ly / (h / 2) + 1) / 2; // 0 cervical .. 1 incisal/occlusal
        if (type === 'inc') { lz *= lerp(1, 0.42, Math.pow(hn, 1.4)); lx *= lerp(0.82, 1.02, hn); }
        else if (type === 'can') { lx *= lerp(1, 0.55, Math.pow(hn, 2.2)); lz *= lerp(1, 0.75, hn); ly += Math.pow(hn, 3) * 0.8; }
        else if (type === 'pm') { ly += 0.7 * Math.pow(hn, 5) * Math.cos(2 * u); }
        else if (type === 'mol') { ly += 0.9 * Math.pow(hn, 5) * Math.cos(4 * u + 0.4); }
        const yy = yBase + (ly + h / 2) * 0.92;
        row.push([P[0] + lx * T[0] + lz * N[0], up * yy, P[2] + lx * T[2] + lz * N[2]]);
      }
      grid.push(row);
    }
    for (let iv = 0; iv < nv; iv++) {
      for (let iu = 0; iu < nu; iu++) {
        const a = grid[iv][iu], b = grid[iv][(iu + 1) % nu], c = grid[iv + 1][(iu + 1) % nu], dd = grid[iv + 1][iu];
        out.push({ v: [a, b, c, dd], mat, ref: [P[0], up * (yBase + h * 0.42), P[2]] });
      }
    }
    void Y;
  }

  // gum block: a thick horseshoe (outer/inner offset of the arch) with a flat base, like a typodont model
  function gumQuads(out, arch, Lmax, up, mat, opt) {
    const M = opt.segments || 34;
    const halfFn = opt.halfWidthFn || (() => opt.halfWidth || 7.5); // bucco-lingual half thickness
    const top = opt.top ?? 1.5; // gum line relative to the cervical plane (into the crown)
    const bot = opt.bottom ?? -15;
    const yb = opt.yBase || 0;
    const L0 = opt.from ?? -Lmax, L1 = opt.to ?? Lmax;
    const prof = []; // closed profile (unit n offset, y)
    const K = opt.K || 14;
    for (let k = 0; k < K; k++) {
      const a = (k / K) * Math.PI * 2;
      const cn = sgnPow(Math.cos(a), 0.35), sy = sgnPow(Math.sin(a), 0.3);
      prof.push([cn * (sy > 0 ? lerp(1, opt.topNarrow ?? 0.78, sy) : 1), lerp(bot, top, (sy + 1) / 2)]);
    }
    const rows = [];
    const refs = [];
    // nRange: map the profile's bucco-lingual extent [-1, 1] onto [n0, n1] (a thin wall instead of a solid block)
    const [n0, n1] = opt.nRange || [-1, 1];
    const nMap = (n) => lerp(n0, n1, (n + 1) / 2);
    for (let m = 0; m <= M; m++) {
      const s = L0 + ((L1 - L0) * m) / M;
      const A = arch(s);
      const half = halfFn(s);
      const nm = (n0 + n1) / 2;
      refs.push([A.x + nm * half * A.N[0], up * (yb + (bot + top) / 2), A.z + nm * half * A.N[2]]);
      // papillae: the gum rises slightly between teeth
      rows.push(prof.map(([n, y]) => {
        const yy = yb + y + (opt.papilla !== false && y > top - 2 ? 0.9 * Math.pow(Math.abs(Math.cos((s / 7.6) * Math.PI)), 6) : 0);
        const nn = nMap(n);
        return [A.x + nn * half * A.N[0], up * yy, A.z + nn * half * A.N[2]];
      }));
    }
    for (let m = 0; m < M; m++) {
      for (let k = 0; k < K; k++) {
        const a = rows[m][k], b = rows[m][(k + 1) % K], c = rows[m + 1][(k + 1) % K], d = rows[m + 1][k];
        out.push({ v: [a, b, c, d], mat, ref: refs[m] });
      }
    }
    // end caps (oriented away from the neighbouring ring)
    out.push({ v: [...rows[0]], mat, ref: refs[1] });
    out.push({ v: [...rows[M]], mat, ref: refs[M - 1] });
  }

  const MATS = {
    enamel: { base: [244, 240, 232], amb: 0.52, kd: 0.6, ks: 0.42, sh: 36, rim: [255, 255, 255], kr: 0.18, alpha: 1 },
    gum: { base: [248, 112, 113], amb: 0.48, kd: 0.62, ks: 0.22, sh: 24, rim: [255, 190, 190], kr: 0.12, alpha: 1, shade: [184, 74, 75] },
    // clear aligner: neutral milky grey (R >= B, reference k_013 p90 #989592, highlight #B0ACA8, mid #97999A),
    // smooth-shaded, fresnel-brightened silhouettes, composited at shellAlpha
    tray: { base: [196, 193, 189], amb: 0.42, kd: 0.62, ks: 0.22, sh: 22, rim: [232, 229, 225], kr: 0.42, alpha: 0.84, backAlpha: 0.14, twoPass: true, smooth: true },
    // the visionOS carousel keeps the brighter, cooler tray
    trayUi: { base: [196, 202, 207], amb: 0.6, kd: 0.45, ks: 0.85, sh: 60, rim: [255, 255, 255], kr: 0.7, alpha: 0.6, backAlpha: 0.16, twoPass: true },
    bracket: { base: [170, 176, 186], amb: 0.5, kd: 0.5, ks: 0.9, sh: 80, rim: [255, 255, 255], kr: 0.2, alpha: 1 },
  };

  P3.model = (kind = 'aligner', detail = 1) => {
    const quads = [];
    const nu = Math.max(8, Math.round(14 * detail)), nv = Math.max(5, Math.round(9 * detail));
    const teeth = [];
    let s = 0;
    for (const t of HALF_ARCH) { teeth.push({ s: s + t[0] / 2, t }); s += t[0] + 0.25; }
    const Lmax = s + 1.5;
    const Lteeth = s - 0.25;
    const depthAt = (sc) => {
      const a = Math.abs(sc);
      let acc = 0;
      for (const t of HALF_ARCH) { if (a <= acc + t[0] + 0.25) return t[1]; acc += t[0] + 0.25; }
      return HALF_ARCH[HALF_ARCH.length - 1][1];
    };
    const jaw = (arch, up, yBase, mat, opt) => {
      for (const side of [1, -1]) for (const { s: sc, t } of teeth) {
        const A = arch(side * sc);
        toothQuads(quads, [A.x, 0, A.z], A.T, A.N, t, t[3], up, mat, { nu, nv, yBase, ...opt });
      }
    };
    if (kind === 'aligner') {
      // clear tray: tooth shells + a continuous wall along the arch so it reads as one moulded shell
      const arch = archTable(25, 23);
      jaw(arch, 1, 0, 'tray', { inflate: 1.08, inflateW: 1.06, vMax: Math.PI * 0.6 });
      // hollow shell: thin buccal and lingual margin walls fuse the crown shells into one moulded tray; the cavity
      // stays open on the gingival side (a solid ring read as a wide flat band)
      const wall = { segments: Math.round(44 * detail), K: 10, top: 4.2, bottom: 0.0, from: -Lteeth - 0.6, to: Lteeth + 0.6, papilla: false, topNarrow: 1, halfWidthFn: (sc) => depthAt(sc) * 0.5 * 1.1 };
      gumQuads(quads, arch, Lmax, 1, 'tray', { ...wall, nRange: [0.84, 1.0] });
      gumQuads(quads, arch, Lmax, 1, 'tray', { ...wall, nRange: [-1.0, -0.84] });
    } else if (kind === 'teeth') {
      jaw(archTable(25, 23), 1, 0, 'enamel', {});
    } else {
      // typodont: lower + upper jaw, closed bite (incisal edges meet at y = 0), chunky pink gum blocks
      const Hc = 9.4;
      const lower = archTable(24.4, 22.4), upper = archTable(25.6, 23.6);
      jaw(lower, 1, -Hc, 'enamel', { vMax: Math.PI * 0.6 });
      jaw(upper, -1, -Hc, 'enamel', { vMax: Math.PI * 0.6 });
      gumQuads(quads, lower, Lmax, 1, 'gum', { segments: Math.round(36 * detail), yBase: -Hc, top: 3.0, bottom: -14, halfWidth: 7.6 });
      gumQuads(quads, upper, Lmax, -1, 'gum', { segments: Math.round(36 * detail), yBase: -Hc, top: 3.0, bottom: -14, halfWidth: 7.8 });
    }
    // orient every polygon so its normal points away from its reference point (outward)
    for (const q of quads) {
      if (!q.ref) continue;
      const n = newell(q.v);
      let cx = 0, cy = 0, cz = 0;
      for (const v of q.v) { cx += v[0]; cy += v[1]; cz += v[2]; }
      cx /= q.v.length; cy /= q.v.length; cz /= q.v.length;
      if (n[0] * (cx - q.ref[0]) + n[1] * (cy - q.ref[1]) + n[2] * (cz - q.ref[2]) < 0) q.v.reverse();
      delete q.ref;
    }
    // smooth (Gouraud-style) vertex normals: area-weighted average of the adjacent quad normals, keyed by
    // position so coincident vertices (poles, seams) share one normal. End caps (> 4 vertices) stay flat.
    const key = (v) => `${v[0].toFixed(3)},${v[1].toFixed(3)},${v[2].toFixed(3)}`;
    const acc = new Map();
    for (const q of quads) {
      if (q.v.length !== 4) continue;
      const n = newell(q.v);
      for (const v of q.v) {
        const k = key(v);
        const a = acc.get(k) || [0, 0, 0];
        a[0] += n[0]; a[1] += n[1]; a[2] += n[2];
        acc.set(k, a);
      }
    }
    for (const q of quads) q.vn = q.v.length === 4 ? q.v.map((v) => norm(acc.get(key(v)))) : null;
    // centre the model
    let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    for (const q of quads) for (const v of q.v) for (let i = 0; i < 3; i++) { mn[i] = Math.min(mn[i], v[i]); mx[i] = Math.max(mx[i], v[i]); }
    const c = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2];
    for (const q of quads) q.v = q.v.map((v) => [v[0] - c[0], v[1] - c[1], v[2] - c[2]]);
    return { quads, size: [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]] };
  };

  // draw `model` into 2D context g centred at (cx, cy); scale = px per mm
  P3.draw = (g, model, o) => {
    const yaw = ((o.yaw || 0) * Math.PI) / 180, pitch = ((o.pitch || 0) * Math.PI) / 180, roll = ((o.roll || 0) * Math.PI) / 180;
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
    const D = o.dist || 260;
    const f = (o.scale || 6) * D;
    const L = norm(o.light || [-0.35, 0.8, 0.5]);
    const sxm = o.sx ?? 1, szm = o.sz ?? 1;
    const tr = (v) => {
      const vx = v[0] * sxm, vz = v[2] * szm;
      let x = vx * cyw + vz * syw, z = -vx * syw + vz * cyw, y = v[1];
      const y2 = y * cp - z * sp, z2 = y * sp + z * cp;
      return [x * cr - y2 * sr, x * sr + y2 * cr, z2];
    };
    // normals: inverse-transpose of the non-uniform scale, then the same rotation (no translation)
    const trN = (n) => {
      const v = norm([n[0] / sxm, n[1], n[2] / szm]);
      let x = v[0] * cyw + v[2] * syw, z = -v[0] * syw + v[2] * cyw, y = v[1];
      const y2 = y * cp - z * sp, z2 = y * sp + z * cp;
      return [x * cr - y2 * sr, x * sr + y2 * cr, z2];
    };
    const matOf = (name) => MATS[(o.matMap && o.matMap[name]) || name] || MATS.enamel;
    const items = [];
    for (const q of model.quads) {
      const vs = q.v.map(tr);
      // normal (Newell) in view space
      let nx = 0, ny = 0, nz = 0;
      for (let i = 0; i < vs.length; i++) {
        const a = vs[i], b = vs[(i + 1) % vs.length];
        nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1]);
      }
      const nl = Math.hypot(nx, ny, nz) || 1;
      nx /= nl; ny /= nl; nz /= nl;
      let cx = 0, cy = 0, cz = 0;
      for (const v of vs) { cx += v[0]; cy += v[1]; cz += v[2]; }
      cx /= vs.length; cy /= vs.length; cz /= vs.length;
      const V = norm([-cx, -cy, D - cz]);
      const facing = nx * V[0] + ny * V[1] + nz * V[2];
      const m = matOf(q.mat);
      if (facing <= 0 && !m.backAlpha) continue;
      items.push({ vs, n: [nx, ny, nz], vn: m.smooth && q.vn ? q.vn.map(trN) : null, z: cz, facing, m, V });
    }
    items.sort((a, b) => a.z - b.z);
    const proj = (v) => [o.cx + (v[0] * f) / (D - v[2]), o.cy - (v[1] * f) / (D - v[2])];
    // translucent shells: back faces at low alpha, then the front faces opaque in a second canvas that is
    // composited at the material alpha (no double-alpha seams between neighbouring polygons)
    const two = items.some((it) => it.m.twoPass);
    let fg = null;
    if (two) {
      P3.front = P3.front || document.createElement('canvas');
      const fc = P3.front;
      if (fc.width !== g.canvas.width || fc.height !== g.canvas.height) { fc.width = g.canvas.width; fc.height = g.canvas.height; }
      fg = fc.getContext('2d');
      fg.clearRect(0, 0, fc.width, fc.height);
      fg.lineJoin = 'round';
    }
    g.lineJoin = 'round';
    const gain = o.gain ?? 1;
    const Hh0 = (V) => norm([L[0] + V[0], L[1] + V[1], L[2] + V[2]]);
    // Blinn-Phong + fresnel rim for one normal
    const shadeN = (m, n, V, Hh) => {
      const dif = Math.max(0, n[0] * L[0] + n[1] * L[1] + n[2] * L[2]);
      const spec = Math.pow(Math.max(0, n[0] * Hh[0] + n[1] * Hh[1] + n[2] * Hh[2]), m.sh) * m.ks;
      const facing = Math.abs(n[0] * V[0] + n[1] * V[1] + n[2] * V[2]);
      const fr = Math.pow(1 - facing, 3) * m.kr;
      const base = m.shade && dif < 0.35 ? m.base.map((c, i) => lerp(m.shade[i], c, dif / 0.35)) : m.base;
      return { col: base.map((c, i) => clamp((c * (m.amb + m.kd * dif) + 255 * spec + m.rim[i] * fr) * gain, 0, 255)), spec, fr };
    };
    const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a.toFixed(3)})`;
    const avg = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2];
    for (const it of items) {
      const m = it.m;
      const back = it.facing <= 0;
      const n = back ? it.n.map((x) => -x) : it.n;
      const Hh = Hh0(it.V);
      const flat = shadeN(m, n, it.V, Hh);
      const opaqueFront = m.twoPass && !back;
      const a = back ? m.backAlpha : m.alpha < 1 && !opaqueFront ? clamp(m.alpha + flat.fr * 1.6 + flat.spec * 0.5, 0, 1) : 1;
      const pts = it.vs.map(proj);
      const gg = opaqueFront ? fg : g;
      gg.beginPath();
      gg.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) gg.lineTo(pts[i][0], pts[i][1]);
      gg.closePath();
      let style = rgba(flat.col, a);
      if (it.vn && !back && pts.length === 4) {
        // smooth shading: shade the 4 vertex normals and run a linear gradient across the quad along the
        // direction with the larger colour change (no visible facets once neighbours share normals)
        const c = it.vn.map((vn) => shadeN(m, vn, it.V, Hh).col);
        const cu0 = avg(c[0], c[3]), cu1 = avg(c[1], c[2]);
        const cv0 = avg(c[0], c[1]), cv1 = avg(c[3], c[2]);
        const du = Math.abs(cu1[0] - cu0[0]) + Math.abs(cu1[1] - cu0[1]);
        const dv = Math.abs(cv1[0] - cv0[0]) + Math.abs(cv1[1] - cv0[1]);
        const [p0, p1, c0, c1] = du >= dv
          ? [[(pts[0][0] + pts[3][0]) / 2, (pts[0][1] + pts[3][1]) / 2], [(pts[1][0] + pts[2][0]) / 2, (pts[1][1] + pts[2][1]) / 2], cu0, cu1]
          : [[(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2], [(pts[3][0] + pts[2][0]) / 2, (pts[3][1] + pts[2][1]) / 2], cv0, cv1];
        if (Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) > 0.5) {
          const gr = gg.createLinearGradient(p0[0], p0[1], p1[0], p1[1]);
          gr.addColorStop(0, rgba(c0, a));
          gr.addColorStop(1, rgba(c1, a));
          style = gr;
        } else style = rgba(avg(c0, c1), a);
      }
      gg.fillStyle = style;
      gg.fill();
      if (a >= 1) { gg.strokeStyle = style; gg.lineWidth = 0.9; gg.stroke(); }
    }
    if (two) {
      const ta = o.shellAlpha ?? (Object.values(MATS).find((m) => m.twoPass) || {}).alpha ?? 0.6;
      g.globalAlpha = ta;
      // a sub-pixel soften hides the remaining polygon seams on the translucent shell
      if (o.soften) g.filter = `blur(${o.soften}px)`;
      g.drawImage(P3.front, 0, 0);
      g.filter = 'none';
      g.globalAlpha = 1;
    }
  };
  function newell(vs) {
    let nx = 0, ny = 0, nz = 0;
    for (let i = 0; i < vs.length; i++) {
      const a = vs[i], b = vs[(i + 1) % vs.length];
      nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1]);
    }
    return [nx, ny, nz];
  }
  function norm(v) { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }

  // offscreen sprite cache per model kind + detail
  const modelCache = {};
  P3.get = (kind, detail = 1) => (modelCache[kind + detail] = modelCache[kind + detail] || P3.model(kind, detail));
  // render a sprite canvas for a model at a pixel width
  P3.sprite = (canvas, kind, widthPx, pose, detail = 1) => {
    const model = P3.get(kind, detail);
    const scale = (widthPx * 0.92) / Math.max(model.size[0], model.size[2]);
    const g = canvas.getContext('2d');
    g.clearRect(0, 0, canvas.width, canvas.height);
    P3.draw(g, model, { ...pose, scale, cx: canvas.width / 2, cy: canvas.height / 2 });
    return canvas;
  };

  // ================================================================== components
  // ---------------------------------------------------------------- teal-grid-stage
  R['teal-grid-stage'] = (ctx) => {
    const { cue, tl, gsap } = ctx;
    const spec = specById('teal-grid-stage');
    const b = deepMerge(spec.build || {}, cue.props);
    const rg = b.region || { xPct: 0, yPct: 70.3, wPct: 100, hPct: 29.7 };
    const g = b.grid || {};
    const layer = layerEl(ctx, cue.layer || spec.layer || 'front', cue.worldLock);
    const el = div({ left: rg.xPct + '%', top: rg.yPct + '%', width: rg.wPct + '%', height: rg.hPct + '%', pointerEvents: 'none' });
    layer.insertBefore(el, layer.firstChild);
    const grad = div({ inset: '0px', left: 0, top: 0, width: '100%', height: '100%', background: b.gradient }, el);
    const lw = g.lineWidthPx ?? 1.5;
    const lc = g.lineColor || 'rgba(130,225,232,0.13)';
    const grid = div({ left: 0, top: 0, width: '100%', height: '100%',
      backgroundImage: `repeating-linear-gradient(90deg, ${lc} 0px, ${lc} ${lw}px, transparent ${lw}px, transparent ${g.pitchXPx ?? 60}px), repeating-linear-gradient(180deg, ${lc} 0px, ${lc} ${lw}px, transparent ${lw}px, transparent ${g.pitchYPx ?? 93}px)`,
      backgroundPosition: `${g.offsetXPx ?? 48}px 0px, 0px 0px`,
      // the grid fades out towards the top edge of the stage
      webkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 22%)', maskImage: 'linear-gradient(180deg, transparent 0%, #000 22%)' }, el);
    const pin = deepMerge(spec.in || {}, cue.in);
    const gi = pin.gridOpacity || { startMs: 1833, durationMs: 500 };
    const gr = pin.gradientOpacity || { startMs: 2000, durationMs: 1000 };
    gsap.set([grid, grad], { opacity: 0 });
    tl.to(grid, { opacity: gi.to ?? 1, duration: gi.durationMs / 1000, ease: ctx.ease(gi.easing || 'ease-out'), immediateRender: false }, gi.startMs / 1000);
    tl.to(grad, { opacity: gr.to ?? 1, duration: gr.durationMs / 1000, ease: ctx.ease(gr.easing || 'ease-out'), immediateRender: false }, gr.startMs / 1000);
    cutVis(ctx, el, 0);
  };

  // ---------------------------------------------------------------- prop-3d-enter-spin
  R['prop-3d-enter-spin'] = (ctx) => {
    const { cue } = ctx;
    const spec = specById('prop-3d-enter-spin');
    const variant = cue.variant || 'hero';
    const sizes = spec.build?.sizes || {};
    const loop = deepMerge(spec.loop || {}, cue.loop);
    const kind = cue.model || (variant === 'flyby-behind-head' ? 'aligner' : 'typodont');
    const layerName = cue.layer || (variant === 'flyby-behind-head' ? spec.layerVariants?.['flyby-behind-head'] || 'behind' : spec.layer || 'front');
    const layer = layerEl(ctx, layerName, cue.worldLock);
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    Object.assign(cv.style, { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px', pointerEvents: 'none', visibility: 'hidden' });
    if (cue.opacity != null) cv.style.opacity = cue.opacity;
    layer.appendChild(cv);
    const g = cv.getContext('2d');
    const widthPct = cue.widthPct ?? (variant === 'flyby-behind-head' ? sizes.flyby?.widthPct ?? 76 : variant === 'corner-dof' ? sizes['corner-dof']?.widthPct ?? 38 : sizes.hero?.widthPct ?? 46.5);
    const wpx = pctX(widthPct);
    const sp = document.createElement('canvas');
    sp.width = Math.ceil(wpx * 1.25); sp.height = Math.ceil(wpx * 1.1);
    const pin = deepMerge(spec.in || {}, cue.in);
    const vin = pin.variants?.[variant] || {};
    const yawSpeed = cue.yawDegPerSec ?? loop.yawDegPerSec ?? 45;
    const drift = cue.driftPxPerSec ?? loop.driftPxPerSec ?? 25;
    // pitch > 0 looks down onto the object. Aligner: a low 14 deg elevation keeps the arch shallow (the reference
    // tray is seen almost side-on); a steep view closes the U around the talent's head (reads as a halo/horns).
    const pitch = cue.pitchDeg ?? (kind === 'aligner' ? 14 : -8);
    const yaw0 = cue.yaw0 ?? (kind === 'aligner' ? -62 : -35);
    const soften = cue.softenPx ?? (kind === 'aligner' ? 0.8 : 0);
    const blurPx = cue.blurPx ?? (variant === 'corner-dof' ? sizes['corner-dof']?.blurPx ?? 12 : 0);
    const pos = cue.position || {};
    const detail = cue.detail ?? 1;

    // position (px, centre) + scale as a pure function of local time
    function state(lt) {
      const ms = lt * 1000;
      let x, y, s = 1;
      if (variant === 'flyby-behind-head') {
        // position.xPct (optional) = final centre; default final right edge 85% W
        const to = pos.xPct != null ? pos.xPct + widthPct / 2 : vin.to?.rightEdgePct ?? 85;
        const fr = to - ((vin.to?.rightEdgePct ?? 85) - (vin.from?.rightEdgePct ?? 14.7));
        const re = tween(ms, 0, vin.durationMs ?? 567, fr, to, vin.easing || pin.easing);
        x = pctX(re) - wpx / 2;
        y = pctY(pos.yPct ?? 30);
        const after = Math.max(0, lt - (vin.durationMs ?? 567) / 1000);
        x += drift * after;
      } else if (variant === 'corner-dof') {
        const tx = pctX(pos.xPct ?? 10), ty = pctY(pos.yPct ?? 9);
        const k = E('cubic-bezier(0.2,0.6,0.3,1)')(clamp(ms / (vin.durationMs ?? 300)));
        x = lerp(-wpx * 0.6, tx, k); y = lerp(-pctY(8), ty, k);
        const gr = vin.thenGrow || { scaleTo: 1.45, durationMs: 1700 };
        s = tween(ms, vin.durationMs ?? 300, gr.durationMs, 1, gr.scaleTo, gr.easing || 'linear');
      } else {
        const x1 = pctX(pos.xPct ?? pin.to?.xPct ?? 71.5), y1 = pctY(pos.yPct ?? 82);
        x = tween(ms, 0, pin.durationMs ?? 1000, pctX(pin.from?.xPct ?? 112), x1, pin.easing);
        y = y1;
        const sm = pin.secondMove;
        if (sm && cue.secondMove !== false) {
          x += tween(ms, sm.delayMs, sm.durationMs, 0, sm.dxPx, sm.easing);
          y += tween(ms, sm.delayMs, sm.durationMs, 0, sm.dyPx, sm.easing);
        }
        const settle = ((sm && cue.secondMove !== false ? sm.delayMs + sm.durationMs : pin.durationMs ?? 1000)) / 1000;
        if (lt > settle) x -= drift * 0.7 * (lt - settle);
        if (lt > settle) y -= drift * 0.3 * (lt - settle);
      }
      return { x, y, s, yaw: yaw0 + yawSpeed * lt };
    }
    let lastKey = '';
    ctx.onFrame((t) => {
      if (!alive(cue, t)) { cv.style.visibility = 'hidden'; return; }
      cv.style.visibility = 'visible';
      const lt = t - cue.t;
      const st = state(lt);
      const pv = state(Math.max(0, lt - 1 / FPS));
      const key = `${lt.toFixed(4)}`;
      if (key === lastKey) return;
      lastKey = key;
      P3.sprite(sp, kind, wpx, { yaw: st.yaw, pitch, roll: cue.rollDeg ?? 0, soften, shellAlpha: cue.shellAlpha, gain: cue.gain }, detail);
      g.clearRect(0, 0, W, H);
      const vx = st.x - pv.x, vy = st.y - pv.y;
      const vl = Math.hypot(vx, vy) || 1;
      const len = Math.hypot(vx, vy) * 0.5; // 180° shutter
      // at most 4 sub-copies (more turn a translucent tray into smoke); a light directional soften on top
      const n = len > 3 ? Math.min(4, Math.ceil(len / 10) + 1) : 1;
      const mbBlur = len > 3 ? Math.min(4, len / 14) : 0;
      const fb = blurPx + mbBlur;
      g.filter = fb > 0.05 ? `blur(${fb.toFixed(2)}px)` : 'none';
      const sw = sp.width * st.s, sh = sp.height * st.s;
      for (let k = 0; k < n; k++) {
        const a = n === 1 ? 0 : k / (n - 1) - 0.5;
        const dx = (vx / vl) * len * a, dy = (vy / vl) * len * a;
        g.globalAlpha = 1 / (k + 1);
        g.drawImage(sp, st.x - sw / 2 - dx, st.y - sh / 2 - dy, sw, sh);
      }
      // keep the body readable inside the streak
      if (n > 1) { g.globalAlpha = 0.35; g.drawImage(sp, st.x - sw / 2, st.y - sh / 2, sw, sh); }
      g.globalAlpha = 1;
      g.filter = 'none';
    });
  };

  // ---------------------------------------------------------------- glass-pill-gold
  R['glass-pill-gold'] = (ctx) => {
    const { cue, tl, gsap } = ctx;
    const spec = specById('glass-pill-gold');
    const b = deepMerge(spec.build || {}, cue.props);
    const worldVariant = cue.variant === 'world' || cue.variant === 'worldLock' || cue.variant === 'fade';
    const layer = layerEl(ctx, cue.layer || spec.layer || 'front', cue.worldLock);
    const pos = deepMerge(b.position || {}, cue.position);
    const rim = b.rim || {};
    const el = div({ width: b.widthPx + 'px', height: b.heightPx + 'px', borderRadius: b.radiusPx + 'px', overflow: 'hidden',
      background: [b.warmSpill, b.coolSide, `linear-gradient(${b.fill}, ${b.fill})`].filter(Boolean).join(', '),
      backdropFilter: `blur(${b.backdropBlurPx}px) saturate(1.15)`, webkitBackdropFilter: `blur(${b.backdropBlurPx}px) saturate(1.15)`,
      boxShadow: [rim.topHighlight || 'inset 0 2px 0 rgba(255,255,255,0.35)', `inset 0 0 0 ${rim.widthPx ?? 2}px rgba(255,255,255,0.22)`, 'inset 0 -2px 3px rgba(255,255,255,0.14)', 'inset 0 0 24px rgba(255,255,255,0.05)', '0 18px 50px rgba(0,0,0,0.22)'].join(', ') }, layer);
    ctx.place(el, pos);
    const pin = deepMerge(spec.in || {}, cue.in);
    let inDur;
    if (worldVariant) {
      const v = pin.worldLockVariant || { durationMs: 117 };
      gsap.set(el, { opacity: 0 });
      tl.to(el, { opacity: 1, duration: v.durationMs / 1000, ease: 'none', immediateRender: false }, 0);
      inDur = v.durationMs / 1000;
    } else {
      gsap.set(el, { opacity: 0, scale: pin.from?.scale ?? 0.15, transformOrigin: pin.transformOrigin || '50% 50%' });
      tl.to(el, { opacity: 1, duration: 3 / FPS, ease: 'none', immediateRender: false }, 0);
      tl.to(el, { scale: pin.to?.scale ?? 1, duration: pin.durationMs / 1000, ease: ctx.ease(pin.easing), immediateRender: false }, 0);
      inDur = pin.durationMs / 1000;
    }
    cutVis(ctx, el, 0);
    const label = cue.label ?? b.label;
    if (label) {
      const lp = presetById('pill-label-typeon').position || { xPct: 51.6, yPct: 78.4 };
      const dx = (lp.xPct ?? 51.6) - 50, dy = (lp.yPct ?? 78.4) - 78.2;
      subText(ctx, { preset: 'pill-label-typeon', text: label, layer: cue.layer || 'front', worldLock: cue.worldLock, position: { xPct: (pos.xPct ?? 50) + dx, yPct: (pos.yPct ?? 78.2) + dy }, style: cue.labelStyle }, inDur + 0.033);
    }
    return { el };
  };

  // ---------------------------------------------------------------- glass-search-morph
  function arrowSvg(sz, ring) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `${-sz / 2} ${-sz / 2} ${sz} ${sz}`);
    svg.setAttribute('width', sz);
    svg.setAttribute('height', sz);
    svg.style.cssText = 'position:absolute;left:0;top:0;overflow:visible;';
    const c = document.createElementNS(ns, 'circle');
    c.setAttribute('r', (ring.diameterPx - ring.strokePx) / 2);
    c.setAttribute('fill', 'none');
    c.setAttribute('stroke', ring.color);
    c.setAttribute('stroke-width', ring.strokePx);
    svg.appendChild(c);
    const a = ring.arrow;
    const L = (a.sizePx ?? 54) / 2;
    const h = L * 0.95;
    const p = document.createElementNS(ns, 'path');
    p.setAttribute('d', `M ${L * 0.72} ${L * 0.72} L ${-L * 0.62} ${-L * 0.62} M ${-L * 0.62} ${-L * 0.62 + h} L ${-L * 0.62} ${-L * 0.62} L ${-L * 0.62 + h} ${-L * 0.62}`);
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', a.color);
    p.setAttribute('stroke-width', a.strokePx);
    p.setAttribute('stroke-linecap', a.lineCap || 'round');
    p.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(p);
    return svg;
  }

  R['glass-search-morph'] = (ctx) => {
    const { cue } = ctx;
    const spec = specById('glass-search-morph');
    const b = deepMerge(spec.build || {}, cue.props);
    const m = deepMerge(spec.in || {}, cue.in);
    const mo = m.morph;
    const layer = layerEl(ctx, cue.layer || spec.layer || 'front', cue.worldLock);
    const ring = b.ring, pill = b.pill, cap = b.textCapsule, btn = b.button;
    const Hh = mo.heightPx || pill.heightPx;
    const rr = Hh / 2;
    // geometry: the ring sits where the button ends up (right cap of the pill)
    const ringC = [pctX(ring.centrePct[0]), pctY(ring.centrePct[1])];
    const pillC = [pctX((cue.position?.xPct) ?? pill.centrePct[0]), pctY((cue.position?.yPct) ?? pill.centrePct[1])];
    const dyRing = cue.position?.yPct != null ? pillC[1] - pctY(pill.centrePct[1]) : 0;
    const R0 = ringC[0] + ring.outerDiameterPx / 2;
    const R1 = pillC[0] + pill.widthPx / 2;
    const cy = pillC[1];
    const root = div({ left: 0, top: 0, width: W + 'px', height: H + 'px', pointerEvents: 'none', visibility: 'hidden' }, layer);
    // clear glass: the band/body is barely tinted; crisp bright rims carry the shape (sbs_ring / sbs_pill2)
    const rimRing = ring.rimAlpha ?? 0.7, rimPill = pill.rimAlpha ?? 0.45;
    const body = div({ top: (cy - rr + dyRing * 0) + 'px', height: Hh + 'px', borderRadius: rr + 'px', overflow: 'hidden',
      backdropFilter: `blur(${pill.backdropBlurPx}px)`, webkitBackdropFilter: `blur(${pill.backdropBlurPx}px)` }, root);
    const capEl = div({ width: cap.widthPx + 'px', height: cap.heightPx + 'px', borderRadius: cap.radiusPx + 'px', top: (Hh - cap.heightPx) / 2 + 'px', background: cap.fill,
      boxShadow: `inset 0 0 0 1.5px rgba(255,255,255,0.14), inset 0 2px 6px rgba(0,0,0,0.3)` }, body);
    const holeRim = div({ borderRadius: '50%', border: `1.75px solid rgba(255,255,255,${rimRing})`, boxSizing: 'border-box', boxShadow: '0 0 7px 1px rgba(255,255,255,0.32), inset 0 0 4px rgba(255,255,255,0.2)' }, root);
    // top-left specular crescent on the ring (fades as the ring opens into the pill)
    const specEl = div({ borderRadius: '50%', boxShadow: 'inset 4px 4px 0 -1px rgba(255,255,255,0.55), inset 9px 9px 14px -8px rgba(255,255,255,0.35)' }, root);
    const btnEl = div({ width: btn.diameterPx + 'px', height: btn.diameterPx + 'px', borderRadius: '50%', background: btn.fill,
      boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.10), inset 0 0 0 1.5px rgba(255,255,255,0.08)' }, root);
    const svgWrap = div({ left: btn.diameterPx / 2 + 'px', top: btn.diameterPx / 2 + 'px' }, btnEl);
    svgWrap.appendChild(arrowSvg(btn.ring.diameterPx + 10, { ...btn.ring, arrow: btn.arrow }));
    svgWrap.firstChild.style.left = -(btn.ring.diameterPx + 10) / 2 + 'px';
    svgWrap.firstChild.style.top = -(btn.ring.diameterPx + 10) / 2 + 'px';
    const fillRing = parseFloat((ring.fill.match(/[\d.]+\)\s*$/) || ['0.22'])[0]);
    const fillPill = parseFloat((pill.fill.match(/[\d.]+\)\s*$/) || ['0.13'])[0]);
    const hold = (m.ringHoldMs ?? 100) / 1000;
    const grow = (mo.growMs ?? 867) / 1000, settle = (mo.settleMs ?? 867) / 1000;
    const bp = m.buttonPop;
    const holeR0 = ring.outerDiameterPx / 2 - ring.bandPx;
    ctx.onFrame((t) => {
      if (!alive(cue, t)) { root.style.visibility = 'hidden'; return; }
      root.style.visibility = 'visible';
      const lt = t - cue.t;
      const g1 = clamp((lt - hold) / grow);
      const g2 = clamp((lt - hold - grow) / settle);
      let w;
      if (lt < hold) w = ring.outerDiameterPx;
      else if (g2 <= 0) w = lerp(ring.outerDiameterPx, mo.widthPeakPx, E(mo.growEasing)(g1));
      else w = lerp(mo.widthPeakPx, mo.widthSettlePx, E(mo.settleEasing)(g2));
      const Rx = lerp(R0, R1, E('cubic-bezier(0.25,0.1,0.25,1)')(clamp((lt - hold) / (grow + settle))));
      const Lx = Rx - w;
      body.style.left = Lx + 'px';
      body.style.width = w + 'px';
      const k = clamp((lt - hold) / (grow * 0.6));
      const fa = lerp(fillRing, fillPill, k);
      body.style.background = `linear-gradient(180deg, rgba(255,255,255,${(fa + 0.03).toFixed(3)}) 0%, rgba(255,255,255,${fa.toFixed(3)}) 45%, rgba(255,255,255,${(fa * 0.8).toFixed(3)}) 100%)`;
      // crisp outer rim all round (ring brighter) + 3 px top specular + faint bottom inner light
      const ra = lerp(rimRing, rimPill, k);
      const eg = lerp(0.3, 0.1, k); // soft edge light inside the outer rim (strong on the ring, faint on the pill)
      body.style.boxShadow = `inset 0 0 0 1.75px rgba(255,255,255,${ra.toFixed(3)}), inset 0 0 8px 1px rgba(255,255,255,${eg.toFixed(3)}), inset 0 3px 0 rgba(255,255,255,0.30), inset 0 -2px 3px rgba(255,255,255,0.12)`;
      const blur = lerp(ring.backdropBlurPx, pill.backdropBlurPx, k);
      body.style.backdropFilter = body.style.webkitBackdropFilter = `blur(${blur.toFixed(1)}px)`;
      // ring hole closes as the button pops in
      const bt = clamp((lt - hold - bp.delayMs / 1000) / (bp.durationMs / 1000));
      const holeR = holeR0 * (1 - clamp((lt - hold) / (grow * 0.55)));
      const hx = w - rr;
      if (holeR > 0.6) {
        const mk = `radial-gradient(circle ${holeR.toFixed(1)}px at ${hx.toFixed(1)}px 50%, transparent ${(holeR - 0.8).toFixed(1)}px, #000 ${holeR.toFixed(1)}px)`;
        body.style.webkitMaskImage = mk; body.style.maskImage = mk;
      } else { body.style.webkitMaskImage = 'none'; body.style.maskImage = 'none'; }
      Object.assign(holeRim.style, { left: Lx + hx - holeR + 'px', top: cy - holeR + 'px', width: 2 * holeR + 'px', height: 2 * holeR + 'px', opacity: holeR > 1 ? 1 : 0 });
      const so = 1 - clamp((lt - hold) / (grow * 0.4));
      Object.assign(specEl.style, { left: Lx + 'px', top: cy - rr + 'px', width: Math.min(w, Hh) + 'px', height: Hh + 'px', opacity: so.toFixed(3) });
      // dark text capsule anchored to the pill's left edge
      capEl.style.left = (cap.insetPx ?? 38) + 'px';
      capEl.style.opacity = clamp((lt - hold - grow * 0.25) / (grow * 0.45)).toFixed(3);
      const sBtn = lt < hold + bp.delayMs / 1000 ? 0 : E(bp.easing)(bt);
      Object.assign(btnEl.style, { left: Lx + hx - btn.diameterPx / 2 + 'px', top: cy - btn.diameterPx / 2 + 'px', transform: `scale(${sBtn.toFixed(4)})`, opacity: sBtn > 0.001 ? 1 : 0 });
    });
    // optional label + sub-line (or write them as separate text cues in the scene)
    if (cue.label) subText(ctx, { preset: 'search-typewriter', text: cue.label, layer: cue.layer || 'front', position: cue.labelPosition }, (presetById('search-typewriter').start?.offsetMs ?? 533) / 1000);
    if (cue.sub) subText(ctx, { preset: 'pill-subline-wipe', text: cue.sub, layer: cue.layer || 'front', position: cue.subPosition, override: { in: { from: { clip: 'inset(0 0 0 100%)' }, to: { clip: 'inset(0 0 0 0%)' } } } }, (presetById('pill-subline-wipe').start?.offsetMs ?? 700) / 1000);
    return { el: root };
  };

  // ---------------------------------------------------------------- visionos-glass-ui
  const ICONS = {
    home: 'M -12 2 L 0 -10 L 12 2 M -8 -2 L -8 12 L 8 12 L 8 -2',
    photos: 'M -13 -10 H 13 V 10 H -13 Z M -13 6 L -4 -2 L 3 5 L 7 1 L 13 7',
    plus: 'M 0 -11 V 11 M -11 0 H 11',
    back: 'M 4 -9 L -5 0 L 4 9',
  };
  function iconSvg(name, size, color, stroke = 3) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '-16 -16 32 32');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    const p = document.createElementNS(ns, 'path');
    p.setAttribute('d', ICONS[name] || ICONS.plus);
    p.setAttribute('fill', name === 'photos' ? 'rgba(255,255,255,0.12)' : 'none');
    p.setAttribute('stroke', color);
    p.setAttribute('stroke-width', stroke);
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(p);
    return svg;
  }
  const glassCss = (fill, blur, extra = {}) => ({ background: fill, backdropFilter: `blur(${blur}px) saturate(1.2)`, webkitBackdropFilter: `blur(${blur}px) saturate(1.2)`,
    boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.32), inset 0 0 0 1px rgba(255,255,255,0.12), inset 0 -1px 1px rgba(255,255,255,0.10), 0 12px 36px rgba(0,0,0,0.22)', ...extra });

  R['visionos-glass-ui'] = (ctx) => {
    const { cue, tl, gsap } = ctx;
    const spec = specById('visionos-glass-ui');
    const b = deepMerge(spec.build || {}, cue.props);
    const pin = deepMerge(spec.in || {}, cue.in);
    const worldLock = cue.worldLock ?? spec.worldLock ?? true;
    const layer = layerEl(ctx, cue.layer || spec.layer || 'front', worldLock);
    const off = cue.offsetPct || [0, 0];
    const at = (c) => [pctX(c[0] + off[0]), pctY(c[1] + off[1])];
    const root = div({ left: 0, top: 0, width: W + 'px', height: H + 'px', pointerEvents: 'none' }, layer);
    const ui = b.tabBar, wn = b.window, dk = b.dock, gb = b.grabber;
    const uiFont = fam(fontFor('ui-label'));
    // tab bar
    const [tx, ty] = at(ui.centrePct);
    const tab = div({ left: tx - ui.widthPx / 2 + 'px', top: ty - ui.heightPx / 2 + 'px', width: ui.widthPx + 'px', height: ui.heightPx + 'px', borderRadius: ui.radiusPx + 'px', ...glassCss('rgba(150,150,150,0.20)', 22) }, root);
    const segW = (ui.widthPx - 16) / ui.labels.length;
    const sel = div({ top: '8px', height: ui.heightPx - 16 + 'px', width: segW + 'px', borderRadius: (ui.heightPx - 16) / 2 + 'px', background: ui.selectedFill, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)' }, tab);
    ui.labels.forEach((lab, i) => {
      const l = div({ left: 8 + i * segW + 'px', top: 0, width: segW + 'px', height: ui.heightPx + 'px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: uiFont, fontWeight: 500, fontSize: (fontFor('ui-label').sizePx || 20) + 'px', color: fontFor('ui-label').color || 'rgba(255,255,255,0.9)', letterSpacing: '0.01em' }, tab);
      l.textContent = lab;
    });
    const [bx, by] = at(ui.backCircleCentrePct);
    const back = div({ left: bx - ui.backCircleDiameterPx / 2 + 'px', top: by - ui.backCircleDiameterPx / 2 + 'px', width: ui.backCircleDiameterPx + 'px', height: ui.backCircleDiameterPx + 'px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', ...glassCss('rgba(150,150,150,0.22)', 18) }, root);
    back.appendChild(iconSvg('back', 22, 'rgba(255,255,255,0.9)', 3.2));
    // window with perspective + tray carousel
    const [wx, wy] = at(wn.centrePct);
    const win = div({ left: wx - wn.widthPx / 2 + 'px', top: wy - wn.heightPx / 2 + 'px', width: wn.widthPx + 'px', height: wn.heightPx + 'px', borderRadius: wn.radiusPx + 'px', overflow: 'hidden',
      transform: wn.transform, transformOrigin: '50% 50%',
      ...glassCss(`linear-gradient(160deg, rgba(190,190,190,0.20) 0%, ${wn.fill} 45%, rgba(140,140,140,0.12) 100%)`, wn.backdropBlurPx, { boxShadow: `inset 0 1px 0 rgba(255,255,255,0.30), inset 0 -${wn.specularEdgePx}px 0 rgba(255,255,255,0.55), inset 0 0 0 1px rgba(255,255,255,0.10), 0 30px 60px rgba(0,0,0,0.25)` }) }, root);
    const cw = wn.widthPx, ch = wn.heightPx;
    const car = document.createElement('canvas');
    car.width = cw; car.height = ch;
    Object.assign(car.style, { position: 'absolute', left: 0, top: 0, width: cw + 'px', height: ch + 'px' });
    win.appendChild(car);
    const grab = div({ left: wx - gb.widthPx / 2 + 'px', top: wy + wn.heightPx / 2 + gb.belowWindowPx + 'px', width: gb.widthPx + 'px', height: gb.heightPx + 'px', borderRadius: gb.radiusPx + 'px', background: gb.color,
      transform: wn.transform.replace(/rotateX\([^)]*\)/, ''), boxShadow: '0 0 10px rgba(255,255,255,0.25)' }, root);
    // dock
    const [dx, dy] = at(dk.centrePct);
    const dock = div({ left: dx - dk.widthPx / 2 + 'px', top: dy - dk.heightPx / 2 + 'px', width: dk.widthPx + 'px', height: dk.heightPx + 'px', borderRadius: dk.radiusPx + 'px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-evenly', ...glassCss('rgba(150,150,150,0.20)', 22) }, root);
    dk.icons.forEach((nm, i) => {
      const c = document.createElement('div');
      Object.assign(c.style, { width: '58px', height: '58px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: i === 1 ? 'rgba(255,255,255,0.18)' : 'transparent' });
      c.appendChild(iconSvg(nm, dk.iconSizePx, dk.iconColor, 2.6));
      dock.appendChild(c);
    });
    // in
    const ti = pin.tabBar, sl = pin.tabSelectionSlide, wi = pin.window;
    gsap.set([tab, back], { opacity: 0 });
    gsap.set(sel, { x: sl.fromLabel * segW });
    gsap.set([win, grab], { opacity: 0 });
    tl.to([tab, back], { opacity: 1, duration: ti.durationMs / 1000, ease: 'none', immediateRender: false }, ti.delayMs / 1000);
    tl.to(sel, { x: sl.toLabel * segW, duration: sl.durationMs / 1000, ease: ctx.ease(sl.easing), immediateRender: false }, sl.delayMs / 1000);
    tl.to([win, grab], { opacity: 1, duration: wi.durationMs / 1000, ease: ctx.ease(wi.easing || 'linear'), immediateRender: false }, wi.delayMs / 1000);
    cutVis(ctx, root, 0);
    // carousel: 3-4 translucent trays on a slowly turning ring (period 4 s)
    const items = cue.items ?? 3;
    const period = (spec.loop?.carousel?.periodMs ?? 4000) / 1000;
    const g = car.getContext('2d');
    const spr = document.createElement('canvas');
    spr.width = 300; spr.height = 260;
    ctx.onFrame((t) => {
      if (!alive(cue, t)) return;
      const lt = t - cue.t;
      g.clearRect(0, 0, cw, ch);
      const list = [];
      for (let k = 0; k < items; k++) {
        const a = (k / items) * Math.PI * 2 + (lt / period) * Math.PI * 2;
        list.push({ a, z: Math.cos(a), x: Math.sin(a) });
      }
      list.sort((p, q) => p.z - q.z);
      for (const it of list) {
        const depth = (it.z + 1) / 2; // 0 back .. 1 front
        const sc = lerp(0.62, 1.05, depth);
        // narrow U-shaped trays, front teeth towards the bottom, turning as they travel round the carousel
        P3.sprite(spr, 'aligner', 230, { yaw: 180 + Math.sin(it.a) * 55, pitch: -52, roll: 0, dist: 260, sx: 0.78, sz: 1.15, light: [-0.3, 0.6, 0.74], gain: 1.5, shellAlpha: 0.92, matMap: { tray: 'trayUi' } }, 1);
        g.globalAlpha = lerp(0.3, 1, depth);
        const w = spr.width * sc, h = spr.height * sc;
        g.drawImage(spr, cw / 2 + it.x * cw * 0.36 - w / 2, ch * 0.52 - h / 2 + (1 - depth) * -24, w, h);
      }
      g.globalAlpha = 1;
    });
    return { el: root };
  };

  // ---------------------------------------------------------------- phone-glide-in
  R['phone-glide-in'] = (ctx) => {
    const { cue } = ctx;
    const spec = specById('phone-glide-in');
    const b = deepMerge(spec.build || {}, cue.props);
    const pin = deepMerge(spec.in || {}, cue.in);
    const layer = layerEl(ctx, cue.layer || spec.layer || 'front', cue.worldLock);
    const bw = b.bodyWidthPx, bh = b.bodyHeightPx, br = b.cornerRadiusPx, bz = b.bezelPx, fw = b.frame.widthPx;
    const final = b.final || { centrePct: [41.7, 75.8], rotateDeg: -11.1 };
    const fc = [pctX(cue.position?.xPct ?? final.centrePct[0]), pctY(cue.position?.yPct ?? final.centrePct[1])];
    const persp = div({ left: 0, top: 0, width: W + 'px', height: H + 'px', perspective: '1600px', perspectiveOrigin: `${fc[0]}px ${fc[1]}px`, pointerEvents: 'none', visibility: 'hidden' }, layer);
    const body = div({ left: -bw / 2 + 'px', top: -bh / 2 + 'px', width: bw + 'px', height: bh + 'px', borderRadius: br + 'px', padding: fw + 'px', boxSizing: 'border-box',
      background: `linear-gradient(125deg, ${b.frame.litEdge} 0%, #b9b8bb 12%, ${b.frame.color} 30%, #3c3c3e 55%, ${b.frame.color} 78%, #d8d7da 100%)`,
      boxShadow: '0 30px 60px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.35)', transformOrigin: '50% 50%' }, persp);
    const bezel = div({ position: 'relative', width: '100%', height: '100%', borderRadius: br - fw + 'px', background: '#050505', padding: bz + 'px', boxSizing: 'border-box' }, body);
    const scw = bw - 2 * fw - 2 * bz, sch = bh - 2 * fw - 2 * bz;
    const screen = document.createElement('canvas');
    screen.width = scw * 2; screen.height = sch * 2;
    Object.assign(screen.style, { position: 'relative', display: 'block', width: scw + 'px', height: sch + 'px', borderRadius: br - fw - bz + 'px', background: b.screen.background });
    bezel.appendChild(screen);
    div({ left: '50%', top: bz + 11 + 'px', width: '96px', height: '28px', marginLeft: '-48px', borderRadius: '14px', background: '#000' }, bezel);
    const g = screen.getContext('2d');
    const spr = document.createElement('canvas');
    spr.width = 520; spr.height = 470;
    const tracks = Object.fromEntries((pin.tracks || []).map((t) => [t.prop, t]));
    const rotKeys = tracks.rotate?.keyframes || [{ tMs: 0, rotate: 0 }, { tMs: 1733, rotate: final.rotateDeg }];
    const yawT = tracks.rotateY || { from: 90, to: 0, durationMs: 767, easing: 'ease-out' };
    const counter = deepMerge(spec.loop?.screenCounter || { from: 10, to: 18, durationMs: 1100 }, cue.counter);
    const uiFont = fam(fontFor('ui-label'));
    const dur = pin.durationMs ?? 1733;
    // right edge 6 → 678 px: the unrotated centre runs from (6 - w/2) to the final centre
    const x0 = (pin.from?.rightEdgePx ?? 6) - bw / 2;
    function drawScreen(lt) {
      const s = 2;
      g.setTransform(s, 0, 0, s, 0, 0);
      g.fillStyle = b.screen.background;
      g.fillRect(0, 0, scw, sch);
      g.fillStyle = '#111';
      g.font = `600 13px ${uiFont}`;
      g.textAlign = 'left';
      g.fillText('9:41', 24, 24);
      g.textAlign = 'right';
      g.fillText('● ▲ ▮', scw - 22, 24);
      // page header
      g.textAlign = 'left';
      g.fillStyle = '#2a2a2e';
      g.font = `500 11px ${uiFont}`;
      g.fillText('Clear aligner case — 3D treatment plan', 16, 62);
      g.fillStyle = '#d9d9de';
      g.fillRect(0, 74, scw, 1);
      // 3D model
      const yaw = -30 + 38 * Math.sin(lt * 0.9);
      P3.sprite(spr, 'typodont', 470, { yaw, pitch: -14, dist: 320 }, 0.75);
      g.drawImage(spr, (scw - 250) / 2, 150, 250, 226);
      // counter + progress bar
      const k = clamp((lt * 1000 - dur * 0.55) / counter.durationMs);
      const step = Math.round(lerp(counter.from, counter.to, k));
      g.fillStyle = '#6b6b73';
      g.font = `500 10px ${uiFont}`;
      g.textAlign = 'right';
      g.fillText(String(step), scw - 24, sch - 118);
      g.textAlign = 'left';
      g.fillText('Step', 22, sch - 118);
      const bwid = scw - 44;
      g.fillStyle = '#c9c9cf';
      g.fillRect(22, sch - 108, bwid, 7);
      g.fillRect(22, sch - 94, bwid, 7);
      g.fillStyle = b.screen.progressColor || '#21A4F0';
      g.fillRect(22, sch - 108, bwid * lerp(0.42, 0.78, k), 7);
      g.fillRect(22, sch - 94, bwid * lerp(0.42, 0.78, k), 7);
      // url bar
      g.fillStyle = '#e6e6ea';
      roundRect(g, 14, sch - 62, scw - 28, 34, 17);
      g.fill();
      g.fillStyle = '#444';
      g.font = `500 11px ${uiFont}`;
      g.textAlign = 'center';
      g.fillText('clearaligner.clinic', scw / 2, sch - 41);
      g.setTransform(1, 0, 0, 1, 0, 0);
    }
    ctx.onFrame((t) => {
      if (!alive(cue, t)) { persp.style.visibility = 'hidden'; return; }
      persp.style.visibility = 'visible';
      const lt = t - cue.t;
      const ms = lt * 1000;
      const x = tween(ms, 0, dur, x0, fc[0], pin.easing);
      const yawD = tween(ms, 0, yawT.durationMs, yawT.from, yawT.to, yawT.easing);
      const rot = keyAt(rotKeys, ms, 'rotate');
      body.style.transform = `translate(${x.toFixed(2)}px, ${fc[1].toFixed(2)}px) rotateY(${yawD.toFixed(2)}deg) rotate(${rot.toFixed(3)}deg)`;
      drawScreen(lt);
    });
    return { el: persp };
  };
  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  // ---------------------------------------------------------------- teal-clinic-backdrop (bg replacement)
  // Procedural version of style.json backgrounds.wsPlate / mcuPlate (+ tubeHaze on the WS). Drawn already in the
  // graded look (the bg layer is never graded): crushed blacks, teal mids, highlights ≤ luma ~170.
  R['teal-clinic-backdrop'] = (ctx) => {
    const { cue } = ctx;
    const bgs = STYLE.backgrounds || {};
    const variant = cue.variant || 'mcu';
    const pal = STYLE.palette || {};
    const layer = layerEl(ctx, cue.layer || 'bg', false);
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    Object.assign(cv.style, { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px' });
    layer.appendChild(cv);
    const g = cv.getContext('2d');
    const off = document.createElement('canvas');
    off.width = W; off.height = H;
    const o = off.getContext('2d');
    const r = ctx.rng(cue.seed || 'teal-clinic');
    const radial = (x, y, rad, stops, sx = 1, sy = 1) => {
      o.save();
      o.translate(x, y);
      o.scale(sx, sy);
      const gr = o.createRadialGradient(0, 0, 0, 0, 0, rad);
      stops.forEach(([p, c]) => gr.addColorStop(p, c));
      o.fillStyle = gr;
      o.fillRect(-rad, -rad, 2 * rad, 2 * rad);
      o.restore();
    };
    if (variant === 'ws') {
      // back wall: dark teal → blue-teal on the right
      let gr = o.createLinearGradient(0, 0, W, 0);
      gr.addColorStop(0, '#0B2129'); gr.addColorStop(0.45, pal.plateWallDark || '#183C49'); gr.addColorStop(0.8, '#0F4A60'); gr.addColorStop(1, pal.plateWallBlue || '#045A79');
      o.fillStyle = gr; o.fillRect(0, 0, W, H);
      // ceiling band
      gr = o.createLinearGradient(0, 0, 0, H * 0.22);
      gr.addColorStop(0, '#05090C'); gr.addColorStop(1, 'rgba(5,9,12,0)');
      o.fillStyle = gr; o.fillRect(0, 0, W, H * 0.22);
      // floor
      gr = o.createLinearGradient(0, H * 0.6, 0, H);
      gr.addColorStop(0, 'rgba(10,30,36,0.0)'); gr.addColorStop(0.15, '#0D252C'); gr.addColorStop(1, '#03080A');
      o.fillStyle = gr; o.fillRect(0, H * 0.6, W, H * 0.4);
      // wall panels / cabinets (soft verticals)
      for (let k = 0; k < 7; k++) {
        const x = (k / 7) * W + r() * 40;
        o.fillStyle = `rgba(150,220,230,${(0.025 + r() * 0.03).toFixed(3)})`;
        o.fillRect(x, H * 0.24, 3, H * 0.34);
      }
      // equipment at the right with blue LED under-glow
      gr = o.createLinearGradient(0, H * 0.42, 0, H * 0.62);
      gr.addColorStop(0, '#14313B'); gr.addColorStop(1, '#081419');
      o.fillStyle = gr;
      roundRect(o, W * 0.7, H * 0.42, W * 0.24, H * 0.2, 28); o.fill();
      o.fillStyle = 'rgba(120,220,235,0.35)';
      roundRect(o, W * 0.72, H * 0.445, W * 0.12, H * 0.012, 8); o.fill();
      radial(W * 0.86, H * 0.66, 330, [[0, 'rgba(1,90,150,0.85)'], [0.5, 'rgba(1,90,150,0.35)'], [1, 'rgba(1,90,150,0)']], 1.2, 0.55);
      radial(W * 0.95, H * 0.45, 420, [[0, 'rgba(4,120,160,0.45)'], [1, 'rgba(4,90,121,0)']], 0.8, 1.2);
      // ceiling tubes + haze (screen)
      const tube = (x, y, w2, ang) => {
        o.save(); o.translate(x, y); o.rotate(ang);
        o.fillStyle = pal.plateTube || '#D3F2F1';
        roundRect(o, -w2 / 2, -9, w2, 18, 9); o.fill();
        o.restore();
      };
      tube(W * 0.25, H * 0.085, 300, -0.04);
      tube(W * 0.78, H * 0.07, 340, 0.03);
      o.globalCompositeOperation = 'screen';
      radial(W * 0.25, H * 0.085, 200, [[0, 'rgba(160,235,240,0.55)'], [0.35, 'rgba(120,220,230,0.2)'], [1, 'rgba(120,220,230,0)']], 1.1, 0.25);
      radial(W * 0.78, H * 0.07, 220, [[0, 'rgba(160,235,240,0.55)'], [0.35, 'rgba(120,220,230,0.2)'], [1, 'rgba(120,220,230,0)']], 1.1, 0.25);
      const hz = bgs.tubeHaze || {};
      const hr = hz.radiusPx || 220;
      radial(W * 0.25, H * 0.085, hr * 1.4, [[0, 'rgba(211,242,241,0.30)'], [1, 'rgba(211,242,241,0)']], 1.6, 0.8);
      radial(W * 0.78, H * 0.07, hr * 1.4, [[0, 'rgba(211,242,241,0.30)'], [1, 'rgba(211,242,241,0)']], 1.6, 0.8);
      o.globalCompositeOperation = 'source-over';
      // dark counter in the left foreground
      gr = o.createLinearGradient(0, H * 0.6, 0, H);
      gr.addColorStop(0, '#2A3236'); gr.addColorStop(0.06, '#1A2125'); gr.addColorStop(1, '#07090A');
      o.fillStyle = gr;
      o.beginPath(); o.moveTo(0, H * 0.62); o.lineTo(W * 0.42, H * 0.6); o.lineTo(W * 0.45, H); o.lineTo(0, H); o.closePath(); o.fill();
    } else {
      // MCU wash: dark teal left, saturated blue-cyan right, one pale blurred lamp shape upper centre-right
      let gr = o.createLinearGradient(0, 0, W, 0);
      gr.addColorStop(0, '#0A1E26'); gr.addColorStop(0.35, pal.plateWallDark || '#183C49'); gr.addColorStop(0.75, '#0A5470'); gr.addColorStop(1, pal.plateWallBlue || '#045A79');
      o.fillStyle = gr; o.fillRect(0, 0, W, H);
      radial(W * 0.92, H * 0.42, 700, [[0, 'rgba(6,120,170,0.55)'], [1, 'rgba(4,90,121,0)']], 0.9, 1.3);
      radial(W * 0.66, H * 0.14, 260, [[0, 'rgba(211,242,241,0.42)'], [0.55, 'rgba(160,215,220,0.16)'], [1, 'rgba(160,215,220,0)']], 1.25, 0.8);
      for (let k = 0; k < 9; k++) {
        radial(r() * W, H * (0.1 + r() * 0.5), 40 + r() * 70, [[0, `rgba(170,230,240,${(0.05 + r() * 0.07).toFixed(3)})`], [1, 'rgba(170,230,240,0)']]);
      }
      gr = o.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, 'rgba(0,0,0,0.25)'); gr.addColorStop(0.45, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.65)');
      o.fillStyle = gr; o.fillRect(0, 0, W, H);
    }
    const blur = cue.blurPx ?? (variant === 'ws' ? (bgs.wsPlate?.blurPx?.[0] ?? 2) + 1 : (bgs.mcuPlate?.blurPx?.[0] ?? 14) + 2);
    g.filter = `blur(${blur}px)`;
    g.drawImage(off, -20, -20, W + 40, H + 40);
    g.filter = 'none';
    cutVis(ctx, cv, 0);
    return { el: cv };
  };

  // ---------------------------------------------------------------- cyan-rim-relight (talent overlay)
  // (boot wrapper is applied at the end of the file)
  R['cyan-rim-relight'] = (ctx) => {
    const { cue } = ctx;
    const spec = (STYLE.backgrounds || {}).cyanRimRelight || {};
    if (!META.matte) { console.warn('cyan-rim-relight needs person mattes'); return; }
    const layer = ctx.layers.front;
    const cv = document.createElement('canvas');
    cv.width = W / 2; cv.height = H / 2;
    Object.assign(cv.style, { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px', mixBlendMode: spec.blend || 'soft-light', opacity: cue.opacity ?? (spec.opacity ? spec.opacity[1] : 0.32), pointerEvents: 'none', visibility: 'hidden' });
    layer.insertBefore(cv, layer.firstChild);
    const g = cv.getContext('2d');
    const img = new Image();
    const pad = (i) => String(i).padStart(5, '0');
    ctx.onFrame(async (t, i) => {
      if (!alive(cue, t)) { cv.style.visibility = 'hidden'; return; }
      cv.style.visibility = 'visible';
      const fi = Math.min(i, (META.frames || 1) - 1);
      const url = `${CFG.plateUrl}matte/${pad(fi)}.png`;
      if (img.dataset.url !== url) { img.src = url; await img.decode().catch(() => null); img.dataset.url = url; }
      const m = camMatrix(ctx.cam);
      g.setTransform(m[0] / 2, m[1] / 2, m[2] / 2, m[3] / 2, m[4] / 2, m[5] / 2);
      g.clearRect(-W, -H, 3 * W, 3 * H);
      g.globalCompositeOperation = 'source-over';
      g.drawImage(img, 0, 0, W, H);
      g.setTransform(0.5, 0, 0, 0.5, 0, 0);
      g.globalCompositeOperation = 'source-in';
      const f = ctx.face(t);
      const x0 = f.cx, x1 = Math.min(W, f.cx + f.w * 1.6);
      const gr = g.createLinearGradient(x0, 0, x1, 0);
      gr.addColorStop(0, 'rgba(4,90,121,0)');
      gr.addColorStop(0.55, 'rgba(4,90,121,0.7)');
      gr.addColorStop(1, spec.color || '#045A79');
      g.fillStyle = gr;
      g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'source-over';
      g.setTransform(1, 0, 0, 1, 0, 0);
    });
  };

  // every component of this style boots the zero-time fix once
  for (const id of ['s2-text', 'teal-grid-stage', 'prop-3d-enter-spin', 'glass-pill-gold', 'glass-search-morph', 'visionos-glass-ui', 'phone-glide-in', 'teal-clinic-backdrop', 'cyan-rim-relight']) {
    const fn = R[id];
    R[id] = (ctx) => { boot(ctx); return fn(ctx); };
  }
})();
