/**
 * Launch transitions (Nov 10, 2026). A short wide clip that applies the hand-offs of Jimmy's NestPay launch film
 * (Instagram, @thejimmy.vision, sent through Muse; Jacob: "It's more about the transition and how it moves it") to
 * CampusAI. The story is borrowed only as scaffolding; the point is how each beat hands to the next. Measured values
 * and the rule are in skill/lanes/product-films.md, "The NestPay hand-offs".
 *
 * The hand-offs, in order:
 *  1. Line, then the product RISES from below the frame tipped back and straightens as it climbs, passing up through
 *     the line, which leaves as the panel crosses it (reel: 0.7 s rise, ease-out, then a 0.3 s drift).
 *  2. Push THROUGH the panel: a fast push-in until the page is the frame, then a glide along the one row that matters.
 *  3. Turn AWAY into the dark: the page swings on its vertical axis and drifts right while it blurs and goes black,
 *     then a beat of near black before the next line.
 *  4. The line SHRINKS to a point and the logo opens from that same point.
 *  5. Scale hand-off across a HARD CUT: the logo shrinks a little, cut, the next object arrives oversized and blurred
 *     and settles to size in about 0.25 s.
 *  6. TIP OVER: the object tips back on its bottom edge and falls out of frame, accelerating, while the next one rises
 *     behind it from small, decelerating.
 *  7. Accumulation: the number rolls up while the real pieces it counts lift off the page one by one.
 *  8. SINK and rhyme: the page sinks out the bottom, a beat of empty ground, and the logo builds the same way it did
 *     the first time.
 *
 * Every product pixel is a crop of the real dark campusai-demo captures in public/plan-my-week/dark (Nov 5), made by
 * the crop step in films/launch-transitions/brief.md into public/launch-transitions/. Every number and line is in
 * films/launch-transitions/facts.md.
 *
 * Render: npx remotion render src/launch-transitions/entry.ts LaunchTransitions-16x9 out/LaunchTransitions-16x9.mp4
 */
import React from "react";
import { AbsoluteFill, Composition, Img, Sequence, interpolate, staticFile, useCurrentFrame, Easing } from "remotion";
import { Audio } from "@remotion/media";
import { EASE, INTER, LogoOpen, Odometer, brand, glow, useZodiak } from "../kit";

const B = brand("campusai");
const FPS = 30;
const W = 1920;
const H = 1080;
const RED = B.color.accent;
const INK = B.color.ink;
const SOFT = B.color.inkSoft;
const lt = (n: string) => staticFile(`launch-transitions/${n}`);
const aud = (n: string) => staticFile(`plan-my-week/audio/${n}`);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const k = (f: number, a: number, b: number, easing: (t: number) => number = EASE) => interpolate(f, [a, b], [0, 1], { ...clamp, easing });
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
// motion: the reel's exits accelerate and its entrances decelerate; these are the two halves.
const IN = Easing.bezier(0.55, 0, 0.85, 0.35); // ease-in, for anything leaving
const OUT = Easing.bezier(0.16, 1, 0.3, 1); // strong ease-out, for anything landing
const SWING = Easing.bezier(0.65, 0, 0.35, 1); // push-in and glide

// ---- time (frames) ----
const T = {
  quote: 3, // "Flooded with events and assignments." word by word
  rise: 130, // the week rises from below the frame (22 f)
  push: 162, // push through the page to the Due row (12 f)
  glide: 174, // glide along the Due row, Tuesday to Thursday (30 f)
  turn: 204, // the page turns away into the dark (12 f)
  line: 220, // "All in one place." word by word
  shrink: 311, // the line shrinks to a point (7 f)
  logo: 318, // the logo opens from that point once the line is gone (8 f)
  cut: 346, // logo shrinks (6 f before), hard cut, the Canvas dialog lands oversized (8 f)
  tip: 390, // the dialog tips back and falls (20 f); the week rises behind it from 398 (30 f)
  count: 438, // "44 assignments in." rolls up (42 f); the Due chips lift one by one
  sink: 519, // the week sinks out the bottom (18 f)
  end: 542, // empty ground for 5 f, then the logo builds again
};
export const FRAMES = 608; // 20.3 s

// ---- the real week, as a card: public/launch-transitions/week.png is page (472, 54) to (1440, 713) of the Nov 8 week
const PAGE = { x: 472, y: 54, w: 968, h: 659 };
const CARD_W = 1500;
const U = CARD_W / PAGE.w; // card px per page px
const CARD_H = PAGE.h * U;
/** A page point as card px from the card's centre. */
const pt = (x: number, y: number) => ({ x: (x - PAGE.x) * U - CARD_W / 2, y: (y - PAGE.y) * U - CARD_H / 2 });
const DUE_Y = 120.5;
const CHIPS = [
  { x: 523, w: 125 }, // Sun 8, Case Brief: Pals...
  { x: 786, w: 125 }, // Tue 10, Portfolio Project...
  { x: 918, w: 124 }, // Wed 11, Reading Respon...
  { x: 1049, w: 125 }, // Thu 12, Case Write-up: ...
  { x: 1181, w: 124 }, // Fri 13, Case Brief: Jaco...
];
const CHIP_Y = 108;
const CHIP_H = 25;

/** Camera on the card: scale `s`, with card point `p` placed at frame point (tx, ty). */
type Cam = { s: number; p: { x: number; y: number }; tx: number; ty: number };
const camAt = (a: Cam, b: Cam, t: number): Cam => ({
  s: mix(a.s, b.s, t),
  p: { x: mix(a.p.x, b.p.x, t), y: mix(a.p.y, b.p.y, t) },
  tx: mix(a.tx, b.tx, t),
  ty: mix(a.ty, b.ty, t),
});
const centre = { x: 0, y: 0 };
const REST: Cam = { s: 0.8, p: centre, tx: W / 2, ty: H / 2 + 10 };
const DRIFT: Cam = { s: 0.815, p: centre, tx: W / 2, ty: H / 2 + 6 };
const DUE_TUE: Cam = { s: 2.3, p: pt(848, DUE_Y), tx: W / 2, ty: 280 };
const DUE_THU: Cam = { s: 2.3, p: pt(1111, DUE_Y), tx: W / 2 - 40, ty: 280 };
const COUNT: Cam = { s: 0.84, p: centre, tx: W / 2, ty: 640 };

const shadow = (a: number) => `drop-shadow(0 40px 80px rgba(0,0,0,${(0.55 * a).toFixed(3)})) drop-shadow(0 0 60px ${glow(B, 0.22 * a)})`;

/** A card in 3D: centred on (tx, ty) after the camera, with extra tilt, turn, lift and filters. */
const Card3D: React.FC<{
  src: string; w: number; h: number; cam: Cam;
  rx?: number; ry?: number; dx?: number; dy?: number; blur?: number; dim?: number; opacity?: number; origin?: string; children?: React.ReactNode;
}> = ({ src, w, h, cam, rx = 0, ry = 0, dx = 0, dy = 0, blur = 0, dim = 0, opacity = 1, origin = "50% 50%", children }) => {
  const x = cam.tx - cam.p.x * cam.s + dx;
  const y = cam.ty - cam.p.y * cam.s + dy;
  const filters = [blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "", dim > 0.005 ? `brightness(${(1 - dim).toFixed(3)})` : "", shadow(1 - dim)].join(" ");
  return (
    // the camera scales about the card's centre; the tilt and turn pivot on `origin` inside it, so the camera maths
    // never depends on where a card tips from
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, opacity,
      transform: `scale(${cam.s.toFixed(4)})` }}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: origin,
        transform: `perspective(1900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`, filter: filters }}>
        <Img src={src} style={{ width: "100%", height: "100%", display: "block" }} />
        {children}
      </div>
    </div>
  );
};

/** Words arrive left to right, each in the accent first and settling to ink (the reel's lit leading word). */
const WordLine: React.FC<{ text: string; at: number; size: number; family: string; weight: number; track: string; stagger?: number }> = ({
  text, at, size, family, weight, track, stagger = 3,
}) => {
  const f = useCurrentFrame();
  return (
    <span style={{ fontFamily: family, fontWeight: weight, fontSize: size, letterSpacing: track, whiteSpace: "nowrap" }}>
      {text.split(" ").map((w, i) => {
        const a = at + i * stagger;
        const o = k(f, a, a + 5);
        const c = k(f, a + 2, a + 10);
        const col = c < 1 ? `color-mix(in srgb, ${RED} ${((1 - c) * 100).toFixed(1)}%, ${INK})` : INK;
        return (
          <span key={i} style={{ display: "inline-block", opacity: o, color: col, transform: `translateY(${((1 - o) * 10).toFixed(2)}px)`, marginRight: "0.26em" }}>
            {w}
          </span>
        );
      })}
    </span>
  );
};

/** The wordmark opens from its centre outward, the way the reel's mark unfolds, then holds and breathes. */
const LogoBuild: React.FC<{ at: number; width: number; y: number; shrinkAt?: number; address?: boolean }> = ({ at, width, y, shrinkAt, address }) => {
  const f = useCurrentFrame();
  if (f < at || !B.logo) return null;
  const o = k(f, at, at + 8, OUT);
  const inset = (1 - o) * 50;
  const breathe = interpolate(f, [at + 8, at + 8 + FPS * 4], [0, 0.012], clamp);
  const sh = shrinkAt === undefined ? 0 : k(f, shrinkAt, shrinkAt + 6, IN);
  const s = mix(0.92, 1, o) + breathe - 0.14 * sh;
  const a = k(f, at + 12, at + 22);
  return (
    <>
      <div style={{ position: "absolute", left: W / 2 - width / 2, top: y - width / B.logo.ratio / 2, width,
        transform: `scale(${s.toFixed(4)})`, clipPath: `inset(-20% ${inset.toFixed(2)}% -20% ${inset.toFixed(2)}%)`,
        filter: `blur(${((1 - o) * 6).toFixed(2)}px) drop-shadow(0 0 ${(40 * o).toFixed(1)}px ${glow(B, 0.5 * o)})` }}>
        <Img src={staticFile(B.logo.onDark)} style={{ width: "100%", height: "auto", display: "block" }} />
      </div>
      {address ? (
        <div style={{ position: "absolute", left: 0, width: W, top: y + width / B.logo.ratio / 2 + 46, textAlign: "center",
          fontFamily: INTER, fontWeight: 500, fontSize: 34, color: SOFT, opacity: a, transform: `translateY(${((1 - a) * 8).toFixed(2)}px)` }}>
          campusai.app
        </div>
      ) : null}
    </>
  );
};

export const LaunchTransitions: React.FC = () => {
  useZodiak();
  const f = useCurrentFrame();

  // ---- 1. the quote, then the week rises through it ----
  const riseK = k(f, T.rise, T.rise + 22, OUT);
  const quoteOut = k(f, T.rise + 10, T.rise + 16);
  const showQuote = f < T.rise + 16;

  // ---- the week card, beats 1 to 3 ----
  let weekA: React.ReactNode = null;
  if (f >= T.rise && f < T.turn + 12) {
    let cam = REST;
    if (f < T.rise + 22) cam = REST;
    else if (f < T.push) cam = camAt(REST, DRIFT, k(f, T.rise + 22, T.push, (t) => t));
    else if (f < T.glide) cam = camAt(DRIFT, DUE_TUE, k(f, T.push, T.glide, SWING));
    else cam = camAt(DUE_TUE, DUE_THU, k(f, T.glide, T.turn, SWING));
    const pushV = f >= T.push && f < T.glide ? Math.sin(Math.PI * k(f, T.push, T.glide, (t) => t)) : 0;
    const glideV = f >= T.glide && f < T.turn ? Math.sin(Math.PI * k(f, T.glide, T.turn, (t) => t)) : 0;
    const turnK = k(f, T.turn, T.turn + 12, IN);
    weekA = (
      <Card3D src={lt("week.png")} w={CARD_W} h={CARD_H} cam={cam}
        rx={mix(58, 0, riseK)} dy={mix(980, 0, riseK)}
        ry={34 * turnK} dx={460 * turnK}
        blur={(1 - riseK) * 10 + pushV * 3 + glideV * 2.5 + turnK * 16} dim={turnK} origin="50% 100%" />
    );
  }

  // ---- 4. the line, shrinking into the logo ----
  const lineShrink = k(f, T.shrink, T.shrink + 7, IN);
  const showLine = f >= T.line && f < T.shrink + 7;

  // ---- 5 and 6. the Canvas dialog lands across the cut, then tips over ----
  const DLG_H = 900;
  const DLG_W = (669 / 777) * DLG_H;
  let dialog: React.ReactNode = null;
  if (f >= T.cut && f < T.tip + 20) {
    const land = k(f, T.cut, T.cut + 8, OUT);
    const tip = k(f, T.tip, T.tip + 20, IN);
    const s = mix(1.45, 1, land) * mix(1, 1.3, tip);
    dialog = (
      <Card3D src={lt("dialog.png")} w={DLG_W} h={DLG_H} cam={{ s, p: centre, tx: W / 2, ty: H / 2 }}
        rx={80 * tip} dy={700 * tip} blur={(1 - land) * 9 + tip * 5} origin="50% 100%" opacity={1 - k(f, T.tip + 16, T.tip + 20)} />
    );
  }

  // ---- 6 to 8. the week rises behind, the count, the chips lift, the week sinks ----
  let weekB: React.ReactNode = null;
  if (f >= T.tip + 8 && f < T.sink + 18) {
    const rise = k(f, T.tip + 8, T.tip + 38, OUT);
    const sink = k(f, T.sink, T.sink + 18, IN);
    const cam: Cam = { ...COUNT, s: COUNT.s * mix(0.8, 1, rise) };
    const sweep = k(f, T.count + 4, T.count + 22, OUT);
    weekB = (
      <Card3D src={lt("week.png")} w={CARD_W} h={CARD_H} cam={cam} opacity={rise} dy={mix(60, 0, rise) + 820 * sink} blur={(1 - rise) * 6 + sink * 6}>
        {/* the red line under the Due row, swept left to right as the count starts */}
        <div style={{ position: "absolute", left: (523 - PAGE.x) * U, top: (CHIP_Y + CHIP_H + 3 - PAGE.y) * U, height: 4, borderRadius: 2,
          width: (1305 - 523) * U * sweep, background: RED, boxShadow: `0 0 18px ${glow(B, 0.7)}`, opacity: 1 - k(f, T.sink - 20, T.sink) }} />
        {CHIPS.map((c, i) => {
          const a = T.count + 18 + i * 6;
          const up = k(f, a, a + 10, OUT);
          const down = k(f, T.sink - 22 + i * 2, T.sink - 8 + i * 2, SWING);
          const l = up * (1 - down);
          const box = { position: "absolute", left: (c.x - PAGE.x) * U, top: (CHIP_Y - PAGE.y) * U, width: (c.w + 1) * U, height: CHIP_H * U } as const;
          return (
            <React.Fragment key={i}>
            {/* the slot it lifted from goes dark, so the lifted chip reads as the same chip, not a copy */}
            <div style={{ ...box, borderRadius: 6 * U, background: `rgba(7,5,6,${(0.75 * l).toFixed(3)})` }} />
            <Img src={lt(`due-${i}.png`)} style={{ ...box, transformOrigin: "50% 100%",
              transform: `translateY(${(-12 * l).toFixed(2)}px) scale(${(1 + 0.1 * l).toFixed(4)})`,
              filter: `drop-shadow(0 ${(18 * l).toFixed(1)}px ${(26 * l).toFixed(1)}px rgba(0,0,0,${(0.6 * l).toFixed(3)})) drop-shadow(0 0 ${(16 * l).toFixed(1)}px ${glow(B, 0.5 * l)})` }} />
            </React.Fragment>
          );
        })}
      </Card3D>
    );
  }
  const countIn = f >= T.count - 6 && f < T.sink + 10;
  const countVal = interpolate(f, [T.count, T.count + 42], [0, 44], { ...clamp, easing: EASE });
  const countOut = k(f, T.sink, T.sink + 8, IN);
  const countA = k(f, T.count - 6, T.count + 2);

  // ---- sound: the reel's moves are carried by whooshes on each hand-off ----
  const cues: [number, string, number][] = [
    [T.rise - 2, "swoosh-quick.mp3", 0.5],
    [T.push - 1, "swoosh-quick.mp3", 0.35],
    [T.turn, "swoosh-quick.mp3", 0.4],
    [T.logo, "ui-success-soft.mp3", 0.35],
    [T.cut, "switch-tap.mp3", 0.55],
    [T.tip, "swoosh-quick.mp3", 0.45],
    [T.count + 42, "ui-message-pop.mp3", 0.4],
    [T.sink, "swoosh-quick.mp3", 0.4],
    [T.end, "ui-success-soft.mp3", 0.4],
  ];

  return (
    <AbsoluteFill style={{ background: `${B.color.gradient}, ${B.color.bgDeep}`, overflow: "hidden" }}>
      <Audio src={aud("tech-house-vibes.mp3")} volume={(fr) => 0.32 * Math.min(1, fr / 6) * Math.min(1, Math.max(0, (FRAMES - fr) / 30))} />
      {cues.map(([at, src, v], i) => (
        <Sfx key={i} at={at} src={src} v={v} />
      ))}

      {/* the logo near the start: a small mark top left from 0.3 s, until the turn line takes the centre */}
      <LogoOpen brand={B} at={9} x={150} y={74} width={170} leaveAt={T.line - 8} />

      {showQuote ? (
        <div style={{ position: "absolute", left: 0, width: W, top: 430, textAlign: "center", opacity: 1 - quoteOut, transform: `translateY(${(-24 * quoteOut).toFixed(2)}px)` }}>
          <WordLine text="Flooded with events and assignments." at={T.quote} size={84} family="Zodiak" weight={700} track="-0.02em" />
          <div style={{ marginTop: 26, fontFamily: INTER, fontWeight: 500, fontSize: 30, color: SOFT, opacity: k(f, T.quote + 14, T.quote + 24) }}>Freshman, Finance</div>
        </div>
      ) : null}

      {weekA}

      {showLine ? (
        <div style={{ position: "absolute", left: 0, width: W, top: 488, textAlign: "center", opacity: 1 - lineShrink,
          transform: `scale(${mix(1, 0.25, lineShrink).toFixed(4)})` }}>
          <WordLine text="All in one place." at={T.line} size={96} family="Zodiak" weight={700} track="-0.02em" />
        </div>
      ) : null}

      {f >= T.logo && f < T.cut ? <LogoBuild at={T.logo} width={620} y={H / 2} shrinkAt={T.cut - 6} /> : null}

      {weekB}
      {dialog}

      {countIn ? (
        <div style={{ position: "absolute", left: 0, width: W, top: 74, display: "flex", justifyContent: "center", alignItems: "baseline", gap: 18,
          opacity: countA * (1 - countOut), transform: `translateY(${(-20 * countOut + (1 - countA) * 10).toFixed(2)}px)` }}>
          <Odometer value={countVal} digits={countVal < 9.5 ? 1 : 2} size={76} color={RED} />
          <span style={{ fontFamily: "Zodiak", fontWeight: 700, fontSize: 72, letterSpacing: "-0.02em", color: INK }}>assignments in.</span>
        </div>
      ) : null}

      {f >= T.end ? <LogoBuild at={T.end} width={620} y={H / 2 - 30} address /> : null}
    </AbsoluteFill>
  );
};

const Sfx: React.FC<{ at: number; src: string; v: number }> = ({ at, src, v }) => (
  <Sequence from={at} durationInFrames={60}>
    <Audio src={aud(src)} volume={() => v} />
  </Sequence>
);

export const LaunchTransitionsRoot: React.FC = () => (
  <Composition id="LaunchTransitions-16x9" component={LaunchTransitions} durationInFrames={FRAMES} fps={FPS} width={W} height={H} />
);
