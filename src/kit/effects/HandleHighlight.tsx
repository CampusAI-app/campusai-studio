/**
 * HandleHighlight (2026-11-24, Muse): a phrase or a piece of UI marked the way a design tool marks a selected object:
 * a box with tiny square handles at its four corners. From bemx.studio's RunInfra launch film
 * (instagram.com/reel/DgGtZyFKcLY): on every slide ONE phrase sits in an accent box with corner handles, and each UI
 * fragment on a slide is framed by the same four handles with no fill.
 *
 *  - `fill` set (the accent): a highlight. The box wipes in from the left as `reveal` goes 0 to 1, the handles pop in.
 *  - `fill={null}`: a frame. A hairline in the accent plus the handles, around whatever is inside (a real capture).
 * `reveal` is driven by the film, so it can ease and scrub.
 */
import React from "react";

export type HandleHighlightProps = {
  reveal?: number;
  fill?: string | null;
  /** Text colour inside a filled box. */
  ink?: string;
  /** Handle colour, and the frame's hairline. */
  handle?: string;
  handleSize?: number;
  /** Inner padding, [vertical, horizontal] px. */
  pad?: [number, number];
  /** How far the handles sit outside the box corner, px. */
  offset?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const HandleHighlight: React.FC<HandleHighlightProps> = ({
  reveal = 1,
  fill = "#D9202E",
  ink = "#FFFFFF",
  handle = "#D9202E",
  handleSize = 11,
  pad = [4, 14],
  offset = 3,
  style,
  children,
}) => {
  const r = clamp01(reveal);
  const box = clamp01(r / 0.75); // the fill wipes over the first three quarters
  const pop = clamp01((r - 0.45) / 0.55); // handles land at the end
  const popScale = pop === 0 ? 0 : 0.4 + 0.6 * pop + Math.sin(pop * Math.PI) * 0.25;
  const corners: [string, string][] = [["0%", "0%"], ["100%", "0%"], ["100%", "100%"], ["0%", "100%"]];
  return (
    <span style={{ position: "relative", display: "inline-block", padding: `${pad[0]}px ${pad[1]}px`, color: fill ? ink : undefined, ...style }}>
      {fill ? (
        <span style={{ position: "absolute", inset: 0, background: fill, clipPath: `inset(0 ${(1 - box) * 100}% 0 0)` }} />
      ) : (
        <span style={{ position: "absolute", inset: 0, border: `1.5px solid ${handle}`, opacity: 0.55 * box }} />
      )}
      <span style={{ position: "relative" }}>{children}</span>
      {corners.map(([x, y], i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `calc(${x} + ${x === "0%" ? -offset : offset}px)`,
            top: `calc(${y} + ${y === "0%" ? -offset : offset}px)`,
            width: handleSize,
            height: handleSize,
            background: handle,
            outline: "1.5px solid rgba(255,255,255,0.9)",
            transform: `translate(-50%,-50%) scale(${popScale})`,
          }}
        />
      ))}
    </span>
  );
};
