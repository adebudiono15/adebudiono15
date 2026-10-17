# Builds word-level caption timings from plan.json: words are spread across each
# clip's speech by length, then chunk boundaries snap to real pauses in the audio.
import json, re, sys, wave, numpy as np
plan_path, wav_path, out_path = sys.argv[1:4]
plan = json.load(open(plan_path))
fps, speed = plan["fps"], plan["speed"]

w = wave.open(wav_path); sr = w.getframerate()
a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
if w.getnchannels() == 2: a = a.reshape(-1, 2).mean(1)
hop = sr // 100
env = np.convolve([np.sqrt(np.mean(a[i*hop:(i+1)*hop]**2)) for i in range(len(a)//hop)], np.ones(3)/3, "same")
quiet = env < np.percentile(env, 25) * 1.3

def nearest_pause(t, lo, hi, reach=0.35):
    i0, i1 = int(max(lo, t - reach) * 100), int(min(hi, t + reach) * 100)
    idx = np.where(quiet[i0:i1])[0]
    if len(idx) == 0: return t
    cand = (i0 + idx) / 100
    return float(cand[np.argmin(abs(cand - t))])

def chunk(words):
    out, cur = [], []
    for wd in words:
        cur.append(wd)
        txt = " ".join(cur)
        if (re.search(r"[,.!?]$", wd) and len(cur) >= 2) or len(cur) >= 3 or len(txt) >= 16:
            out.append(cur); cur = []
    if cur:
        if out and len(cur) == 1: out[-1] += cur
        else: out.append(cur)
    return out

chunks, start_frame = [], 0
for c in plan["clips"]:
    s, e = c["from"], c["to"]
    dur_frames = round((e - s) / speed * fps)
    i0, i1 = int(s*100), int(e*100)
    loud = np.where(~quiet[i0:i1])[0]
    vs, ve = (i0 + loud[0]) / 100, (i0 + loud[-1]) / 100
    groups = chunk(c["text"].split())
    weights = [sum(len(x) + 1 for x in g) for g in groups]
    bounds = [vs]
    for k in range(1, len(groups)):
        t = vs + (ve - vs) * sum(weights[:k]) / sum(weights)
        bounds.append(max(bounds[-1] + 0.25, nearest_pause(t, vs, ve)))
    bounds.append(ve)
    to_frame = lambda t: start_frame + round((t - s) / speed * fps)
    for k, g in enumerate(groups):
        a0, a1 = bounds[k], bounds[k+1]
        lens = [len(x) + 1 for x in g]
        words, acc = [], a0
        for x, L in zip(g, lens):
            nxt = acc + (a1 - a0) * L / sum(lens)
            words.append({"text": x, "start": to_frame(acc)})
            acc = nxt
        end = to_frame(a1) if k < len(groups) - 1 else start_frame + dur_frames
        if c is plan["clips"][-1] and k == len(groups) - 1: end = plan["durationInFrames"]
        chunks.append({"start": to_frame(a0) if k else start_frame, "end": end, "words": words})
    start_frame += dur_frames

json.dump({"chunks": chunks, "clipFrames": [round((c["to"]-c["from"])/speed*fps) for c in plan["clips"]]}, open(out_path, "w"), ensure_ascii=False, indent=1)
print("total A-roll frames", start_frame)
for ch in chunks: print(ch["start"], ch["end"], " ".join(w["text"] for w in ch["words"]))
