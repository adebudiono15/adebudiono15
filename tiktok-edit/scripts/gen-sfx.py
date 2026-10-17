# Synthesizes the SFX used in the edit (no external sound library needed).
import numpy as np, wave, sys, os
SR = 48000
out = sys.argv[1]
rng = np.random.default_rng(7)

def save(name, x):
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.9
    st = np.stack([x, x], 1)
    with wave.open(os.path.join(out, name), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype(np.int16).tobytes())

def t(d): return np.arange(int(SR * d)) / SR

def lowpass(x, cutoff):
    # one-pole lowpass with per-sample cutoff
    cutoff = np.broadcast_to(cutoff, x.shape)
    y = np.zeros_like(x); a = 0.0
    for i in range(len(x)):
        k = 1 - np.exp(-2 * np.pi * cutoff[i] / SR)
        a += k * (x[i] - a); y[i] = a
    return y

# whoosh: noise swept up then down through a lowpass, swelling envelope
tt = t(0.42); n = rng.standard_normal(len(tt))
sweep = 300 + 5200 * np.sin(np.pi * tt / tt[-1]) ** 2
env = np.sin(np.pi * (tt / tt[-1]) ** 0.7) ** 2
w1 = lowpass(n, sweep) * env
save("whoosh.wav", w1 - lowpass(w1, 150 * np.ones_like(tt)))

# pop: fast downward pitch blip
tt = t(0.12)
f = 900 * np.exp(-tt * 28) + 280
save("pop.wav", np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 38))

# tick: tiny soft click for caption changes
tt = t(0.05)
save("tick.wav", np.sin(2 * np.pi * 2400 * tt) * np.exp(-tt * 140) + 0.3 * rng.standard_normal(len(tt)) * np.exp(-tt * 300))

# boom: sub impact for the hook
tt = t(0.9)
f = 120 * np.exp(-tt * 6) + 38
b = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 4.5)
b += 0.4 * lowpass(rng.standard_normal(len(tt)), 900 * np.ones_like(tt)) * np.exp(-tt * 18)
save("boom.wav", np.tanh(b * 1.8))

# ka-ching: metallic click + bright bell partials
tt = t(0.9)
click = rng.standard_normal(len(tt)) * np.exp(-tt * 120)
bell = sum(a * np.sin(2 * np.pi * fr * tt) for fr, a in [(2093, 1), (2637, .7), (3136, .5), (4186, .35)])
delay = int(0.07 * SR)
bell = np.concatenate([np.zeros(delay), bell[:-delay]]) * np.exp(-np.maximum(tt - 0.07, 0) * 5)
save("kaching.wav", 0.5 * click + bell)

# ding: soft notification bell for the CTA
tt = t(1.0)
save("ding.wav", sum(a * np.sin(2 * np.pi * fr * tt) * np.exp(-tt * d) for fr, a, d in [(1318.5, 1, 4), (1975.5, .5, 5), (2637, .25, 7)]))
