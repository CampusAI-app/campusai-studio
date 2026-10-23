/**
 * Raylight-style hero still.
 *
 * A new OUTPUT TYPE for this studio, not a new film. Everything here renders to
 * a single PNG via `npm run still`, which costs one frame instead of a render.
 *
 * Harvested from raylight.app's 2026-09-14 post ("Not just for video. Stills are
 * just as cool"): a hard-tilted device, cropped so it bleeds off the frame, lit
 * by one specular source, with UI rows LIFTED OFF the screen plane. Five
 * techniques, and the fifth is the one that actually sells it:
 *
 *   1. REAL PERSPECTIVE, not a skew. One perspective context, the device pitched
 *      inside it. A 2D skew of a screenshot reads as a sticker; a perspective
 *      projection reads as an object in a room.
 *   2. ROWS LIFTED OFF THE GLASS. The featured row sits above the UI and casts
 *      down onto it. This is what stops it being a photo of a phone and makes
 *      it a picture of software.
 *
 *      IMPLEMENTED AS SCALE + SHADOW, NOT translateZ, and that is load-bearing.
 *      A true Z lift needs `transformStyle: preserve-3d` on every ancestor, and
 *      preserve-3d CONTRADICTS the `overflow: hidden` a phone screen needs to
 *      clip its own content. Chrome resolves that conflict by flattening some
 *      layers and not others, so element BACKGROUNDS rendered at a different
 *      depth from their own TEXT — boxes visibly detached from the words inside
 *      them. It only appeared under rotation, which is why the orthographic
 *      render looked perfect while the real shot looked broken, and why the
 *      first three attempts to fix it by re-tuning the CAMERA all failed.
 *      General rule: overflow:hidden and preserve-3d on one subtree is a bug,
 *      and a still has no reason to pay for real Z anyway.
 *   3. ONE HARD LIGHT. A specular hot spot travelling the bezel, plus a soft
 *      volumetric streak in the empty background. Nothing else is lit.
 *   4. FALLOFF, NOT A VIGNETTE BOX. Focus and brightness decay toward the
 *      bottom-right so the eye lands top-left, where the message is.
 *   5. THE COPY IS THE AD. Raylight's fake inbox said "Just hit 100K MRR in 3
 *      months" — product UI as the medium, the pitch as the content. Ours says
 *      what CampusAI does, in a student's words.
 *
 * ON HONESTY: every value on this screen is fabricated, and that is safe here
 * for one specific reason — this composition owns BOTH halves of its data. It
 * renders nothing shared, fetches nothing, and joins to no live catalogue, so
 * there is no live-data half to silently disagree with it (the PR #337 trap).
 * If a hero still ever renders a real product component, that stops being true.
 *
 * Colours are the product's own dark tokens, imported from ChatVideo rather
 * than re-typed, so a token change moves the still too.
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { UI } from "./ChatVideo";

/* ── The dial. Everything art-directable lives here. ─────────────────────── */
export const HERO = {
  /** Header of the surface being shown. */
  title: "CampusAI",

  /**
   * The rows. `lift` is the height above the glass in px — 0 sits ON the
   * screen, anything higher floats and casts.
   *
   * KEEP LIFTS SMALL, around 15-25. A translateZ moves the row toward the
   * camera, and under perspective that DISPLACES it, not just enlarges it.
   * At lift 40 the displacement was bigger than a row height and the floating
   * cards collided with their neighbours — it read as a broken list, not a
   * layered one. Depth is sold by the SHADOW and the edge, not by distance.
   *
   * And lift exactly ONE row. Raylight's own shot floats a single message;
   * two competing hero cards is just clutter with a gradient on it.
   */
  rows: [
    { who: "Career", text: "3 roles opened that match your resume", when: "1h", lift: 0, tone: "mute" },
    { who: "Events", text: "Goldman is on campus Thursday. You have no class.", when: "1h", lift: 22, tone: "ink" },
    { who: "Academics", text: "Take STAT400 next fall or you graduate late", when: "2h", lift: 0, tone: "ink" },
    { who: "Clubs", text: "Smith Investment Fund is recruiting sophomores", when: "3h", lift: 0, tone: "mute" },
    { who: "Advising", text: "Your degree audit is 4 credits short", when: "5h", lift: 0, tone: "mute" },
  ],

  /** Camera. Degrees. Raylight's own shot is roughly -13 / 17 / -9. */
  tilt: { x: -13, y: 17, z: -9 },
  /**
   * A LONGER lens than feels natural, and the perspective origin sits on the
   * device rather than up in the corner with the light. Both exist to control
   * one thing: how far a lifted row DISPLACES. Short lens + far-off vanishing
   * point threw the floating card a whole row clear of its own text.
   */
  perspective: 3400,
  perspectiveOrigin: "50% 46%",
  /**
   * Where the device sits. It is SUPPOSED to bleed off the right and the
   * bottom — but its TOP-LEFT CORNER has to stay in frame. That corner is the
   * whole shot: it carries the bezel, the specular hit and the status bar, and
   * without it the rows read as floating cards rather than as software running
   * on a phone. First pass had scale 1.34 and lost the device completely.
   */
  offset: { x: 120, y: 330, scale: 0.8 },
} as const;

/* ── Ground: near-black, one light, and the falloff ───────────────────────── */
const Ground: React.FC = () => (
  <>
    <AbsoluteFill style={{ background: "#050506" }} />
    {/* The volumetric streak. A single soft source from beyond the top-left
        corner, which is what puts the specular on the bezel below. */}
    <AbsoluteFill
      style={{
        background: [
          "linear-gradient(142deg, rgba(255,255,255,0.19) 0%, rgba(255,255,255,0.05) 13%, transparent 34%)",
          "radial-gradient(ellipse 60% 45% at 6% 2%, rgba(255,255,255,0.13) 0%, transparent 60%)",
        ].join(", "),
      }}
    />
    {/* A breath of the product's red, so the still belongs to CampusAI and not
        to a generic dark-mode mockup. Deliberately far below the light. */}
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse 70% 55% at 88% 96%, rgba(226,24,51,0.17) 0%, transparent 64%)",
      }}
    />
  </>
);

/** Focus and brightness decay toward the bottom-right. Sits ABOVE the device. */
const Falloff: React.FC = () => (
  <AbsoluteFill
    style={{
      // Restrained on purpose. The first pass ran 0.62/0.72 and swallowed the
      // whole frame — a falloff that eats the subject is just underexposure.
      background: [
        "radial-gradient(ellipse 95% 85% at 26% 20%, transparent 0%, rgba(5,5,6,0.34) 82%)",
        "linear-gradient(160deg, transparent 52%, rgba(5,5,6,0.46) 96%)",
      ].join(", "),
      pointerEvents: "none",
    }}
  />
);

/* ── One message row ──────────────────────────────────────────────────────── */
const Row: React.FC<{ row: (typeof HERO.rows)[number]; index: number }> = ({ row, index }) => {
  const lifted = row.lift > 0;
  return (
    <div
      style={{
        // Elevation is carried by the SHADOW and the edge, with only a token
        // scale. Two reasons. A real translateZ needs preserve-3d on every
        // ancestor, which contradicts the overflow:hidden the screen needs to
        // clip its own content. And any large scale pushes the card past that
        // clip, so it loses its right-hand corner and bleeds off the glass —
        // which is what 1.11 did. Real UI elevation works this way too.
        transform: lifted ? `scale(${1 + row.lift * 0.001})` : undefined,
        display: "flex",
        alignItems: "center",
        gap: 30,
        padding: "26px 34px",
        marginBottom: 22,
        borderRadius: lifted ? 26 : 0,
        // A lifted row becomes its own object: its own ground, its own edge,
        // and a shadow long enough to prove the gap it is sitting above.
        background: lifted ? UI.card : "transparent",
        border: lifted ? `1px solid ${UI.rule}` : "1px solid transparent",
        // A floor plus a term, so a deliberately small lift still reads as a
        // card hovering rather than a card sitting.
        boxShadow: lifted
          ? `0 ${18 + row.lift}px ${44 + row.lift * 2}px rgba(0,0,0,0.80), 0 3px 8px rgba(0,0,0,0.6)`
          : "none",
      }}
    >
      <div
        style={{
          width: 86,
          height: 86,
          borderRadius: "50%",
          flex: "none",
          // Category discs rather than face photos: a hero still with invented
          // students on it is a different and worse kind of fabrication.
          background:
            index % 2 === 0
              ? `linear-gradient(145deg, ${UI.red} 0%, #7C0F1D 100%)`
              : `linear-gradient(145deg, #2A1D21 0%, #140E10 100%)`,
          border: `1px solid ${UI.rule}`,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: row.tone === "ink" ? UI.ink : "rgba(242,241,239,0.72)",
            fontSize: 38,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            marginBottom: 8,
          }}
        >
          {row.who}
        </div>
        <div
          style={{
            color: row.tone === "ink" ? "rgba(242,241,239,0.82)" : UI.mute,
            fontSize: 34,
            fontWeight: 450,
            letterSpacing: "-0.005em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {row.text}
        </div>
      </div>
      <div style={{ color: UI.mute, fontSize: 30, flex: "none" }}>{row.when}</div>
    </div>
  );
};

/* ── The device ───────────────────────────────────────────────────────────── */
const Device: React.FC = () => (
  <div
    style={{
      position: "relative",
      width: 1180,
      height: 2200,
      borderRadius: 104,
      background: "#0B0B0D",
      // The bezel. A 1px inner edge plus a bright top-left arc is the whole
      // specular — the light in Ground is coming from exactly there.
      border: "2px solid rgba(255,255,255,0.10)",
      boxShadow: [
        "inset 0 2px 1px rgba(255,255,255,0.30)",
        "inset 2px 0 1px rgba(255,255,255,0.16)",
        "0 80px 200px rgba(0,0,0,0.9)",
      ].join(", "),
      padding: 22,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 22,
        borderRadius: 84,
        background: UI.bg,
        padding: "74px 34px 0",
        overflow: "hidden",
      }}
    >
      {/* Status bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 30px 40px",
          color: UI.ink,
          fontSize: 34,
          fontWeight: 600,
        }}
      >
        <span>3:03</span>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 34, height: 16, borderRadius: 3, background: "rgba(242,241,239,0.8)" }} />
          <div style={{ width: 44, height: 20, borderRadius: 5, border: `2px solid rgba(242,241,239,0.6)` }} />
        </div>
      </div>

      <div
        style={{
          textAlign: "center",
          color: UI.ink,
          fontSize: 46,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          marginBottom: 34,
        }}
      >
        {HERO.title}
      </div>

      {/* Search */}
      <div
        style={{
          height: 96,
          borderRadius: 26,
          background: "rgba(255,255,255,0.05)",
          border: `1px solid ${UI.rule}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: UI.mute,
          fontSize: 34,
          marginBottom: 30,
        }}
      >
        Ask anything
      </div>

      <div>
        {HERO.rows.map((row, i) => (
          <Row key={row.who} row={row} index={i} />
        ))}
      </div>
    </div>
  </div>
);

export const HeroStill: React.FC = () => (
  <AbsoluteFill>
    <Ground />
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        perspective: HERO.perspective,
        // The vanishing point. Deliberately NOT co-located with the light —
        // the light is painted in Ground and owes nothing to the camera.
        perspectiveOrigin: HERO.perspectiveOrigin,
      }}
    >
      <div
        style={{
          transform: [
            `translate(${HERO.offset.x}px, ${HERO.offset.y}px)`,
            `scale(${HERO.offset.scale})`,
            `rotateX(${HERO.tilt.x}deg)`,
            `rotateY(${HERO.tilt.y}deg)`,
            `rotateZ(${HERO.tilt.z}deg)`,
          ].join(" "),
        }}
      >
        <Device />
      </div>
    </AbsoluteFill>
    <Falloff />
  </AbsoluteFill>
);
