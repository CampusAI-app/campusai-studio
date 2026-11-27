/**
 * Proof, not a post (2026-11-27, Muse; Jacob: "I love this as inspo"). From XZE Creative's "Spotify 2.0" desk film
 * (instagram.com/reel/DgPzBIGIfig), read frame by frame. We already own the desk stage (ScreenStage) and the spark
 * lockup (DeskFlow) from the two earlier XZE sends; this proves the three parts that were new in this one:
 *  1. The camera rides inside the screen: one real page, three beats (push to a number that fills, ride down to a card
 *     that lifts, push into the one action and tap it). The reference did Friends tab, live card, reactions.
 *  2. The payoff as short lines on black, each tracking in from wide spacing, key words in the brand colour, the last one
 *     shrinking away (kit TrackIn).
 *  3. Then the mark alone, and the wordmark after it.
 * The room's lamp and spill stay CampusAI red for the whole film, the way the reference's orb took Spotify green.
 *
 * Product: the real 4-year plan page, campusai-demo, captured 2026-11-25 for post-desk-flow (public/post-desk-flow/degree.png,
 * 1440 x 900 at 2x). Words on the page are the page's own; "One class, two Gen Eds" is its first suggestion.
 *   npx remotion render src/trials/proof-desk-series-entry.tsx ProofDeskSeries-9x16 out/proof-desk-series.mp4
 */
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { ScreenStage, type Quad } from "../kit/effects/ScreenStage";
import { SparkLockup } from "../kit/effects/DeskFlow";
import { TrackIn } from "../kit/effects/TrackIn";
import { PointerAt } from "../kit/Pointer";
import { camAlong, type PageCam } from "../kit/camera";
import { Bed, OUT, SWING, Sfx, k, mix } from "../kit/effects/shared";

export const PDS_FPS = 30;
export const PDS_FRAMES = 345;
const SW = 1600;
const SH = 756;
const RED = "217, 32, 46";
const ACC = "#e0313d";
const inter = loadInter("normal", { weights: ["500", "600", "700"], subsets: ["latin"] }).fontFamily;

const PLATE = "post-desk-flow/room.jpg";
const SCREEN: Quad = [[-93, 279], [1173, 279], [1173, 967], [-93, 967]];
const PAGE = "post-desk-flow/degree.png";
const PW = 1440;
const PH = 900;

/* beats, frames */
const T = {
  open: 8,
  bar: [40, 74] as const,
  lift: [104, 120] as const,
  point: [134, 160] as const,
  tap: 166,
  cut: 184,
  lineA: 186,
  lineAOut: 222,
  lineB: 232,
  lineBOut: 266,
  star: 276,
  type: 286,
  home: 306,
};

const CAMS: { t: number; cam: PageCam }[] = [
  { t: 0, cam: { cx: 720, cy: 380, cw: 1440 } },
  { t: 10, cam: { cx: 720, cy: 380, cw: 1440 } },
  { t: 44, cam: { cx: 790, cy: 300, cw: 1250 } }, // beat 1: degree progress
  { t: 80, cam: { cx: 790, cy: 300, cw: 1220 } },
  { t: 112, cam: { cx: 470, cy: 440, cw: 780 } }, // beat 2: the first suggestion
  { t: 128, cam: { cx: 470, cy: 445, cw: 760 } },
  { t: 160, cam: { cx: 476, cy: 486, cw: 520 } }, // beat 3: "Which should I take?"
  { t: 190, cam: { cx: 476, cy: 486, cw: 470 } },
];

/** The page under the camera, plus the three moments drawn from the page itself. */
const Page: React.FC<{ f: number }> = ({ f }) => {
  const cam = camAlong(f, CAMS);
  const s = SW / cam.cw;
  const X = (x: number) => SW / 2 + (x - cam.cx) * s;
  const Y = (y: number) => SH / 2 + (y - cam.cy) * s;
  // beat 1: the green and yellow fill grows from the left (a track-coloured cover slides off it)
  const fill = k(f, T.bar[0], T.bar[1], SWING);
  const barL = 265 + 740.5 * fill;
  // beat 2: the first suggestion lifts off the page
  const lift = k(f, T.lift[0], T.lift[1], OUT);
  const card = { x: 262, y: 356, w: 342, h: 162 };
  // beat 3: the pointer comes in and taps the action
  const pk = k(f, T.point[0], T.point[1], OUT);
  const px = mix(640, 470, pk);
  const py = mix(600, 491, pk);
  const since = f >= T.tap ? (f - T.tap) / PDS_FPS : null;
  const linkGlow = k(f, T.tap, T.tap + 8, OUT);
  return (
    <AbsoluteFill style={{ background: "#120a0b", opacity: k(f, 0, T.open) }}>
      <Img src={staticFile(PAGE)} style={{ position: "absolute", left: X(0), top: Y(0), width: PW * s, height: PH * s }} />
      <div style={{ position: "absolute", left: X(barL), top: Y(305.5), width: Math.max(0, X(1006) - X(barL)), height: 6 * s, background: "rgb(43,31,33)" }} />
      {lift > 0 && (
        <div style={{ position: "absolute", left: X(card.x), top: Y(card.y), width: card.w * s, height: card.h * s, overflow: "hidden", borderRadius: 10 * s,
          transform: `translateY(${-8 * s * lift}px) scale(${1 + 0.035 * lift})`, boxShadow: `0 ${18 * lift}px ${44 * lift}px rgba(0,0,0,${0.55 * lift}), 0 0 0 ${1.5 * lift}px rgba(${RED},${0.8 * lift}), 0 0 ${40 * lift}px rgba(${RED},${0.35 * lift})` }}>
          <Img src={staticFile(PAGE)} style={{ position: "absolute", left: -card.x * s, top: -card.y * s, width: PW * s, height: PH * s }} />
        </div>
      )}
      {linkGlow > 0 && (
        <div style={{ position: "absolute", left: X(404), top: Y(478), width: 136 * s, height: 22 * s, borderRadius: 6 * s, background: `rgba(${RED},${0.18 * linkGlow})`, boxShadow: `0 0 ${24 * linkGlow}px rgba(${RED},${0.5 * linkGlow})` }} />
      )}
      {f >= T.point[0] && <PointerAt x={X(px)} y={Y(py)} since={since} accent={ACC} size={64} opacity={k(f, T.point[0], T.point[0] + 6)} />}
    </AbsoluteFill>
  );
};

const Lines: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill style={{ background: "#050304", justifyContent: "center", alignItems: "center" }}>
    {f < T.lineB ? <TrackIn f={f} at={T.lineA} text="See what's *left to graduate." font={inter} size={64} shrinkAt={T.lineAOut} /> : null}
    {f >= T.lineB && f < T.star ? <TrackIn f={f} at={T.lineB} text="One class, *two *Gen *Eds." font={inter} size={64} shrinkAt={T.lineBOut} /> : null}
  </AbsoluteFill>
);

const End: React.FC<{ f: number }> = ({ f }) => {
  const glow = k(f, T.home, T.home + 30, OUT);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 80% at 50% 60%, #16070a 0%, #050304 75%)" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 55% 40% at 50% 108%, rgba(${RED},${0.7 * glow}) 0%, rgba(${RED},${0.18 * glow}) 45%, rgba(0,0,0,0) 75%)` }} />
      <SparkLockup f={f} at={T.star} typeAt={T.type} homeAt={T.home} cx={SW / 2} cy={SH / 2 - 10} width={720} id="p" />
    </AbsoluteFill>
  );
};

const Film: React.FC<{ f: number }> = ({ f }) => {
  if (f < T.cut) return <Page f={f} />;
  if (f < T.star) return <Lines f={f} />;
  return <End f={f} />;
};

const lightAt = (f: number): { rgb: string; level: number } => {
  if (f < T.cut) return { rgb: "200, 70, 80", level: mix(0.2, 0.55, k(f, 0, T.open + 10)) };
  if (f < T.star) return { rgb: RED, level: 0.28 };
  return { rgb: RED, level: mix(0.35, 0.75, k(f, T.home, T.home + 30)) };
};

const Caption: React.FC = () => (
  <div style={{ position: "absolute", top: 1060, left: 30, width: 740, textAlign: "center", fontFamily: inter, fontWeight: 700, fontSize: 52, lineHeight: 1.16, letterSpacing: -0.5, color: "#fff", textShadow: "0 3px 14px rgba(0,0,0,0.9)" }}>
    Junior at Maryland,
    <br />
    no idea what's left
  </div>
);

export const ProofDeskSeries: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <ScreenStage screen={<Film f={f} />} screenSize={[SW, SH]} laptop={null} light={lightAt(f)} plate={{ src: PLATE, screen: SCREEN }} caption={<Caption />} grain={0.07} />
      <Bed total={PDS_FRAMES} on volume={0.3} />
      <Sfx at={T.bar[0]} name="data-scan" volume={0.22} on />
      <Sfx at={T.lift[0]} name="paper-slide" volume={0.3} on />
      <Sfx at={T.tap} name="switch-tap" volume={0.4} on />
      <Sfx at={T.lineA} name="typewriter-hit-soft" volume={0.22} on />
      <Sfx at={T.lineB} name="typewriter-hit-soft" volume={0.22} on />
      <Sfx at={T.star + 8} name="bass-hit-short" volume={0.4} on />
      <Sfx at={T.home} name="chime-crystal" volume={0.35} on />
    </AbsoluteFill>
  );
};
