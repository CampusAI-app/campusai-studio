/**
 * /headline: a front page. The headline stamps word by word (shelf shot `paper-title-card`), the camera
 * pulls back from it to the whole page, the columns write in (`document-typewriter-reveal`). The masthead is
 * our own feature's name, so we never invent a paper or look like a real one. Every line needs a source.
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, DUR } from "../system/motion";
import { B, Clip, Cue, INTER, PAPER, PRINT, RED, ZODIAK, clamp, ramp } from "./common";

export type HeadlineProps = {
  masthead: string; dateline: string; headline: string; accent: string; deck: string;
  columns: string[]; source: string; photo: { src: string; pageW: number; crop: { x: number; y: number; w: number; h: number } };
};
export const HEADLINE_END = 285;
const STAMP = 7;
const PAGE_W = 960;

export const Headline: React.FC<HeadlineProps> = ({ masthead, dateline, headline, accent, deck, columns, source, photo }) => {
  const f = useCurrentFrame();
  const { height } = useVideoConfig();
  const words = headline.split(" ");
  const pull = ramp(f, 62, 62 + DUR.reveal + 24, CURVE.quiet.standard);
  const scale = interpolate(pull, [0, 1], [1.16, 0.97], clamp);
  const shift = interpolate(pull, [0, 1], [300, 0], clamp);
  const photoScale = PAGE_W / photo.crop.w;
  const fade = (a: number) => ramp(f, a, a + DUR.arrive, CURVE.quiet.enter);
  return (
    <Clip endAt={HEADLINE_END} ground={PRINT} noLogo>
      <AbsoluteFill style={{ transform: `translateY(${shift}px) scale(${scale.toFixed(4)})`, transformOrigin: "50% 34%" }}>
        <div style={{ position: "absolute", left: 60, width: PAGE_W, top: height * 0.5 - 780, height: 1560, background: PAPER, color: PRINT, boxShadow: "0 30px 90px rgba(0,0,0,.7)", overflow: "hidden" }}>
          <div style={{ padding: "56px 56px 0" }}>
            <div style={{ fontFamily: ZODIAK, fontWeight: 700, fontSize: 112, textAlign: "center", letterSpacing: "-0.02em", lineHeight: 1 }}>{masthead}</div>
            <div style={{ borderTop: `3px solid ${PRINT}`, borderBottom: `1px solid ${PRINT}`, marginTop: 22, padding: "12px 0", fontFamily: INTER, fontSize: 24, fontWeight: 500, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Img src={staticFile(B.logo!.onLight)} style={{ width: 170, height: "auto" }} />
              <span>{dateline}</span>
            </div>
            <div style={{ fontFamily: ZODIAK, fontWeight: 700, fontSize: 118, lineHeight: 1.02, letterSpacing: "-0.025em", marginTop: 34 }}>
              {words.map((w, i) => {
                const at = 3 + i * STAMP;
                const k = ramp(f, at, at + 6, CURVE.showy.enter);
                return (
                  <span key={i} style={{ display: "inline-block", marginRight: "0.24em", opacity: f < at ? 0 : k, transform: `scale(${(1.5 - 0.5 * k).toFixed(3)})`,
                    filter: `blur(${((1 - k) * 8).toFixed(1)}px)`, color: w === accent ? RED : PRINT, fontStyle: w === accent ? "italic" : "normal" }}>{w}</span>
                );
              })}
            </div>
            <div style={{ fontFamily: INTER, fontSize: 34, lineHeight: 1.3, fontWeight: 500, marginTop: 24, opacity: fade(58) }}>{deck}</div>
            <div style={{ position: "relative", height: 400, marginTop: 30, overflow: "hidden", opacity: fade(88) }}>
              <Img src={staticFile(photo.src)} style={{ position: "absolute", left: -photo.crop.x * photoScale, top: -photo.crop.y * photoScale, width: photo.pageW * photoScale, height: "auto",
                filter: "grayscale(1) invert(1) contrast(1.15)", mixBlendMode: "multiply" }} />
            </div>
            <div style={{ display: "flex", gap: 36, marginTop: 28, opacity: 1 }}>
              {columns.map((c, i) => (
                <div key={i} style={{ flex: 1, fontFamily: INTER, fontSize: 28, lineHeight: 1.36, opacity: fade(104 + i * 8), paddingLeft: i ? 36 : 0, borderLeft: i ? `1px solid ${PRINT}` : "none" }}>{c}</div>
              ))}
            </div>
            <div style={{ fontFamily: INTER, fontSize: 20, marginTop: 20, opacity: 0.65 * fade(150) }}>{source}</div>
          </div>
        </div>
      </AbsoluteFill>
      {words.map((_, i) => <Cue key={i} at={3 + i * STAMP} name="typewriter-hit-hard" volume={0.5} />)}
      <Cue at={62} name="swoosh-slow" volume={0.4} />
    </Clip>
  );
};
