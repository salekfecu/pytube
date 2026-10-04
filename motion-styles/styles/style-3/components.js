/* Style 3 — "Crimson Halo Glass" components (engine/compositor API, see engine/README.md).
 *
 * Registered ids (style.json graphicComponents + persistent, plus engine helpers):
 *   sunburst-halo        persistent, plate-locked red ray burst centred just above the head (face track, per shot)
 *   plate-vignette       persistent, reference vignette UNDER the captions (behind layer) + talent bottom fade
 *   glass-arch-rise      frosted arch rising from the bottom edge; red ghost word under the glass, thin line on top
 *   glass-pill-smoked    smoked capsule (variant pill1 / pill2) behind a subtitle or the red UI line
 *   glass-pill-outline   hairline CTA capsule (no fill, no blur)
 *   glass-corner-panels  focus wipe: two frosted rounded slabs slide in from opposite corners, drift, dead stop
 *   bell-ring            red outline bell, stroke draw-on + ±11° sway
 *   brand-lockup         wordmark + script accent + Light tagline (world-locked text presets, delivered by the camera)
 *   fg-rose-parallax     procedural defocused glossy roses in the foreground corners, counter-scaling ×2.2
 *   void-pullback        smoky void background + feathered plate-locked studio card for reveal-pullback-void
 *   contact-shadow       grounding ellipse under the chair / feet (plate-locked)
 *   crimson-studio       background replacement from style.json backgrounds (variant wide | mcu | void)
 *   crimson-talent       foreign-footage helper: teal/cyan despill + red edge wrap + feathered plate edges
 *
 * Text builder (MG.textBuilders, engine v2):
 *   karaoke-sweep        the pink light band is built in PX (FWHM 92 px) and driven by the preset's tweened
 *                        background-position; the engine's per-frame gradient re-projection steps aside once the band
 *                        replaces the unit backgrounds.
 *
 * Needs engine v2 (MG.engineFeatures.version >= 2), which natively provides what v1 workarounds here used to do:
 * primed timelines (frame 0 / cut frames), camera cues as cuts, camera-cue `worldRest` (replaces the old
 * `world-rest` helper), unit gating of staggered entrances, gradient-fill glow hosts, scene.persistentProps,
 * ctx.camAt / ctx.camMatrix / ctx.matteCanvas.
 *
 * Determinism: no CSS animations/transitions, timers, Math.random or Date. Everything is a GSAP tween on ctx.tl
 * (time 0 = cue.t) or an ctx.onFrame(t) hook that is a pure function of t. Glass = backdrop-filter; nothing
 * glass-bearing ever gets opacity/filter/mask on an ANCESTOR (that would make the ancestor the backdrop root).
 */
(() => {
  'use strict';
  window.MG = window.MG || {};
  const R = (window.MG.components = window.MG.components || {});
  const S3 = (window.MG.crimson = window.MG.crimson || {});
  const NS = 'http://www.w3.org/2000/svg';
  let uidN = 0;
  const uid = (p) => `s3-${p}-${++uidN}`;

  // ------------------------------------------------------------------ helpers
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
  function deepMerge(a, b) {
    if (!b) return a;
    const o = Array.isArray(a) ? [...a] : { ...a };
    for (const [k, v] of Object.entries(b)) o[k] = isObj(v) && isObj(a && a[k]) ? deepMerge(a[k], v) : v;
    return o;
  }
  function div(css, parent, cls) {
    const d = document.createElement('div');
    d.style.position = 'absolute';
    if (css) for (const [k, v] of Object.entries(css)) {
      if (v == null) continue;
      if (k.includes('-')) d.style.setProperty(k, v);
      else d.style[k] = v;
    }
    if (cls) d.className = cls;
    if (parent) parent.appendChild(d);
    return d;
  }
  function svgEl(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (parent) parent.appendChild(e);
    return e;
  }
  function specFor(ctx, id) {
    if (ctx.spec && ctx.spec.id === id) return ctx.spec;
    return (ctx.style.graphicComponents || []).find((g) => g.id === id) || {};
  }
  const pal = (ctx, k, d) => (ctx.style.palette || {})[k] || d;
  const props = (ctx) => ctx.cue.props || {};
  const endLocal = (ctx) => (ctx.cue.end != null ? ctx.cue.end - ctx.cue.t : null);
  const active = (ctx, t) => t >= ctx.cue.t - 1e-6 && (ctx.cue.end == null || t < ctx.cue.end - 1e-6);
  // show/hide with `visibility` (never opacity on a container that may hold glass), driven by a frame hook, exact to
  // the cue window: the engine's cue lifecycle (display:none) has a ½-frame tolerance, so at a cut that falls between
  // two frames both shots' backdrops would otherwise be displayed on the frame before the cut.
  function window_(ctx, el) {
    el.style.visibility = 'hidden';
    let on = null;
    ctx.onFrame((t) => {
      const a = active(ctx, t);
      if (a !== on) { el.style.visibility = a ? 'visible' : 'hidden'; on = a; }
    });
  }
  // cue.position → css centre in px
  function centrePx(ctx, pos, def) {
    const c = (pos && (pos.centrePct || pos.centerPct)) || [pos?.xPct ?? def[0], pos?.yPct ?? def[1]];
    return [(c[0] / 100) * ctx.W, (c[1] / 100) * ctx.H];
  }

  // 2D affine [a, b, c, d, e, f] (CSS matrix order); camera matrices come from ctx.camMatrix(state)
  function inv(m) {
    const det = m[0] * m[3] - m[1] * m[2];
    const a = m[3] / det, b = -m[1] / det, c = -m[2] / det, d = m[0] / det;
    return [a, b, c, d, -(a * m[4] + c * m[5]), -(b * m[4] + d * m[5])];
  }
  const cssM = (m) => `matrix(${m.map((v) => (Math.abs(v) < 1e-9 ? 0 : +v.toFixed(5))).join(',')})`;
  const apply = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

  // ------------------------------------------------------------------ plate layers
  // A plate-locked layer (gets exactly the footage's camera transform every frame, never the worldRest-relative one), inserted
  // right after the runtime layer `#<after>` (bgW | behindW | frontW). Later calls with the same `after` land
  // directly after it, i.e. BELOW the earlier ones. It is not a child of a …W layer, so no .mg-cam wrapper applies.
  const plateLayers = [];
  function plateLayer(ctx, after = 'bgW', css) {
    const ref = document.getElementById(after) || document.getElementById('bgW');
    const d = div({ left: '0px', top: '0px', width: '100%', height: '100%', transformOrigin: '0 0', pointerEvents: 'none', ...(css || {}) });
    d.className = 'layer s3-plate';
    ref.after(d);
    if (!plateLayers.length) {
      ctx.onFrame(() => {
        const css2 = cssM(ctx.camMatrix(ctx.cam));
        for (const L of plateLayers) L.style.transform = css2;
      });
    }
    plateLayers.push(d);
    return d;
  }
  S3.plateLayer = plateLayer;

  // ------------------------------------------------------------------ karaoke-sweep (text builder)
  // The band is defined in PX (not as % of a 400% background, which made its width scale with the line: FWHM
  // 0.32 x line width = 225-307 px on an 820 px line vs 55-110 px in the reference). Every frame the preset's tweened
  // background-position (from -> to of hold) is read as progress u and re-projected onto each unit: band centre
  // x_c = lerp(lineWidth + startPx, endPx, u) in element px, so it enters just right of the line and ends fully off
  // its left end (the letters are white again before the cut).
  const sweeps = [];
  const BAND_DEF = { startPx: 50, endPx: -105, stops: [[0, 'rgba(240,48,57,0.85)'], [22, 'rgba(232,34,44,0.74)'], [46, 'rgba(222,96,96,0.43)'], [70, 'rgba(208,137,123,0.14)'], [95, 'rgba(208,137,123,0)']] };
  function bandGradient(w, band) {
    const c = 2 * w;
    const st = band.stops;
    const parts = ['rgba(208,137,123,0) 0px'];
    for (let k = st.length - 1; k > 0; k--) parts.push(`${st[k][1]} ${(c - st[k][0]).toFixed(1)}px`);
    for (let k = 0; k < st.length; k++) parts.push(`${st[k][1]} ${(c + st[k][0]).toFixed(1)}px`);
    parts.push(`rgba(208,137,123,0) ${(4 * w).toFixed(1)}px`);
    return `linear-gradient(90deg, ${parts.join(', ')})`;
  }
  function installSweep(el, pr) {
    if (!el || !el.dataset.gradient || el.dataset.s3sweep) return;
    el.dataset.s3sweep = '1';
    const band = { ...BAND_DEF, ...(pr.bandPx || {}) };
    const hold = pr.hold || {};
    const p0 = parseFloat((hold.from || {}).backgroundPosition ?? '30%') / 100;
    const p1 = parseFloat((hold.to || {}).backgroundPosition ?? '70%') / 100;
    const units = [...el.querySelectorAll('.mg-word, .mg-letter')].filter((u) => !u.querySelector('.mg-letter'));
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    // the sweep clone has no unit transforms (opacity-only preset), so rect deltas = layout offsets
    const er = el.getBoundingClientRect();
    const sx = er.width / Math.max(1, w);
    const off = units.map((u) => { const r = u.getBoundingClientRect(); return [(r.left - er.left) / sx, (r.top - er.top) / sx]; });
    const grad = bandGradient(w, band);
    units.forEach((u) => {
      u.style.backgroundImage = grad;
      u.style.backgroundSize = `${4 * w}px ${h}px`;
      u.style.backgroundRepeat = 'no-repeat';
      u.style.webkitBackgroundClip = 'text';
      u.style.backgroundClip = 'text';
      u.style.color = 'transparent';
    });
    const s = { el, units, off, w, band, p0, p1, last: null };
    sweeps.push(s);
    placeBand(s, 0);
  }
  function placeBand(s, u) {
    const xc = s.w + s.band.startPx + (s.band.endPx - s.w - s.band.startPx) * u;
    const x0 = xc - 2 * s.w; // left edge of the 4w gradient image, element px
    s.units.forEach((un, i) => { un.style.backgroundPosition = `${(x0 - s.off[i][0]).toFixed(1)}px ${-s.off[i][1]}px`; });
  }
  function syncSweeps() {
    for (const s of sweeps) {
      const bp = s.el.style.backgroundPosition || '';
      if (bp === s.last) continue;
      s.last = bp;
      const p = bp ? parseFloat(bp) / 100 : s.p0;
      placeBand(s, clamp((p - s.p0) / ((s.p1 - s.p0) || 1), 0, 1));
    }
  }
  // generic text build, then (after fonts + the engine's gradient split) the px band replaces the unit backgrounds
  let sweepHook = false;
  const TB = (window.MG.textBuilders = window.MG.textBuilders || {});
  TB['karaoke-sweep'] = (ctx) => {
    const r = ctx.makeTextBase(ctx.cue, ctx.tl, ctx.opts);
    const pr = ctx.preset || {};
    ctx.registerPostLayout(() => installSweep(r && r.el, pr));
    if (!sweepHook) { sweepHook = true; ctx.onFrame(syncSweeps); }
    return r;
  };

  // ------------------------------------------------------------------ face / shot anchors
  // Splits the face track into shots (cuts from meta, props.cuts in seconds, or jumps in the track) and returns
  // one stable anchor per shot: the halo is plate-locked (set-locked), not head-tracked.
  function shotAnchors(ctx, p = {}) {
    const C = window.__MG__ || {};
    const F = C.faces || [];
    const W = ctx.W, H = ctx.H, FPS = ctx.FPS;
    if (!F.length) return [{ i0: 0, i1: 1e9, cx: W * 0.5, top: H * 0.3, w: W * 0.25, h: H * 0.14 }];
    const cuts = new Set([0]);
    for (const c of (C.meta && C.meta.cuts) || []) cuts.add(Math.round(typeof c === 'number' && c < 1000 && !Number.isInteger(c) ? c * FPS : c));
    for (const s of p.cuts || []) cuts.add(Math.round(s * FPS));
    if (p.autoCuts !== false) {
      for (let i = 1; i < F.length; i++) {
        const a = F[i - 1], b = F[i];
        const d = Math.hypot(a.x + a.w / 2 - (b.x + b.w / 2), a.y + a.h / 2 - (b.y + b.h / 2));
        if (d > 0.045 || Math.abs(b.w - a.w) / Math.max(1e-3, a.w) > 0.16) cuts.add(i);
      }
    }
    const list = [...cuts].filter((i) => i >= 0 && i < F.length).sort((a, b) => a - b);
    // merge very short segments (face-detector glitches)
    const segs = [];
    list.forEach((i0, k) => {
      const i1 = k + 1 < list.length ? list[k + 1] : F.length;
      if (segs.length && i1 - i0 < 6) segs[segs.length - 1].i1 = i1;
      else segs.push({ i0, i1 });
    });
    const med = (arr) => { const s = [...arr].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
    return segs.map((s) => {
      const fs = F.slice(s.i0, s.i1);
      const w = med(fs.map((f) => f.w)) * W;
      const h = med(fs.map((f) => f.h)) * H;
      return { ...s, cx: med(fs.map((f) => f.x + f.w / 2)) * W, top: med(fs.map((f) => f.y)) * H - 0.25 * h, w, h };
    });
  }
  S3.shotAnchors = shotAnchors;
  // persistent components (style.json "persistent") are sized per scene with scene.persistentProps[<id>]: the engine
  // merges that object into the persistent cue's props
  const anchorAt = (anchors, i) => anchors.find((a) => i >= a.i0 && i < a.i1) || anchors[anchors.length - 1];

  // ------------------------------------------------------------------ crimson-studio (background replacement)
  // props.variant: wide | mcu | void (style.json backgrounds) or props.gradient. Screen-locked: a smooth seamless
  // wall reads the same at any zoom; the plate-locked halo carries the camera motion.
  const studioWins = [];
  const studioAt = (t) => studioWins.find(([a, b]) => t >= a - 1e-6 && t < b - 1e-6);
  const studioActive = (t) => !!studioAt(t);
  S3.studioActive = studioActive;
  R['crimson-studio'] = (ctx) => {
    const p = props(ctx);
    studioWins.push([ctx.cue.t, ctx.cue.end ?? 1e9, p.variant || 'mcu']);
    const bgs = ctx.style.backgrounds || {};
    const key = { wide: 'redStudioWide', mcu: 'redStudioMcu', void: 'voidExtension' }[p.variant || 'mcu'] || p.variant;
    const grad = p.gradient || (bgs[key] && bgs[key].gradient) || pal(ctx, 'wallMid', '#4E0005');
    const el = div({ left: '0px', top: '0px', width: '100%', height: '100%', background: grad });
    if (p.blurPx) el.style.filter = `blur(${p.blurPx}px)`;
    (p.layer ? ctx.layer(p.layer) : ctx.layers.bg).appendChild(el);
    window_(ctx, el);
  };

  // ------------------------------------------------------------------ sunburst-halo (persistent, plate-locked)
  // The rays are rasterised once per shot anchor (SVG -> bitmap) and drawn every frame into a screen-space canvas
  // with the footage's camera matrix (plate-locked), then the talent coverage is cut out of them
  // (destination-out with the raw camera-transformed matte), so the rays never show through the presenter, not even
  // where crimson-talent feathers the plate edges. Sizing:
  //   props.restScale  = the camera scale at which this footage plays as the reference WIDE (e.g. 0.53 for a tight
  //                      1080x1920 MCU plate). The halo then has the reference wide's SCREEN size at that scale
  //                      (inner 159 / outer 515 / width 19x0.7 px) and scales with every camera move from there.
  //   (no restScale)   = legacy: radii follow the face-track head width (props.scale multiplies it).
  R['sunburst-halo'] = (ctx) => {
    const { cue, W, H, FPS } = ctx;
    const spec = specFor(ctx, 'sunburst-halo');
    const p = props(ctx);
    const b = deepMerge(spec.build || {}, p);
    const anchors = p.anchors
      ? p.anchors.map((a) => ({ i0: Math.round((a.t0 ?? 0) * FPS), i1: a.t1 != null ? Math.round(a.t1 * FPS) : 1e9, cx: a.cx, top: a.top ?? a.cy, w: a.headWidthPx ?? a.w ?? 160 }))
      : shotAnchors(ctx, p);
    // additive by default: rays add ~+30 R over whatever wall / vignette is underneath (#230303 plus-lighter = +34 R)
    const fill = p.color || (p.blend === 'normal' ? (b.fill && b.fill.normal) || '#6B0505' : '#1E0303');
    const blend = p.blend || 'plus-lighter';
    const layer = div({ left: '0px', top: '0px', width: '100%', height: '100%', pointerEvents: 'none', mixBlendMode: blend === 'normal' ? 'normal' : blend });
    layer.className = 'layer s3-halo';
    (document.getElementById('bgW') || ctx.layers.bg).after(layer);
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    Object.assign(cv.style, { position: 'absolute', left: '0px', top: '0px', width: '100%', height: '100%', display: 'block' });
    layer.appendChild(cv);
    const hx = cv.getContext('2d');
    S3.haloLayer = layer;
    S3.haloCtx = hx;
    const ref = 135; // reference wide-shot head width @1080 (inner r 159 = 1.18 hw)
    const res = p.resolution ?? 0.75; // bitmap px per plate px (the rays are soft; 0.75 is plenty)
    const items = anchors.map((a) => {
      const u = p.restScale ? 1 / p.restScale : (a.w * (p.scale ?? 1)) / ref;
      const hw = ref * u;
      const cx = a.cx + (p.offsetXPx ?? 0);
      const cy = a.top - 7 * u + (p.offsetYPx ?? 0);
      const widthK = p.widthScale ?? 0.62; // reference rays read ~12-17 px wide in the wide (19 px spec incl. soft edge)
      const blur = Math.max(1.5, (b.edgeBlurPx ?? 4) * u * widthK * 0.6);
      const r = ctx.rng((b.pitchDeg && b.pitchDeg.jitterSeed) ?? 3);
      const nRays = p.rays ?? b.rayCount ?? 45;
      const inner = b.innerRadius || {};
      const outer = b.outerRadius || {};
      const iMed = (inner.medianPx ?? 159) / ref, iLo = ((inner.rangePx || [119, 260])[0]) / ref, iHi = ((inner.rangePx || [119, 260])[1]) / ref;
      const oMed = (outer.medianPx ?? 515) / ref, oLo = ((outer.rangePx || [362, 629])[0]) / ref, oHi = ((outer.rangePx || [362, 629])[1]) / ref;
      const skew = (lo, med, hi) => { const v = r(); return v < 0.5 ? lo + (med - lo) * Math.sqrt(v * 2) : med + (hi - med) * (1 - Math.sqrt((1 - v) * 2)); };
      // pitches 6-11 deg (median 8) normalised to a full turn
      const pitches = Array.from({ length: nRays }, () => skew(6, 8, 11));
      const sum = pitches.reduce((s, v) => s + v, 0);
      let ang = r() * 360;
      const width = (b.rayWidthPx ?? 19) * u * widthK;
      const dashP = (b.dashes && b.dashes.probability) ?? 0.5;
      const gapLo = ((b.dashes && b.dashes.gapPx) || [15, 30])[0] * u, gapHi = ((b.dashes && b.dashes.gapPx) || [15, 30])[1] * u;
      const Rb = oHi * hw + width * 1.2 + blur * 3 + 4; // bitmap half-size (plate px) around the centre
      let lines = '';
      for (let i = 0; i < nRays; i++) {
        ang += (pitches[i] * 360) / sum;
        const a0 = (ang * Math.PI) / 180;
        const ri = skew(iLo, iMed, iHi) * hw;
        const ro = Math.max(ri + width * 3, skew(oLo, oMed, oHi) * hw);
        const dx = Math.cos(a0), dy = Math.sin(a0);
        const wv = width * (0.85 + r() * 0.3);
        let segs = [[ri, ro]];
        if (r() < dashP) {
          // 2-3 dashes: cut points spread along the ray, each gap 15-30 px visible (+ cap width, round caps eat into it)
          const n = r() < 0.6 ? 2 : 3;
          const len = ro - ri;
          const cuts2 = Array.from({ length: n - 1 }, (_, k2) => ri + len * ((k2 + 0.6 + r() * 0.8) / n)).sort((a1, a2) => a1 - a2);
          segs = [];
          let s0 = ri;
          for (const c of cuts2) {
            const gap = gapLo + r() * (gapHi - gapLo) + wv;
            if (c - gap / 2 - s0 > wv) segs.push([s0, c - gap / 2]);
            s0 = c + gap / 2;
          }
          if (ro - s0 > wv) segs.push([s0, ro]);
          if (!segs.length) segs = [[ri, ro]];
        }
        for (const [s0, s1] of segs) {
          lines += `<line x1="${(Rb + dx * s0).toFixed(1)}" y1="${(Rb + dy * s0).toFixed(1)}" x2="${(Rb + dx * s1).toFixed(1)}" y2="${(Rb + dy * s1).toFixed(1)}" stroke-width="${wv.toFixed(1)}"/>`;
        }
      }
      const px = Math.ceil(2 * Rb * res);
      // radial falloff: the reference rays fade toward their outer ends (upper-half ray energy by radius, f268/f604:
      // 6.9 / 6.4 / 4.8 / 2.1 / 0.9 at r 225 / 300 / 375 / 450 / 525 px) although single rays reach r 629
      const fo = p.falloff === false ? null : { from: (p.falloffFromPx ?? 330) * u, to: oHi * hw, floor: p.falloffFloor ?? 0.2 };
      const mask = fo ? `<radialGradient id="f" gradientUnits="userSpaceOnUse" cx="${Rb.toFixed(1)}" cy="${Rb.toFixed(1)}" r="${fo.to.toFixed(1)}">`
        + `<stop offset="0" stop-color="#fff"/><stop offset="${(fo.from / fo.to).toFixed(3)}" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="${fo.floor}"/></radialGradient>`
        + `<mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="${(2 * Rb).toFixed(1)}" height="${(2 * Rb).toFixed(1)}"><rect width="${(2 * Rb).toFixed(1)}" height="${(2 * Rb).toFixed(1)}" fill="url(#f)"/></mask>` : '';
      const svg = `<svg xmlns="${NS}" width="${px}" height="${px}" viewBox="0 0 ${(2 * Rb).toFixed(1)} ${(2 * Rb).toFixed(1)}">`
        + `<defs><filter id="b" filterUnits="userSpaceOnUse" x="0" y="0" width="${(2 * Rb).toFixed(1)}" height="${(2 * Rb).toFixed(1)}"><feGaussianBlur stdDeviation="${blur.toFixed(2)}"/></filter>${mask}</defs>`
        + `<g${fo ? ' mask="url(#m)"' : ''}><g filter="url(#b)" stroke="${fill}" stroke-linecap="round" fill="none">${lines}</g></g></svg>`;
      return { cx, cy, Rb, svg, img: null };
    });
    const matte = ctx.meta && ctx.meta.matte ? ctx.matteCanvas : null;
    ctx.onFrame(async (t) => {
      hx.setTransform(1, 0, 0, 1, 0, 0);
      hx.clearRect(0, 0, W, H);
      if (!active(ctx, t)) return;
      const it = items[anchors.indexOf(anchorAt(anchors, Math.round(t * FPS)))];
      if (!it) return;
      if (!it.img) {
        it.img = new Image();
        it.img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(it.svg);
        await it.img.decode();
      }
      const m = ctx.camMatrix(ctx.cam);
      hx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
      hx.drawImage(it.img, it.cx - it.Rb, it.cy - it.Rb, 2 * it.Rb, 2 * it.Rb);
      hx.setTransform(1, 0, 0, 1, 0, 0);
      // occlusion: ctx.matteCanvas is this frame's raw camera-transformed matte (full presenter coverage, before
      // crimson-talent chokes / feathers the talent canvas)
      if (p.occlude !== false && matte) {
        hx.globalCompositeOperation = 'destination-out';
        hx.drawImage(matte, 0, 0);
        hx.globalCompositeOperation = 'source-over';
      }
    });
  };

  // ------------------------------------------------------------------ plate-vignette (persistent)
  // Behind-layer radial + top band (under captions, over backdrop/halo) and a bottom fade on the talent.
  R['plate-vignette'] = (ctx) => {
    const p = props(ctx);
    const radial = p.radial || 'radial-gradient(ellipse 70% 55% at 50% 42%, rgba(12,0,0,0) 45%, rgba(12,0,0,0.80) 100%)';
    const top = p.topBand || 'linear-gradient(180deg, rgba(6,0,0,0.6) 0%, rgba(6,0,0,0) 14%)';
    const el = div({ left: '0px', top: '0px', width: '100%', height: '100%', background: `${top}, ${radial}`, pointerEvents: 'none' });
    (p.lock === 'plate' ? plateLayer(ctx, 'behindW') : ctx.layers.behind).appendChild(el);
    window_(ctx, el);
    // style.json backgrounds were fitted to graded reference frames (vignette included): over a crimson-studio
    // backdrop the vignette only adds the missing falloff, so it runs at props.overStudio strength — a number, or
    // per studio variant ({wide, mcu, void}). MCU default 0.25: at 0.4 the MCU wall read R 56-78 vs 77-89 (ref f106).
    const ovs = p.overStudio ?? { wide: 0.4, mcu: 0.25, void: 0.4 };
    const overFor = (v) => (typeof ovs === 'number' ? ovs : ovs[v] ?? 0.4);
    // optional side falloff (props.sides: css gradient, or true for the default) at full strength over wides, so a
    // plate pulled back below 100% dissolves into dark wall instead of a lit one
    const sidesEl = p.sides ? div({ left: '0px', top: '0px', width: '100%', height: '100%', pointerEvents: 'none',
      background: p.sides === true ? 'linear-gradient(90deg, rgba(8,0,0,0.62) 0%, rgba(8,0,0,0.30) 12%, rgba(8,0,0,0) 26%, rgba(8,0,0,0) 74%, rgba(8,0,0,0.30) 88%, rgba(8,0,0,0.62) 100%)' : p.sides }) : null;
    if (sidesEl) el.parentElement.insertBefore(sidesEl, el);
    const sideVariants = p.sidesOn || ['wide'];
    let lastOp = -1;
    let lastSide = null;
    ctx.onFrame((t) => {
      const w = studioAt(t);
      const op = w ? overFor(w[2]) : 1;
      if (op !== lastOp) { el.style.opacity = op; lastOp = op; }
      if (sidesEl) {
        const s = active(ctx, t) && !!w && sideVariants.includes(w[2]);
        if (s !== lastSide) { sidesEl.style.visibility = s ? 'visible' : 'hidden'; lastSide = s; }
      }
    });
    const mask = p.talentMask === false ? null : p.talentMask || 'linear-gradient(180deg, #000 0%, #000 86%, rgba(0,0,0,0.55) 100%)';
    const tw = document.getElementById('talentWrap');
    let on = null;
    if (mask && tw) ctx.onFrame((t) => {
      const a = active(ctx, t);
      if (a === on) return;
      on = a;
      tw.style.webkitMaskImage = a ? mask : '';
      tw.style.maskImage = a ? mask : '';
    });
  };

  // ------------------------------------------------------------------ contact-shadow (plate-locked)
  R['contact-shadow'] = (ctx) => {
    const p = props(ctx);
    const spec = specFor(ctx, 'contact-shadow');
    const b = deepMerge(spec.build || {}, p);
    const f = ctx.face(ctx.cue.t);
    const w = p.widthPx ?? f.w * 2.6 * ((b.widthPctOfTalent ?? 120) / 100);
    const h = b.heightPx ?? 60;
    const [cx, cy] = p.position ? centrePx(ctx, p.position, [50, 95]) : [f.cx, ctx.H * 0.95];
    const layer = plateLayer(ctx, 'behindW');
    const el = div({ left: `${cx - w / 2}px`, top: `${cy - h / 2}px`, width: `${w}px`, height: `${h}px`, borderRadius: '50%', background: b.colour || b.color || 'rgba(0,0,0,0.65)', filter: `blur(${b.blurPx ?? 24}px)` }, layer);
    window_(ctx, el);
  };

  // ------------------------------------------------------------------ talent edge feather + despill
  // Fades the talent towards the edges of the camera-transformed plate rectangle (screen px), so a plate that is
  // pulled back below 100% never shows hard frame edges through the matte.
  function feather(tcx, W, H, m, f, rect) {
    const rc = rect || [0, 0, W, H];
    const [x0, y0] = apply(m, rc[0], rc[1]);
    const [x1, y1] = apply(m, rc[2], rc[3]);
    const L = Math.min(x0, x1), Rr = Math.max(x0, x1), T = Math.min(y0, y1), B = Math.max(y0, y1);
    const ops = [];
    if (f.side && L > -1) ops.push(['h', L, L + f.side, 0]);
    if (f.side && Rr < W + 1) ops.push(['h', Rr, Rr - f.side, 0]);
    if (f.bottom && B < H + 1) ops.push(['v', B, B - f.bottom, 0]);
    if (f.top && T > -1) ops.push(['v', T, T + f.top, 0]);
    if (!ops.length) return;
    tcx.save();
    tcx.globalCompositeOperation = 'destination-in';
    for (const [dir, a0, a1] of ops) {
      const g = dir === 'h' ? tcx.createLinearGradient(a0, 0, a1, 0) : tcx.createLinearGradient(0, a0, 0, a1);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(0.55, 'rgba(0,0,0,0.6)');
      g.addColorStop(1, 'rgba(0,0,0,1)');
      tcx.fillStyle = g;
      tcx.fillRect(0, 0, W, H);
    }
    tcx.restore();
  }
  S3.feather = feather;

  R['crimson-talent'] = (ctx) => {
    const { cue, W, H } = ctx;
    const p = cue.props || {};
    const tc = document.getElementById('talent');
    const tcx = tc && tc.getContext('2d');
    const work = document.createElement('canvas');
    let wcx = null;
    // edge proximity: the matte's opaque rim often still carries the original wall (doctor ear / neck: alpha
    // 234-255, colour (116,99,107)), so alpha alone cannot find it. A blurred copy of the matte gives a graded
    // distance-to-edge (1 at the boundary -> 0 a few px inside) for the recolour, and a ~1 px erosion.
    const blurC = document.createElement('canvas');
    let bcx = null;
    // colour decontamination: interior pixels (opaque and away from the ramp) are blurred into a "nearest interior
    // colour" map; every non-interior pixel takes that colour before the darken + wrap, so a ramp that still
    // carries the bright teal wall turns into the talent's own (ear / skin / hair) colour, then into a warm rim
    const intC = document.createElement('canvas');
    const intB = document.createElement('canvas');
    let icx = null, ibx = null, intImg = null;
    const deco = p.decontaminate ?? 0.9;
    const decoBlur = p.decontaminateBlurPx ?? 3;
    const edgeBlur = p.edgeBlurPx ?? 3;
    const edgeGain = p.edgeGain ?? 2.2;
    const erode = p.erode ?? true;
    const ds = p.despill ?? 0.9;
    const wrap = p.wrap ?? 0.5;
    const lo = clamp(p.choke ?? 0.4, 0, 0.9) * 255; // eat the outer soft edge of the half-res matte (teal fringe)
    const edgeDark = p.edgeDarken ?? 0.5;
    const span = 255 - lo;
    const wc = p.wrapColor || [92, 4, 10];
    const fz = typeof p.feather === 'number' ? { side: p.feather, bottom: p.feather * 1.3, top: 0 } : { side: 150, bottom: 220, top: 0, ...(p.feather || {}) };
    const body = p.bodyDespill ?? 0.25; // teal ambient on skin / scrubs
    // per-plate exposure trim after the style grade (grade.css is tuned to the reference exposure): CSS filter on
    // #talentWrap, e.g. "brightness(1.25) saturate(0.88)" to bring skin peaks to the Y 165-175 target
    const tw = document.getElementById('talentWrap');
    let fOn = null;
    ctx.onFrame((t) => {
      const a = active(ctx, t);
      if (p.filter && tw && a !== fOn) { tw.style.filter = a ? p.filter : ''; fOn = a; }
      if (!a || !tcx) return;
      if (ds || wrap || body) {
        if (!wcx) { work.width = tc.width; work.height = tc.height; wcx = work.getContext('2d', { willReadFrequently: true }); }
        wcx.globalCompositeOperation = 'copy';
        wcx.drawImage(tc, 0, 0);
        const img = wcx.getImageData(0, 0, work.width, work.height);
        const d = img.data;
        if (!bcx) { blurC.width = tc.width; blurC.height = tc.height; bcx = blurC.getContext('2d', { willReadFrequently: true }); }
        bcx.clearRect(0, 0, blurC.width, blurC.height);
        bcx.filter = `blur(${edgeBlur}px)`;
        bcx.drawImage(tc, 0, 0);
        bcx.filter = 'none';
        const B = bcx.getImageData(0, 0, blurC.width, blurC.height).data;
        let IB = null;
        if (deco) {
          if (!icx) {
            intC.width = intB.width = tc.width; intC.height = intB.height = tc.height;
            icx = intC.getContext('2d', { willReadFrequently: true });
            ibx = intB.getContext('2d', { willReadFrequently: true });
            intImg = icx.createImageData(tc.width, tc.height);
          }
          const I = intImg.data;
          for (let i = 0; i < d.length; i += 4) {
            if (d[i + 3] >= 250 && B[i + 3] >= 247) { I[i] = d[i]; I[i + 1] = d[i + 1]; I[i + 2] = d[i + 2]; I[i + 3] = 255; } else I[i + 3] = 0;
          }
          icx.putImageData(intImg, 0, 0);
          ibx.clearRect(0, 0, intB.width, intB.height);
          ibx.filter = `blur(${decoBlur}px)`;
          ibx.drawImage(intC, 0, 0);
          ibx.filter = 'none';
          IB = ibx.getImageData(0, 0, intB.width, intB.height).data;
        }
        for (let i = 0; i < d.length; i += 4) {
          let a = d[i + 3];
          if (a === 0) continue;
          if (lo && a < 255) {
            // runtime draws matte x plate premultiplied-free: colour is unaffected, only coverage is choked
            a = ((a - lo) * 255) / span;
            if (a <= 0) { d[i + 3] = 0; continue; }
          }
          const bA = B[i + 3] / 255;
          if (erode && bA < 0.65) {
            const x = clamp((bA - 0.5) / 0.15, 0, 1);
            a *= x * x * (3 - 2 * x);
            if (a < 1) { d[i + 3] = 0; continue; }
          }
          const interior = d[i + 3] >= 250 && B[i + 3] >= 247;
          d[i + 3] = a;
          let r = d[i], g = d[i + 1], bb = d[i + 2];
          if (IB && !interior && IB[i + 3] > 6) {
            const k = deco * Math.min(1, IB[i + 3] / 40);
            r += (IB[i] - r) * k; g += (IB[i + 1] - g) * k; bb += (IB[i + 2] - bb) * k;
          }
          const edge = Math.max(a < 250 ? 1 - a / 255 : 0, clamp((1 - bA) * edgeGain, 0, 1));
          const se = Math.sqrt(edge);
          const k = ds * se + body;
          const sp = Math.max(g, bb) - r * 0.9;
          if (sp > 0 && k > 0) {
            const kk = Math.min(1, k);
            g -= Math.max(0, g - r * 0.9) * kk;
            bb -= Math.max(0, bb - r * 0.9) * kk;
          }
          if (wrap && edge > 0) {
            // edge pixels are a mix of talent and the (bright teal) original wall: after despill they turned a light
            // lavender-grey rim on the dark red set. Darken them by edge strength, then pull toward the red wrap
            // colour, so the cut-out edge reads warm red-rimmed like the reference (hair rim #712d10 / wall #4e0005).
            const dk = 1 - edgeDark * se;
            r *= dk; g *= dk; bb *= dk;
            const w = Math.min(1, wrap * se);
            r += (wc[0] - r) * w; g += (wc[1] - g) * w; bb += (wc[2] - bb) * w;
          }
          d[i] = r; d[i + 1] = g; d[i + 2] = bb;
        }
        wcx.putImageData(img, 0, 0);
        tcx.save();
        tcx.globalCompositeOperation = 'copy';
        tcx.drawImage(work, 0, 0);
        tcx.restore();
      }
      if (p.feather !== false) feather(tcx, W, H, ctx.camMatrix(ctx.cam), fz);
    });
  };

  // ------------------------------------------------------------------ glass helpers
  // frosted glass element: backdrop blur + translucent fill + hairline + specular rim (gradient border via mask)
  function glass(css, opt = {}) {
    const el = div({ ...css, background: opt.fill ?? 'rgba(0,0,0,0.12)', boxSizing: 'border-box' });
    if (opt.blurPx) {
      const f = `blur(${opt.blurPx}px)${opt.backdropExtra ? ' ' + opt.backdropExtra : ''}`;
      el.style.backdropFilter = f;
      el.style.webkitBackdropFilter = f;
    }
    if (opt.stroke) el.style.border = `${opt.stroke.widthPx}px solid ${opt.stroke.color}`;
    if (opt.specular) {
      // specular rim: brighter top-right / bottom-left arcs over the hairline
      const rim = div({ left: `${-(opt.stroke?.widthPx ?? 0)}px`, top: `${-(opt.stroke?.widthPx ?? 0)}px`, right: `${-(opt.stroke?.widthPx ?? 0)}px`, bottom: `${-(opt.stroke?.widthPx ?? 0)}px`,
        borderRadius: 'inherit', border: `${opt.specular.widthPx ?? opt.stroke?.widthPx ?? 2}px solid transparent`, boxSizing: 'border-box',
        background: `${opt.specular.gradient} border-box`, pointerEvents: 'none' }, el);
      const mk = 'linear-gradient(#000 0 0) padding-box, linear-gradient(#000 0 0)';
      rim.style.webkitMask = mk;
      rim.style.webkitMaskComposite = 'xor';
      rim.style.mask = mk;
      rim.style.maskComposite = 'exclude';
    }
    if (opt.inset) el.style.boxShadow = opt.inset;
    return el;
  }
  S3.glass = glass;
  // z: undefined (on top) | 'below-previous' (directly under the element created by the previous cue, e.g. a pill
  // that must sit under the hero it backs) | 'bottom' (under everything already in the layer)
  function zInsert(layer, el, z) {
    if (z === 'bottom') layer.insertBefore(el, layer.firstChild);
    else if (z === 'below-previous' && layer.lastElementChild) layer.insertBefore(el, layer.lastElementChild);
    else layer.appendChild(el);
  }
  S3.zInsert = zInsert;
  const SPEC_RIM = 'linear-gradient(118deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 30%, rgba(255,255,255,0.03) 55%, rgba(255,255,255,0.30) 78%, rgba(255,255,255,0.55) 92%, rgba(255,255,255,0.20) 100%)';

  // sub-timeline text built by a component (positioned inside `parent`)
  function subText(ctx, parent, textCue, offset) {
    const sub = ctx.gsap.timeline();
    const c = { type: 'text', ...textCue, t: ctx.cue.t + offset };
    if (c.end == null && ctx.cue.end != null) c.end = ctx.cue.end;
    const r = ctx.makeText(c, sub, { parent });
    ctx.tl.add(sub, offset);
    return r;
  }

  // ------------------------------------------------------------------ glass-arch-rise
  R['glass-arch-rise'] = (ctx) => {
    const { cue, tl, W, H, gsap, ease, ms } = ctx;
    const spec = specFor(ctx, 'glass-arch-rise');
    const p = cue.props || {};
    const b = deepMerge(spec.build || {}, p);
    const pin = deepMerge(spec.in || {}, cue.in);
    const host = ctx.layer(cue.layer || spec.layer || 'front');
    const w = b.widthPx ?? 850;
    const x0 = b.xPx ? b.xPx[0] : (W - w) / 2;
    const top = b.topYPx ?? 1033;
    const h = Math.max(b.heightPx ?? 947, H - top + 40);
    const r = b.radiusPx ?? w / 2;
    const ox = x0 + w / 2;
    const oy = top + h; // bottom centre (legs run off the frame)
    const riders = [];
    const rider = () => { const d = div({ left: '0px', top: '0px', width: '100%', height: '100%', transformOrigin: `${ox}px ${oy}px`, pointerEvents: 'none' }, host); riders.push(d); return d; };
    // 1) ghost word UNDER the glass
    const ghostRide = rider();
    const g = (b.contents || []).find((c) => c.fontRole === 'ghostMegaArch') || {};
    const ghostText = p.ghost ?? null;
    let ghostEl = null;
    if (ghostText) {
      ghostEl = document.createElement('div');
      ghostEl.className = 'mg-text s3-arch-ghost';
      ghostEl.dir = 'rtl';
      ctx.applyTextStyle(ghostEl, { fontRole: p.ghostRole || 'ghostMegaArch', ...(p.ghostStyle || {}) });
      if (!p.ghostStyle) {
        // reference f31: the arch ghost is a translucent, top-lit red glow (#E2271F / #C33A3E) through which the
        // talent's legs and hands still read. An opaque #B70F16 -> #7A0008 fill read as a dull red title (demo f45
        // p95 #a41a1a, talent hidden): lighter top-lit gradient, 4 px soft edge, screen-blended at 0.7 so the plate
        // shows through the glyphs (mix-blend-mode sits on the rider: its transform makes it the blend group).
        const hi = pal(ctx, 'ghostArchHighlight', '#E2271F');
        Object.assign(ghostEl.style, { color: 'transparent', backgroundImage: `linear-gradient(176deg, ${hi} 0%, #C8141A 55%, #9A0A10 100%)`,
          webkitBackgroundClip: 'text', backgroundClip: 'text', filter: `blur(${p.ghostBlurPx ?? 4}px)` });
        ghostEl.style.textShadow = 'none';
        ghostRide.style.filter = 'drop-shadow(0 0 18px rgba(226,39,31,0.22))';
        ghostRide.style.mixBlendMode = p.ghostBlend || 'screen';
      }
      ctx.place(ghostEl, { centrePct: p.ghostPos || g.position || [53.9, 66.4] });
      ghostEl.style.whiteSpace = 'nowrap';
      ghostEl.textContent = ghostText;
      ghostRide.appendChild(ghostEl);
      const gi = pin.ghostWord || { delayMs: 160, durationMs: 120 };
      gsap.set(ghostEl, { opacity: 0 });
      tl.to(ghostEl, { opacity: p.ghostOpacity ?? 0.7, duration: ms(gi.durationMs, 0.12), ease: 'none', immediateRender: false }, ms(gi.delayMs, 0.16));
    }
    // 2) the glass arch
    const arch = glass({ left: `${x0}px`, top: `${top}px`, width: `${w}px`, height: `${h}px`, borderRadius: `${r}px ${r}px 0 0`, transformOrigin: '50% 100%' }, {
      fill: b.fill || 'rgba(0,0,0,0.10)', blurPx: b.backdropBlurPx ?? 5, backdropExtra: p.backdropExtra || 'contrast(0.92) brightness(1.04)',
      stroke: b.stroke || { widthPx: 3, color: 'rgba(255,255,255,0.37)' },
    });
    arch.style.borderBottom = 'none';
    // frosted body: over dark scrubs / a feathered plate the 5 px blur has little texture to act on and the glass
    // read as a bare hairline (AD review). A faint white body + a soft top-lit inner gradient lift the interior
    // ~4-6 Y (reference black lift min luma 2 -> 6) so the slab reads as material.
    if (p.body !== false) {
      div({ left: '0px', top: '0px', right: '0px', bottom: '0px', borderRadius: 'inherit', pointerEvents: 'none',
        background: p.bodyFill || 'linear-gradient(180deg, rgba(255,236,232,0.075) 0%, rgba(255,236,232,0.035) 28%, rgba(255,236,232,0.02) 60%, rgba(255,236,232,0.015) 100%)' }, arch);
    }
    host.insertBefore(arch, null);
    // 3) crisp thin line on top, riding with the arch
    const lineRide = rider();
    if (p.line) {
      const lc = typeof p.line === 'string' ? { text: p.line } : p.line;
      const pos = lc.position || { centrePct: (b.contents || []).find((c) => c.preset)?.position || [51.3, 82.4] };
      subText(ctx, lineRide, { preset: 'typewriter-thin-kashida', ...lc, position: pos, out: null }, ms(lc.delayMs, 0.24));
    }
    // in: rise + scale from the bottom centre (all three move as one group)
    const from = pin.from || { y: 380, scale: 0.75 };
    const to = pin.to || { y: 0, scale: 1 };
    const group = [ghostRide, arch, lineRide];
    gsap.set(group, { visibility: 'hidden' });
    tl.set(group, { visibility: 'visible', immediateRender: false }, 0);
    tl.fromTo(group, { y: from.y ?? 380, scale: from.scale ?? 0.75 }, { y: to.y ?? 0, scale: to.scale ?? 1, duration: ms(pin.durationMs, 0.76), ease: ease(pin.easing || 'cubic-bezier(0.13,0.43,0.09,1.0)'), immediateRender: true }, 0);
    // out: split exit (drop 450 px in 100 ms ease-in) or leave on the cut
    const e = endLocal(ctx);
    if (e != null) {
      const pout = cue.out === null || p.exit === 'cut' ? null : deepMerge(spec.out || {}, cue.out || {});
      if (pout && pout.to) {
        const d = ms(pout.durationMs, 0.1);
        tl.to(group, { y: `+=${pout.to.y ?? 450}`, duration: d, ease: ease(pout.easing || 'cubic-bezier(0.7,0,0.84,0)'), immediateRender: false }, Math.max(0.05, e - d));
      }
      tl.set(group, { visibility: 'hidden', immediateRender: false }, e);
    }
  };

  // ------------------------------------------------------------------ glass-pill-smoked
  R['glass-pill-smoked'] = (ctx) => {
    const { cue, tl, gsap, ease, ms } = ctx;
    const spec = specFor(ctx, 'glass-pill-smoked');
    const p = cue.props || {};
    const vname = p.variant || cue.variant || 'pill1';
    const vb = ((spec.build || {}).variants || {})[vname] || {};
    const b = { ...(spec.build || {}), ...vb, ...p };
    const w = b.widthPx ?? 662, h = b.heightPx ?? 218;
    const [cx, cy] = centrePx(ctx, cue.position || p.position || { centrePct: b.centrePct }, b.centrePct || [49.9, 76.1]);
    const el = glass({ left: `${cx - w / 2}px`, top: `${cy - h / 2}px`, width: `${w}px`, height: `${h}px`, borderRadius: `${h / 2}px` }, {
      fill: b.fill || 'rgba(0,0,0,0.14)', blurPx: b.backdropBlurPx ?? 10, backdropExtra: 'brightness(0.9) contrast(0.92)',
      stroke: b.stroke || { widthPx: 2, color: 'rgba(255,255,255,0.22)' },
      specular: p.specular === false ? null : { widthPx: 2, gradient: SPEC_RIM },
      inset: 'inset 0 1px 0 rgba(255,255,255,0.06)',
    });
    zInsert(ctx.layer(cue.layer || 'front'), el, p.z);
    const pin = deepMerge(spec.in || {}, cue.in);
    const small = vname === 'pill2';
    const dur = ms(pin.durationMs, 0.4) * (small && !(cue.in && cue.in.durationMs) ? 0.6 : 1);
    gsap.set(el, { autoAlpha: 0, transformOrigin: small ? '50% 50%' : pin.transformOrigin || '55% 50%' });
    tl.set(el, { autoAlpha: 1, immediateRender: false }, 0);
    const fr = pin.from || { scaleX: 0.1, scaleY: 0.2, opacity: 0 };
    // seed stretches sideways first (scaleX leads), then pops to full height
    tl.fromTo(el, { scaleX: fr.scaleX ?? 0.1 }, { scaleX: 1, duration: dur, ease: ease(pin.easing || 'cubic-bezier(0.22,1,0.36,1)'), immediateRender: true }, 0);
    tl.fromTo(el, { scaleY: fr.scaleY ?? 0.2 }, { scaleY: 1, duration: dur, ease: ease('cubic-bezier(0.5,0,0.3,1)'), immediateRender: true }, 0);
    tl.fromTo(el, { opacity: fr.opacity ?? 0 }, { opacity: 1, duration: dur * 0.35, ease: 'none', immediateRender: true }, 0);
    const e = endLocal(ctx);
    if (e != null) tl.set(el, { autoAlpha: 0, immediateRender: false }, e);
  };

  // ------------------------------------------------------------------ glass-pill-outline
  R['glass-pill-outline'] = (ctx) => {
    const { cue, tl, gsap, ease, ms } = ctx;
    const spec = specFor(ctx, 'glass-pill-outline');
    const p = cue.props || {};
    const b = deepMerge(spec.build || {}, p);
    const w = b.widthPx ?? 560, h = b.heightPx ?? 182;
    const [cx, cy] = centrePx(ctx, cue.position || p.position || { centrePct: b.centrePct }, b.centrePct || [49.8, 21.7]);
    const st = b.stroke || { widthPx: 2.5, color: 'rgba(255,255,255,0.14)' };
    const el = div({ left: `${cx - w / 2}px`, top: `${cy - h / 2}px`, width: `${w}px`, height: `${h}px`, borderRadius: `${h / 2}px`, border: `${st.widthPx}px solid ${st.color}`, boxSizing: 'border-box', background: b.fill && b.fill !== 'none' ? b.fill : 'transparent' });
    ctx.layer(cue.layer || 'front').appendChild(el);
    const pin = deepMerge(spec.in || {}, cue.in);
    gsap.set(el, { autoAlpha: 0, transformOrigin: pin.transformOrigin || '50% 50%' });
    tl.set(el, { autoAlpha: 1, immediateRender: false }, 0);
    tl.fromTo(el, ctx.mapVars(pin.from || { scaleX: 0.25, scaleY: 0.6, opacity: 0 }), { ...ctx.mapVars(pin.to || { scaleX: 1, scaleY: 1, opacity: 1 }), duration: ms(pin.durationMs, 0.4), ease: ease(pin.easing || 'cubic-bezier(0.22,1,0.36,1)'), immediateRender: true }, 0);
    const e = endLocal(ctx);
    if (e != null) tl.set(el, { autoAlpha: 0, immediateRender: false }, e);
  };

  // ------------------------------------------------------------------ glass-corner-panels
  R['glass-corner-panels'] = (ctx) => {
    const { cue, tl, W, H, gsap, ease, ms } = ctx;
    const spec = specFor(ctx, 'glass-corner-panels');
    const p = cue.props || {};
    const b = deepMerge(spec.build || {}, p);
    const host = ctx.layer(cue.layer || 'front');
    const over = 260; // slabs extend past the frame so the drift never reveals their outer edges
    const st = b.stroke || { widthPx: 3, color: 'rgba(255,255,255,0.37)' };
    const opt = { fill: b.fill || 'rgba(40,0,4,0.10)', blurPx: b.backdropBlurPx ?? 7.5, backdropExtra: `brightness(${b.darken ?? 0.9})` };
    const tlb = b.topLeft || {};
    const brb = b.bottomRight || {};
    const tlx1 = (tlb.xPx || [0, 430])[1], tly1 = (tlb.yPx || [0, 998])[1];
    const brx0 = (brb.xPx || [633, 1080])[0], bry0 = (brb.yPx || [800, 1920])[0];
    const TL = glass({ left: `${-over}px`, top: `${-over}px`, width: `${tlx1 + over}px`, height: `${tly1 + over}px`, borderBottomRightRadius: `${tlb.radiusPx ?? 375}px` }, opt);
    TL.style.borderRight = TL.style.borderBottom = `${st.widthPx}px solid ${st.color}`;
    const BR = glass({ left: `${brx0}px`, top: `${bry0}px`, width: `${W - brx0 + over}px`, height: `${H - bry0 + over}px`, borderTopLeftRadius: `${brb.radiusPx ?? 375}px` }, opt);
    BR.style.borderLeft = BR.style.borderTop = `${st.widthPx}px solid ${st.color}`;
    host.appendChild(TL);
    host.appendChild(BR);
    const pin = deepMerge(spec.in || {}, cue.in);
    const d = ms(pin.durationMs, 0.6);
    const tin = pin.topLeft || { from: { x: -257, y: -836 }, easing: 'cubic-bezier(0.37,0.32,0,1.03)' };
    const bin = pin.bottomRight || { from: { x: 272, y: 939 }, easing: 'cubic-bezier(0.29,0.89,0.28,0.96)' };
    gsap.set([TL, BR], { visibility: 'hidden' });
    tl.set([TL, BR], { visibility: 'visible', immediateRender: false }, 0);
    tl.fromTo(TL, { x: tin.from.x, y: tin.from.y }, { x: 0, y: 0, duration: d, ease: ease(tin.easing), immediateRender: true }, 0);
    tl.fromTo(BR, { x: bin.from.x, y: bin.from.y }, { x: 0, y: 0, duration: d, ease: ease(bin.easing), immediateRender: true }, 0);
    const lp = spec.loop || {};
    if (lp.durationMs && p.drift !== false) {
      const ld = ms(lp.durationMs, 1.24);
      tl.to(TL, { x: (lp.topLeft || {}).x ?? 0, y: (lp.topLeft || {}).y ?? 45, duration: ld, ease: 'none', immediateRender: false }, d);
      tl.to(BR, { x: (lp.bottomRight || {}).x ?? -15, y: (lp.bottomRight || {}).y ?? -45, duration: ld, ease: 'none', immediateRender: false }, d);
    }
    const e = endLocal(ctx);
    if (e != null) tl.set([TL, BR], { visibility: 'hidden', immediateRender: false }, e);
  };

  // ------------------------------------------------------------------ bell-ring
  R['bell-ring'] = (ctx) => {
    const { cue, tl, gsap, ease, ms } = ctx;
    const spec = specFor(ctx, 'bell-ring');
    const p = cue.props || {};
    const b = deepMerge(spec.build || {}, p);
    const [w, h] = b.sizePx || [72, 63];
    const [cx, cy] = centrePx(ctx, cue.position || p.position || { centrePct: b.centrePct }, b.centrePct || [67.2, 62.1]);
    const sw = b.strokePx ?? 4.5;
    const host = div({ left: `${cx - w / 2}px`, top: `${cy - h / 2}px`, width: `${w}px`, height: `${h}px`, transformOrigin: '50% 12%' }, ctx.layer(cue.layer || 'front'));
    const svg = svgEl('svg', { width: w, height: h, viewBox: '0 0 72 63' }, host);
    svg.style.overflow = 'visible';
    const col = b.color || pal(ctx, 'bellRed', '#FF030F');
    const st = { fill: 'none', stroke: col, 'stroke-width': (sw * 72) / w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1 };
    const paths = [
      // dome + flared skirt
      'M36 8 C24 8 19.5 17 19.5 27 L19.5 36 C19.5 41 16 44.5 12 47.5 L60 47.5 C56 44.5 52.5 41 52.5 36 L52.5 27 C52.5 17 48 8 36 8 Z',
      // clapper
      'M30 52 C31 56.5 41 56.5 42 52',
      // crown
      'M36 3.5 L36 8',
      // ring arcs (top-left / top-right)
      'M12.5 14 C9 19 8 25 9.5 31',
      'M59.5 14 C63 19 64 25 62.5 31',
    ].map((dd) => svgEl('path', { d: dd, ...st }, svg));
    gsap.set(paths, { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(host, { autoAlpha: 0, rotation: b.baseRotateDeg ?? -25 });
    tl.set(host, { autoAlpha: 1, immediateRender: false }, 0);
    const pin = spec.in || {};
    const dd = ms(pin.durationMs, 0.56);
    tl.to(paths.slice(0, 3), { strokeDashoffset: 0, duration: dd, ease: ease(pin.easing || 'cubic-bezier(0.2,0.7,0.3,1)'), stagger: 0.04, immediateRender: false }, 0);
    tl.to(paths.slice(3), { strokeDashoffset: 0, duration: dd * 0.6, ease: ease(pin.easing || 'cubic-bezier(0.2,0.7,0.3,1)'), immediateRender: false }, dd * 0.45);
    // sway ±11° around the base tilt, half period 340 ms, sine — a pure function of time
    const lp = spec.loop || {};
    const amp = lp.amplitudeDeg ?? 11;
    const half = ms(lp.halfPeriodMs, 0.34);
    const e = endLocal(ctx) ?? 4;
    const base = b.baseRotateDeg ?? -25;
    const prox = { ph: 0 };
    tl.fromTo(prox, { ph: 0 }, { ph: e / half, duration: e, ease: 'none', immediateRender: false, onUpdate: () => gsap.set(host, { rotation: base + amp * Math.sin(Math.PI * prox.ph) * Math.min(1, prox.ph * 1.5) }) }, 0);
    if (endLocal(ctx) != null) tl.set(host, { autoAlpha: 0, immediateRender: false }, endLocal(ctx));
  };

  // ------------------------------------------------------------------ brand-lockup
  // props: wordmark, script, tagline, taglineDelayMs (1000). All three are world-locked text presets: park them
  // with the camera (pullback-brand) and they are flown in; give that camera cue "worldRest": "final" when the shot
  // rests at scale != 1.
  R['brand-lockup'] = (ctx) => {
    const { cue } = ctx;
    const p = cue.props || {};
    const parentFor = (preset) => {
      const pr = (ctx.style.textPresets || []).find((x) => x.id === preset) || {};
      return ctx.layers[(pr.layer || 'front') + ((cue.worldLock ?? pr.worldLock) ? 'W' : '')] || ctx.layers.frontW;
    };
    if (p.wordmark) subText(ctx, parentFor('brand-wordmark'), { preset: 'brand-wordmark', text: p.wordmark, ...(p.wordmarkCue || {}) }, 0);
    if (p.script) subText(ctx, parentFor('script-accent'), { preset: 'script-accent', text: p.script, ...(p.scriptCue || {}) }, ctx.ms(p.scriptDelayMs, 0));
    if (p.tagline) subText(ctx, parentFor('word-cascade-fade'), { preset: 'word-cascade-fade', text: p.tagline, ...(p.taglineCue || {}) }, ctx.ms(p.taglineDelayMs, 1.0));
  };

  // ------------------------------------------------------------------ fg-rose-parallax (procedural roses)
  // A macro rose seen defocused: three rings of large cupped petals (dark base -> glossy rim) around a spiral
  // heart. Only the big shapes survive the 20 px blur, so fewer/larger petals read as a rose, not a berry.
  function roseSvg(ctx, size, seed, tone) {
    const r = ctx.rng(seed);
    const svg = svgEl('svg', { width: size, height: size, viewBox: '-300 -300 600 600' });
    svg.style.overflow = 'visible';
    const defs = svgEl('defs', {}, svg);
    const pg = uid('petal');
    const g0 = svgEl('radialGradient', { id: pg, cx: '50%', cy: '100%', r: '110%', fx: '50%', fy: '100%' }, defs);
    [[0, tone.deep], [0.5, tone.mid], [0.86, tone.hi], [1, tone.rim]].forEach(([o, c]) => svgEl('stop', { offset: o, 'stop-color': c }, g0));
    svgEl('circle', { cx: 0, cy: 0, r: 250, fill: tone.deep }, svg);
    const ring = (n, dist, w, h, rot0, op) => {
      for (let k = 0; k < n; k++) {
        const ang = rot0 + (k * 360) / n + (r() - 0.5) * 18;
        const ww = w * (0.85 + r() * 0.3), hh = h * (0.85 + r() * 0.3);
        const g = svgEl('g', { transform: `rotate(${ang.toFixed(1)}) translate(0 ${(-dist).toFixed(1)})`, opacity: op }, svg);
        // cupped petal: broad rounded top, narrow base towards the centre
        const d = `M 0 ${hh * 0.55} C ${-ww * 0.75} ${hh * 0.35} ${-ww * 0.62} ${-hh * 0.55} 0 ${-hh * 0.6} C ${ww * 0.62} ${-hh * 0.55} ${ww * 0.75} ${hh * 0.35} 0 ${hh * 0.55} Z`;
        svgEl('path', { d, fill: `url(#${pg})` }, g);
        // glossy rim highlight along the curled petal edge
        svgEl('path', { d: `M ${-ww * 0.5} ${-hh * 0.38} C ${-ww * 0.25} ${-hh * 0.62} ${ww * 0.25} ${-hh * 0.62} ${ww * 0.5} ${-hh * 0.38}`, fill: 'none', stroke: tone.edge, 'stroke-width': 9, 'stroke-linecap': 'round', opacity: 0.5 }, g);
      }
    };
    ring(6, 150, 250, 210, r() * 60, 1);
    ring(5, 92, 190, 160, r() * 60, 1);
    ring(4, 44, 130, 110, r() * 60, 1);
    // spiral heart
    let dpath = '';
    for (let a = 0; a <= 900; a += 15) {
      const rr = 6 + a * 0.055;
      const x = Math.cos((a * Math.PI) / 180) * rr, y = Math.sin((a * Math.PI) / 180) * rr;
      dpath += (a ? ' L ' : 'M ') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    svgEl('path', { d: dpath, fill: 'none', stroke: tone.hi, 'stroke-width': 10, opacity: 0.8 }, svg);
    return svg;
  }
  R['fg-rose-parallax'] = (ctx) => {
    const { cue, tl, gsap, ease, ms } = ctx;
    const spec = specFor(ctx, 'fg-rose-parallax');
    const p = cue.props || {};
    const b = deepMerge(spec.build || {}, p);
    const host = ctx.layer(cue.layer || 'front');
    const blur = b.blurPx ?? 20;
    // element = the measured box; the bloom overflows it. Scale origins are solved from the measured edges
    // (BL right edge 517 -> 640 px, top edge 1648 -> 1332 px @1080 under x2.2) -> about (414, 1912) for BL.
    const mk = (box, seed, tone, origin, bloom) => {
      const x = box.x || [0, 705], y = box.y || [1335, 1920];
      const wv = x[1] - x[0], hv = y[1] - y[0];
      const el = div({ left: `${x[0]}px`, top: `${y[0]}px`, width: `${wv}px`, height: `${hv}px`, filter: `blur(${blur}px)`, transformOrigin: origin }, host);
      const size = bloom[2] * wv;
      const svg = roseSvg(ctx, size, seed, tone);
      Object.assign(svg.style, { position: 'absolute', left: `${bloom[0] * wv - size / 2}px`, top: `${bloom[1] * hv - size / 2}px` });
      el.appendChild(svg);
      return el;
    };
    // props.bottomLeft / props.topRight: false drops a rose, {boxPx:{x:[..],y:[..]}} moves it. The top-right rose
    // assumes the reference wide (head top ~34% H); on tight plates drop it so no bloom crosses the face.
    const BL = p.bottomLeft === false ? null : mk((b.bottomLeft || {}).boxPx || {}, 11, { deep: '#240002', mid: '#7A0000', hi: '#B30005', rim: '#D42630', edge: '#FF5A5A' }, '58.7% 98.6%', [0.33, 1.0, 1.0]);
    const TR = p.topRight === false ? null : mk((b.topRight || {}).boxPx || { x: [540, 1080], y: [0, 660] }, 23, { deep: '#160002', mid: '#4E0204', hi: '#8E0408', rim: '#A8121A', edge: '#C83A3A' }, '100% 0%', [0.66, 0.3, 1.25]);
    const pin = deepMerge(spec.in || {}, cue.in);
    const dur = endLocal(ctx) ?? ms(pin.durationMs, 3.48);
    const roses = [BL, TR].filter(Boolean);
    gsap.set(roses, { visibility: 'hidden' });
    tl.set(roses, { visibility: 'visible', immediateRender: false }, 0);
    const rot = (spec.loop && spec.loop.rotateDeg) ?? 6;
    if (BL) tl.fromTo(BL, { scale: (pin.from || {}).scale ?? 1, rotation: 0 }, { scale: (pin.to || {}).scale ?? 2.2, rotation: rot, duration: ms(pin.durationMs, 3.48), ease: ease(pin.easing || 'cubic-bezier(0.56,0.27,0.43,0.79)'), immediateRender: true }, 0);
    if (TR) tl.fromTo(TR, { scale: (pin.from || {}).scale ?? 1, rotation: 0 }, { scale: (pin.to || {}).scale ?? 2.2, rotation: -rot, duration: ms(pin.durationMs, 3.48), ease: ease(pin.easing || 'cubic-bezier(0.56,0.27,0.43,0.79)'), immediateRender: true }, 0);
    if (endLocal(ctx) != null) tl.set(roses, { visibility: 'hidden', immediateRender: false }, dur);
  };

  // ------------------------------------------------------------------ void-pullback
  // Static smoky void (screen-locked) + the whole studio as a plate-locked card with an 18% feather. The plate
  // layers above (halo) and the talent get the same feather. Pair with cameraMoves.reveal-pullback-void.
  R['void-pullback'] = (ctx) => {
    const { cue, W, H, cam } = ctx;
    const p = cue.props || {};
    const bgs = ctx.style.backgrounds || {};
    const f = (p.featherPct ?? (bgs.voidExtension && bgs.voidExtension.featherPct) ?? 18) / 100;
    const voidEl = div({ left: '0px', top: '0px', width: '100%', height: '100%', background: p.voidGradient || (bgs.voidExtension && bgs.voidExtension.gradient) || '#15100C' }, ctx.layers.bg);
    window_(ctx, voidEl);
    const studioKey = { wide: 'redStudioWide', mcu: 'redStudioMcu' }[p.studio || 'wide'] || p.studio;
    const card = plateLayer(ctx, 'bgW');
    const studio = div({ left: '0px', top: '0px', width: `${W}px`, height: `${H}px`, background: p.studioGradient || (bgs[studioKey] && bgs[studioKey].gradient) || '#4E0005' }, card);
    const pc = (v) => `${(v * 100).toFixed(2)}%`;
    const mask = `linear-gradient(90deg, transparent 0%, #000 ${pc(f)}, #000 ${pc(1 - f)}, transparent 100%), linear-gradient(180deg, transparent 0%, #000 ${pc(f)}, #000 ${pc(1 - f)}, transparent 100%)`;
    const setMask = (el, on, r) => {
      el.style.webkitMaskImage = el.style.maskImage = on ? mask : '';
      el.style.webkitMaskComposite = on ? 'source-in' : '';
      el.style.maskComposite = on ? 'intersect' : '';
      const sz = on && r ? `${r[2] - r[0]}px ${r[3] - r[1]}px` : '';
      const ps = on && r ? `${r[0]}px ${r[1]}px` : '';
      el.style.webkitMaskSize = el.style.maskSize = sz;
      el.style.webkitMaskPosition = el.style.maskPosition = ps;
      el.style.webkitMaskRepeat = el.style.maskRepeat = on && r ? 'no-repeat' : '';
    };
    window_(ctx, studio);
    // The card is the screen as framed at the cue start (inverse camera), grown so its feather lies outside the
    // frame at that moment: the cut-free hand-off from the full-frame studio, then it shrinks with the camera.
    let rect = p.rect || null;
    if (!rect) {
      const m0 = inv(ctx.camAt(cue.t).matrix);
      const [a0, b0] = apply(m0, 0, 0);
      const [a1, b1] = apply(m0, W, H);
      const gx = ((a1 - a0) * f) / (1 - 2 * f), gy = ((b1 - b0) * f) / (1 - 2 * f);
      rect = [a0 - gx, b0 - gy, a1 + gx, b1 + gy];
    }
    Object.assign(studio.style, { left: `${rect[0]}px`, top: `${rect[1]}px`, width: `${rect[2] - rect[0]}px`, height: `${rect[3] - rect[1]}px` });
    setMask(studio, true, null);
    const tc = document.getElementById('talent');
    const tcx = tc && tc.getContext('2d');
    ctx.onFrame((t) => {
      if (!active(ctx, t)) return;
      const m = ctx.camMatrix(cam);
      const sc = Math.abs(m[0]);
      const fz = { side: (rect[2] - rect[0]) * sc * f, bottom: (rect[3] - rect[1]) * sc * f, top: (rect[3] - rect[1]) * sc * f };
      // the halo canvas (drawn earlier this frame by the persistent hook) gets the same feather as the studio card
      if (S3.haloCtx) feather(S3.haloCtx, W, H, m, fz, rect);
      if (tcx) feather(tcx, W, H, m, fz, rect);
    });
  };
})();
