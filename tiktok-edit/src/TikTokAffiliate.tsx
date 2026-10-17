import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import plan from "./plan.json";
import captions from "./captions.json";

const SOURCE = staticFile("source.mp4");
const GRADE = "contrast(1.07) saturate(1.15) brightness(1.03)";
const YELLOW = "#FFE34D";

const fontFaces = `
@font-face { font-family: 'Montserrat'; font-weight: 800; src: url(${staticFile("fonts/montserrat-latin-800-normal.woff2")}) format('woff2'); }
@font-face { font-family: 'Montserrat'; font-weight: 900; src: url(${staticFile("fonts/montserrat-latin-900-normal.woff2")}) format('woff2'); }
`;
const FONT = "'Montserrat', 'Noto Color Emoji', sans-serif";

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
  { clip: 1, text: "🏔️ OUTDOOR & HIKING", sfx: "pop" },
  { clip: 2, text: "🌬️ BAHAN MESH, ADEM", sfx: "pop" },
  { clip: 3, text: "🚫 GAK PERLU DITALI", sfx: "pop" },
  { clip: 4, text: "⚡ TINGGAL TARIK!", sfx: "pop" },
  { clip: 5, text: "💸 HARGA EKONOMIS", sfx: "kaching" },
  { clip: 6, text: "✅ SOL ANTI SLIP", sfx: "pop" },
  { clip: 7, text: "💪 LENTUR & KOKOH", sfx: "pop" },
];
const CTA_CLIP = 8;

// Every A-roll clip: a punch-in on the cut plus a slow push so no shot sits still.
const ARollClip: React.FC<{ from: number; frames: number; index: number }> = ({ from, frames, index }) => {
  const frame = useCurrentFrame();
  const punch = interpolate(frame, [0, 7], [1.12, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const push = interpolate(frame, [0, frames], [1, 1.05]);
  const base = index % 2 === 1 ? 1.08 : 1;
  return (
    <AbsoluteFill style={{ transform: `scale(${punch * push * base})`, transformOrigin: "50% 62%" }}>
      <OffthreadVideo
        src={SOURCE}
        trimBefore={Math.round(from * plan.fps)}
        playbackRate={plan.speed}
        style={{ width: "100%", height: "100%", objectFit: "cover", filter: GRADE }}
      />
    </AbsoluteFill>
  );
};

// Close-up product cutaways laid over the talking clips (voice keeps playing underneath).
const BRoll: React.FC<{ from: number; frames: number }> = ({ from, frames }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 8, frames], [1.2, 1.04, 1.1], {
    easing: Easing.out(Easing.cubic),
  });
  const opacity = interpolate(frame, [0, 3], [0, 1], { extrapolateRight: "clamp" });
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

// White flash on every hard cut to sell the transition.
const Flash: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 4], [0.35, 0], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ backgroundColor: "white", opacity }} />;
};

const strokeText: React.CSSProperties = {
  fontFamily: FONT,
  fontWeight: 900,
  color: "white",
  WebkitTextStroke: "12px black",
  paintOrder: "stroke fill",
  textShadow: "0 6px 18px rgba(0,0,0,0.55)",
};

type Chunk = (typeof captions.chunks)[number];

// Word-by-word captions: the chunk pops in, the spoken word turns yellow.
const Caption: React.FC<{ chunk: Chunk }> = ({ chunk }) => {
  const frame = useCurrentFrame() + chunk.start;
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - chunk.start, fps, config: { damping: 12, stiffness: 220, mass: 0.6 } });
  const scale = interpolate(pop, [0, 1], [0.6, 1]);
  return (
    <AbsoluteFill style={{ top: 1250, height: 260, left: 70, width: 860, alignItems: "center" }}>
      <div
        style={{
          ...strokeText,
          fontSize: 74,
          lineHeight: 1.15,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          columnGap: 34,
          width: 860,
          transform: `scale(${scale})`,
          textTransform: "uppercase",
        }}
      >
        {chunk.words.map((w, i) => {
          const next = chunk.words[i + 1]?.start ?? chunk.end;
          const active = frame >= w.start && frame < next;
          return (
            <span
              key={i}
              style={{
                color: active ? YELLOW : "white",
                transform: `translateY(${active ? -4 : 0}px)`,
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const useEntrance = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 11, stiffness: 180, mass: 0.7 } });
};

// Hook in the first 3 seconds: big headline with a shake on the boom.
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const a = useEntrance();
  const b = useEntrance(6);
  const shake = frame < 12 ? Math.sin(frame * 2.6) * (12 - frame) * 1.4 : 0;
  return (
    <AbsoluteFill style={{ top: 660, alignItems: "center", transform: `translateX(${shake}px)` }}>
      <div style={{ ...strokeText, fontSize: 96, transform: `scale(${a}) rotate(-3deg)` }}>SEPATU OUTDOOR</div>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 92,
          color: "black",
          background: YELLOW,
          padding: "6px 30px 10px",
          borderRadius: 18,
          marginTop: 8,
          transform: `scale(${b}) rotate(2deg)`,
          boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
        }}
      >
        TANPA TALI?! 😱
      </div>
    </AbsoluteFill>
  );
};

const Badge: React.FC<{ text: string; frames: number }> = ({ text, frames }) => {
  const frame = useCurrentFrame();
  const enter = useEntrance();
  const exit = interpolate(frame, [frames - 5, frames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const x = interpolate(enter, [0, 1], [-700, 0]);
  return (
    <AbsoluteFill style={{ top: 720, alignItems: "center" }}>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 64,
          color: "#111",
          background: "white",
          padding: "16px 34px",
          borderRadius: 999,
          border: `6px solid ${YELLOW}`,
          boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
          transform: `translateX(${x}px) rotate(-2deg)`,
          opacity: exit,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

// Closing call to action pointing at the product link (yellow basket) bottom-left.
const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const a = useEntrance();
  const b = useEntrance(10);
  const pulse = 1 + Math.sin(frame / 4) * 0.035;
  const bounce = Math.abs(Math.sin(frame / 5)) * 34;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ top: 170, alignItems: "center" }}>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 80,
            lineHeight: 1.05,
            textAlign: "center",
            color: "black",
            background: YELLOW,
            padding: "18px 36px 22px",
            borderRadius: 24,
            transform: `scale(${a * pulse}) rotate(-2deg)`,
            boxShadow: "0 14px 34px rgba(0,0,0,0.5)",
          }}
        >
          CEK KERANJANG
          <br />
          KUNING 🛒
        </div>
      </AbsoluteFill>
      <div
        style={{
          ...strokeText,
          position: "absolute",
          left: 250,
          top: 1500,
          fontSize: 56,
          transform: `scale(${b})`,
          transformOrigin: "left center",
        }}
      >
        LAGI BANYAK PROMO 🔥
      </div>
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 1430 + bounce,
          fontSize: 130,
          fontFamily: FONT,
          opacity: b,
          filter: "drop-shadow(0 8px 14px rgba(0,0,0,0.5))",
        }}
      >
        👇
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

      {cutFrames.map((f) => (
        <Sequence key={`f${f}`} from={f} durationInFrames={5}>
          <Flash />
        </Sequence>
      ))}

      {captions.chunks.map((ch, i) => (
        <Sequence key={`c${i}`} from={ch.start} durationInFrames={ch.end - ch.start}>
          <Caption chunk={ch} />
        </Sequence>
      ))}

      <Sequence from={0} durationInFrames={clipTimeline[1].start}>
        <Hook />
      </Sequence>
      {callouts.map((c) => {
        const clip = clipTimeline[c.clip];
        return (
          <Sequence key={c.text} from={clip.start + 3} durationInFrames={clip.frames - 3}>
            <Badge text={c.text} frames={clip.frames - 3} />
          </Sequence>
        );
      })}
      <Sequence from={clipTimeline[CTA_CLIP].start}>
        <CTA />
      </Sequence>

      {/* SFX: boom on the hook, whoosh on every cut, pop/ka-ching on callouts, soft tick on caption changes */}
      <Sfx at={0} name="boom" volume={0.38} />
      {cutFrames.map((f) => (
        <Sfx key={`w${f}`} at={f - 6} name="whoosh" volume={0.26} />
      ))}
      {callouts.map((c) => (
        <Sfx key={`p${c.text}`} at={clipTimeline[c.clip].start + 3} name={c.sfx} volume={c.sfx === "kaching" ? 0.45 : 0.5} />
      ))}
      <Sfx at={clipTimeline[CTA_CLIP].start} name="ding" volume={0.5} />
      <Sfx at={clipTimeline[CTA_CLIP].start + 10} name="pop" volume={0.45} />
      {tickFrames.map((f) => (
        <Sfx key={`t${f}`} at={f} name="tick" volume={0.14} />
      ))}
    </AbsoluteFill>
  );
};
