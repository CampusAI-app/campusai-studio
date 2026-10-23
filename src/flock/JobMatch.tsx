/**
 * Scene 3, round 4: into Job Match (Jacob: instead of the three screens again, "it goes into the
 * job match and shows some job match").
 *
 * The camera lands on the real Job Match page at a tilt and glides to the Deloitte card. On the
 * beat the card lifts off its slot toward camera (the pop-out Jacob liked in `spotlight-hero-card`)
 * while the page flattens and dims under it, its empty slot left dark. Then the card rides up and
 * the real detail panel (title, Strong match, Apply / Tailor resume / Saved, Why this fits you)
 * rises beneath it. The tumble that follows uses three real job cards, see Tumble.tsx.
 * Captures: `flock/jobs.jpg` (capture/flock-film.cjs), `flock/parts/job.png` and `detail.png`
 * (capture/flock-components.cjs).
 */
import React from "react";
import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame } from "remotion";
import { EASE, Grain, Vignette, mix, ramp } from "../shots/_fixtures/Polish";
import { B, FPS, TOUR_END } from "./beats";
import { TUMBLE_START } from "./Tumble";

const SX = 540;
const SY = 820;
const CARD = { x: 269, y: 275, w: 436, h: 158 }; // Deloitte, on the 1440x900 page
const CARD_C = { x: CARD.x + CARD.w / 2, y: CARD.y + CARD.h / 2 };
const LIFT_AT = B(19);
const PANEL_AT = B(21);
const DETAIL = { w: 666, h: 520 };

export const JobMatch: React.FC = () => {
  const f = useCurrentFrame();
  const inK = ramp(f, TOUR_END - 6, 8, EASE.out);
  const out = ramp(f, TUMBLE_START - 5, 5, EASE.exit);
  const glide = ramp(f, TOUR_END - 6, LIFT_AT - TOUR_END + 10, EASE.smooth);
  const lift = f < LIFT_AT ? 0 : spring({ frame: f - LIFT_AT, fps: FPS, config: { damping: 15, stiffness: 120 } });
  const flat = ramp(f, LIFT_AT, 20, EASE.smooth);
  const panel = f < PANEL_AT ? 0 : spring({ frame: f - PANEL_AT, fps: FPS, config: { damping: 18, stiffness: 120 } });

  // camera on the page: from the header toward the Deloitte card, tilt easing out as the card lifts
  const cx = mix(760, CARD_C.x, glide);
  const cy = mix(170, CARD_C.y, glide) + panel * 190; // camera drops below the card so it rides up the frame
  const s = mix(1.55, 1.9, glide);
  const rx = mix(mix(30, 20, glide), 0, flat);
  const ry = mix(mix(-18, -10, glide), 0, flat);
  const rz = mix(mix(4, 2, glide), 0, flat);
  const z = lift * 230;
  const dim = 0.55 * flat;

  return (
    <AbsoluteFill style={{ background: "#0b0708", opacity: inK * (1 - out) }}>
      <AbsoluteFill style={{ perspective: 1200, perspectiveOrigin: `${SX}px ${SY}px` }}>
        <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transformStyle: "preserve-3d",
          transform: `translate(${SX}px, ${SY}px) scale(${s.toFixed(4)}) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) rotateZ(${rz.toFixed(3)}deg) translate(${(-cx).toFixed(2)}px, ${(-cy).toFixed(2)}px)` }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 1440, height: 900, transformStyle: "preserve-3d" }}>
            <Img src={staticFile("flock/jobs.jpg")} style={{ position: "absolute", inset: 0, width: 1440, height: 900, display: "block" }} />
            <div style={{ position: "absolute", inset: 0, background: "#0b0708", opacity: dim }} />
            {lift > 0.001 && (
              <>
                {/* the slot it left, and its shadow on the page */}
                <div style={{ position: "absolute", left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, borderRadius: 12, background: "#140d0f",
                  boxShadow: "inset 0 0 0 1px rgba(255,140,140,0.12)" }} />
                <div style={{ position: "absolute", left: CARD.x + 10 + z * 0.05, top: CARD.y + 16 + z * 0.12, width: CARD.w - 20, height: CARD.h - 20, borderRadius: 14,
                  background: "rgba(0,0,0,0.7)", filter: `blur(${(8 + z * 0.12).toFixed(1)}px)` }} />
                <div style={{ position: "absolute", left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, borderRadius: 12, overflow: "hidden",
                  transform: `translateZ(${z.toFixed(2)}px)`, boxShadow: `0 0 ${(40 * lift).toFixed(1)}px rgba(217,32,46,${(0.45 * lift).toFixed(3)})` }}>
                  <Img src={staticFile("flock/parts/job.png")} style={{ width: CARD.w, height: CARD.h, display: "block" }} />
                </div>
              </>
            )}
          </div>
        </div>
      </AbsoluteFill>
      {/* the detail panel rises under the lifted card, flat on screen */}
      {panel > 0 && (
        <div style={{ position: "absolute", left: SX - 450, top: mix(1920, 1150, panel), width: 900, height: (900 * DETAIL.h) / DETAIL.w,
          borderRadius: 26, overflow: "hidden", opacity: Math.min(1, panel * 1.5),
          boxShadow: "0 0 0 1.5px rgba(255,140,140,0.2), 0 0 80px rgba(217,32,46,0.3), 0 40px 90px rgba(0,0,0,0.7)" }}>
          <Img src={staticFile("flock/parts/detail.png")} style={{ width: 900, height: (900 * DETAIL.h) / DETAIL.w, display: "block" }} />
        </div>
      )}
      <Vignette strength={0.45} inner={0.5} color="#060304" />
      <Grain opacity={0.06} blend="soft-light" />
    </AbsoluteFill>
  );
};
