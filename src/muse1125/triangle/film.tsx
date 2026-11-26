/**
 * TriangleNetwork-9x16 (2026-11-25): the Triangle parts on a real Terp and the real product. 15 s, vertical.
 * Story: we asked a Terp in Van Munching what the hardest part of recruiting is; he said finding contacts to network with.
 * That becomes a burst of questions (who, where, when, how), then a slow beat: everyone says network, nobody tells you
 * who. The answer is the company's own page in CampusAI: Deloitte's says "Network with UMD alumni at Deloitte", with
 * Find them and "Ask a Terp for 15 minutes." Made for Terps.
 * Facts: films/muse1125-triangle/facts.md. Rhythm: slow (his answer), fast (six 0.27 s cuts), slow, slow, hero, end.
 */
import React from "react";
import { AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Bed, Logo, OUT, Sfx, k, mix } from "../../kit/effects/shared";
import { UmdOpen } from "../../styles/UmdOpen";
import {
  BarWipe, CutRhythm, FaceTiles, INTER, InsetType, MediaFrame, MediaSpec, RingText, SaidWords, SlamWord, TRI,
  TriangleType, faceTiles,
} from "./parts";

export const TRIANGLE_FILM_FRAMES = 450;
const SOUND = true;

const CLIP: MediaSpec = { src: "muse1125-triangle/IMG_5692.mp4", kind: "video", size: { w: 720, h: 1280 } };
const FACE = { x: 255, y: 450 }; // his face in clip px (frame at 6.7 s)
const PAGE = { src: "muse1125-triangle/flow/f00743.jpg", w: 2880, h: 1800 }; // Deloitte's page, captured Nov 25
const BANNER = { x: 1995, y: 406, w: 1276, h: 135 }; // "Network with UMD alumni at Deloitte", image px

// ------------------------------------------------------------------------------------------------ beats (frames)
const B1 = 0; // his answer, 5.3 s into the clip
const B2 = 84; // fast: six cuts of 8
const B3 = 132; // slow: his face in tiles, "Everyone says network."
const B4 = 192; // slow: the triangle, "Nobody tells you who."
const B5 = 264; // hero: the ring holding Deloitte's page, the iris, the push to the alumni banner
const B6 = 396; // end: "Made for Terps" with his insets, then the logo

const Answer: React.FC = () => (
  <AbsoluteFill style={{ background: TRI.black }}>
    <MediaFrame media={{ ...CLIP, from: 5.3, volume: 1 }} muted={false} framing={{ zoom: 1.25, focus: FACE, target: { x: 420, y: 700 } }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(11,7,8,0.55) 0%, rgba(11,7,8,0) 26%, rgba(11,7,8,0) 55%, rgba(11,7,8,0.7) 100%)" }} />
    <SaidWords box={{ x: 60, y: 175, w: 960, h: 170 }} ink={TRI.white} size={58} align="flex-start"
      words={"What's the hardest part about recruiting?".split(" ").map((t) => ({ text: t, at: -6 }))} />
    <SaidWords box={{ x: 40, y: 1180, w: 1000, h: 600 }} ink={TRI.white} size={70} bigSize={236}
      words={[
        { text: "I'd", at: 5 }, { text: "say", at: 20 }, { text: "finding", at: 28 },
        { text: "CONTACTS", at: 40, big: true, color: TRI.red },
        { text: "to", at: 58 }, { text: "network", at: 63 }, { text: "with.", at: 71 },
      ]} />
  </AbsoluteFill>
);

const Crop: React.FC<{ zoom: number; focus: { x: number; y: number }; grey?: boolean }> = ({ zoom, focus, grey }) => (
  <AbsoluteFill style={{ background: TRI.black, filter: grey ? "grayscale(1) contrast(1.2)" : "contrast(1.1)" }}>
    <MediaFrame media={{ ...CLIP, from: 7.0 }} framing={{ zoom, focus, target: { x: 540, y: 900 } }} />
  </AbsoluteFill>
);

const Fast: React.FC = () => (
  <CutRhythm sound={SOUND} cuts={[
    { len: 8, hit: "typewriter-hit-hard", node: <SlamWord lines={["WHO?"]} ink={TRI.white} ground={TRI.oxblood} seed={2} /> },
    { len: 8, hit: "hit-weak", node: <Crop zoom={3.4} focus={{ x: 250, y: 440 }} /> },
    { len: 8, hit: "typewriter-hit-hard", node: <SlamWord lines={["WHE", "RE?"]} ink={TRI.red} ground={TRI.black} seed={4} /> },
    { len: 8, hit: "typewriter-hit-hard", node: <SlamWord lines={["WHEN?"]} ink={TRI.black} ground={TRI.white} seed={6} /> },
    { len: 8, hit: "hit-weak", node: <Crop zoom={2.6} focus={{ x: 240, y: 470 }} grey /> },
    { len: 8, hit: "typewriter-hit-hard", node: <SlamWord lines={["HOW?"]} ink={TRI.white} ground={TRI.red} seed={8} /> },
  ]} />
);

const TILE_FRAMING = { zoom: 2.8, focus: FACE, target: { x: 540, y: 800 } };
const TILES = faceTiles({ x: 225, y: 464, w: 500, h: 630 }, 13, 7);

const Tiles: React.FC = () => (
  <AbsoluteFill>
    <FaceTiles media={{ ...CLIP, from: 6.2 }} framing={TILE_FRAMING} tiles={TILES} at={0} dim={0.35} wash={TRI.blue} />
    <SaidWords box={{ x: 50, y: 1240, w: 980, h: 560 }} ink={TRI.white} size={76} bigSize={280}
      words={[{ text: "Everyone", at: 6 }, { text: "says", at: 12 }, { text: "network.", at: 20, big: true }]} />
  </AbsoluteFill>
);

const Triangle: React.FC = () => (
  <AbsoluteFill style={{ background: TRI.oxblood }}>
    <TriangleType lines={["Nobody", "tells you", "who."]} cx={540} cy={960} base={1020} height={1040} fill={TRI.white} ink={TRI.black} at={0} start={0.3} />
  </AbsoluteFill>
);

/** Deloitte's page under a camera: whole at frame width first, then pushed in until the alumni banner fills the width. */
const PageCam: React.FC<{ push: number }> = ({ push }) => {
  const sWide = 1080 / PAGE.w, sNear = 1000 / BANNER.w;
  const s = mix(sWide, sNear, push);
  const ix = mix(PAGE.w / 2, BANNER.x, push), iy = mix(PAGE.h / 2, BANNER.y, push);
  const tx = 540, ty = mix(900, 840, push);
  return (
    <AbsoluteFill style={{ background: TRI.black }}>
      <Img src={staticFile(PAGE.src)} style={{ position: "absolute", left: tx - ix * s, top: ty - iy * s, width: PAGE.w * s, height: PAGE.h * s, maxWidth: "none" }} />
    </AbsoluteFill>
  );
};

const Hero: React.FC = () => {
  const f = useCurrentFrame();
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const push = k(f, 52, 72, smooth); // motion: 0.67 s push, ease in and out, after a 0.4 s hold on the whole page
  const draw = k(f, 66, 78, OUT);
  const bw = 1000, bh = (BANNER.h / BANNER.w) * 1000;
  const scrim = k(f, 70, 80, OUT);
  return (
    <AbsoluteFill style={{ background: TRI.black }}>
      <RingText cx={540} cy={900} r={360} ringR={418} size={104} fill={TRI.black} ink={TRI.white}
        words={[{ text: "DELOITTE", at: 0 }, { text: "UMD ALUMNI", at: 18 }]} at={0} spin={36} repeat={3} irisAt={32} irisDur={12}>
        <PageCam push={push} />
      </RingText>
      {draw > 0 ? (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <rect x={540 - bw / 2 - 8} y={840 - bh / 2 - 8} width={bw + 16} height={bh + 16} rx={22} fill="none" stroke={TRI.red} strokeWidth={6}
            pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
        </svg>
      ) : null}
      <div style={{ position: "absolute", left: 0, top: 960, width: 1080, height: 960, opacity: scrim,
        background: "linear-gradient(180deg, rgba(11,7,8,0) 0%, rgba(11,7,8,0.96) 14%, #0b0708 100%)",
        transform: `translateY(${((1 - scrim) * 80).toFixed(1)}px)` }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 560, opacity: scrim,
        background: "linear-gradient(0deg, rgba(11,7,8,0) 0%, rgba(11,7,8,0.96) 22%, #0b0708 100%)" }} />
      <SaidWords box={{ x: 60, y: 160, w: 960, h: 330 }} ink={TRI.white} bigSize={250}
        words={[{ text: "Find", at: 72, big: true }, { text: "them.", at: 77, big: true }]} />
      <SaidWords box={{ x: 50, y: 1060, w: 980, h: 330 }} ink={TRI.white} bigSize={270}
        words={[{ text: "Ask", at: 84, big: true, color: TRI.red }, { text: "a", at: 88, big: true, color: TRI.red }, { text: "Terp", at: 92, big: true, color: TRI.red }]} />
      <SaidWords box={{ x: 50, y: 1440, w: 980, h: 120 }} ink={TRI.white} size={76}
        words={[{ text: "for", at: 100 }, { text: "15", at: 104 }, { text: "minutes.", at: 108 }]} />
    </AbsoluteFill>
  );
};

const Inset: React.FC<{ zoom: number; focus: { x: number; y: number } }> = ({ zoom, focus }) => (
  <MediaFrame media={{ ...CLIP, from: 6.4 }} w={300} h={400} framing={{ zoom, focus, target: { x: 150, y: 200 } }} />
);

const End: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <InsetType words={[{ text: "MADE", at: 0 }, { text: "FOR", at: 6 }, { text: "TERPS", at: 12 }]} ink={TRI.white} ground={TRI.oxblood} capH={1180} cy={960} drift={-5} fitWidth={1060}
        insets={[
          { x: 90, y: 260, w: 300, h: 400, at: 3, node: <Inset zoom={2.3} focus={{ x: 250, y: 450 }} /> },
          { x: 690, y: 1230, w: 300, h: 400, at: 8, node: <Inset zoom={1.6} focus={{ x: 235, y: 520 }} /> },
        ]} />
      {f >= 34 ? <AbsoluteFill style={{ background: TRI.black }} /> : null}
      <BarWipe at={24} dur={10} bars={6} color={TRI.black} />
      <Logo at={35} x={540} y={900} width={640} spring />
      {f >= 40 ? (
        <div style={{ position: "absolute", left: 0, width: 1080, top: 1090, textAlign: "center", font: `700 54px ${INTER}`, color: TRI.white,
          letterSpacing: "-0.02em", opacity: k(f, 40, 48, OUT) }}>Link in bio.</div>
      ) : null}
    </AbsoluteFill>
  );
};

export const TriangleNetwork: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: TRI.black }}>
      <Sequence from={B1} durationInFrames={B2 - B1}><Answer /></Sequence>
      <Sequence from={B2} durationInFrames={B3 - B2}><Fast /></Sequence>
      <Sequence from={B3} durationInFrames={B4 - B3}><Tiles /></Sequence>
      <Sequence from={B4} durationInFrames={B5 - B4}><Triangle /></Sequence>
      <Sequence from={B5} durationInFrames={B6 - B5}><Hero /></Sequence>
      <Sequence from={B6}><End /></Sequence>
      <BarWipe at={B3 - 9} dur={10} bars={5} color={TRI.white} />
      <BarWipe at={B4 - 9} dur={10} bars={5} color={TRI.oxblood} />
      <Logo at={12} x={150} y={112} width={210} out={B2 - 6} />
      <UmdOpen bigCx={790} bigCy={1060} bigH={260} tagCy={110} tagH={58} outAt={B2 - 6} />
      {/* sound: the bed under everything, a hit on every fast cut (in Fast), air on the wipes, weight on the turns */}
      <Bed total={TRIANGLE_FILM_FRAMES} on={SOUND} volume={0.26} />
      <Sfx at={B3 - 9} name="air-woosh-quick" volume={0.45} on={SOUND} />
      <Sfx at={B4 - 9} name="air-woosh-quick" volume={0.45} on={SOUND} />
      <Sfx at={B4} name="bass-hit-short" volume={0.6} on={SOUND} />
      <Sfx at={B5} name="transition-soft" volume={0.45} on={SOUND} />
      <Sfx at={B5 + 18} name="switch-tap" volume={0.5} on={SOUND} />
      <Sfx at={B5 + 32} name="swoosh-slow" volume={0.4} on={SOUND} />
      <Sfx at={B5 + 66} name="marker-pen-line" volume={0.5} on={SOUND} />
      <Sfx at={B6} name="paper-slide" volume={0.45} on={SOUND} />
      <Sfx at={B6 + 35} name="chime-crystal" volume={0.45} on={SOUND} />
    </AbsoluteFill>
  );
};
