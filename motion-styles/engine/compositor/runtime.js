/* Motion-styles compositor runtime.
 *
 * Deterministic: everything is driven by one paused GSAP timeline that render.mjs seeks frame by frame.
 *
 * Layer stack (bottom → top):
 *   #plateWrap  canvas: source frame — camera, grade and overlays (vignette/tint) are drawn INTO it
 *   #bg / #bgW            background replacements, backdrop graphics
 *   #behind / #behindW    graphics the presenter occludes
 *   #talentWrap canvas: presenter cut-out = graded plate × camera-transformed person matte
 *   #front / #frontW      graphics over the presenter
 *   #fx                   flashes / light leaks (screen space, above everything)
 * Layers ending in W are "world-locked": they receive the camera transform (preset/cue `worldLock: true`),
 * so text parented to a pull-back shrinks and drops with the footage. The others are screen-locked.
 * The grade (style.grade.css) and style.overlays are applied to footage only — graphics are never graded.
 *
 * Config arrives as window.__MG__ = { meta, faces, style, scene, plateUrl, assetBase, styleBase }.
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
  const layers = { bg: $('bg'), behind: $('behind'), front: $('front'), fx: $('fx'), bgW: $('bgW'), behindW: $('behindW'), frontW: $('frontW') };
  const worldLayers = [layers.bgW, layers.behindW, layers.frontW];
  function layerFor(name, worldLock) {
    let n = name === 'behindTalent' ? 'behind' : name || 'front';
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

  // ---------- Arabic-safe text splitting ----------
  // Letters that never connect to the following letter.
  const NON_JOIN_LEFT = new Set(['ا', 'أ', 'إ', 'آ', 'ٱ', 'د', 'ذ', 'ر', 'ز', 'و', 'ؤ', 'ة', 'ء']);
  const isArabic = (c) => /[؀-ۿݐ-ݿࢠ-ࣿ]/.test(c);
  const isMark = (c) => /[ً-ٰٟۖ-ۭ]/.test(c);
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

  // insert n tatweels after letter `at` (or the first joinable letter) of a word
  function tatweel(word, n, at) {
    if (!n) return word;
    const g = graphemes(word);
    const ok = (i) => i < g.length - 1 && joinsLeft(g[i]) && isArabic(g[i + 1][0]);
    let i = at != null && ok(at) ? at : g.findIndex((_, k) => ok(k));
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

  // glow layers scale with the animatable CSS variable --glow-k (style presets tween `glowStrength`)
  function glowShadow(g) {
    if (!g || !g.color) return '';
    const r = g.radiusPx ?? 20;
    const s = g.strength ?? 1;
    const c = `rgb(from ${g.color} r g b / calc(alpha * var(--glow-k, 1)))`;
    const out = [`0 0 ${Math.round(r * 0.25)}px ${c}`, `0 0 ${Math.round(r * 0.6)}px ${c}`, `0 0 ${r}px ${c}`];
    if (s > 1) out.push(`0 0 ${Math.round(r * 1.8)}px ${c}`);
    if (s > 1.6) out.push(`0 0 ${Math.round(r * 3)}px ${c}`);
    return out.join(', ');
  }

  function extrusionShadow(e) {
    if (!e || e.css) return '';
    const n = Math.max(1, Math.round(e.depthPx ?? 8));
    const ox = e.offsetX ?? n * 0.6;
    const oy = e.offsetY ?? n;
    const out = [];
    for (let i = 1; i <= n; i++) out.push(`${((ox * i) / n).toFixed(1)}px ${((oy * i) / n).toFixed(1)}px 0 ${e.color || e.sideColor || '#000'}`);
    return out.join(', ');
  }

  function fontFor(role) {
    return (C.style.fonts || []).find((x) => x.role === role) || (C.style.fonts || [])[0] || {};
  }

  const famId = (s) => String(s).replace(/^@fontsource\//, '').toLowerCase().replace(/\s+/g, '-');

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
    if (fill && (fill.gradient || typeof fill === 'string') && st.color == null) {
      el.style.backgroundImage = fill.gradient || fill;
      el.style.webkitBackgroundClip = 'text';
      el.style.backgroundClip = 'text';
      el.style.color = 'transparent';
      el.dataset.gradient = '1';
    }
    const glow = st.glow !== undefined ? st.glow : fx.glow;
    const shadow = st.shadow !== undefined ? st.shadow : fx.shadow;
    const ts = [
      extrusionShadow(fx.extrusion),
      glowShadow(fx.glowTight),
      glowShadow(glow),
      fx.neonRim ? glowShadow({ color: fx.neonRim.color, radiusPx: fx.neonRim.glowPx ?? 9 }) : '',
      shadow ? (typeof shadow === 'string' ? shadow : `${shadow.x ?? shadow.offsetX ?? 0}px ${shadow.y ?? shadow.offsetY ?? 4}px ${shadow.blurPx ?? 12}px ${shadow.color || 'rgba(0,0,0,.5)'}`) : '',
    ].filter(Boolean).join(', ');
    if (ts) el.style.textShadow = ts;
    const wrapperFilter = [fx.extrusion?.css, fx.bevel?.implementation && fx.bevel.highlight ? `drop-shadow(0 -1px 0 ${fx.bevel.highlight}) drop-shadow(0 2px 2px ${fx.bevel.shadow || 'rgba(0,0,0,.35)'})` : ''].filter(Boolean).join(' ');
    if (wrapperFilter) el.dataset.wrapperFilter = wrapperFilter;
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
      o[k] = v && typeof v === 'object' && !Array.isArray(v) && a && typeof a[k] === 'object' && a[k] ? deepMerge(a[k], v) : v;
    }
    return o;
  }

  const postLayout = [];

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

  function makeText(cue, tl, opts = {}) {
    const p = deepMerge(presetById(cue.preset), cue.override);
    const st = deepMerge(p.style || {}, cue.style);
    const pos = deepMerge(p.position || {}, cue.position);
    const unit = cue.unit || p.unit || 'word';
    const worldLock = cue.worldLock ?? p.worldLock ?? false;
    const el = document.createElement('div');
    el.className = 'mg-text ' + (p.className || '') + ' ' + (cue.className || '');
    el.dir = cue.dir || p.dir || 'auto';
    applyTextStyle(el, st);
    place(el, pos);
    if (el.dataset.scaleX) gsap.set(el, { scaleX: Number(el.dataset.scaleX) });
    let host = el;
    if (el.dataset.wrapperFilter) {
      // filter-chain effects (bevel, drop-shadow extrusion) live on a wrapper so unit filters don't fight them
      host = document.createElement('div');
      host.style.position = 'absolute';
      host.style.inset = '0';
      host.style.filter = el.dataset.wrapperFilter;
      host.appendChild(el);
    }
    (opts.parent || layerFor(cue.layer || p.layer || 'front', worldLock)).appendChild(host);
    let segments = cue.segments || cue.text || '';
    if (cue.words) segments = cue.words.map((w) => w.text).join(' ');
    if (cue.tatweel && typeof segments === 'string') segments = segments.split(' ').map((w) => tatweel(w, cue.tatweel)).join(' ');
    else if (p.kashida && cue.kashida !== false && typeof segments === 'string') segments = applyKashida(segments, cue.kashida || p.kashida);
    const units = buildUnits(el, segments, unit === 'none' ? 'word' : unit);
    const targets = unit === 'none' ? [el] : units;
    gsap.set(el, { autoAlpha: 0 });

    const pin = deepMerge(p.in || {}, cue.in);
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

    const tracks = Array.isArray(pin.tracks) ? pin.tracks : [];
    const trackProps = new Set(tracks.map((t) => t.prop));
    const baseFrom = { ...(pin.from || {}) };
    const baseTo = { ...(pin.to || {}) };
    for (const k of trackProps) { delete baseFrom[k]; delete baseTo[k]; }
    // tracks for filter props are merged into one filter tween (they share the CSS `filter` property)
    const filterTracks = tracks.filter((t) => FILTER_KEYS.includes(t.prop));
    const otherTracks = tracks.filter((t) => !FILTER_KEYS.includes(t.prop));
    const tweenUnits = (from, to, dur, easing, at0 = 0) => {
      const fk = filterKeysOf(from, to);
      if (!Object.keys(from).length && !Object.keys(to).length) return;
      if (cue.words) {
        cue.words.forEach((w, i) => {
          if (!targets[i]) return;
          tl.fromTo(targets[i], mapVars(from, fk), { ...mapVars(to, fk), duration: dur, ease: ease(easing), immediateRender: true }, at0 + startOf(i));
        });
      } else {
        tl.fromTo(targets, mapVars(from, fk), { ...mapVars(to, fk), duration: dur, ease: ease(easing), stagger: pin.staggerFrom ? { each: stagger, from: pin.staggerFrom } : stagger, immediateRender: true }, at0);
      }
    };
    let inEnd = 0;
    if (Array.isArray(pin.keyframes) && pin.keyframes.length && pin.keyframes[0].steps == null) {
      inEnd = keyframeTweens(tl, targets, pin.keyframes, 0, stagger);
      if (Object.keys(baseFrom).length || Object.keys(baseTo).length) tweenUnits(baseFrom, baseTo, inDur, pin.easing);
    } else if (Array.isArray(pin.keyframes) && pin.keyframes.length) {
      // grouped keyframes: [{unit: 'first'|'last'|'all'|'rest', steps:[...]}]
      for (const g of pin.keyframes) {
        const sel = String(g.unit || 'all');
        const tg = sel.startsWith('first') ? targets.slice(0, 1) : sel.startsWith('last') ? targets.slice(-1) : sel.startsWith('rest') ? targets.slice(1) : targets;
        const idx0 = targets.indexOf(tg[0]);
        inEnd = Math.max(inEnd, keyframeTweens(tl, tg, g.steps, startOf(Math.max(0, idx0)), stagger));
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

    if (hasOut) {
      const ok = filterKeysOf(pout.from, pout.to);
      const outTargets = pout.unit === 'none' ? [el] : targets;
      tl.to(outTargets, { ...mapVars(pout.to || {}, ok), duration: outDur, ease: ease(pout.easing || 'power2.in'), stagger: pout.staggerFrom ? { each: ms(pout.staggerMs, 0), from: pout.staggerFrom } : ms(pout.staggerMs, 0), immediateRender: false }, outStart);
      tl.set(el, { autoAlpha: 0, immediateRender: false }, outStart + outSpan);
    } else if (cue.end != null || cue.holdMs != null || p.holdMs != null) {
      tl.set(el, { autoAlpha: 0, immediateRender: false }, outStart);
    }
    return { el, units, inEnd, outStart };
  }

  // ---------- camera: a GSAP-driven proxy, drawn into the canvases ----------
  const cam = { scale: 1, x: 0, y: 0, rotation: 0, ox: W / 2, oy: H / 2, blur: 0 };
  function camMatrix(s = cam) {
    // translate(x,y) · translate(o) · rotate · scale · translate(-o)
    const r = (s.rotation * Math.PI) / 180;
    const a = Math.cos(r) * s.scale;
    const b = Math.sin(r) * s.scale;
    return [a, b, -b, a, s.ox + s.x - a * s.ox + b * s.oy, s.oy + s.y - b * s.ox - a * s.oy];
  }
  function cameraCue(cue, tl) {
    const preset = (C.style.cameraMoves || []).find((m) => m.id === cue.preset) || {};
    const c = { ...preset, ...cue };
    if (c.type === 'static') return;
    const f = face(cue.t);
    let ox = W / 2, oy = H / 2;
    const focus = c.focus ?? 'face';
    if (focus === 'face') { ox = f.cx; oy = f.cy; }
    else if (Array.isArray(focus)) { ox = focus[0] * (focus[0] > 1 ? 1 : W); oy = focus[1] * (focus[1] > 1 ? 1 : H); }
    if (c.focusPx) { ox = c.focusPx[0]; oy = c.focusPx[1]; }
    const d0 = ms(c.delayMs, 0);
    cam.motionBlur = c.motionBlur;
    if (c.type === 'handheld') {
      const amp = c.amplitudePx ?? 8;
      const period = ms(c.durationMs, 1.5);
      const span = cue.end != null ? cue.end - cue.t : 6;
      const r = rng(Math.round(cue.t * 1000) + 7);
      for (let k = 0, at = 0; at < span; k++, at += period / 2) {
        tl.to(cam, { x: (r() - 0.5) * 2 * amp, y: (r() - 0.5) * 2 * amp, duration: period / 2, ease: 'sine.inOut', immediateRender: false }, at);
      }
      tl.to(cam, { x: 0, y: 0, duration: 0.2, immediateRender: false }, span);
      return;
    }
    if (Array.isArray(c.keyframes) && c.keyframes.length) {
      const k0 = c.keyframes[0];
      tl.set(cam, { ox, oy, scale: k0.scale ?? 1, x: k0.x ?? 0, y: k0.y ?? 0, rotation: k0.rotate ?? 0, immediateRender: false }, 0);
      for (let k = 1; k < c.keyframes.length; k++) {
        const a = c.keyframes[k - 1];
        const b = c.keyframes[k];
        const dur = Math.max(1 / FPS / 4, ((b.tMs ?? 0) - (a.tMs ?? 0)) / 1000);
        tl.to(cam, { scale: b.scale ?? a.scale ?? 1, x: b.x ?? 0, y: b.y ?? 0, rotation: b.rotate ?? 0, duration: dur, ease: ease(b.easing || 'linear'), immediateRender: false }, d0 + (a.tMs ?? 0) / 1000);
      }
      return;
    }
    const from = c.scaleFrom ?? null;
    const to = c.scaleTo ?? c.scale ?? 1;
    const dur = ms(c.durationMs, 0);
    tl.set(cam, { ox, oy, ...(from != null ? { scale: from } : {}), immediateRender: false }, 0);
    if (dur > 0) tl.to(cam, { scale: to, x: c.x || 0, y: c.y || 0, rotation: c.rotate || 0, duration: dur, ease: ease(c.easing || 'power2.inOut'), immediateRender: false }, d0);
    else tl.set(cam, { scale: to, x: c.x || 0, y: c.y || 0, rotation: c.rotate || 0, immediateRender: false }, d0);
    if (c.shake) {
      const r = rng(cue.t * 1000);
      const n = Math.round((c.shake.durationMs || 300) / (1000 / FPS));
      for (let k = 0; k < n; k++) tl.to(cam, { x: (r() - 0.5) * c.shake.px, y: (r() - 0.5) * c.shake.px, duration: 1 / FPS, ease: 'none', immediateRender: false }, d0 + k / FPS);
      tl.to(cam, { x: 0, y: 0, duration: 1 / FPS, immediateRender: false }, d0 + n / FPS);
    }
  }

  // ---------- frame hooks (image sequences, particles, grain) ----------
  const frameHooks = [];
  const onFrame = (fn) => frameHooks.push(fn);
  const assetUrl = (p) => (/^(file|https?|data):/.test(p) ? p : C.assetBase + p.replace(/^\.?\//, ''));

  // ---------- footage grade + overlays (drawn into the plate canvas, never over graphics) ----------
  const overlayImgs = [];
  let gradeCss = 'none';
  function cssImage(background) {
    // rasterise any CSS background (gradients incl. elliptical radial) through SVG foreignObject
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${W}px;height:${H}px;background:${background.replace(/"/g, "'")}"></div></foreignObject></svg>`;
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    return img;
  }
  async function buildGrade() {
    const g = C.style.grade || {};
    gradeCss = g.css || [g.brightness != null && `brightness(${g.brightness})`, g.contrast != null && `contrast(${g.contrast})`, g.saturate != null && `saturate(${g.saturate})`, g.hueRotate != null && `hue-rotate(${g.hueRotate}deg)`].filter(Boolean).join(' ') || 'none';
    if (C.scene.grade === false) gradeCss = 'none';
    const ov = C.scene.overlays === false ? {} : { ...(C.style.overlays || {}), ...(C.scene.overlays || {}) };
    const add = async (background, blend, opacity) => {
      const img = cssImage(background);
      await img.decode();
      overlayImgs.push({ img, blend: blend || 'source-over', opacity: opacity ?? 1 });
    };
    if (ov.tint && ov.tint.color) await add(ov.tint.color, ov.tint.blend === 'normal' ? 'source-over' : ov.tint.blend || 'soft-light', ov.tint.opacity ?? 0.3);
    if (ov.vignette) {
      const v = ov.vignette;
      await add(`radial-gradient(ellipse ${v.shape || '75% 60%'} at ${v.centerXPct ?? 50}% ${v.centerYPct ?? 45}%, transparent ${v.innerPct ?? 55}%, ${v.color || 'rgba(0,0,0,0.65)'} 100%)`, 'source-over', v.strength ?? 1);
    }
    if (ov.bottomFade && ov.bottomFade.gradient) await add(ov.bottomFade.gradient, 'source-over', 1);
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
  // camera tweens live on their own timeline so motion-blur sub-samples never seek the graphics backwards
  const camMaster = gsap.timeline({ paused: true });
  window.MG = window.MG || {};
  const registry = (window.MG.components = window.MG.components || {});
  const ctxBase = { W, H, FPS, style: C.style, scene: C.scene, layers, cam, camMaster, makeText, mapVars, filterKeysOf, ease, rng, face, onFrame, assetUrl, tatweel, applyKashida, graphemes, applyTextStyle, place, gsap, ms, keyframeTweens, postLayout };
  window.MG.ctx = ctxBase;

  function build() {
    const cues = [...(C.scene.cues || [])].sort((a, b) => a.t - b.t);
    // persistent style-level components (e.g. sunburst halo), registered by components.js
    const persistent = C.scene.persistent === false ? [] : [...(C.style.persistent || []), ...(C.scene.persistent || [])];
    for (const p of persistent) {
      const fn = registry[p.component];
      if (!fn) { console.warn('missing persistent component', p.component); continue; }
      const tl = gsap.timeline();
      const cue = { t: p.t || 0, ...p };
      fn({ ...ctxBase, cue, tl, layer: (n) => layerFor(n || p.layer || 'bg', cue.worldLock) });
      master.add(tl, cue.t);
    }
    for (const cue of cues) {
      const tl = gsap.timeline();
      try {
        if (cue.type === 'text') makeText(cue, tl);
        else if (cue.type === 'camera') { cameraCue(cue, tl); camMaster.add(tl, cue.t); continue; }
        else if (cue.type === 'component' || cue.type === 'background' || cue.type === 'image' || cue.type === 'sequence') {
          const id = cue.component || cue.id || (cue.type === 'background' ? 'bg-replace' : cue.type);
          const fn = registry[id];
          if (!fn) { console.warn('missing component', id); continue; }
          const spec = (C.style.graphicComponents || []).find((g) => g.id === id) || {};
          fn({ ...ctxBase, cue, spec, tl, layer: (n) => layerFor(n || cue.layer || spec.layer, cue.worldLock ?? spec.worldLock) });
        } else continue;
      } catch (e) {
        console.error('cue failed', JSON.stringify(cue).slice(0, 200), e.stack || e);
        continue;
      }
      master.add(tl, cue.t);
    }
  }

  // gradient text inside split units: give every unit the gradient of the whole element (screen-space band)
  function fixSplitGradients() {
    document.querySelectorAll('.mg-text').forEach((el) => {
      if (!el.dataset.gradient) return;
      const prev = el.style.visibility;
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
      el.style.visibility = prev;
    });
  }

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
    // motion blur: average a few sub-frame camera states when the camera moves fast
    camMaster.time(Math.max(0, t - 0.5 / FPS), false);
    const prev = { ...cam };
    camMaster.time(t, false);
    const now = { ...cam };
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
      await buildGrade();
      build();
      await document.fonts.ready;
      fixSplitGradients();
      for (const fn of postLayout) fn();
      return Math.max(master.duration(), camMaster.duration());
    })();
    return initP;
  };

  window.renderFrame = async (i) => {
    await window.mgInit();
    const t = i / FPS;
    const fi = Math.min(i, C.meta.frames - 1);
    await loadImg(frameImg, `${C.plateUrl}frames/${pad(fi)}.jpg`);
    if (C.meta.matte) await loadImg(matteImg, `${C.plateUrl}matte/${pad(fi)}.png`);
    master.time(t, false);
    const samples = camSamples(t); // leaves the camera at time t

    // plate: camera → grade → overlays (screen space)
    pctx.globalAlpha = 1;
    pctx.fillStyle = C.scene.voidColor || C.style.voidColor || '#000';
    pctx.fillRect(0, 0, W, H);
    samples.forEach((s, k) => {
      pctx.globalAlpha = 1 / (k + 1);
      drawFootage(pctx, frameImg, camMatrix(s), gradeCss);
    });
    pctx.globalAlpha = 1;
    for (const o of overlayImgs) {
      pctx.globalCompositeOperation = o.blend;
      pctx.globalAlpha = o.opacity;
      pctx.drawImage(o.img, 0, 0, W, H);
    }
    pctx.globalCompositeOperation = 'source-over';
    pctx.globalAlpha = 1;

    // talent: camera-transformed matte, filled with the graded plate
    if (C.meta.matte) {
      tctx.clearRect(0, 0, W, H);
      samples.forEach((s, k) => {
        tctx.globalAlpha = 1 / (k + 1);
        drawFootage(tctx, matteImg, camMatrix(s), 'none');
      });
      tctx.globalAlpha = 1;
      tctx.globalCompositeOperation = 'source-in';
      tctx.drawImage(plateCanvas, 0, 0);
      tctx.globalCompositeOperation = 'source-over';
    }

    // world-locked layers follow the camera
    const m = camMatrix(cam);
    const css = `matrix(${m.map((v) => v.toFixed(5)).join(',')})`;
    for (const L of worldLayers) { L.style.transformOrigin = '0 0'; L.style.transform = css; }

    for (const fn of frameHooks) await fn(t, i);
    return true;
  };
})();
