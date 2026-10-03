/* Shared, style-agnostic components. A style's components.js may override any of these by id.
 *
 * Every component receives ctx = { cue, tl, layer(name), W, H, FPS, style, makeText, mapVars, filterKeysOf,
 *   ease, rng, face, onFrame, assetUrl, applyTextStyle, place, gsap, ms }
 * and adds tweens to ctx.tl, whose time 0 is cue.t. Use cue.end (absolute seconds) for the exit time.
 * Never use CSS animations / setTimeout / Math.random — everything must be a function of the timeline time.
 */
(() => {
  window.MG = window.MG || {};
  const R = (window.MG.components = window.MG.components || {});

  // in/out helper shared by most components: cue.in / cue.out = { from, to, durationMs, easing, staggerMs }
  function animateInOut(ctx, el, defIn, defOut) {
    const { cue, tl, mapVars, filterKeysOf, ease, ms } = ctx;
    const pin = { ...defIn, ...(cue.in || {}) };
    const fk = filterKeysOf(pin.from, pin.to);
    ctx.gsap.set(el, { autoAlpha: 0 });
    tl.set(el, { autoAlpha: 1 }, 0);
    tl.fromTo(el, mapVars(pin.from || {}, fk), { ...mapVars(pin.to || {}, fk), duration: ms(pin.durationMs, 0.5), ease: ease(pin.easing || 'power3.out'), immediateRender: true }, 0);
    if (cue.end != null) {
      const pout = { ...defOut, ...(cue.out || {}) };
      const ok = filterKeysOf(pout.from, pout.to);
      const d = ms(pout.durationMs, 0.3);
      const at = Math.max(ms(pin.durationMs, 0.5), cue.end - cue.t - d);
      tl.to(el, { ...mapVars(pout.to || { opacity: 0 }, ok), duration: d, ease: ease(pout.easing || 'power2.in'), immediateRender: false }, at);
      tl.set(el, { autoAlpha: 0 }, at + d);
    }
  }
  window.MG.animateInOut = animateInOut;

  function box(ctx, css = {}) {
    const el = document.createElement('div');
    Object.assign(el.style, { position: 'absolute' }, css);
    return el;
  }

  // static image or transparent PNG (3D objects, logos, AI-generated props)
  R.image = (ctx) => {
    const { cue } = ctx;
    const el = document.createElement('img');
    el.src = ctx.assetUrl(cue.src);
    el.style.position = 'absolute';
    el.style.width = (cue.widthPct ?? 60) + '%';
    if (cue.css) Object.assign(el.style, cue.css);
    ctx.place(el, cue.position || {});
    ctx.layer(cue.layer || 'front').appendChild(el);
    animateInOut(ctx, el, { from: { opacity: 0, scale: 0.85, y: 60, blur: 12 }, to: { opacity: 1, scale: 1, y: 0, blur: 0 }, durationMs: 600, easing: 'cubic-bezier(0.16,1,0.3,1)' }, { to: { opacity: 0, scale: 0.92, blur: 10 }, durationMs: 300 });
    if (cue.float) {
      const f = cue.float;
      const dur = (cue.end ?? cue.t + 6) - cue.t;
      ctx.tl.to(el, { y: `+=${f.px ?? 18}`, rotation: f.rotate ?? 0, duration: (f.periodMs ?? 2400) / 2000, ease: 'sine.inOut', yoyo: true, repeat: Math.max(1, Math.floor(dur / ((f.periodMs ?? 2400) / 2000))) }, ctx.ms(cue.in?.durationMs, 0.6));
    }
  };

  // PNG image sequence (e.g. rendered 3D object turntable). cue.seq = "assets/teeth/%04d.png", cue.frames, cue.fps
  R.sequence = (ctx) => {
    const { cue } = ctx;
    const el = document.createElement('img');
    el.style.position = 'absolute';
    el.style.width = (cue.widthPct ?? 60) + '%';
    ctx.place(el, cue.position || {});
    ctx.layer(cue.layer || 'front').appendChild(el);
    const pad = (n, w) => String(n).padStart(w, '0');
    const m = cue.seq.match(/%0(\d)d/);
    const fps = cue.fps || ctx.FPS;
    ctx.onFrame(async (t) => {
      const local = t - cue.t;
      if (local < 0 || (cue.end != null && t > cue.end)) return;
      let k = Math.floor(local * fps);
      k = cue.loop ? k % cue.frames : Math.min(k, cue.frames - 1);
      const src = ctx.assetUrl(cue.seq.replace(/%0\dd/, pad(k + (cue.startNumber || 0), Number(m[1]))));
      if (el.dataset.src !== src) { el.src = src; el.dataset.src = src; await el.decode().catch(() => null); }
    });
    animateInOut(ctx, el, { from: { opacity: 0, scale: 0.9 }, to: { opacity: 1, scale: 1 }, durationMs: 400 }, { to: { opacity: 0 }, durationMs: 250 });
  };

  // replace the real background behind the presenter (needs mattes): image, gradient or solid
  R['bg-replace'] = (ctx) => {
    const { cue, tl } = ctx;
    const el = box(ctx, { inset: 0, left: 0, top: 0, width: '100%', height: '100%', overflow: 'hidden' });
    const inner = box(ctx, { inset: '-6%', left: '-6%', top: '-6%', width: '112%', height: '112%', backgroundSize: 'cover', backgroundPosition: 'center' });
    if (cue.src) inner.style.backgroundImage = `url('${ctx.assetUrl(cue.src)}')`;
    if (cue.gradient) inner.style.background = cue.gradient;
    if (cue.color) inner.style.background = cue.color;
    if (cue.blurPx) inner.style.filter = `blur(${cue.blurPx}px)`;
    el.appendChild(inner);
    ctx.layer('bg').appendChild(el);
    animateInOut(ctx, el, { from: { opacity: 0 }, to: { opacity: 1 }, durationMs: cue.fadeMs ?? 0 }, { to: { opacity: 0 }, durationMs: cue.fadeMs ?? 0 });
    const dur = (cue.end ?? cue.t + 8) - cue.t;
    if (cue.push !== false) tl.fromTo(inner, { scale: cue.push?.from ?? 1.0 }, { scale: cue.push?.to ?? 1.06, duration: dur, ease: 'none', immediateRender: true }, 0);
  };

  // full-frame flash / dip used as a transition accent
  R.flash = (ctx) => {
    const { cue, tl } = ctx;
    const el = box(ctx, { inset: 0, left: 0, top: 0, width: '100%', height: '100%', background: cue.color || '#fff', mixBlendMode: cue.blend || 'normal' });
    ctx.layer(cue.layer || 'fx').appendChild(el);
    ctx.gsap.set(el, { autoAlpha: 0 });
    const peak = cue.opacity ?? 0.85;
    tl.to(el, { autoAlpha: peak, duration: ctx.ms(cue.attackMs, 0.05), ease: 'power1.out' }, 0);
    tl.to(el, { autoAlpha: 0, duration: ctx.ms(cue.releaseMs, 0.25), ease: 'power2.in' }, ctx.ms(cue.attackMs, 0.05) + ctx.ms(cue.holdMs, 0));
  };

  // diagonal light streak sweeping across the frame or a region
  R['light-sweep'] = (ctx) => {
    const { cue, tl } = ctx;
    const wrap = box(ctx, { left: (cue.region?.xPct ?? 0) + '%', top: (cue.region?.yPct ?? 0) + '%', width: (cue.region?.wPct ?? 100) + '%', height: (cue.region?.hPct ?? 100) + '%', overflow: 'hidden', mixBlendMode: cue.blend || 'screen' });
    const streak = box(ctx, { top: '-50%', height: '200%', width: (cue.widthPct ?? 18) + '%', left: '-30%', background: `linear-gradient(90deg, transparent, ${cue.color || 'rgba(255,255,255,0.55)'}, transparent)`, transform: `rotate(${cue.angle ?? 20}deg)` });
    wrap.appendChild(streak);
    ctx.layer(cue.layer || 'front').appendChild(wrap);
    tl.fromTo(streak, { left: '-30%' }, { left: '130%', duration: ctx.ms(cue.durationMs, 0.7), ease: ctx.ease(cue.easing || 'power2.inOut'), immediateRender: true }, 0);
    tl.set(wrap, { autoAlpha: 0 }, ctx.ms(cue.durationMs, 0.7));
  };

  // floating dust / bokeh / embers — deterministic (seeded) and computed from time
  R.particles = (ctx) => {
    const { cue, W, H } = ctx;
    const cv = document.createElement('canvas');
    cv.width = W / 2; cv.height = H / 2;
    Object.assign(cv.style, { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', mixBlendMode: cue.blend || 'screen', opacity: cue.opacity ?? 1 });
    ctx.layer(cue.layer || 'front').appendChild(cv);
    const g = cv.getContext('2d');
    const r = ctx.rng(cue.seed || 42);
    const n = cue.count ?? 40;
    const ps = Array.from({ length: n }, () => ({ x: r(), y: r(), s: (cue.sizePx?.[0] ?? 2) + r() * ((cue.sizePx?.[1] ?? 8) - (cue.sizePx?.[0] ?? 2)), v: 0.3 + r(), ph: r() * 6.28, a: 0.3 + r() * 0.7 }));
    const color = cue.color || '255,200,140';
    ctx.onFrame((t) => {
      g.clearRect(0, 0, cv.width, cv.height);
      const local = t - cue.t;
      if (local < 0 || (cue.end != null && t > cue.end)) return;
      const fade = Math.min(1, local / 0.5) * (cue.end != null ? Math.min(1, (cue.end - t) / 0.5) : 1);
      for (const p of ps) {
        const x = ((p.x + Math.sin(local * 0.4 * p.v + p.ph) * 0.02 + local * (cue.driftX ?? 0.005) * p.v) % 1) * cv.width;
        const y = (((p.y - local * (cue.rise ?? 0.02) * p.v) % 1) + 1) % 1 * cv.height;
        const rad = p.s / 2;
        const grd = g.createRadialGradient(x, y, 0, x, y, rad * 2);
        grd.addColorStop(0, `rgba(${color},${p.a * fade})`);
        grd.addColorStop(1, `rgba(${color},0)`);
        g.fillStyle = grd;
        g.beginPath(); g.arc(x, y, rad * 2, 0, 6.283); g.fill();
      }
    });
  };

  // glass pill / capsule with a label and a round icon button (common in all three references' UI vocabulary)
  R['glass-pill'] = (ctx) => {
    const { cue, tl, ease, ms } = ctx;
    const p = { widthPx: 620, heightPx: 120, radiusPx: 60, blurPx: 18, fill: 'rgba(255,255,255,0.10)', stroke: 'rgba(255,255,255,0.45)', strokePx: 2,
      iconFill: 'rgba(255,214,0,0.15)', iconStroke: '#ffd400', iconColor: '#ffd400', icon: '↗', labelStyle: { fontRole: 'sub', sizePx: 52, color: '#fff' }, ...(cue.props || {}) };
    const el = box(ctx, { width: p.widthPx + 'px', height: p.heightPx + 'px', borderRadius: p.radiusPx + 'px', background: p.fill, border: `${p.strokePx}px solid ${p.stroke}`,
      backdropFilter: `blur(${p.blurPx}px)`, webkitBackdropFilter: `blur(${p.blurPx}px)`, boxShadow: p.shadow || '0 10px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.35)', overflow: 'hidden' });
    ctx.place(el, cue.position || { xPct: 50, yPct: 62 });
    const btn = box(ctx, { width: (p.heightPx - 24) + 'px', height: (p.heightPx - 24) + 'px', borderRadius: '50%', top: '12px', [p.iconSide || 'right']: '12px', background: p.iconFill, border: `3px solid ${p.iconStroke}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.iconColor, fontSize: Math.round(p.heightPx * 0.42) + 'px', fontWeight: 700, fontFamily: 'sans-serif' });
    btn.textContent = p.icon;
    el.appendChild(btn);
    const label = document.createElement('div');
    Object.assign(label.style, { position: 'absolute', top: '50%', left: (p.iconSide === 'left' ? p.heightPx : 0) + 'px', width: (p.widthPx - p.heightPx) + 'px', textAlign: 'center', transform: 'translateY(-50%)', whiteSpace: 'nowrap' });
    ctx.applyTextStyle(label, p.labelStyle);
    label.dir = 'auto';
    label.textContent = p.label || '';
    el.appendChild(label);
    ctx.layer(cue.layer || 'front').appendChild(el);
    // default: pill grows from a circle at the icon position, then label fades/slides in
    ctx.gsap.set(el, { autoAlpha: 0 });
    tl.set(el, { autoAlpha: 1 }, 0);
    tl.fromTo(el, { width: p.heightPx, opacity: 0, scale: 0.6 }, { width: p.widthPx, opacity: 1, scale: 1, duration: ms(p.growMs, 0.55), ease: ease(p.easing || 'cubic-bezier(0.22,1,0.36,1)'), immediateRender: true }, 0);
    tl.fromTo(btn, { rotation: -90, scale: 0.4 }, { rotation: 0, scale: 1, duration: 0.45, ease: 'back.out(2)', immediateRender: true }, 0.05);
    tl.fromTo(label, { opacity: 0, x: p.iconSide === 'left' ? -30 : 30, filter: 'blur(8px)' }, { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.4, ease: 'power3.out', immediateRender: true }, ms(p.growMs, 0.55) * 0.6);
    if (cue.end != null) {
      const at = cue.end - cue.t - 0.3;
      tl.to(el, { opacity: 0, scale: 0.9, filter: 'blur(8px)', duration: 0.3, ease: 'power2.in', immediateRender: false }, at);
      tl.set(el, { autoAlpha: 0 }, at + 0.3);
    }
  };

  // generic positioned box (rounded rect, circle, line, arch) with in/out — style components can build on it
  R.shape = (ctx) => {
    const { cue } = ctx;
    const el = box(ctx, { width: (cue.wPx ?? 300) + 'px', height: (cue.hPx ?? 300) + 'px', ...(cue.css || {}) });
    ctx.place(el, cue.position || {});
    ctx.layer(cue.layer || 'front').appendChild(el);
    animateInOut(ctx, el, { from: { opacity: 0, scale: 0.8 }, to: { opacity: 1, scale: 1 }, durationMs: 500 }, { to: { opacity: 0 }, durationMs: 250 });
  };
})();
