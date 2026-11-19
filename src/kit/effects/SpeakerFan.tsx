/**
 * Speaker fan (2026-11-18, ours, from @eightsenses.media's reel "ALL OF THIS, 4 speakers one skill",
 * instagram.com/reel/Df5QrYGkgiR, Muse Nov 18). The reel's own format as an opener for a series: tall cards fanned and
 * tilted in 3D, overlapping, each playing a different clip edited in the same house look, the fan drifting slowly, a
 * short headline above. It shows the point of a house look in one frame: different people, one show.
 *
 * Each card is a full `HouseEdit` drawn at the composition's size and scaled down, so a card is exactly the clip as it
 * would post. Cards are flat layers each with their own `perspective()` turn (no shared preserve-3d), so overlapping
 * cards stack cleanly instead of cutting through each other. They arrive from one stack and spread out with a spring,
 * 3 frames apart; the whole fan then sways on a 6 s cycle. Card sound is off; the kit's music bed plays under it.
 *
 * Props: `look`, `clips` (HouseEditProps without `look`; 2 to 5 read best), `headline` (`lead` in the look's sans,
 * `accent` after it in the look's italic serif; our own words, so keep it a title, never a quote), `cardWidth` (px),
 * `sound`.
 *
 *   <SpeakerFan look={houseLook("violet")} clips={[a, b, c, d]} headline={{ lead: "Four clips,", accent: "one look" }} />
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Bed, OUT, clampX, k, mix } from "./shared";
import { HOUSE_FAMILY, HouseEdit, HouseEditProps } from "./HouseEdit";
import type { HouseLook } from "./houseLook";

export type SpeakerFanProps = {
  look: HouseLook;
  clips: Omit<HouseEditProps, "look">[];
  headline: { lead: string; accent?: string };
  cardWidth?: number;
  sound?: boolean;
};

export const SpeakerFan: React.FC<SpeakerFanProps> = (p) => {
  const f = useCurrentFrame();
  const { width: W, height: H, fps, durationInFrames } = useVideoConfig();
  const L = p.look;
  const n = p.clips.length;
  const cw = p.cardWidth ?? Math.round(W * 0.43);
  const scale = cw / W;
  const chh = H * scale;
  const fanY = H * 0.57;

  // the slow sway: a 6 s cycle, plus a gentle push across the whole piece
  const t = f / fps;
  const sway = Math.sin((t / 6) * Math.PI * 2 - 0.6);
  const push = interpolate(f, [0, durationInFrames], [1, 1.035], clampX);

  const cards = p.clips.map((clip, i) => {
    const u = n === 1 ? 0 : (i - (n - 1) / 2) / ((n - 1) / 2); // -1 (left) to 1 (right)
    const e = spring({ frame: f - 2 - i * 3, fps, config: { damping: 17, stiffness: 105, mass: 0.9 } });
    const o = k(f, 1 + i * 3, 7 + i * 3, OUT);
    const x = mix(0, u * W * 0.27, e) + sway * 16;
    const y = mix(140, Math.abs(u) ** 1.6 * 70, e);
    const rotZ = mix(0, u * 8.5, e) + sway * 1.2;
    const rotY = mix(0, -u * 20, e) + sway * 7;
    const rotX = mix(10, 6, e);
    const sc = mix(0.86, 1 - 0.05 * Math.abs(u), e) * push;
    // inner cards above outer ones; of the inner pair, the right one on top
    const z = Math.round(100 - Math.abs(u) * 50 + (u > 0 ? 1 : 0));
    return { clip, i, x, y, rotZ, rotY, rotX, sc, o, z };
  });

  const headIn = k(f, 8, 22, OUT);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: `radial-gradient(ellipse 120% 80% at 50% 62%, ${L.palette.ground[2]} 0%, ${L.palette.ground[1]} 45%, ${L.palette.ground[0]} 100%)` }}>
      <Bed total={durationInFrames} on={p.sound ?? true} volume={0.32} />
      {/* a soft pool of the accent under the fan */}
      <div style={{ position: "absolute", left: W / 2 - W * 0.6, top: fanY - H * 0.12, width: W * 1.2, height: H * 0.5, borderRadius: "50%",
        background: `radial-gradient(ellipse at 50% 50%, ${L.palette.accent}2e 0%, ${L.palette.accent}00 62%)`, opacity: k(f, 4, 30) }} />

      <div style={{ position: "absolute", left: W * 0.08, width: W * 0.84, top: H * 0.115, textAlign: "center",
        opacity: headIn, transform: `translateY(${(1 - headIn) * 26}px)`, filter: headIn < 1 ? `blur(${((1 - headIn) * 10).toFixed(2)}px)` : undefined,
        color: L.palette.ink, fontFamily: HOUSE_FAMILY[L.caption.font], fontWeight: 600, fontSize: 76, letterSpacing: "-0.035em", lineHeight: 1.05 }}>
        {p.headline.lead}
        {p.headline.accent ? (
          <>
            {" "}
            <span style={{ fontFamily: HOUSE_FAMILY[L.serif.font], fontStyle: "italic", fontWeight: 400, color: L.palette.accent, fontSize: 76 * L.serif.scale, letterSpacing: "-0.01em" }}>
              {p.headline.accent}
            </span>
          </>
        ) : null}
      </div>

      {cards
        .slice()
        .sort((a, b) => a.z - b.z)
        .map((c) => (
          <div key={c.i} style={{ position: "absolute", left: W / 2 - cw / 2 + c.x, top: fanY - chh / 2 + c.y, width: cw, height: chh, zIndex: c.z,
            opacity: c.o, transform: `perspective(2400px) rotateX(${c.rotX.toFixed(3)}deg) rotateY(${c.rotY.toFixed(3)}deg) rotateZ(${c.rotZ.toFixed(3)}deg) scale(${c.sc.toFixed(4)})`,
            borderRadius: 30, overflow: "hidden", boxShadow: "0 40px 90px rgba(0,0,0,0.5), 0 10px 24px rgba(0,0,0,0.3)" }}>
            <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: `scale(${scale.toFixed(5)})` }}>
              <HouseEdit {...c.clip} look={L} width={W} height={H} volume={0} sound={false} />
            </div>
            <div style={{ position: "absolute", inset: 0, borderRadius: 30, boxShadow: `inset 0 0 0 2px ${L.ring}55` }} />
          </div>
        ))}
    </AbsoluteFill>
  );
};
