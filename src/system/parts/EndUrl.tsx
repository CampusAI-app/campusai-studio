/**
 * end-url (2026-10-23): the end card. The real CampusAI logo (public/brand/campusai-logo-white.svg,
 * through the kit LogoEnd: a focus pull, then a hold that keeps breathing) with "campusai.app" in
 * Inter below it, or "Link in bio" when the storyboard's `end.instagram` is true (rules.json `end`).
 * Held for `end.hold` seconds and never fully still. The last product shot carries into it: its page
 * shrinks into the logo's place and lets go as the logo lands (Jacob: end by turning something into
 * the logo).
 *
 * Props (on a shot that names this part, or none when Film adds it from `end`):
 *   text?: string    override the line under the logo (it still has to pass the checker).
 */
import React from "react";
import { interpolate, useVideoConfig } from "remotion";
import { LogoEnd } from "../../kit/LogoMoment";
import { INTER } from "../../kit/parts";
import { CURVE, DUR, DRIFT } from "../motion";
import rules from "../rules.json";
import { clamp, ramp, SurfaceView } from "./common";
import type { PartProps } from "./types";

export const EndUrl: React.FC<PartProps> = ({ brand, f, layout, props, ctx }) => {
  const { fps } = useVideoConfig();
  const { W, safe, u } = layout;
  const logoW = Math.min(W * 0.5, 560 * u);
  const ratio = brand.logo?.ratio ?? 4;
  const cx = W / 2;
  const cy = safe.y + safe.h * 0.46;
  const line = typeof props.text === "string" ? props.text : ctx.board.end.instagram ? rules.end.instagram : rules.end.url;

  // the carry: the last product view shrinks into the logo's box and lets go as the logo lands
  const prev = ctx.prev;
  const c = ramp(f, 0, DUR.arrive + 4, CURVE.showy.enter);
  const v = layout.view;
  const logoBox = { x: cx - logoW / 2, y: cy - logoW / ratio / 2, w: logoW, h: logoW / ratio };
  const shrink = { x: v.x + (logoBox.x - v.x) * c, y: v.y + (logoBox.y - v.y) * c, w: v.w + (logoBox.w - v.w) * c, h: v.h + (logoBox.h - v.h) * c };
  const prevOut = 1 - ramp(f, DUR.panel, DUR.arrive + 6, CURVE.quiet.exit);

  const textIn = ramp(f, DUR.arrive, DUR.arrive + DUR.arrive, CURVE.quiet.enter);
  const breathe = interpolate(f, [DUR.arrive * 2, DUR.arrive * 2 + fps * 4], [0, DRIFT.scalePerSecond * 4], clamp);
  return (
    <>
      {prev?.surface && prevOut > 0.01 ? (
        <div style={{ position: "absolute", inset: 0, opacity: prevOut, filter: c > 0.4 ? `blur(${((c - 0.4) * 14).toFixed(2)}px)` : undefined }}>
          <SurfaceView surface={prev.surface} brand={brand} layout={layout} cam={prev.cam} view={shrink} dim={0.5 * c}
            radius={layout.radius * (1 - c) + 10 * u * c} />
        </div>
      ) : null}
      <LogoEnd brand={brand} at={Math.round(DUR.panel * 0.5)} x={cx} y={cy} width={logoW} />
      <div style={{ position: "absolute", left: 0, width: W, top: cy + logoW / ratio / 2 + 54 * u, textAlign: "center",
        fontFamily: INTER, fontWeight: 600, fontSize: 46 * u, letterSpacing: "-0.01em", color: brand.color.ink,
        opacity: textIn * 0.92, transform: `translateY(${((1 - textIn) * 18 * u).toFixed(2)}px) scale(${(1 + breathe).toFixed(4)})` }}>
        {line}
      </div>
    </>
  );
};
