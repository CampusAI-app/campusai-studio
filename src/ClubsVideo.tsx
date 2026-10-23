/**
 * CampusAI — "which clubs are actually yours" — the Involvement Fair loop.
 *
 * A SILENT, SEAMLESSLY LOOPING film for the table at the SUSA Involvement Fair.
 * Silent is not a compromise here, it is the format: a booth has no audio, a
 * passer-by gives it three seconds, and the text is the message. It is also the
 * only video format we can currently ship at all, since the free ElevenLabs
 * voice is non-commercial and no music has been picked.
 *
 * The premise is the venue. A student standing in that hall is looking at 27
 * tables and cannot tell which four matter. So the fair is the problem and
 * CampusAI is the filter, and the film is that reduction.
 *
 * ASSEMBLY, not authorship — the method from `ChatVideo.tsx`:
 *   · rubik-s-cube-liquid-glass supplies the field: 27 items, every one static
 *     individually, animated purely as overlapping groups plus a parent drift.
 *   · lines supplies the reduction: converging frame closing on a centre while
 *     it scales down, the mark landing late (1167ms) on an 840ms settle.
 *   · drop-in supplies the answer accumulating: arrivals ~200-380ms apart with
 *     block durations SHRINKING as travel grows, so the stack fills at constant
 *     visual speed.
 *   · ChatVideo supplies the product itself — tokens, page gradient, composer,
 *     bubble. This is the first film that inherits rather than starts over.
 *
 * CONTENT IS SOURCED, NOT INVENTED. The clubs are real and named on Smith's own
 * page (rhsmith.umd.edu → Undergraduate → Community → Clubs and Organizations).
 * The count of 27 is SUSA's own figure for how many clubs present at the fair.
 * No club name in this film is made up. The SUSA site does not publish its
 * roster, which is why the field beat shows 27 unnamed tiles rather than 27
 * invented names.
 *
 * RENDER RULES INHERITED FROM THE CHAT FILM — read before changing anything:
 *   · ANGLE is off in remotion.config.ts, so there are NO GL transitions.
 *   · The page gradient lives at the composition root, never inside a beat.
 *   · No `overflow: hidden` + radius, and no scaled transform, on any element
 *     whose layout animates. The camera is a layout resize (multiply by `k`).
 *   · Growth is by MOUNTING children, never by animating a clipped height.
 *   · Product beats drop the grain and halve the vignette.
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { EASE, PRODUCT_BG, UI, Vignette } from "./ChatVideo";

const FPS = 30;
const f = (sec: number) => Math.round(sec * FPS);
const DISSOLVE = 9;

const BEATS = {
  field: 3.4,   // 27 tiles drifting, the headline lands
  narrow: 2.2,  // the lines converge, the field collapses
  ask: 3.2,     // the composer types the question
  answer: 8.6,  // four real clubs accumulate
  tail: 0.8,    // back to bare ground, so the loop point is ground -> ground
};

export const CLUBS_VIDEO_FRAMES =
  f(Object.values(BEATS).reduce((a, b) => a + b, 0)) - DISSOLVE * 4;

// ── Beat 1: the many ────────────────────────────────────────────────────────
/**
 * 27 tiles, because 27 is SUSA's own number for the fair. They carry NO names:
 * the SUSA site does not publish its roster, and inventing 27 club names to
 * fill a frame would be exactly the kind of invention this method exists to
 * avoid. The count is the point, and unnamed tiles read as "a lot of tables"
 * faster than a wall of small text does anyway.
 *
 * Choreography is rubik-s-cube-liquid-glass: every tile is static in itself and
 * the motion comes from three overlapping groups plus a parent drift. That is
 * what lets a big field feel alive without animating 27 things.
 */
const TILE_COUNT = 27;
// A 6 x 5 lattice covering the WHOLE frame, jittered per index so it reads as a
// hall of tables rather than a grid. Deterministic: Remotion renders frames out
// of order and in parallel, so anything random would strobe.
const TILES = Array.from({ length: TILE_COUNT }, (_, i) => {
  const col = i % 6;
  const row = Math.floor(i / 6);
  const jx = ((i * 37) % 11) / 11 - 0.5;
  const jy = ((i * 53) % 7) / 7 - 0.5;
  return {
    i,
    x: -0.86 + col * 0.345 + jx * 0.12 + (row % 2) * 0.07,
    y: 0.82 - row * 0.41 + jy * 0.1,
    rot: [-3, 0, 2, -1, 3][i % 5],
    group: i % 3,
  };
});
const GROUP_DRIFT = [
  { dx: 26, dy: -14, ms: 2529 },
  { dx: -18, dy: 20, ms: 1147 },
  { dx: 12, dy: 24, ms: 1039 },
];

// `entering` exists because the narrow beat re-mounts this component, which
// replayed the 28ms-per-tile entrance from zero. Combined with the collapse the
// two cancelled and the beat went visually empty for most of a second.
const Field: React.FC<{ collapse?: number; recede?: number; entering?: boolean }> = ({ collapse = 0, recede = 0, entering = true }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const ms = (frame / fps) * 1000;

  return (
    <AbsoluteFill>
      {TILES.map((t) => {
        const g = GROUP_DRIFT[t.group];
        // A slow sine on each group, not a keyframed loop: it never lands on a
        // beat, which is what keeps a background field from pulling focus.
        const phase = Math.sin((ms / g.ms) * Math.PI * 2 + t.group * 1.7);
        const inP = entering
          ? interpolate(ms, [t.i * 28, t.i * 28 + 620], [0, 1], {
              easing: EASE.outExpo, extrapolateLeft: "clamp", extrapolateRight: "clamp",
            })
          : 1;
        // The reduction pulls every tile toward centre and fades it out.
        const cx = width / 2 + t.x * width * 0.5;
        const cy = height / 2 - t.y * height * 0.44;
        const x = cx + (width / 2 - cx) * collapse + g.dx * phase * (1 - collapse);
        const y = cy + (height / 2 - cy) * collapse + g.dy * phase * (1 - collapse);
        return (
          <div
            key={t.i}
            style={{
              position: "absolute",
              left: x - 74,
              top: y - 22,
              width: 148,
              height: 44,
              borderRadius: 999,
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${UI.rule}`,
              // They RECEDE rather than compete: the headline has to be readable
              // straight through them at a glance from across a room.
              opacity: inP * (1 - collapse) * (0.62 - recede * 0.34),
              transform: `rotate(${t.rot}deg)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Raylight-style word-staggered headline. */
const Headline: React.FC<{ text: string; size?: number; delayMs?: number; color?: string }> = ({
  text, size = 92, delayMs = 0, color = UI.ink,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  return (
    <div style={{ display: "flex", gap: size * 0.28, fontFamily: "Inter, system-ui, sans-serif" }}>
      {text.split(" ").map((word, i) => {
        // 80ms per word, blurFrom 10, 620ms out-expo — the house entrance.
        const p = interpolate(ms, [delayMs + i * 80, delayMs + i * 80 + 620], [0, 1], {
          easing: EASE.outExpo, extrapolateLeft: "clamp", extrapolateRight: "clamp",
        });
        return (
          <span
            key={`${word}-${i}`}
            style={{
              fontSize: size,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color,
              opacity: p,
              filter: `blur(${(1 - p) * 10}px)`,
              transform: `translateY(${(1 - p) * -21}px)`,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

const FieldBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const recede = interpolate(ms, [820, 1600], [0, 1], {
    easing: EASE.outExpo, extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return (
  <AbsoluteFill>
    <Field recede={recede} />
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Headline text="27 clubs at this fair." delayMs={820} />
    </AbsoluteFill>
    <Vignette warm={false} strength={0.45} grain={false} />
  </AbsoluteFill>
  );
};

// ── Beat 2: the reduction ───────────────────────────────────────────────────
/**
 * `lines`: four zero-height rules close on the centre while what is inside
 * scales down, and the mark lands LATE — 1167ms in, on an 840ms settle. The
 * lateness is the whole trick; the frame arrives, holds empty for a beat, and
 * only then does the thing appear inside it.
 */
const NarrowBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const ms = (frame / fps) * 1000;

  const close = interpolate(ms, [0, 884], [0, 1], {
    easing: EASE.inOut, extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const collapse = interpolate(ms, [200, 1120], [0, 1], {
    easing: EASE.inOut, extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const inset = 250;
  const gapX = width / 2 - inset * close;
  const gapY = height / 2 - (inset * 0.56) * close;
  // At 8% white a 1px rule is invisible on a dark red ground. These ARE the
  // beat, so they are brighter and 2px, and they brighten further as they close.
  const rule = {
    position: "absolute" as const,
    background: `rgba(255,255,255,${0.10 + close * 0.20})`,
  };

  return (
    <AbsoluteFill>
      <Field collapse={collapse} entering={false} />
      {/* the four converging rules */}
      <div style={{ ...rule, left: 0, right: 0, top: gapY, height: 2 }} />
      <div style={{ ...rule, left: 0, right: 0, bottom: gapY, height: 2 }} />
      <div style={{ ...rule, top: 0, bottom: 0, left: gapX, width: 2 }} />
      <div style={{ ...rule, top: 0, bottom: 0, right: gapX, width: 2 }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {/* `lines` lands its mark LATE, 1167ms in. That delay lives in the
            Headline's own stagger; wrapping it in a second fade made it arrive
            twice and read weak. */}
        <Headline text="Four are yours." delayMs={1167} />
      </AbsoluteFill>
      <Vignette warm={false} strength={0.45} grain={false} />
    </AbsoluteFill>
  );
};

// ── Beat 3: the ask ─────────────────────────────────────────────────────────
const QUESTION = "Which clubs should I actually join?";
const BAR_W = 1370;
const BAR_H = Math.round(BAR_W * (76 / 698));
const CHAR_MS = 45;
const TYPE_START = 700;

const AskBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;

  const settle = interpolate(ms, [0, 620], [0, 1], {
    easing: EASE.outExpo, extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const chars = Math.max(0, Math.min(QUESTION.length, Math.floor((ms - TYPE_START) / CHAR_MS)));
  const done = chars >= QUESTION.length;
  const doneAt = TYPE_START + QUESTION.length * CHAR_MS;
  // prompt-button-press: squash to 0.9 then settle. The house press curve.
  const press = done
    ? interpolate(ms, [doneAt + 180, doneAt + 300, doneAt + 480], [1, 0.9, 1], {
        easing: EASE.outExpo, extrapolateLeft: "clamp", extrapolateRight: "clamp",
      })
    : 1;
  const caretOn = !done && Math.floor(ms / 520) % 2 === 0;

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 54 }}>
        <Img
          src={staticFile("brand/campusai-logo-white.svg")}
          style={{
            width: 330,
            opacity: settle,
            filter: `blur(${(1 - settle) * 8}px)`,
            transform: `translateY(${(1 - settle) * 14}px)`,
          }}
        />
        <div
          style={{
            width: BAR_W,
            height: BAR_H,
            display: "flex",
            alignItems: "center",
            gap: 22,
            padding: "0 26px",
            borderRadius: 32,
            background: UI.card,
            border: `1px solid ${UI.rule}`,
            boxShadow: UI.shadow,
            opacity: settle,
          }}
        >
          <div style={{ position: "relative", flex: 1, fontFamily: "Inter, system-ui, sans-serif", fontSize: 30 }}>
            <span style={{ color: UI.ink, fontWeight: 450 }}>
              {QUESTION.slice(0, chars)}
              <span style={{ opacity: caretOn ? 1 : 0, color: UI.red }}>|</span>
            </span>
          </div>
          <div
            style={{
              flexShrink: 0,
              width: 62 * press, height: 62 * press, borderRadius: 999,
              background: UI.red,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: done ? "0 0 34px rgba(226,24,51,0.42)" : "none",
            }}
          >
            <svg width={26 * press} height={26 * press} viewBox="0 0 24 24" fill="none">
              <path d="M3.5 12 20 4l-4 16-4.2-5.6L3.5 12Z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </AbsoluteFill>
      <Vignette warm={false} strength={0.45} grain={false} />
    </AbsoluteFill>
  );
};

// ── Beat 4: the answer ──────────────────────────────────────────────────────
/**
 * Four REAL Smith organisations, every one named on the school's own clubs and
 * organizations page. The reasons are written the way the product writes them:
 * what it is first, then what it gets you. Nothing here claims a fit score or a
 * ranking, because the film should not promise precision the product does not
 * have.
 */
const CLUBS = [
  {
    name: "Snider Consulting Group",
    why: "Real consulting projects for actual UMD clients. You leave with client work on your resume, not a line that says you were a member.",
  },
  {
    name: "Smith Community Council",
    why: "The student-led programming board. If you would rather run the thing than attend the thing, this is where that starts.",
  },
  {
    name: "Smith Student Ambassadors",
    why: "You represent Smith to admitted students. It is the cheapest public-speaking practice on campus and recruiters read it as communication.",
  },
  {
    name: "Smith Undergraduate Student Association",
    why: "The governing body over all 27 of these. A seat here is the leadership signal that people outside Smith still recognise.",
  },
];

const BUBBLE_W = 1290;
const PAD = 34;
const LEAD_H = 50;
const LEAD_MB = 26;
const NAME_H = 50;
const WHY_H = 86;
const BLOCK_GAP = 20;
// drop-in: arrivals 200-380ms apart, block durations SHRINKING as the stack
// fills, so it accumulates at a constant visual speed instead of decelerating.
const CLUB_AT = [500, 2000, 3320, 4520];
const CLUB_DUR = [983, 897, 826, 766];
const CAM_CLOSE = 1.16;

const AnswerBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;

  // Camera as a LAYOUT resize, never a transform. See the header.
  const camP = interpolate(ms, [CLUB_AT[1], CLUB_AT[3] + 900], [0, 1], {
    easing: EASE.outExpo, extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const k = CAM_CLOSE + (1 - CAM_CLOSE) * camP;
  const z = (v: number) => v * k;

  const leadP = interpolate(ms, [0, 864], [0, 1], {
    easing: EASE.outExpo, extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: z(BUBBLE_W),
            padding: z(PAD),
            borderRadius: z(UI.radius),
            borderTopLeftRadius: z(10),
            background: UI.cardGlass,
            border: `1px solid ${UI.rule}`,
            boxShadow: UI.shadow,
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          <div
            style={{
              height: z(LEAD_H), marginBottom: z(LEAD_MB),
              fontSize: z(34), fontWeight: 400, color: UI.ink, opacity: leadP,
            }}
          >
            Four of the 27. Here is what each one actually gets you.
          </div>
          {CLUBS.map((c, i) => {
            if (ms < CLUB_AT[i]) return null;
            const p = interpolate(ms, [CLUB_AT[i], CLUB_AT[i] + CLUB_DUR[i]], [0, 1], {
              easing: EASE.outExpo, extrapolateLeft: "clamp", extrapolateRight: "clamp",
            });
            return (
              <div key={c.name} style={{ marginBottom: i < CLUBS.length - 1 ? z(BLOCK_GAP) : 0, opacity: p }}>
                <div style={{ height: z(NAME_H), fontSize: z(35), fontWeight: 650, color: UI.ink, letterSpacing: "-0.01em" }}>
                  {c.name}
                </div>
                <div style={{ height: z(WHY_H), fontSize: z(28), fontWeight: 400, color: UI.ink, lineHeight: 1.5 }}>
                  {c.why}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <Vignette warm={false} strength={0.45} grain={false} />
    </AbsoluteFill>
  );
};

// ── The loop ────────────────────────────────────────────────────────────────
export const ClubsVideo: React.FC = () => {
  const T = () => (
    <TransitionSeries.Transition
      presentation={fade({ shouldFadeOutExitingScene: true })}
      timing={springTiming({ config: { damping: 200 }, durationInFrames: DISSOLVE, durationRestThreshold: 0.001 })}
    />
  );
  return (
    // The page gradient lives HERE and only here. Inside a beat it flickered.
    <AbsoluteFill style={{ background: PRODUCT_BG }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={f(BEATS.field)}>
          <FieldBeat />
        </TransitionSeries.Sequence>
        {T()}
        <TransitionSeries.Sequence durationInFrames={f(BEATS.narrow)}>
          <NarrowBeat />
        </TransitionSeries.Sequence>
        {T()}
        <TransitionSeries.Sequence durationInFrames={f(BEATS.ask)}>
          <AskBeat />
        </TransitionSeries.Sequence>
        {T()}
        <TransitionSeries.Sequence durationInFrames={f(BEATS.answer)}>
          <AnswerBeat />
        </TransitionSeries.Sequence>
        {T()}
        {/* Bare ground, so the wrap point is ground -> ground and the loop has
            no visible seam. A CTA card would break the loop; at a booth the QR
            lives on the table and there is a person standing next to it. */}
        <TransitionSeries.Sequence durationInFrames={f(BEATS.tail)}>
          <AbsoluteFill>
            <Vignette warm={false} strength={0.45} grain={false} />
          </AbsoluteFill>
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
