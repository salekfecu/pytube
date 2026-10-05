"""Second alignment: per-word syllable estimates vs. per-phrase detected vowel nuclei AND durations."""
import json, math, re, itertools, sys
import numpy as np
import librosa
from scipy.signal import find_peaks
sys.path.insert(0, '.')
from align_script import SECTIONS, FR_SYL, PUNCT, words

def syl_ar(w):
    core = re.sub(r'[^ء-ي]', '', w)
    if not core: return 1
    v = len(re.findall(r'[اويىآأإ]', core[1:]))      # long vowels / glides (not word-initial alef)
    v += 1 if core.endswith('ة') else 0
    return max(1, v + (1 if len(core) >= 5 and v == 0 else 0) + (1 if len(core) >= 7 else 0))

plate = sys.argv[1]
y, sr = librosa.load(plate + '/audio.wav', sr=16000, mono=True)
S = np.abs(librosa.stft(y, n_fft=512, hop_length=160)); f = librosa.fft_frequencies(sr=sr, n_fft=512)
env = 20*np.log10(np.convolve(S[(f>300)&(f<2500)].sum(0), np.hanning(9)/4.5, mode='same') + 1e-6)
pk, _ = find_peaks(env, distance=11, prominence=3.0, height=np.percentile(env, 35)); tp = pk*160/sr
phr = json.load(open(plate + '/speech.json'))['segments']
nuc = np.array([((tp >= a) & (tp < b)).sum() for a, b in phr], float)
dur = np.array([b - a for a, b in phr])
WORDS = words()
syl = np.array([FR_SYL[w['w']] if w['fr'] else syl_ar(w['w']) for w in WORDS], float)
pre = np.concatenate([[0], np.cumsum(syl)])
def run(alpha, pw, pn):
    n, m = len(WORDS), len(phr)
    r_n = syl.sum() / nuc.sum(); r_t = syl.sum() / dur.sum()
    INF = 1e18; D = np.full((m+1, n+1), INF); B = np.zeros((m+1, n+1), int); D[0, 0] = 0
    for p in range(1, m+1):
        for j in range(p, n-(m-p)+1):
            best, arg = INF, -1
            for i in range(p-1, j):
                if D[p-1, i] >= INF: continue
                s = pre[j] - pre[i]
                c = alpha*math.log((nuc[p-1]*r_n + 1)/(s + 1))**2 + (1-alpha)*math.log(dur[p-1]*r_t/s)**2
                if p < m:
                    wd = WORDS[j-1]; c += 0 if wd['strong'] else (pw if wd['weak'] else pn)
                v = D[p-1, i] + c
                if v < best: best, arg = v, i
            D[p, j], B[p, j] = best, arg
    cuts, j = [], n
    for p in range(m, 0, -1):
        i = B[p, j]; cuts.append((i, j)); j = i
    return D[m, n], cuts[::-1]
res = []
for alpha, pw, pn in itertools.product([0.3, 0.5, 0.7, 0.9], [0.15, 0.4], [0.8, 1.6]):
    c, cuts = run(alpha, pw, pn)
    st = []
    for si in range(len(SECTIONS)):
        wi = next(k for k, w in enumerate(WORDS) if w['sec'] == si)
        for p, (i, j) in enumerate(cuts):
            if i <= wi < j:
                a, b = phr[p]; st.append(round(a + (pre[wi]-pre[i])/(pre[j]-pre[i])*(b-a), 2)); break
    res.append(((alpha, pw, pn), c, st, cuts))
arr = np.array([r[2] for r in res])
for si, (name, _) in enumerate(SECTIONS):
    vals, cnt = np.unique(arr[:, si], return_counts=True)
    print(f'{name:18s} ' + '  '.join(f'{v:.2f}x{c}' for v, c in zip(vals, cnt)))
best = min(res, key=lambda r: r[1])
print('example path (alpha=%s):' % (best[0],))
for p, (i, j) in enumerate(best[3]):
    print(f'  {phr[p][0]:6.2f}-{phr[p][1]:6.2f} nuc {int(nuc[p]):2d} syl {int(pre[j]-pre[i]):2d}  ' + ' '.join(w['w'] for w in WORDS[i:j]))
