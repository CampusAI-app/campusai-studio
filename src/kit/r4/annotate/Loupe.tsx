/**
 * Loupe (round 4, 2026-10-25): a round magnifier that glides over a real page to a piece of small text (a
 * reason line, a moved due date) and enlarges it so it reads, while the page under it stays where it is and
 * dims a little. Between stops the glass relaxes toward plain glass, travels, and magnifies again on arrival.
 *
 * The magnification is LAYOUT, never transform: scale. Inside the glass the page image is laid out at
 * `zoom` canvas px per page px, positioned so the page point under the lens centre sits at the lens centre.
 * At zoom = the view's own scale the glass shows exactly what is beneath it (clear glass), so magnifying is
 * a smooth widening of that same image, with no seam.
 *
 * Where it came from: the dictionary's "magnifier / loupe reveal" (a lens tracks over a surface and
 * enlarges what it passes), with Raylight's "manicule" timing for the travel: arrive early, hold, release.
 * Numbers (30 fps):
 * - enters from `from` over 30 frames at 55% size and clear glass, growing to full size on the way,
 * - travel 30 frames on EASE_CAMERA along a slight arc (8% of the distance), the zoom falling to 45% of
 *   its gain mid-travel and rising back over the last 40%,
 * - zoom default 1.9 canvas px per page px: under the capture's DPR 2, so magnified text stays crisp,
 * - the page under it dims to 0.28 (PageView: brightness 0.8, blur 0.8 px) while the lens is out,
 * - leaves by shrinking into its last stop over 16 frames as the zoom returns to clear glass,
 * - the glass: a 2 px light rim, an inner bevel shadow, a soft top-left sheen and a drop shadow.
 */
import React from "react";
import { Img, interpolate, useCurrentFrame } from "remotion";
import type { Brand } from "../../brand";
import { useBrandFonts } from "../../brand";
import type { PageCam, Rect, Size } from "../../camera";
import { toCanvas } from "../../camera";
import { PageView } from "../../PageView";
import { EASE, EASE_CAMERA } from "../../../lib/anim";
import type { MarkPatchSpec } from "../../pass/camera/shared";
import { MarkPatch } from "../../pass/camera/shared";
import { CaptionBand, clamp } from "./shared";

type Pt = { x: number; y: number };

export type LoupeStop = {
  /** The centre of the text to read, page px. */
  point: Pt;
  /** Frame the glass arrives (fully magnified). */
  at: number;
  /** Frames held there. */
  hold: number;
  /** Optional line in the caption band below the view, real strings only. */
  line?: string;
};

export type LoupeProps = {
  src: string;
  page: Size;
  view: Rect;
  brand: Brand;
  cam: PageCam;
  stops: LoupeStop[];
  /** Where the glass enters from, page px. Default below and right of the first stop. */
  from?: Pt;
  /** Frames for the entry and each travel. */
  travel?: number;
  /** Lens diameter, canvas px. */
  diameter?: number;
  /** Canvas px per page px inside the glass. */
  zoom?: number;
  dim?: number;
  /** The image the glass reads from (default `src`): a sharper capture of the same page, same page size. */
  lensSrc?: string;
  lineBand?: { y: number; size: number };
  mark?: MarkPatchSpec | null;
};

export const loupeEnd = (stops: LoupeStop[]) => {
  const last = stops[stops.length - 1];
  return last.at + last.hold + 16;
};

export const Loupe: React.FC<LoupeProps> = ({
  src, page, view, brand, cam, stops, from, travel = 30, diameter = 440, zoom = 1.9, dim = 0.28, lensSrc, lineBand, mark = null,
}) => {
  useBrandFonts(brand);
  const f = useCurrentFrame();
  const s = view.w / cam.cw;
  const start = from ?? { x: stops[0].point.x + 260, y: stops[0].point.y + 220 };
  const enterAt = stops[0].at - travel;
  const leaveAt = stops[stops.length - 1].at + stops[stops.length - 1].hold;
  const goneAt = leaveAt + 16;

  // where the glass is (page px) and how much it magnifies (0 clear glass, 1 full zoom)
  let pos: Pt = start;
  let gain = 0;
  const legs = [{ p: start, at: enterAt, hold: 0 }, ...stops.map((x) => ({ p: x.point, at: x.at, hold: x.hold }))];
  for (let i = 1; i < legs.length; i++) {
    const a = legs[i - 1];
    const b = legs[i];
    const t0 = b.at - travel;
    if (f < t0) { pos = a.p; gain = i === 1 ? 0 : 1; break; }
    if (f < b.at) {
      const k = interpolate(f, [t0, b.at], [0, 1], { ...clamp, easing: EASE_CAMERA });
      const dist = Math.hypot(b.p.x - a.p.x, b.p.y - a.p.y);
      const lift = Math.sin(Math.PI * k) * dist * 0.08;
      pos = { x: a.p.x + (b.p.x - a.p.x) * k, y: a.p.y + (b.p.y - a.p.y) * k - lift };
      const rise = interpolate(f, [b.at - travel * 0.4, b.at], [0, 1], { ...clamp, easing: EASE });
      gain = i === 1 ? rise : Math.max(rise, 1 - 0.55 * Math.sin(Math.PI * Math.min(1, k / 0.6)));
      break;
    }
    pos = b.p;
    gain = 1;
  }
  const outK = interpolate(f, [leaveAt, goneAt], [0, 1], { ...clamp, easing: EASE_CAMERA });
  gain *= 1 - outK;
  const grow = interpolate(f, [enterAt, enterAt + travel * 0.7], [0.55, 1], { ...clamp, easing: EASE }) * (1 - outK);
  const appear = interpolate(f, [enterAt, enterAt + 8], [0, 1], clamp) * (1 - interpolate(f, [goneAt - 6, goneAt], [0, 1], clamp));
  const m = s + (zoom - s) * gain;
  const D = diameter * grow;

  const c = toCanvas(cam, view, pos.x, pos.y);
  const pageDim = dim * Math.min(interpolate(f, [enterAt, enterAt + travel], [0, 1], clamp), 1 - outK);
  const lens = lensSrc ?? src;
  const visible = f >= enterAt && f <= goneAt && D > 4;
  const band = lineBand ?? { y: view.y + view.h + 90, size: 46 };

  return (
    <>
      <PageView src={src} page={page} cam={cam} view={view} brand={brand} dim={pageDim}>
        <MarkPatch cam={cam} view={view} spec={mark} />
      </PageView>
      {/* the glass sits on the canvas, not inside the view, so it can reach past the page's edge */}
        {visible ? (
          <div style={{ position: "absolute", left: c.x - D / 2, top: c.y - D / 2, width: D, height: D, opacity: appear }}>
            {/* drop shadow, separate so the glass edge stays crisp */}
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", boxShadow: "0 26px 60px rgba(0,0,0,0.6), 0 6px 16px rgba(0,0,0,0.45)" }} />
            <div style={{ position: "absolute", inset: 0, clipPath: "circle(50% at 50% 50%)", background: brand.color.bg }}>
              <Img src={lens} style={{ position: "absolute", left: D / 2 - pos.x * m, top: D / 2 - pos.y * m, width: page.w * m, height: page.h * m, maxWidth: "none" }} />
              {mark ? (
                <div style={{ position: "absolute", left: D / 2 + (mark.rect.x - pos.x) * m, top: D / 2 + (mark.rect.y - pos.y) * m, width: mark.rect.w * m, height: mark.rect.h * m, background: mark.color }} />
              ) : null}
              {/* the glass: inner bevel and a soft sheen from the top left */}
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%",
                boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.5), inset 0 -14px 34px rgba(0,0,0,0.28), inset 0 10px 26px rgba(255,255,255,0.06)",
                background: "radial-gradient(circle at 30% 22%, rgba(255,255,255,0.10), rgba(255,255,255,0) 42%)" }} />
            </div>
            <div style={{ position: "absolute", inset: -1, borderRadius: "50%", border: "2px solid rgba(247,239,230,0.62)" }} />
          </div>
        ) : null}
      {stops.map((st, i) =>
        st.line ? <CaptionBand key={i} text={st.line} f={f} from={st.at - 6} to={st.at + st.hold - 4} brand={brand} y={band.y} size={band.size} /> : null,
      )}
    </>
  );
};
