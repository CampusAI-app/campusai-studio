/**
 * House edit (2026-11-18, ours, from @eightsenses.media's reel "ALL OF THIS, 4 speakers one skill",
 * instagram.com/reel/Df5QrYGkgiR, Muse Nov 18). Applies one `HouseLook` (houseLook.ts) to any talking-head clip, so a
 * series of clips from different people reads as one show. Everything on screen comes from the look; the clip only
 * brings its footage, its word timings and where things sit.
 *
 * What it draws, back to front:
 *   the clip, graded by the look (the same CSS filter on the clip and the cutout, so they stay one picture)
 *   the far half of the ring (optional, needs the cutout), the cutout, a vignette in the look's deep colour,
 *   the near half of the ring, with one bead travelling it, behind him on the far side and in front on the near side
 *   one frosted card that lands on a spoken keyword (frost = a blurred copy of the same graded footage clipped to the
 *     card, never `backdrop-filter`, so it renders headless), its keyword in the accent serif
 *   captions: a whole phrase held still (the Nov 7 premium round: real editors hold the phrase and swap it on a cut,
 *     sentence case or lowercase, small), each word lit from its own start, never ahead of the voice; unsaid words dim,
 *     the spoken word full ink, finished words a touch below; the keyword in the italic serif, in the accent colour
 *
 * Only words the speaker says reach the screen: captions and the card both read `words` (the clip's captions.json).
 *
 * Props: `look`, `clip` (path under public/, with sound), `person` (the cutout, alpha webm, same size; needed for the
 * ring), `size` (the clip's pixel size, default 1080x1920), `from` / `to` (seconds of the clip), `words` (the clip's
 * word timings, clip seconds), `phrases` (word index ranges held together; default: split on punctuation, 5 words max),
 * `accent` (word indices drawn in the serif; default the card's serif words), `frame` (`zoom` over cover-fit, `focus`
 * in clip px placed at `at`, a 0 to 1 point of the frame), `card` (`on` the word index it lands on, `words` its [first,
 * last] range, `serif` its big words, `x`/`y` top left and `w` in frame px, `tilt` degrees, `until` clip seconds),
 * `ring` (frame px ellipse, `at` clip seconds it arrives), `volume`, `sound`.
 *
 *   <HouseEdit look={houseLook("violet")} clip="founder/goal/clip.mp4" person="founder/goal/person.webm"
 *     from={0} to={6.6} words={words} card={{ on: 8, words: [8, 10], serif: [10], x: 560, y: 520, w: 440 }} />
 */
import React from "react";
import { AbsoluteFill, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadInstrument } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadNewsreader } from "@remotion/google-fonts/Newsreader";
import { IN, OUT, Sfx, k, mix } from "./shared";
import type { CaptionWord } from "./CommentDrop";
import type { HouseLook, HouseSans, HouseSerif } from "./houseLook";

/** The loaded family for each font a look can name. */
export const HOUSE_FAMILY: Record<HouseSans | HouseSerif, string> = {
  Geist: loadGeist("normal", { weights: ["500", "600"], subsets: ["latin"] }).fontFamily,
  "Plus Jakarta Sans": loadJakarta("normal", { weights: ["500", "600"], subsets: ["latin"] }).fontFamily,
  "Instrument Serif": loadInstrument("italic", { weights: ["400"], subsets: ["latin"] }).fontFamily,
  Newsreader: loadNewsreader("italic", { weights: ["400"], subsets: ["latin"] }).fontFamily,
};

export type HouseCard = {
  /** Index into `words` of the spoken keyword the card lands on. */
  on: number;
  /** [first, last] word indices shown on the card, inclusive. */
  words: [number, number];
  /** Word indices drawn big in the accent serif. */
  serif?: number[];
  x: number;
  y: number;
  w: number;
  tilt?: number;
  /** Clip seconds the card leaves (default: just before `to`). */
  until?: number;
};

export type HouseRing = { cx: number; cy: number; rx: number; ry: number; tilt?: number; at?: number };

export type HouseEditProps = {
  look: HouseLook;
  clip: string;
  person?: string;
  size?: { w: number; h: number };
  from: number;
  to: number;
  words: CaptionWord[];
  phrases?: [number, number][];
  accent?: number[];
  frame?: { zoom?: number; focus?: { x: number; y: number }; at?: { x: number; y: number } };
  card?: HouseCard;
  ring?: HouseRing;
  volume?: number;
  sound?: boolean;
  /** Draw at this size instead of the composition's (SpeakerFan sets it). */
  width?: number;
  height?: number;
};

export const houseEditFrames = (p: Pick<HouseEditProps, "from" | "to">, fps = 30) => Math.round((p.to - p.from) * fps);

/** Phrases held together: split after . , ? ! or a gap over 0.45 s, at most 5 words, only words inside from..to. */
export const housePhrases = (words: CaptionWord[], from: number, to: number): [number, number][] => {
  const out: [number, number][] = [];
  let a = -1;
  words.forEach((w, i) => {
    if (w.start < from - 0.05 || w.start >= to) return;
    if (a < 0) a = i;
    const next = words[i + 1];
    const end = /[.,?!]$/.test(w.w) || i - a >= 4 || !next || next.start >= to || next.start - w.end > 0.45;
    if (end) {
      out.push([a, i]);
      a = -1;
    }
  });
  return out;
};

/** One word as the look writes it: lowercase keeps acronyms and numbers, and drops a closing full stop. */
const cased = (w: string, look: HouseLook) => {
  if (look.caption.case !== "lower") return w;
  const bare = w.replace(/[^A-Za-z0-9]/g, "");
  const keep = bare.length > 1 && bare === bare.toUpperCase();
  return (keep ? w : w.toLowerCase()).replace(/\.$/, "");
};

export const HouseEdit: React.FC<HouseEditProps> = (p) => {
  const f = useCurrentFrame();
  const vc = useVideoConfig();
  const { fps } = vc;
  const W = p.width ?? vc.width;
  const H = p.height ?? vc.height;
  const L = p.look;
  const sans = HOUSE_FAMILY[L.caption.font];
  const serif = HOUSE_FAMILY[L.serif.font];
  const now = p.from + f / fps; // clip seconds
  const toF = (s: number) => (s - p.from) * fps; // clip seconds to this edit's frames
  const end = toF(p.to);

  // framing: cover-fit, then `zoom`, with `focus` (clip px) placed at `at`, clamped so no edge shows
  const cw = p.size?.w ?? 1080;
  const ch = p.size?.h ?? 1920;
  const s = Math.max(W / cw, H / ch) * (p.frame?.zoom ?? 1);
  const fo = p.frame?.focus ?? { x: cw / 2, y: ch / 2 };
  const at = p.frame?.at ?? { x: 0.5, y: 0.5 };
  const tx = Math.min(0, Math.max(W - cw * s, at.x * W - fo.x * s));
  const ty = Math.min(0, Math.max(H - ch * s, at.y * H - fo.y * s));
  const framed: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: cw, height: ch, transformOrigin: "0 0", transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${s.toFixed(5)})` };
  const trim = { trimBefore: Math.round(p.from * fps), trimAfter: Math.round(p.to * fps) };
  const footage = (blur = 0) => (
    <div style={framed}>
      <OffthreadVideo src={staticFile(p.clip)} {...trim} muted={blur > 0} volume={blur > 0 ? 0 : (p.volume ?? 1)}
        style={{ width: cw, height: ch, filter: blur > 0 ? `${L.grade.filter} blur(${(blur / s).toFixed(2)}px) brightness(1.08)` : L.grade.filter }} />
    </div>
  );

  // the ring: arrives out of a smaller, fainter ring, then one bead travels it for the rest of the clip
  const ring = p.ring && p.person ? p.ring : undefined;
  const ringAt = ring ? toF(ring.at ?? p.from + 0.2) : 0;
  const ringIn = k(f, ringAt, ringAt + 14, OUT);
  const ringOut = k(f, end - 8, end, IN);
  const ringPart = (front: boolean) => {
    if (!ring || ringIn <= 0) return null;
    const tilt = ((ring.tilt ?? 0) * Math.PI) / 180;
    const pt = (deg: number) => {
      const r = (deg * Math.PI) / 180;
      const ex = ring.rx * Math.cos(r);
      const ey = ring.ry * Math.sin(r);
      return { x: ring.cx + ex * Math.cos(tilt) - ey * Math.sin(tilt), y: ring.cy + ex * Math.sin(tilt) + ey * Math.cos(tilt), d: Math.sin(r) };
    };
    const a = pt(0);
    const b = pt(180);
    const d = `M ${a.x} ${a.y} A ${ring.rx} ${ring.ry} ${ring.tilt ?? 0} 0 ${front ? 1 : 0} ${b.x} ${b.y}`;
    const sc = mix(0.72, 1, ringIn);
    const bead = pt(-30 + (f - ringAt) * 2.4);
    const showBead = front ? bead.d >= 0 : bead.d < 0;
    const o = ringIn * (1 - ringOut) * (front ? 1 : 0.6);
    return (
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: o }}>
        <g transform={`translate(${ring.cx} ${ring.cy}) scale(${sc.toFixed(4)}) translate(${-ring.cx} ${-ring.cy})`}
          style={{ filter: `drop-shadow(0 0 10px ${L.ring}88)` }}>
          <path d={d} fill="none" stroke={L.ring} strokeWidth={5} strokeLinecap="round" />
          {showBead ? <circle cx={bead.x} cy={bead.y} r={11 + 3 * bead.d} fill={L.ring} /> : null}
        </g>
      </svg>
    );
  };

  // captions: phrases swap on a cut (3 frame fade out, 3 frame fade in), each word lit from its own start
  const phrases = p.phrases ?? housePhrases(p.words, p.from, p.to);
  const accent = new Set(p.accent ?? p.card?.serif ?? []);
  const shows = phrases.map(([a], i) => {
    const prevEnd = i > 0 ? p.words[phrases[i - 1][1]].end : p.from;
    return toF(Math.max(prevEnd, p.words[a].start - 0.3, p.from));
  });
  const capY = L.caption.y * H;
  const wordInk = (i: number) => {
    const w = p.words[i];
    const lit = k(now * fps, w.start * fps, w.start * fps + 3);
    const done = k(now * fps, w.end * fps + 4, w.end * fps + 10);
    return mix(0.42, 1, lit) - 0.12 * done;
  };
  const wordSpan = (i: number, j: number, n: number, sizePx: number, serifPx: number) => {
    const isSerif = accent.has(i);
    return (
      <span key={i} style={{ opacity: wordInk(i), color: isSerif ? L.palette.accent : L.palette.ink,
        fontFamily: isSerif ? serif : sans, fontStyle: isSerif ? "italic" : "normal", fontWeight: isSerif ? 400 : L.caption.weight,
        fontSize: isSerif ? serifPx : sizePx, letterSpacing: isSerif ? "-0.01em" : "-0.02em" }}>
        {cased(p.words[i].w, L)}
        {j < n - 1 ? " " : ""}
      </span>
    );
  };

  // the card: lands 2 frames before its keyword, out of a blur, with a spring; leaves blurring up
  const c = p.card;
  let card: React.ReactNode = null;
  if (c) {
    const land = toF(p.words[c.on].start) - 2;
    const leaveAt = toF(c.until ?? p.to - 0.2) - 6;
    const sp = spring({ frame: f - land, fps, config: { damping: 15, stiffness: 150, mass: 0.8 } });
    const inO = k(f, land, land + 6, OUT);
    const out = k(f, leaveAt, leaveAt + 6, IN);
    if (inO > 0 && out < 1) {
      const tilt = c.tilt ?? -3;
      const sc = mix(0.9, 1, sp) * mix(1, 0.96, out);
      const left = c.x;
      const top = c.y + 46 * (1 - sp) - 30 * out;
      const blur = (1 - inO) * 12 + out * 10;
      const serifSet = new Set(c.serif ?? []);
      const n = c.words[1] - c.words[0] + 1;
      card = (
        <div style={{ position: "absolute", left, top, width: c.w, transformOrigin: "0 0", transform: `rotate(${tilt}deg) scale(${sc.toFixed(4)})`,
          opacity: inO * (1 - out), filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined, borderRadius: L.card.radius,
          boxShadow: "0 30px 70px rgba(0,0,0,0.38), 0 6px 16px rgba(0,0,0,0.22)" }}>
          <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: L.card.radius }}>
            {/* the frost: the same footage, blurred, mapped back so the card shows what is behind it */}
            <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0",
              transform: `scale(${(1 / sc).toFixed(5)}) rotate(${-tilt}deg) translate(${-left}px, ${-top}px)` }}>
              {footage(L.card.blur)}
            </div>
            <div style={{ position: "absolute", inset: 0, background: L.card.veil }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 42%, rgba(255,255,255,0) 100%)" }} />
          </div>
          <div style={{ position: "absolute", inset: 0, borderRadius: L.card.radius, boxShadow: `inset 0 0 0 1.5px ${L.card.edge}` }} />
          <div style={{ position: "relative", padding: `${Math.round(L.card.size * 0.9)}px ${Math.round(L.card.size * 0.95)}px ${Math.round(L.card.size * 0.8)}px`,
            lineHeight: 1.04, textShadow: "0 2px 12px rgba(0,0,0,0.18)" }}>
            {Array.from({ length: n }, (_, j) => {
              const i = c.words[0] + j;
              const big = serifSet.has(i);
              const w = p.words[i];
              const lit = k(now * fps, w.start * fps, w.start * fps + 3);
              return (
                <span key={i} style={{ display: big ? "block" : "inline", opacity: mix(0.45, 1, lit),
                  color: big ? L.palette.accent : L.palette.ink, fontFamily: big ? serif : sans, fontStyle: big ? "italic" : "normal",
                  fontWeight: big ? 400 : 500, fontSize: big ? L.card.serifSize : L.card.size, letterSpacing: big ? "-0.02em" : "-0.02em",
                  marginTop: big && j > 0 ? 6 : 0 }}>
                  {cased(w.w, L).replace(/[.,]$/, "")}
                  {!big && j < n - 1 && !serifSet.has(i + 1) ? " " : ""}
                </span>
              );
            })}
          </div>
        </div>
      );
    }
  }

  const v = L.grade.vignette;
  return (
    <AbsoluteFill style={{ width: W, height: H, background: L.palette.deep, overflow: "hidden" }}>
      {footage()}
      {ringPart(false)}
      {ring && p.person ? (
        <div style={framed}>
          <OffthreadVideo src={staticFile(p.person)} {...trim} muted transparent style={{ width: cw, height: ch, filter: L.grade.filter }} />
        </div>
      ) : null}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 85% 70% at 50% 40%, ${L.palette.deep}00 55%, ${L.palette.deep}${Math.round(v * 255).toString(16).padStart(2, "0")} 100%)` }} />
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${L.palette.deep}00 62%, ${L.palette.deep}${Math.round(v * 0.85 * 255).toString(16).padStart(2, "0")} 100%)` }} />
      {ringPart(true)}
      {card}

      {phrases.map(([a, b], i) => {
        const show = shows[i];
        const hide = i < phrases.length - 1 ? shows[i + 1] : end;
        if (f < show || f >= hide) return null;
        const lin = (t: number) => t;
        const o = k(f, show, show + 3) * (i < phrases.length - 1 ? 1 - k(f, hide - 3, hide, lin) : 1 - k(f, end - 5, end));
        const n = b - a + 1;
        return (
          <div key={i} style={{ position: "absolute", left: W * 0.09, width: W * 0.82, top: capY, transform: "translateY(-50%)", textAlign: "center",
            opacity: o, lineHeight: 1.18, textShadow: "0 2px 16px rgba(0,0,0,0.45), 0 1px 3px rgba(0,0,0,0.3)" }}>
            {Array.from({ length: n }, (_, j) => wordSpan(a + j, j, n, L.caption.size, L.caption.size * L.serif.scale))}
          </div>
        );
      })}

      {c ? <Sfx at={toF(p.words[c.on].start) - 3} name="transition-soft" volume={0.22} on={p.sound ?? true} /> : null}
    </AbsoluteFill>
  );
};
