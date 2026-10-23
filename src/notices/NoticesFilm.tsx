/**
 * CampusAI, "It notices before you do" (2026-10-21). 9:16, 30fps, about 18s, music and sound.
 *
 * Jacob picked this from the round 4 family of ideas and widened it: not just the moved deadline,
 * "it's always looking out for you", new jobs, events and clubs that fit, alerted as they come.
 * Every notice and card here is the REAL notifications page on campusai-demo, captured alone by
 * `capture/notices-film.cjs`, with its own reason line ("FP&A, the role type you ranked first").
 *
 * Same family as the platform tour (dark, red glow, real product, logo at both ends, cut to the
 * beat) but none of its moves, per his rule that films in a batch never share one. Shelf shots:
 * icon-performance-moves (the bell rings), ui-to-brand-morph (bell flips into the wordmark),
 * scan-bracket-sweep (brackets lock onto the moved date), deck-deal-flyin (roles deal in),
 * depth-layer-moves (events on parallax rails, one floats up), card-flip-reveal (clubs),
 * list-stack-press (the notices pile up, then collapse back into the bell).
 *
 * Music: Mixkit "House Vibez" (Lily J, free license), 122.00 BPM, t0 7.938s, T 0.4918s.
 * Notifications on main: PR #384 merged 2026-09-30; its backend was spec-only, so confirm students
 * actually receive these before posting.
 */
import React from "react";
import { AbsoluteFill, Img, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { INTER, useZodiak } from "../kit/parts";
import { EASE, Grain, Vignette, mix, ramp } from "../shots/_fixtures/Polish";
import { LUCIDE } from "../flock/icons";

export const NOTICES_FPS = 30;
export const NOTICES_SIZE = { width: 1080, height: 1920 };
const FPS = NOTICES_FPS;

const T0 = 7.938;
const T = 0.4918;
const MUSIC_TRIM = Math.round(T0 * FPS);
const OFFSET_S = T0 - MUSIC_TRIM / FPS;
const B = (n: number) => (OFFSET_S + n * T) * FPS;
export const NOTICES_FRAMES = Math.round(B(37.5));

const RED = "#D9202E";
const CX = 540;
const src = (f: string) => staticFile(`notices/${f}`);
const sp = (f: number, at: number, damping = 14, stiffness = 150) => (f < at ? 0 : spring({ frame: f - at, fps: FPS, config: { damping, stiffness } }));

/* ---------- a notice, shown as a push banner: the real row cropped to its headline and message ---------- */
const NOTICE_H: Record<string, number> = { moved: 125, roles: 143, events: 143, clubs: 143 };
const CROP = { x: 28, w: 680 }; // from the icon to the end of the message line
const BANNER_W = 1000;
const Banner: React.FC<{ name: string; style?: React.CSSProperties }> = ({ name, style }) => {
  const k = BANNER_W / CROP.w;
  const h = NOTICE_H[name] * k;
  return (
    <div style={{ width: BANNER_W, height: h, borderRadius: 30, overflow: "hidden", position: "relative", background: "#1b1416",
      boxShadow: "0 0 0 1.5px rgba(255,140,140,0.22), 0 0 70px rgba(217,32,46,0.3), 0 30px 70px rgba(0,0,0,0.6)", ...style }}>
      {/* maxWidth none: the studio's base styles cap images at their box, which squeezed the row instead of cropping it */}
      <Img src={src(`n-${name}.png`)} style={{ position: "absolute", left: -CROP.x * k, top: 0, width: 1126 * k, height: h, maxWidth: "none", display: "block" }} />
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 8, background: RED }} />
    </div>
  );
};
// drops in from above like a phone notification, then makes way for the next
const Drop: React.FC<{ f: number; at: number; out: number; name: string }> = ({ f, at, out, name }) => {
  if (f < at - 2 || f > out + 12) return null;
  const p = sp(f, at, 13, 170);
  const o = ramp(f, out, 10, EASE.exit);
  return (
    <div style={{ position: "absolute", left: CX - BANNER_W / 2, top: mix(-260, 200, p) - o * 300, opacity: 1 - o }}>
      <Banner name={name} />
    </div>
  );
};

const Card: React.FC<{ file: string; width: number; h?: number; glow?: number; style?: React.CSSProperties }> = ({ file, width, h = 136, glow = 0, style }) => {
  const k = width / 349.33;
  return (
    <div style={{ width, height: h * k, borderRadius: 14 * k, overflow: "hidden",
      boxShadow: `0 0 0 1.5px rgba(255,140,140,${(0.16 + glow * 0.3).toFixed(3)}), 0 0 ${(40 + glow * 60).toFixed(0)}px rgba(217,32,46,${(0.2 + glow * 0.45).toFixed(3)}), 0 30px 70px rgba(0,0,0,0.6)`, ...style }}>
      <Img src={src(file)} style={{ width, height: h * k, display: "block" }} />
    </div>
  );
};

/* ---------- timeline in beats ---------- */
const N = { moved: B(5.5), roles: B(11.5), events: B(17.5), clubs: B(23.5), stack: B(29.5), collapse: B(32), mark: B(33) };

/* bell: rings, flips flat, the wordmark blooms out of it (opening), and takes the notices back (ending) */
const Bell: React.FC<{ f: number; ring: number; flip: number; scale: number; badge: number }> = ({ f, ring, flip, scale, badge }) => {
  const t = f - ring;
  const wob = t >= 0 && t < 30 ? Math.sin(t * 1.3) * 20 * Math.exp(-t / 9) : 0;
  return (
    <div style={{ position: "absolute", left: CX - 140, top: 760, width: 280, height: 280, transform: `scale(${scale.toFixed(4)}) rotateY(${(flip * 90).toFixed(2)}deg)`,
      opacity: flip < 1 ? 1 : 0 }}>
      <div style={{ width: 280, height: 280, borderRadius: 72, background: "linear-gradient(160deg, #2a1418 0%, #170b0e 100%)",
        boxShadow: "0 0 0 2px rgba(255,140,140,0.25), 0 0 120px rgba(217,32,46,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg viewBox="0 0 24 24" width={150} height={150} style={{ color: "#fff", transform: `rotate(${wob.toFixed(2)}deg)`, transformOrigin: "50% 10%" }}
          dangerouslySetInnerHTML={{ __html: LUCIDE.bell }} />
      </div>
      {badge > 0 && (
        <div style={{ position: "absolute", right: -18, top: -18, width: 92, height: 92, borderRadius: 46, background: RED, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, fontWeight: 800, fontSize: 48,
          transform: `scale(${badge.toFixed(4)})`, boxShadow: "0 0 0 6px #0b0708" }}>4</div>
      )}
    </div>
  );
};

const Wordmark: React.FC<{ k: number; width: number; top: number; glow?: number }> = ({ k, width, top, glow = 1 }) => (
  <div style={{ position: "absolute", left: CX - width / 2, top, width, height: width * (53 / 223), opacity: Math.min(1, k * 1.5),
    transform: `scale(${mix(0.6, 1, k).toFixed(4)}) rotateY(${((1 - k) * -80).toFixed(2)}deg)`, filter: `drop-shadow(0 0 ${30 * glow}px rgba(217,32,46,${0.7 * glow}))` }}>
    <Img src={staticFile("brand/campusai-logo-white.svg")} style={{ width: "100%", height: "100%", display: "block" }} />
  </div>
);

const Line: React.FC<{ f: number; at: number; out?: number; top: number; a: string; b: string; size?: number }> = ({ f, at, out, top, a, b, size = 96 }) => {
  const p = ramp(f, at, 14, EASE.snappy);
  const q = out === undefined ? 0 : ramp(f, out, 8, EASE.out);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", fontFamily: "Zodiak", fontWeight: 700, fontSize: size, lineHeight: 1.05,
      letterSpacing: "-0.02em", color: "#fff", opacity: p * (1 - q), filter: `blur(${((1 - p) * 14 + q * 10).toFixed(2)}px)`, transform: `translateY(${((1 - p) * 24).toFixed(1)}px)` }}>
      <div>{a}</div>
      <div style={{ fontStyle: "italic", fontWeight: 400, color: "#ff5a64" }}>{b}</div>
    </div>
  );
};

/* ---------- 1. moved: the brief's real row, with brackets locking onto the new date ---------- */
const Moved: React.FC<{ f: number }> = ({ f }) => {
  const at = N.moved + 14;
  if (f < at - 2 || f > N.roles + 12) return null;
  const p = sp(f, at, 16, 140);
  const o = ramp(f, N.roles, 10, EASE.exit);
  const W = 1000, H = (89 / 527) * W;
  const lock = ramp(f, at + 14, 8, EASE.snappy);
  const scan = ramp(f, at + 8, 14, EASE.smooth);
  // the date line inside the row (row-local, measured on the capture): "Wed, Oct 14 -> Sun, Oct 18"
  const k = W / 527;
  const box = { x: 6 * k, y: 66.5 * k, w: 176 * k, h: 16 * k };
  const pad = mix(60, 10, lock);
  return (
    <div style={{ position: "absolute", left: CX - W / 2, top: mix(1500, 820, p) - o * 400, width: W, height: H, opacity: (1 - o) * Math.min(1, p * 1.4) }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 24, overflow: "hidden", background: "#15141a",
        boxShadow: "0 0 0 1.5px rgba(255,140,140,0.2), 0 0 80px rgba(217,32,46,0.3), 0 30px 70px rgba(0,0,0,0.6)" }}>
        <Img src={src("brief-moved.png")} style={{ width: W, height: H, display: "block" }} />
        {scan > 0 && scan < 1 && <div style={{ position: "absolute", left: 0, right: 0, top: scan * H, height: 4, background: "rgba(255,90,100,0.9)",
          boxShadow: "0 0 24px 6px rgba(217,32,46,0.6)" }} />}
      </div>
      {/* one glowing outline snaps tight around the new date (scan-bracket-sweep, simplified for a one-line target) */}
      {lock > 0 && (
        <div style={{ position: "absolute", left: box.x - pad, top: box.y - pad, width: box.w + pad * 2, height: box.h + pad * 2, borderRadius: 12,
          border: `5px solid ${RED}`, opacity: lock, boxShadow: `0 0 26px rgba(217,32,46,${(0.8 * lock).toFixed(3)})` }} />
      )}
    </div>
  );
};

/* ---------- 2. roles: the three the notice names deal in, the first lifts ---------- */
const Roles: React.FC<{ f: number }> = ({ f }) => {
  if (f < N.roles + 8 || f > N.events + 12) return null;
  const o = ramp(f, N.events, 10, EASE.exit);
  const lift = sp(f, B(16), 12, 160);
  return (
    <>
      {[0, 1, 2].map((i) => {
        const p = sp(f, B(13 + i), 15, 170);
        const fromX = CX - 450 + (i - 1) * 60;
        const glow = i === 0 ? lift : 0;
        return (
          <div key={i} style={{ position: "absolute", left: mix(fromX, CX - 450, p), top: mix(2000, 560 + i * 400, p) - o * 500 - glow * 20,
            transform: `rotate(${((1 - p) * (i - 1) * 14).toFixed(2)}deg) scale(${(1 + glow * 0.05).toFixed(4)})`, opacity: 1 - o, zIndex: i === 0 ? 5 : 1 }}>
            <Card file={`c-roles-${i}.png`} width={900} glow={glow} />
          </div>
        );
      })}
    </>
  );
};

/* ---------- 3. events: three cards on parallax rails, the Deloitte one floats forward ---------- */
const Events: React.FC<{ f: number }> = ({ f }) => {
  if (f < N.events + 8 || f > N.clubs + 12) return null;
  const o = ramp(f, N.clubs, 10, EASE.exit);
  const t = f - N.events;
  const float = sp(f, B(21), 14, 140);
  const speeds = [5.2, 3.4, 4.4];
  return (
    <AbsoluteFill style={{ perspective: 1600, opacity: 1 - o }}>
      {[0, 1, 2].map((i) => {
        const enter = sp(f, N.events + 8 + i * 4, 18, 120);
        const x = CX - 430 + (1 - enter) * (i % 2 ? -1200 : 1200) - (t - 30) * speeds[i] * 0.25 * (1 - (i === 0 ? float : 0));
        const front = i === 0 ? float : 0;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: 560 + i * 410 - o * 300, zIndex: i === 0 ? 5 : 1,
            transform: `translateZ(${(front * 140).toFixed(1)}px) rotateY(${((1 - front) * -10).toFixed(2)}deg)`,
            filter: i !== 0 ? `brightness(${(1 - float * 0.35).toFixed(3)})` : undefined }}>
            <Card file={`c-events-${i}.png`} width={860} h={148} glow={front} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------- 4. clubs: two cards flip face up ---------- */
const Clubs: React.FC<{ f: number }> = ({ f }) => {
  if (f < N.clubs + 8 || f > N.stack + 12) return null;
  const o = ramp(f, N.stack, 10, EASE.exit);
  return (
    <AbsoluteFill style={{ perspective: 1400, opacity: 1 - o }}>
      {[0, 1].map((i) => {
        const flip = ramp(f, B(25.5 + i * 1.5), 10, EASE.snappy);
        const show = f >= B(25.5 + i * 1.5) - 6;
        if (!show) return null;
        const half = flip < 0.5;
        return (
          <div key={i} style={{ position: "absolute", left: CX - 450, top: 640 + i * 470 - o * 300, transform: `rotateY(${((1 - flip) * 180).toFixed(2)}deg)`, transformStyle: "preserve-3d" }}>
            {half ? (
              <div style={{ width: 900, height: (139 / 349.33) * 900, borderRadius: 36, background: "linear-gradient(160deg, #ff4a54, #a3121f)",
                boxShadow: "0 0 80px rgba(217,32,46,0.5)", transform: "rotateY(180deg)" }} />
            ) : (
              <Card file={`c-clubs-${i}.png`} width={900} h={139} glow={1 - Math.abs(flip - 1)} />
            )}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------- finale: the four notices pile up, then go back into the bell ---------- */
const NAMES = ["moved", "roles", "events", "clubs"];
const Stack: React.FC<{ f: number }> = ({ f }) => {
  if (f < N.stack - 2 || f > N.collapse + 14) return null;
  const c = ramp(f, N.collapse, 12, EASE.exit);
  const land = NAMES.map((_, i) => N.stack + i * 7);
  const squash = land.reduce((s, at) => s + Math.sin(Math.min(1, Math.max(0, (f - at - 5) / 7)) * Math.PI) * 0.03, 0);
  return (
    <>
      {NAMES.map((n, i) => {
        const p = sp(f, land[i], 14, 190);
        if (p <= 0) return null;
        const y = mix(2000, 620 + i * 70, p);
        const x = CX - BANNER_W / 2;
        return (
          <div key={n} style={{ position: "absolute", left: mix(x, CX - BANNER_W / 2, c), top: mix(y, 900, c), zIndex: i,
            transform: `scale(${(mix(1 - (3 - i) * 0.04, 0.12, c) * (1 - squash)).toFixed(4)})`, opacity: 1 - ramp(f, N.collapse + 6, 6, EASE.out),
            transformOrigin: "50% 50%" }}>
            <Banner name={n} />
          </div>
        );
      })}
    </>
  );
};

const a = (f: string) => staticFile(`notices/audio/${f}`);
const CUES: { at: number; src: string; volume: number; name: string }[] = [
  { at: B(0), src: a("ui-notify-tech.mp3"), volume: 0.45, name: "bell rings" },
  { at: B(2), src: a("swoosh-quick.mp3"), volume: 0.35, name: "bell to wordmark" },
  ...["moved", "roles", "events", "clubs"].map((n) => ({ at: N[n as keyof typeof N], src: a("chime-crystal.mp3"), volume: 0.4, name: `notice ${n}` })),
  { at: N.moved + 22, src: a("data-scan.mp3"), volume: 0.3, name: "scan" },
  ...[13, 14, 15].map((b) => ({ at: B(b), src: a("ui-popup-dry.mp3"), volume: 0.35, name: `role ${b}` })),
  { at: B(16), src: a("bass-hit-short.mp3"), volume: 0.35, name: "role lifts" },
  { at: B(21), src: a("bass-hit-short.mp3"), volume: 0.35, name: "event floats" },
  ...[25.5, 27].map((b) => ({ at: B(b), src: a("transition-snap.mp3"), volume: 0.4, name: `club flip ${b}` })),
  { at: N.collapse, src: a("air-zoom-vacuum.mp3"), volume: 0.5, name: "into the bell" },
  { at: N.mark, src: a("bass-hit-short.mp3"), volume: 0.6, name: "wordmark" },
];

export const NoticesFilm: React.FC = () => {
  useZodiak();
  const f = useCurrentFrame();
  // opening bell: rings on beat 0, badge on beat 1, flips into the wordmark on beat 2
  const bellIn = sp(f, 0, 12, 160);
  const flip1 = ramp(f, B(2), 7, EASE.exit);
  const mark1 = ramp(f, B(2) + 6, 12, EASE.snappy);
  const openOut = ramp(f, N.moved - 4, 10, EASE.exit);
  // ending: the bell comes back to take the notices, flips into the wordmark again
  const bell2 = sp(f, N.collapse - 2, 12, 170);
  const flip2 = ramp(f, N.mark - 4, 6, EASE.exit);
  const mark2 = ramp(f, N.mark + 1, 12, EASE.snappy);
  const small = ramp(f, N.moved - 4, 12, EASE.smooth) * (1 - ramp(f, N.collapse - 6, 6, EASE.out));
  return (
    <AbsoluteFill style={{ background: "#0b0708", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 45% at 50% 52%, rgba(217,32,46,0.22) 0%, rgba(217,32,46,0) 70%)" }} />
      {f < N.moved + 10 && (
        <div style={{ opacity: 1 - openOut }}>
          {flip1 < 1 && <Bell f={f} ring={B(0)} flip={flip1} scale={mix(0.5, 1, bellIn)} badge={sp(f, B(1), 10, 200)} />}
          {mark1 > 0 && <Wordmark k={mark1} width={720} top={820} />}
          <Line f={f} at={B(3)} top={1080} a="It notices" b="before you do." />
        </div>
      )}
      <Moved f={f} />
      <Roles f={f} />
      <Events f={f} />
      <Clubs f={f} />
      {["moved", "roles", "events", "clubs"].map((n, i, arr) => {
        const at = N[n as keyof typeof N];
        const next = i < arr.length - 1 ? N[arr[i + 1] as keyof typeof N] : N.stack;
        return <Drop key={n} f={f} at={at} out={next - 4} name={n} />;
      })}
      <Stack f={f} />
      {f >= N.collapse - 2 && flip2 < 1 && <Bell f={f} ring={N.collapse + 8} flip={flip2} scale={bell2} badge={0} />}
      {mark2 > 0 && <Wordmark k={mark2} width={760} top={820} />}
      {f >= N.mark && <Line f={f} at={N.mark + 10} top={1080} a="Always" b="looking out for you." size={92} />}
      {/* small wordmark at the top while the notices play, so the middle stays branded */}
      {small > 0 && (
        <div style={{ position: "absolute", left: CX - 110, top: 90, width: 220, height: 220 * (53 / 223), opacity: small }}>
          <Img src={staticFile("brand/campusai-logo-white.svg")} style={{ width: "100%", height: "100%", display: "block" }} />
        </div>
      )}
      <Vignette strength={0.45} inner={0.5} color="#060304" />
      <Grain opacity={0.06} blend="soft-light" />
      <Audio src={a("house-vibez.mp3")} trimBefore={MUSIC_TRIM}
        volume={(fr) => 0.72 * Math.min(1, fr / 4) * Math.min(1, Math.max(0, (NOTICES_FRAMES - fr) / 18))} />
      {CUES.map((c) => (
        <Sequence key={c.name} from={Math.max(0, Math.round(c.at))} name={c.name}>
          <Audio src={c.src} volume={() => c.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
