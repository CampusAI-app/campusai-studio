/**
 * CampusAI, "Fall semester bingo" (2026-10-21). 9:16, 30fps, about 16.6s, music and sound.
 *
 * Jacob's brief: more fun and interactive, less about our products, from a college student's
 * point of view. He picked bingo. The viewer counts their own squares while the film stamps its
 * way across the card, and the ending asks for their number in the comments. The product is one
 * square: 6 says you found out the exam moved last, 16 flips over on the music's peak to say you
 * knew before anyone else, and that one is CampusAI's. Squares, the product amount (one square)
 * and the 4x4 grid were Lucius's picks, open for Jacob's notes.
 *
 * Shelf shots, none shared with the flock film (his rule: films in a batch never share a move):
 * lead-word-zoom-assemble (title), deck-deal-flyin (the card deals in), cursor-flyover's camera
 * hops with riso-print-hits stamps (misregistered colour snapping into place), card-flip-reveal
 * (square 16), glass-pill-dictation-typing (the comment box).
 *
 * Music: Mixkit "Tonight" (Michael Ramir C., Mixkit Stock Music Free License), 105.00 BPM,
 * t0 0.907s, T 0.5714s, median grid error 3ms. Its kick builds from music beat 34 and peaks on
 * beat 40; the film starts on music beat 20, so the peak lands on film beat 20, the flip.
 */
import React, { useId } from "react";
import { AbsoluteFill, Img, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { INTER, SPARK, useZodiak } from "../kit/parts";
import { EASE, Grain, Vignette, mix, ramp } from "../shots/_fixtures/Polish";
import { LUCIDE } from "../flock/icons";

export const BINGO_FPS = 30;
export const BINGO_SIZE = { width: 1080, height: 1920 };
const FPS = BINGO_FPS;

/* ---------- beat grid ---------- */
const T0 = 0.907;
const T = 0.5714;
const START_BEAT = 20;
const MUSIC_TRIM = Math.round((T0 + START_BEAT * T) * FPS);
const OFFSET_S = T0 + START_BEAT * T - MUSIC_TRIM / FPS;
const B = (n: number) => (OFFSET_S + n * T) * FPS;
export const BINGO_FRAMES = Math.round(B(29));

const RED = "#D9202E";
const CX = 540;

/* ---------- the card ---------- */
const SQUARES: { text: string; icon: string }[] = [
  { text: "Took the 8am. Regretted it by week 2.", icon: "clock" },
  { text: "“Wait, is this due tonight?”", icon: "file-text" },
  { text: "Group chat at 2am, 147 unread", icon: "message-circle" },
  { text: "Went for the free pizza. It was gone.", icon: "map-pin" },
  { text: "Wi-Fi died mid-quiz", icon: "laptop" },
  { text: "Professor moved the exam. You found out last.", icon: "calendar" },
  { text: "Opened six apps to find one deadline", icon: "bell" },
  { text: "“I’ll start Monday” (three Mondays ago)", icon: "notebook-pen" },
  { text: "Group project where one person did everything", icon: "users" },
  { text: "Career fair in a borrowed blazer", icon: "briefcase" },
  { text: "Library at 1am, not one open seat", icon: "book-open" },
  { text: "Same dining hall order four days straight", icon: "utensils" },
  { text: "Joined five clubs at the fair, went to one", icon: "star" },
  { text: "Forgot the coffee chat you booked", icon: "coffee" },
  { text: "Submitted at 11:59 and 30 seconds", icon: "target" },
  { text: "Knew the exam moved before anyone else", icon: "graduation-cap" },
];
// grid slot of each square (0-15, row-major); 16 sits in row 3, col 3
const SLOT = [0, 6, 13, 3, 9, 4, 15, 1, 12, 7, 2, 14, 5, 11, 8, 10];
const TILE = 235;
const GAP = 10;
const PAD = 15;
const CARD_W = PAD * 2 + TILE * 4 + GAP * 3; // 1000
const CARD_Y = 560;
const slotXY = (s: number) => ({ x: CX - CARD_W / 2 + PAD + (s % 4) * (TILE + GAP), y: CARD_Y + PAD + Math.floor(s / 4) * (TILE + GAP) });
const CARD_C = { x: CX, y: CARD_Y + CARD_W / 2 };

/* ---------- timeline, in beats ---------- */
const DEAL = B(2.6);
const STAMP_BEATS = [5, 7, 8.5, 10, 11, 12, 13, 14, 14.5, 15, 15.5, 16, 16.5, 17, 17.5];
const STAMP_AT = STAMP_BEATS.map(B);
const FLIP_AT = B(20);
const LINE_AT = B(21.4);
const END_AT = B(23.5);
const TYPE_AT = B(25);

const rand = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/* camera: hop to each square before its stamp, close at first, pulling back as the build speeds up */
const zoomFor = (k: number) => (k < 4 ? 2.05 : k < 8 ? 1.55 : k < 10 ? 1.2 : 1);
const camAt = (f: number) => {
  let x = CARD_C.x, y = CARD_C.y, z = 1;
  const keys: { at: number; x: number; y: number; z: number }[] = [{ at: B(4), x: CARD_C.x, y: CARD_C.y, z: 1 }];
  STAMP_AT.forEach((at, k) => {
    const s = slotXY(SLOT[k]);
    const zk = zoomFor(k);
    // aim at the square, but keep the card filling the frame (no empty dark band past its edge)
    const clamp = (v: number, lo: number, hi: number) => (lo > hi ? lo : Math.max(lo, Math.min(hi, v))); // lo wins: the clear top strip beats filling the bottom
    const tx = zk === 1 ? CARD_C.x : clamp(s.x + TILE / 2, CX - CARD_W / 2 + 540 / zk, CX + CARD_W / 2 - 540 / zk);
    const ty = zk === 1 ? CARD_C.y : clamp(s.y + TILE / 2, CARD_Y + 760 / zk, CARD_Y + CARD_W - 920 / zk); // top 240px stays clear for the counter
    keys.push({ at: at - 5, x: tx, y: ty, z: zk });
  });
  keys.push({ at: B(18.4), x: CARD_C.x, y: CARD_C.y, z: 1 });
  const s16 = slotXY(SLOT[15]);
  keys.push({ at: FLIP_AT + 14, x: s16.x + TILE / 2, y: s16.y + TILE / 2 + 60, z: 1.9 });
  keys.push({ at: END_AT, x: s16.x + TILE / 2, y: s16.y + TILE / 2 + 60, z: 1.9 });
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (f >= a.at && f < b.at) {
      const dur = Math.min(8, b.at - a.at);
      const p = ramp(f, b.at - dur, dur, EASE.smooth);
      return { x: mix(a.x, b.x, p), y: mix(a.y, b.y, p), z: mix(a.z, b.z, p) };
    }
  }
  if (f >= keys[keys.length - 1].at) { const l = keys[keys.length - 1]; x = l.x; y = l.y; z = l.z; }
  return { x, y, z };
};

const Glyph: React.FC<{ name: string; color: string; size: number }> = ({ name, color, size }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: "block", color, flex: "none" }} dangerouslySetInnerHTML={{ __html: LUCIDE[name] }} />
);

/* ---------- a dauber stamp (riso-print-hits: two misregistered passes snap into register) ---------- */
const Stamp: React.FC<{ t: number; seed: number }> = ({ t, seed }) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  if (t < 0) return null;
  const k = ramp(t, 0, 5, EASE.snappy);
  const s = mix(1.5, 1, k);
  const off = (1 - ramp(t, 0, 6, EASE.out)) * 14;
  const rot = (rand(seed) - 0.5) * 24;
  const R = 92;
  const ink = (color: string, dx: number, dy: number, op: number) => (
    <g transform={`translate(${dx} ${dy})`} opacity={op}>
      <circle cx={0} cy={0} r={R} fill={color} fillOpacity={0.34} filter={`url(#rough-${uid})`} />
      <circle cx={0} cy={0} r={R - 6} fill="none" stroke={color} strokeWidth={11} filter={`url(#rough-${uid})`} />
    </g>
  );
  return (
    <svg width={TILE} height={TILE} viewBox={`${-TILE / 2} ${-TILE / 2} ${TILE} ${TILE}`}
      style={{ position: "absolute", inset: 0, overflow: "visible", transform: `scale(${s.toFixed(3)}) rotate(${rot.toFixed(1)}deg)`, opacity: Math.min(1, t / 2 + 0.4) }}>
      <defs>
        <filter id={`rough-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves={2} seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={7} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      {off > 0.5 && ink("#ff7a6e", -off, off * 0.6, 0.7)}
      {off > 0.5 && ink("#8e0f1c", off, -off * 0.5, 0.7)}
      {ink(RED, 0, 0, 1)}
    </svg>
  );
};

const Square: React.FC<{ i: number; f: number }> = ({ i, f }) => {
  const sq = SQUARES[i];
  const stampT = i < 15 ? f - STAMP_AT[i] : -1;
  const press = stampT >= 0 ? 1 - 0.05 * Math.sin(Math.min(1, stampT / 5) * Math.PI) : 1;
  const isLast = i === 15;
  const flip = isLast ? ramp(f, FLIP_AT, 9, EASE.smooth) : 0;
  const pulse = isLast && f > B(18) && f < FLIP_AT ? 0.5 + 0.5 * Math.sin((f - B(18)) / 3) : 0;
  const face = (back: boolean): React.CSSProperties => ({
    position: "absolute", inset: 0, borderRadius: 20, backfaceVisibility: "hidden", padding: 20, boxSizing: "border-box",
    display: "flex", flexDirection: "column", gap: 14, overflow: "hidden", transform: back ? "rotateY(180deg)" : undefined,
  });
  const lastLit = isLast ? ramp(f, FLIP_AT + 4, 8, EASE.out) : 0;
  return (
    <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `scale(${press.toFixed(4)}) rotateY(${(flip * 180).toFixed(2)}deg)` }}>
      <div style={{ ...face(false), background: "linear-gradient(180deg, #1f1618 0%, #170f11 100%)",
        boxShadow: `inset 0 0 0 1.5px rgba(255,190,190,${isLast ? 0.2 + 0.3 * pulse : 0.08})` }}>
        {stampT >= 0 && <Stamp t={stampT} seed={i * 7 + 3} />}
        {isLast ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Zodiak", fontWeight: 700, fontSize: 110,
            color: `rgba(255,90,100,${0.55 + 0.4 * pulse})` }}>?</div>
        ) : (
          <>
            <div style={{ position: "relative" }}><Glyph name={sq.icon} color={stampT >= 0 ? "#ffb3b3" : "#9c7f82"} size={34} /></div>
            <div style={{ position: "relative", fontFamily: INTER, fontWeight: 600, fontSize: 25, lineHeight: 1.22, color: "#fff", letterSpacing: "-0.01em",
              textShadow: stampT >= 0 ? "0 1px 6px rgba(40,0,6,0.8)" : undefined }}>{sq.text}</div>
          </>
        )}
      </div>
      {isLast && (
        <div style={{ ...face(true), background: "linear-gradient(160deg, #ff4a54 0%, #D9202E 55%, #a3121f 100%)",
          boxShadow: `0 0 ${(60 * lastLit).toFixed(1)}px rgba(217,32,46,${(0.8 * lastLit).toFixed(3)}), inset 0 1px 0 rgba(255,255,255,0.35)` }}>
          <svg viewBox="0 0 24 24" width={34} height={34}><path d={SPARK} fill="#fff" /></svg>
          <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 25, lineHeight: 1.22, color: "#fff", letterSpacing: "-0.01em" }}>{sq.text}</div>
        </div>
      )}
    </div>
  );
};

const Card: React.FC<{ f: number }> = ({ f }) => {
  const panel = ramp(f, DEAL - 4, 10, EASE.out);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: CX - CARD_W / 2, top: CARD_Y, width: CARD_W, height: CARD_W, borderRadius: 30, opacity: panel,
        background: "linear-gradient(180deg, rgba(40,22,26,0.9) 0%, rgba(22,12,15,0.9) 100%)",
        boxShadow: "inset 0 0 0 1.5px rgba(255,140,140,0.14), 0 0 120px rgba(217,32,46,0.22), 0 50px 120px rgba(0,0,0,0.6)" }} />
      {SQUARES.map((_, i) => {
        const s = slotXY(SLOT[i]);
        const at = DEAL + SLOT[i] * 1.1;
        if (f < at) return null;
        const p = spring({ frame: f - at, fps: FPS, config: { damping: 15, stiffness: 170 } });
        const fromX = CX - TILE / 2 + (rand(i) - 0.5) * 30;
        const fromY = 1720;
        const rz = (1 - p) * (rand(i + 9) - 0.5) * 40;
        return (
          <div key={i} style={{ position: "absolute", left: mix(fromX, s.x, p), top: mix(fromY, s.y, p), width: TILE, height: TILE,
            transform: `rotate(${rz.toFixed(2)}deg)`, perspective: 900 }}>
            <Square i={i} f={f} />
          </div>
        );
      })}
    </div>
  );
};

/* ---------- title (lead-word-zoom-assemble): "bingo" fills the frame, then the line assembles ---------- */
const Title: React.FC<{ f: number }> = ({ f }) => {
  const settle = ramp(f, B(0.9), 16, EASE.smooth);
  const lead = mix(2.4 + f * 0.01, 1, settle);
  const leadIn = ramp(f, 0, 6, EASE.snappy);
  const rest = ramp(f, B(1.2), 12, EASE.snappy);
  const sub = ramp(f, B(1.7), 12, EASE.snappy);
  const up = ramp(f, DEAL - 6, 16, EASE.smooth);
  const subOut = ramp(f, B(5), 10, EASE.out);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: mix(760, 250, up), textAlign: "center", fontFamily: "Zodiak", fontWeight: 700,
      color: "#fff", letterSpacing: "-0.02em", transform: `scale(${mix(1, 0.62, up).toFixed(4)})`, transformOrigin: "50% 0" }}>
      <div style={{ fontSize: 120, lineHeight: 1, opacity: rest, filter: `blur(${((1 - rest) * 14).toFixed(2)}px)`, transform: `translateX(${((1 - rest) * -80).toFixed(1)}px)` }}>Fall semester</div>
      <div style={{ fontSize: 210, lineHeight: 1.05, fontStyle: "italic", fontWeight: 400, color: RED, opacity: leadIn,
        transform: `scale(${lead.toFixed(4)})`, transformOrigin: "50% 45%", filter: `drop-shadow(0 0 40px rgba(217,32,46,${(0.5 * (1 - settle) + 0.25).toFixed(3)}))` }}>bingo</div>
      <div style={{ marginTop: 26, fontFamily: INTER, fontWeight: 600, fontSize: 46, letterSpacing: "-0.01em", color: "rgba(255,255,255,0.7)",
        opacity: sub * (1 - subOut), transform: `translateY(${((1 - sub) * 16).toFixed(1)}px)` }}>Count how many you&rsquo;ve done.</div>
    </div>
  );
};

/* ---------- counter: the film keeps score while you keep yours ---------- */
const Counter: React.FC<{ f: number }> = ({ f }) => {
  const n = STAMP_AT.filter((a) => f >= a).length;
  if (f < STAMP_AT[0] || f > END_AT) return null;
  const last = STAMP_AT[n - 1] ?? 0;
  const pop = 1 + 0.18 * Math.max(0, 1 - (f - last) / 6);
  return (
    <>
    {/* a dark fade under the counter, so it never sits on a square's words when the camera is close */}
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 300, opacity: 1 - ramp(f, FLIP_AT - 6, 6, EASE.out),
      background: "linear-gradient(180deg, #0b0708 0%, rgba(11,7,8,0.92) 55%, rgba(11,7,8,0) 100%)" }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 120, display: "flex", justifyContent: "center", opacity: 1 - ramp(f, FLIP_AT - 6, 6, EASE.out) }}>
      <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 40, color: "#fff", padding: "14px 30px", borderRadius: 40,
        background: "#2a0f14", boxShadow: "inset 0 0 0 1.5px rgba(255,90,100,0.45), 0 10px 30px rgba(0,0,0,0.6)", transform: `scale(${pop.toFixed(3)})`, fontVariantNumeric: "tabular-nums" }}>
        {n} of 16
      </div>
    </div>
    </>
  );
};

/* ---------- ending: the line, the question, the comment box typing a number ---------- */
const Ending: React.FC<{ f: number }> = ({ f }) => {
  const line = ramp(f, LINE_AT, 14, EASE.snappy);
  const lineOut = ramp(f, END_AT, 8, EASE.out);
  const q = ramp(f, END_AT + 6, 14, EASE.snappy);
  const pill = f < TYPE_AT - 4 ? 0 : spring({ frame: f - (TYPE_AT - 4), fps: FPS, config: { damping: 12, stiffness: 160 } });
  const typed = "11".slice(0, Math.max(0, Math.floor((f - TYPE_AT - 6) / 5) + 1));
  const caret = Math.floor(f / 8) % 2 === 0;
  const glow = 1 - ramp(f, TYPE_AT, 24, EASE.out);
  return (
    <>
      {f >= LINE_AT && f < END_AT + 10 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1330, height: 590, opacity: line * (1 - lineOut),
          background: "linear-gradient(180deg, rgba(11,7,8,0) 0%, rgba(11,7,8,0.88) 35%, #0b0708 100%)" }} />
      )}
      {f >= LINE_AT && f < END_AT + 10 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1500, textAlign: "center", fontFamily: "Zodiak", fontWeight: 700, fontSize: 78,
          letterSpacing: "-0.02em", color: "#fff", opacity: line * (1 - lineOut), filter: `blur(${((1 - line) * 14 + lineOut * 10).toFixed(2)}px)`,
          transform: `translateY(${((1 - line) * 24).toFixed(1)}px)` }}>
          That one&rsquo;s <span style={{ fontStyle: "italic", fontWeight: 400, color: "#ff5a64" }}>CampusAI.</span>
        </div>
      )}
      {f >= END_AT && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1180, textAlign: "center" }}>
          <div style={{ fontFamily: "Zodiak", fontWeight: 700, fontSize: 86, lineHeight: 1.08, letterSpacing: "-0.02em", color: "#fff",
            opacity: q, filter: `blur(${((1 - q) * 14).toFixed(2)}px)`, transform: `translateY(${((1 - q) * 22).toFixed(1)}px)` }}>
            How many did<br />you <span style={{ fontStyle: "italic", fontWeight: 400, color: "#ff5a64" }}>get?</span>
          </div>
          {pill > 0 && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 54 }}>
              <div style={{ width: 760, height: 104, borderRadius: 52, display: "flex", alignItems: "center", gap: 18, padding: "0 34px", boxSizing: "border-box",
                transform: `scale(${mix(0.86, 1, pill).toFixed(4)})`, opacity: Math.min(1, pill * 1.4),
                background: `linear-gradient(90deg, rgba(217,32,46,${(0.22 * glow + 0.06).toFixed(3)}), rgba(255,255,255,0.06))`,
                boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.16), 0 20px 60px rgba(0,0,0,0.5)", backdropFilter: "blur(10px)" }}>
                <Glyph name="message-circle" color="rgba(255,255,255,0.7)" size={40} />
                <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 40, color: typed ? "#fff" : "rgba(255,255,255,0.45)" }}>
                  {typed || "Comment your number"}{typed && caret ? <span style={{ color: "#ff5a64" }}>|</span> : null}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

const a = (f: string) => staticFile(`bingo/audio/${f}`);
const CUES: { at: number; src: string; volume: number; name: string }[] = [
  { at: B(0), src: a("whoosh-fast.mp3"), volume: 0.35, name: "title" },
  { at: DEAL, src: a("swoosh-quick.mp3"), volume: 0.4, name: "deal" },
  ...STAMP_AT.map((at, k) => ({ at, src: a("paper-staple.mp3"), volume: k < 8 ? 0.5 : 0.35, name: `stamp ${k + 1}` })),
  { at: FLIP_AT, src: a("transition-snap.mp3"), volume: 0.45, name: "flip" },
  { at: FLIP_AT + 4, src: a("bass-hit-short.mp3"), volume: 0.5, name: "flip hit" },
  { at: FLIP_AT + 8, src: a("ui-success-soft.mp3"), volume: 0.35, name: "campusai square" },
  { at: TYPE_AT - 4, src: a("ui-message-pop.mp3"), volume: 0.4, name: "comment box" },
  { at: TYPE_AT + 6, src: a("typewriter-hit-soft.mp3"), volume: 0.4, name: "type 1" },
  { at: TYPE_AT + 11, src: a("typewriter-hit-soft.mp3"), volume: 0.4, name: "type 2" },
];

export const BingoFilm: React.FC = () => {
  useZodiak();
  const f = useCurrentFrame();
  const cam = camAt(f);
  // the ending pulls the whole card up and back so the question owns the bottom half
  const endK = ramp(f, END_AT, 16, EASE.smooth);
  const z = mix(cam.z, 0.6, endK);
  const camX = mix(cam.x, CARD_C.x, endK);
  const camY = mix(cam.y, CARD_C.y + 560, endK);
  const titleK = 1 - ramp(f, B(4.2), 8, EASE.out); // the header leaves once the camera starts hopping
  const logoOut = ramp(f, B(4), 8, EASE.out) * (1 - ramp(f, END_AT, 12, EASE.out));
  return (
    <AbsoluteFill style={{ background: "#0b0708", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 50% at 50% 55%, rgba(217,32,46,0.2) 0%, rgba(217,32,46,0) 70%)" }} />
      <AbsoluteFill style={{ transformOrigin: "0 0", transform: `translate(${CX}px, 1000px) scale(${z.toFixed(4)}) translate(${(-camX).toFixed(2)}px, ${(-camY).toFixed(2)}px)` }}>
        <Card f={f} />
      </AbsoluteFill>
      <div style={{ opacity: titleK }}><Title f={f} /></div>
      <Counter f={f} />
      <Ending f={f} />
      {/* small wordmark: top at the open, bottom at the close */}
      <div style={{ position: "absolute", left: CX - 130, top: mix(110, 1760, ramp(f, END_AT, 1, EASE.linear)), width: 260, height: 260 * (53 / 223),
        opacity: f < END_AT ? ramp(f, 0, 8, EASE.out) * (1 - logoOut) : ramp(f, END_AT + 14, 12, EASE.out),
        filter: "drop-shadow(0 0 18px rgba(217,32,46,0.5))" }}>
        <Img src={staticFile("brand/campusai-logo-white.svg")} style={{ width: "100%", height: "100%", display: "block" }} />
      </div>
      <Vignette strength={0.45} inner={0.5} color="#060304" />
      <Grain opacity={0.06} blend="soft-light" />
      <Audio src={a("tonight-hiphop.mp3")} trimBefore={MUSIC_TRIM}
        volume={(fr) => 0.75 * Math.min(1, fr / 4) * Math.min(1, Math.max(0, (BINGO_FRAMES - fr) / 18))} />
      {CUES.map((c) => (
        <Sequence key={c.name} from={Math.round(c.at)} name={c.name}>
          <Audio src={c.src} volume={() => c.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
