/**
 * "Left on read", the doodle version (Muse pass 2026-11-25, jackson). One Terp's real answer (IMG_5696, Oct 15, Van
 * Munching Hall) told in @byjacksonsword's 5-part structure with three tension loops pinned on screen the whole way,
 * in his doodle-card edit. Brief, facts and timings: films/muse1125-jackson/.
 *
 *   Hook            0.0  "left on read ... two or three months" (cold open), the reply opens loop 1
 *   Rising action   3.0  the hardest part is staying in contact; she reaches out, really wants the job (loops 2, 3)
 *   Second conflict 10.3 left on read again, starburst, the wait counter runs to month 3
 *   Stall           13.4 "when I finally hear back from them it's like a..." freeze. Hold that thought.
 *   Climax          16.0 the real Deloitte page: a Terp inside, a short note, a follow-up date (loop 2 closes)
 *   Resolution      27.0 "a thank you message that ... steals my soul" (loops 1 and 3 close), ask a Terp, logo
 *
 * Her clip and words are a real student's: keep this file off the public repo before any push (src/trials rule).
 */
import React from "react";
import { AbsoluteFill, Easing, Freeze, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { pickBed } from "../../system/sound/bed";
import { useFrameSeq, asset } from "../../system/parts/common";
import { pointerAt } from "../../kit/FlowRecording";
import { PointerAt } from "../../kit/Pointer";
import { Cue } from "../../styles/common";
import { Chip, DOODLE, DoodleCard, MarkerRing, PinList } from "./DoodleCards";

const FPS = 30;
const CLIP = "muse1125-jackson/clip.mp4";
const FLOW = "muse1125-jackson/flow/frames.json";
export const LOR_FRAMES = 1050;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const EASE = Easing.bezier(0.65, 0, 0.35, 1);

// ---- her words, clip seconds (films/post-leftonread/captions.json, onsets measured on Nov 18) ----
type Wd = [string, number];
const W_HOOK: Wd[] = [["left", 12.24], ["on", 12.5], ["read", 12.7], ["by", 12.9], ["these", 13.14], ["companies", 13.4], ["for", 13.68], ["like", 14.08], ["two", 14.48], ["or", 14.62], ["three", 14.78], ["months,", 14.96]];
const W_RISE: Wd[] = [["I", 3.32], ["would", 3.36], ["say", 3.5], ["the", 3.62], ["hardest", 3.74], ["part", 4.02], ["is", 4.36], ["making", 4.74], ["sure", 4.94], ["that", 5.18], ["I", 5.32], ["can", 5.42], ["actually", 5.54], ["stay", 5.94], ["in", 6.22], ["contact", 6.5], ["with", 6.76], ["people.", 7.08]];
const W_REACH: Wd[] = [["Like", 7.74], ["I'll", 7.84], ["reach", 8.06], ["out", 8.3], ["and", 8.54], ["I'll", 8.68], ["be", 8.86], ["like,", 8.92], ["oh", 9.26], ["my", 9.36], ["gosh,", 9.5], ["like", 9.68], ["I", 9.84], ["really", 9.92], ["would", 10.2], ["want", 10.32], ["this", 10.48], ["job,", 10.68]];
const W_AGAIN: Wd[] = W_HOOK;
const W_STALL: Wd[] = [["and", 15.96], ["when", 16.04], ["I", 16.16], ["finally", 16.24], ["hear", 16.58], ["back", 16.76], ["from", 16.96], ["them", 17.14], ["it's", 17.3], ["like", 17.58], ["a...", 17.86]];
const W_END: Wd[] = [["thank", 18.12], ["you", 18.26], ["message", 18.42], ["that", 18.78], ["is", 19.04], ["just", 19.18], ["like", 19.5], ["kind", 19.72], ["of", 19.82], ["like", 19.94], ["steals", 20.1], ["my", 20.32], ["soul.", 20.42]];

/** A stretch of her clip placed in the film. */
type Seg = { at: number; from: number; to: number; words: Wd[]; look: "full" | "inset"; zoom?: number; punch?: [number, number][] };
const SEGS: Seg[] = [
  { at: 0, from: 12.24, to: 15.27, words: W_HOOK, look: "full", zoom: 1.6 },
  { at: 91, from: 3.32, to: 7.3, words: W_RISE, look: "full", zoom: 1.45, punch: [[170, 1.75]] },
  { at: 210, from: 7.74, to: 11.04, words: W_REACH, look: "inset" },
  { at: 309, from: 12.2, to: 15.3, words: W_AGAIN, look: "full", zoom: 1.7, punch: [[345, 1.95]] },
  { at: 402, from: 15.9, to: 17.97, words: W_STALL, look: "full", zoom: 1.5, punch: [[422, 1.8]] },
  { at: 810, from: 18.0, to: 20.88, words: W_END, look: "full", zoom: 1.6, punch: [[862, 1.9]] },
];
const segLen = (s: Seg) => Math.round((s.to - s.from) * FPS);
/** Film frame on which a clip second lands, inside a segment. */
const fAt = (s: Seg, c: number) => Math.round(s.at + (c - s.from) * FPS);
const FREEZE_AT = 464; // motion: her "a..." holds 16 frames, the stall
const FREEZE_TO = 480;

/** Caption chips of 1 to 3 words, broken after punctuation, each held until the next starts. */
const chunks = (s: Seg) => {
  const out: { at: number; to: number; text: string }[] = [];
  let cur: Wd[] = [];
  const flush = () => {
    if (cur.length) out.push({ at: fAt(s, cur[0][1]), to: 0, text: cur.map((w) => w[0]).join(" ") });
    cur = [];
  };
  for (const w of s.words) {
    cur.push(w);
    if (cur.length === 3 || /[,.?]$/.test(w[0]) || w[0].length > 7) flush();
  }
  flush();
  out.forEach((c, i) => (c.to = i < out.length - 1 ? out[i + 1].at : s.at + segLen(s)));
  return out;
};

// her face sits near (420, 780) in the 1080 x 1920 clip; every full-frame look pushes in on it
const FACE = { x: 450, y: 900 }; // the median of her face track (public/post-leftonread/track.json)

const Her: React.FC<{ s: Seg; frozen?: boolean }> = ({ s, frozen }) => {
  const f = useCurrentFrame() + s.at; // inside the Sequence
  let z = s.zoom ?? 1;
  for (const [pf, pz] of s.punch ?? []) if (f >= pf) z = pz; // punch-ins are cuts between two framings, never a crawl
  const video = <OffthreadVideo src={staticFile(CLIP)} startFrom={Math.round(s.from * FPS)} volume={frozen ? 0 : 1} style={{ width: 1080, height: 1920 }} />;
  if (s.look === "inset") {
    // the speaker small on the left of the flat ground, doodles on the right (the reference's second look)
    const k = 1.4;
    return (
      <AbsoluteFill style={{ background: DOODLE.ground }}>
        <div style={{ position: "absolute", left: 44, top: 560, width: 470, height: 640, overflow: "hidden", boxShadow: "0 10px 30px rgba(60,0,0,.35)" }}>
          <div style={{ position: "absolute", left: 235 - FACE.x * k, top: 300 - FACE.y * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: "0 0" }}>{video}</div>
        </div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${z})`, transformOrigin: `${FACE.x}px ${FACE.y}px` }}>{video}</div>
    </AbsoluteFill>
  );
};

// ---- the product: one recording of the real demo (films/muse1125-jackson/flow.json), shown frameless in a box ----
const BOX = { x: 20, y: 545, w: 1040, h: 800 };
type Cam = { cx: number; cy: number; W: number };
const CAM: Record<string, Cam> = {
  whole: { cx: 760, cy: 450, W: 1160 },
  alumni: { cx: 1000, cy: 212, W: 560 },
  referral: { cx: 1110, cy: 372, W: 540 },
  draft: { cx: 830, cy: 320, W: 1040 },
  keep: { cx: 540, cy: 420, W: 500 },
  modal: { cx: 640, cy: 262, W: 600 },
  remind: { cx: 600, cy: 560, W: 660 },
};
const mixCam = (a: Cam, b: Cam, k: number): Cam => ({ cx: a.cx + (b.cx - a.cx) * k, cy: a.cy + (b.cy - a.cy) * k, W: a.W + (b.W - a.W) * k });

/** Film frames 480 to 810: which recording second is on screen, the camera, and a second layer for a dissolve. */
const productAt = (f: number) => {
  const push = (a: string, b: string, f0: number, f1: number) => mixCam(CAM[a], CAM[b], interpolate(f, [f0, f1], [0, 1], { ...clamp, easing: EASE }));
  // C1 a Terp inside: the page whole for a beat, then the camera pushes onto the alumni banner
  if (f < 590) return { t: 5.7 + (f - 480) / FPS, cam: push("whole", "alumni", 482, 498) };
  // C2 a short note: Suggested things to do, the press on Draft it (2x), then a dissolve onto the finished draft
  if (f < 700) {
    const t = f < 636 ? 9.0 + ((f - 590) / FPS) * 2 : 19.85;
    const cam = f < 636 ? push("alumni", "referral", 590, 602) : push("draft", "keep", 650, 668);
    return { t, cam, prev: f >= 636 && f < 644 ? { t: 12.05, k: 1 - (f - 636) / 8, cam: CAM.referral } : undefined };
  }
  // C3 a follow-up date: the notes panel opens on Person you met, then Remind me to follow up opens its dates
  if (f < 740) return { t: 28.6 + (f - 700) / FPS, cam: CAM.modal, prev: f < 708 ? { t: 19.85, k: 1 - (f - 700) / 8, cam: CAM.keep } : undefined };
  return {
    t: f < 748 ? 31.95 + (f - 740) / FPS : 33.4,
    cam: push("modal", "remind", 748, 766),
  };
};

const RecLayer: React.FC<{ t: number; cam: Cam; opacity?: number; pointer?: boolean }> = ({ t, cam, opacity = 1, pointer = true }) => {
  const seq = useFrameSeq(FLOW) as (ReturnType<typeof useFrameSeq> & { vw: number; vh: number; moves?: Parameters<typeof pointerAt>[0] }) | null;
  if (!seq) return null;
  let shown = seq.frames[0];
  for (const fr of seq.frames) {
    if (fr.t <= t) shown = fr;
    else break;
  }
  const s = BOX.w / cam.W;
  const H = cam.W * (BOX.h / BOX.w);
  const cy = Math.max(H / 2, Math.min(900 - H / 2, cam.cy));
  const cx = Math.max(cam.W / 2, Math.min(1440 - cam.W / 2, cam.cx));
  const left = -(cx - cam.W / 2) * s;
  const top = -(cy - H / 2) * s;
  const at = pointer && seq.moves ? pointerAt(seq.moves, t) : null;
  return (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      <Img src={asset(seq.dir + shown.name)} style={{ position: "absolute", left, top, width: 1440 * s, height: 900 * s, maxWidth: "none", maxHeight: "none" }} />
      {at?.p ? <PointerAt x={left + at.p.x * s} y={top + at.p.y * s} since={at.since} accent={DOODLE.red} size={Math.round(22 * s)} /> : null}
    </div>
  );
};

const Product: React.FC = () => {
  const f = useCurrentFrame();
  if (f < 480 || f >= 810) return null;
  const p = productAt(f);
  // the box lands from a little below and larger in 6 frames, the beat drop
  const k = interpolate(f, [480, 486], [0, 1], { ...clamp, easing: Easing.bezier(0.2, 1.2, 0.4, 1) });
  return (
    <div style={{ position: "absolute", left: BOX.x, top: BOX.y, width: BOX.w, height: BOX.h, overflow: "hidden", borderRadius: 14,
      transform: `translateY(${(1 - k) * 60}px) scale(${1.08 - 0.08 * k})`, boxShadow: "0 18px 50px rgba(60,0,0,.45)", background: "#0b0708" }}>
      <RecLayer t={p.t} cam={p.cam} />
      {p.prev ? <RecLayer t={p.prev.t} cam={p.prev.cam} opacity={p.prev.k} pointer={false} /> : null}
    </div>
  );
};

/** The page box in canvas px for a page rect under the camera at frame f (to ring things on the product). */
const onBox = (f: number, r: { x: number; y: number; w: number; h: number }) => {
  const { cam } = productAt(f);
  const s = BOX.w / cam.W;
  const H = cam.W * (BOX.h / BOX.w);
  const cy = Math.max(H / 2, Math.min(900 - H / 2, cam.cy));
  const cx = Math.max(cam.W / 2, Math.min(1440 - cam.W / 2, cam.cx));
  return { x: BOX.x + (r.x - (cx - cam.W / 2)) * s, y: BOX.y + (r.y - (cy - H / 2)) * s, w: r.w * s, h: r.h * s };
};

const Ring: React.FC<{ at: number; out: number; r: { x: number; y: number; w: number; h: number }; pad?: number }> = ({ at, out, r, pad = 22 }) => {
  const b = onBox(at + 1, r);
  return <MarkerRing at={at} out={out} x={b.x - pad * 1.6} y={b.y - pad} w={b.w + pad * 3.2} h={b.h + pad * 2} />;
};

// ---- the three loops, pinned on a rail across the top ----
const RAIL_Y = 318;
const SLOT = { reply: { x: 190, y: RAIL_Y, w: 178 }, fix: { x: 540, y: RAIL_Y + 6, w: 268 }, wait: { x: 890, y: RAIL_Y, w: 178 } };
const TICK = { terp: 524, note: 676, date: 776 }; // loop 2's boxes, each on the beat that answers it
const L2_CLOSE = 790;
const REPLY_LANDS = 814; // "thank": loops 1 and 3 close

const Loops: React.FC = () => {
  const f = useCurrentFrame();
  const endOut = 962;
  return (
    <>
      {/* loop 1, the reply: opened on "companies", pinned at the cut, called back on "finally hear back", answered on "thank you message" */}
      <DoodleCard at={35} out={422} x={840} y={1150} w={330} rot={4} icon="envelope" label="their reply?" seed={11}
        move={{ at: 84, x: SLOT.reply.x, y: SLOT.reply.y, w: SLOT.reply.w, rot: -5 }} />
      <DoodleCard at={422} out={810} x={760} y={640} w={400} rot={-3} icon="envelope" label="their reply..." burst seed={12}
        move={{ at: 472, x: SLOT.reply.x, y: SLOT.reply.y, w: SLOT.reply.w, rot: -5 }} />
      <DoodleCard at={896} out={endOut} x={SLOT.reply.x} y={SLOT.reply.y} w={SLOT.reply.w} rot={-5} icon="envelopeOpen" label="answered" seed={13} />
      {/* loop 2, what actually keeps you in contact: opened on "this job", three boxes ticked by the product */}
      <PinList at={298} out={endOut} x={790} y={760} w={430} rot={2} title="what keeps you in contact?" seed={21}
        items={[{ label: "a Terp inside", tickAt: TICK.terp }, { label: "a short note", tickAt: TICK.note }, { label: "a follow-up date", tickAt: TICK.date }]}
        closeAt={L2_CLOSE} move={{ at: 305, x: SLOT.fix.x, y: SLOT.fix.y, w: SLOT.fix.w, rot: 1 }} />
      {/* loop 3, the wait: a clock that runs from "reach out" until the reply lands; the count is her "two or three months" */}
      <DoodleCard at={227} out={endOut} x={SLOT.wait.x} y={SLOT.wait.y} w={SLOT.wait.w} rot={5} icon="clock" label="day 1" seed={31}
        swap={f >= REPLY_LANDS ? { at: REPLY_LANDS, icon: "check", label: "month 3" } : f >= 386 ? { at: 386, icon: "clock", label: "month 3" } : f >= 377 ? { at: 377, icon: "clock", label: "month 2" } : f >= 345 ? { at: 345, icon: "clock", label: "week 4" } : undefined} />
    </>
  );
};

/** Everything that pops around her and the product, on the word that names it. */
const Cards: React.FC = () => (
  <>
    {/* hook: her words as red scraps, one per word, stacking top right (frame 0 already carries "LEFT") */}
    <DoodleCard at={0} out={91} x={680} y={330} w={250} rot={-4} text="LEFT" seed={1} />
    <DoodleCard at={8} out={91} x={900} y={350} w={170} rot={3} text="ON" seed={2} />
    <DoodleCard at={14} out={91} x={790} y={500} w={300} rot={-2} text="READ" seed={3} />
    <DoodleCard at={67} out={91} x={300} y={1150} w={340} rot={-3} text={"2 OR 3\nMONTHS"} size={78} seed={4} />
    {/* rising action: the hardest part, then the goal under it */}
    <DoodleCard at={103} out={210} x={745} y={520} w={380} rot={-3} text="HARDEST" seed={5} />
    <DoodleCard at={112} out={210} x={905} y={660} w={240} rot={4} text="PART" seed={6} />
    <DoodleCard at={170} out={210} x={300} y={500} w={250} rot={-5} text="GOAL" seed={7} />
    <DoodleCard at={178} out={210} x={780} y={1100} w={470} rot={2} tone="hand" text={"stay in contact\nwith people"} size={54} edge seed={8} />
    <DoodleCard at={204} out={210} x={930} y={880} w={190} rot={-6} icon="person" seed={9} />
    {/* inset: she reaches out, really wants it */}
    <DoodleCard at={219} out={298} x={800} y={640} w={330} rot={-4} icon="plane" label="reach out" paper="lined" seed={14} />
    <DoodleCard at={255} out={298} x={810} y={1010} w={270} rot={5} icon="hearts" label="oh my gosh" seed={15} />
    <DoodleCard at={292} out={309} x={780} y={1180} w={420} rot={-3} text="THIS JOB" burst seed={16} />
    {/* second conflict: the read receipt on a red starburst, then the counter runs in the rail */}
    <DoodleCard at={324} out={402} x={760} y={640} w={360} rot={-4} icon="read" label="Read" burst seed={17} />
    <DoodleCard at={377} out={402} x={800} y={1080} w={330} rot={4} text={"2 OR 3\nMONTHS"} size={74} seed={18} />
    {/* climax: the answers land as scraps under the product, each on its press */}
    <DoodleCard at={518} out={590} x={330} y={1450} w={560} rot={-5} text="A TERP INSIDE" size={84} seed={41} />
    <DoodleCard at={668} out={700} x={720} y={1470} w={560} rot={4} text={"A SHORT\nNOTE"} size={104} seed={42} />
    <DoodleCard at={770} out={810} x={600} y={1500} w={600} rot={-3} text={"A FOLLOW-UP\nDATE"} size={92} seed={43} />
    <DoodleCard at={483} out={518} x={560} y={1440} w={600} rot={-1} tone="hand" text={"what would\nhave helped?"} size={64} edge seed={44} />
    {/* resolution: the reply, then her soul leaving */}
    <DoodleCard at={814} out={896} x={800} y={640} w={380} rot={4} icon="envelope" swap={{ at: 822, icon: "envelopeOpen", label: "a thank you message" }} seed={51} />
    <DoodleCard at={882} out={896} x={330} y={560} w={230} rot={-6} icon="ghost" label="my soul" paper="none" seed={52} move={{ at: 884, x: 320, y: 480, w: 230, rot: 6 }} />
  </>
);

const Rings: React.FC = () => (
  <>
    <Ring at={512} out={590} r={{ x: 753, y: 181, w: 425, h: 43 }} />
    <Ring at={603} out={636} r={{ x: 967, y: 404, w: 352, h: 30 }} pad={18} />
    <Ring at={668} out={700} r={{ x: 344, y: 453, w: 310, h: 29 }} pad={18} />
    <Ring at={766} out={810} r={{ x: 381, y: 430, w: 280, h: 44 }} pad={20} />
  </>
);

/** The close: next time, the product's own line, then the logo stamped on a scrap. */
const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  if (f < 896) return null;
  const logoAt = 962;
  const drift = interpolate(f, [logoAt, LOR_FRAMES], [1, 1.035], clamp);
  return (
    <AbsoluteFill style={{ background: DOODLE.ground }}>
      <DoodleCard at={898} out={logoAt} x={540} y={640} w={330} rot={-3} tone="hand" text="next time," size={58} edge seed={61} />
      <DoodleCard at={906} out={logoAt} x={540} y={820} w={660} rot={2} text="ASK A TERP" size={120} burst seed={62} />
      <DoodleCard at={918} out={logoAt} x={540} y={1020} w={480} rot={-2} tone="hand" text="for 15 minutes." size={58} edge seed={63} />
      {f >= logoAt ? (
        <div style={{ position: "absolute", left: 540, top: 900, transform: `translate(-50%,-50%) rotate(-2deg) scale(${drift * interpolate(f - logoAt, [0, 3], [1.12, 1], clamp)})` }}>
          <div style={{ background: DOODLE.paper, padding: "46px 60px", clipPath: "polygon(0% 2%,12% 0%,30% 1.5%,52% 0%,70% 2%,88% 0.5%,100% 2%,99% 30%,100% 62%,98.5% 100%,80% 98%,60% 100%,40% 98.5%,20% 100%,0% 98%,1% 60%,0% 30%)",
            filter: "drop-shadow(0 6px 10px rgba(0,0,0,.3))" }}>
            <Img src={staticFile("brand/campusai-logo.svg")} style={{ width: 560, display: "block" }} />
          </div>
        </div>
      ) : null}
      <Chip at={logoAt + 8} to={LOR_FRAMES + 1} text="Link in bio" dark y={1120} size={52} />
    </AbsoluteFill>
  );
};

/** The opening lockup, frame 0: the UMD M and our wordmark top left, so it reads as Maryland before the first word. */
const Lockup: React.FC = () => {
  const f = useCurrentFrame();
  if (f >= 210) return null;
  return (
    <div style={{ position: "absolute", left: 56, top: 118, display: "flex", alignItems: "center", gap: 18, filter: "drop-shadow(0 2px 8px rgba(0,0,0,.45))" }}>
      <Img src={staticFile("private-umd-logo/umd-m.svg")} style={{ height: 58 }} />
      <div style={{ width: 2, height: 44, background: "rgba(255,255,255,.7)" }} />
      <Img src={staticFile("brand/campusai-logo-white.svg")} style={{ height: 44 }} />
    </div>
  );
};

/** The bed: a licensed track (system/sound/bed.ts) from the beat drop on the climax, ducked under her punchline. */
const MusicBed: React.FC = () => {
  const { id } = useVideoConfig();
  const total = LOR_FRAMES - 480;
  const bed = pickBed(id, total / FPS);
  return (
    <Audio src={staticFile(bed.file)} trimBefore={Math.round(bed.startAt * FPS)}
      volume={(k) => 0.5 * bed.gain * interpolate(k, [0, 6, 320, 330, 412, 424, total - 24, total], [0, 1, 1, 0.12, 0.12, 1, 1, 0], clamp)} />
  );
};

const Stall: React.FC = () => {
  const f = useCurrentFrame();
  if (f < FREEZE_AT || f >= FREEZE_TO) return null;
  return <DoodleCard at={FREEZE_AT} out={FREEZE_TO} x={540} y={1330} w={640} rot={-4} text={"HOLD THAT\nTHOUGHT"} size={110} burst seed={71} />;
};

export const LeftOnRead: React.FC = () => {
  const f = useCurrentFrame();
  const inProduct = f >= 480 && f < 810;
  return (
    <AbsoluteFill style={{ background: DOODLE.ground }}>
      {SEGS.map((s, i) => (
        <Sequence key={i} from={s.at} durationInFrames={segLen(s) + (s.at === 402 ? FREEZE_TO - FREEZE_AT : 0)} layout="none">
          {s.at === 402 && f >= FREEZE_AT ? (
            <AbsoluteFill style={{ transform: `scale(${interpolate(f, [FREEZE_AT, FREEZE_TO], [1, 1.07], clamp)})`, transformOrigin: `${FACE.x}px ${FACE.y}px`,
              filter: "grayscale(0.85) contrast(1.15) brightness(0.92)" }}>
              <Freeze frame={FREEZE_AT - s.at - 1}><Her s={s} frozen /></Freeze>
            </AbsoluteFill>
          ) : (
            <Her s={s} />
          )}
        </Sequence>
      ))}
      {inProduct ? <AbsoluteFill style={{ background: DOODLE.ground }} /> : null}
      <Product />
      <Rings />
      <Cards />
      {SEGS.map((s, i) => chunks(s).map((c, j) => <Chip key={`${i}-${j}`} at={c.at} to={Math.min(c.to, s.at === 402 ? FREEZE_AT : c.to)} text={c.text} dark={s.look === "inset"} />))}
      <Stall />
      <EndCard />
      <Loops />
      <Lockup />
      {/* sound: her voice under her; the bed comes in on the climax, the beat drop, and ducks under her punchline */}
      <Sequence from={480} layout="none">
        <MusicBed />
      </Sequence>
      <Cue at={480} name="bass-hit-short" volume={0.7} />
      {[0, 14, 67, 103, 170, 219, 255, 292, 324, 422, 518, 668, 770, 822, 906, 962].map((a) => (
        <Cue key={a} at={a} name="paper-move-quick" volume={0.32} />
      ))}
      {[512, 603, 668, 766].map((a) => <Cue key={`m${a}`} at={a} name="marker-pen-line" volume={0.35} />)}
      {[TICK.terp, TICK.note, TICK.date, L2_CLOSE, REPLY_LANDS].map((a) => <Cue key={`t${a}`} at={a} name="typewriter-hit-soft" volume={0.4} />)}
      <Cue at={FREEZE_AT} name="switch-tap" volume={0.5} />
    </AbsoluteFill>
  );
};
