/**
 * Favorite study spot (2026-10-23), 9:16. Ashley's street interview, lifted.
 *
 * Round 6 (2026-10-27) runs on her third cut. It plays as is up to her end card (frame 992). Over it, each answer lands
 * as a place tag under her burned-in question: the place's icon drops when it is said and the name opens out of it,
 * and each carries one gag on the student's own words (see Tag). The opener is the pin searching while she asks, landing
 * on the first answer. The student with no answer gets the fun one: the pin hunts around ("Searching"), gives up and
 * falls over ("No spot yet"), and when Ashley says "That's an answer too" a stamp lands on it: "Still counts". The last
 * clip's pin lands on his campusai cap. At 991 the footage goes dark and the question goes to CampusAI: the real full-page chat
 * (campusai-demo /ai), recorded at the frame's own 9:16 shape so the page IS the frame. It opens zoomed in on
 * the chat box as "Best study spots on campus?" types, pulls back once it is sent, and the answer fills the
 * frame. Then the logo and campusai.app. No music (Jacob, round 4).
 *
 * Every tag is a word said on camera: films/study-spot/facts.md. Tag times are word starts from the
 * transcript, in frames at 30 fps. The answer is STUDY_TURN in campusai-demo's chat route, every reason
 * sourced; the recording is capture/study-spot-record.cjs (post2-record.cjs pointed at the deployed demo).
 */
import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { brand as getBrand, glow, INTER, LogoEnd, LogoOpen, useBrandFonts } from "../kit";
import { EASE, EASE_CAMERA } from "../lib/anim";
import rec from "../../public/study-spot/ai916/frames.json";

export const STUDY_FPS = 30;
export const STUDY_SIZE = { width: 1080, height: 1920 };

const B = getBrand("campusai");
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Ashley's third cut (2026-10-27): her question is burned in from 0.1 s, the answers reordered, and the hat
// ("Nice hat" / "I got it from CampusAI") moved to the end. Her end card starts at frame 992 (33.07 s); everything after is ours.
const SRC = "study-spot/ashley-source-v3.mov";
const SRC_END = 991;

type Icon = "pin" | "home" | "landmark" | "sun" | "down" | "lock" | "sparkles" | "briefcase";
// Each tag can carry one gag on the student's own words: `hunt` (the pin searches before it lands), `plusOne` ("Mine
// too"), `sink` (the tag drops a floor on "basement"), `lock` (the icon locks on "Secretive"), `hearts` ("Love it").
type Tag = { at: number; text: string; icon: Icon; sub?: { at: number; text: string }; hunt?: number; plusOne?: number; sink?: number; lock?: number; hearts?: number };

// Word starts in the third cut (faster-whisper small.en), in frames at 30 fps. ESJ (12.28 s) gets no tag: its clip runs
// 0.8 s before Hillel is said, under the read floor.
const TAGS: Tag[] = [
  { at: 79, text: "Public Policy Building", icon: "landmark", hunt: 8 },
  { at: 145, text: "Iribe rooftop", icon: "sun", plusOne: 199 },
  { at: 268, text: "Business School basement", icon: "down", sink: 284, lock: 342, sub: { at: 342, text: "Classified" } },
  { at: 400, text: "Hillel", icon: "sparkles", hearts: 442 },
  { at: 492, text: "Business hall", icon: "briefcase", sub: { at: 545, text: "a.k.a. Van Munching Hall" } },
  { at: 633, text: "Dorm room desk", icon: "home", sub: { at: 689, text: "Prince Frederick" } },
];

// The student with no spot: hunts from "studying a lot" (25.67 s), gives up as "spot." ends (28.0 s), stamp on "That's
// an answer too" (28.54 s). Leaves at the cut to the hat.
const NO = { at: 770, giveUp: 840, stamp: 856 };

// The hat (it says campusai on it): the clip cuts in at 888, "hat" is said at 30.10 s. The cap's crown sits at x 360 to 380,
// top y about 736, through the whole clip (measured every 0.2 s), so the pin holds still.
const HAT = { cut: 888, at: 899, x: 372, tipY: 742 };

// Under Ashley's question, above every face in her cut (checked on each clip).
const SLOT = { x: 72, y: 474 };
const TAG_H = 106;
const FONT = 52;

/* ------------------------------------------------------------------ the ask */
// The recording: 820 x 1458 CSS px at DPR 2, the answer zoomed 2.2x and the chat box 1.75x, stamped in playback seconds
// (true speed). Once the answer has streamed the conversation scrolls itself down to bring up STEM and Stamp.
const ASK_AT = SRC_END + 4;
const REC_FROM = 0.45; // just before the first letter (typeStart 0.60)
const REC_TO = rec.frames[rec.frames.length - 1].t;
const HOLD = 0; // the recording itself holds 3.2 s on the whole list after it scrolls
const ASK_LEN = Math.round((REC_TO - REC_FROM) * STUDY_FPS) + HOLD;
const SEND = Math.round((rec.marks.send - REC_FROM) * STUDY_FPS);
const TYPE_START = Math.round((rec.marks.typeStart - REC_FROM) * STUDY_FPS);
const Q_LEN = "Best study spots on campus?".length;
const LOGO_AT = ASK_AT + ASK_LEN;
const LOGO_LEN = 96;
export const STUDY_FRAMES = LOGO_AT + LOGO_LEN;
// While typing, the camera sits in on the chat box (canvas x 118 to 961, centre y 1785 at 1x): 1.25x fills the width,
// and the box is lifted to y 1450. Everything above and below it is in the dark (below, the page's own bottom edge), so the greeting (and its turtle) never reads;
// the dark lifts as the camera pulls back after the send, when the page has already turned into the conversation.
const ZOOM = 1.25;
const BOX = { cy: 1785, typeCy: 1450 };

const PIN_PATH = "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0";
const HEART_PATH = "M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5";
// Lucide's own geometry (the set the product uses), drawn as red strokes like the house was.
const ICONS: Record<Exclude<Icon, "pin">, React.ReactNode> = {
  home: (<><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></>),
  landmark: (<><path d="M10 18v-7" /><path d="M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z" /><path d="M14 18v-7" /><path d="M18 18v-7" /><path d="M3 22h18" /><path d="M6 18v-7" /></>),
  sun: (<><circle cx={12} cy={12} r={4} /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></>),
  down: (<><path d="M12 17V3" /><path d="m6 11 6 6 6-6" /><path d="M19 21H5" /></>),
  lock: (<><rect width={18} height={11} x={3} y={11} rx={2} ry={2} /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>),
  sparkles: (<><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" /><path d="M20 2v4" /><path d="M22 4h-4" /><circle cx={4} cy={20} r={2} /></>),
  briefcase: (<><path d="M12 12h.01" /><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /><path d="M22 13a18.15 18.15 0 0 1-20 0" /><rect width={20} height={14} x={2} y={6} rx={2} /></>),
};

const PinSvg: React.FC<{ icon: Icon; size: number; style?: React.CSSProperties }> = ({ icon, size, style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={{ position: "absolute", inset: 0, overflow: "visible", filter: `drop-shadow(0 4px 10px ${glow(B, 0.55)})`, ...style }}>
    {icon === "pin" ? (
      <>
        <path d={PIN_PATH} fill={B.color.accent} />
        <circle cx={12} cy={10} r={3.2} fill={B.color.bgDeep} />
      </>
    ) : (
      <g fill="none" stroke={B.color.accent} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">{ICONS[icon]}</g>
    )}
  </svg>
);

/** The pin (or the place's icon) dropping onto the tag. `t` is frames since the tag's start; `from` is where it falls from. */
const Marker: React.FC<{ icon: Icon; t: number; size: number; from?: number; pop?: number }> = ({ icon, t, size, from = -70, pop = 0 }) => {
  const { fps } = useVideoConfig();
  const drop = spring({ frame: t, fps, config: { damping: 11, stiffness: 160, mass: 0.6 } });
  const ring = interpolate(t, [5, 22], [0, 1], clamp);
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      {ring > 0 && ring < 1 && (
        <div style={{ position: "absolute", left: size / 2 - 22, top: size * 0.86 - 7, width: 44, height: 14, borderRadius: "50%",
          border: `2px solid ${glow(B, 0.9 * (1 - ring))}`, transform: `scale(${(0.4 + ring * 1.6).toFixed(3)})` }} />
      )}
      <PinSvg icon={icon} size={size} style={{ opacity: Math.min(1, drop * 2), transform: `translateY(${((1 - drop) * from).toFixed(2)}px) scale(${(1 + pop).toFixed(4)})` }} />
    </div>
  );
};

/** The search: the pin hovers and swings left and right, never landing. `t` frames since it started. */
const huntMotion = (t: number, fps: number) => {
  const swing = Math.sin((t / fps) * Math.PI * 2 * 1.6) * interpolate(t, [4, 12], [0, 1], clamp);
  return { rot: swing * 22, dx: swing * 8, hover: -8 + Math.sin((t / fps) * Math.PI * 2 * 3.2) * 3 };
};

/** The dark glass pill every tag sits in. */
const Pill: React.FC<{ show: number; height: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ show, height, children, style }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 16, height, padding: "0 30px 0 20px", borderRadius: 28,
    background: `rgba(11, 7, 8, ${(0.74 * show).toFixed(3)})`, backdropFilter: `blur(${(12 * show).toFixed(1)}px)`,
    border: `1px solid rgba(255, 255, 255, ${(0.1 * show).toFixed(3)})`, boxShadow: `0 10px 30px rgba(0, 0, 0, ${(0.35 * show).toFixed(3)})`, ...style }}>
    {children}
  </div>
);

const nameStyle: React.CSSProperties = { fontFamily: INTER, fontWeight: 600, fontSize: FONT, color: B.color.ink, letterSpacing: "-0.02em", whiteSpace: "nowrap" };

/** One place tag. `t` frames since the place was said (negative while a `hunt` tag is still searching). */
const TagPill: React.FC<{ tag: Tag; t: number }> = ({ tag, t }) => {
  const { fps } = useVideoConfig();
  const since = (at?: number) => (at === undefined ? -1 : t - (at - tag.at)); // frames since a gag's word
  const start = tag.hunt !== undefined ? tag.hunt - tag.at : 0;
  const show = interpolate(t - start, [2, 12], [0, 1], { ...clamp, easing: EASE });
  const open = interpolate(t, [6, 18], [0, 1], { ...clamp, easing: EASE });
  const sub = tag.sub ? interpolate(since(tag.sub.at), [0, 12], [0, 1], { ...clamp, easing: EASE }) : 0;
  const hunting = t < 0;
  const searchOut = interpolate(t, [0, 8], [0, 1], { ...clamp, easing: EASE });
  const h = huntMotion(t - start, fps);
  // the floor drop on "basement": the tag sinks a step with a bounce, the arrow leading
  const sink = tag.sink !== undefined ? spring({ frame: since(tag.sink), fps, config: { damping: 9, stiffness: 170, mass: 0.7 } }) * 26 : 0;
  // "Secretive": the arrow turns into a lock with a small pop
  const locked = tag.lock !== undefined && since(tag.lock) >= 0;
  const lockPop = locked ? interpolate(since(tag.lock), [0, 4, 12], [0, 0.35, 0], clamp) : 0;
  const one = tag.plusOne !== undefined ? spring({ frame: since(tag.plusOne), fps, config: { damping: 10, stiffness: 220, mass: 0.6 } }) : 0;
  const hearts = since(tag.hearts);
  return (
    <div style={{ position: "relative", display: "inline-block", transform: `translateY(${sink.toFixed(2)}px)` }}>
      <Pill show={show} height={TAG_H + sub * 50}>
        {hunting ? (
          <div style={{ position: "relative", width: 58, height: 58, flex: "none" }}>
            <PinSvg icon="pin" size={58} style={{ opacity: show, transformOrigin: "50% 92%",
              transform: `translate(${h.dx.toFixed(2)}px, ${h.hover.toFixed(2)}px) rotate(${h.rot.toFixed(2)}deg)` }} />
          </div>
        ) : (
          <Marker icon={locked ? "lock" : tag.icon} t={t} size={58} from={tag.hunt !== undefined ? -40 : -70} pop={lockPop} />
        )}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "center",
          width: tag.hunt !== undefined ? interpolate(t, [0, 14], [300, 528], { ...clamp, easing: EASE }) : undefined }}>
          {tag.hunt !== undefined && searchOut < 1 && (
            <div style={{ ...nameStyle, position: "absolute", left: 0, color: B.color.inkSoft, opacity: 1 - searchOut, transform: `translateY(${(searchOut * -20).toFixed(2)}px)` }}>
              Searching{".".repeat(1 + (Math.floor((t - start) / 7) % 3))}
            </div>
          )}
          <div style={{ ...nameStyle, clipPath: `inset(-10px ${((1 - open) * 100).toFixed(2)}% -10px 0)`, transform: `translateX(${((1 - open) * -10).toFixed(2)}px)` }}>
            {tag.text}
          </div>
          {tag.sub && sub > 0 && (
            <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: 36, color: B.color.inkSoft, whiteSpace: "nowrap",
              opacity: sub, transform: `translateY(${((1 - sub) * 10).toFixed(2)}px)` }}>
              {tag.sub.text}
            </div>
          )}
        </div>
      </Pill>
      {one > 0.01 && (
        <div style={{ position: "absolute", left: "calc(100% + 14px)", top: TAG_H / 2 - 33, height: 66, padding: "0 22px", borderRadius: 33, display: "flex", alignItems: "center",
          background: B.color.accent, color: "#fff", fontFamily: INTER, fontWeight: 700, fontSize: 40, whiteSpace: "nowrap",
          opacity: Math.min(1, one * 2), transform: `scale(${(0.4 + 0.6 * one).toFixed(4)}) rotate(${((1 - one) * -14).toFixed(2)}deg)`, transformOrigin: "left center",
          boxShadow: `0 6px 20px ${glow(B, 0.45)}` }}>
          +1
        </div>
      )}
      {hearts >= 0 && [0, 1, 2].map((i) => {
        const p = interpolate(hearts - i * 5, [0, 34], [0, 1], clamp);
        if (p <= 0 || p >= 1) return null;
        return (
          // they float off the pill's right side and stay below her question caption
          <svg key={i} viewBox="0 0 24 24" width={54 - i * 8} height={54 - i * 8} style={{ position: "absolute", overflow: "visible",
            left: `calc(100% + ${18 + i * 46}px)`, top: TAG_H / 2 - 10 - p * 70 + i * 6,
            opacity: interpolate(p, [0, 0.15, 0.7, 1], [0, 1, 1, 0]), transform: `rotate(${((i - 1) * 12 + Math.sin(p * 6) * 8).toFixed(2)}deg) scale(${interpolate(p, [0, 0.2], [0.4, 1], clamp).toFixed(3)})` }}>
            <path d={HEART_PATH} fill={B.color.accent} />
          </svg>
        );
      })}
    </div>
  );
};

/**
 * The student with no answer. The pin drops but never lands: it hunts left and right while the tag reads
 * "Searching", gives up and falls on its side ("No spot yet", the pill shakes its head), then a stamp lands on
 * Ashley's line: "Still counts". `t` frames since NO.at.
 */
const NoSpotPill: React.FC<{ t: number }> = ({ t }) => {
  const { fps } = useVideoConfig();
  const giveUp = NO.giveUp - NO.at;
  const stampAt = NO.stamp - NO.at;
  const show = interpolate(t, [2, 12], [0, 1], { ...clamp, easing: EASE });
  const drop = spring({ frame: t, fps, config: { damping: 12, stiffness: 150, mass: 0.6 } });
  // hunting: a hover and a swing that grows, then stops when it gives up
  const hunt = t < giveUp ? Math.sin((t / fps) * Math.PI * 2 * 1.6) * interpolate(t, [4, 12], [0, 1], clamp) : 0;
  const hover = t < giveUp ? -8 + Math.sin((t / fps) * Math.PI * 2 * 3.2) * 3 : 0;
  const fall = spring({ frame: t - giveUp, fps, config: { damping: 8, stiffness: 140 } });
  const rot = t < giveUp ? hunt * 22 : fall * -96;
  const dx = t < giveUp ? hunt * 8 : 0;
  // the pill shakes its head as it gives up
  const shake = t >= giveUp + 2 ? Math.sin(((t - giveUp - 2) / fps) * Math.PI * 2 * 5) * interpolate(t, [giveUp + 2, giveUp + 16], [16, 0], clamp) : 0;
  const swap = interpolate(t, [giveUp, giveUp + 8], [0, 1], { ...clamp, easing: EASE });
  const open = interpolate(t, [6, 18], [0, 1], { ...clamp, easing: EASE });
  const dots = ".".repeat(1 + (Math.floor(t / 7) % 3));
  const stamp = spring({ frame: t - stampAt, fps, config: { damping: 12, stiffness: 260, mass: 0.7 } });
  const thud = t >= stampAt ? interpolate(t, [stampAt, stampAt + 3, stampAt + 9], [0, 1, 0], clamp) : 0;
  return (
    <div style={{ position: "relative", transform: `translateX(${shake.toFixed(2)}px) translateY(${(thud * 5).toFixed(2)}px)` }}>
      <Pill show={show} height={TAG_H}>
        <div style={{ position: "relative", width: 58, height: 58, flex: "none" }}>
          <PinSvg icon="pin" size={58} style={{ opacity: Math.min(1, drop * 2), transformOrigin: "50% 92%",
            transform: `translate(${dx.toFixed(2)}px, ${((1 - drop) * -70 + hover).toFixed(2)}px) rotate(${rot.toFixed(2)}deg)` }} />
        </div>
        <div style={{ position: "relative", height: FONT * 1.3, minWidth: 300 }}>
          <div style={{ ...nameStyle, position: "absolute", left: 0, top: 0, color: B.color.inkSoft, opacity: 1 - swap,
            clipPath: `inset(-10px ${((1 - open) * 100).toFixed(2)}% -10px 0)`, transform: `translateY(${(swap * -20).toFixed(2)}px)` }}>
            Searching{dots}
          </div>
          {swap > 0 && (
            <div style={{ ...nameStyle, position: "absolute", left: 0, top: 0, opacity: swap, transform: `translateY(${((1 - swap) * 20).toFixed(2)}px)` }}>
              No spot yet
            </div>
          )}
        </div>
      </Pill>
      {t >= stampAt && (
        <div style={{ position: "absolute", left: 420, top: -34, padding: "10px 24px", borderRadius: 16, border: `6px solid ${B.color.accent}`,
          color: B.color.accent, background: "rgba(11, 7, 8, 0.7)", fontFamily: INTER, fontWeight: 700, fontSize: 50, letterSpacing: "-0.01em", whiteSpace: "nowrap",
          opacity: Math.min(1, stamp * 3), transform: `rotate(-9deg) scale(${(2.2 - 1.2 * stamp).toFixed(3)})`,
          boxShadow: `0 0 26px ${glow(B, 0.35 * stamp)}` }}>
          Still counts
        </div>
      )}
    </div>
  );
};

/** The last answer is the hat: a pin drops onto the campusai on his cap and the tag beside it calls it. */
const HatPin: React.FC = () => {
  const f = useCurrentFrame();
  if (f < HAT.at || f >= SRC_END) return null;
  const t = f - HAT.at;
  const size = 76;
  const open = interpolate(t, [8, 20], [0, 1], { ...clamp, easing: EASE });
  const show = interpolate(t, [4, 14], [0, 1], { ...clamp, easing: EASE });
  const leave = interpolate(f, [SRC_END - 12, SRC_END - 2], [0, 1], { ...clamp, easing: EASE });
  return (
    <div style={{ opacity: 1 - leave }}>
      <div style={{ position: "absolute", left: HAT.x - size / 2, top: HAT.tipY - size * 0.92 }}>
        <Marker icon="pin" t={t} size={size} from={-110} />
      </div>
      <div style={{ position: "absolute", left: HAT.x + 54, top: HAT.tipY - 96 }}>
        <Pill show={show} height={80} style={{ padding: "0 26px", borderRadius: 24 }}>
          <div style={{ ...nameStyle, fontSize: 40, clipPath: `inset(-10px ${((1 - open) * 100).toFixed(2)}% -10px 0)` }}>
            Spotted: a CampusAI hat
          </div>
        </Pill>
      </div>
    </div>
  );
};

/** The tag on screen at frame f during the footage, with its exit when the next one lands. */
const TagTrack: React.FC = () => {
  const f = useCurrentFrame();
  const leave = interpolate(f, [HAT.cut - 6, HAT.cut + 4], [0, 1], { ...clamp, easing: EASE });
  return (
    <>
      {TAGS.map((tag, i) => {
        const next = TAGS[i + 1]?.at ?? NO.at;
        if (f < (tag.hunt ?? tag.at) || f >= next + 8) return null;
        const out = interpolate(f, [next, next + 8], [0, 1], { ...clamp, easing: EASE });
        return (
          <div key={tag.text} style={{ position: "absolute", left: SLOT.x, top: SLOT.y, opacity: 1 - out,
            transform: `translateY(${(out * -24).toFixed(2)}px) scale(${(1 - out * 0.04).toFixed(4)})`, transformOrigin: "left center" }}>
            <TagPill tag={tag} t={f - tag.at} />
          </div>
        );
      })}
      {f >= NO.at && f < HAT.cut + 6 && (
        <div style={{ position: "absolute", left: SLOT.x, top: SLOT.y, opacity: 1 - leave, filter: leave > 0 ? `blur(${(leave * 8).toFixed(2)}px)` : undefined,
          transform: `translateY(${(leave * -30).toFixed(2)}px)` }}>
          <NoSpotPill t={f - NO.at} />
        </div>
      )}
    </>
  );
};

const frameAt = (t: number) => {
  let best = rec.frames[0];
  for (const fr of rec.frames) {
    if (fr.t <= t) best = fr;
    else break;
  }
  return best;
};

/** After the footage: the real chat, zoomed in on the box while it types, pulled back to the whole page for the answer. */
const Ask: React.FC = () => {
  const f = useCurrentFrame(); // relative to ASK_AT
  const enter = interpolate(f, [0, 12], [0, 1], { ...clamp, easing: EASE });
  const leave = interpolate(f, [ASK_LEN - 10, ASK_LEN], [0, 1], { ...clamp, easing: EASE });
  const fr = frameAt(REC_FROM + f / STUDY_FPS);
  const pull = interpolate(f, [SEND + 5, SEND + 30], [0, 1], { ...clamp, easing: EASE_CAMERA });
  const zoom = ZOOM + (1 - ZOOM) * pull;
  const ty = (BOX.typeCy - BOX.cy) * (1 - pull);
  return (
    <AbsoluteFill style={{ opacity: enter * (1 - leave), filter: leave > 0 ? `blur(${(leave * 10).toFixed(2)}px)` : undefined }}>
      <AbsoluteFill style={{ transform: `translateY(${ty.toFixed(2)}px) scale(${zoom.toFixed(4)})`, transformOrigin: `540px ${BOX.cy}px` }}>
        <Img src={staticFile(`study-spot/ai916/${fr.name}`)} style={{ width: STUDY_SIZE.width, height: STUDY_SIZE.height, maxWidth: "none" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: 1 - pull, background: `linear-gradient(to bottom, ${B.color.bgDeep} 0, ${B.color.bgDeep} 1130px, rgba(11,7,8,0) 1330px, rgba(11,7,8,0) 1560px, ${B.color.bgDeep} 1660px)` }} />
    </AbsoluteFill>
  );
};

export const StudySpotFilm: React.FC = () => {
  useBrandFonts(B);
  const f = useCurrentFrame();
  // the ground rises over her last interview frames and is fully up by her end card, which never shows
  const dark = interpolate(f, [SRC_END - 10, SRC_END], [0, 1], clamp);
  const logoOut = interpolate(f, [SRC_END - 10, SRC_END - 2], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: B.color.bgDeep }}>
      <Sequence durationInFrames={SRC_END}>
        <OffthreadVideo src={staticFile(SRC)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </Sequence>
      {/* the film ground: near-black with the red glow */}
      <AbsoluteFill style={{ opacity: dark, background: `radial-gradient(120% 70% at 50% 100%, ${glow(B, 0.32)} 0%, rgba(11,7,8,0) 60%), ${B.color.bgDeep}` }} />
      {/* the mark arrives with the hook and holds through the footage */}
      <div style={{ opacity: 1 - logoOut }}>
        <LogoOpen brand={B} at={6} x={STUDY_SIZE.width / 2} y={150} width={230} />
      </div>
      <TagTrack />
      <HatPin />
      <Sequence from={ASK_AT} durationInFrames={ASK_LEN}>
        <Ask />
      </Sequence>
      <LogoEnd brand={B} at={LOGO_AT} x={STUDY_SIZE.width / 2} y={900} width={560} />
      <Sequence from={LOGO_AT + 12}>
        <Address />
      </Sequence>

      {/* sound: Ashley's own audio rides on the video; a soft land on each pin, the no-spot gags */}
      {TAGS.map((tag) => (
        <Sequence key={tag.text} from={tag.at + 3} durationInFrames={30}>
          <Audio src={staticFile("sound/cues/land-ui-popup-dry.wav")} volume={0.3} />
        </Sequence>
      ))}
      {TAGS.flatMap((tag) => [
        tag.plusOne !== undefined && { at: tag.plusOne + 2, src: "sound/cues/notify-ui-message-pop.wav", vol: 0.3 },
        tag.sink !== undefined && { at: tag.sink, src: "sound/cues/move-swoosh-quick.wav", vol: 0.2 },
        tag.lock !== undefined && { at: tag.lock, src: "study-spot/switch-tap.mp3", vol: 0.35 },
        tag.hearts !== undefined && { at: tag.hearts, src: "sound/cues/notify-ui-message-pop.wav", vol: 0.22 },
      ]).filter((c): c is { at: number; src: string; vol: number } => Boolean(c)).map((c) => (
        <Sequence key={`${c.src}${c.at}`} from={c.at} durationInFrames={30}>
          <Audio src={staticFile(c.src)} volume={c.vol} />
        </Sequence>
      ))}
      <Sequence from={HAT.at + 3} durationInFrames={30}>
        <Audio src={staticFile("sound/cues/land-ui-popup-dry.wav")} volume={0.3} />
      </Sequence>
      <Sequence from={NO.giveUp + 4} durationInFrames={30}>
        <Audio src={staticFile("study-spot/switch-tap.mp3")} volume={0.4} />
      </Sequence>
      <Sequence from={NO.stamp} durationInFrames={40}>
        <Audio src={staticFile("study-spot/hit-blow.mp3")} volume={0.5} />
      </Sequence>
      {/* no music (Jacob, round 4); a light tap under the real typing, a click on the send */}
      {Array.from({ length: Math.ceil(Q_LEN / 3) }, (_, i) => (
        <Sequence key={`k${i}`} from={ASK_AT + TYPE_START + Math.round(((i * 3) / Q_LEN) * (SEND - TYPE_START))} durationInFrames={10}>
          <Audio src={staticFile("sound/cues/type-switch-tap.wav")} volume={0.12} />
        </Sequence>
      ))}
      <Sequence from={ASK_AT + SEND} durationInFrames={30}>
        <Audio src={staticFile("sound/cues/press-ui-select-click.wav")} volume={0.4} />
      </Sequence>
      <Sequence from={LOGO_AT} durationInFrames={60}>
        <Audio src={staticFile("sound/cues/logo-bass-hit-futuristic.wav")} volume={0.45} />
      </Sequence>
    </AbsoluteFill>
  );
};

const Address: React.FC = () => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, 14], [0, 1], { ...clamp, easing: EASE });
  return (
    <div style={{ position: "absolute", top: 1040, width: "100%", textAlign: "center", fontFamily: INTER, fontWeight: 500, fontSize: 46,
      color: B.color.inkSoft, opacity: p, transform: `translateY(${((1 - p) * 12).toFixed(2)}px)` }}>
      campusai.app
    </div>
  );
};
