/**
 * "Sunday night" (wave 1, 2026-10-22). It's Sunday night and you don't know what this week looks like; CampusAI
 * already does. 4:5, 25 s, composition `Sunday-4x5`. Record: Content/video-studio/films/sunday-night/.
 *
 * One carrier: the laptop's screen. The film opens on it in a dark room, pushes through the glass into the real
 * daily brief, walks Your week, presses through to My Calendar, asks it for study time before Thursday's quiz,
 * adds the block it offers, and pulls back out of the same glass into the same room, now under a lamp.
 *
 * Captures: capture/w1-sunday-night.cjs -> public/w1/sunday-night/ (campusai-demo, dark, browser clock Sunday
 * Oct 18 2026 11:48 PM Eastern, Maryland marks hidden capture side). Every on-screen string is the product's own.
 *
 * Music: Mixkit "Tonight", 105 BPM (t0 0.909 s, measured with librosa), played from beat 0 (the approved Spring
 * film uses beats 60 to 118). Its dip at beat 35 and build into beat 40 carry the pull back; the logo lands on 40.
 * B(n) is film beat n in frames.
 *
 * Renders need --gl=angle (the laptop is three.js).
 */
import React from "react";
import { AbsoluteFill, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import {
  BlurLines,
  FocusWalk,
  LaptopRoom,
  LogoEnd,
  LogoOpen,
  PageView,
  PointerAt,
  ZODIAK,
  brand,
  camAlong,
  glow,
  rectOnCanvas,
  roomPose,
  toCanvas,
  useBrandFonts,
  EASE_CAMERA,
} from "../../kit";
import type { PageCam, Rect } from "../../kit";
import { planWalk, type FocusStop } from "../../kit/pass/camera/FocusWalk";
import { onScreen, type CamKey } from "../../four/real-laptop";
import take from "../../../public/w1/sunday-night/take.json";

const BR = brand("campusai");
export const FPS = 30;
export const W = 1080;
export const H = 1350;
const ASPECT = W / H;
const T = 60 / 105;
const MUSIC_T0 = 0.909;
/** Film frame of film beat n. Film frame 0 is music beat 0. */
const B = (n: number) => Math.round(n * T * FPS);
export const DURATION = 750; // 25.0 s, beat 43.75

const DIR = "w1/sunday-night/";
const img = (name: string) => staticFile(DIR + name);
const PAGE = { w: 1440, h: 900 };
/** The flat page's view: a little larger than the frame so its rounded corners sit off screen. */
const VIEW: Rect = { x: -40, y: -40, w: 1160, h: 1430 };
/** The calendar part's view: exactly the frame, square corners, so a framing's edges are the frame's edges (round 2). */
const VIEW_F: Rect = { x: 0, y: 0, w: W, h: H };
/** The same framing in VIEW_F as a camera in VIEW (both views share their centre). */
const toF = (c: PageCam): PageCam => ({ ...c, cw: (c.cw * VIEW_F.w) / VIEW.w });
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ramp = (f: number, a: number, b: number, e = EASE_CAMERA) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: e });

/* ---------------------------------------------------------------- the glass and the flat page agree */
// RealLaptop covers its glass with the capture, cropping the sides (glass 1.55 : 1, capture 1.6 : 1), so the glass
// shows 1395 of the 1440 CSS px. onScreen(u, 0.5, 2) fills the frame's height with glass; the flat page that matches
// it has the same centre and the same px per CSS px.
const GLASS_FILL = 2.0;
const GLASS_CSS_W = 1440 * (1.55 / 1.6);
const glassCam = (u: number, view: Rect = VIEW): PageCam => ({
  cx: (1440 - GLASS_CSS_W) / 2 + u * GLASS_CSS_W,
  cy: 450,
  cw: view.w / ((GLASS_FILL * W) / GLASS_CSS_W),
});
const U_IN = (545 - (1440 - GLASS_CSS_W) / 2) / GLASS_CSS_W; // Your week column
const U_OUT = (600 - (1440 - GLASS_CSS_W) / 2) / GLASS_CSS_W; // the Wednesday column

/* ---------------------------------------------------------------- timeline (frames) */
const LOGO_IN = B(1.5);
const HOOK_OUT = B(6);
const PUSH_START = B(4.5);
const PUSH_END = B(9);
const XF_IN = PUSH_END; // 3D glass to the flat page, 8 frames
const WALK_AT = B(9.5);
const P1 = B(20); // Open My Calendar
const XF_CAL = P1 + 6;
const P2 = B(23.5); // Find time to study for Quiz 2
const P3 = B(29.5); // Wed, Oct 21, 6pm to 8pm
const LAND = B(30.8); // the block appears
const HANDOFF = 620; // flat page back to the glass
const XF_OUT = HANDOFF + 6;
const LAMP_FROM = 646;
const LAMP_TO = 692;
const LOGO_END = B(40);

/* ---------------------------------------------------------------- the walk: Your week, Sunday night */
// Boxes from public/w1/sunday-night/dash.json.
const STOPS: FocusStop[] = [
  { rect: { x: 281, y: 157, w: 527, h: 89 }, hold: 40 }, // Moved, BMGT380 Reading Response 6, Wed Oct 14 to Sun Oct 18
  { rect: { x: 281, y: 246, w: 527, h: 50 }, hold: 26 }, // Due Mon, Problem set 3: bond pricing
  { rect: { x: 281, y: 296, w: 527, h: 49 }, hold: 26 }, // Due Tue, Reading: Ch. 6-7
];
const WALK = { move: 20, release: 20, pad: 1.18, dpr: 2 };
const WALK_INTRO = glassCam(U_IN);
const PILL1: Rect = { x: 520, y: 163, w: 224, h: 28 };
const AT1 = take.press1.at as [number, number];
const AT2 = take.press2.at as [number, number];
const AT3 = take.press3.at as [number, number];
const BLOCK: Rect = { x: 531, y: 632, w: 118, h: 86 };

const walkPlan = () =>
  planWalk({ stops: STOPS, page: PAGE, view: VIEW, intro: WALK_INTRO, at: WALK_AT - XF_IN, move: WALK.move, release: WALK.release, pad: WALK.pad, dpr: WALK.dpr });
const walkEndCam = () => {
  const p = walkPlan();
  return p.cams[p.cams.length - 1].cam;
};

/* ---------------------------------------------------------------- the calendar cameras (VIEW_F) */
// Two framings joined by a dissolve at the press, not a pan, so the sidebar collapsing as the chat opens stays out of
// frame (round 2). A: the rail ask. B: the side chat, then the Wednesday block, then back to the glass framing.
const XF_CHAT = P2 + 4; // 8-frame dissolve A to B
/** The whole chat column: right edge on the page's right edge, top edge at y 54 (below the header and its chrome,
 *  which end at y 52; the student's question starts at y 56), left edge on the Saturday column's start (x 897). */
const chatCam = (cw: number): PageCam => ({ cx: 1440 - cw / 2, cy: 54 + (cw * (H / W)) / 2, cw });
const camsA = (): { t: number; cam: PageCam }[] => [
  { t: XF_CAL, cam: toF(walkEndCam()) },
  { t: XF_CAL + 36, cam: { cx: 400, cy: 470, cw: 596 } }, // the rail ask and Sun to Tue
  { t: XF_CHAT + 8, cam: { cx: 400, cy: 470, cw: 588 } },
];
const camsB = (): { t: number; cam: PageCam }[] => [
  { t: XF_CHAT, cam: chatCam(544) },
  { t: P3 + 8, cam: chatCam(536) },
  { t: P3 + 44, cam: { cx: 590, cy: 631, cw: 430 } }, // close on the Wednesday block
  { t: HANDOFF - 26, cam: { cx: 590, cy: 631, cw: 416 } },
  { t: HANDOFF, cam: glassCam(U_OUT, VIEW_F) },
];

/** Which capture is on screen at frame f of the calendar part. */
const calSrc = (f: number) => {
  if (f < P2 - 12) return img("cal.jpg");
  if (f < P2) return img("cal-hover.jpg");
  const t = (f - P2) / FPS;
  const frames = take.answer as { file: string; t: number }[];
  if (t <= frames[frames.length - 1].t) {
    let k = 0;
    for (let i = 0; i < frames.length; i++) if (frames[i].t <= t + 0.04) k = i;
    return img(frames[k].file);
  }
  if (f < P3 - 12) return img("ans.jpg");
  if (f < P3 + 2) return img("ans-hover.jpg");
  return img("added.jpg");
};

/* ---------------------------------------------------------------- pointer path (page px) */
type PKey = { t: number; x: number; y: number };
const ptAlong = (f: number, keys: PKey[]) => {
  if (f <= keys[0].t) return keys[0];
  const last = keys[keys.length - 1];
  if (f >= last.t) return last;
  const i = keys.findIndex((k, n) => f >= k.t && f < keys[n + 1].t);
  const k = ramp(f, keys[i].t, keys[i + 1].t, Easing.bezier(0.45, 0, 0.25, 1));
  return { t: f, x: keys[i].x + (keys[i + 1].x - keys[i].x) * k, y: keys[i].y + (keys[i + 1].y - keys[i].y) * k };
};
const PATH: PKey[] = [
  { t: P1 - 38, x: AT1[0] + 150, y: AT1[1] + 260 },
  { t: P1 - 6, x: AT1[0], y: AT1[1] },
  { t: P1 + 22, x: AT1[0], y: AT1[1] },
  { t: P2 - 8, x: AT2[0], y: AT2[1] },
  { t: P2 + 30, x: AT2[0] + 40, y: AT2[1] + 30 },
  { t: P3 - 30, x: AT3[0] + 120, y: AT3[1] + 200 },
  { t: P3 - 5, x: AT3[0], y: AT3[1] },
];
const pointerOpacity = (f: number) =>
  Math.min(ramp(f, P1 - 38, P1 - 26), 1 - ramp(f, P2 + 2, P2 + 10)) + Math.min(ramp(f, P3 - 34, P3 - 22), 1 - ramp(f, P3 + 16, P3 + 28));
const sinceClick = (f: number) => {
  for (const p of [P3, P2, P1]) if (f >= p) return (f - p) / FPS < 0.6 ? (f - p) / FPS : null;
  return null;
};

/* ---------------------------------------------------------------- 3D cameras */
const OPEN_CAM: CamKey[] = [
  { at: 0, ...roomPose([0.42, 0.2, 0.88], [1.5, 9.5, -5], 132) },
  { at: PUSH_START, ...roomPose([0.3, 0.21, 0.93], [1, 9.5, -5], 124), ease: Easing.linear },
  { at: PUSH_END, ...onScreen(U_IN, 0.5, GLASS_FILL, ASPECT), ease: Easing.bezier(0.55, 0, 0.2, 1) },
];
const END_LOCAL = HANDOFF - 6; // the end rooms mount here
const END_CAM: CamKey[] = [
  { at: 0, ...onScreen(U_OUT, 0.5, GLASS_FILL, ASPECT) },
  { at: XF_OUT - END_LOCAL + 4, ...onScreen(U_OUT, 0.5, GLASS_FILL, ASPECT) },
  { at: LOGO_END - END_LOCAL + 4, ...roomPose([-0.26, 0.22, 0.94], [0, 10.5, -4], 112), ease: Easing.bezier(0.7, 0, 0.2, 1) },
  { at: DURATION - END_LOCAL, ...roomPose([-0.3, 0.22, 0.93], [0, 10.5, -4], 115), ease: Easing.linear },
];

/* ---------------------------------------------------------------- scenes */

const Hook: React.FC = () => {
  const f = useCurrentFrame();
  if (f > HOOK_OUT + 14) return null;
  return (
    <>
      <LogoOpen brand={BR} at={LOGO_IN} x={W / 2} y={140} width={300} leaveAt={HOOK_OUT} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 196, display: "flex", justifyContent: "center" }}>
        <BlurLines lines={[{ text: "11:48 PM. Sunday." }]} at={0} outAt={HOOK_OUT} size={60} stagger={4} face={ZODIAK}
          ink={{ ink: BR.color.ink, soft: BR.color.inkSoft, accent: BR.color.accent, surface: BR.color.surface, line: "transparent" }} />
      </div>
    </>
  );
};

/** The dashboard: Your week walked, then the press on Open My Calendar. Local frames start at XF_IN. */
const DashPart: React.FC = () => {
  const lf = useCurrentFrame();
  const f = lf + XF_IN;
  const plan = walkPlan();
  const cam = camAlong(lf, plan.cams);
  const pill = rectOnCanvas(cam, VIEW, { x: PILL1.x - 2, y: PILL1.y - 2, w: PILL1.w + 4, h: PILL1.h + 4 });
  const o = toCanvas(cam, VIEW, 0, 0);
  const s = VIEW.w / cam.cw;
  return (
    <AbsoluteFill style={{ opacity: ramp(f, XF_IN, XF_IN + 8, Easing.linear) }}>
      <FocusWalk src={img("dash.jpg")} page={PAGE} view={VIEW} brand={BR} stops={STOPS} intro={WALK_INTRO} at={WALK_AT - XF_IN}
        move={WALK.move} release={WALK.release} pad={WALK.pad} dpr={WALK.dpr} />
      {/* the pill's own hover state from the capture, as the pointer arrives */}
      {f >= P1 - 10 ? (
        <div style={{ position: "absolute", left: pill.x, top: pill.y, width: pill.w, height: pill.h, overflow: "hidden" }}>
          <Img src={img("dash-hover.jpg")} style={{ position: "absolute", left: o.x - pill.x, top: o.y - pill.y, width: PAGE.w * s, height: PAGE.h * s, maxWidth: "none" }} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** My Calendar: the rail ask, the side chat's answer, the Add press, the block landing. Absolute frames. */
const CalPart: React.FC<{ f: number; cam: PageCam; src: string }> = ({ f, cam, src }) => {
  const block = rectOnCanvas(cam, VIEW_F, BLOCK);
  const o = toCanvas(cam, VIEW_F, 0, 0);
  const s = VIEW_F.w / cam.cw;
  const cover = 1 - ramp(f, LAND, LAND + 10, Easing.out(Easing.cubic));
  const ring = f >= LAND ? Math.min(ramp(f, LAND, LAND + 12), 1 - ramp(f, HANDOFF - 40, HANDOFF - 16)) : 0;
  const pad = 6 * s;
  return (
    <PageView src={src} page={PAGE} cam={cam} view={VIEW_F} brand={BR} radius={0}>
      {f >= P3 && cover > 0.001 ? (
        // before it lands, the slot shows what it showed before the press (the answer capture, no block)
        <div style={{ position: "absolute", left: block.x - pad, top: block.y - pad, width: block.w + pad * 2, height: block.h + pad * 2, overflow: "hidden", opacity: cover }}>
          <Img src={img("ans.jpg")} style={{ position: "absolute", left: o.x - block.x + pad, top: o.y - block.y + pad, width: PAGE.w * s, height: PAGE.h * s, maxWidth: "none" }} />
        </div>
      ) : null}
      {ring > 0 ? (
        <div style={{ position: "absolute", left: block.x - 3 * s, top: block.y - 3 * s, width: block.w + 6 * s, height: block.h + 6 * s, borderRadius: 9 * s,
          boxShadow: `0 0 0 ${(1.4 * s).toFixed(2)}px ${glow(BR, 0.7 * ring)}, 0 0 ${(40 * ring).toFixed(0)}px ${glow(BR, 0.35 * ring)}` }} />
      ) : null}
    </PageView>
  );
};

const Pointer: React.FC<{ f: number }> = ({ f }) => {
  const op = Math.min(1, pointerOpacity(f));
  if (op <= 0.001) return null;
  const pt = ptAlong(f, PATH);
  const c =
    f < XF_CAL
      ? toCanvas(camAlong(f - XF_IN, walkPlan().cams), VIEW, pt.x, pt.y)
      : toCanvas(camAlong(f, f < XF_CHAT + 4 ? camsA() : camsB()), VIEW_F, pt.x, pt.y);
  return <PointerAt x={c.x} y={c.y} since={sinceClick(f)} accent={BR.color.accent} size={62} opacity={op} />;
};

/** The pull back out of the glass: night, then the lamp comes up. Local frames start at END_LOCAL. */
const EndRoom: React.FC = () => {
  const lf = useCurrentFrame();
  const f = lf + END_LOCAL;
  const lamp = ramp(f, LAMP_FROM, LAMP_TO, Easing.inOut(Easing.sin));
  return (
    <AbsoluteFill>
      <LaptopRoom screen={{ image: DIR + "added-rest.jpg" }} preset="night" camera={END_CAM} brand={BR} />
      <AbsoluteFill style={{ opacity: lamp }}>
        <LaptopRoom screen={{ image: DIR + "added-rest.jpg" }} preset="lamp" camera={END_CAM} brand={BR} light={{ bloom: 0.24, vignette: 0.32 }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- sound */
const SFX = (name: string) => staticFile(DIR + "audio/" + name);
const CUES: { at: number; src: string; volume: number }[] = [
  { at: PUSH_START + 8, src: SFX("air-woosh-deep.mp3"), volume: 0.35 },
  { at: P1, src: SFX("switch-click-quick.mp3"), volume: 0.5 },
  { at: P2, src: SFX("switch-click-quick.mp3"), volume: 0.5 },
  { at: P3, src: SFX("switch-click-quick.mp3"), volume: 0.5 },
  { at: LAND, src: SFX("chime-crystal.mp3"), volume: 0.32 },
  { at: XF_OUT, src: SFX("swoosh-slow.mp3"), volume: 0.3 },
  { at: LAMP_FROM, src: SFX("light-aura.mp3"), volume: 0.22 },
];

/* ---------------------------------------------------------------- the film */

export const SundayNight: React.FC = () => {
  useBrandFonts(BR);
  const f = useCurrentFrame();
  const endDim = ramp(f, LOGO_END - 8, LOGO_END + 14);
  return (
    <AbsoluteFill style={{ background: BR.color.bgDeep }}>
      {f < XF_IN + 10 ? (
        <Sequence durationInFrames={XF_IN + 10} name="night room, push in">
          <LaptopRoom screen={{ image: DIR + "dash.jpg" }} preset="night" camera={OPEN_CAM} lid={1} brand={BR} />
        </Sequence>
      ) : null}
      {f >= END_LOCAL ? (
        <Sequence from={END_LOCAL} name="pull back, night to lamp">
          <EndRoom />
        </Sequence>
      ) : null}
      {f >= XF_IN && f < XF_CAL + 2 ? (
        <Sequence from={XF_IN} durationInFrames={XF_CAL + 2 - XF_IN} name="daily brief, Your week">
          <DashPart />
        </Sequence>
      ) : null}
      {f >= XF_CAL - 4 && f < XF_CHAT + 9 ? (
        <AbsoluteFill style={{ opacity: ramp(f, XF_CAL - 4, XF_CAL + 2, Easing.linear) }}>
          {/* the rail framing; from the press on it holds the pressed still, so the collapse never shows */}
          <CalPart f={f} cam={camAlong(f, camsA())} src={img(f < P2 - 12 ? "cal.jpg" : "cal-hover.jpg")} />
        </AbsoluteFill>
      ) : null}
      {f >= XF_CHAT && f < XF_OUT + 1 ? (
        <AbsoluteFill style={{ opacity: Math.min(ramp(f, XF_CHAT, XF_CHAT + 8, Easing.linear), 1 - ramp(f, HANDOFF, XF_OUT, Easing.linear)) }}>
          <CalPart f={f} cam={camAlong(f, camsB())} src={calSrc(f)} />
        </AbsoluteFill>
      ) : null}
      <Pointer f={f} />
      <Hook />
      {/* dark only behind the logo, never over the laptop (round 2: the poster's screen reads brighter) */}
      {endDim > 0 ? <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(0,0,0,${0.4 * endDim}) 0%, rgba(0,0,0,0) 34%)` }} /> : null}
      <LogoEnd brand={BR} at={LOGO_END} x={W / 2} y={196} width={400} />
      <Audio src={img("audio/tonight-hiphop.mp3")} trimBefore={Math.round(MUSIC_T0 * FPS)}
        volume={(fr) => 0.8 * Math.min(1, fr / 6) * Math.min(1, Math.max(0, (DURATION - fr) / 20))} />
      {CUES.map((c, i) => (
        <Sequence key={i} from={c.at} name={`sfx ${i}`}>
          <Audio src={c.src} volume={c.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

/** Exported for the shot list and stills. */
export const MARKS = { LOGO_IN, HOOK_OUT, PUSH_START, PUSH_END, WALK_AT, P1, XF_CAL, P2, P3, LAND, HANDOFF, XF_OUT, LAMP_FROM, LAMP_TO, LOGO_END };
