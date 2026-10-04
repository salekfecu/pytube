#!/usr/bin/env node
// Render a scene: plate (from prepare.py) + style (style.json + components.js) + scene.json → MP4.
//
//   node render.mjs --plate PLATE_DIR --style ../styles/style-1/style.json --scene scene.json --out out.mp4
//        [--workers 3] [--from 0] [--to N] [--stills 0,45,90 --stills-dir DIR] [--no-audio]
//
// Frames are rendered by headless Chromium (one paused GSAP timeline seeked per frame), captured as JPEG
// and piped into ffmpeg. Workers render disjoint frame ranges in parallel and are concatenated.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { spawn, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
    return acc;
  }, []),
);
if (!args.plate || !args.style || !args.scene) {
  console.error('usage: node render.mjs --plate DIR --style style.json --scene scene.json --out out.mp4');
  process.exit(1);
}

const plateDir = path.resolve(args.plate);
const stylePath = path.resolve(args.style);
const styleDir = path.dirname(stylePath);
const meta = JSON.parse(fs.readFileSync(path.join(plateDir, 'meta.json'), 'utf8'));
const faces = fs.existsSync(path.join(plateDir, 'faces.json')) ? JSON.parse(fs.readFileSync(path.join(plateDir, 'faces.json'), 'utf8')) : [];
const style = JSON.parse(fs.readFileSync(stylePath, 'utf8'));
const scenePath = path.resolve(args.scene);
const scene = JSON.parse(fs.readFileSync(scenePath, 'utf8'));
const fps = meta.fps;
const totalFrames = scene.frames || meta.frames;
const from = Number(args.from || 0);
const to = Math.min(Number(args.to || totalFrames), totalFrames);
const workers = Math.max(1, Number(args.workers || 3));

// ---------- fonts: @font-face for every family the style (or scene) references ----------
function fontFaceCss() {
  const fam = new Set(['noto-sans-arabic']);
  for (const f of style.fonts || []) fam.add(String(f.fontsource || f.family).replace(/^@fontsource\//, '').toLowerCase().replace(/\s+/g, '-'));
  const walk = (o) => {
    if (!o || typeof o !== 'object') return;
    if (typeof o.family === 'string') fam.add(o.family.replace(/^@fontsource\//, '').toLowerCase().replace(/\s+/g, '-'));
    Object.values(o).forEach(walk);
  };
  walk(scene);
  walk(style.textPresets);
  let css = '';
  for (const f of fam) {
    const dir = path.join(HERE, 'node_modules/@fontsource', f, 'files');
    if (!fs.existsSync(dir)) { console.warn(`[fonts] @fontsource/${f} not installed (npm i @fontsource/${f})`); continue; }
    for (const file of fs.readdirSync(dir)) {
      const m = file.match(/^.+-(arabic|latin)-(\d{3})-normal\.woff2$/);
      if (!m) continue;
      const range = m[1] === 'arabic' ? 'U+0600-06FF,U+0750-077F,U+0870-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FEFF' : 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
      css += `@font-face{font-family:'${f}';font-style:normal;font-weight:${m[2]};font-display:block;src:url('${pathToFileURL(path.join(dir, file)).href}') format('woff2');unicode-range:${range};}\n`;
    }
  }
  return css;
}

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: meta.width, height: meta.height }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (['warning', 'error'].includes(m.type())) console.log(`[page ${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  const config = {
    meta, faces, style, scene,
    plateUrl: pathToFileURL(plateDir).href + '/',
    assetBase: pathToFileURL(path.dirname(scenePath)).href + '/',
    styleBase: pathToFileURL(styleDir).href + '/',
  };
  await page.addInitScript((c) => { window.__MG__ = c; }, config);
  await page.goto(pathToFileURL(path.join(HERE, 'compositor/index.html')).href);
  await page.evaluate((css) => { document.getElementById('fontfaces').textContent = css; }, fontFaceCss());
  // shared component library first, then the style's own components (may override), then the runtime
  const shared = path.join(HERE, 'compositor/components-shared.js');
  if (fs.existsSync(shared)) await page.addScriptTag({ path: shared });
  const comps = path.join(styleDir, 'components.js');
  if (fs.existsSync(comps)) await page.addScriptTag({ path: comps });
  for (const extra of scene.scripts || []) await page.addScriptTag({ path: path.resolve(path.dirname(scenePath), extra) });
  await page.addScriptTag({ path: path.join(HERE, 'compositor/runtime.js') });
  await page.evaluate(() => window.mgInit());
  return page;
}

const launchArgs = ['--allow-file-access-from-files', '--disable-web-security', '--font-render-hinting=none', '--force-color-profile=srgb', '--disable-lcd-text'];

async function renderStills() {
  const outDir = path.resolve(args['stills-dir'] || 'stills');
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ args: launchArgs });
  const page = await openPage(browser);
  // ascending order: GSAP timelines are only deterministic for forward seeks from a fresh page (a backward seek
  // reverts later cues to start values recorded at init, which can differ from their pristine build state)
  const list = [...new Set(String(args.stills).split(',').map(Number))].sort((a, b) => a - b);
  for (const i of list) {
    await page.evaluate((k) => window.renderFrame(k), i);
    await page.screenshot({ path: path.join(outDir, `still_${String(i).padStart(5, '0')}.png`) });
  }
  await browser.close();
  console.log(`stills → ${outDir}`);
}

async function renderRange(browser, a, b, segPath, wid) {
  const page = await openPage(browser);
  const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(fps), segPath], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exit ' + c)))));
  const t0 = Date.now();
  for (let i = a; i < b; i++) {
    await page.evaluate((k) => window.renderFrame(k), i);
    const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((i - a) % 60 === 0) console.log(`  [w${wid}] frame ${i}/${b - 1}  ${((i - a + 1) / ((Date.now() - t0) / 1000)).toFixed(1)} fps`);
  }
  ff.stdin.end();
  await done;
  await page.close();
}

async function renderVideo() {
  const out = path.resolve(args.out || 'out.mp4');
  const tmp = out + '.parts';
  fs.mkdirSync(tmp, { recursive: true });
  const browser = await chromium.launch({ args: launchArgs });
  const n = to - from;
  const per = Math.ceil(n / workers);
  const jobs = [];
  const segs = [];
  for (let w = 0; w < workers; w++) {
    const a = from + w * per;
    const b = Math.min(to, a + per);
    if (a >= b) break;
    const seg = path.join(tmp, `seg_${w}.mp4`);
    segs.push(seg);
    jobs.push(renderRange(browser, a, b, seg, w));
  }
  const t0 = Date.now();
  await Promise.all(jobs);
  await browser.close();
  fs.writeFileSync(path.join(tmp, 'list.txt'), segs.map((s) => `file '${s}'`).join('\n'));
  const videoOnly = path.join(tmp, 'video.mp4');
  spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-c', 'copy', videoOnly], { stdio: 'inherit' });

  // audio: voice + synthesized SFX from scene cues / style rules
  let audio = path.join(plateDir, 'audio.wav');
  if (!args['no-audio']) {
    const mix = path.join(tmp, 'mix.wav');
    const r = spawnSync('python3', [path.join(HERE, 'audio.py'), '--plate', plateDir, '--scene', scenePath, '--style', stylePath, '--out', mix], { stdio: 'inherit' });
    if (r.status === 0 && fs.existsSync(mix)) audio = mix;
  }
  const ss = from / fps;
  const dur = n / fps;
  const muxArgs = ['-loglevel', 'error', '-y', '-i', videoOnly];
  // Audio is padded with silence (apad) and the OUTPUT is cut to exactly n / fps: '-shortest' used to stop at the end
  // of the audio, which drops the last 1-4 frames whenever the plate audio is a few ms shorter than the video.
  if (!args['no-audio'] && fs.existsSync(audio)) muxArgs.push('-ss', String(ss), '-t', String(dur), '-i', audio, '-map', '0:v', '-map', '1:a', '-af', 'apad', '-c:a', 'aac', '-b:a', '192k');
  muxArgs.push('-c:v', 'copy', '-t', dur.toFixed(6), '-movflags', '+faststart', out);
  spawnSync('ffmpeg', muxArgs, { stdio: 'inherit' });
  fs.rmSync(tmp, { recursive: true, force: true });
  const probe = spawnSync('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', out], { encoding: 'utf8' });
  const got = Number(String(probe.stdout || '').trim());
  if (got && got !== n) console.warn(`[mux] WARNING: ${out} has ${got} frames, expected ${n}`);
  console.log(`rendered ${n} frames in ${((Date.now() - t0) / 1000).toFixed(1)} s → ${out}${got ? ` (${got} frames)` : ''}`);
}

if (args.stills) await renderStills();
else await renderVideo();
