/**
 * Favorite study spot (2026-10-23), 9:16. Ashley's street interview, lifted.
 *
 * Her cut plays as is up to her end card (frame 1002 in her second cut). Over it, each answer lands as a place tag
 * under her burned-in question: a red pin drops when the place is said and the name opens out of
 * it. The student with no answer gets the fun one: the pin hunts around ("Searching"), gives up and
 * falls over ("No spot yet"), and when Ashley says "That's an answer too" a stamp lands on it:
 * "Still counts". At 1002 the footage goes dark and the question goes to CampusAI: the real full-page chat
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

// Ashley's second cut (2026-10-23): a cold open ("Nice hat" / "I got it from CampusAI"), then the same seven answers,
// reordered. Her end card starts at frame 1002 (33.4 s); everything after is ours.
const SRC = "study-spot/ashley-source-v2.mov";
const SRC_END = 1002;

type Icon = "pin" | "home" | "fallen";
type Tag = { at: number; text: string; icon: Icon; sub?: { at: number; text: string } };

const TAGS: Tag[] = [
  { at: 217, text: "Iribe rooftop", icon: "pin" },
  { at: 340, text: "Business School basement", icon: "pin" },
  { at: 433, text: "Public Policy Building", icon: "pin" },
  { at: 513, text: "Hillel", icon: "pin" },
  { at: 660, text: "Van Munching Hall", icon: "pin" },
  { at: 746, text: "Dorm room desk", icon: "home", sub: { at: 805, text: "Prince Frederick" } },
];

// The student with no spot, on his own words: "favorite" 30.78 s, "spot." ends 31.5 s, "That's an answer too" 32.26 s.
const NO = { at: 923, giveUp: 945, stamp: 968 };

// The question, popped up during her cold open (Jacob, round 5), so the hook is on screen while she asks about the hat.
// Drawn to match her own burned-in caption (Inter Bold, tight, two lines, the short red bar under it), fitted against her
// frame at 6.0 s to within 3 px on every line edge (`calibrate` draws it red to check), so when hers arrives at 4.75 s
// (frame 142) ours dissolves into it without a jump.
const QHOOK = { at: 4, handoff: 142, x: 66, top: 247, size: 69, lh: 72, track: "-0.075em", gap: "0.16em", bar: { x: 69, y: 414, w: 89, h: 5 } };

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
const HOME_PATHS = [
  "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8",
  "M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
];

const PinSvg: React.FC<{ icon: Icon; size: number; style?: React.CSSProperties }> = ({ icon, size, style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={{ position: "absolute", inset: 0, overflow: "visible", filter: `drop-shadow(0 4px 10px ${glow(B, 0.55)})`, ...style }}>
    {icon === "home" ? (
      HOME_PATHS.map((d) => <path key={d} d={d} fill="none" stroke={B.color.accent} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />)
    ) : (
      <>
        <path d={PIN_PATH} fill={B.color.accent} />
        <circle cx={12} cy={10} r={3.2} fill={B.color.bgDeep} />
      </>
    )}
  </svg>
);

/** The pin (or house) dropping onto the tag. `t` is frames since the tag's start. */
const Marker: React.FC<{ icon: Icon; t: number; size: number }> = ({ icon, t, size }) => {
  const { fps } = useVideoConfig();
  const drop = spring({ frame: t, fps, config: { damping: 11, stiffness: 160, mass: 0.6 } });
  const ring = interpolate(t, [5, 22], [0, 1], clamp);
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      {ring > 0 && ring < 1 && (
        <div style={{ position: "absolute", left: size / 2 - 22, top: size * 0.86 - 7, width: 44, height: 14, borderRadius: "50%",
          border: `2px solid ${glow(B, 0.9 * (1 - ring))}`, transform: `scale(${(0.4 + ring * 1.6).toFixed(3)})` }} />
      )}
      <PinSvg icon={icon} size={size} style={{ opacity: Math.min(1, drop * 2), transform: `translateY(${((1 - drop) * -70).toFixed(2)}px)` }} />
    </div>
  );
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

/** One place tag. `t` frames since it started. */
const TagPill: React.FC<{ tag: Tag; t: number }> = ({ tag, t }) => {
  const open = interpolate(t, [6, 18], [0, 1], { ...clamp, easing: EASE });
  const show = interpolate(t, [2, 12], [0, 1], { ...clamp, easing: EASE });
  const sub = tag.sub ? interpolate(t, [tag.sub.at - tag.at, tag.sub.at - tag.at + 12], [0, 1], { ...clamp, easing: EASE }) : 0;
  return (
    <Pill show={show} height={TAG_H + sub * 50}>
      <Marker icon={tag.icon} t={t} size={58} />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
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

/** The question over her cold open: pops in word by word, then hands off to her own caption underneath. */
const QuestionHook: React.FC<{ calibrate?: boolean }> = ({ calibrate }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!calibrate && f >= QHOOK.handoff + 8) return null;
  const out = calibrate ? 0 : interpolate(f, [QHOOK.handoff, QHOOK.handoff + 8], [0, 1], clamp);
  const lines = [["What's", "your", "favorite"], ["study", "spot", "on", "campus?"]];
  let n = 0;
  const bar = calibrate ? 1 : interpolate(f, [QHOOK.at + 14, QHOOK.at + 24], [0, 1], { ...clamp, easing: EASE });
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out }}>
      <div style={{ position: "absolute", left: QHOOK.x, top: QHOOK.top, fontFamily: INTER, fontWeight: 700, fontSize: QHOOK.size, lineHeight: `${QHOOK.lh}px`,
        letterSpacing: QHOOK.track, color: calibrate ? "rgba(255,0,0,0.55)" : "#fff", textShadow: "0 2px 10px rgba(0,0,0,0.35)", whiteSpace: "nowrap" }}>
        {lines.map((words, li) => (
          <div key={li}>
            {words.map((w) => {
              const p = calibrate ? 1 : spring({ frame: f - (QHOOK.at + n++ * 2), fps, config: { damping: 13, stiffness: 190, mass: 0.6 } });
              return (
                <span key={w} style={{ display: "inline-block", marginRight: QHOOK.gap, opacity: Math.min(1, p * 1.6),
                  transform: `translateY(${((1 - p) * 22).toFixed(2)}px) scale(${(0.86 + 0.14 * p).toFixed(4)})`, transformOrigin: "50% 80%",
                  filter: p < 0.99 ? `blur(${((1 - p) * 6).toFixed(2)}px)` : undefined }}>
                  {w}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: QHOOK.bar.x, top: QHOOK.bar.y, width: QHOOK.bar.w * bar, height: QHOOK.bar.h, borderRadius: 3,
        background: calibrate ? "rgba(0,255,0,0.7)" : B.color.accent }} />
    </div>
  );
};

/** The tag on screen at frame f during the footage, with its exit when the next one lands. */
const TagTrack: React.FC = () => {
  const f = useCurrentFrame();
  const leave = interpolate(f, [SRC_END - 8, SRC_END + 4], [0, 1], { ...clamp, easing: EASE });
  return (
    <>
      {TAGS.map((tag, i) => {
        const next = TAGS[i + 1]?.at ?? NO.at;
        if (f < tag.at || f >= next + 8) return null;
        const out = interpolate(f, [next, next + 8], [0, 1], { ...clamp, easing: EASE });
        return (
          <div key={tag.text} style={{ position: "absolute", left: SLOT.x, top: SLOT.y, opacity: 1 - out,
            transform: `translateY(${(out * -24).toFixed(2)}px) scale(${(1 - out * 0.04).toFixed(4)})`, transformOrigin: "left center" }}>
            <TagPill tag={tag} t={f - tag.at} />
          </div>
        );
      })}
      {f >= NO.at && f < SRC_END + 6 && (
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
      <QuestionHook />
      <TagTrack />
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
