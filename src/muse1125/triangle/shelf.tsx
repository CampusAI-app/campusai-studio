/** TriangleParts-9x16: every Triangle part alone, named in plain type, for the Studio site and for trying props. */
import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import {
  BarWipe, CutRhythm, FaceTiles, INTER, InsetType, MediaFrame, MediaSpec, RingText, SaidWords, SlamWord, TRI, TriangleType, faceTiles,
} from "./parts";

const CLIP: MediaSpec = { src: "muse1125-triangle/IMG_5692.mp4", kind: "video", size: { w: 720, h: 1280 } };
const FACE = { x: 255, y: 450 };

const Name: React.FC<{ n: string }> = ({ n }) => (
  <div style={{ position: "absolute", left: 40, top: 60, padding: "10px 18px", borderRadius: 12, background: "rgba(11,7,8,0.72)",
    font: `600 32px ${INTER}`, color: TRI.white }}>{n}</div>
);

export const SHELF: { name: string; frames: number; node: React.ReactNode }[] = [
  { name: "SlamWord, boiling letters", frames: 60, node: <SlamWord lines={["UNDER", "STAND"]} ink={TRI.white} ground={TRI.oxblood} /> },
  { name: "BarWipe, bars across the cut", frames: 40, node: <AbsoluteFill><SlamWord lines={["FIRST"]} ink={TRI.white} ground={TRI.oxblood} /><Sequence from={15}><SlamWord lines={["THEN"]} ink={TRI.black} ground={TRI.white} /></Sequence><BarWipe at={10} color={TRI.white} /></AbsoluteFill> },
  { name: "TriangleType, a phrase as a shape", frames: 60, node: <AbsoluteFill style={{ background: TRI.oxblood }}><TriangleType lines={["The", "triangle", "of editing"]} cx={540} cy={960} base={1000} height={1000} fill={TRI.white} ink={TRI.black} start={0.28} /></AbsoluteFill> },
  { name: "RingText, a word ringing a clip", frames: 75, node: <AbsoluteFill style={{ background: TRI.black }}><RingText cx={540} cy={900} r={340} ringR={400} size={100} fill={TRI.red} ink={TRI.white} words={[{ text: "PACING", at: 0 }, { text: "MOTION", at: 30 }]} irisAt={58}><MediaFrame media={{ ...CLIP, from: 6 }} framing={{ zoom: 1.5, focus: FACE, target: { x: 540, y: 900 } }} /></RingText></AbsoluteFill> },
  { name: "InsetType, portraits in the letters", frames: 60, node: <InsetType words={[{ text: "CONTRAST", at: 0 }, { text: "RHYTHM", at: 30 }]} ink={TRI.white} ground={TRI.oxblood} capH={1100} cy={960} drift={-6} fitWidth={1100}
      insets={[{ x: 100, y: 300, w: 300, h: 400, at: 4, node: <MediaFrame media={{ ...CLIP, from: 6 }} w={300} h={400} framing={{ zoom: 2.2, focus: FACE, target: { x: 150, y: 200 } }} /> },
        { x: 680, y: 1200, w: 300, h: 400, at: 10, node: <MediaFrame media={{ ...CLIP, from: 7 }} w={300} h={400} framing={{ zoom: 1.6, focus: FACE, target: { x: 150, y: 200 } }} /> }]} /> },
  { name: "FaceTiles, a face in pieces", frames: 60, node: <FaceTiles media={{ ...CLIP, from: 6.2 }} framing={{ zoom: 1.9, focus: FACE, target: { x: 540, y: 760 } }} tiles={faceTiles({ x: 340, y: 540, w: 470, h: 440 }, 12, 7)} wash={TRI.blue} dim={0.35} /> },
  { name: "CutRhythm, fast against slow", frames: 96, node: <CutRhythm cuts={[
      { len: 8, hit: "typewriter-hit-hard", node: <SlamWord lines={["FAST"]} ink={TRI.white} ground={TRI.red} /> },
      { len: 8, hit: "typewriter-hit-hard", node: <SlamWord lines={["FAST"]} ink={TRI.red} ground={TRI.black} seed={3} /> },
      { len: 8, hit: "typewriter-hit-hard", node: <SlamWord lines={["FAST"]} ink={TRI.black} ground={TRI.white} seed={5} /> },
      { len: 72, hit: "bass-hit-short", node: <SlamWord lines={["SLOW"]} ink={TRI.white} ground={TRI.oxblood} boil={8} tilt={2} /> },
    ]} /> },
  { name: "SaidWords, words as they are said", frames: 60, node: <AbsoluteFill style={{ background: TRI.black }}><MediaFrame media={{ ...CLIP, from: 5.3 }} framing={{ zoom: 1.25, focus: FACE, target: { x: 420, y: 700 } }} />
      <SaidWords box={{ x: 40, y: 1180, w: 1000, h: 600 }} ink={TRI.white} size={70} bigSize={236} words={[{ text: "I'd", at: 5 }, { text: "say", at: 20 }, { text: "finding", at: 28 }, { text: "CONTACTS", at: 40, big: true, color: TRI.red }]} /></AbsoluteFill> },
];
export const SHELF_FRAMES = SHELF.reduce((a, s) => a + s.frames, 0);

export const TriangleParts: React.FC = () => {
  let t = 0;
  return (
    <AbsoluteFill style={{ background: TRI.black }}>
      {SHELF.map((s) => {
        const from = t;
        t += s.frames;
        return (
          <Sequence key={s.name} from={from} durationInFrames={s.frames}>
            <AbsoluteFill>{s.node}</AbsoluteFill>
            <Name n={s.name} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
