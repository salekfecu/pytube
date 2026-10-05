/* IPSI brand components for the "IPSI Spatial Glass" style (style-2 grammar, IPSI blue #0057A8 + orange #F39200).
 * Load from a scene with  "scripts": ["../../styles/style-ipsi/brand.js"]  (paths are relative to the scene file).
 * Asset paths in cues (logos) are relative to the scene file too.
 *
 *   focus-pull      blurred plate (hook "image floutée") that snaps / eases sharp at cue.releaseAt
 *   ipsi-logo-card  light-glass card holding a logo PNG (IPSI, Wesford…)
 *   accredit-seal   round accreditation badge: spring-in with a glass rim and a light sweep
 *   section-counter orange glass disc "1/3"
 *   job-chips       row/column of frosted chips with an orange dot, staggered pop
 *   comment-cta     glass pill with a speech-bubble button ("شاركونا ف التعليقات")
 * All deterministic (GSAP on ctx.tl, no timers / Math.random); every element is hidden exactly at cue.end.
 */
(() => {
  window.MG = window.MG || {};
  const R = (window.MG.components = window.MG.components || {});
  const BLUE = '#0057A8';
  const BLUE_E = '#2E8BFF';
  const ORANGE = '#F39200';
  const ORANGE_HOT = '#FFB547';

  const div = (css, parent) => {
    const d = document.createElement('div');
    Object.assign(d.style, { position: 'absolute' }, css);
    if (parent) parent.appendChild(d);
    return d;
  };
  // exact hard cut at cue.end (the engine lifecycle also removes the DOM; this keeps GSAP state honest)
  const hideAtEnd = (ctx, el) => { if (ctx.cue.end != null) ctx.tl.set(el, { visibility: 'hidden', immediateRender: false }, ctx.cue.end - ctx.cue.t); };
  const glassCss = (o = {}) => ({
    background: o.fill || 'linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.07))',
    backdropFilter: `blur(${o.blurPx ?? 22}px) saturate(1.2)`,
    webkitBackdropFilter: `blur(${o.blurPx ?? 22}px) saturate(1.2)`,
    boxShadow: ['inset 0 2px 0 rgba(255,255,255,0.40)', 'inset 0 0 0 2px rgba(255,255,255,0.22)', 'inset 0 -2px 3px rgba(255,255,255,0.12)', '0 18px 50px rgba(0,10,40,0.30)'].join(', '),
  });

  // ------------------------------------------------------------------ focus-pull
  // {t, end, component:'focus-pull', blurPx: 26, releaseAt: 3.0, releaseMs: 500, dim: 0.78}
  R['focus-pull'] = (ctx) => {
    const { cue, tl, gsap } = ctx;
    const targets = [document.getElementById('plateWrap'), document.getElementById('talentWrap')];
    const b = cue.blurPx ?? 26;
    const dim = cue.dim ?? 0.8;
    const rel = (cue.releaseAt ?? cue.end ?? cue.t + 3) - cue.t;
    const relDur = (cue.releaseMs ?? 500) / 1000;
    tl.set(targets, { filter: `blur(${b}px) brightness(${dim})`, immediateRender: false }, 0);
    tl.to(targets, { filter: 'blur(0px) brightness(1)', duration: relDur, ease: ctx.ease(cue.easing || 'cubic-bezier(0.22,1,0.36,1)'), immediateRender: false }, Math.max(0, rel - relDur * 0.15));
    tl.set(targets, { filter: 'none', immediateRender: false }, rel + relDur);
  };

  // ------------------------------------------------------------------ ipsi-logo-card
  // {component:'ipsi-logo-card', src:'assets/logo_ipsi.png', widthPx: 560, padPx: 44, position, layer, caption}
  R['ipsi-logo-card'] = (ctx) => {
    const { cue, tl, gsap } = ctx;
    const w = cue.widthPx ?? 560;
    const pad = cue.padPx ?? 44;
    const card = div({ width: w + 'px', padding: `${pad * 0.8}px ${pad}px`, boxSizing: 'border-box', borderRadius: (cue.radiusPx ?? 46) + 'px', textAlign: 'center',
      ...glassCss({ fill: cue.fill || 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(236,243,252,0.86))', blurPx: 26 }) }, ctx.layer(cue.layer || 'front'));
    const img = document.createElement('img');
    img.src = ctx.assetUrl(cue.src || 'assets/logo_ipsi.png');
    Object.assign(img.style, { display: 'block', width: '100%', height: 'auto', margin: '0 auto' });
    if (cue.crop) Object.assign(img.style, { objectFit: 'cover', objectPosition: cue.crop.position || 'top', height: cue.crop.heightPx + 'px' });
    card.appendChild(img);
    if (cue.caption) {
      const cap = document.createElement('div');
      ctx.applyTextStyle(cap, { family: cue.captionFamily || 'readex-pro', weight: 500, sizePx: cue.captionSizePx ?? 40, color: BLUE });
      cap.style.marginTop = '14px';
      cap.dir = 'auto';
      cap.textContent = cue.caption;
      card.appendChild(cap);
    }
    ctx.place(card, cue.position || { xPct: 50, yPct: 50 });
    gsap.set(card, { autoAlpha: 0 });
    tl.set(card, { autoAlpha: 1, immediateRender: false }, 0);
    tl.fromTo(card, { y: 70, scale: 0.9, filter: 'blur(14px)', opacity: 0 }, { y: 0, scale: 1, filter: 'blur(0px)', opacity: 1, duration: 0.7, ease: ctx.ease('cubic-bezier(0.16,1,0.3,1)'), immediateRender: false }, 0);
    // glint across the card
    const glint = div({ left: '-40%', top: '-20%', width: '30%', height: '140%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.75), transparent)', transform: 'rotate(18deg)', mixBlendMode: 'screen' }, card);
    card.style.overflow = 'hidden';
    tl.fromTo(glint, { left: '-40%' }, { left: '120%', duration: 0.9, ease: 'power2.inOut', immediateRender: false }, 0.55);
    hideAtEnd(ctx, card);
  };

  // ------------------------------------------------------------------ accredit-seal
  // {component:'accredit-seal', src:'assets/logo_accredite.png', sizePx: 300, position, label}
  R['accredit-seal'] = (ctx) => {
    const { cue, tl, gsap } = ctx;
    const s = cue.sizePx ?? 300;
    const wrap = div({ width: s + 'px', height: s + 'px' }, ctx.layer(cue.layer || 'front'));
    const halo = div({ inset: `-${s * 0.08}px`, left: `-${s * 0.08}px`, top: `-${s * 0.08}px`, width: `${s * 1.16}px`, height: `${s * 1.16}px`, borderRadius: '50%', ...glassCss({ blurPx: 16 }) }, wrap);
    const img = document.createElement('img');
    img.src = ctx.assetUrl(cue.src || 'assets/logo_accredite.png');
    Object.assign(img.style, { position: 'absolute', left: 0, top: 0, width: s + 'px', height: s + 'px', borderRadius: '50%', filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.35))' });
    wrap.appendChild(img);
    const sweepClip = div({ left: 0, top: 0, width: s + 'px', height: s + 'px', borderRadius: '50%', overflow: 'hidden', mixBlendMode: 'screen' }, wrap);
    const sweep = div({ left: '-60%', top: '-10%', width: '35%', height: '120%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.65), transparent)', transform: 'rotate(20deg)' }, sweepClip);
    ctx.place(wrap, cue.position || { xPct: 50, yPct: 50 });
    gsap.set(wrap, { autoAlpha: 0 });
    tl.set(wrap, { autoAlpha: 1, immediateRender: false }, 0);
    tl.fromTo(wrap, { scale: 0.35, rotation: -28, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.75, ease: 'back.out(1.6)', immediateRender: false }, 0);
    tl.fromTo(halo, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out', immediateRender: false }, 0.1);
    tl.fromTo(sweep, { left: '-60%' }, { left: '130%', duration: 0.9, ease: 'power2.inOut', immediateRender: false }, 0.7);
    if (cue.label) {
      const lab = document.createElement('div');
      ctx.applyTextStyle(lab, { family: 'readex-pro', weight: 600, sizePx: cue.labelSizePx ?? 46, color: '#FFFFFF', glow: { color: 'rgba(46,139,255,0.55)', radiusPx: 18 } });
      Object.assign(lab.style, { position: 'absolute', left: '50%', top: `${s * 1.12 + 10}px`, transform: 'translateX(-50%)', whiteSpace: 'nowrap' });
      lab.dir = 'auto';
      lab.textContent = cue.label;
      wrap.appendChild(lab);
      tl.fromTo(lab, { opacity: 0, y: 20, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.45, ease: 'power3.out', immediateRender: false }, 0.45);
    }
    hideAtEnd(ctx, wrap);
  };

  // ------------------------------------------------------------------ section-counter
  // {component:'section-counter', n:1, total:3, sizePx: 150, position}
  R['section-counter'] = (ctx) => {
    const { cue, tl, gsap } = ctx;
    const s = cue.sizePx ?? 150;
    const disc = div({ width: s + 'px', height: s + 'px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      ...glassCss({ fill: `radial-gradient(circle at 35% 30%, ${ORANGE_HOT}, ${ORANGE} 60%, #C86F00)`, blurPx: 10 }),
      boxShadow: `inset 0 3px 0 rgba(255,255,255,0.45), inset 0 0 0 2px rgba(255,255,255,0.25), 0 0 40px rgba(243,146,0,0.55), 0 14px 30px rgba(0,0,0,0.35)` }, ctx.layer(cue.layer || 'front'));
    const t = document.createElement('div');
    ctx.applyTextStyle(t, { family: 'readex-pro', weight: 700, sizePx: Math.round(s * 0.36), color: '#FFFFFF' });
    t.style.letterSpacing = '0.02em';
    t.textContent = `${cue.n ?? 1}/${cue.total ?? 3}`;
    t.dir = 'ltr';
    disc.appendChild(t);
    ctx.place(disc, cue.position || { xPct: 14, yPct: 12 });
    gsap.set(disc, { autoAlpha: 0 });
    tl.set(disc, { autoAlpha: 1, immediateRender: false }, 0);
    tl.fromTo(disc, { scale: 0.2, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.55, ease: 'back.out(2)', immediateRender: false }, 0);
    hideAtEnd(ctx, disc);
  };

  // ------------------------------------------------------------------ job-chips
  // {component:'job-chips', items:['مطور','رئيس مشروع'], direction:'column'|'row', position, sizePx: 46, staggerMs: 140}
  R['job-chips'] = (ctx) => {
    const { cue, tl, gsap } = ctx;
    const size = cue.sizePx ?? 46;
    const box = div({ display: 'flex', flexDirection: cue.direction === 'row' ? 'row-reverse' : 'column', alignItems: 'center', gap: (cue.gapPx ?? 20) + 'px', flexWrap: 'wrap', justifyContent: 'center', width: (cue.widthPx ?? 900) + 'px' }, ctx.layer(cue.layer || 'front'));
    const chips = (cue.items || []).map((label) => {
      const c = div({ position: 'relative', display: 'flex', alignItems: 'center', gap: '18px', padding: `${size * 0.42}px ${size * 0.8}px`, borderRadius: '999px', direction: 'rtl', ...glassCss({ blurPx: 20 }) }, box);
      const dot = div({ position: 'relative', width: `${size * 0.42}px`, height: `${size * 0.42}px`, borderRadius: '50%', background: ORANGE, boxShadow: `0 0 16px ${ORANGE}` }, c);
      dot.style.flex = '0 0 auto';
      const tx = document.createElement('div');
      ctx.applyTextStyle(tx, { family: 'readex-pro', weight: 500, sizePx: size, color: '#FFFFFF' });
      tx.style.whiteSpace = 'nowrap';
      tx.dir = 'auto';
      tx.textContent = label;
      c.appendChild(tx);
      return c;
    });
    ctx.place(box, cue.position || { xPct: 50, yPct: 70 });
    gsap.set(box, { autoAlpha: 0 });
    tl.set(box, { autoAlpha: 1, immediateRender: false }, 0);
    const st = (cue.staggerMs ?? 140) / 1000;
    chips.forEach((c, i) => {
      gsap.set(c, { opacity: 0 });
      tl.fromTo(c, { opacity: 0, scale: 0.6, y: 26, filter: 'blur(10px)' }, { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', duration: 0.5, ease: 'back.out(1.7)', immediateRender: false }, i * st);
    });
    hideAtEnd(ctx, box);
  };

  // ------------------------------------------------------------------ comment-cta
  // {component:'comment-cta', label:'شاركونا ف التعليقات', position, widthPx: 820}
  R['comment-cta'] = (ctx) => {
    const { cue, tl, gsap } = ctx;
    const w = cue.widthPx ?? 820;
    const h = cue.heightPx ?? 130;
    const pill = div({ width: w + 'px', height: h + 'px', borderRadius: h / 2 + 'px', overflow: 'hidden', ...glassCss({ blurPx: 24 }) }, ctx.layer(cue.layer || 'front'));
    const btn = div({ width: `${h - 26}px`, height: `${h - 26}px`, left: '13px', top: '13px', borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, ${ORANGE_HOT}, ${ORANGE} 65%)`, boxShadow: `0 0 30px rgba(243,146,0,0.6), inset 0 2px 0 rgba(255,255,255,0.5)` }, pill);
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 48 48');
    Object.assign(svg.style, { position: 'absolute', left: '22%', top: '22%', width: '56%', height: '56%' });
    const p = document.createElementNS(ns, 'path');
    p.setAttribute('d', 'M8 10 h32 a4 4 0 0 1 4 4 v16 a4 4 0 0 1 -4 4 h-16 l-9 8 v-8 h-7 a4 4 0 0 1 -4 -4 v-16 a4 4 0 0 1 4 -4 z');
    p.setAttribute('fill', '#FFFFFF');
    svg.appendChild(p);
    btn.appendChild(svg);
    const tx = document.createElement('div');
    ctx.applyTextStyle(tx, { family: 'readex-pro', weight: 600, sizePx: cue.sizePx ?? 52, color: '#FFFFFF' });
    Object.assign(tx.style, { position: 'absolute', top: '50%', right: '48px', transform: 'translateY(-50%)', whiteSpace: 'nowrap' });
    tx.dir = 'rtl';
    tx.textContent = cue.label || 'شاركونا ف التعليقات';
    pill.appendChild(tx);
    ctx.place(pill, cue.position || { xPct: 50, yPct: 82 });
    gsap.set(pill, { autoAlpha: 0 });
    tl.set(pill, { autoAlpha: 1, immediateRender: false }, 0);
    tl.fromTo(pill, { width: h, opacity: 0, scale: 0.7 }, { width: w, opacity: 1, scale: 1, duration: 0.6, ease: ctx.ease('cubic-bezier(0.22,1,0.36,1)'), immediateRender: false }, 0);
    tl.fromTo(btn, { rotation: -120, scale: 0.4 }, { rotation: 0, scale: 1, duration: 0.5, ease: 'back.out(2)', immediateRender: false }, 0.05);
    tl.fromTo(tx, { opacity: 0, x: 40, filter: 'blur(8px)' }, { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.45, ease: 'power3.out', immediateRender: false }, 0.35);
    // gentle "tap" pulse on the button after landing
    tl.to(btn, { scale: 0.9, duration: 0.14, ease: 'power2.in', yoyo: true, repeat: 1, immediateRender: false }, 1.1);
    hideAtEnd(ctx, pill);
  };
})();
