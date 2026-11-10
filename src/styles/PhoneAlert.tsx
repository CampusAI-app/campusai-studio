/**
 * /phone-alert (2026-11-10, name from Shaan Johari's "Black Friday Styles Part 6, made with Claude Code" reel via Muse,
 * where it was called /low-battery; his prompts are DM-gated and were never seen, so this is our own build). A moody
 * product shot: an oxblood room, venetian-blind light falling in warm diagonal stripes that drift slowly, a stone plinth
 * with the product standing on it like an object, and an alert card that drops in from above with a bold title, one
 * line of body and two buttons split by a hairline. The right button lights as if pressed, a small pill pops in above
 * the card naming what the press really did, the card lifts away and the slab on the plinth turns round to show where
 * the press landed.
 *
 * The product on the plinth is two REAL captures (what the alert is about, then the page the button opens), never
 * rebuilt UI. The alert card itself is drawn: CampusAI sends no phone push today, so the card carries no phone, no app
 * icon and no system chrome, only the notification's own words.
 *
 * Motion in numbers (30 fps): the card falls from 420 px above on a spring (damping 13, stiffness 120) from frame 6 and
 * lands by about frame 20; it holds 1.4 to 1.8 s, the reading time of its words; the press lights the right button over 2 frames
 * and holds; 9 frames later (0.3 s, as in the reel) the pill pops on a spring (damping 10, stiffness 200); 8 frames
 * after that the card lifts 300 px and fades over 10 frames while the slab turns 180 degrees over 20 frames. The blind
 * stripes drift 1 px a frame the whole time; the camera pushes in 4% up to the turn, then 26% onto the opened page.
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, readFrames } from "../system/motion";
import { loadFont } from "@remotion/google-fonts/Onest";
import { B, Cue, clamp, ramp } from "./common";
import { World } from "./world";

const { fontFamily: ONEST } = loadFont("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });

// its own world: an oxblood room lit through blinds, a warm stone plinth, a frosted light card
const WALL = "#3A0B10";
const WALL_LIT = "#7A1E22";
const INK = "#FBE9E2";
const RED = "#D9202E";
const CARD_INK = "#1A1012";

type Shot = { src: string; w: number; h: number; crop: { x: number; y: number; w: number; h: number } };

export type PhoneAlertProps = {
  /** The alert's bold title: the notification's own headline. */
  title: string;
  /** One line of body under it. */
  body: string;
  /** The two buttons, left then right. The right one is pressed. */
  buttons: [string, string];
  /** The pill that pops in after the press: what the press really did. */
  pill: string;
  /** The product standing on the plinth: a real capture and the part of it to show. */
  product: Shot;
  /** What the press opens, on the back of the slab. Same crop aspect as `product`. */
  opens: Shot;
  source: string;
  cta?: string;
};

const DROP = 6;
const LAND = 16; // frames for the spring to settle, roughly

export const phoneAlertPlan = (p: PhoneAlertProps) => {
  // the card holds long enough to read (1.4 to 1.8 s), never a stall (review.md: no 3 s without change)
  const press = DROP + LAND + Math.max(42, Math.min(54, readFrames(`${p.title} ${p.body}`)));
  const pill = press + 9;
  const turn = pill + 14;
  // after the turn the camera pushes in on the opened page while the pill and source hold
  const end = turn + 20 + Math.max(60, Math.min(84, readFrames(p.pill)));
  return { press, pill, turn, end };
};
export const phoneAlertEnd = (p: PhoneAlertProps) => phoneAlertPlan(p).end;

const Face: React.FC<{ shot: Shot; w: number; h: number; back?: boolean }> = ({ shot, w, h, back }) => {
  const s = w / shot.crop.w;
  return (
    <div style={{ position: "absolute", inset: 0, borderRadius: 22, overflow: "hidden", backfaceVisibility: "hidden", background: "#120608",
      transform: back ? "rotateY(180deg)" : undefined, boxShadow: "0 0 0 10px #1B0A0C, 0 0 0 12px rgba(255,220,200,.10)" }}>
      <Img src={staticFile(shot.src)} style={{ position: "absolute", left: -shot.crop.x * s, top: -shot.crop.y * s, width: shot.w * s, height: shot.h * s }} />
      {/* the slab's own glass: a faint top sheen */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, rgba(255,240,230,.08), transparent 40%)" }} />
    </div>
  );
};

export const PhoneAlert: React.FC<PhoneAlertProps> = (p) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const { press, pill, turn, end } = phoneAlertPlan(p);

  // camera: a slow push in on the whole room
  const push = interpolate(f, [0, turn], [1, 1.04], clamp) + 0.26 * ramp(f, turn + 8, end, CURVE.quiet.standard);

  // the blinds: warm stripes at -32 degrees, drifting slowly, pooled where the light lands
  const drift = f * 1.0;

  // the slab on the plinth
  const slabW = 780;
  const slabH = slabW * (p.product.crop.h / p.product.crop.w);
  const plinthTop = 1240; // the scene keeps clear of the bottom 330 px the app covers
  const slabTop = plinthTop - slabH - 6;
  const angle = interpolate(f, [turn, turn + 20], [0, 180], { ...clamp, easing: CURVE.showy.standard });
  const edge = Math.abs(Math.cos((angle * Math.PI) / 180));

  // the alert card
  const drop = spring({ frame: f - DROP, fps, config: { damping: 13, stiffness: 120 } });
  const lift = ramp(f, turn, turn + 7, CURVE.quiet.exit);
  const cardY = 330 + (1 - drop) * -420 - lift * 60;
  const cardW = 800;
  const pressed = ramp(f, press, press + 2);
  const pillK = spring({ frame: f - pill, fps, config: { damping: 10, stiffness: 200 } });
  const pillOut = ramp(f, end - 10, end, CURVE.quiet.exit);
  // the card lifts away from under the pill, and the pill settles down onto the slab it now describes
  const pillY = interpolate(ramp(f, turn + 7, turn + 27, CURVE.quiet.standard), [0, 1], [226, 650]);

  const srcK = ramp(f, turn + 18, turn + 30, CURVE.quiet.enter);

  return (
    <World endAt={end} cta={p.cta} font={ONEST} fontWeight={700} ink={INK} logo="white" logoSpot="none" end="drop" endGround={WALL}
      ground={`radial-gradient(ellipse 80% 55% at 62% 40%, ${WALL_LIT} 0%, #5A1218 38%, ${WALL} 72%, #1E0507 100%)`}>
      <AbsoluteFill style={{ transform: `scale(${push.toFixed(4)})`, transformOrigin: "50% 1039px" }}>
        {/* the floor the plinth stands on */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 1550, bottom: 0, background: "linear-gradient(180deg, #2A0709, #140304)" }} />
        {/* blind light on the wall */}
        <AbsoluteFill style={{ background: `repeating-linear-gradient(-32deg, rgba(255,186,140,0) 0px, rgba(255,186,140,0) 46px, rgba(255,190,146,.30) 62px, rgba(255,196,150,.34) 104px, rgba(255,186,140,0) 120px)`,
          backgroundPosition: `${drift.toFixed(1)}px ${(drift * 0.62).toFixed(1)}px`, filter: "blur(5px)", mixBlendMode: "screen",
          WebkitMaskImage: "radial-gradient(ellipse 62% 46% at 60% 46%, #000 30%, transparent 78%)", maskImage: "radial-gradient(ellipse 62% 46% at 60% 46%, #000 30%, transparent 78%)" }} />

        {/* the stone plinth: a lit top face and a front face with grain */}
        <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <filter id="pa-stone"><feTurbulence type="fractalNoise" baseFrequency="0.9 0.35" numOctaves={3} seed={7} />
              <feColorMatrix type="matrix" values="0 0 0 0 0.12  0 0 0 0 0.05  0 0 0 0 0.05  0 0 0 0.35 0" /></filter>
            <linearGradient id="pa-front" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#4C2A27" /><stop offset="0.55" stopColor="#7C5048" /><stop offset="1" stopColor="#3A1D1B" />
            </linearGradient>
            <linearGradient id="pa-top" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#B08A7C" /><stop offset="1" stopColor="#8E6A5E" />
            </linearGradient>
          </defs>
          <ellipse cx={width / 2} cy={1562} rx={470} ry={34} fill="#000" opacity={0.45} />
          <polygon points={`${width / 2 - 400},${plinthTop + 40} ${width / 2 + 400},${plinthTop + 40} ${width / 2 + 360},${plinthTop} ${width / 2 - 360},${plinthTop}`} fill="url(#pa-top)" />
          <rect x={width / 2 - 400} y={plinthTop + 40} width={800} height={1550 - plinthTop - 40} fill="url(#pa-front)" />
          <rect x={width / 2 - 400} y={plinthTop} width={800} height={1550 - plinthTop} filter="url(#pa-stone)" />
          {/* the slab's contact shadow on the top face, narrowing as it turns edge-on */}
          <ellipse cx={width / 2} cy={plinthTop + 14} rx={(slabW / 2) * Math.max(0.12, edge)} ry={9} fill="#1A0708" opacity={0.6} />
        </svg>

        {/* the slab: what the alert is about, turning round to the page the press opened */}
        <div style={{ position: "absolute", left: (width - slabW) / 2, top: slabTop, width: slabW, height: slabH, perspective: 2400 }}>
          <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateY(${angle.toFixed(2)}deg)` }}>
            <Face shot={p.product} w={slabW} h={slabH} />
            <Face shot={p.opens} w={slabW} h={slabH} back />
          </div>
        </div>

        {/* the same blind light falls across the plinth and the product */}
        <AbsoluteFill style={{ background: `repeating-linear-gradient(-32deg, rgba(255,186,140,0) 0px, rgba(255,186,140,0) 46px, rgba(255,200,160,.10) 62px, rgba(255,200,160,.11) 104px, rgba(255,186,140,0) 120px)`,
          backgroundPosition: `${drift.toFixed(1)}px ${(drift * 0.62).toFixed(1)}px`, filter: "blur(4px)", mixBlendMode: "screen",
          WebkitMaskImage: `linear-gradient(180deg, transparent ${slabTop - 40}px, #000 ${slabTop}px, #000 1550px, transparent 1590px)`,
          maskImage: `linear-gradient(180deg, transparent ${slabTop - 40}px, #000 ${slabTop}px, #000 1550px, transparent 1590px)` }} />
      </AbsoluteFill>

      {/* the brand line at the top: the logo, small and centred */}
      <Img src={staticFile(B.logo!.onDark)} style={{ position: "absolute", left: width / 2 - 110, top: 110, width: 220, height: "auto", zIndex: 10,
        opacity: ramp(f, 4, 14, CURVE.quiet.enter) * (1 - ramp(f, end - 8, end)) }} />

      {/* the pill that names what the press did */}
      <div style={{ position: "absolute", left: 0, right: 0, top: pillY, display: "flex", justifyContent: "center", zIndex: 30,
        opacity: f < pill ? 0 : Math.min(1, pillK * 1.4) * (1 - pillOut), transform: `scale(${(0.6 + 0.4 * pillK).toFixed(3)})` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, background: RED, color: "#fff", borderRadius: 999, padding: "16px 32px 16px 22px",
          fontFamily: ONEST, fontWeight: 600, fontSize: 36, boxShadow: "0 14px 34px rgba(0,0,0,.35)" }}>
          <svg width={36} height={36} viewBox="0 0 36 36"><circle cx={18} cy={18} r={17} fill="rgba(255,255,255,.22)" />
            <path d="M10 18.5 L15.5 24 L26 12.5" stroke="#fff" strokeWidth={3.6} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          {p.pill}
        </div>
      </div>

      {/* the alert card */}
      <div style={{ position: "absolute", left: (width - cardW) / 2, top: cardY, width: cardW, borderRadius: 46, overflow: "hidden", zIndex: 20,
        background: "rgba(240,232,233,.72)", backdropFilter: "blur(28px) saturate(1.3)", WebkitBackdropFilter: "blur(28px) saturate(1.3)",
        boxShadow: "0 30px 80px rgba(20,2,4,.55), inset 0 1px 0 rgba(255,255,255,.7)", opacity: f < DROP ? 0 : 1 - lift,
        transform: `scale(${(1 - 0.05 * lift).toFixed(3)})` }}>
        <div style={{ padding: "44px 52px 38px", textAlign: "center", color: CARD_INK }}>
          <div style={{ fontFamily: ONEST, fontWeight: 700, fontSize: 46, lineHeight: 1.12, letterSpacing: "-0.01em" }}>{p.title}</div>
          <div style={{ fontFamily: ONEST, fontWeight: 400, fontSize: 34, lineHeight: 1.3, marginTop: 14, opacity: 0.82, textWrap: "balance" } as React.CSSProperties}>{p.body}</div>
        </div>
        <div style={{ height: 2, background: "rgba(40,20,24,.16)" }} />
        <div style={{ display: "flex", height: 104 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: ONEST, fontWeight: 500, fontSize: 38, color: "#6B5A5C" }}>{p.buttons[0]}</div>
          <div style={{ width: 2, background: "rgba(40,20,24,.16)" }} />
          <div style={{ flex: 1.4, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: ONEST, fontWeight: 700, fontSize: 38, color: RED,
            background: `rgba(150,30,40,${(0.26 * pressed).toFixed(3)})`, transform: `scale(${(1 - 0.03 * pressed * (1 - ramp(f, press + 3, press + 8))).toFixed(3)})` }}>{p.buttons[1]}</div>
        </div>
      </div>

      <div style={{ position: "absolute", left: 72, right: 72, top: 1530, textAlign: "center", fontFamily: ONEST, fontWeight: 500, fontSize: 32, color: INK, textShadow: "0 2px 10px rgba(20,2,4,.8)", opacity: 0.9 * srcK * (1 - ramp(f, end - 8, end)) }}>{p.source}</div>

      <Cue at={DROP} name="air-woosh-quick" volume={0.4} />
      <Cue at={DROP + 12} name="chime-crystal" volume={0.45} />
      <Cue at={press} name="switch-tap" volume={0.6} />
      <Cue at={pill} name="hit-weak" volume={0.5} />
      <Cue at={turn} name="paper-slide" volume={0.35} />
    </World>
  );
};
