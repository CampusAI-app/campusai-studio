/**
 * "Ask it like you'd ask a friend" (wave 1, 2026-10-22). 1080 x 1920, 30 fps, about 26 s.
 * One sentence: you can ask CampusAI the way you'd ask a friend, and it takes you all the way to your calendar.
 *
 * Every frame of product is a real campusai-demo capture from capture/w1-ask-friend.cjs (public/w1/ask-friend):
 *   logo     LogoOpen over the docked chat panel, the panel's own starters behind it
 *   ask      HonestTyping: "What should I bring" deleted back to "bring", then "ask at the Evercore chat?", typed
 *            into the chat panel's real field, ONE framing; on send the real recording takes over and the camera
 *            rises (crane, 26 f) to the answer streaming in the panel's narrow column (14 px text at 2.22x = 31 px)
 *   open     AnswerToPage: "Evercore Coffee Chat" in the answer lifts and opens as the event's real detail, landing
 *            on Why this fits you and the button row
 *   press    the pointer presses "Add to CampusAI Calendar"; the real recording of the press plays, it becomes
 *            "On your calendar"
 *   carry    the "On your calendar" pill lifts off the dialog and glides into Saturday's 10 AM slot on My Calendar,
 *            where the demo was showing the event as "Suggested", and becomes the real solid block (both crops real)
 *   end      NameToLogo fromElement: that Saturday block lifts and becomes the logo, one sheen, a breathing hold
 * Music: Cat Walk (Mixkit, ~130 BPM, grid 0.46156 s from 0.7085 s), trimmed so a beat lands on frame 0; the send,
 * the highlight, the press, the landing and the logo sit on beats.
 */
import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import {
  AnswerToPage,
  BlurLines,
  EASE,
  EASE_CAMERA,
  HonestTyping,
  LogoOpen,
  NameToLogo,
  PageView,
  PointerAt,
  ZODIAK,
  brand,
  camAlong,
  clampCam,
  glow,
  rectOnCanvas,
  toCanvas,
  useBrandFonts,
} from "../../kit";
import type { PageCam, Rect } from "../../kit";
import { FrameSeq, PageCrop } from "../../kit/pass/chat";
import type { Recording } from "../../kit/pass/chat";
import { scriptFrames } from "../../kit/pass/chat/HonestTyping";
import type { TypeStep } from "../../kit/pass/chat/HonestTyping";
import ansRec from "../../../public/w1/ask-friend/answer/frames.json";
import pressRec from "../../../public/w1/ask-friend/press/frames.json";
import focus from "../../../public/w1/ask-friend/panel-focus.json";
import typed from "../../../public/w1/ask-friend/panel-typed.json";
import answer from "../../../public/w1/ask-friend/panel-answer.json";
import event from "../../../public/w1/ask-friend/event.json";
import added from "../../../public/w1/ask-friend/event-added.json";
import calAfter from "../../../public/w1/ask-friend/cal-after.json";

export const W = 1080;
export const H = 1920;
export const FPS = 30;
const B = brand("campusai");
const PAGE = { w: 1440, h: 900 };
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const file = (n: string) => staticFile(`w1/ask-friend/${n}`);

// The product sits in the Reels-safe band (y 285 to 1500), the headline above it.
const VIEW: Rect = { x: 40, y: 330, w: 1000, h: 1170 };
// Round 2 (coordinator): the frame holds only what matters. While typing, the view is a short strip around the
// real field (logo and headline above it); on send it opens to a full-bleed band that the whole answer fills.
const V_TYPE: Rect = { x: 40, y: 960, w: 1000, h: 280 };
const V_ANS: Rect = { x: 0, y: 520, w: 1080, h: 870 };
// My Calendar: Saturday is the page's last column, so the view is set off-centre (its left part off the canvas)
// to put Saturday's block in the middle of the frame, 3.1x, its two lines about 40 px.
const V_CAL: Rect = { x: -253, y: 330, w: 1000, h: 1170 };
const LOGO_Y = 640;
const HEAD_Y = 806;
const mixRectK = (a: Rect, b: Rect, k: number): Rect => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, w: a.w + (b.w - a.w) * k, h: a.h + (b.h - a.h) * k });

/* ------------------------------------------------------------------ the beat grid */
const BEAT = 0.46156 * FPS; // 13.85 frames
const MUSIC_TRIM = Math.round(0.7085 * FPS); // a beat on frame 0
const beat = (n: number) => Math.round(n * BEAT);
const onBeat = (f: number) => beat(Math.ceil(f / BEAT - 1e-6));

/* ------------------------------------------------------------------ ask: typing and the answer */
const STEPS: TypeStep[] = [
  { type: "type", text: "What should I bring", perChar: 2.1, wobble: 0.4 },
  { type: "pause", frames: 16 },
  { type: "delete", count: 5, perChar: 1.6 },
  { type: "pause", frames: 4 },
  { type: "type", text: "ask at the Evercore chat?", perChar: 1.45, wobble: 0.12 },
];
const TYPE_AT = 6; // the first letter lands at 0.2 s: the hook is the typing
const SEND = onBeat(TYPE_AT + scriptFrames(STEPS) + 8);
// Recording time by segments: the send at true speed, the "Reading the event" line held long enough to read,
// the first letters, then the stream slowed (0.955 s of recording over 102 f) so each line can be read as it writes.
// Recording 1.49 to 1.745 s is stepped over: the demo shows the raw markdown "The **Evercore Coffee C" for that
// quarter second before the bold link resolves (frames f00076 to f00089), so the cut reads as one burst of words.
const TIMELINE = [
  { frames: 8, from: ansRec.marks.send, to: 0.6 },
  { frames: 36, from: 0.6, to: 1.36 },
  { frames: 8, from: 1.36, to: 1.485 },
  { frames: 102, from: 1.745, to: 2.7 },
];
const STREAM_END = SEND + TIMELINE.reduce((n, s) => n + s.frames, 0);
const RECORDING: Recording = { dir: file("answer/"), frames: ansRec.frames, clip: ansRec.clip };
// One framing while typing (the field at the bottom of the panel), then the answer: the panel's column fills the
// frame, 450 page px wide, so its 14 px text is 31 px here.
// Typing: the field fills the strip's width (440 page px, 2.27x, typed text 30 px). Answer: the answer column (x 1031
// to 1428) edge to edge with 8 px each side, 412 page px across 1080, 2.62x, body text 37 px; the loader to the
// follow-up suggestion (y 59 to 354) fits in one framing, so the camera holds while it streams (no line chasing).
const CAM_TYPE: PageCam = { cx: 1210.5, cy: 900 - (440 * V_TYPE.h) / V_TYPE.w / 2, cw: 440 };
const CAM_ANSWER: PageCam = { cx: 1229.5, cy: 56 + (412 * V_ANS.h) / V_ANS.w / 2, cw: 412 };
const typeViewAt = (f: number) => mixRectK(V_TYPE, V_ANS, interpolate(f, [SEND + 2, SEND + 28], [0, 1], { ...clamp, easing: EASE_CAMERA }));

/* ------------------------------------------------------------------ open: answer to the event */
const OPEN_AT = onBeat(STREAM_END + 50);
// No hold on the panel framing: the window lands straight on the whole event page (land = expand end + 1).
const OPEN_T = { highlight: 6, lift: 22, expand: 36, expandLen: 30, land: 67, landLen: 28 };
// Land on the whole event detail at its full width (title, Sat, Oct 24, Why this fits you, the buttons), so no
// line of it is cut by the frame edge; the dialog's 720 px panel just fits a 700 page px framing.
const LAND_CAM: PageCam = { cx: 720, cy: 424, cw: 700 };
const LAND_RECT: Rect = { x: LAND_CAM.cx - LAND_CAM.cw / 1.22 / 2, y: LAND_CAM.cy - 50, w: LAND_CAM.cw / 1.22, h: 100 };
// The answer still the name lifts from: the panel-answer capture with the panel replaced by the recording's last
// frame (public/w1/ask-friend/panel-answer-rec.jpg), because the panel had scrolled 52 px by then and the still,
// taken after, had not. The name's box moves up by the same 52 px.
const SCROLL = 52;
const NAME: Rect = { ...answer.boxes.name, y: answer.boxes.name.y - SCROLL };
const landCamAt = (local: number): PageCam => {
  const L = OPEN_T.land + OPEN_T.landLen;
  const settled = { ...LAND_CAM, cw: LAND_CAM.cw * 0.985 };
  return clampCam(camAlong(local, [{ t: L, cam: LAND_CAM }, { t: L + 120, cam: settled }]), PAGE, VIEW);
};

/* ------------------------------------------------------------------ press */
// The event page lands whole at 1.43x (title and date readable, its body is not), so the part that is pressed comes
// off it: the dialog's footer strip (the Details cards' tops, the caption's place, the button) lifts out of the page
// and grows to the full view width, 2.15x, where the button and the caption the press brings up read at phone size.
// Move: pop-out (element-body-moves): "a real piece of the page lifts off it toward the viewer while the page
// drops back". The strip is a window onto the same page and the real press recording, so it is live, not a copy.
const LANDED = OPEN_AT + OPEN_T.land + OPEN_T.landLen;
const PRESS = onBeat(LANDED + 52);
const POP = PRESS - 40;
const POP_LEN = 18;
const PRESS_REC: Recording = { dir: file("press/"), frames: pressRec.frames, clip: pressRec.clip };
const ADD = event.boxes.add as Rect;
const ADD_C = { x: ADD.x + ADD.w * 0.55, y: ADD.y + ADD.h * 0.55 };
const STRIP: Rect = { x: 398, y: 553, w: 465, h: 100 }; // the caption (x 408 to 857) and the button fit; Learn more (x 865) does not
const STRIP_CAM: PageCam = { cx: STRIP.x + STRIP.w / 2, cy: STRIP.y + STRIP.h / 2, cw: STRIP.w };
const STRIP_TO: Rect = { x: VIEW.x, y: 1100 - (VIEW.w * STRIP.h) / STRIP.w / 2, w: VIEW.w, h: (VIEW.w * STRIP.h) / STRIP.w };
const FOOTER = "rgb(29, 19, 20)"; // the dialog footer behind the button, sampled from event-added.jpg
const stripAt = (f: number): Rect => {
  const from = rectOnCanvas(landCamAt(POP - OPEN_AT), VIEW, STRIP);
  const k = interpolate(f, [POP, POP + POP_LEN], [0, 1], { ...clamp, easing: EASE });
  return { x: from.x + (STRIP_TO.x - from.x) * k, y: from.y + (STRIP_TO.y - from.y) * k, w: from.w + (STRIP_TO.w - from.w) * k, h: from.h + (STRIP_TO.h - from.h) * k };
};

/* ------------------------------------------------------------------ carry into My Calendar */
const LAND = onBeat(PRESS + 56);
const CARRY = LAND - 34;
const PILL = added.boxes.onCal as Rect;
const BLOCK: Rect = calAfter.blocks[0].block;
const CAM_CAL: PageCam = { cx: 1280, cy: 247, cw: 320 };
const CAM_CAL_DRIFT: PageCam = { cx: 1284, cy: 250, cw: 312 };

/* ------------------------------------------------------------------ end */
const LIFT = onBeat(LAND + 50);
const LOGO_AT = LIFT + 22;
const SHEEN_AT = LOGO_AT + 34;
export const DURATION = SHEEN_AT + 62 + 28;
const LOGO = { x: 540, y: VIEW.y + VIEW.h / 2, width: 470 };

/* ------------------------------------------------------------------ sound */
const sfx = (n: string) => file(`audio/${n}.mp3`);
const CUES: { at: number; name: string; volume: number }[] = [
  { at: 1, name: "sparkle-touch", volume: 0.3 }, // the logo
  { at: SEND, name: "ui-message-pop", volume: 0.45 }, // the question sent
  { at: OPEN_AT + OPEN_T.expand - 2, name: "swoosh-quick", volume: 0.35 }, // the name opens into the page
  { at: POP, name: "swoosh-quick", volume: 0.25 }, // the button strip comes off the page
  { at: PRESS, name: "ui-select-click", volume: 0.55 }, // the press
  { at: PRESS + 4, name: "ui-success-soft", volume: 0.35 }, // On your calendar
  { at: CARRY + 8, name: "air-woosh-quick", volume: 0.35 }, // the carry
  { at: LAND, name: "ui-confirm-tone", volume: 0.4 }, // it lands on Saturday
  { at: SHEEN_AT - 2, name: "shimmer-sparkle-sweep", volume: 0.35 }, // the sheen
];
const musicVolume = (f: number) => interpolate(f, [0, 4, DURATION - 24, DURATION - 1], [0, 0.6, 0.6, 0], clamp);

/* ------------------------------------------------------------------ the carry */
const Carry: React.FC = () => {
  const f = useCurrentFrame();
  if (f < CARRY - 2 || f >= LIFT) return null;
  // the dialog leaves while My Calendar comes up, overlapping 12 f, so the pill always leaves a page and lands on one
  const calCam = clampCam(camAlong(f, [{ t: LAND, cam: CAM_CAL }, { t: LIFT + 30, cam: CAM_CAL_DRIFT }]), PAGE, V_CAL);
  const calIn = interpolate(f, [CARRY + 8, CARRY + 20], [0, 1], { ...clamp, easing: EASE });
  // the pill: lifts 10 f, glides on an arc into the slot, its face handing over to the real block
  const lift = interpolate(f, [CARRY, CARRY + 10], [0, 1], { ...clamp, easing: EASE });
  const g = interpolate(f, [CARRY + 8, LAND], [0, 1], { ...clamp, easing: EASE_CAMERA });
  const a = rectOnCanvas(STRIP_CAM, stripAt(CARRY), PILL);
  const b = rectOnCanvas(CAM_CAL, V_CAL, BLOCK);
  const grow = 1 + 0.08 * lift * (1 - g);
  const w = (a.w + (b.w - a.w) * g) * grow;
  const h = (a.h + (b.h - a.h) * g) * grow;
  const cx = a.x + a.w / 2 + (b.x + b.w / 2 - (a.x + a.w / 2)) * g;
  const cy = a.y + a.h / 2 + (b.y + b.h / 2 - (a.y + a.h / 2)) * g - 8 * lift * (1 - g) - 150 * Math.sin(Math.PI * g);
  const pillFace = 1 - interpolate(g, [0.6, 0.76], [0, 1], clamp);
  const landed = f >= LAND;
  const pulse = interpolate(f, [LAND, LAND + 6, LAND + 22], [0, 1, 0], clamp);
  const s = toCanvas(calCam, V_CAL, 0, 0).s;
  const bl = rectOnCanvas(calCam, V_CAL, BLOCK);
  return (
    <>
      <div style={{ opacity: calIn }}>
        <PageView src={file(landed ? "cal-after.jpg" : "cal-before.jpg")} page={PAGE} cam={calCam} view={V_CAL} brand={B} />
      </div>
      {!landed && f >= CARRY && (
        <div style={{ position: "absolute", left: cx - w / 2, top: cy - h / 2, width: w, height: h, borderRadius: 7 * (w / a.w) * (a.w / PILL.w) / 2.2,
          overflow: "hidden", boxShadow: `0 ${24 * lift}px ${60 * lift}px rgba(0,0,0,${0.55 * lift}), 0 0 ${50 * lift}px ${glow(B, 0.4 * lift)}` }}>
          <PageCrop src={file("cal-after.jpg")} page={PAGE} from={BLOCK} to={{ x: 0, y: 0, w, h }} />
          <PageCrop src={file("event-added.jpg")} page={PAGE} from={PILL} to={{ x: 0, y: 0, w, h }} style={{ opacity: pillFace }} />
        </div>
      )}
      {pulse > 0 && (
        <div style={{ position: "absolute", left: bl.x - 4, top: bl.y - 4, width: bl.w + 8, height: bl.h + 8, borderRadius: 8 * s,
          boxShadow: `0 0 0 ${3 * pulse}px ${glow(B, 0.9 * pulse)}, 0 0 ${40 * pulse}px ${glow(B, 0.6 * pulse)}` }} />
      )}
    </>
  );
};

/* ------------------------------------------------------------------ the press */
const Press: React.FC = () => {
  const f = useCurrentFrame();
  if (f < LANDED || f >= CARRY + 26) return null;
  const cam = landCamAt(f - OPEN_AT);
  // the page drops back as the strip lifts; both leave as My Calendar comes up (see Carry)
  const leave = interpolate(f, [CARRY + 6, CARRY + 20], [0, 1], { ...clamp, easing: EASE });
  const dimD = interpolate(f, [POP, POP + POP_LEN], [0, 0.6], { ...clamp, easing: EASE });
  // recording time: the press lands on PRESS, a short pre-roll before it, then the recording holds
  const t = Math.min(1.9, Math.max(0.2, pressRec.marks.press + (f - PRESS) / FPS));
  const strip = stripAt(f);
  const lifted = f >= POP;
  const travel = interpolate(f, [PRESS - 22, PRESS - 3], [0, 1], { ...clamp, easing: EASE_CAMERA });
  const p = toCanvas(STRIP_CAM, strip, 905 + (ADD_C.x - 905) * travel, 700 + (ADD_C.y - 700) * travel);
  const since = f >= PRESS ? (f - PRESS) / FPS : null;
  const show = interpolate(f, [PRESS - 22, PRESS - 14], [0, 1], clamp) * (1 - interpolate(f, [CARRY - 2, CARRY + 6], [0, 1], clamp));
  const slot = rectOnCanvas(STRIP_CAM, strip, { x: PILL.x - 1, y: PILL.y - 1, w: PILL.w + 2, h: PILL.h + 2 });
  const sc = strip.w / STRIP.w;
  return (
    <>
      {leave < 1 && (
        <div style={{ opacity: 1 - leave }}>
          <PageView src={file("event.jpg")} page={PAGE} cam={cam} view={VIEW} brand={B} dim={dimD}>
            {!lifted && <FrameSeq rec={PRESS_REC} t={t} cam={cam} view={VIEW} trail={0} />}
          </PageView>
          {lifted && (
            <PageView src={file("event.jpg")} page={PAGE} cam={STRIP_CAM} view={strip} brand={B} radius={10 * sc}>
              <FrameSeq rec={PRESS_REC} t={t} cam={STRIP_CAM} view={strip} trail={0} />
              {/* once the pill lifts off, its place is the footer's own colour, not a second copy */}
              {f >= CARRY + 1 && <div style={{ position: "absolute", left: slot.x, top: slot.y, width: slot.w, height: slot.h, background: FOOTER }} />}
            </PageView>
          )}
        </div>
      )}
      {show > 0 && <PointerAt x={p.x} y={p.y} since={since} accent={B.color.accent} opacity={show} />}
    </>
  );
};

/* ------------------------------------------------------------------ the end */
const End: React.FC = () => {
  const f = useCurrentFrame();
  if (f < LIFT) return null;
  const cam = clampCam(camAlong(f, [{ t: LAND, cam: CAM_CAL }, { t: LIFT + 30, cam: CAM_CAL_DRIFT }]), PAGE, V_CAL);
  const dim = interpolate(f, [LIFT, LIFT + 18], [0, 1], { ...clamp, easing: EASE });
  const gone = interpolate(f, [LIFT + 8, LIFT + 34], [0, 1], { ...clamp, easing: EASE });
  const from = rectOnCanvas(clampCam(camAlong(LIFT, [{ t: LAND, cam: CAM_CAL }, { t: LIFT + 30, cam: CAM_CAL_DRIFT }]), PAGE, V_CAL), V_CAL, BLOCK);
  return (
    <>
      {gone < 1 && (
        <div style={{ opacity: 1 - gone }}>
          <PageView src={file("cal-after.jpg")} page={PAGE} cam={cam} view={V_CAL} brand={B} dim={0.7 * dim}>
            {/* the block has lifted off, so its slot shows the empty Friday cell beside it (same hour lines), dimmed
                the way PageView dims the page, instead of a second copy left behind */}
            <PageCrop src={file("cal-after.jpg")} page={PAGE} from={{ ...BLOCK, x: BLOCK.x - 131 }} to={rectOnCanvas(cam, V_CAL, BLOCK)}
              style={{ filter: `brightness(${1 - 0.7 * dim * 0.72}) saturate(${1 - 0.7 * dim * 0.6}) blur(${0.7 * dim * 3}px)` }} />
          </PageView>
        </div>
      )}
      <NameToLogo brand={B} variant="fromElement" x={LOGO.x} y={LOGO.y} width={LOGO.width} logoAt={LOGO_AT} sheenAt={SHEEN_AT}
        element={{ src: file("cal-after.jpg"), page: PAGE, rect: BLOCK, from, radius: 6, liftAt: LIFT }} />
    </>
  );
};

/* ------------------------------------------------------------------ opening: the logo above the field */
const Opening: React.FC = () => {
  const f = useCurrentFrame();
  if (f > SEND + 12) return null;
  return <LogoOpen brand={B} at={0} x={540} y={LOGO_Y} width={400} leaveAt={SEND - 4} />;
};

const Headline: React.FC = () => {
  const ink = { ink: B.color.ink, soft: B.color.inkSoft, accent: B.color.accent, surface: B.color.surface, line: B.color.inkSoft };
  return (
    <div style={{ position: "absolute", left: 0, top: HEAD_Y, width: W, transform: "translateY(-50%)", paddingLeft: 60 * 0.24, boxSizing: "border-box" }}>
      <BlurLines lines={[{ text: "Ask it like you'd ask a friend." }]} at={4} size={60} ink={ink} face={ZODIAK} outAt={SEND - 2} />
    </div>
  );
};

/** HonestTyping through the view that opens on send. */
const Ask: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <HonestTyping
      brand={B}
      page={{ src: file("panel-focus.jpg"), size: PAGE }}
      view={typeViewAt(f)}
      cams={[
        { t: 0, cam: CAM_TYPE },
        { t: SEND + 2, cam: CAM_TYPE },
        { t: SEND + 28, cam: CAM_ANSWER },
      ]}
      field={{ ...focus.textarea, fontSize: focus.style.fontSize, lineHeight: focus.style.lineHeight, color: focus.style.color }}
      script={{ at: TYPE_AT, steps: STEPS }}
      placeholder={{ rect: { x: 1043, y: 844, w: 292, h: 20 }, blankFrom: { x: 1043, y: 865, w: 292, h: 11 } }}
      sendLit={{ src: file("panel-typed.jpg"), rect: typed.send as Rect }}
      answer={{ rec: RECORDING, from: ansRec.marks.send, at: SEND, timeline: TIMELINE }}
      markColor="rgb(33, 21, 21)"
    />
  );
};

/** AnswerToPage, its view closing from the answer band back to the tall product view while the page opens. */
const Open: React.FC = () => {
  const f = useCurrentFrame(); // local to the sequence
  const view = mixRectK(V_ANS, VIEW, interpolate(f, [OPEN_T.expand, OPEN_T.expand + OPEN_T.expandLen], [0, 1], { ...clamp, easing: EASE_CAMERA }));
  return (
    <AnswerToPage
      brand={B}
      size={PAGE}
      view={view}
      from={{ src: file("panel-answer-rec.jpg"), name: NAME, frame: CAM_ANSWER, markColor: "rgb(33, 21, 21)", ground: "rgb(34, 22, 24)" }}
      to={{ src: file("event.jpg"), panel: event.boxes.panel, radius: event.boxes.panel.radius, title: event.boxes.title, land: LAND_RECT,
        markColor: "rgb(16, 10, 10)" }}
      timing={OPEN_T}
    />
  );
};

export const AskFriend: React.FC = () => {
  useBrandFonts(B);
  return (
    <AbsoluteFill style={{ background: B.color.bgDeep, backgroundImage: B.color.gradient, overflow: "hidden" }}>
      <Sequence from={0} durationInFrames={OPEN_AT + 1} layout="none">
        <Ask />
      </Sequence>
      <Sequence from={OPEN_AT} durationInFrames={PRESS - OPEN_AT} layout="none">
        <Open />
      </Sequence>
      <Press />
      <Carry />
      <End />
      <Opening />
      <Headline />
      <Audio src={sfx("cat-walk")} trimBefore={MUSIC_TRIM} volume={(fr: number) => musicVolume(fr)} />
      {CUES.map((c) => (
        <Sequence key={c.name + c.at} from={c.at} layout="none">
          <Audio src={sfx(c.name)} volume={c.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const TIMES = { TYPE_AT, SEND, STREAM_END, OPEN_AT, LANDED, POP, PRESS, CARRY, LAND, LIFT, LOGO_AT, SHEEN_AT, DURATION };
