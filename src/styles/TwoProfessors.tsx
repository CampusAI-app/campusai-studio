/**
 * "Same class, two professors" (2026-11-04), round 2. Jacob on round 1: "not clean and nice looking at all, looks
 * clearly ai generated" (type cards blurring in on a gradient, an invented rating chart, the product in a floating box,
 * a three-beat slogan). Round 2 is product first and nothing else: the real BMGT440 page fills the frame from the first
 * frame and the camera does the telling, in the FocusWalk look Jacob favorited (kit/pass/camera/FocusWalk, the same
 * dim, glow, camera curve and one Zodiak line per stop, every line words that are on the page).
 *
 * 1. FocusWalk over a still of the page just before the press: who teaches it, Maria Bustamante's 3.0, David Kass's 4.7.
 * 2. The recording takes over in the same frame (the kit's PageView, so the hand-off is one camera): the press on
 *    David Kass, his page, the student review.
 * Facts: films/two-professors/facts.md.
 */
import React from "react";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { PageView } from "../kit/PageView";
import { PointerAt } from "../kit/Pointer";
import { camAlong, toCanvas, type PageCam, type Rect, type Size } from "../kit/camera";
import { pointerAt } from "../kit/FlowRecording";
import { FocusWalk, type FocusStop } from "../kit/pass/camera/FocusWalk";
import { BlurLines, ZODIAK } from "../kit/parts";
import { B, Clip, clamp } from "./common";

type Rec = { vw: number; vh: number; frames: { t: number; name: string }[]; moves: Parameters<typeof pointerAt>[0] };
export type TwoProfessorsProps = {
  still: string;
  page: Size;
  dpr: number;
  stops: FocusStop[];
  intro: PageCam;
  /** The recording that takes over, its folder, the stretches played and the camera over them (recording s). */
  rec: Rec;
  dir: string;
  segs: { from: number; to: number }[];
  cam: { t: number; cam: PageCam }[];
  lines: { text: string; from: number; to: number }[];
};

const VIEW: Rect = { x: 36, y: 300, w: 1008, h: 1400 };
const BAND = { y: 190, size: 64 };
const MOVE = 24;
const OVERLAP = 8;
const walkFrames = (p: TwoProfessorsProps) => MOVE + p.stops.reduce((n, s) => n + MOVE + s.hold, 0) - MOVE + 6;
const recFrames = (p: TwoProfessorsProps) => Math.round(p.segs.reduce((n, g) => n + g.to - g.from, 0) * 30);
export const twoProfessorsEnd = (p: TwoProfessorsProps) => walkFrames(p) - OVERLAP + recFrames(p);

const recT = (p: TwoProfessorsProps, k: number) => {
  let left = Math.max(0, k) / 30;
  for (const g of p.segs) {
    if (left <= g.to - g.from) return g.from + left;
    left -= g.to - g.from;
  }
  return p.segs[p.segs.length - 1].to;
};

const RecBeat: React.FC<{ p: TwoProfessorsProps }> = ({ p }) => {
  const f = useCurrentFrame();
  const t = recT(p, f);
  const fr = p.rec.frames[Math.max(0, p.rec.frames.findIndex((x) => x.t > t) - 1)] ?? p.rec.frames[p.rec.frames.length - 1];
  const cam = camAlong(t * 30, p.cam.map((k) => ({ t: k.t * 30, cam: k.cam })));
  const ptr = pointerAt(p.rec.moves, t);
  const at = ptr.p ? toCanvas(cam, VIEW, ptr.p.x, ptr.p.y) : null;
  const inside = at && at.x > VIEW.x && at.x < VIEW.x + VIEW.w && at.y > VIEW.y && at.y < VIEW.y + VIEW.h;
  const fadeIn = interpolate(f, [0, OVERLAP], [0, 1], clamp);
  // the lines are the page's own words, on the walk's band, in its BlurLines
  const ink = { ink: B.color.ink, soft: B.color.inkSoft, accent: B.color.accent, surface: B.color.surface, line: "transparent" };
  const k = (s: number) => {
    // recording seconds -> this beat's frames
    let acc = 0;
    for (const g of p.segs) {
      if (s <= g.to) return Math.round((acc + Math.max(0, s - g.from)) * 30);
      acc += g.to - g.from;
    }
    return Math.round(acc * 30);
  };
  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <PageView src={staticFile(`${p.dir}/${fr.name}`)} page={{ w: p.rec.vw, h: p.rec.vh }} cam={cam} view={VIEW} brand={B} />
      {inside && at ? <PointerAt x={at.x} y={at.y} since={ptr.since} accent={B.color.accent} size={30 * (VIEW.w / cam.cw) * 0.45} /> : null}
      {p.lines.map((l, i) =>
        f >= k(l.from) - 1 && f <= k(l.to) + 12 ? (
          <div key={i} style={{ position: "absolute", left: 0, right: 0, top: BAND.y - BAND.size * 0.6, display: "flex", justifyContent: "center" }}>
            <BlurLines lines={[{ text: l.text }]} at={k(l.from)} outAt={k(l.to) - 6} size={BAND.size} stagger={3} ink={ink} face={ZODIAK} />
          </div>
        ) : null,
      )}
    </AbsoluteFill>
  );
};

export const TwoProfessors: React.FC<TwoProfessorsProps> = (p) => {
  const walk = walkFrames(p);
  const END = twoProfessorsEnd(p);
  return (
    <Clip endAt={END} ground={`${B.color.gradient}, ${B.color.bgDeep}`}>
      <Sequence durationInFrames={walk}>
        <FocusWalk src={staticFile(p.still)} page={p.page} view={VIEW} brand={B} stops={p.stops} intro={p.intro} dpr={p.dpr}
          lineBand={BAND} move={MOVE} release={6} outro={p.cam[0].cam} />
      </Sequence>
      <Sequence from={walk - OVERLAP}>
        <RecBeat p={p} />
      </Sequence>
    </Clip>
  );
};
