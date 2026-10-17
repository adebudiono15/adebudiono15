import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import plan from "./plan.json";
import { FONT, GRADE, YELLOW, fontFaces } from "./theme";

// TikTok cover: a question viewers answer in the comments, and whose answer
// (the price) is only in the yellow basket. Text sits inside the 3:4 area the
// profile grid shows (roughly y 240–1680).
const SHIFT = 190;

export const CoverArt: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "black" }}>
    <style>{fontFaces}</style>
    {/* Blurred fill behind, sharp frame shifted down so the headline sits above the face */}
    <OffthreadVideo
      src={staticFile("source.mp4")}
      muted
      trimBefore={Math.round(plan.cover.frameAt * plan.fps)}
      style={{ width: "100%", height: "100%", objectFit: "cover", filter: `${GRADE} blur(28px) brightness(0.55)`, transform: "scale(1.15)" }}
    />
    <AbsoluteFill style={{ transform: `translateY(${SHIFT}px)`, WebkitMaskImage: "linear-gradient(180deg, transparent 0px, black 140px)" }}>
      <OffthreadVideo
        src={staticFile("source.mp4")}
        muted
        trimBefore={Math.round(plan.cover.frameAt * plan.fps)}
        style={{ width: "100%", height: "100%", objectFit: "cover", filter: GRADE }}
      />
    </AbsoluteFill>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 30%)" }} />
    <AbsoluteFill style={{ top: 250, alignItems: "center" }}>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 40,
          color: "white",
          textShadow: "0 2px 12px rgba(0,0,0,0.6)",
        }}
      >
        {plan.cover.kicker}
      </div>
      <div
        style={{
          marginTop: 12,
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 58,
          whiteSpace: "nowrap",
          color: "#111",
          background: YELLOW,
          padding: "8px 26px 14px",
          borderRadius: 14,
          boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        }}
      >
        {plan.cover.headline}
      </div>
    </AbsoluteFill>
    <AbsoluteFill style={{ top: 1560, alignItems: "center" }}>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 34,
          color: "#111",
          background: "rgba(255,255,255,0.94)",
          padding: "10px 26px 14px",
          borderRadius: 999,
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
        }}
      >
        {plan.cover.footer}
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);
