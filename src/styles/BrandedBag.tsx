/**
 * /branded-bag (2026-11-10, name and look from Shaan Johari's "Black Friday Styles Part 6, made with Claude Code" reel
 * via Muse; his prompts are DM-gated and were never seen, so this is our own build). A product-shot studio on pink clay
 * handmade paper, fibres and flecks in it: a matte black shopping bag with rope handles floats in the middle, carrying the
 * real CampusAI logo file, and rocks like a pendulum from the top of its handles, easing at each end, while a soft contact
 * shadow below shrinks as it rises and spreads as it falls. A serif headline types on above it in two lines, the second
 * in italic, a word at a time. A hang tag on the right handle, swinging a beat behind the bag, carries a real product
 * capture: the bag steadies and the camera goes in to the tag until the capture reads, then back out. Last, a thin
 * rule-flanked date line fades in under the bag. For the ending the bag comes to rest and the camera pushes in on it, so
 * the end card's logo, line and address are printed on the bag's own black face, on the paper.
 *
 * Motion in numbers (30 fps): swing -15 to +10 degrees about the handle tops, a 2.6 s period, sine eased at the ends;
 * the bottom rises up to ~26 px at the ends of the swing plus a 14 px float, and the shadow narrows by up to ~45%. The
 * tag lags the bag by 0.2 s at 1.5x. Headline words 5 frames (0.17 s) apart, each revealed left to right in 4 frames with
 * an 18 px rise, 9 frames between the lines. The tag push: the swing damps over 16 frames, 24 frames in to 3.4x, 54 on
 * the tag, 24 back out. Date rules draw out from the middle in 10 frames. A 3% push over the whole scene; the end push
 * runs 34 frames to 1.7x about the bag's logo, which is where the end logo lands, then a 2.5 degree sway about that logo, the shadow breathing with it. Face: Cormorant Garamond.
 */
import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/CormorantGaramond";
import { CURVE, DUR, readHold } from "../system/motion";
import { B, Cue, clamp, ramp } from "./common";
import { World } from "./world";

const { fontFamily: CORMORANT } = loadFont("normal", { weights: ["500", "600", "700"], subsets: ["latin"] });
loadFont("italic", { weights: ["500", "600"], subsets: ["latin"] });

// the studio: pink clay handmade paper, an oxblood ink, a matte black bag
const CLAY = "#E8B1A3";
const CLAY_HI = "#F2C9BC";
const CLAY_LO = "#CF8E7F";
const INK = "#2A0D0E";
const OXBLOOD = "#86111B";
const CREAM = "#F6E9E4";

export type BrandedBagProps = {
  /** Two lines above the bag: the first upright, the second set in italic. */
  headline: [string, string];
  /** The rule-flanked line under the bag: a real dated moment, written out. */
  date: string;
  /** Optional small credit under the date line. The sample keeps it in facts.md instead. */
  source?: string;
  /** The hang tag: a real capture from public/ and the part of it to show (pixels of the file), about 1.4 wide to 1 tall. */
  tag: { src: string; w: number; h: number; crop: { x: number; y: number; w: number; h: number } };
  cta?: string;
};

const START = 2;
const WORD = 5;
const LINE_GAP = 9;
const PERIOD = 2.6;
const PIVOT = { x: 350, y: 150 }; // in the bag's own drawing, the top of the handles
const L = 770; // pivot to the bag's bottom edge
const SCREEN_PIVOT = { x: 480, y: 660 }; // a little left of centre, so the tag on the right has room
const LOGO_W = 330;
const LOGO_C = { x: 350, y: 610 };
const PUSH = 34;
const TAG = { x: 560, y: 240, w: 300, h: 250, hang: { x: 422, y: 196 } }; // in the bag's drawing, off the right edge so a push to it leaves the logo out
const TAG_IMG = { x: 14, y: 46, w: 272 }; // inside the tag
const TAG_K = 3.4;
const TAG_IN = 24;
const ON_TAG = 54;

const words = (p: BrandedBagProps) => [p.headline[0].split(" "), p.headline[1].split(" ")];
export const bagPlan = (p: BrandedBagProps) => {
  const [a, b] = words(p);
  const line2 = START + a.length * WORD + LINE_GAP;
  const typed = line2 + (b.length - 1) * WORD + 4;
  const tagAt = Math.max(typed + 20, 48);
  const back = tagAt + TAG_IN + ON_TAG + TAG_IN;
  const dateAt = back;
  const end = dateAt + Math.round((readHold(p.date) + 0.4) * 30);
  return { line2, tagAt, back, dateAt, end };
};
export const bagEnd = (p: BrandedBagProps) => bagPlan(p).end;

const hash = (n: number) => { const s = Math.sin(n * 91.7 + 3.1) * 43758.5453; return s - Math.floor(s); };

/** Fibres and flecks in the paper, fixed, the way handmade paper has them. */
const Paper: React.FC = () => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    <filter id="clayGrain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={11} /><feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.2  0 0 0 0 0.18  0 0 0 0.55 0" /></filter>
    <rect width={1080} height={1920} filter="url(#clayGrain)" opacity={0.35} />
    {Array.from({ length: 180 }, (_, i) => {
      const x = hash(i) * 1080;
      const y = hash(i + 400) * 1920;
      const len = 6 + hash(i + 800) * 22;
      const a = hash(i + 1200) * Math.PI * 2;
      const bend = (hash(i + 1600) - 0.5) * 10;
      const dark = hash(i + 2000) > 0.45;
      const x2 = x + Math.cos(a) * len;
      const y2 = y + Math.sin(a) * len;
      return <path key={i} d={`M${x},${y} Q${(x + x2) / 2 + bend},${(y + y2) / 2 - bend} ${x2},${y2}`} stroke={dark ? "#A9675A" : "#FBE3DA"} strokeWidth={dark ? 1.4 : 1.8}
        strokeOpacity={dark ? 0.45 : 0.6} fill="none" strokeLinecap="round" />;
    })}
    {Array.from({ length: 60 }, (_, i) => (
      <circle key={`k${i}`} cx={hash(i + 3000) * 1080} cy={hash(i + 3400) * 1920} r={1 + hash(i + 3800) * 2} fill={hash(i + 4200) > 0.5 ? "#9C5A4E" : "#FFF0EA"} opacity={0.5} />
    ))}
  </svg>
);

const Bag: React.FC<{ sheen: number; logo: number }> = ({ sheen, logo }) => {
  const logoH = LOGO_W / B.logo!.ratio;
  return (
    <svg width={700} height={1000} viewBox="0 0 700 1000" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        <linearGradient id="bagFront" x1="0" y1="0" x2="1" y2="0.2"><stop offset="0" stopColor="#2A2526" /><stop offset="0.45" stopColor="#151213" /><stop offset="1" stopColor="#0A0909" /></linearGradient>
        <linearGradient id="bagShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" stopOpacity={0} /><stop offset="0.75" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.35} /></linearGradient>
        <linearGradient id="bagSheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity={0.09 * sheen} /><stop offset="0.4" stopColor="#fff" stopOpacity={0} /></linearGradient>
        <filter id="matte"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves={1} seed={5} /><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.06 0" /></filter>
        <clipPath id="bagFace"><rect x={100} y={290} width={500} height={630} /></clipPath>
      </defs>
      {/* back handle, seen through the opening */}
      <path d="M292,296 C292,92 452,92 452,296" stroke="#1B1819" strokeWidth={14} fill="none" strokeLinecap="round" />
      {/* back panel's top edge and the dark inside */}
      <polygon points="108,282 612,274 612,300 108,300" fill="#050404" />
      {/* the side gusset, folded in with a crease */}
      <polygon points="600,290 642,278 642,902 600,920" fill="#090808" />
      <line x1={621} y1={284} x2={621} y2={640} stroke="#1E1B1C" strokeWidth={2} />
      <polygon points="600,640 621,640 642,902 600,920" fill="#060505" />
      {/* the front face */}
      <rect x={100} y={290} width={500} height={630} fill="url(#bagFront)" />
      <g clipPath="url(#bagFace)">
        <rect x={100} y={290} width={500} height={630} filter="url(#matte)" />
        <rect x={100} y={290} width={500} height={630} fill="url(#bagShade)" />
        <rect x={100} y={290} width={500} height={630} fill="url(#bagSheen)" />
        <path d="M100,860 L170,920 M600,860 L530,920" stroke="#262122" strokeWidth={2} />
      </g>
      <rect x={100} y={290} width={500} height={30} fill="#1C191A" />
      <line x1={100} y1={320} x2={600} y2={320} stroke="#2E2829" strokeWidth={2} />
      <image href={staticFile(B.logo!.onDark)} x={LOGO_C.x - LOGO_W / 2} y={LOGO_C.y - logoH / 2} width={LOGO_W} height={logoH} opacity={logo} />
      {/* grommets and the front rope handle */}
      {[270, 430].map((x) => <circle key={x} cx={x} cy={334} r={11} fill="#080707" stroke="#3A3435" strokeWidth={3} />)}
      <path d="M270,334 C270,108 430,108 430,334" stroke="#141112" strokeWidth={15} fill="none" strokeLinecap="round" />
      <path d="M270,334 C270,108 430,108 430,334" stroke="#2E292A" strokeWidth={15} fill="none" strokeDasharray="5 7" opacity={0.6} />
      <path d="M266,330 C266,112 426,112 426,330" stroke="#5A5253" strokeWidth={2.5} fill="none" opacity={0.55} />
    </svg>
  );
};

const Word: React.FC<{ at: number; italic?: boolean; children: string }> = ({ at, italic, children }) => {
  const f = useCurrentFrame();
  const k = ramp(f, at, at + 4, CURVE.quiet.enter);
  return (
    <span style={{ display: "inline-block", clipPath: `inset(-20% ${((1 - k) * 100).toFixed(1)}% -20% -10%)`, transform: `translateY(${((1 - k) * 18).toFixed(1)}px)`,
      fontStyle: italic ? "italic" : "normal", marginRight: "0.22em" }}>{children}</span>
  );
};

/** The hang tag: card stock with a hole, a red string to the handle, and the real capture printed on it. */
const Tag: React.FC<{ tag: BrandedBagProps["tag"]; rot: number }> = ({ tag, rot }) => {
  const k = TAG_IMG.w / tag.crop.w;
  const ih = tag.crop.h * k;
  const hole = { x: TAG.x + TAG.w / 2, y: TAG.y + 22 };
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 700, height: 1000, transformOrigin: `${TAG.hang.x}px ${TAG.hang.y}px`, transform: `rotate(${rot.toFixed(3)}deg)` }}>
      <svg width={700} height={1000} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <path d={`M${TAG.hang.x},${TAG.hang.y} Q${(TAG.hang.x + hole.x) / 2 + 6},${(TAG.hang.y + hole.y) / 2 + 10} ${hole.x},${hole.y}`} stroke="#B3141E" strokeWidth={3} fill="none" />
      </svg>
      <div style={{ position: "absolute", left: TAG.x, top: TAG.y, width: TAG.w, height: TAG.h, background: "#F8EEE8", borderRadius: 10,
        clipPath: "polygon(12% 0, 88% 0, 100% 10%, 100% 100%, 0 100%, 0 10%)", boxShadow: "0 10px 22px rgba(60,14,14,.35)" }}>
        <div style={{ position: "absolute", left: TAG.w / 2 - 9, top: 13, width: 18, height: 18, borderRadius: 9, background: "#2A0D0E", opacity: 0.85 }} />
        <div style={{ position: "absolute", left: TAG_IMG.x, top: TAG_IMG.y, width: TAG_IMG.w, height: ih, overflow: "hidden", borderRadius: 6 }}>
          <Img src={staticFile(tag.src)} style={{ position: "absolute", left: -tag.crop.x * k, top: -tag.crop.y * k, width: tag.w * k, height: tag.h * k, maxWidth: "none" }} />
        </div>
      </div>
    </div>
  );
};

export const BrandedBag: React.FC<BrandedBagProps> = (p) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { line2, tagAt, back, dateAt, end } = bagPlan(p);
  const [a, b] = words(p);
  // the end push lands as the world's logo does
  const pushAt = end + DUR.arrive - PUSH;
  const z = ramp(f, pushAt, end + DUR.arrive, CURVE.showy.standard);
  // the bag steadies for the tag push and for the end
  const still = ramp(f, tagAt - 12, tagAt + 4, CURVE.quiet.standard) * (1 - ramp(f, back - 6, back + 14, CURVE.quiet.standard));
  const amp = (1 - still) * (1 - ramp(f, pushAt - 10, pushAt + 12, CURVE.quiet.standard));
  const swing = (tt: number) => -2.5 + 12.5 * Math.sin((2 * Math.PI * tt) / PERIOD + 0.6);
  const t = f / fps;
  // under the end card the bag keeps a small sway about its own logo, so the printed logo stays put and the bag still hangs
  const settle = 2.5 * Math.sin((2 * Math.PI * t) / PERIOD) * ramp(f, end, end + 24, CURVE.quiet.standard);
  const theta = swing(t) * amp;
  const rad = (theta * Math.PI) / 180;
  const tagRot = (swing(t - 0.2) - swing(t)) * 1.5 * amp;
  const float = 14 * Math.sin((2 * Math.PI * t) / (PERIOD * 2) + 1.1) * amp;
  const rise = L * (1 - Math.cos(rad)) + float + 14;
  const bottomX = SCREEN_PIVOT.x - L * Math.sin(rad);
  const shadowK = Math.max(0.5, 1 - rise / 75 - Math.abs(settle) * 0.06);
  const push = interpolate(f, [0, end], [1, 1.03], clamp);
  const K = 1 + z * (561.6 / LOGO_W / push - 1);
  const logoY = SCREEN_PIVOT.y + (LOGO_C.y - PIVOT.y) - float;
  const textOut = 1 - ramp(f, pushAt, pushAt + 12, CURVE.quiet.exit);
  const rules = ramp(f, dateAt, dateAt + 10, CURVE.quiet.enter);
  const date = ramp(f, dateAt + 4, dateAt + 16, CURVE.quiet.enter);
  // the tag push, about the capture's centre on the tag (the bag is at rest by then)
  const tk = ramp(f, tagAt, tagAt + TAG_IN, CURVE.showy.standard) * (1 - ramp(f, back - TAG_IN, back, CURVE.showy.standard));
  const tagC = { x: SCREEN_PIVOT.x - PIVOT.x + TAG.x + TAG_IMG.x + TAG_IMG.w / 2, y: SCREEN_PIVOT.y - PIVOT.y + TAG.y + TAG_IMG.y + (p.tag.crop.h * TAG_IMG.w) / p.tag.crop.w / 2 - float };
  return (
    <World endAt={end} cta={p.cta} font={CORMORANT} fontWeight={600} ink={CREAM} logo="white" logoSpot="none" end="iris" endGround="transparent"
      ground={`radial-gradient(ellipse 70% 55% at 50% 45%, ${CLAY_HI}, ${CLAY} 60%, ${CLAY_LO} 120%)`}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${tagC.x.toFixed(1)}px ${tagC.y.toFixed(1)}px`,
        transform: `translate(${((540 - tagC.x) * tk).toFixed(1)}px, ${((900 - tagC.y) * tk).toFixed(1)}px) scale(${(1 + (TAG_K - 1) * tk).toFixed(4)})` }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${push})`, transformOrigin: "50% 50%" }}>
        <Paper />
        {/* contact shadow on the paper */}
        <div style={{ position: "absolute", left: bottomX - 250 * shadowK, top: 1548, width: 500 * shadowK, height: 54, borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(70,18,16,.6), rgba(70,18,16,0) 70%)", filter: "blur(6px)", opacity: (0.25 + 0.75 * shadowK) * (1 - 0.4 * z) }} />
        <div style={{ position: "absolute", left: 64, right: 64, top: 170, textAlign: "center", fontFamily: CORMORANT, color: INK, opacity: textOut }}>
          <div style={{ fontWeight: 600, fontSize: 196, lineHeight: 0.95, letterSpacing: "-0.015em" }}>
            {a.map((w, i) => <Word key={i} at={START + i * WORD}>{w}</Word>)}
          </div>
          <div style={{ fontWeight: 500, fontSize: 168, lineHeight: 1.0, color: OXBLOOD, letterSpacing: "-0.01em" }}>
            {b.map((w, i) => <Word key={i} at={line2 + i * WORD} italic>{w}</Word>)}
          </div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 1650, display: "flex", alignItems: "center", justifyContent: "center", gap: 28, opacity: textOut }}>
          <div style={{ width: 120 * rules, height: 2, background: INK, opacity: 0.7 }} />
          <div style={{ fontFamily: CORMORANT, fontWeight: 600, fontSize: 50, color: INK, opacity: date, whiteSpace: "nowrap" }}>{p.date}</div>
          <div style={{ width: 120 * rules, height: 2, background: INK, opacity: 0.7 }} />
        </div>
        {p.source ? <div style={{ position: "absolute", left: 64, right: 64, top: 1730, textAlign: "center", fontFamily: CORMORANT, fontStyle: "italic", fontWeight: 500, fontSize: 34,
          color: INK, opacity: 0.75 * date * textOut }}>{p.source}</div> : null}
        {/* the bag, hung from the top of its handles; the end push scales it about its own logo and brings that to the centre */}
        <div style={{ position: "absolute", inset: 0, transformOrigin: `${SCREEN_PIVOT.x}px ${logoY}px`, transform: `translate(${((540 - SCREEN_PIVOT.x) * z).toFixed(1)}px, ${((960 - logoY) * z).toFixed(1)}px) scale(${K.toFixed(4)}) rotate(${settle.toFixed(3)}deg)` }}>
          <div style={{ position: "absolute", left: SCREEN_PIVOT.x - PIVOT.x, top: SCREEN_PIVOT.y - PIVOT.y - float, width: 700, height: 1000,
            transformOrigin: `${PIVOT.x}px ${PIVOT.y}px`, transform: `rotate(${theta.toFixed(3)}deg)` }}>
            {/* the bag's own logo hands over to the end logo at the same place and size */}
            <Bag sheen={0.6 + 0.4 * Math.sin(rad * 6)} logo={1 - ramp(f, end + DUR.arrive, end + DUR.arrive + 4)} />
            <div style={{ opacity: 1 - ramp(f, pushAt, pushAt + 8) }}><Tag tag={p.tag} rot={tagRot} /></div>
          </div>
        </div>
      </div>
      </div>
      {[...a, ...b].map((_, i) => <Cue key={i} at={i < a.length ? START + i * WORD : line2 + (i - a.length) * WORD} name="typewriter-hit-soft" volume={0.25} />)}
      <Cue at={tagAt} name="swoosh-slow" volume={0.3} />
      <Cue at={back - TAG_IN} name="swoosh-slow" volume={0.25} />
      <Cue at={dateAt} name="paper-slide" volume={0.35} />
      <Cue at={pushAt} name="swoosh-slow" volume={0.4} />
    </World>
  );
};
