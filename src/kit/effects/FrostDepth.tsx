/**
 * Frost depth (2026-11-26, from Halmarr's JustPaid SaaS film, Muse Nov 26; Jacob: "I love this vid"). Read frame by
 * frame (Lucius's watch notes, Nov 26); our own build. What he liked is the look:
 *   - a warm mesh gradient world, peach and pink drifting into violet, never a flat ground (MeshWorld)
 *   - frosted glass cards floating at different depths, the near ones larger and softer, all drifting toward the camera
 *     with parallax (FrostCard)
 *   - giant type set beside a tilted device, one accent word in the deep colour (8.8 to 10.4 s)
 * The cards hold real crops of the product inside the glass. Worked example: FrostDepth-Proof-9x16 (src/phonewalk/).
 */
import React from "react";
import { AbsoluteFill, Img } from "remotion";

/** Peach, pink and violet blobs that slowly drift; `t` is frames. */
export const MeshWorld: React.FC<{ t: number; tint?: "warm" | "berry" }> = ({ t, tint = "warm" }) => {
  const c = tint === "warm"
    ? ["#ffc9a8", "#ff9fb8", "#c9a2ff", "#ffb3c7", "#f6e3ff"]
    : ["#ffb59c", "#ff7f9d", "#b07cff", "#ff9fb5", "#f3d9ff"];
  const blob = (i: number, x: number, y: number, r: number, col: string) => {
    const dx = Math.sin(t / 70 + i * 1.7) * 60;
    const dy = Math.cos(t / 85 + i * 2.3) * 50;
    return <div key={i} style={{ position: "absolute", left: x + dx - r, top: y + dy - r, width: r * 2, height: r * 2, borderRadius: "50%", background: col, filter: "blur(120px)", opacity: 0.95 }} />;
  };
  return (
    <AbsoluteFill style={{ background: "#f7dfe6", overflow: "hidden" }}>
      {blob(0, 160, 300, 520, c[0])}
      {blob(1, 920, 640, 560, c[1])}
      {blob(2, 820, 1500, 620, c[2])}
      {blob(3, 160, 1350, 480, c[3])}
      {blob(4, 540, 960, 300, c[4])}
      <AbsoluteFill style={{ background: "radial-gradient(90% 60% at 50% 50%, rgba(255,255,255,0.18), rgba(255,255,255,0) 70%)" }} />
    </AbsoluteFill>
  );
};

/**
 * A frosted glass card at depth `z` (px toward the camera inside a perspective parent), holding a real crop.
 * `drift` 0 to 1 moves it toward the camera by `travel`, the JustPaid parallax.
 */
export const FrostCard: React.FC<{
  x: number; y: number; z: number; w: number; src: string; ratio: number; drift: number; travel?: number; rz?: number; ry?: number; opacity?: number; pad?: number;
}> = ({ x, y, z, w, src, ratio, drift, travel = 380, rz = 0, ry = 0, opacity = 1, pad = 18 }) => {
  const zz = z + drift * travel;
  // depth of field: cards far from the focus plane (z = 0) go soft
  const soft = Math.min(10, Math.abs(zz) / 55);
  const h = w / ratio;
  return (
    <div style={{ position: "absolute", left: x - (w + pad * 2) / 2, top: y - (h + pad * 2) / 2, width: w + pad * 2, height: h + pad * 2, borderRadius: 34, padding: pad,
      transform: `translateZ(${zz.toFixed(1)}px) rotateZ(${rz}deg) rotateY(${ry}deg)`, opacity, filter: soft > 0.6 ? `blur(${soft.toFixed(1)}px)` : undefined,
      background: "linear-gradient(150deg, rgba(255,255,255,0.62), rgba(255,255,255,0.28))", backdropFilter: "blur(22px)",
      boxShadow: "0 30px 70px rgba(120,60,110,0.22), inset 0 0 0 2px rgba(255,255,255,0.65)" }}>
      <Img src={src} style={{ width: w, height: h, borderRadius: 18, display: "block", boxShadow: "0 6px 18px rgba(40,10,30,0.25)" }} />
    </div>
  );
};
