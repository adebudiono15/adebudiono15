import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import plan from "./plan.json";
import captions from "./captions.json";

const SOURCE = staticFile("source.mp4");
const GRADE = "contrast(1.05) saturate(1.08) brightness(1.02)";
const YELLOW = "#FFE34D";

const fontFaces = `
@font-face { font-family: 'Montserrat'; font-weight: 800; src: url(${staticFile("fonts/montserrat-latin-800-normal.woff2")}) format('woff2'); }
@font-face { font-family: 'Montserrat'; font-weight: 900; src: url(${staticFile("fonts/montserrat-latin-900-normal.woff2")}) format('woff2'); }
`;
const FONT = "'Montserrat', sans-serif";

// Top-left anchor for the hook, feature points and CTA: clear of the face
// (centered) and of TikTok's own UI (top tabs, right-hand buttons).
const LEFT = 56;
const TOP = 230;

// Where each A-roll clip lands on the 900-frame timeline. The last clip runs to
// the end so the CTA holds after the voice stops.
const clipStarts = captions.clipFrames.reduce<number[]>(
  (acc, f) => [...acc, acc[acc.length - 1] + f],
  [0],
);
const clipTimeline = plan.clips.map((c, i) => ({
  ...c,
  start: clipStarts[i],
  frames: i === plan.clips.length - 1 ? plan.durationInFrames - clipStarts[i] : captions.clipFrames[i],
}));

type Callout = { clip: number; text: string; sfx: "pop" | "kaching" };
const callouts: Callout[] = [
  { clip: 1, text: "Outdoor & hiking", sfx: "pop" },
  { clip: 2, text: "Bahan mesh, adem", sfx: "pop" },
  { clip: 3, text: "Gak perlu ditali", sfx: "pop" },
  { clip: 4, text: "Tinggal tarik", sfx: "pop" },
  { clip: 5, text: "Harga ekonomis", sfx: "kaching" },
  { clip: 6, text: "Sol anti slip", sfx: "pop" },
  { clip: 7, text: "Lentur & kokoh", sfx: "pop" },
];
const CTA_CLIP = 8;

const ease = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) } as const;

// Fade/slide in over a few frames and fade out at the end: enough motion to feel alive, never jumpy.
const useSoftInOut = (frames: number, inFrames = 8, outFrames = 6) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, inFrames], [0, 1], ease);
  const exit = interpolate(frame, [frames - outFrames, frames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return { opacity: Math.min(enter, exit), enter };
};

// A-roll clips alternate between two framings (classic jump-cut) with a slow push-in.
const ARollClip: React.FC<{ from: number; frames: number; index: number }> = ({ from, frames, index }) => {
  const frame = useCurrentFrame();
  const push = interpolate(frame, [0, frames], [1, 1.03]);
  const base = index % 2 === 1 ? 1.05 : 1;
  return (
    <AbsoluteFill style={{ transform: `scale(${push * base})`, transformOrigin: "50% 60%" }}>
      <OffthreadVideo
        src={SOURCE}
        trimBefore={Math.round(from * plan.fps)}
        playbackRate={plan.speed}
        style={{ width: "100%", height: "100%", objectFit: "cover", filter: GRADE }}
      />
    </AbsoluteFill>
  );
};

// Close-up product cutaways over the talking clips (voice keeps playing underneath), cross-faded in and out.
const BRoll: React.FC<{ from: number; frames: number }> = ({ from, frames }) => {
  const frame = useCurrentFrame();
  const { opacity } = useSoftInOut(frames, 6, 5);
  const scale = interpolate(frame, [0, frames], [1.02, 1.07]);
  return (
    <AbsoluteFill style={{ opacity, transform: `scale(${scale})` }}>
      <OffthreadVideo
        src={SOURCE}
        muted
        trimBefore={Math.round(from * plan.fps)}
        style={{ width: "100%", height: "100%", objectFit: "cover", filter: GRADE }}
      />
    </AbsoluteFill>
  );
};

const shadowText: React.CSSProperties = {
  fontFamily: FONT,
  fontWeight: 800,
  color: "white",
  WebkitTextStroke: "5px rgba(0,0,0,0.85)",
  paintOrder: "stroke fill",
  textShadow: "0 2px 10px rgba(0,0,0,0.45)",
};

type Chunk = (typeof captions.chunks)[number];

// Captions in sentence case; the spoken word is tinted yellow.
const Caption: React.FC<{ chunk: Chunk }> = ({ chunk }) => {
  const frame = useCurrentFrame() + chunk.start;
  const local = frame - chunk.start;
  const opacity = interpolate(local, [0, 4], [0, 1], ease);
  const y = interpolate(local, [0, 4], [8, 0], ease);
  return (
    <AbsoluteFill style={{ top: 1300, height: 200, left: 90, width: 820, alignItems: "center" }}>
      <div
        style={{
          ...shadowText,
          fontSize: 44,
          lineHeight: 1.2,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          columnGap: 14,
          width: 820,
          opacity,
          transform: `translateY(${y}px)`,
        }}
      >
        {chunk.words.map((w, i) => {
          const next = chunk.words[i + 1]?.start ?? chunk.end;
          const active = frame >= w.start && frame < next;
          return (
            <span key={i} style={{ color: active ? YELLOW : "white" }}>
              {w.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const TopLeft: React.FC<{ children: React.ReactNode; opacity: number; enter: number }> = ({ children, opacity, enter }) => (
  <div
    style={{
      position: "absolute",
      left: LEFT,
      top: TOP,
      opacity,
      transform: `translateX(${interpolate(enter, [0, 1], [-24, 0])}px)`,
    }}
  >
    {children}
  </div>
);

const Hook: React.FC<{ frames: number }> = ({ frames }) => {
  const { opacity, enter } = useSoftInOut(frames, 10);
  return (
    <TopLeft opacity={opacity} enter={enter}>
      <div style={{ ...shadowText, fontSize: 46, lineHeight: 1.15 }}>Sepatu outdoor</div>
      <div
        style={{
          display: "inline-block",
          marginTop: 6,
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 42,
          color: "#111",
          background: YELLOW,
          padding: "2px 14px 6px",
          borderRadius: 10,
        }}
      >
        tanpa tali?
      </div>
    </TopLeft>
  );
};

const Badge: React.FC<{ text: string; frames: number }> = ({ text, frames }) => {
  const { opacity, enter } = useSoftInOut(frames);
  return (
    <TopLeft opacity={opacity} enter={enter}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 34,
          color: "#111",
          background: "rgba(255,255,255,0.94)",
          padding: "10px 22px 12px 14px",
          borderRadius: 12,
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ width: 6, height: 34, borderRadius: 3, background: YELLOW }} />
        {text}
      </div>
    </TopLeft>
  );
};

const DownArrow: React.FC = () => (
  <svg width="44" height="56" viewBox="0 0 44 56" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.5))" }}>
    <path d="M22 4 V44 M6 30 L22 48 L38 30" stroke={YELLOW} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

// Closing call to action, plus a small arrow toward the product link bottom-left.
const CTA: React.FC<{ frames: number }> = ({ frames }) => {
  const frame = useCurrentFrame();
  const { enter } = useSoftInOut(frames + 10, 10);
  const sub = interpolate(frame, [10, 18], [0, 1], ease);
  const bob = Math.sin(frame / 7) * 6;
  return (
    <AbsoluteFill>
      <TopLeft opacity={enter} enter={enter}>
        <div
          style={{
            display: "inline-block",
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 40,
            color: "#111",
            background: YELLOW,
            padding: "8px 20px 12px",
            borderRadius: 12,
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
          }}
        >
          Cek keranjang kuning
        </div>
        <div style={{ ...shadowText, fontSize: 32, marginTop: 10, opacity: sub }}>Lagi banyak promo</div>
      </TopLeft>
      <div style={{ position: "absolute", left: 70, top: 1440 + bob, opacity: sub }}>
        <DownArrow />
      </div>
    </AbsoluteFill>
  );
};

const Sfx: React.FC<{ at: number; name: string; volume: number }> = ({ at, name, volume }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={45} layout="none">
    <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
  </Sequence>
);

export const TikTokAffiliate: React.FC = () => {
  const cutFrames = [
    ...clipTimeline.slice(1).map((c) => c.start),
    ...plan.broll.flatMap((b) => [b.atFrame, b.atFrame + b.frames]).filter((f) => f < plan.durationInFrames),
  ];
  const calloutFrames = new Set(callouts.map((c) => clipTimeline[c.clip].start + 3));
  const tickFrames = captions.chunks
    .map((c) => c.start)
    .filter((f) => f > 0 && !cutFrames.includes(f) && !calloutFrames.has(f));
  const ctaStart = clipTimeline[CTA_CLIP].start;

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <style>{fontFaces}</style>

      {clipTimeline.map((c, i) => (
        <Sequence key={`a${i}`} from={c.start} durationInFrames={c.frames}>
          <ARollClip from={c.from} frames={c.frames} index={i} />
        </Sequence>
      ))}

      {plan.broll.map((b, i) => (
        <Sequence key={`b${i}`} from={b.atFrame} durationInFrames={b.frames}>
          <BRoll from={b.from} frames={b.frames} />
        </Sequence>
      ))}

      {captions.chunks.map((ch, i) => (
        <Sequence key={`c${i}`} from={ch.start} durationInFrames={ch.end - ch.start}>
          <Caption chunk={ch} />
        </Sequence>
      ))}

      <Sequence from={0} durationInFrames={clipTimeline[1].start}>
        <Hook frames={clipTimeline[1].start} />
      </Sequence>
      {callouts.map((c) => {
        const clip = clipTimeline[c.clip];
        return (
          <Sequence key={c.text} from={clip.start + 3} durationInFrames={clip.frames - 3}>
            <Badge text={c.text} frames={clip.frames - 3} />
          </Sequence>
        );
      })}
      <Sequence from={ctaStart}>
        <CTA frames={plan.durationInFrames - ctaStart} />
      </Sequence>

      {/* SFX kept quiet under the voice: whoosh on cuts, pop/ka-ching on points, soft tick on caption changes */}
      <Sfx at={0} name="pop" volume={0.14} />
      {cutFrames.map((f) => (
        <Sfx key={`w${f}`} at={f - 6} name="whoosh" volume={0.08} />
      ))}
      {callouts.map((c) => (
        <Sfx key={`p${c.text}`} at={clipTimeline[c.clip].start + 3} name={c.sfx} volume={c.sfx === "kaching" ? 0.16 : 0.12} />
      ))}
      <Sfx at={ctaStart} name="ding" volume={0.15} />
      {tickFrames.map((f) => (
        <Sfx key={`t${f}`} at={f} name="tick" volume={0.04} />
      ))}
    </AbsoluteFill>
  );
};
