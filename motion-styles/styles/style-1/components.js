/* Style 1 "Ember Glass" — style components for the motion-styles engine.
 *
 * Loaded by render.mjs after compositor/components-shared.js and before compositor/runtime.js.
 * Registers every id of style.json "graphicComponents" + "persistent", plus a few style helpers:
 *
 *   graphicComponents  glass-ring-pop, nametag-capsule, echo-capsule, cta-button, glass-pill-clear,
 *                      smoked-pill-autosize, lens-disc-slide, lens-ring-pair, glass-bead-capsule,
 *                      badge-ribbon, glass-molecule, foreground-flask-fog, clay-ui-card, hud-panels
 *   persistent         ember-text-fx   (Arabic reflow/settle via margins, shared gold band, chrome rim +
 *                                       bloom, gradient-safe glows, feathered reverse wipe)
 *   helpers            ember-backdrop  (orange studio cyc / procedural lab world plates, world-locked)
 *                      bw-focus-interrupt (the B&W focus-pull pattern interrupt)
 *                      ember-composite (moves the screen-locked layers with the camera: plate wobble,
 *                                       pre-cut pull-back — "whole composite incl. captions")
 *                      ember-talent    (warm shift / edge choke for footage shot on a cool set)
 *
 * Determinism: no CSS animations/transitions, timers, Math.random or Date. Everything is either a GSAP
 * tween on ctx.tl (time 0 = cue.t) or an ctx.onFrame(t) hook that reads tweened proxy objects.
 * Glass = backdrop-filter (blur, or an SVG displacement/offset filter for the refractive lenses).
 * Never put opacity/filter on an ANCESTOR of a glass element (it becomes the backdrop root and the glass
 * stops seeing the talent) — wrappers here are shown/hidden with `visibility` only.
 *
 * Requires engine v2 (MG.engineFeatures.version 2): frame-exact cue starts (t + EPS seek, primed masters), hard
 * cut of every text at cue.end, cue lifecycle (display:none outside a cue), MG.onText, camera worldRest (set for
 * the whole style in style.json cameraDefaults). The v1 workarounds for these (ember-prime, the text hard cut and
 * wrapper display toggles in ember-text-fx, ember-backdrop cancelCam) were removed after frame-exact A/B renders.
 */
(() => {
  'use strict';
  window.MG = window.MG || {};
  const R = (window.MG.components = window.MG.components || {});
  const E = (window.MG.ember = window.MG.ember || {});
  const NS = 'http://www.w3.org/2000/svg';
  let uidN = 0;
  const uid = (p) => `emb-${p}-${++uidN}`;

  // ------------------------------------------------------------------ small helpers
  function div(css, parent, cls) {
    const d = document.createElement('div');
    d.style.position = 'absolute';
    if (css) for (const [k, v] of Object.entries(css)) {
      if (k.startsWith('-') || k.includes('-')) d.style.setProperty(k, v);
      else d.style[k] = v;
    }
    if (cls) d.className = cls;
    if (parent) parent.appendChild(d);
    return d;
  }
  function svg(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (parent) parent.appendChild(e);
    return e;
  }
  const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
  function deepMerge(a, b) {
    if (!b) return a;
    const o = Array.isArray(a) ? [...a] : { ...a };
    for (const [k, v] of Object.entries(b)) o[k] = isObj(v) && isObj(a && a[k]) ? deepMerge(a[k], v) : v;
    return o;
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sc = (ctx) => ctx.W / 1080; // all style px are specified on a 1080-wide canvas
  const px = (n) => `${Math.round(n * 100) / 100}px`;
  function specFor(ctx, id) {
    if (ctx.spec && ctx.spec.id === id) return ctx.spec;
    return (ctx.style.graphicComponents || []).find((g) => g.id === id) || {};
  }
  function parseStroke(s, w, c) {
    if (!s) return { w, c };
    const m = String(s).match(/^\s*([\d.]+)px\s+(.+)$/);
    return m ? { w: Number(m[1]), c: m[2].trim() } : { w, c: s };
  }
  const endAt = (ctx) => (ctx.cue.end != null ? ctx.cue.end - ctx.cue.t : null);
  // a full-frame host div in a layer; shown with `visibility` (never opacity — see header)
  function host(ctx, layerName, from = 0) {
    const h = div({ left: '0px', top: '0px', width: '100%', height: '100%' });
    ctx.layer(layerName).appendChild(h);
    ctx.gsap.set(h, { visibility: 'hidden' });
    ctx.tl.set(h, { visibility: 'visible', immediateRender: false }, from);
    const e = endAt(ctx);
    if (e != null) ctx.tl.set(h, { visibility: 'hidden', immediateRender: false }, e);
    return h;
  }
  function easeOf(ctx, e, d = 'none') { return ctx.ease(e || d); }
  const sec = (msv, d = 0) => (msv == null ? d : msv / 1000);
  E.helpers = { div, svg, deepMerge, specFor, parseStroke, sc };

  // ------------------------------------------------------------------ shared filter / transform composers
  // Several writers (B&W interrupt, talent grade, composite lock) can touch the same DOM node's filter or
  // transform. Each writer owns a named part; parts are joined in insertion order.
  const filterParts = new Map();
  E.setFilter = (el, key, val) => {
    if (!el) return;
    let m = filterParts.get(el);
    if (!m) { m = {}; filterParts.set(el, m); }
    m[key] = val || '';
    el.style.filter = Object.values(m).filter(Boolean).join(' ');
  };
  const transformParts = new Map();
  E.setTransform = (el, key, val) => {
    if (!el) return;
    let m = transformParts.get(el);
    if (!m) { m = {}; transformParts.set(el, m); }
    m[key] = val || '';
    el.style.transformOrigin = '0 0';
    el.style.transform = Object.values(m).filter(Boolean).join(' ');
  };
  const byId = (id) => document.getElementById(id);

  // ------------------------------------------------------------------ SVG filter defs (lens refraction)
  let defsSvg = null;
  function defs() {
    if (defsSvg && defsSvg.isConnected) return defsSvg;
    defsSvg = svg('svg', { width: 0, height: 0, style: 'position:absolute;left:0;top:0;width:0;height:0;overflow:hidden' });
    document.body.appendChild(defsSvg);
    return defsSvg;
  }
  // displacement map for a magnifier: R = 1-u, G = 1-v (u,v in 0..1 over the filter box)
  let magUrl = null;
  let magReady = null;
  function magMap() {
    if (magUrl) return magUrl;
    const N = 256;
    const c = document.createElement('canvas');
    c.width = c.height = N;
    const g = c.getContext('2d');
    const im = g.createImageData(N, N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = (y * N + x) * 4;
      im.data[i] = Math.round((1 - x / (N - 1)) * 255);
      im.data[i + 1] = Math.round((1 - y / (N - 1)) * 255);
      im.data[i + 2] = 128;
      im.data[i + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    magUrl = c.toDataURL('image/png');
    const img = new Image();
    img.src = magUrl;
    magReady = img.decode().catch(() => null);
    return magUrl;
  }
  // magnifier filter: output(p) = blur(input(c + (p-c)/m)); call .update(w,h) whenever the box resizes
  function magnifierFilter(magnify, blurPx) {
    const id = uid('mag');
    const f = svg('filter', { id, x: 0, y: 0, width: 1, height: 1, 'color-interpolation-filters': 'sRGB', primitiveUnits: 'userSpaceOnUse' }, defs());
    const img = svg('feImage', { href: magMap(), x: 0, y: 0, width: 100, height: 100, preserveAspectRatio: 'none', result: 'map' }, f);
    const dm = svg('feDisplacementMap', { in: 'SourceGraphic', in2: 'map', scale: 0, xChannelSelector: 'R', yChannelSelector: 'G', result: 'd' }, f);
    const bl = svg('feGaussianBlur', { in: 'd', stdDeviation: blurPx || 0 }, f);
    let last = '';
    return {
      id,
      update(w, h, m = magnify, b = blurPx) {
        const key = `${w.toFixed(1)}|${h.toFixed(1)}|${m}|${b}`;
        if (key === last) return;
        last = key;
        img.setAttribute('width', w.toFixed(2));
        img.setAttribute('height', h.toFixed(2));
        // scale is per axis in SVG 1.1 (one value): use the mean extent
        dm.setAttribute('scale', ((1 - 1 / m) * (w + h) / 2).toFixed(2));
        bl.setAttribute('stdDeviation', String(b || 0));
      },
      ready: () => magReady,
    };
  }
  // offset + blur (+ dim) filter for the lens rings
  function offsetFilter(dx, dy, blurPx, dim = 1) {
    const id = uid('off');
    const f = svg('filter', { id, x: 0, y: 0, width: 1, height: 1, 'color-interpolation-filters': 'sRGB', primitiveUnits: 'userSpaceOnUse' }, defs());
    svg('feOffset', { in: 'SourceGraphic', dx, dy, result: 'o' }, f);
    svg('feGaussianBlur', { in: 'o', stdDeviation: blurPx, result: 'b' }, f);
    if (dim !== 1) svg('feColorMatrix', { in: 'b', type: 'matrix', values: `${dim} 0 0 0 ${(1 - dim) * 0.06} 0 ${dim} 0 0 ${(1 - dim) * 0.02} 0 0 ${dim} 0 0 0 0 0 1 0` }, f);
    return { id };
  }

  // ------------------------------------------------------------------ glass builders
  // stadium / disc of frosted glass with a 1.5 px specular rim that is brightest on top
  function glassBox(o, parent) {
    const el = div({ left: px(o.left ?? 0), top: px(o.top ?? 0), width: px(o.w), height: px(o.h), borderRadius: o.radius != null ? px(o.radius) : '9999px', background: o.fill || 'transparent', overflow: 'hidden' }, parent);
    if (o.blur) { el.style.backdropFilter = `blur(${o.blur}px)`; el.style.webkitBackdropFilter = `blur(${o.blur}px)`; }
    if (o.boxShadow) el.style.boxShadow = o.boxShadow;
    if (o.rimW) {
      const rim = div({ left: '0px', top: '0px', right: '0px', bottom: '0px', borderRadius: 'inherit', padding: px(o.rimW), boxSizing: 'border-box',
        background: `linear-gradient(${o.rimAngle ?? 180}deg, ${o.rimTop || o.rim} 0%, ${o.rim} 38%, ${o.rimBottom || o.rim} 100%)` }, el);
      rim.style.setProperty('-webkit-mask', 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)');
      rim.style.setProperty('-webkit-mask-composite', 'xor');
      rim.style.setProperty('mask-composite', 'exclude');
      el._rim = rim;
    }
    return el;
  }
  E.glassBox = glassBox;

  // round arrow button: dark disc + thin glass ring + lime/yellow ring + arrow (SVG)
  function ctaButton(ctx, variant = 'nametag', over = {}) {
    const spec = specFor(ctx, 'cta-button').build || {};
    const vv = (spec.variants || {})[variant] || {};
    const base = { ...spec };
    delete base.variants;
    const b = { ...base, ...vv, ...over };
    const k = sc(ctx);
    const disc = (b.discDiameterPx ?? 123) * k;
    const ringD = (b.ringDiameterPx ?? 84) * k;
    const rel = ringD / (84 * k);
    const glassD = (vv.glassRingDiameterPx ?? over.glassRingDiameterPx ?? ((b.discDiameterPx ?? 123) * 135 / 123)) * k;
    const S = glassD + 8 * k;
    const s = svg('svg', { width: S, height: S, viewBox: `${-S / 2} ${-S / 2} ${S} ${S}`, style: 'position:absolute;left:0;top:0;overflow:visible' });
    const gr = parseStroke(b.glassRingStroke, 1.5, 'rgba(255,255,255,0.35)');
    svg('circle', { r: glassD / 2, fill: 'none', stroke: b.glassRingColor || gr.c, 'stroke-width': gr.w * k, 'stroke-opacity': b.glassRingColor ? 0.85 : 1 }, s);
    const dr = parseStroke(b.discRim, 1.5, 'rgba(255,255,255,0.50)');
    svg('circle', { r: disc / 2, fill: b.discFill || '#1B1D21', 'fill-opacity': b.discOpacity ?? 0.85, stroke: dr.c, 'stroke-width': dr.w * k }, s);
    const ringStroke = (b.ringStrokePx ?? 4.5) * k * (variant === 'finalCta' ? Math.max(0.75, rel) : 1);
    svg('circle', { r: ringD / 2, fill: 'none', stroke: b.ringColor || '#DAD530', 'stroke-width': ringStroke }, s);
    const L = (b.arrowLengthPx ?? 39) * k * rel;
    const a = L / (2 * Math.SQRT2) * 1.25;
    const hd = L * 0.42;
    const ne = (b.arrow || '↖') === '↗';
    const d = ne
      ? `M${-a},${a} L${a},${-a} M${a - hd},${-a} L${a},${-a} L${a},${-a + hd}`
      : `M${a},${a} L${-a},${-a} M${-a + hd},${-a} L${-a},${-a} L${-a},${-a + hd}`;
    svg('path', { d, fill: 'none', stroke: b.arrowColor || b.ringColor || '#DAD530', 'stroke-width': (b.arrowStrokePx ?? 5) * k * (variant === 'finalCta' ? Math.max(0.7, rel) : 1), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s);
    const wrap = div({ width: px(S), height: px(S) });
    wrap.appendChild(s);
    wrap._size = S;
    wrap.place = (cx, cy) => { wrap.style.left = px(cx - S / 2); wrap.style.top = px(cy - S / 2); };
    return wrap;
  }
  E.ctaButton = ctaButton;

  // ------------------------------------------------------------------ text: build + Ember fixes
  // baseline of a text box's first line, in px from the box top (0-size inline-block marker on the baseline)
  function baselineIn(box) {
    const line = box.querySelector('.mg-line') || box;
    const mk = document.createElement('span');
    mk.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline;';
    line.appendChild(mk);
    const y = mk.getBoundingClientRect().top - box.getBoundingClientRect().top;
    mk.remove();
    return y;
  }
  const presetOf = (ctx, id) => (ctx.style.textPresets || []).find((p) => p.id === id) || {};
  const fontOf = (ctx, role) => (ctx.style.fonts || []).find((f) => f.role === role) || {};
  const emNum = (v) => (v == null ? null : typeof v === 'number' ? v / 16 : parseFloat(v));
  const hasArabic = (s) => /[؀-ۿ]/.test(s || '');

  // per-frame registries (one global frame hook)
  const bands = []; // gold screen-space gradient bands
  const frameFns = [];
  let frameHooked = false;
  function hookFrames(ctx) {
    if (frameHooked) return;
    frameHooked = true;
    ctx.onFrame((t, i) => { for (const fn of frameFns) fn(t, i); });
  }

  // Apply the Ember text treatments to one text element made by the runtime's makeText.
  //   tl/t0: timeline + offset at which the cue starts on that timeline
  E.textFx = function textFx(ctx, cue, el, tl, t0) {
    if (!el || el._emberFx) return;
    el._emberFx = true;
    hookFrames(ctx);
    const { gsap } = ctx;
    const k = sc(ctx);
    const p = deepMerge(presetOf(ctx, cue.preset), cue.override);
    const pin = deepMerge(p.in || {}, cue.in);
    const st = deepMerge(p.style || {}, cue.style);
    const unit = cue.unit || p.unit || 'word';
    const role = st.fontRole;
    const font = fontOf(ctx, role);
    const text = el.textContent;
    const rtl = (cue.dir || p.dir) === 'rtl' || hasArabic(text);
    const letters = [...el.querySelectorAll('.mg-letter')];
    const words = [...el.querySelectorAll('.mg-word')];
    const units = unit === 'letter' ? letters : unit === 'word' ? words : [el];

    // 1) Chromium ignores letter-spacing on cursive Arabic: drive the reflow/settle with margins instead
    if (unit === 'letter' && hasArabic(text) && pin.from && pin.from.letterSpacing != null && letters.length) {
      const side = rtl ? 'marginLeft' : 'marginRight';
      const fromEm = emNum(pin.from.letterSpacing);
      const toEm = emNum(pin.to && pin.to.letterSpacing != null ? pin.to.letterSpacing : 0);
      const stagger = sec(pin.staggerMs, 0);
      const dur = sec(pin.durationMs, 0.4);
      const each = pin.staggerFrom ? { each: stagger, from: pin.staggerFrom } : stagger;
      tl.fromTo(letters, { [side]: `${fromEm}em` }, { [side]: `${toEm}em`, duration: dur, ease: easeOf(ctx, pin.easing), stagger: each, immediateRender: true }, t0);
      const inEnd = stagger * (letters.length - 1) + dur;
      if (p.settle && p.settle.property === 'letterSpacing') {
        const s = p.settle;
        tl.fromTo(letters, { [side]: `${s.fromEm ?? toEm}em` }, { [side]: `${s.toEm ?? 0}em`, duration: sec(s.durationMs, 0.4), ease: easeOf(ctx, s.easing), immediateRender: false }, t0 + inEnd);
      } else if (p.hold && p.hold.to && p.hold.to.letterSpacing != null) {
        const holdMs = cue.holdMs ?? p.holdMs ?? 1500;
        const len = cue.end != null ? Math.max(0.1, cue.end - cue.t - inEnd) : holdMs / 1000;
        tl.fromTo(letters, { [side]: `${emNum(p.hold.from && p.hold.from.letterSpacing) ?? toEm}em` }, { [side]: `${emNum(p.hold.to.letterSpacing)}em`, duration: Math.min(len, 0.5), ease: easeOf(ctx, p.hold.easing, 'expo.out'), immediateRender: false }, t0 + inEnd);
      }
    }

    // 1a) joins of split solid letters: two anti-aliased edges meeting on one pixel leave a faint seam
    //     (visible as a dashed tatweel run on the glow-sweep). A 0.6 px stroke in the text colour
    //     (-webkit-text-stroke-color defaults to currentColor, so it follows the yellow -> white cool) makes
    //     neighbours overlap without changing the layout. Presets that animate tracking are dashed on purpose.
    const solidFill = !el.dataset.gradient;
    const joinStroke = unit === 'letter' && hasArabic(text) && solidFill && !(pin.from && pin.from.letterSpacing != null) ? 0.6 * k : 0;
    if (joinStroke) letters.forEach((l) => { l.style.webkitTextStrokeWidth = px(joinStroke); });

    // 1b) two-phase colour (glow-sweep "cool"): each unit LANDS in the preset's hot colour + halo (the IN only
    //     fades/unblurs it), then cools to the rest colour over cool.durationMs, starting when it lands
    //     (t0 + cool.delayMs + i*stagger). Reference f98-124: the hot band sweeps R->L through ب, the
    //     tatweels and س; each unit is yellow ~10 f, everything white by f124.
    const cool = cue.cool || p.cool;
    if (cool && cool.from && cool.to && units.length) {
      const fk = ctx.filterKeysOf(cool.from, cool.to);
      const stg = sec(cool.staggerMs ?? pin.staggerMs, 0);
      tl.fromTo(units, ctx.mapVars(cool.from, fk), { ...ctx.mapVars(cool.to, fk), duration: sec(cool.durationMs, 0.333), ease: easeOf(ctx, cool.easing), stagger: stg, immediateRender: true },
        t0 + sec(cool.delayMs, sec(pin.durationMs, 0.133)));
    }

    // 2) gradient fills: the element/word wrappers must not paint the gradient themselves (letters do)
    const gradient = !!el.dataset.gradient;
    const gradientCss = el.style.backgroundImage;
    if (gradient) {
      el.style.backgroundImage = 'none';
      if (unit === 'letter') words.forEach((w) => { w.style.backgroundImage = 'none'; });
    }

    // 3) glows on gradient text: text-shadow would paint OVER background-clip:text, so move it to a wrapper
    //    drop-shadow chain (it follows every glyph's opacity/blur automatically)
    let wrapper = null;
    const wrap = () => {
      if (wrapper) return wrapper;
      wrapper = div({ left: '0px', top: '0px', width: '100%', height: '100%' });
      el.parentNode.insertBefore(wrapper, el);
      wrapper.appendChild(el);
      return wrapper;
    };
    const isChrome = role === 'payoffChrome' || cue.preset === 'hero-glow-reveal';
    const isGold = role === 'hook' || cue.preset === 'ember-type' || cue.preset === 'ember-words';
    if (gradient && !isChrome) {
      const fx = { ...(font.effects || {}), ...(st.effects || {}) };
      const glow = st.glow !== undefined ? st.glow : fx.glow;
      const tight = fx.glowTight;
      if (glow || tight) {
        el.style.textShadow = 'none';
        const parts = [];
        // fonts[].effects.edgeSoftenPx: the hook glyph edges are soft in the reference (1-2 px ring +125 luma)
        if (fx.edgeSoftenPx) parts.push(`blur(${px(fx.edgeSoftenPx * k)})`);
        if (tight) parts.push(`drop-shadow(0 0 ${px(Math.max(1.5, tight.radiusPx * 0.45) * k)} ${tight.color})`);
        if (glow) {
          // The token is an ADDITIVE wide glow (STYLE.md 4.3: tight r 5 + wide r 45 at 15-30 %, additive).
          // Chained source-over drop-shadows lose most of it over a dark plate, so the wide glow is laid as
          // three falloff rings (near / mid / far) whose summed increments match the reference distance rings
          // (k_004/f75: +57/+42/+31/+12 luma at 1-2/4-6/11-15/28-40 px over the local haze).
          const gm = String(glow.color).match(/rgba?\(([^)]+)\)/);
          const gc = gm ? gm[1].split(',').map((s) => s.trim()) : null;
          const ga = gc ? Number(gc[3] ?? 1) : 1;
          const col = (a) => (gc ? `rgba(${gc[0]},${gc[1]},${gc[2]},${Math.min(1, a).toFixed(3)})` : glow.color);
          const gk = cue.glowGain ?? p.glowGain ?? (isGold ? 1.6 : 1);
          parts.push(`drop-shadow(0 0 ${px(glow.radiusPx * 0.13 * k)} ${col(ga * 1.3 * gk)})`);
          parts.push(`drop-shadow(0 0 ${px(glow.radiusPx * 0.36 * k)} ${col(ga * 1.1 * gk)})`);
          parts.push(`drop-shadow(0 0 ${px(glow.radiusPx * 0.9 * k)} ${col(ga * 0.9 * gk)})`);
        }
        E.setFilter(wrap(), 'glow', parts.join(' '));
      }
    }

    // 4) gold hook: one static screen-space gradient band shared by both hook lines (glyphs slide through it)
    if (gradient && isGold) {
      const bandPct = cue.gradientBand || p.gradientBand || [25.8, 79.0];
      bands.push({ el, units: units.length ? units : [el], x0: (bandPct[0] / 100) * ctx.W, x1: (bandPct[1] / 100) * ctx.W });
    }

    // 5) ice chrome: cyan rim (offset up) + near halo + delayed bloom on a wrapper filter
    if (isChrome) {
      el.style.textShadow = 'none';
      const fx = font.effects || {};
      const rim = fx.rimLight || { color: '#6AF3F7', widthPx: 4 };
      const halo = fx.haloNear || { color: '#356A6A', radiusPx: 12 };
      const glow = fx.glow || { color: 'rgba(63,232,240,0.45)', radiusPx: 75 };
      const w = wrap();
      const bloom = { k: p.glowBloom ? p.glowBloom.fromAlpha ?? 0 : 1 };
      const gm = String(glow.color).match(/rgba?\(([^)]+)\)/);
      const gc = gm ? gm[1].split(',').map((s) => s.trim()) : ['63', '232', '240', '0.45'];
      const ga = Number(gc[3] ?? 0.45);
      // Restraint: ref k_046/k_047 rings around «ممتازه» are barely tinted (#473729 at 4-8 px, #493122 at
      // 10-16 px over the cyc), so the near halo and bloom stay low; the rim carries the cyan.
      // inner rim: the reference's cyan rim sits ON the glyphs' upper edges (rows at 25 % of the ink read
      // #A2FCFA, ours #D6F2F5 with an outside-only rim). SVG: band = alpha AND NOT alpha shifted down by the rim
      // width -> flood #6AF3F7 -> soften -> over the fill.
      const rimId = uid('rim');
      const rf = svg('filter', { id: rimId, x: '-5%', y: '-10%', width: '110%', height: '120%', 'color-interpolation-filters': 'sRGB' }, defs());
      svg('feOffset', { in: 'SourceAlpha', dx: 0, dy: (rim.widthPx * k).toFixed(2), result: 'sh' }, rf);
      svg('feComposite', { in: 'SourceAlpha', in2: 'sh', operator: 'out', result: 'band' }, rf);
      svg('feGaussianBlur', { in: 'band', stdDeviation: (0.6 * k).toFixed(2), result: 'bandS' }, rf);
      svg('feFlood', { 'flood-color': rim.color, 'flood-opacity': rim.innerOpacity ?? 0.8, result: 'cy' }, rf);
      svg('feComposite', { in: 'cy', in2: 'bandS', operator: 'in', result: 'rimC' }, rf);
      svg('feComposite', { in: 'rimC', in2: 'SourceAlpha', operator: 'in', result: 'rimIn' }, rf);
      const mg = svg('feMerge', {}, rf);
      svg('feMergeNode', { in: 'SourceGraphic' }, mg);
      svg('feMergeNode', { in: 'rimIn' }, mg);
      const set = () => {
        const kk = bloom.k;
        E.setFilter(w, 'chrome', [
          `url(#${rimId})`,
          `drop-shadow(0 ${px(-rim.widthPx * 0.7 * k)} ${px(rim.widthPx * 0.25 * k)} ${rim.color})`,
          `drop-shadow(0 0 ${px(halo.radiusPx * 0.5 * k)} rgba(53,106,106,${(0.35 * kk).toFixed(3)}))`,
          `drop-shadow(0 0 ${px(glow.radiusPx * 0.32 * k)} rgba(${gc[0]},${gc[1]},${gc[2]},${(ga * 0.45 * kk).toFixed(3)}))`,
          `drop-shadow(0 0 ${px(glow.radiusPx * 0.8 * k)} rgba(${gc[0]},${gc[1]},${gc[2]},${(ga * 0.3 * kk).toFixed(3)}))`,
        ].join(' '));
      };
      set();
      if (p.glowBloom) {
        const g = p.glowBloom;
        tl.fromTo(bloom, { k: g.fromAlpha ?? 0 }, { k: g.toAlpha ?? 1, duration: sec(g.durationMs, 0.333), ease: easeOf(ctx, g.easing), immediateRender: true }, t0 + sec(g.delayMs, 0));
        frameFns.push(set);
      }
    }

    // 5b) ice-chrome gradient mapped onto the GLYPHS, not the line box: STYLE.md 4.3 gives the stops for a box
    //     where the alef top sits at 15.8 % and the baseline at 77.5 %. Plex's line box puts the baseline
    //     elsewhere, which pushed #A6D0D4 below the glyph middle (AD: pale #D3F0F3 down to 55 % of the glyph).
    //     Measure baseline + alef height and rewrite the stops in px for that box.
    let chromeFor = null;
    if (isChrome && gradient && gradientCss && gradientCss !== 'none') {
      const cs = getComputedStyle(el);
      const fontSize = parseFloat(cs.fontSize) || 234;
      const cv = document.createElement('canvas').getContext('2d');
      cv.font = `${cs.fontWeight} ${fontSize}px ${cs.fontFamily}`;
      const alefH = cv.measureText('ا').actualBoundingBoxAscent || fontSize * 0.72;
      const geo = p.chromeBox || { alefTopPct: 15.8, baselinePct: 77.5 };
      const Hg = alefH / ((geo.baselinePct - geo.alefTopPct) / 100);
      chromeFor = (box) => {
        const base = baselineIn(box);
        const Yg = base - (geo.baselinePct / 100) * Hg;
        return gradientCss.replace(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))\s+(-?[\d.]+)%/g, (m, c, pc) => `${c} ${(Yg + (Number(pc) / 100) * Hg).toFixed(1)}px`);
      };
      const g = chromeFor(el);
      letters.forEach((u) => { u.style.backgroundImage = g; });
    }

    // 5c) seam-free hold: split gradient letters each paint their own background-clip:text, so at every Arabic
    //     join two anti-aliased edges meet and the wrapper glow shows through as a 1 px seam (AD: cyan verticals
    //     in «ضحكتك», dark dips in the gold hook). Once the IN (and settle) has finished, swap the letters for an
    //     unsplit copy of the line: same font, same gradient (gold: same screen-space band; chrome: same glyph
    //     mapping), same wrapper filter, same box. Ligature/kerning features stay off so the shapes and widths
    //     match the split letters exactly (no pop on the swap frame).
    //     The same seam (background showing through) appears on solid white/yellow letters, e.g. the glow-sweep
    //     tatweel run, so every Arabic letter-split caption gets the swap once it is static.
    const pout = cue.out === null ? null : deepMerge(p.out || {}, cue.out);
    const animatedOut = !!(pout && (pout.to || pout.from));
    if (unit === 'letter' && letters.length && hasArabic(text) && cue.solidHold !== false && !p.drift) {
      const stg = sec(pin.staggerMs, 0);
      let ready = stg * (letters.length - 1) + sec(pin.durationMs, 0.4);
      if (p.settle && p.settle.property) ready += sec(p.settle.durationMs, 0.4);
      else if (p.hold && p.hold.to && p.hold.to.letterSpacing != null) ready += 0.5;
      if (cool) ready = Math.max(ready, stg * (letters.length - 1) + sec(cool.delayMs, 0.133) + sec(cool.durationMs, 0.333));
      if (cue.rise) ready = Math.max(ready, sec((p.optionalRise || {}).durationMs, 0.4));
      ready += 1 / ctx.FPS; // one clean frame of the settled split line first
      let endRel = cue.end != null ? cue.end - cue.t : null;
      if (animatedOut) {
        // reverse type-off etc. animate the letters: hand back to them before the out starts
        const outDur = sec(pout.durationMs, 0.3);
        const outSpan = outDur + sec(pout.staggerMs, 0) * Math.max(0, (pout.unit === 'none' ? 1 : letters.length) - 1);
        const inEnd = stg * (letters.length - 1) + sec(pin.durationMs, 0.4);
        endRel = endRel != null ? Math.max(inEnd, endRel - outSpan) : inEnd + sec(cue.holdMs ?? p.holdMs, 1.5);
      }
      if (endRel == null || ready < endRel - 0.05) {
        const solid = el.cloneNode(false);
        solid.className = `${el.className} emb-solid`;
        const line = document.createElement('span');
        line.className = 'mg-line';
        line.textContent = el.textContent.replace(/‍/g, '');
        solid.appendChild(line);
        Object.assign(solid.style, { fontFeatureSettings: '"liga" 0, "clig" 0, "dlig" 0, "kern" 0, "calt" 0', fontKerning: 'none' });
        el.parentNode.insertBefore(solid, el.nextSibling);
        gsap.set(solid, { autoAlpha: 0 });
        if (gradient && gradientCss && gradientCss !== 'none') {
          if (chromeFor) {
            solid.style.backgroundImage = chromeFor(solid);
            solid.style.backgroundSize = '100% 100%';
            solid.style.backgroundPosition = '0px 0px';
          } else solid.style.backgroundImage = gradientCss;
          solid.style.webkitBackgroundClip = 'text';
          solid.style.backgroundClip = 'text';
          solid.style.color = 'transparent';
          if (isGold) {
            const band = bands.find((b) => b.el === el);
            if (band) band.units.push(solid);
          }
        } else {
          // solid fill: the letters' final colour (e.g. after a cool) is the rest colour of the line
          const last = cool && cool.to && cool.to.color;
          if (last) solid.style.color = last;
          if (joinStroke) solid.style.webkitTextStrokeWidth = px(joinStroke);
        }
        // the split letters are hidden through their LINE spans (no other tween touches them); the runtime keeps
        // driving the element's own autoAlpha, so toggling that here would race it on jump seeks
        const lines = [...el.querySelectorAll('.mg-line')];
        tl.set(solid, { autoAlpha: 1, immediateRender: false }, t0 + ready);
        tl.set(lines, { opacity: 0, immediateRender: false }, t0 + ready);
        if (endRel != null) {
          tl.set(solid, { autoAlpha: 0, immediateRender: false }, t0 + endRel);
          if (animatedOut) tl.set(lines, { opacity: 1, immediateRender: false }, t0 + endRel);
        }
        // follow the element if anything moves it after the swap (rise, composite offsets on the element)
        frameFns.push(() => { if (solid.style.transform !== el.style.transform) solid.style.transform = el.style.transform; });
        el._emberSolid = solid;
      }
    }

    // 6) feathered reverse wipe (wipe-reveal-reverse): replace the hard clip-path with a soft mask edge
    const clipFrom = pin.from && (pin.from.clip || pin.from.clipPath);
    if (clipFrom && (pin.featherPx || p.in?.featherPx)) {
      const feather = (pin.featherPx || p.in.featherPx) * k;
      const pr = { p: 0 };
      const dur = sec(pin.durationMs, 0.8);
      tl.fromTo(pr, { p: 0 }, { p: 1, duration: dur, ease: easeOf(ctx, pin.easing), immediateRender: true }, t0);
      const ltr = !/inset\([^)]*\b0\s*\)\s*$/.test(String(clipFrom)) ? false : true;
      frameFns.push(() => {
        const w = el.offsetWidth || 1;
        const edge = pr.p * (w + feather);
        el.style.clipPath = 'none';
        const g = ltr
          ? `linear-gradient(90deg, #000 ${px(edge - feather)}, transparent ${px(edge)})`
          : `linear-gradient(270deg, #000 ${px(edge - feather)}, transparent ${px(edge)})`;
        el.style.webkitMaskImage = g;
        el.style.maskImage = g;
      });
    }

    // 7) optional rise while typing (blur-type "optionalRise", seen once in the reference)
    if (cue.rise) {
      const r = p.optionalRise || { from: { y: 66 }, durationMs: 400, easing: 'cubic-bezier(0.2,0.7,0.3,1)' };
      const dy = (typeof cue.rise === 'number' ? cue.rise : r.from.y) * k;
      tl.fromTo(el, { y: dy }, { y: 0, duration: sec(r.durationMs, 0.4), ease: easeOf(ctx, r.easing), immediateRender: true }, t0);
    }

    // (The hard cut at cue.end and taking the filtered wrappers out of the render tree outside the cue's lifetime
    //  are engine features since v2: hardCut + cue lifecycle, which hides the outermost wrapper owned by the cue.)
  };

  frameFns.push(() => {
    // gold band update: background-size/position of every visible glyph against the fixed band
    for (const b of bands) {
      if (b.el.style.visibility === 'hidden') continue;
      const bw = b.x1 - b.x0;
      for (const u of b.units) {
        const r = u.getBoundingClientRect();
        if (!r.width) continue;
        u.style.backgroundSize = `${bw.toFixed(1)}px ${Math.max(1, r.height).toFixed(1)}px`;
        u.style.backgroundPosition = `${(b.x0 - r.left).toFixed(1)}px 0px`;
        u.style.backgroundRepeat = 'no-repeat';
      }
    }
  });

  // build a text cue from inside a component (same cue shape as scene.json), with the Ember fixes
  E.text = function text(ctx, def, atSec, parentTl) {
    const tl0 = parentTl || ctx.tl;
    const c = { type: 'text', ...def, t: ctx.cue.t + atSec };
    if (def.end == null && ctx.cue.end != null) c.end = ctx.cue.end;
    const sub = ctx.gsap.timeline();
    const res = ctx.makeText(c, sub);
    tl0.add(sub, atSec);
    ctx.postLayout.push(() => E.textFx(ctx, c, res.el, sub, 0));
    return res;
  };

  // persistent: the Ember fixes for every text built after it (all scene text cues, which the engine builds after
  // the persistent components, and component-made lines). The engine's onText hook hands over each element with its
  // own cue timeline; the fixes run once fonts are loaded and the gradients split (postLayout). E.text registers
  // the same call for component lines, so they keep the fixes without this persistent (el._emberFx runs it once).
  R['ember-text-fx'] = (ctx) => {
    hookFrames(ctx);
    window.MG.onText((info) => ctx.registerPostLayout(() => E.textFx(ctx, info.cue, info.el, info.tl, 0)));
  };

  // ------------------------------------------------------------------ backdrop: orange studio / world plates
  // cue: {type:"component", component:"ember-backdrop", t, end, props:{variant:"studioMcu"|"studioWide"|
  //        "labCorridor"|"labWall"|<css gradient>, blurPx, steam, hud, fog, worldLock(default true)}}
  // World-locked (bgW) so punch-out settles / wobble move it with the footage. Oversized for scale < 1.
  R['ember-backdrop'] = (ctx) => {
    const { cue, W, H } = ctx;
    const pr = cue.props || {};
    const k = sc(ctx);
    const variant = pr.variant || 'studioMcu';
    const bgs = ctx.style.backgrounds || {};
    const h = host(ctx, pr.worldLock === false ? 'bg' : 'bgW');
    const frame = div({ left: '0px', top: '0px', width: px(W), height: px(H), overflow: 'visible' }, h);
    const fill = (g) => {
      // exact-frame gradient + 8 mirrored neighbours (reflect padding): reframes, wobble and scale < 1
      // reveal a seamless continuation instead of an edge
      let centre = null;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
        const d = div({ left: px(i * W), top: px(j * H), width: px(W), height: px(H), background: g }, frame);
        if (i || j) d.style.transform = `scale(${i ? -1 : 1}, ${j ? -1 : 1})`;
        else centre = d;
      }
      return centre;
    };
    if (bgs[variant] && bgs[variant].gradient) {
      fill(bgs[variant].gradient);
      // The style's top-right corner shade (overlays.tint, STYLE.md 5.2) is drawn into the FOOTAGE by the engine,
      // so a replaced cyc never receives it: lay it on the cyc itself (source-over of a near-black equals the
      // multiply). Measured on the demo: top-centre #4C1D03 -> ref #2A0C04, top-right #270B01 -> ref #160300.
      const tint = (ctx.style.overlays || {}).tint;
      if (pr.shade !== false && tint && tint.color) div({ left: '0px', top: '0px', width: px(W), height: px(H), background: tint.color, opacity: String(tint.opacity ?? 1) }, frame);
    }
    else if (variant === 'labCorridor') labCorridor(ctx, frame, pr);
    else if (variant === 'labWall') labWall(ctx, frame, pr);
    else fill(variant);
    const blur = pr.blurPx ?? (bgs[variant] && bgs[variant].blurPx);
    if (blur) E.setFilter(frame, 'plateBlur', `blur(${blur * k}px)`);
    // the fitted cyc gradients are pure-hue (B = 0, HSV S 255); the real cyc measures S 225-232 (k_008/k_024)
    const sat = pr.saturate ?? (variant === 'studioMcu' || variant === 'studioWide' ? 0.93 : null);
    if (sat != null && sat !== 1) E.setFilter(frame, 'cycSat', `saturate(${sat})`);
    // The plate is world-locked so punch-outs and wobble move it like footage, but the gradients/plates were fitted
    // in screen space: the style's cameraDefaults.worldRest "final" makes the engine move world-locked layers
    // relative to each camera cue's settled framing, so a reframed/cropped shot shows them where they were fitted
    // (AD: the MCU gradient under a 1.1x / y+80 camera put #501B00 at the top-centre instead of #2A0C02-#341302).
    E.backdropFrame = frame;
  };

  // seeded soft "steam" columns on a canvas (rise < 0.5 Hz)
  function steam(ctx, parent, o) {
    const { W, H } = ctx;
    const cv = document.createElement('canvas');
    cv.width = Math.round(W / 3); cv.height = Math.round(H / 3);
    Object.assign(cv.style, { position: 'absolute', left: '0px', top: '0px', width: px(W), height: px(H), mixBlendMode: o.blend || 'screen', opacity: String(o.opacity ?? 1) });
    parent.appendChild(cv);
    const g = cv.getContext('2d');
    const r = ctx.rng(o.seed || 7);
    const puffs = [];
    for (const col of o.columns) {
      for (let n = 0; n < (o.perColumn || 26); n++) puffs.push({ x: col.x + (r() - 0.5) * col.spread, y0: r(), s: col.size * (0.6 + r() * 0.8), v: 0.018 + r() * 0.02, ph: r() * 6.28, a: (o.alpha ? o.alpha[0] : 0.15) + r() * ((o.alpha ? o.alpha[1] : 0.4) - (o.alpha ? o.alpha[0] : 0.15)), top: col.top ?? 0.1, bot: col.bottom ?? 0.75 });
    }
    const color = o.color || '120,70,45';
    frameFns.push((t) => {
      if (cv.offsetParent === null && parent.style.visibility === 'hidden') return;
      g.clearRect(0, 0, cv.width, cv.height);
      const local = t - ctx.cue.t;
      for (const p of puffs) {
        const span = p.bot - p.top;
        const yy = p.top + ((((p.y0 - local * p.v) % 1) + 1) % 1) * span; // rises, wraps
        const life = (yy - p.top) / span; // 0 at top .. 1 at bottom
        const x = (p.x + Math.sin(local * 0.6 + p.ph) * 0.012 + (1 - life) * 0.03 * Math.sin(p.ph)) * cv.width;
        const y = yy * cv.height;
        const rad = p.s * cv.width * (1.6 - life);
        const al = p.a * Math.sin(Math.PI * clamp(life, 0, 1));
        const grd = g.createRadialGradient(x, y, 0, x, y, rad);
        grd.addColorStop(0, `rgba(${color},${al.toFixed(3)})`);
        grd.addColorStop(1, `rgba(${color},0)`);
        g.fillStyle = grd;
        g.beginPath(); g.arc(x, y, rad, 0, 6.283); g.fill();
      }
    });
    return cv;
  }

  // World plates are drawn on an OVERSIZED box (x -25..125 % W, y -30..130 % H) so camera reframes, wobble
  // or a scale < 1 never reveal an edge. X()/Y() map frame fractions to px inside that box.
  const EXT = { x0: -0.25, x1: 1.25, y0: -0.3, y1: 1.3 };
  function extBox(ctx, parent, background) {
    const { W, H } = ctx;
    return div({ left: px(EXT.x0 * W), top: px(EXT.y0 * H), width: px((EXT.x1 - EXT.x0) * W), height: px((EXT.y1 - EXT.y0) * H), background }, parent);
  }
  function extSvg(ctx, parent) {
    const { W, H } = ctx;
    const vb = `${EXT.x0 * 1080} ${EXT.y0 * 1920} ${(EXT.x1 - EXT.x0) * 1080} ${(EXT.y1 - EXT.y0) * 1920}`;
    return svg('svg', { viewBox: vb, preserveAspectRatio: 'none', style: `position:absolute;left:${EXT.x0 * W}px;top:${EXT.y0 * H}px;width:${(EXT.x1 - EXT.x0) * W}px;height:${(EXT.y1 - EXT.y0) * H}px;overflow:visible` }, parent);
  }

  // procedural stand-in for the AI "lab corridor" world plate (backgrounds.labCorridorPlate):
  // near-black ceiling, warm orange-red back-wall glow, receding benches with glassware, steam columns,
  // peach HUD panels, very heavy vignette (centre 83 vs edge 12)
  function labCorridor(ctx, parent, pr) {
    const { W, H } = ctx;
    const X = (f) => px((f - EXT.x0) * W);
    const Y = (f) => px((f - EXT.y0) * H);
    extBox(ctx, parent, [
      `radial-gradient(ellipse ${px(0.3 * W)} ${px(0.17 * H)} at ${X(0.5)} ${Y(0.47)}, rgba(226,112,58,0.95) 0%, rgba(170,74,46,0.78) 35%, rgba(120,48,32,0.42) 65%, rgba(60,22,12,0) 100%)`,
      `radial-gradient(ellipse ${px(0.72 * W)} ${px(0.36 * H)} at ${X(0.5)} ${Y(0.5)}, rgba(130,60,49,0.9) 0%, rgba(86,34,22,0.55) 55%, rgba(0,0,0,0) 100%)`,
      `linear-gradient(180deg, #0B0402 ${Y(-0.3)}, #0E0503 ${Y(0)}, #1C0C07 ${Y(0.2)}, #2C130A ${Y(0.36)}, #3C180C ${Y(0.5)}, #2A110A ${Y(0.64)}, #160805 ${Y(1)}, #0E0503 ${Y(1.3)})`,
    ].join(','));
    const s = extSvg(ctx, parent);
    const vp = [540, 900];
    const dfs = svg('defs', {}, s);
    const lg = svg('linearGradient', { id: uid('bench'), x1: 0, y1: 0, x2: 0, y2: 1 }, dfs);
    svg('stop', { offset: 0, 'stop-color': '#3a1a0e' }, lg);
    svg('stop', { offset: 1, 'stop-color': '#100503' }, lg);
    // ceiling beams converging on the vanishing point
    for (let i = 0; i < 9; i++) {
      const x = -500 + i * 260;
      svg('line', { x1: x, y1: -600, x2: vp[0] + (x - vp[0]) * 0.16, y2: vp[1] * 0.6, stroke: 'rgba(150,72,40,0.16)', 'stroke-width': 4 }, s);
    }
    // ceiling practicals (warm recessed lamps with a soft downward halo)
    const halo = svg('radialGradient', { id: uid('lamp'), cx: 0.5, cy: 0.35, r: 0.6 }, dfs);
    svg('stop', { offset: 0, 'stop-color': '#FFB070', 'stop-opacity': 0.42 }, halo);
    svg('stop', { offset: 1, 'stop-color': '#FF8040', 'stop-opacity': 0 }, halo);
    for (let i = 0; i < 3; i++) {
      const f = 0.45 + i * 0.2;
      for (const side of [-1, 1]) {
        const lx = vp[0] + side * (420 * (1 - f) + 40);
        const ly = vp[1] * 0.6 - (1 - f) * 900;
        const rx = 60 * (1 - f) + 14; const ry = 18 * (1 - f) + 5;
        svg('ellipse', { cx: lx, cy: ly + ry * 1.6, rx: rx * 2.4, ry: ry * 4.5, fill: `url(#${halo.id})` }, s);
        // lamp discs stay well below caption luminance (AD: discs at text luminance sat beside the hook)
        svg('ellipse', { cx: lx, cy: ly, rx, ry, fill: `rgba(255,200,150,${pr.lampAlpha ?? 0.2})` }, s);
      }
    }
    // counters receding along both walls (warm top edge) with glassware
    if (pr.benches !== false) {
      for (const side of [-1, 1]) {
        const xOut = side < 0 ? -300 : 1380;
        const xIn = vp[0] + side * 150;
        const yOut = 1180; const yIn = vp[1] + 40;
        svg('polygon', { points: `${xOut},${yOut} ${xIn},${yIn} ${xIn},${yIn + 70} ${xOut},${yOut + 560}`, fill: `url(#${lg.id})`, opacity: 0.8 }, s);
        svg('line', { x1: xOut, y1: yOut, x2: xIn, y2: yIn, stroke: 'rgba(226,128,66,0.27)', 'stroke-width': 4 }, s);
        const rr = ctx.rng(side + 5);
        for (let q = 0; q < 9; q++) {
          const f = 0.08 + rr() * 0.84;
          const gx = xOut + (xIn - xOut) * f; const gy = yOut + (yIn - yOut) * f;
          const sz = (34 + rr() * 50) * (1 - f * 0.75);
          const teal = rr() < 0.3;
          svg('ellipse', { cx: gx, cy: gy - sz * 0.55, rx: sz * 0.32, ry: sz * 0.55, fill: teal ? 'rgba(1,200,195,0.38)' : 'rgba(240,150,80,0.30)' }, s);
        }
      }
    }
    // floor sheen
    extBox(ctx, parent, `radial-gradient(ellipse ${px(0.42 * W)} ${px(0.2 * H)} at ${X(0.5)} ${Y(0.62)}, rgba(150,64,40,0.35), rgba(0,0,0,0) 70%)`);
    // warm steamy haze behind the hook (top band y 5-25 %): ref k_002-k_005 local background ~#3C1C09 around
    // the gold glyphs, steam #563425, top-band median ~#251209 (AD: ours was near-black #0F0500, luma 9-20)
    const hz = pr.hazeYPct || [5, 25];
    const hy = (hz[0] + hz[1]) / 200; const hh = (hz[1] - hz[0]) / 100;
    if (pr.haze !== false) {
      extBox(ctx, parent, [
        `radial-gradient(ellipse ${px(0.5 * W)} ${px(hh * 0.8 * H)} at ${X(0.5)} ${Y(hy)}, rgba(92,44,20,0.62) 0%, rgba(74,34,15,0.4) 45%, rgba(56,24,10,0.16) 75%, rgba(40,18,8,0) 100%)`,
        `radial-gradient(ellipse ${px(0.9 * W)} ${px(hh * 1.5 * H)} at ${X(0.5)} ${Y(hy + 0.02)}, rgba(52,24,10,0.32) 0%, rgba(40,18,8,0.16) 60%, rgba(30,12,6,0) 100%)`,
      ].join(','));
      steam(ctx, parent, { seed: 19, color: '120,72,48', opacity: 1, perColumn: 14, alpha: [0.08, 0.2], columns: [
        { x: 0.3, spread: 0.14, size: 0.07, top: hz[0] / 100 - 0.03, bottom: hz[1] / 100 + 0.1 },
        { x: 0.5, spread: 0.16, size: 0.08, top: hz[0] / 100 - 0.03, bottom: hz[1] / 100 + 0.1 },
        { x: 0.7, spread: 0.14, size: 0.07, top: hz[0] / 100 - 0.03, bottom: hz[1] / 100 + 0.1 },
      ] });
    }
    if (pr.steam !== false) {
      steam(ctx, parent, { seed: 11, color: '182,120,88', opacity: 1, perColumn: 30, alpha: [0.18, 0.42], columns: [
        { x: 0.1, spread: 0.08, size: 0.075, top: 0.02, bottom: 0.62 },
        { x: 0.88, spread: 0.08, size: 0.075, top: 0.02, bottom: 0.64 },
        { x: 0.27, spread: 0.05, size: 0.05, top: 0.16, bottom: 0.52 },
        { x: 0.74, spread: 0.05, size: 0.05, top: 0.16, bottom: 0.52 },
      ] });
    }
    if (pr.hud !== false) hudPanels(ctx, parent, {});
    extBox(ctx, parent, `radial-gradient(ellipse ${px(0.8 * W)} ${px(0.66 * H)} at ${X(0.5)} ${Y(0.4)}, rgba(0,0,0,0) 45%, rgba(6,2,1,0.72) 100%)`);
  }

  // procedural stand-in for the bright "lab wall" world plate (backgrounds.labWallPlate) — no vignette
  function labWall(ctx, parent, pr) {
    const { W, H } = ctx;
    const X = (f) => px((f - EXT.x0) * W);
    const Y = (f) => px((f - EXT.y0) * H);
    extBox(ctx, parent, [
      `radial-gradient(ellipse ${px(0.42 * W)} ${px(0.3 * H)} at ${X(0.62)} ${Y(0.4)}, rgba(232,165,90,0.95) 0%, rgba(232,165,90,0) 100%)`,
      'linear-gradient(150deg, #A64A18 0%, #BE551B 22%, #C9622A 40%, #D77B3A 56%, #C25A22 76%, #9E4416 100%)',
    ].join(','));
    const s = extSvg(ctx, parent);
    const formulas = pr.formulas || ['H₂O + CO₂ → H₂CO₃', 'C₆H₁₂O₆', 'NaCl ⇌ Na⁺ + Cl⁻', 'pH = −log[H⁺]', 'CH₃COOH', '2H₂ + O₂ → 2H₂O'];
    formulas.forEach((f, i) => {
      const tx = svg('text', { x: 700 + (i % 2) * 60, y: 520 + i * 92, fill: 'rgba(254,206,176,0.42)', 'font-family': 'inter, sans-serif', 'font-weight': 300, 'font-size': 42 - (i % 3) * 6, transform: `rotate(-4 ${700} ${520 + i * 92})` }, s);
      tx.textContent = f;
    });
    svg('rect', { x: 690, y: 1240, width: 700, height: 34, rx: 6, fill: '#5a2410' }, s);
    svg('rect', { x: 700, y: 1274, width: 700, height: 1300, fill: '#3c1609' }, s);
    const glass = (x, y, w, h) => {
      svg('rect', { x, y: y - h, width: w, height: h, rx: w * 0.18, fill: 'rgba(255,240,230,0.10)', stroke: 'rgba(250,230,217,0.6)', 'stroke-width': 3 }, s);
      svg('rect', { x: x + 4, y: y - h * 0.55, width: w - 8, height: h * 0.55 - 4, rx: w * 0.14, fill: '#01DDD6', opacity: 0.85 }, s);
    };
    glass(760, 1240, 90, 170); glass(880, 1240, 70, 120); glass(980, 1240, 80, 210);
    glass(60, 1300, 60, 90); glass(140, 1300, 50, 70);
    extBox(ctx, parent, `radial-gradient(circle ${px(0.3 * W)} at ${X(0.85)} ${Y(0.66)}, rgba(1,221,214,0.25), rgba(1,221,214,0) 100%)`);
    if (pr.fog !== false) steam(ctx, parent, { seed: 5, color: '97,194,199', opacity: 0.75, perColumn: 30, columns: [
      { x: 0.25, spread: 0.5, size: 0.11, top: 0.78, bottom: 1.05 },
      { x: 0.8, spread: 0.4, size: 0.1, top: 0.8, bottom: 1.05 },
    ] });
  }

  // ------------------------------------------------------------------ hud-panels
  function hudPanels(ctx, parent, b) {
    const { W, H } = ctx;
    const spec = specFor(ctx, 'hud-panels').build || {};
    const st = parseStroke(spec.stroke && spec.stroke.replace(/-[\d.]+px/, 'px').replace(/^([\d.]+)px (#\w+) at (\d+)%/, '$1px $2'), 1.75, '#D7A67A');
    const s = svg('svg', { width: W, height: H, viewBox: '0 0 1080 1920', style: `position:absolute;left:0;top:0;width:${W}px;height:${H}px;filter:blur(${spec.blurPx ?? 3}px);opacity:0.55` }, parent);
    const panels = b.panels || [
      [70, 690, 240, 160], [95, 880, 270, 185], [800, 650, 250, 165], [790, 860, 285, 195],
    ];
    panels.forEach(([x, y, w, h], i) => {
      const g = svg('g', {}, s);
      svg('rect', { x, y, width: w, height: h, rx: spec.radiusPx ?? 9, fill: 'rgba(215,166,122,0.06)', stroke: st.c, 'stroke-width': st.w }, g);
      // faint dashboard content: bars, a ring gauge, a line chart
      if (i % 2 === 0) {
        for (let q = 0; q < 5; q++) svg('rect', { x: x + 18 + q * (w - 36) / 5, y: y + h - 22 - (20 + ((q * 37) % 60)), width: (w - 36) / 5 - 8, height: 20 + ((q * 37) % 60), fill: st.c, opacity: 0.55 }, g);
        svg('line', { x1: x + 18, y1: y + 26, x2: x + w * 0.6, y2: y + 26, stroke: st.c, 'stroke-width': 3, opacity: 0.8 }, g);
      } else {
        svg('circle', { cx: x + w * 0.72, cy: y + h * 0.5, r: h * 0.3, fill: 'none', stroke: st.c, 'stroke-width': 3 }, g);
        svg('polyline', { points: `${x + 16},${y + h - 30} ${x + 50},${y + h - 60} ${x + 80},${y + h - 45} ${x + 115},${y + h - 90} ${x + 150},${y + h - 70}`, fill: 'none', stroke: st.c, 'stroke-width': 3 }, g);
        svg('line', { x1: x + 16, y1: y + 24, x2: x + w * 0.45, y2: y + 24, stroke: st.c, 'stroke-width': 3 }, g);
      }
    });
    return s;
  }
  R['hud-panels'] = (ctx) => {
    const h = host(ctx, ctx.cue.layer || 'bgW');
    hudPanels(ctx, h, ctx.cue.props || {});
  };

  // ------------------------------------------------------------------ talent helper (cool-set footage)
  // For footage shot on a cool set (e.g. a teal clinic) and moved onto the orange cyc:
  //   despill 0..1   removes cyan spill (min(G,B) above R) from the cut-out — kills the teal matte fringe
  //   choke 0..0.5   alpha floor: tightens the soft upscaled matte edge
  //   wrap 0..1      light-wrap: blends semi-transparent edge pixels toward wrapColor (the backdrop)
  //   solidBottom [y0Pct, y1Pct]  back-fills the cut-out with the (graded, camera-matched) plate under a vertical
  //                  ramp: MCU bodies always fill the bottom edge, but person mattes often drop forearms there
  //   warm/saturate/brightness/hueRotate: CSS filter on #talentWrap (graded talent only, never graphics)
  R['ember-talent'] = (ctx) => {
    const { cue } = ctx;
    const pr = cue.props || {};
    const tw = byId('talentWrap');
    const t1 = cue.end ?? 1e9;
    // toe: lifts the black floor (linear slope 1-toe, intercept toe). The style grade (contrast 1.10) crushes
    // dark wardrobe to luma 0-1 at p0.5/p5 (AD); the reference MCU sits at 2/13 (grade.targets lumaP5 11-15).
    let toeUrl = '';
    if (pr.toe) {
      const id = uid('toe');
      const fl = svg('filter', { id, 'color-interpolation-filters': 'sRGB' }, defs());
      const ct = svg('feComponentTransfer', {}, fl);
      for (const ch of ['feFuncR', 'feFuncG', 'feFuncB']) svg(ch, { type: 'linear', slope: (1 - pr.toe).toFixed(4), intercept: pr.toe.toFixed(4) }, ct);
      toeUrl = `url(#${id})`;
    }
    const f = [pr.warm ? `sepia(${pr.warm})` : '', pr.hueRotate ? `hue-rotate(${pr.hueRotate}deg)` : '', pr.saturate ? `saturate(${pr.saturate})` : '', pr.brightness ? `brightness(${pr.brightness})` : '', pr.contrast ? `contrast(${pr.contrast})` : '', toeUrl].filter(Boolean).join(' ');
    const tc = byId('talent');
    const tcx = tc && tc.getContext('2d');
    const work = document.createElement('canvas');
    let wcx = null;
    const ds = pr.despill ?? 0;
    const lo = clamp(pr.choke ?? 0, 0, 0.9) * 255;
    const wrap = pr.wrap ?? 0;
    const wc = pr.wrapColor || [120, 46, 6];
    ctx.onFrame((t) => {
      const on = t >= cue.t && t < t1;
      E.setFilter(tw, 'talent', on ? f : '');
      if (!on || !tcx || !(ds || lo || wrap || pr.solidBottom)) return;
      // work on a willReadFrequently copy (no readback warning on the runtime's canvas), then copy back
      if (!wcx) { work.width = tc.width; work.height = tc.height; wcx = work.getContext('2d', { willReadFrequently: true }); }
      wcx.clearRect(0, 0, work.width, work.height);
      if (pr.solidBottom) {
        const [a0, a1] = pr.solidBottom;
        const pl = byId('plate');
        wcx.drawImage(pl, 0, 0);
        const g = wcx.createLinearGradient(0, (a0 / 100) * work.height, 0, (a1 / 100) * work.height);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(0,0,0,1)');
        wcx.globalCompositeOperation = 'destination-in';
        wcx.fillStyle = g;
        wcx.fillRect(0, 0, work.width, work.height);
        wcx.globalCompositeOperation = 'source-over';
      }
      wcx.drawImage(tc, 0, 0);
      if (!(ds || lo || wrap)) {
        tcx.globalCompositeOperation = 'copy';
        tcx.drawImage(work, 0, 0);
        tcx.globalCompositeOperation = 'source-over';
        return;
      }
      const img = wcx.getImageData(0, 0, work.width, work.height);
      const d = img.data;
      const span = 255 - lo;
      for (let i = 0; i < d.length; i += 4) {
        let a = d[i + 3];
        if (a === 0) continue;
        let r = d[i], g = d[i + 1], b = d[i + 2];
        if (ds) {
          const sp = Math.min(g, b) - r;
          if (sp > 0) { g -= sp * ds; b -= sp * ds; }
          // residual blue-only spill
          const sb = b - Math.max(r, g);
          if (sb > 0) b -= sb * ds * 0.7;
        }
        if (lo) { a = ((a - lo) * 255) / span; if (a <= 0) { d[i + 3] = 0; continue; } if (a > 255) a = 255; }
        if (wrap && a < 250) {
          const w = wrap * (1 - a / 255);
          r += (wc[0] - r) * w; g += (wc[1] - g) * w; b += (wc[2] - b) * w;
        }
        d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = a;
      }
      wcx.putImageData(img, 0, 0);
      tcx.globalCompositeOperation = 'copy';
      tcx.drawImage(work, 0, 0);
      tcx.globalCompositeOperation = 'source-over';
    });
  };

  // ------------------------------------------------------------------ bw-focus-interrupt (transition)
  // Blur 0→13.5 px (267 ms linear) + saturate 1→0.1 (200 ms from +67 ms) on plate, talent and every EARLIER
  // graphic (they become grey ghosts); released by the hard cut at cue.end. Later cues stay crisp.
  R['bw-focus-interrupt'] = (ctx) => {
    const { cue, tl, layers } = ctx;
    const k = sc(ctx);
    const tr = ((ctx.style.transitions || []).find((x) => x.id === 'bw-focus-interrupt') || {}).params || {};
    const P = deepMerge(tr, cue.props || {});
    const st = { b: 0, s: 1, on: 0 };
    const ghosts = [];
    for (const name of ['bg', 'bgW', 'behind', 'behindW', 'front', 'frontW']) {
      const L = layers[name];
      if (!L || !L.children.length) continue;
      const g = div({ left: '0px', top: '0px', width: '100%', height: '100%' }, null, 'ember-ghost');
      while (L.firstChild) g.appendChild(L.firstChild);
      L.appendChild(g);
      ghosts.push(g);
    }
    const targets = [byId('plateWrap'), byId('talentWrap'), ...ghosts];
    // Greyscale as a colour matrix, not CSS saturate(): CSS saturate(0.1) on the saturated cyc keeps HSV S ~46-55
    // with a warm cast (AD: demo S median 55, #483F39) where the reference is S ~18 and cool-neutral (#3E3C3F,
    // #2A282C: G lowest, B >= R). Luma is Rec.601 so the grey keeps the frame's luma ("no luma change").
    const sTo = P.saturateTo ?? 0.02;
    const w = P.lumaWeights || [0.299, 0.587, 0.114];
    const gains = P.greyGains || [1.0, 0.965, 1.03];
    const bright = P.brightness ?? 1.0;
    const fid = uid('bw');
    const flt = svg('filter', { id: fid, 'color-interpolation-filters': 'sRGB', x: '-5%', y: '-5%', width: '110%', height: '110%' }, defs());
    const cm = svg('feColorMatrix', { type: 'matrix', values: '1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0' }, flt);
    let lastM = '';
    tl.set(st, { on: 1, immediateRender: false }, 0);
    tl.fromTo(st, { b: 0 }, { b: P.blurPx ?? 13.5, duration: sec(P.blurRamp && P.blurRamp.durationMs, 0.267), ease: easeOf(ctx, P.blurRamp && P.blurRamp.easing), immediateRender: true }, 0);
    tl.fromTo(st, { s: 1 }, { s: sTo, duration: sec(P.desatDurationMs, 0.2), ease: easeOf(ctx, P.desatEasing), immediateRender: true }, sec(P.desatDelayMs, 0.067));
    const e = endAt(ctx) ?? sec(P.holdMs, 1) + 0.267;
    tl.set(st, { on: 0, immediateRender: false }, e);
    ctx.onFrame(() => {
      let f = '';
      if (st.on) {
        const d = 1 - st.s; // desaturation amount (0 .. 1 - sTo)
        const pg = d / Math.max(1e-6, 1 - sTo); // ramp progress 0..1
        const br = 1 + (bright - 1) * pg;
        const rows = [0, 1, 2].map((c) => [0, 1, 2].map((j) => (((c === j ? 1 - d : 0) + d * gains[c] * w[j]) * br).toFixed(4)).join(' ') + ' 0 0');
        const M = `${rows.join(' ')} 0 0 0 1 0`;
        if (M !== lastM) { cm.setAttribute('values', M); lastM = M; }
        f = `blur(${(st.b * k).toFixed(2)}px) url(#${fid})`;
      }
      for (const el of targets) E.setFilter(el, 'bw', f);
    });
  };

  // ------------------------------------------------------------------ ember-composite
  // While active, the screen-locked layers follow the camera too, so the WHOLE composite moves:
  //   props.mode "translate" (plate-wobble: captions shake with the AI plate) | "full" (precut-pullback)
  R['ember-composite'] = (ctx) => {
    const { cue, cam } = ctx;
    const mode = (cue.props && cue.props.mode) || 'translate';
    // base: the camera offset that is a REFRAME (not shake) — subtracted so captions only get the wobble
    const base = (cue.props && cue.props.base) || [0, 0];
    const t1 = cue.end ?? cue.t + 1 / ctx.FPS;
    const els = ['bg', 'behind', 'front', 'fx'].map((n) => ctx.layers[n]);
    ctx.onFrame((t) => {
      const on = t >= cue.t - 1e-6 && t < t1 - 1e-6;
      let v = '';
      if (on) {
        if (mode === 'full') {
          const r = (cam.rotation * Math.PI) / 180;
          const a = Math.cos(r) * cam.scale; const b = Math.sin(r) * cam.scale;
          v = `matrix(${a},${b},${-b},${a},${cam.ox + cam.x - a * cam.ox + b * cam.oy},${cam.oy + cam.y - b * cam.ox - a * cam.oy})`;
        } else v = `translate(${(cam.x - base[0]).toFixed(2)}px, ${(cam.y - base[1]).toFixed(2)}px)`;
      }
      for (const el of els) E.setTransform(el, `comp${cue.t}`, v);
    });
  };

  // ------------------------------------------------------------------ glass-ring-pop
  // Torus rings (white 18% + 4.5 px backdrop blur, 1.5 px rims, top-left brighter) on the measured spring
  // .117→.476→.903→1.058→1.087→.903→.99→1 (733 ms). Each instance hides at props.morphAtMs / cue.end,
  // where nametag-capsule / echo-capsule take over from the same geometry.
  function ringGeom(ctx, ins, b) {
    const k = sc(ctx);
    const D = (ins.diameterPx ?? b.outerDiameterPx ?? 155) * k;
    const band = (b.bandWidthPx ?? 30) * (ins.diameterPx ?? 155) / (b.outerDiameterPx ?? 155) * k;
    return { cx: (ins.cxPct / 100) * ctx.W, cy: (ins.cyPct / 100) * ctx.H, D, band };
  }
  E.ringGeom = ringGeom;
  R['glass-ring-pop'] = (ctx) => {
    const { cue, tl, gsap } = ctx;
    const k = sc(ctx);
    const spec = specFor(ctx, 'glass-ring-pop');
    const b = deepMerge(spec.build || {}, cue.props || {});
    const frames = (cue.props && cue.props.keyframes) || (spec.in && spec.in.keyframes);
    const h = host(ctx, cue.layer || 'front');
    const rimIn = parseStroke(b.rimInner, 1.5, 'rgba(255,255,255,0.60)');
    const rimOut = parseStroke(b.rimOuter, 1.5, 'rgba(255,255,255,0.60)');
    const list = (cue.props && cue.props.only != null) ? [b.instances[cue.props.only]] : b.instances;
    list.forEach((ins, idx) => {
      const g = ringGeom(ctx, ins, b);
      const ring = div({ left: px(g.cx - g.D / 2), top: px(g.cy - g.D / 2), width: px(g.D), height: px(g.D), borderRadius: '50%',
        background: `radial-gradient(circle at 34% 30%, rgba(255,255,255,0.30), ${b.fill || 'rgba(255,255,255,0.18)'} 55%, rgba(255,255,255,0.12) 100%)` }, h);
      ring.style.backdropFilter = `blur(${(b.backdropBlurPx ?? 4.5) * k}px)`;
      const hole = g.D / 2 - g.band;
      const mask = `radial-gradient(circle at 50% 50%, transparent ${px(hole - 0.6)}, #000 ${px(hole + 0.6)})`;
      ring.style.setProperty('-webkit-mask', mask);
      ring.style.setProperty('mask', mask);
      const s = svg('svg', { width: g.D, height: g.D, viewBox: `0 0 ${g.D} ${g.D}`, style: 'position:absolute;left:0;top:0;overflow:visible' }, ring);
      const gid = uid('rg');
      const lg = svg('linearGradient', { id: gid, x1: 0, y1: 0, x2: 1, y2: 1 }, svg('defs', {}, s));
      svg('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.95 }, lg);
      svg('stop', { offset: 0.45, 'stop-color': '#fff', 'stop-opacity': 0.6 }, lg);
      svg('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': 0.42 }, lg);
      svg('circle', { cx: g.D / 2, cy: g.D / 2, r: g.D / 2 - rimOut.w * k / 2, fill: 'none', stroke: `url(#${gid})`, 'stroke-width': rimOut.w * k }, s);
      svg('circle', { cx: g.D / 2, cy: g.D / 2, r: hole + rimIn.w * k / 2, fill: 'none', stroke: `url(#${gid})`, 'stroke-width': rimIn.w * k }, s);
      const delay = sec(ins.delayMs, 0);
      gsap.set(ring, { transformOrigin: '50% 50%', autoAlpha: 0 });
      tl.set(ring, { autoAlpha: 1, immediateRender: false }, delay);
      ctx.keyframeTweens(tl, [ring], frames, delay);
      const morph = ins.morphAtMs ?? (cue.props && cue.props.morphAtMs);
      const at = morph != null ? delay + morph / 1000 : endAt(ctx);
      if (at != null) tl.set(ring, { autoAlpha: 0, immediateRender: false }, at);
    });
  };

  // ------------------------------------------------------------------ capsule core (nametag / echo)
  // Animated stadium: outer frosted glass + smoked inner field + arrow button, born from a ring geometry.
  function capsule(ctx, h, o) {
    const outer = glassBox({ left: o.from.left, top: o.from.top, w: o.from.w, h: o.from.h, fill: o.fill, blur: o.blur, rimW: o.rim.w, rim: o.rim.c, rimTop: o.rimTop, rimAngle: 170 }, h);
    const inner = glassBox({ left: o.innerFrom.left, top: o.innerFrom.top, w: o.innerFrom.w, h: o.innerFrom.h, fill: o.innerFill, rimW: o.innerRim.w, rim: o.innerRim.c, rimTop: o.innerRim.c }, h);
    return { outer, inner };
  }

  // ------------------------------------------------------------------ nametag-capsule
  // props: {label, micro, centrePct, ring:{cxPct,cyPct,diameterPx}, labelPreset, microPreset, textDelayMs}
  R['nametag-capsule'] = (ctx) => {
    const { cue, tl, gsap, W, H } = ctx;
    const k = sc(ctx);
    const spec = specFor(ctx, 'nametag-capsule');
    const pr = cue.props || {};
    const b = deepMerge(spec.build || {}, pr);
    const pin = deepMerge(spec.in || {}, cue.in);
    const ringSpec = specFor(ctx, 'glass-ring-pop').build || {};
    const rg = ringGeom(ctx, pr.ring || (ringSpec.instances || [])[1] || { cxPct: 72.2, cyPct: 72.3, diameterPx: 195 }, ringSpec);
    const o = b.outer; const inn = b.innerField;
    const cx = (b.centrePct[0] / 100) * W; const cy = (b.centrePct[1] / 100) * H;
    const w = o.widthPx * k; const hh = o.heightPx * k;
    const L = cx - w / 2;
    const ih = inn.heightPx * k; const iw = inn.widthPx * k; const il = L + inn.leftInsetPx * k;
    const hole = rg.D / 2 - rg.band;
    const h = host(ctx, cue.layer || 'front');
    const rim = parseStroke(o.rim, 1.5, 'rgba(255,255,255,0.40)');
    const c = capsule(ctx, h, {
      from: { left: rg.cx - rg.D / 2, top: rg.cy - rg.D / 2, w: rg.D, h: rg.D },
      innerFrom: { left: rg.cx - hole, top: rg.cy - hole, w: hole * 2, h: hole * 2 },
      fill: o.fill, blur: (o.backdropBlurPx ?? 6) * k, rim, rimTop: o.rimTopBoost,
      innerFill: inn.fill, innerRim: parseStroke(inn.rim, 1.5, 'rgba(255,255,255,0.30)'),
    });
    const dur = sec(pin.durationMs, 0.533);
    const ez = easeOf(ctx, pin.easing, 'power2.inOut');
    tl.to(c.outer, { left: L, top: cy - hh / 2, width: w, height: hh, duration: dur, ease: ez }, 0);
    tl.to(c.inner, { left: il, top: cy - ih / 2, width: iw, height: ih, duration: dur, ease: ez }, 0);
    tl.fromTo(c.inner, { opacity: 0.25 }, { opacity: 1, duration: dur * 0.6, ease: 'none', immediateRender: true }, 0);
    // button
    const btn = ctaButton(ctx, (b.button && b.button.variant) || 'nametag', { arrow: (b.button && b.button.arrow) || '↖' });
    btn.place(L + w - (b.button && b.button.centreFromRightEdgePx != null ? b.button.centreFromRightEdgePx : 92) * k, cy);
    h.appendChild(btn);
    const btnIn = (specFor(ctx, 'cta-button').in) || {};
    gsap.set(btn, { transformOrigin: '50% 50%', scale: 0 });
    tl.to(btn, { scale: 1, duration: sec(btnIn.durationMs, 0.233), ease: easeOf(ctx, btnIn.easing, 'back.out(2)') }, sec(pin.buttonPopDelayMs, 0.167));
    // texts inside the smoked field (positions follow the capsule if it was moved)
    const dx = ((b.centrePct[0] - 51.9) / 100) * W; const dy = ((b.centrePct[1] - 72.3) / 100) * H;
    const tAt = sec(pr.textDelayMs ?? pin.textDelayMs, 0.533);
    if (pr.label) {
      const pp = presetOf(ctx, pr.labelPreset || 'wipe-reveal-reverse').position || { xPct: 41.9, yPct: 72.0 };
      E.text(ctx, { preset: pr.labelPreset || 'wipe-reveal-reverse', text: pr.label, dir: 'rtl', position: { xPct: pp.xPct + (dx / W) * 100, yPct: pp.yPct + (dy / H) * 100 + (pr.micro ? 0 : 0.35), anchor: 'center' }, ...(pr.labelCue || {}) }, tAt);
    }
    if (pr.micro) {
      const mp = presetOf(ctx, pr.microPreset || 'micro-tracked-reverse').position || { xPct: 40.9, yPct: 74.9 };
      // ~3 px under the label's descenders, inside the smoked field (ref k_010-k_012); the preset slot sat on the
      // field's bottom edge for a label without deep descenders (AD), so lift it by microLiftPx (default 12)
      const lift = ((pr.microLiftPx ?? 12) * k / H) * 100;
      E.text(ctx, { preset: pr.microPreset || 'micro-tracked-reverse', text: pr.micro, dir: 'ltr', position: { xPct: mp.xPct + (dx / W) * 100, yPct: mp.yPct + (dy / H) * 100 - lift, anchor: 'center' }, ...(pr.microCue || {}) }, tAt + sec(pr.microDelayMs, 0.267));
    }
  };

  // ------------------------------------------------------------------ echo-capsule
  // Blurred duplicate of the name tag, cropped by the left frame edge; its button drifts right.
  // props: {label (truncated, e.g. "اسـ"), ring:{cxPct,cyPct,diameterPx}, centreYPct}
  R['echo-capsule'] = (ctx) => {
    const { cue, tl, gsap, H } = ctx;
    const k = sc(ctx);
    const spec = specFor(ctx, 'echo-capsule');
    const tag = specFor(ctx, 'nametag-capsule').build || {};
    const pr = cue.props || {};
    const b = deepMerge(spec.build || {}, pr);
    const pin = deepMerge(spec.in || {}, cue.in);
    const loop = deepMerge(spec.loop || {}, cue.loop);
    const ringSpec = specFor(ctx, 'glass-ring-pop').build || {};
    const rg = ringGeom(ctx, pr.ring || (ringSpec.instances || [])[0] || { cxPct: 17.9, cyPct: 15.4, diameterPx: 155 }, ringSpec);
    const s = b.scale ?? 0.95;
    const hh = (b.heightPx ?? 160) * k;
    const w = tag.outer.widthPx * s * k;
    const cy = ((b.centreYPct ?? 15.4) / 100) * H;
    const btnX = rg.cx;
    const right = btnX + 92 * s * k;
    const L = right - w;
    const ih = hh * 0.73; const iw = tag.innerField.widthPx * s * k; const il = L + tag.innerField.leftInsetPx * s * k;
    const hole = rg.D / 2 - rg.band;
    const h = host(ctx, cue.layer || 'front');
    const drift = div({ left: '0px', top: '0px', width: '100%', height: '100%' }, h);
    drift.style.filter = `blur(${(b.blurPx ?? 4.5) * k}px)`; // decorative: the blur makes it a backdrop root (fill only)
    const c = capsule(ctx, drift, {
      from: { left: rg.cx - rg.D / 2, top: rg.cy - rg.D / 2, w: rg.D, h: rg.D },
      innerFrom: { left: rg.cx - hole, top: rg.cy - hole, w: hole * 2, h: hole * 2 },
      fill: 'rgba(255,255,255,0.10)', blur: 0, rim: parseStroke(tag.outer.rim, 1.5, 'rgba(255,255,255,0.40)'), rimTop: tag.outer.rimTopBoost,
      innerFill: tag.innerField.fill, innerRim: parseStroke(tag.innerField.rim, 1.5, 'rgba(255,255,255,0.30)'),
    });
    const dur = sec(pin.durationMs, 0.2);
    const ez = easeOf(ctx, pin.easing, 'power2.inOut');
    tl.to(c.outer, { left: L, top: cy - hh / 2, width: w, height: hh, duration: dur, ease: ez }, 0);
    tl.to(c.inner, { left: il, top: cy - ih / 2, width: iw, height: ih, duration: dur, ease: ez }, 0);
    const btn = ctaButton(ctx, 'nametag', { ringDiameterPx: (b.button && b.button.ringDiameterPx) || 82, discDiameterPx: 123 * s, glassRingDiameterPx: 135 * s });
    btn.place(btnX, cy);
    drift.appendChild(btn);
    gsap.set(btn, { transformOrigin: '50% 50%', scale: 0 });
    const bp = pin.buttonPop || {};
    tl.to(btn, { scale: 1, duration: sec(bp.durationMs, 0.233), ease: easeOf(ctx, bp.easing, 'back.out(2)') }, dur * 0.5);
    if (pr.label) {
      const lab = div({ left: px(il + iw - 160 * k), top: px(cy - ih / 2), width: px(150 * k), height: px(ih), display: 'flex', alignItems: 'center', justifyContent: 'flex-end', whiteSpace: 'nowrap' }, drift);
      ctx.applyTextStyle(lab, { fontRole: 'pillBold', sizePx: 72 * s });
      lab.dir = 'rtl';
      lab.textContent = pr.label;
      gsap.set(lab, { opacity: 0 });
      tl.to(lab, { opacity: 1, duration: 0.2, ease: 'none' }, dur);
    }
    tl.fromTo(drift, { x: 0 }, { x: (loop.buttonDriftXPx ?? 84) * k, duration: sec(loop.durationMs, 2.4), ease: easeOf(ctx, loop.easing), immediateRender: true }, dur);
  };

  // ------------------------------------------------------------------ cta-button (standalone)
  // props: {variant: "nametag"|"finalCta", centrePct:[x,y]}
  R['cta-button'] = (ctx) => {
    const { cue, tl, gsap, W, H } = ctx;
    const spec = specFor(ctx, 'cta-button');
    const pr = cue.props || {};
    const pin = deepMerge(spec.in || {}, cue.in);
    const h = host(ctx, cue.layer || 'front');
    const btn = ctaButton(ctx, pr.variant || 'nametag', pr.button || {});
    const c = pr.centrePct || [cue.position?.xPct ?? 50, cue.position?.yPct ?? 60];
    btn.place((c[0] / 100) * W, (c[1] / 100) * H);
    h.appendChild(btn);
    gsap.set(btn, { transformOrigin: '50% 50%' });
    tl.fromTo(btn, { scale: pin.from?.scale ?? 0 }, { scale: 1, duration: sec(pin.durationMs, 0.233), ease: easeOf(ctx, pin.easing, 'back.out(2)'), immediateRender: true }, 0);
  };

  // ------------------------------------------------------------------ glass-pill-clear
  // props: {variant: "chest"|"brand", centrePct, widthPx, heightPx, text, textPreset, subText, subPreset}
  R['glass-pill-clear'] = (ctx) => {
    const { cue, tl, gsap, W, H } = ctx;
    const k = sc(ctx);
    const spec = specFor(ctx, 'glass-pill-clear');
    const pr = cue.props || {};
    const b = spec.build || {};
    const v = deepMerge((b.variants || {})[pr.variant || 'chest'] || {}, pr);
    const pin = deepMerge(spec.in || {}, cue.in);
    const w = v.widthPx * k; const hh = v.heightPx * k;
    const c = v.centrePct;
    const h = host(ctx, cue.layer || 'front');
    const rim = parseStroke(b.rim, 1.5, 'rgba(255,255,255,0.35)');
    const pill = glassBox({ left: (c[0] / 100) * W - w / 2, top: (c[1] / 100) * H - hh / 2, w, h: hh, fill: b.fill, blur: (b.backdropBlurPx ?? 7.5) * k, rimW: rim.w * k, rim: rim.c, rimTop: b.rimTop, rimBottom: 'rgba(255,255,255,0.22)' }, h);
    gsap.set(pill, { transformOrigin: '50% 50%' });
    const dur = sec(pin.durationMs, 0.15);
    tl.fromTo(pill, { scaleX: pin.from?.scaleX ?? 0.6, opacity: pin.from?.opacity ?? 0 }, { scaleX: 1, opacity: 1, duration: dur, ease: easeOf(ctx, pin.easing), immediateRender: true }, 0);
    const tAt = dur + sec(pin.textStartsAfterMs, 0.067);
    if (pr.text) E.text(ctx, { preset: pr.textPreset || 'pill-type', text: pr.text, dir: 'rtl', position: pr.textPosition || { xPct: c[0] + 1, yPct: c[1] - (pr.subText ? 1.7 : 0), anchor: 'center' }, ...(pr.textCue || {}) }, tAt);
    if (pr.subText) E.text(ctx, { preset: pr.subPreset || 'pill-type-thin', text: pr.subText, dir: 'rtl', position: pr.subPosition || { xPct: c[0] + 0.3, yPct: c[1] + 2.2, anchor: 'center' }, ...(pr.subCue || {}) }, tAt + sec(pr.subDelayMs, 0.6));
  };

  // ------------------------------------------------------------------ smoked-pill-autosize
  // Dark capsule on the B&W interrupt whose width follows its typed line.
  // props: {text, textPreset ("pill-type"), centrePct, textDelayMs (67)}
  R['smoked-pill-autosize'] = (ctx) => {
    const { cue, tl, gsap, W, H } = ctx;
    const k = sc(ctx);
    const spec = specFor(ctx, 'smoked-pill-autosize');
    const pr = cue.props || {};
    const b = deepMerge(spec.build || {}, pr);
    const pin = deepMerge(spec.in || {}, cue.in);
    const hh = b.heightPx * k;
    const c = b.centrePct;
    const cx = (c[0] / 100) * W; const cy = (c[1] / 100) * H;
    const preset = pr.textPreset || 'pill-type';
    const pp = presetOf(ctx, preset);
    // measure the typed line (fonts are loaded before components are built)
    let finalW = b.finalWidthPx * k;
    if (pr.text) {
      const m = document.createElement('span');
      ctx.applyTextStyle(m, deepMerge(pp.style || {}, pr.textStyle || {}));
      Object.assign(m.style, { position: 'absolute', visibility: 'hidden', whiteSpace: 'nowrap', left: '-9999px', top: '0px' });
      m.dir = 'rtl';
      m.textContent = pr.text;
      document.body.appendChild(m);
      finalW = m.getBoundingClientRect().width + 2 * (b.paddingXPx ?? 82) * k;
      m.remove();
    }
    const w0 = Math.min(finalW, (pin.from?.widthPx ?? 375) * k);
    const h = host(ctx, cue.layer || 'front');
    // the orange 3D word "emerges from under the pill": keep the pill (and its line) above later cues
    const z = pr.zIndex ?? 2;
    if (z) h.style.zIndex = String(z);
    const rim = parseStroke(b.rim, 1.5, 'rgba(255,255,255,0.15)');
    const pill = glassBox({ left: cx - w0 / 2, top: cy - hh / 2, w: w0, h: hh, fill: b.fill, blur: b.backdropBlurPx ? b.backdropBlurPx * k : 0, rimW: rim.w * k, rim: rim.c, rimTop: 'rgba(255,255,255,0.32)', rimAngle: 160 }, h);
    tl.fromTo(pill, { opacity: 0 }, { opacity: 1, duration: sec(pin.durationMs, 0.1), ease: 'none', immediateRender: true }, 0);
    const nLetters = [...String(pr.text || '').replace(/\s/g, '')].length;
    const typeMs = (pp.in?.staggerMs ?? 40) * Math.max(0, nLetters - 1) + (pp.in?.durationMs ?? 133);
    const follow = sec(pin.widthFollowsTextMs, 0.5);
    const growDur = Math.max(follow, typeMs / 1000);
    tl.to(pill, { width: finalW, left: cx - finalW / 2, duration: growDur, ease: 'none' }, sec(pin.durationMs, 0.1));
    if (pr.text) {
      const res = E.text(ctx, { preset, text: pr.text, dir: 'rtl', position: { xPct: c[0], yPct: c[1], anchor: 'center' }, ...(pr.textCue || {}) }, sec(pr.textDelayMs, 0.067));
      if (z) res.el.style.zIndex = String(z + 1);
    }
  };

  // ------------------------------------------------------------------ lens-disc-slide
  // Huge refractive disc rising from the bottom-right corner: interior = backdrop magnified 1.2x + 7.5 px
  // blur (SVG displacement map in backdrop-filter), 2.5 px rim. Lands with expo-out, then drifts until the cut.
  R['lens-disc-slide'] = (ctx) => {
    const { cue, tl, W, H, FPS } = ctx;
    const k = sc(ctx);
    const spec = specFor(ctx, 'lens-disc-slide');
    const pr = cue.props || {};
    const b = deepMerge(spec.build || {}, pr);
    const pin = deepMerge(spec.in || {}, cue.in);
    const loop = deepMerge(spec.loop || {}, cue.loop);
    const P = (a) => [(a[0] / 100) * W, (a[1] / 100) * H];
    const s0 = P(b.centreStartPct); const s1 = P(b.centreLandPct); const s2 = P(b.centreEndPct);
    const r0 = b.radiusPx * k;
    const st = { cx: s0[0], cy: s0[1], r: r0 };
    const h = host(ctx, cue.layer || 'front');
    const mag = magnifierFilter(b.interior?.magnify ?? 1.2, (b.interior?.blurPx ?? 7.5) * k);
    const rim = parseStroke(b.rim, 2.5, 'rgba(255,255,255,0.75)');
    const lens = div({ borderRadius: '50%' }, h);
    lens.style.backdropFilter = `url(#${mag.id})`;
    lens.style.boxShadow = `inset 0 0 0 ${px(rim.w * k)} ${rim.c}, inset ${px(-6 * k)} ${px(-6 * k)} ${px(30 * k)} rgba(255,255,255,0.10), inset ${px(8 * k)} ${px(8 * k)} ${px(40 * k)} rgba(0,0,0,0.10)`;
    const inDur = sec(pin.durationMs, 0.367);
    tl.to(st, { cx: s1[0], cy: s1[1], duration: inDur, ease: easeOf(ctx, pin.easing, 'expo.out') }, 0);
    const until = endAt(ctx) ?? inDur + 2.5;
    const nF = Math.max(0, (until - inDur) * FPS);
    const dxF = (loop.dxPerFramePx ?? -0.62) * k;
    const dyF = s2[0] !== s1[0] ? dxF * (s2[1] - s1[1]) / (s2[0] - s1[0]) : 0;
    tl.to(st, { cx: s1[0] + dxF * nF, cy: s1[1] + dyF * nF, r: r0 + (loop.dRadiusPerFramePx ?? 0.29) * k * nF, duration: Math.max(0.01, until - inDur), ease: 'none' }, inDur);
    let primed = false;
    ctx.onFrame(async () => {
      if (!primed) { primed = true; await mag.ready(); }
      lens.style.left = px(st.cx - st.r); lens.style.top = px(st.cy - st.r);
      lens.style.width = px(2 * st.r); lens.style.height = px(2 * st.r);
      mag.update(2 * st.r, 2 * st.r);
    });
  };

  // ------------------------------------------------------------------ lens-ring-pair
  // Two thin circles anchored off-frame at opposite corners; inside, the earlier captions are displaced
  // (-38,-98 px) and blurred 4.5 px. Slide in 400 ms expo-out, linear 1067 ms tail, then static.
  R['lens-ring-pair'] = (ctx) => {
    const { cue, tl, W } = ctx;
    const k = sc(ctx);
    const spec = specFor(ctx, 'lens-ring-pair');
    const pr = cue.props || {};
    const b = deepMerge(spec.build || {}, pr);
    const pin = deepMerge(spec.in || {}, cue.in);
    const loop = deepMerge(spec.loop || {}, cue.loop);
    const R0 = b.radiusPx * k;
    const pad = 120 * k;
    const h = host(ctx, cue.layer || 'front');
    const st = parseStroke(`${b.strokePx}px ${b.stroke}`, 3.5, 'rgba(255,255,255,0.37)');
    const cs = b.centresPct || {};
    const rings = [
      { c: cs.topLeft || [2.6, 21.3], sgn: -1 },
      { c: cs.bottomRight || [100.6, 80.2], sgn: 1 },
    ].filter((_, i) => !(pr.only != null && pr.only !== i));
    const inDur = sec(pin.durationMs, 0.4);
    const tailDur = sec(loop.durationMs, 1.067);
    const disp = b.interior?.displacePx || [-38, -98];
    // The rings bend EARLIER captions (ref k_040-k_047: «الاستاذ منجد» shifted/blurred inside the TL ring); the
    // presenter is never displaced. With no earlier caption under a ring its backdrop filter is switched off
    // (rim only), otherwise an MCU chest under the BR ring gets a blurred offset copy of itself (AD).
    const earlier = [...document.querySelectorAll('.mg-text')];
    const refractMode = pr.refract ?? 'auto';
    const shownRect = (el) => {
      if (!el.isConnected) return null;
      for (let n = el; n && n !== document.body; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.02) return null;
      }
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 ? r : null;
    };
    const hitsCircle = (r, x, y, rad) => {
      const qx = clamp(x, r.left, r.right); const qy = clamp(y, r.top, r.bottom);
      return Math.hypot(qx - x, qy - y) < rad;
    };
    rings.forEach((rg) => {
      const cx = (rg.c[0] / 100) * W; const cy = (rg.c[1] / 100) * ctx.H;
      const s = { dx: rg.sgn * -(pin.from?.cxOffsetPx ?? -207) * k * -1, sc: pin.from?.scale ?? 0.77 };
      // TL ring comes from the left (dx<0), BR mirrored from the right
      s.dx = (rg.sgn < 0 ? 1 : -1) * (pin.from?.cxOffsetPx ?? -207) * k;
      const toDx = (rg.sgn < 0 ? 1 : -1) * (pin.to?.cxOffsetPx ?? -37) * k;
      const flt = offsetFilter(disp[0] * k * (rg.sgn < 0 ? 1 : -1), disp[1] * k * (rg.sgn < 0 ? 1 : -1), (b.interior?.blurPx ?? 4.5) * k, pr.dim ?? 0.9);
      const refr = div({}, h);
      refr.style.backdropFilter = `url(#${flt.id})`;
      const line = div({ borderRadius: '50%', boxSizing: 'border-box', border: `${px(st.w * k)} solid ${st.c}` }, h);
      tl.to(s, { dx: toDx, sc: pin.to?.scale ?? 0.96, duration: inDur, ease: easeOf(ctx, pin.easing, 'expo.out') }, 0);
      tl.to(s, { dx: 0, sc: 1, duration: tailDur, ease: 'none' }, inDur);
      ctx.onFrame(() => {
        const r = R0 * s.sc;
        const x = cx + s.dx; const y = cy;
        const S = 2 * (r + pad);
        refr.style.left = px(x - S / 2); refr.style.top = px(y - S / 2);
        refr.style.width = px(S); refr.style.height = px(S);
        const m = `radial-gradient(circle ${px(r)} at 50% 50%, #000 ${px(r - 1)}, transparent ${px(r)})`;
        refr.style.setProperty('-webkit-mask', m); refr.style.setProperty('mask', m);
        let on = refractMode === true || refractMode === 'always';
        if (refractMode === 'auto') on = earlier.some((el) => [el, el._emberSolid].some((q) => { const rr = q && shownRect(q); return rr && hitsCircle(rr, x, y, r); }));
        refr.style.display = on ? 'block' : 'none';
        line.style.left = px(x - r); line.style.top = px(y - r);
        line.style.width = px(2 * r); line.style.height = px(2 * r);
      });
    });
  };

  // ------------------------------------------------------------------ glass-bead-capsule
  // Final CTA: magnifying bead pops on the waist, drifts to the left cap, stretches right into an
  // orange-frosted capsule; ↗ button (finalCta) on the left; two pill-sweep lines.
  // props: {lines:[{text, ...}], centrePct, beadCentrePct, speed (1 = reference timing)}
  R['glass-bead-capsule'] = (ctx) => {
    const { cue, tl, gsap, W, H } = ctx;
    const k = sc(ctx);
    const spec = specFor(ctx, 'glass-bead-capsule');
    const pr = cue.props || {};
    const b = deepMerge(spec.build || {}, pr);
    const steps = (spec.in && spec.in.steps) || [];
    const sp = pr.speed || 1;
    const stepOf = (w) => steps.find((s) => s.what && s.what.startsWith(w)) || {};
    const cap = b.capsule; const bead = b.bead;
    const ccx = ((pr.centrePct || cap.centrePct)[0] / 100) * W;
    const ccy = ((pr.centrePct || cap.centrePct)[1] / 100) * H;
    const cw = cap.widthPx * k; const ch = cap.heightPx * k;
    const left = ccx - cw / 2;
    const bd = bead.diameterPx * k;
    const bc = pr.beadCentrePct || bead.startCentrePct;
    const bx = (bc[0] / 100) * W + ((pr.centrePct ? pr.centrePct[0] - cap.centrePct[0] : 0) / 100) * W;
    const by = ccy;
    const h = host(ctx, cue.layer || 'front');
    // bead (magnifier)
    const mag = magnifierFilter(bead.interior?.magnify ?? 1.25, 1.2 * k);
    const brim = parseStroke(bead.rim, 2, 'rgba(255,255,255,0.70)');
    const st = { x: bx, d: (stepOf('bead pop').from?.diameterPx ?? 12) * k, a: 1 };
    const beadEl = div({ borderRadius: '50%' }, h);
    beadEl.style.backdropFilter = `url(#${mag.id})`;
    beadEl.style.boxShadow = `inset 0 0 0 ${px(brim.w * k)} ${brim.c}, inset ${px(-4 * k)} ${px(-5 * k)} ${px(14 * k)} rgba(255,255,255,0.18)`;
    // capsule glass (clear first, orange tint fades in)
    const rim = parseStroke(cap.rim, 1.5, 'rgba(255,255,255,0.40)');
    const capEl = glassBox({ left, top: ccy - ch / 2, w: bd, h: ch, fill: 'rgba(255,255,255,0.06)', blur: (cap.backdropBlurPx ?? 6) * k, rimW: rim.w * k, rim: rim.c, rimTop: 'rgba(255,255,255,0.55)', rimBottom: 'rgba(174,109,76,0.9)' }, h);
    const tint = div({ left: '0px', top: '0px', right: '0px', bottom: '0px', borderRadius: 'inherit',
      background: `linear-gradient(180deg, rgba(152,89,54,0.62) 0%, ${cap.tint || 'rgba(126,62,30,0.55)'} 42%, rgba(133,66,25,0.58) 100%)`,
      boxShadow: `inset 0 ${px(-3 * k)} ${px(8 * k)} rgba(174,109,76,0.85), inset 0 ${px(2 * k)} ${px(2 * k)} rgba(255,214,180,0.28)` });
    capEl.insertBefore(tint, capEl.firstChild);
    gsap.set(capEl, { autoAlpha: 0 });
    gsap.set(tint, { opacity: 0 });
    const popD = sec(stepOf('bead pop').durationMs, 0.133) / sp;
    const holdD = sec(stepOf('bead hold').durationMs, 0.2) / sp;
    const s3 = stepOf('stretch');
    const strD = sec(s3.durationMs, 0.733) / sp;
    const t0s = popD + holdD; // stretch start
    tl.to(st, { d: bd, duration: popD, ease: easeOf(ctx, stepOf('bead pop').easing, 'back.out(2)') }, 0);
    tl.to(st, { x: left + bd / 2, duration: holdD, ease: 'power1.inOut' }, popD);
    tl.set(capEl, { autoAlpha: 1, immediateRender: false }, t0s);
    tl.to(capEl, { width: cw, duration: strD, ease: easeOf(ctx, s3.easing, 'power2.inOut') }, t0s);
    tl.to(st, { a: 0, duration: 0.2 / sp, ease: 'none' }, t0s);
    const tintS = stepOf('orange tint');
    tl.to(tint, { opacity: 1, duration: sec(tintS.durationMs, 0.2) / sp, ease: 'none' }, t0s + sec(tintS.atMsFromStretch, 0.333) / sp);
    // button (finalCta, left)
    const btnS = stepOf('button pop');
    const btn = ctaButton(ctx, 'finalCta');
    const bcx = b.button && b.button.centrePct ? (b.button.centrePct[0] / 100) * W + ((pr.centrePct ? pr.centrePct[0] - cap.centrePct[0] : 0) / 100) * W : left + 54 * k;
    btn.place(bcx, ccy);
    h.appendChild(btn);
    gsap.set(btn, { transformOrigin: '50% 50%', scale: 0 });
    tl.to(btn, { scale: 1, duration: sec(btnS.durationMs, 0.333) / sp, ease: easeOf(ctx, btnS.easing, 'back.out(2)') }, t0s + sec(btnS.atMsFromStretch, 0.4) / sp);
    // lines
    const l1 = sec(stepOf('line 1').atMsFromStretch, 1.1) / sp;
    const l2 = sec(stepOf('line 2').atMsFromStretch, 1.433) / sp;
    const dy = ((pr.centrePct ? pr.centrePct[1] - cap.centrePct[1] : 0));
    const dx = ((pr.centrePct ? pr.centrePct[0] - cap.centrePct[0] : 0));
    (pr.lines || []).forEach((ln, i) => {
      const pos = i === 0 ? { xPct: 50.6 + dx + 2.2, yPct: 53.9 + dy + (pr.lines.length === 1 ? 1.1 : 0) } : { xPct: 50.7 + dx + 2.2, yPct: 56.4 + dy };
      const style = i === 0 ? { fontRole: 'pillSmall' } : { fontRole: 'pillSubDark', color: '#340C0C' };
      E.text(ctx, { preset: 'pill-sweep', text: ln.text, dir: 'rtl', position: { ...pos, anchor: 'center' }, style, ...ln }, t0s + (i === 0 ? l1 : l2));
    });
    let primed = false;
    ctx.onFrame(async () => {
      if (!primed) { primed = true; await mag.ready(); }
      beadEl.style.left = px(st.x - st.d / 2); beadEl.style.top = px(by - st.d / 2);
      beadEl.style.width = px(st.d); beadEl.style.height = px(st.d);
      beadEl.style.opacity = String(st.a);
      mag.update(st.d, st.d);
    });
  };

  // ------------------------------------------------------------------ badge-ribbon (procedural)
  // Curved band of capsule badges wrapping the talent: back slab BEHIND (swings open from edge-on, 3 px
  // blur) + front band IN FRONT of the legs/hands (rises, 13.5 px blur). props: {icons:[...], front, back,
  // labels:[...]}
  const ICONS = {
    tooth: 'M-26,-30 C-40,-30 -42,-10 -36,6 C-32,18 -30,34 -22,34 C-14,34 -14,14 0,14 C14,14 14,34 22,34 C30,34 32,18 36,6 C42,-10 40,-30 26,-30 C16,-30 10,-24 0,-24 C-10,-24 -16,-30 -26,-30 Z',
    aligner: 'M-40,-6 C-40,-26 -20,-30 0,-30 C20,-30 40,-26 40,-6 L40,4 C40,22 20,28 0,28 C-20,28 -40,22 -40,4 Z M-28,-4 C-28,-16 -14,-18 0,-18 C14,-18 28,-16 28,-4 L28,2 C28,14 14,16 0,16 C-14,16 -28,14 -28,2 Z',
    sparkle: 'M0,-36 C4,-10 10,-4 36,0 C10,4 4,10 0,36 C-4,10 -10,4 -36,0 C-10,-4 -4,-10 0,-36 Z',
    clock: 'M0,-34 A34,34 0 1 1 -0.1,-34 Z M0,-20 L0,0 L16,10',
    shield: 'M0,-36 L30,-24 L28,6 C26,22 14,32 0,38 C-14,32 -26,22 -28,6 L-30,-24 Z M-12,2 L-2,12 L16,-10',
    nometal: 'M0,-34 A34,34 0 1 1 -0.1,-34 Z M-24,-24 L24,24 M-16,6 L-6,-4 M-6,6 L4,-4 M4,6 L14,-4',
    flask: 'M-10,-34 L10,-34 M-6,-34 L-6,-10 L-30,30 L30,30 L6,-10 L6,-34 M-20,14 L20,14',
    atom: 'M-36,0 A36,14 0 1 0 36,0 A36,14 0 1 0 -36,0 Z M-18,-31 A36,14 60 1 0 18,31 A36,14 60 1 0 -18,-31 Z M18,-31 A36,14 -60 1 0 -18,31 A36,14 -60 1 0 18,-31 Z',
  };
  E.ICONS = ICONS;
  function badgeSvg(ctx, w, hh, icon, label, gid) {
    const s = svg('svg', { width: w, height: hh, viewBox: `0 0 ${w} ${hh}`, style: 'position:absolute;left:0;top:0;overflow:visible' });
    const r = w / 2;
    const outline = svg('rect', { x: 2, y: 2, width: w - 4, height: hh - 4, rx: r - 2, fill: '#2B1610', stroke: `url(#${gid})`, 'stroke-width': Math.max(3, w * 0.022) }, s);
    const g = svg('g', { transform: `translate(${w / 2},${hh * 0.56}) scale(${w / 150})`, fill: 'none', stroke: '#B3A4A1', 'stroke-width': 4.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s);
    svg('path', { d: ICONS[icon] || ICONS.sparkle }, g);
    if (label) {
      const t = svg('text', { x: w / 2, y: hh * 0.24, 'text-anchor': 'middle', fill: '#B3A4A1', 'font-family': 'inter, sans-serif', 'font-weight': 600, 'font-size': w * 0.085, 'letter-spacing': w * 0.01 }, s);
      t.textContent = label;
    }
    return { s, outline, icon: g };
  }
  R['badge-ribbon'] = (ctx) => {
    const { cue, tl, gsap, W, H } = ctx;
    const k = sc(ctx);
    const spec = specFor(ctx, 'badge-ribbon');
    const b = deepMerge(spec.build || {}, cue.props || {});
    const pr = cue.props || {};
    const steps = (spec.in && spec.in.steps) || [];
    const stepAt = (i, key) => steps[i] && steps[i][key];
    const icons = pr.icons || ['flask', 'nometal', 'atom', 'sparkle'];
    const labels = pr.labels || [];
    // gradient for badge rims
    const gid = uid('rim');
    const lg = svg('linearGradient', { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }, defs());
    svg('stop', { offset: 0, 'stop-color': '#B66F43' }, lg);
    svg('stop', { offset: 1, 'stop-color': '#9A5532' }, lg);
    const outlines = [];
    const iconEls = [];
    if (pr.back !== false) {
      const hb = host(ctx, 'behind');
      const reg = b.backArcRegionPct || { x: [0, 35], y: [36, 55] };
      const x0 = (reg.x[0] / 100) * W - 30 * k; const x1 = (reg.x[1] / 100) * W;
      const y0 = (reg.y[0] / 100) * H; const y1 = (reg.y[1] / 100) * H;
      const persp = div({ left: px(x0), top: px(y0), width: px(x1 - x0), height: px(y1 - y0), perspective: px(900 * k) }, hb);
      const slab = div({ left: '0px', top: '0px', width: '100%', height: '100%', background: 'linear-gradient(180deg, #2B1610, #1f0f0a)', borderRadius: px(10 * k), transformOrigin: '100% 50%', boxShadow: `inset 0 0 0 ${px(2 * k)} rgba(154,85,50,0.35)` }, persp);
      slab.style.filter = `blur(${(b.blurBackPx ?? 3) * k}px)`;
      const n = 3;
      const bw = (b.badgeBackPx ? b.badgeBackPx[0] : 165) * k * 0.82; const bh = Math.min((y1 - y0) * 0.86, (b.badgeBackPx ? b.badgeBackPx[1] : 255) * k * 0.82);
      for (let i = 0; i < n; i++) {
        const cell = div({ left: px(18 * k + i * ((x1 - x0 - 36 * k) / n) + ((x1 - x0 - 36 * k) / n - bw) / 2), top: px((y1 - y0 - bh) / 2), width: px(bw), height: px(bh) }, slab);
        const bs = badgeSvg(ctx, bw, bh, icons[i % icons.length], labels[i], gid);
        cell.appendChild(bs.s);
        outlines.push(bs.outline); iconEls.push({ el: bs.icon, d: 1 + (n - 1 - i) });
      }
      gsap.set(slab, { rotateY: 89 });
      tl.to(slab, { rotateY: 22, duration: sec(stepAt(0, 'durationMs'), 0.467), ease: easeOf(ctx, stepAt(0, 'easing'), 'power2.out') }, sec(stepAt(0, 'atMs'), 0.2));
    }
    if (pr.front !== false) {
      const hf = host(ctx, 'front');
      const fy = ((b.frontArcRegionPct || { y: [70, 100] }).y[0] / 100) * H;
      const band = div({ left: px(-0.08 * W), top: px(fy), width: px(1.16 * W), height: px(H - fy + 60 * k), background: 'linear-gradient(180deg, rgba(73,35,31,0.96), rgba(43,22,16,0.98))', borderRadius: `${px(220 * k)} ${px(220 * k)} 0 0` }, hf);
      band.style.filter = `blur(${(b.blurFrontPx ?? 13.5) * k}px)`;
      const n = 3;
      // frontBadgeScale: MCU framings only leave the bottom ~20 % H for the front band; scale the badges so their
      // icons sit inside the visible strip instead of below the frame edge
      const fsc = pr.frontBadgeScale ?? 1;
      const bw = (b.badgeFrontPx ? b.badgeFrontPx[0] : 300) * k * fsc; const bh = (b.badgeFrontPx ? b.badgeFrontPx[1] : 495) * k * fsc;
      for (let i = 0; i < n; i++) {
        const cx = (0.2 + i * 0.36) * 1.16 * W;
        const cell = div({ left: px(cx - bw / 2), top: px((40 * k + Math.abs(i - 1) * 50 * k) * fsc), width: px(bw), height: px(bh) }, band);
        const bs = badgeSvg(ctx, bw, bh, icons[(i + 1) % icons.length], labels[i + 3], gid);
        cell.appendChild(bs.s);
        outlines.push(bs.outline); iconEls.push({ el: bs.icon, d: 0 });
      }
      gsap.set(band, { y: H - fy });
      tl.to(band, { y: 0, duration: sec(stepAt(1, 'durationMs'), 0.4), ease: easeOf(ctx, stepAt(1, 'easing'), 'power2.out') }, sec(stepAt(1, 'atMs'), 0.267));
    }
    // outlines fade to 40%, icons fade in nearest first
    gsap.set(outlines, { attr: { 'stroke-opacity': 1 } });
    tl.to(outlines, { attr: { 'stroke-opacity': 0.4 }, duration: sec(stepAt(2, 'durationMs'), 0.133), ease: 'none' }, sec(stepAt(2, 'atMs'), 0.8));
    const order = iconEls.sort((a, c) => a.d - c.d).map((x) => x.el);
    gsap.set(order, { opacity: 0 });
    tl.to(order, { opacity: 1, duration: sec(stepAt(3, 'durationMs'), 0.2), stagger: sec(stepAt(3, 'staggerMs'), 0.083), ease: 'none' }, sec(stepAt(3, 'atMs'), 1.0));
  };

  // ------------------------------------------------------------------ glass-molecule (procedural)
  // Cyan glass droplet atoms + rods, 12 px cyan glow, rotates 6.9°/s clockwise, floats 6 px (< 0.5 Hz).
  R['glass-molecule'] = (ctx) => {
    const { cue, tl, W, H } = ctx;
    const k = sc(ctx);
    const spec = specFor(ctx, 'glass-molecule');
    const b = deepMerge(spec.build || {}, cue.props || {});
    const loop = deepMerge(spec.loop || {}, cue.loop);
    const reg = b.regionPct || { x: [2.8, 32], y: [14.8, 30.5] };
    const bw = (b.boxPx ? b.boxPx[0] : 315) * k; const bh = (b.boxPx ? b.boxPx[1] : 330) * k;
    const cx = ((reg.x[0] + reg.x[1]) / 200) * W; const cy = ((reg.y[0] + reg.y[1]) / 200) * H;
    const h = host(ctx, cue.layer || 'front');
    const box = div({ left: px(cx - bw / 2), top: px(cy - bh / 2), width: px(bw), height: px(bh) }, h);
    box.style.filter = `drop-shadow(0 0 ${px((b.glowPx ?? 12) * k)} rgba(115,236,241,0.55))`;
    const S = 300;
    const s = svg('svg', { width: bw, height: bh, viewBox: `${-S / 2} ${-S / 2} ${S} ${S}`, style: 'position:absolute;left:0;top:0;overflow:visible' }, box);
    const d = svg('defs', {}, s);
    const gid = uid('atom');
    const rg = svg('radialGradient', { id: gid, cx: 0.38, cy: 0.32, r: 0.75 }, d);
    svg('stop', { offset: 0, 'stop-color': b.specular || '#FFF6E6', 'stop-opacity': 0.95 }, rg);
    svg('stop', { offset: 0.18, 'stop-color': b.highlight || '#83C5CF', 'stop-opacity': 0.85 }, rg);
    svg('stop', { offset: 0.65, 'stop-color': b.glass || '#6DB1B7', 'stop-opacity': 0.55 }, rg);
    svg('stop', { offset: 1, 'stop-color': '#01DDD6', 'stop-opacity': 0.75 }, rg);
    const rot = svg('g', {}, s);
    const atoms = [[0, 0, 30], [-88, -52, 22], [92, -40, 20], [-20, 98, 22], [70, 74, 17], [-100, 40, 15], [10, -105, 16]];
    atoms.slice(1).forEach(([x, y]) => svg('line', { x1: 0, y1: 0, x2: x, y2: y, stroke: 'rgba(160,230,235,0.75)', 'stroke-width': 7, 'stroke-linecap': 'round' }, rot));
    atoms.forEach(([x, y, r]) => {
      svg('circle', { cx: x, cy: y, r, fill: `url(#${gid})`, stroke: 'rgba(220,250,252,0.8)', 'stroke-width': 1.5 }, rot);
      svg('ellipse', { cx: x - r * 0.3, cy: y - r * 0.38, rx: r * 0.32, ry: r * 0.18, fill: 'rgba(255,255,255,0.85)' }, rot);
    });
    const span = endAt(ctx) ?? 6;
    const deg = loop.rotateDegPerSec ?? 6.9;
    const st = { a: 0, f: 0 };
    tl.fromTo(st, { a: 0 }, { a: deg * span, duration: span, ease: 'none', immediateRender: true }, 0);
    tl.fromTo(st, { f: 0 }, { f: span, duration: span, ease: 'none', immediateRender: true }, 0);
    ctx.onFrame(() => {
      rot.setAttribute('transform', `rotate(${st.a.toFixed(3)})`);
      box.style.transform = `translateY(${(Math.sin(st.f * 2 * Math.PI * 0.33) * (loop.floatPx ?? 6) * k).toFixed(2)}px)`;
    });
  };

  // ------------------------------------------------------------------ foreground-flask-fog (procedural)
  // Giant clear Erlenmeyer flask of glowing teal liquid in front of the legs + teal floor fog (depth sandwich)
  R['foreground-flask-fog'] = (ctx) => {
    const { cue, W, H } = ctx;
    const k = sc(ctx);
    const spec = specFor(ctx, 'foreground-flask-fog');
    const b = deepMerge(spec.build || {}, cue.props || {});
    const pr = cue.props || {};
    const h = host(ctx, cue.layer || 'front');
    if (pr.flask !== false) {
      const fb = b.flaskBoxPx || { x: [0, 555], y: [885, 1920] };
      const x0 = fb.x[0] * k; const x1 = fb.x[1] * k; const y0 = fb.y[0] * k; const y1 = fb.y[1] * k;
      const fw = x1 - x0; const fh = y1 - y0;
      const s = svg('svg', { width: fw, height: fh, viewBox: '0 0 555 1035', preserveAspectRatio: 'none', style: `position:absolute;left:${x0}px;top:${y0}px;overflow:visible` }, h);
      const d = svg('defs', {}, s);
      const lid = uid('liq');
      const lg = svg('linearGradient', { id: lid, x1: 0, y1: 0, x2: 0, y2: 1 }, d);
      const liq = b.liquid || ['#73ECF1', '#009898', '#01DDD6'];
      svg('stop', { offset: 0, 'stop-color': liq[0] }, lg);
      svg('stop', { offset: 0.25, 'stop-color': liq[2] }, lg);
      svg('stop', { offset: 1, 'stop-color': liq[1] }, lg);
      const flask = 'M190,0 L330,0 L330,40 L322,40 L322,330 C322,360 340,380 360,410 L520,720 C560,800 545,1035 470,1035 L60,1035 C-10,1035 -5,800 30,720 L190,410 C210,380 228,360 228,330 L228,40 L190,40 Z';
      const cid = uid('fl');
      const cp = svg('clipPath', { id: cid }, d);
      svg('path', { d: flask }, cp);
      const surface = (b.liquidSurfaceYPx ?? 1418) - fb.y[0];
      const g = svg('g', { 'clip-path': `url(#${cid})` }, s);
      svg('rect', { x: -20, y: surface, width: 600, height: 1100, fill: `url(#${lid})`, opacity: 0.92 }, g);
      svg('ellipse', { cx: 278, cy: surface, rx: 300, ry: 16, fill: liq[0], opacity: 0.9 }, g);
      // bubbles (seeded, slow)
      const rr = ctx.rng(31);
      const bub = Array.from({ length: 14 }, () => ({ x: 80 + rr() * 400, y: rr(), r: 4 + rr() * 9, v: 0.04 + rr() * 0.05 }));
      const be = bub.map((q) => svg('circle', { r: q.r, fill: 'rgba(220,255,255,0.55)' }, g));
      // glass body: faint fill + warm rim highlights
      svg('path', { d: flask, fill: 'rgba(255,245,235,0.05)', stroke: '#FAE6D9', 'stroke-opacity': 0.55, 'stroke-width': 4.5 }, s);
      svg('path', { d: 'M60,760 C40,860 50,980 90,1010', fill: 'none', stroke: 'rgba(255,255,255,0.55)', 'stroke-width': 7, 'stroke-linecap': 'round' }, s);
      svg('path', { d: 'M240,60 L240,330', fill: 'none', stroke: 'rgba(255,255,255,0.35)', 'stroke-width': 5, 'stroke-linecap': 'round' }, s);
      s.style.filter = `drop-shadow(0 0 ${px(30 * k)} rgba(1,221,214,0.45))`;
      ctx.onFrame((t) => {
        const local = t - cue.t;
        bub.forEach((q, i) => {
          const yy = surface + 40 + ((((q.y - local * q.v) % 1) + 1) % 1) * (1035 - surface - 60);
          be[i].setAttribute('cx', (q.x + Math.sin(local * 1.3 + i) * 6).toFixed(1));
          be[i].setAttribute('cy', yy.toFixed(1));
        });
      });
    }
    if (pr.fog !== false) {
      const fogR = (b.fog && b.fog.regionPx) || { x: [645, 1080], y: [1230, 1920] };
      steam(ctx, h, { seed: 23, color: '97,194,199', opacity: 0.85, blend: 'screen', perColumn: 34, columns: [
        { x: ((fogR.x[0] + fogR.x[1]) / 2) / 1080, spread: (fogR.x[1] - fogR.x[0]) / 1080, size: 0.12, top: fogR.y[0] / 1920, bottom: 1.04 },
        { x: 0.3, spread: 0.5, size: 0.09, top: 0.86, bottom: 1.05 },
      ] });
    }
  };

  // ------------------------------------------------------------------ clay-ui-card (procedural, BEHIND talent)
  // Tone-on-tone orange 3D card (yaw 32°, radius 33, 20 px extrusion) with a debossed label and two dark
  // chips; swings in from edge-on, chips in/out, final swing toward camera x1.4 ending at the cut.
  // props: {label, regionPx:{x:[..],y:[..]}}
  R['clay-ui-card'] = (ctx) => {
    const { cue, tl, gsap } = ctx;
    const k = sc(ctx);
    const spec = specFor(ctx, 'clay-ui-card');
    const pr = cue.props || {};
    const b = deepMerge(spec.build || {}, pr);
    const pin = deepMerge(spec.in || {}, cue.in);
    const loop = deepMerge(spec.loop || {}, cue.loop);
    const reg = b.regionPx || { x: [758, 1080], y: [225, 675] };
    const h = host(ctx, cue.layer || spec.layer || 'behind');
    const cw = 470 * k; const chh = (reg.y[1] - reg.y[0]) * k * 0.86;
    // Geometry matched to ref k_022-k_026: the card faces the presenter (its RIGHT side is nearer the camera) and
    // the vanishing point sits low-left, so the left edge stays near-vertical while the top edge rises ~25 deg
    // and the label ~15 deg to the right (AD: ours read as a flat, near-frontal rectangle with a level label).
    const stage = div({ left: px(reg.x[0] * k), top: px(reg.y[0] * k), width: px(cw), height: px((reg.y[1] - reg.y[0]) * k), perspective: px((b.perspectivePx ?? 760) * k), perspectiveOrigin: b.perspectiveOrigin || '0% 130%', transformStyle: 'preserve-3d' }, h);
    stage.style.filter = `blur(${(b.blurPx ?? 3) * k}px)`;
    const tilt = div({ left: '0px', top: '0px', width: '100%', height: '100%', transformStyle: 'preserve-3d', transform: `rotateZ(${b.rollDeg ?? -3}deg)`, transformOrigin: '0% 50%' }, stage);
    // the low vanishing point lifts the projected card; drop it back so its top-left corner lands at ~17.5 % H
    // (k_024: corner at (71 %, 17.5 %); uncompensated render 13 %)
    const drop = (b.perspectiveDropPx ?? 80) * k;
    const card = div({ left: '0px', top: px(((reg.y[1] - reg.y[0]) * k - chh) / 2 + drop), width: px(cw), height: px(chh), transformStyle: 'preserve-3d', transformOrigin: '0% 50%' }, tilt);
    const ext = (b.extrusionPx ?? 20) * k;
    const rad = px((b.cornerRadiusPx ?? 33) * k);
    // extrusion: dark side, its front-most slices lit (#8A3A0A -> #B0561A rim, AD)
    for (let i = 8; i >= 1; i--) div({ left: '0px', top: '0px', width: '100%', height: '100%', borderRadius: rad, background: i <= 2 ? (i === 1 ? '#B0561A' : '#8A3A0A') : (b.side || '#5B2100'), transform: `translateZ(${px(-ext * i / 8)})` }, card);
    const face = div({ left: '0px', top: '0px', width: '100%', height: '100%', borderRadius: rad, background: `linear-gradient(160deg, #6f2c04 0%, ${b.face || '#652601'} 45%, #5a2001 100%)`,
      boxShadow: `inset ${px(3 * k)} ${px(3 * k)} 0 rgba(176,86,26,0.9), inset ${px(5 * k)} ${px(5 * k)} ${px(4 * k)} rgba(176,86,26,0.45), inset 0 ${px(-3 * k)} ${px(6 * k)} rgba(0,0,0,0.25)` }, card);
    // debossed dash + label: dark #3A1500 with a 1 px lit lip below (#7A3204) and a shadow lip above
    const lip = `0 ${px(1.5 * k)} 0 #7A3204, 0 ${px(-1 * k)} 0 rgba(0,0,0,0.4)`;
    div({ left: px(46 * k), top: px(34 * k), width: px(58 * k), height: px(9 * k), borderRadius: px(5 * k), background: (b.label && b.label.color) || '#3A1500', boxShadow: `0 ${px(1.5 * k)} 0 #7A3204` }, face);
    const lab = div({ left: px(44 * k), top: px(58 * k), whiteSpace: 'nowrap', fontFamily: "'inter', sans-serif", fontWeight: String(b.label?.weight ?? 600), fontSize: px((b.label?.sizePx ?? 36) * k * 1.17), color: (b.label && b.label.color) || '#3A1500', textShadow: lip }, face);
    const labelText = pr.label || 'Chemistry';
    const letters = [...labelText].map((ch) => { const s = document.createElement('span'); s.textContent = ch; s.style.whiteSpace = 'pre'; lab.appendChild(s); return s; });
    const chipW = (b.buttons?.sizePx?.[0] ?? 210) * k * 0.95; const chipH = (b.buttons?.sizePx?.[1] ?? 68) * k;
    const chips = [0, 1].map((i) => div({ left: px(44 * k + i * (chipW + 24 * k)), top: px(chh * 0.56), width: px(chipW), height: px(chipH), borderRadius: px(16 * k), background: (b.buttons && b.buttons.color) || '#090200', boxShadow: `inset 0 ${px(2 * k)} 0 rgba(255,140,70,0.12)` }, face));
    div({ left: px(44 * k), top: px(chh * 0.84), width: px(cw * 0.6), height: px(6 * k), borderRadius: px(3 * k), background: 'rgba(58,21,0,0.65)', boxShadow: `0 ${px(1 * k)} 0 rgba(122,50,4,0.8)` }, face);
    const yaw = -(b.yawDeg ?? 32) * (b.faceSide === 'left' ? -1 : 1) - (b.extraYawDeg ?? 2);
    gsap.set(card, { rotateY: yaw - (pin.from?.rotateY ?? 80) * 0.7 });
    tl.to(card, { rotateY: yaw, duration: sec(pin.durationMs, 0.8), ease: easeOf(ctx, pin.easing), immediateRender: false }, sec(pin.atMs, 0.033));
    gsap.set(letters, { opacity: 0 });
    tl.to(letters, { opacity: 1, duration: 0.1, stagger: sec(loop.labelTypeOnMs, 0.833) / Math.max(1, letters.length), ease: 'none' }, sec(pin.atMs, 0.033) + 0.1);
    gsap.set(chips, { opacity: 0, scale: 0.85, transformOrigin: '50% 50%' });
    tl.to(chips, { opacity: 1, scale: 1, duration: 0.2, stagger: 0.1, ease: 'power2.out' }, sec(loop.chipsInAtMs, 1.4));
    const e = endAt(ctx);
    if (e != null && loop.chipsOutAtMs != null && sec(loop.chipsOutAtMs) < e - 0.3) tl.to(chips, { opacity: 0, duration: 0.1, ease: 'none' }, sec(loop.chipsOutAtMs));
    if (e != null && loop.finalSwingToCamera) {
      const fs = loop.finalSwingToCamera;
      const d = sec(fs.durationMs, 0.467);
      tl.to(card, { rotateY: yaw * 0.35, scale: fs.scale ?? 1.4, duration: d, ease: easeOf(ctx, fs.easing, 'power1.inOut') }, Math.max(0, e - d));
    }
  };
})();
