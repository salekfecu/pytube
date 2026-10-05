"""Align the IPSI script (6 sections) to the clip's voiced phrases without speech recognition.

Words get duration weights (Arabic: letters; French: syllables x k); the 15 voiced phrases from
speech.json are filled with contiguous word ranges by dynamic programming, minimising the squared
log-deviation of each phrase's speaking rate from the global rate, plus a penalty for phrase breaks
that do not fall on punctuation. Section start times are read from the best path; a sweep over the
free parameters reports how stable each boundary is.
"""
import json, math, re, sys, itertools
import numpy as np

SECTIONS = [
 ('S0 hook',          'باغيين تشتغلو ف الإعلام، وما عارفينش أشمن تخصص يناسبكم؟'),
 ('S1 intro',         'كنقترحو عليكم تلاتة ديال التخصصات ف IPSI، وكل واحد فيهم كيفتح آفاق مهنية واعدة.'),
 ('S2 multimedia',    'إلا كان الرقمي هو شغفكم: Développement Multimédia. غادي تتعلمو تصممو وتطورو وتنشرو منتوجات وخدمات ملتيميديا، باش تشتغلو كمطورين ف الوكالات وشركات المعلوميات، ومن بعد كرؤساء مشاريع.'),
 ('S3 audiovisual',   'إلا كانت الصورة هي لغتكم: Audiovisuel. الصورة، الصوت، الإضاءة وما بعد الإنتاج، باش تشتغلو كمصورين، تقنيي صوت، مونتورات ولا تقنيين ف الريجي، ف التلفزة، التصوير والعروض الحية.'),
 ('S4 communication', 'وإلا كنتو باغيين تقودو المشروع من الفكرة حتى للمنتوج النهائي: Concepteur et Producteur en Communication. الآفاق: صحفي مصور، مخرج، رئيس مونتاج ولا مكلف بالإنتاج.'),
 ('S5 outro',         'تلاتة ديال التخصصات، ديبلوم تقني متخصص، ومعاه ديبلوم دولي. وانتوما، شمن تخصص كيشبهكم؟ شاركونا ف التعليقات.'),
]
FR_SYL = {'Développement': 4, 'Multimédia': 5, 'Audiovisuel': 4, 'Concepteur': 3, 'et': 1, 'Producteur': 3, 'en': 1, 'Communication': 5, 'IPSI': 2}
PUNCT = '،,.:؟?!'

def words():
    out = []
    for si, (name, txt) in enumerate(SECTIONS):
        for k, w in enumerate(txt.split()):
            core = w.strip(PUNCT)
            strong = w[-1] in '.:؟?!' if w else False
            weak = w[-1] in '،,' if w else False
            out.append({'sec': si, 'first': k == 0, 'w': core, 'strong': strong or (k == len(txt.split()) - 1), 'weak': weak,
                        'fr': core in FR_SYL})
    return out

def weight(wd, kfr, larab):
    if wd['fr']:
        return FR_SYL[wd['w']] * kfr
    letters = len(re.sub(r'[^ء-ي]', '', wd['w']))
    return letters * larab + 0.6   # +0.6: a word onset/offset costs a little time

def align(phr, W, P_weak, P_none, lam=1.0):
    n, m = len(W), len(phr)
    durs = np.array([b - a for a, b in phr])
    rate = W.sum() / durs.sum()
    pre = np.concatenate([[0], np.cumsum(W)])
    INF = 1e18
    D = np.full((m + 1, n + 1), INF); B = np.zeros((m + 1, n + 1), int)
    D[0, 0] = 0
    for p in range(1, m + 1):
        for j in range(p, n - (m - p) + 1):
            best, arg = INF, -1
            for i in range(p - 1, j):
                if D[p - 1, i] >= INF: continue
                wsum = pre[j] - pre[i]
                c = lam * math.log(durs[p - 1] * rate / wsum) ** 2
                # break after word j-1 (unless last phrase)
                if p < m:
                    wd = WORDS[j - 1]
                    c += 0 if wd['strong'] else (P_weak if wd['weak'] else P_none)
                v = D[p - 1, i] + c
                if v < best: best, arg = v, i
            D[p, j], B[p, j] = best, arg
    # backtrack
    cuts, j = [], n
    for p in range(m, 0, -1):
        i = B[p, j]; cuts.append((i, j)); j = i
    cuts.reverse()
    return D[m, n], cuts, rate

WORDS = words()
if __name__ == '__main__':
    plate = sys.argv[1]
    phr = json.load(open(plate + '/speech.json'))['segments']
    results = []
    for kfr, larab, pw, pn in itertools.product([2.6, 3.3, 4.0], [0.9, 1.0, 1.1], [0.15, 0.4], [0.8, 1.6]):
        W = np.array([weight(w, kfr, larab) for w in WORDS])
        cost, cuts, rate = align(phr, W, pw, pn)
        # section start time = start of the phrase holding the section's first word (+ interpolation inside it)
        starts = []
        for si in range(len(SECTIONS)):
            wi = next(k for k, w in enumerate(WORDS) if w['sec'] == si)
            for p, (i, j) in enumerate(cuts):
                if i <= wi < j:
                    a, b = phr[p]
                    frac = W[i:wi].sum() / W[i:j].sum()
                    starts.append(round(a + frac * (b - a), 2)); break
        results.append(((kfr, larab, pw, pn), cost, starts, cuts))
    results.sort(key=lambda r: r[1])
    best = results[0]
    print('best params', best[0], 'cost', round(best[1], 3))
    print('section starts (best):', dict(zip([s[0] for s in SECTIONS], best[2])))
    arr = np.array([r[2] for r in results])
    print('across', len(results), 'parameter sets: median / min / max per section start')
    for si, (name, _) in enumerate(SECTIONS):
        print(f'  {name:18s} median {np.median(arr[:, si]):6.2f}  min {arr[:, si].min():6.2f}  max {arr[:, si].max():6.2f}')
    print('phrase contents (best):')
    for p, (i, j) in enumerate(best[3]):
        a, b = phr[p]
        print(f'  {a:6.2f}-{b:6.2f}  ' + ' '.join(w['w'] for w in WORDS[i:j]))
    json.dump({'phrases': [{'t': phr[p], 'text': ' '.join(w['w'] for w in WORDS[i:j]), 'sections': sorted({WORDS[k]['sec'] for k in range(i, j)})} for p, (i, j) in enumerate(best[3])],
               'sectionStarts': dict(zip([s[0] for s in SECTIONS], best[2])),
               'stability': {SECTIONS[si][0]: [float(np.median(arr[:, si])), float(arr[:, si].min()), float(arr[:, si].max())] for si in range(len(SECTIONS))}},
              open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
