# TikTok affiliate edit (Remotion)

30-second vertical (1080x1920, 30fps) edit of a sneaker review for TikTok Shop affiliate.

Structure: hook (0–3s) → feature cuts with close-up product B-roll → CTA "cek keranjang kuning".
Word-by-word captions, feature badges, and SFX on every clip cut (whoosh), callout (pop / ka-ching), and caption change (tick).

## Rebuild

1. Put the source footage at `public/source.mp4` (H.264, 30fps):
   `ffmpeg -i input.mov -vf fps=30 -c:v libx264 -crf 14 -pix_fmt yuv420p -af "highpass=f=80,afftdn=nf=-28" -c:a aac -ar 48000 public/source.mp4`
2. `python3 scripts/gen-sfx.py public/sfx` — synthesizes the SFX.
3. `python3 scripts/captions.py src/plan.json <audio16k.wav> src/captions.json` — caption timings (cut list lives in `src/plan.json`).
4. `npm run render -- --browser-executable=<chromium headless shell>`
5. Normalize for TikTok: `ffmpeg -i out/raw.mp4 -t 30 -c:v copy -af loudnorm=I=-14:TP=-1.5 -c:a aac out/final.mp4`
