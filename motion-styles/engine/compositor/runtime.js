/* Motion-styles compositor runtime.
 *
 * Deterministic: everything is driven by one paused GSAP timeline that render.mjs seeks frame by frame.
 * Layer stack (bottom → top):
 *   #plateWrap  (camera)  source frame
 *   #bg                   background replacements / behind-everything graphics
 *   #behind               graphics that sit between the background and the presenter
 *   #talentWrap (camera)  presenter cut-out (source frame × person matte)
 *   #front                graphics over the presenter
 *   #fx                   vignette, tint, grain, light leaks
 *
 * Config arrives as window.__MG__ = { meta, faces, style, scene, plateUrl, fontsUrl, assetBase }.
 */
(() => {
  const C = window.__MG__;
  const W = C.meta.width;
  const H = C.meta.height;
  const FPS = C.meta.fps;
  const stage = document.getElementById('stage');
  stage.style.width = W + 'px';
  stage.style.height = H + 'px';

  const $ = (id) => document.getElementById(id);
  const layers = { bg: $('bg'), behind: $('behind'), front: $('front'), fx: $('fx') };
  const plateCanvas = $('plate');
  const talentCanvas = $('talent');
  for (const c of [plateCanvas, talentCanvas]) { c.width = W; c.height = H; }
  const pctx = plateCanvas.getContext('2d');
  const tctx = talentCanvas.getContext('2d');

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
  function mapVars(o = {}, filterTemplate) {
    const v = {};
    const f = {};
    for (const [k, val] of Object.entries(o)) {
      if (val == null) continue;
      switch (k) {
        case 'rotate': v.rotation = val; break;
        case 'blur': case 'brightness': case 'saturate': case 'contrast': case 'hueRotate': f[k] = val; break;
        case 'clip': case 'clipPath': v.clipPath = val; break;
        case 'letterSpacing': v.letterSpacing = px(val); break;
        case 'glow': v['--glow'] = val; break;
        default: v[k] = val;
      }
    }
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

  // ---------- Arabic-safe text splitting ----------
  // Letters that never connect to the following letter.
  const NON_JOIN_LEFT = new Set([...'اأإآٱدذرزوؤةءى'].filter((c) => c !== 'ى'));
  const isArabic = (c) => /[؀-ۿݐ-ݿࢠ-ࣿ]/.test(c);
  const isMark = (c) => /[ً-ٰٟۖ-ۭ]/.test(c);
  const ZWJ = '‍';

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
  const joinsLeft = (g) => isArabic(g[0]) && !NON_JOIN_LEFT.has([...g].filter((c) => !isMark(c)).pop()) && !/^ل[اأإآ]/.test(g) && g !== 'ء';

  function tatweel(word, n) {
    // stretch a word with kashida after the first joining letter that has a joining successor
    if (!n) return word;
    const g = graphemes(word);
    for (let i = 0; i < g.length - 1; i++) {
      if (joinsLeft(g[i]) && isArabic(g[i + 1][0])) { g[i] += 'ـ'.repeat(n); break; }
    }
    return g.join('');
  }

  // segments: string | [{text, style}] ; unit: letter | word | line | none
  function buildUnits(container, segments, unit) {
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
      line.forEach((seg, si) => {
        const words = seg.text.split(/(\s+)/);
        for (const w of words) {
          if (!w) continue;
          if (/^\s+$/.test(w)) { lineEl.appendChild(document.createTextNode(' ')); continue; }
          const wEl = document.createElement('span');
          wEl.className = 'mg-word';
          if (seg.style) applyTextStyle(wEl, seg.style);
          if (seg.className) wEl.classList.add(seg.className);
          lineEl.appendChild(wEl);
          if (unit === 'letter') {
            const g = graphemes(w);
            g.forEach((gr, gi) => {
              const l = document.createElement('span');
              l.className = 'mg-letter';
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

  function glowShadow(g) {
    if (!g) return '';
    const r = g.radiusPx ?? 20;
    const s = g.strength ?? 1;
    const layers = [`0 0 ${Math.round(r * 0.25)}px ${g.color}`, `0 0 ${Math.round(r * 0.6)}px ${g.color}`, `0 0 ${r}px ${g.color}`];
    if (s > 1) layers.push(`0 0 ${Math.round(r * 1.8)}px ${g.color}`);
    if (s > 1.6) layers.push(`0 0 ${Math.round(r * 3)}px ${g.color}`);
    return layers.join(', ');
  }

  function fontFor(role) {
    const f = (C.style.fonts || []).find((x) => x.role === role) || (C.style.fonts || [])[0] || {};
    return f;
  }

  function applyTextStyle(el, st = {}) {
    const f = st.fontRole ? fontFor(st.fontRole) : {};
    const fam = st.family || f.fontsource || f.family;
    if (fam) el.style.fontFamily = `'${famId(fam)}', 'noto-sans-arabic', sans-serif`;
    const weight = st.weight ?? f.weight;
    if (weight) el.style.fontWeight = weight;
    const size = st.sizePx ?? f.sizePx;
    if (size) el.style.fontSize = size + 'px';
    const lh = st.lineHeight ?? f.lineHeight;
    if (lh) el.style.lineHeight = lh;
    const ls = st.letterSpacing ?? f.letterSpacing;
    if (ls != null) el.style.letterSpacing = px(ls);
    const color = st.color ?? f.color;
    if (color) el.style.color = color;
    const fill = st.fill ?? f.fill;
    if (fill && (fill.gradient || typeof fill === 'string')) {
      el.style.backgroundImage = fill.gradient || fill;
      el.style.webkitBackgroundClip = 'text';
      el.style.backgroundClip = 'text';
      el.style.color = 'transparent';
      el.dataset.gradient = '1';
    }
    const glow = st.glow ?? f.effects?.glow;
    const shadow = st.shadow ?? f.effects?.shadow;
    const ts = [glowShadow(glow), shadow ? (typeof shadow === 'string' ? shadow : `${shadow.x || 0}px ${shadow.y || 4}px ${shadow.blurPx || 12}px ${shadow.color || 'rgba(0,0,0,.5)'}`) : ''].filter(Boolean).join(', ');
    if (ts) el.style.textShadow = ts;
    const stroke = st.stroke ?? f.effects?.stroke;
    if (stroke) el.style.webkitTextStroke = `${stroke.widthPx || 2}px ${stroke.color}`;
    if (st.opacity != null) el.style.opacity = st.opacity;
    if (st.css) Object.assign(el.style, st.css);
  }

  const famId = (s) => String(s).replace(/^@fontsource\//, '').toLowerCase().replace(/\s+/g, '-');

  function place(el, pos = {}) {
    const anchor = pos.anchor || 'center';
    el.style.position = 'absolute';
    el.style.left = (pos.xPct ?? 50) + '%';
    el.style.top = (pos.yPct ?? 50) + '%';
    if (pos.widthPct) el.style.width = pos.widthPct + '%';
    if (pos.maxWidthPct) el.style.maxWidth = pos.maxWidthPct + '%';
    const ax = anchor.includes('left') ? 0 : anchor.includes('right') ? -100 : -50;
    const ay = anchor.includes('top') ? 0 : anchor.includes('bottom') ? -100 : -50;
    gsap.set(el, { xPercent: ax, yPercent: ay });
    el.style.textAlign = pos.align || 'center';
  }

  // ---------- face lookup (for camera focus + face-relative placement) ----------
  function face(t) {
    const i = Math.max(0, Math.min(C.faces.length - 1, Math.round(t * FPS)));
    const f = C.faces[i] || { x: 0.4, y: 0.2, w: 0.2, h: 0.12 };
    return { x: f.x * W, y: f.y * H, w: f.w * W, h: f.h * H, cx: (f.x + f.w / 2) * W, cy: (f.y + f.h / 2) * H };
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
      o[k] = v && typeof v === 'object' && !Array.isArray(v) && a && typeof a[k] === 'object' ? deepMerge(a[k], v) : v;
    }
    return o;
  }

  function makeText(cue, tl, opts = {}) {
    const p = deepMerge(presetById(cue.preset), cue.override);
    const st = deepMerge(p.style || {}, cue.style);
    const pos = deepMerge(p.position || {}, cue.position);
    const unit = cue.unit || p.unit || 'word';
    const layerName = cue.layer || p.layer || 'front';
    const el = document.createElement('div');
    el.className = 'mg-text ' + (p.className || '') + ' ' + (cue.className || '');
    el.dir = cue.dir || p.dir || 'auto';
    applyTextStyle(el, st);
    place(el, pos);
    (opts.parent || layers[layerName === 'behindTalent' ? 'behind' : layerName] || layers.front).appendChild(el);
    let segments = cue.segments || cue.text || '';
    if (cue.words) segments = cue.words.map((w) => w.text).join(' ');
    if (cue.tatweel && typeof segments === 'string') segments = segments.split(' ').map((w) => tatweel(w, cue.tatweel)).join(' ');
    const units = buildUnits(el, segments, unit === 'none' ? 'word' : unit);
    const targets = unit === 'none' ? [el] : units;
    gsap.set(el, { autoAlpha: 0 });

    const pin = p.in || {};
    const fk = filterKeysOf(pin.from, pin.to);
    const inDur = ms(pin.durationMs, 0.4);
    const stagger = ms(pin.staggerMs, 0);
    tl.set(el, { autoAlpha: 1 }, 0);
    if (pin.from || pin.to) {
      if (cue.words) {
        cue.words.forEach((w, i) => {
          if (!targets[i]) return;
          tl.fromTo(targets[i], mapVars(pin.from, fk), { ...mapVars(pin.to || {}, fk), duration: inDur, ease: ease(pin.easing), immediateRender: true }, Math.max(0, w.t - cue.t));
        });
      } else {
        tl.fromTo(targets, mapVars(pin.from, fk), { ...mapVars(pin.to || {}, fk), duration: inDur, ease: ease(pin.easing), stagger: pin.staggerFrom ? { each: stagger, from: pin.staggerFrom } : stagger, immediateRender: true }, 0);
      }
    }
    // optional emphasis loop while held (e.g. glow breathing, slow push)
    const inEnd = cue.words ? Math.max(0, cue.words[cue.words.length - 1].t - cue.t) + inDur : inDur + stagger * Math.max(0, targets.length - 1);
    const hold = p.hold || {};
    if (hold.to) {
      const hk = filterKeysOf(hold.from, hold.to);
      const holdLen = cue.end != null ? Math.max(0.1, cue.end - cue.t - inEnd - ms(p.out?.durationMs, 0.3)) : ms(p.holdMs ?? cue.holdMs, 1.5);
      tl.fromTo(hold.target === 'units' ? targets : el, mapVars(hold.from || {}, hk), { ...mapVars(hold.to, hk), duration: holdLen, ease: ease(hold.easing || 'linear'), immediateRender: false }, inEnd);
    }
    // out
    const pout = p.out;
    let outStart;
    if (cue.end != null) outStart = Math.max(inEnd, cue.end - cue.t - (pout ? ms(pout.durationMs, 0.3) + ms(pout.staggerMs, 0) * Math.max(0, targets.length - 1) : 0));
    else outStart = inEnd + ms(cue.holdMs ?? p.holdMs, 1.5);
    if (pout && (pout.to || pout.from)) {
      const ok = filterKeysOf(pout.from, pout.to);
      const outTargets = pout.unit === 'none' ? [el] : targets;
      tl.to(outTargets, { ...mapVars(pout.to || {}, ok), duration: ms(pout.durationMs, 0.3), ease: ease(pout.easing || 'power2.in'), stagger: ms(pout.staggerMs, 0), immediateRender: false }, outStart);
      tl.set(el, { autoAlpha: 0 }, outStart + ms(pout.durationMs, 0.3) + ms(pout.staggerMs, 0) * Math.max(0, outTargets.length - 1));
    } else if (cue.end != null || cue.holdMs != null || p.holdMs != null) {
      tl.set(el, { autoAlpha: 0 }, outStart);
    }
    return { el, units, inEnd, outStart };
  }

  // ---------- camera ----------
  const camTargets = [$('plateWrap'), $('talentWrap')];
  gsap.set(camTargets, { transformOrigin: '50% 50%', scale: 1, x: 0, y: 0 });
  function cameraCue(cue, tl) {
    const preset = (C.style.cameraMoves || []).find((m) => m.id === cue.preset) || {};
    const c = { ...preset, ...cue };
    const f = face(cue.t);
    let ox = W / 2, oy = H / 2;
    if ((c.focus || 'face') === 'face') { ox = f.cx; oy = f.cy; }
    else if (Array.isArray(c.focus)) { ox = c.focus[0] * W; oy = c.focus[1] * H; }
    const origin = `${ox}px ${oy}px`;
    const from = c.scaleFrom ?? null;
    const to = c.scaleTo ?? c.scale ?? 1;
    const dur = ms(c.durationMs, 0);
    if (from != null) tl.set(camTargets, { transformOrigin: origin, scale: from }, 0);
    else tl.set(camTargets, { transformOrigin: origin }, 0);
    if (dur > 0) tl.to(camTargets, { scale: to, x: c.x || 0, y: c.y || 0, rotation: c.rotate || 0, duration: dur, ease: ease(c.easing || 'power2.inOut'), immediateRender: false }, 0);
    else tl.set(camTargets, { scale: to, x: c.x || 0, y: c.y || 0, rotation: c.rotate || 0 }, 0);
    if (c.shake) {
      const r = rng(cue.t * 1000);
      const n = Math.round((c.shake.durationMs || 300) / 33);
      for (let k = 0; k < n; k++) tl.to(camTargets, { x: (r() - 0.5) * c.shake.px, y: (r() - 0.5) * c.shake.px, duration: 1 / FPS, ease: 'none' }, k / FPS);
      tl.to(camTargets, { x: 0, y: 0, duration: 1 / FPS }, n / FPS);
    }
  }

  // ---------- frame hooks (image sequences, particles, grain) ----------
  const frameHooks = [];
  const onFrame = (fn) => frameHooks.push(fn);
  const assetUrl = (p) => (/^(file|https?|data):/.test(p) ? p : C.assetBase + p.replace(/^\.?\//, ''));

  // ---------- fx overlays from style ----------
  function buildFx() {
    const g = C.style.grade || {};
    const css = g.css || [g.brightness != null && `brightness(${g.brightness})`, g.contrast != null && `contrast(${g.contrast})`, g.saturate != null && `saturate(${g.saturate})`, g.hueRotate != null && `hue-rotate(${g.hueRotate}deg)`].filter(Boolean).join(' ');
    if (css) { plateCanvas.style.filter = css; talentCanvas.style.filter = css; }
    const ov = C.style.overlays || {};
    if (ov.tint) {
      const d = document.createElement('div');
      Object.assign(d.style, { position: 'absolute', inset: 0, background: ov.tint.color, mixBlendMode: ov.tint.blend || 'soft-light', opacity: ov.tint.opacity ?? 0.3 });
      layers.fx.appendChild(d);
    }
    if (ov.vignette) {
      const v = ov.vignette;
      const d = document.createElement('div');
      Object.assign(d.style, { position: 'absolute', inset: 0, background: `radial-gradient(ellipse ${v.shape || '75% 60%'} at 50% ${v.centerYPct ?? 45}%, transparent ${v.innerPct ?? 55}%, ${v.color || 'rgba(0,0,0,0.65)'} 100%)`, opacity: v.strength ?? 1 });
      layers.fx.appendChild(d);
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

  // ---------- build the master timeline ----------
  const master = gsap.timeline({ paused: true });
  window.MG = window.MG || {};
  const registry = (window.MG.components = window.MG.components || {});
  const ctxBase = { W, H, FPS, style: C.style, layers, makeText, mapVars, filterKeysOf, ease, rng, face, onFrame, assetUrl, tatweel, applyTextStyle, place, gsap, ms };
  window.MG.ctx = ctxBase;

  function build() {
    buildFx();
    const cues = [...(C.scene.cues || [])].sort((a, b) => a.t - b.t);
    for (const cue of cues) {
      const tl = gsap.timeline();
      try {
        if (cue.type === 'text') makeText(cue, tl);
        else if (cue.type === 'camera') cameraCue(cue, tl);
        else if (cue.type === 'component' || cue.type === 'background' || cue.type === 'image') {
          const id = cue.component || cue.id || (cue.type === 'background' ? 'bg-replace' : cue.type);
          const fn = registry[id];
          if (!fn) { console.warn('missing component', id); continue; }
          fn({ ...ctxBase, cue, tl, layer: (n) => layers[n === 'behindTalent' ? 'behind' : n] || layers.front });
        } else continue;
      } catch (e) {
        console.error('cue failed', JSON.stringify(cue), e.stack || e);
        continue;
      }
      master.add(tl, cue.t);
    }
    // persistent style-level components (e.g. animated backdrop), registered by components.js
    for (const p of C.style.persistent || []) {
      const fn = registry[p.component];
      if (!fn) continue;
      const tl = gsap.timeline();
      fn({ ...ctxBase, cue: { t: p.t || 0, ...p }, tl, layer: (n) => layers[n] || layers.bg });
      master.add(tl, p.t || 0);
    }
  }

  // gradient text inside split units: give every unit the gradient of the whole line
  function fixSplitGradients() {
    document.querySelectorAll('.mg-text').forEach((el) => {
      if (!el.dataset.gradient) return;
      const box = el.getBoundingClientRect();
      el.querySelectorAll('.mg-letter, .mg-word').forEach((u) => {
        const r = u.getBoundingClientRect();
        u.style.backgroundImage = el.style.backgroundImage;
        u.style.backgroundSize = `${box.width}px ${box.height}px`;
        u.style.backgroundPosition = `${box.left - r.left}px ${box.top - r.top}px`;
        u.style.webkitBackgroundClip = 'text';
        u.style.backgroundClip = 'text';
        u.style.color = 'transparent';
      });
    });
  }

  // ---------- per-frame entry point used by render.mjs ----------
  const frameImg = new Image();
  const matteImg = new Image();
  const pad = (i) => String(i).padStart(5, '0');
  let initP = null;

  async function loadImg(img, url) {
    img.src = url;
    await img.decode();
  }

  window.mgInit = () => {
    initP = initP || (async () => {
      // make sure every font face used by the style is loaded before layout-dependent work
      await Promise.all((C.style.fonts || []).map((f) => document.fonts.load(`${f.weight || 400} 40px '${famId(f.fontsource || f.family)}'`, 'ابت abc').catch(() => null)));
      build();
      await document.fonts.ready;
      fixSplitGradients();
      return master.duration();
    })();
    return initP;
  };

  window.renderFrame = async (i) => {
    await window.mgInit();
    const t = i / FPS;
    const fi = Math.min(i, C.meta.frames - 1);
    await loadImg(frameImg, `${C.plateUrl}frames/${pad(fi)}.jpg`);
    pctx.drawImage(frameImg, 0, 0, W, H);
    if (C.meta.matte) {
      await loadImg(matteImg, `${C.plateUrl}matte/${pad(fi)}.png`);
      tctx.globalCompositeOperation = 'copy';
      tctx.drawImage(matteImg, 0, 0, W, H);
      tctx.globalCompositeOperation = 'source-in';
      tctx.drawImage(frameImg, 0, 0, W, H);
      tctx.globalCompositeOperation = 'source-over';
    }
    for (const fn of frameHooks) await fn(t, i);
    master.time(t, false);
    return true;
  };

})();
