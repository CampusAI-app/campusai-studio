/**
 * One take (2026-11-21, from Ilias Miah's 22 s Kestrel notifications film, instagram.com/reel/Df8Nh5iBFPO, Muse Nov 21;
 * Jacob: "I love how this video looks for motion design"). Read frame by frame in his Chrome (0.5 s across all 22 s, then
 * 0.1 to 0.2 s round the dive, the whip to the second screen and the pull-back); our own build, none of their art.
 *
 * What the film does, in numbers (1080 x 1080, 30 fps, silent, no cuts):
 * - 0.0 to 0.8 s   the wide tableau: a whole dashboard plane, a tall panel floating front right overlapping it, both
 *                  tilted 3 to 5 degrees in a pale grey void (centre about #F4F4F6, edges about #DEDEE2), soft shadows.
 * - 0.8 to 1.0 s   the dive: the camera swings in to a steep 3D view (about 18 deg yaw, 8 deg pitch) in 0.2 s.
 * - 1.0 to 3.2 s   a slow glide across the dashboard toward the panel, which grows; the dashboard recedes and softens.
 * - 3.2 to 3.8 s   the panel squares to the viewer and fills the frame; its rows arrive.
 * - 3.8 to 8.8 s   inside the panel: an oversized black arrow does the work. Presses land with a soft ring (purple in
 *                  theirs, about 70 px, 0.45 s); the camera travels down the list rather than the list scrolling.
 * - 8.9 to 9.2 s   a whip sideways, soft with speed, onto the second screen at the same height, tilted ~15 deg.
 * - 9.2 to 11 s    it straightens and pushes in on the rows; 11.5 to 17.5 s near-black toasts stack, and one flips
 *                  state in place (error, spinner, success) under a press.
 * - 18 to 19.1 s   pull back: the second screen whole, tilted, then a 0.2 s swing back to the opening tableau.
 * - 19.2 to 22 s   the exact opening frame, drifting, so the loop is invisible.
 * Every move eases; nothing teleports; focus is handed over by depth (the far plane blurs and pales), never by a cut.
 *
 * Ours, as one part: real captures as planes in a world (each at its own place, depth and tilt), ONE camera through
 * them as a list of keys (a key can name a plane and a page point on it and how big a page px should look, and the
 * camera squares to that plane on arrival), depth of field from each plane's distance to the focus, softness on fast
 * moves, the operated arrow with its ring (riding the plane it points at), and in-place state changes, which are real
 * recorded frames (`flow` content) or a second real capture crossfaded where the first sat (`swaps`). Loop by making the
 * last key the first. Product planes stay real captures: never a drawn screen.
 *
 *   <OneTake planes={[{ id: "dash", content: { src, page: { w: 1440, h: 900 } }, x: -120, y: 0, z: -260, w: 1100, ry: 6 }, ...]}
 *            cam={[{ at: 0, plane: "dash", px: 720, py: 450, zoom: 0.62, ry: -4 }, { at: 90, plane: "panel", ... }]}
 *            pointer={[{ at: 150, plane: "panel", px: 1100, py: 470, press: true }]} />
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { asset, useFrameSeq } from "../../system/parts/common";
import { B, OUT, SWING, clampX, k, mix } from "./shared";

/** Measured from the film (1080 x 1080 frames). */
export const ONE_TAKE = {
  /** The void: lighter centre, grey edges. */
  ground: "radial-gradient(120% 95% at 50% 42%, #F6F6F7 0%, #ECECEE 55%, #DCDCE0 100%)",
  /** A warmer void for CampusAI: the same values pulled toward the product's own blush. */
  groundWarm: "radial-gradient(120% 95% at 50% 42%, #FBF8F8 0%, #F2EBEB 55%, #E3D7D8 100%)",
  /** Settled planes tilt 3 to 5 deg; the dive reaches about 18 deg of yaw and 8 of pitch. */
  restTilt: 4,
  diveYaw: 18,
  divePitch: 8,
  /** The arrow is oversized: about 6% of the frame width. The press ring grows to about 70 px over 0.45 s. */
  arrow: 64,
  ring: 92,
  ringFrames: 14,
  /** The whip onto the next screen takes about 0.3 s (9 frames); a push-in about 2 s. */
  whip: 9,
  push: 60,
} as const;

// ---------------------------------------------------------------------------------------------------------------
// Geometry. CSS axes: x right, y down, z toward the viewer. Rotations are the CSS matrices.

type V3 = [number, number, number];
const rad = (d: number) => (d * Math.PI) / 180;
const rotX = (a: number, [x, y, z]: V3): V3 => { const c = Math.cos(rad(a)), s = Math.sin(rad(a)); return [x, c * y - s * z, s * y + c * z]; };
const rotY = (a: number, [x, y, z]: V3): V3 => { const c = Math.cos(rad(a)), s = Math.sin(rad(a)); return [c * x + s * z, y, -s * x + c * z]; };
const rotZ = (a: number, [x, y, z]: V3): V3 => { const c = Math.cos(rad(a)), s = Math.sin(rad(a)); return [c * x - s * y, s * x + c * y, z]; };

/** What a plane shows: a still capture, or a `npm run flow` recording played on its own clock. Page px throughout. */
export type PlaneContent =
  | { src: string; page: { w: number; h: number }; swaps?: { at: number; src: string; frames?: number }[] }
  | { frames: string; time: (f: number) => number };

export type Plane = {
  id: string;
  content: PlaneContent;
  /** The part of the page shown, in page px (CSS px of the capture). Whole page when left out. */
  crop?: { x: number; y: number; w: number; h: number };
  /** Centre in the world (px; z toward the viewer) and width in world px. */
  x: number;
  y: number;
  z: number;
  w: number;
  rx?: number;
  ry?: number;
  rz?: number;
  radius?: number;
  /** Render resolution, DOM px per page px, so close shots stay sharp. Default 2. */
  res?: number;
};

/** A camera key. Name a plane and a page point on it (crop-relative page px) and the camera looks there, squared to the
 *  plane, with one page px drawn `zoom` frame px big; rx / ry / rz add a tilt on top. Or give a world point `look` and
 *  a distance. `ease` shapes the move INTO this key. `shift` moves where the look point sits on the frame. */
export type CamKey = {
  at: number;
  plane?: string;
  px?: number;
  py?: number;
  zoom?: number;
  look?: V3;
  dist?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  shift?: { x: number; y: number };
  ease?: (t: number) => number;
};

/** The arrow. It glides `glide` frames into each key and holds there, riding the plane as the camera moves. */
export type PointerKey = { at: number; plane: string; px: number; py: number; press?: boolean; glide?: number; hide?: boolean };

type Cam = { t: V3; dist: number; rx: number; ry: number; rz: number; sx: number; sy: number };

const PERSPECTIVE = 1600;

const pageOf = (p: Plane, seqSize?: { w: number; h: number }) => {
  const page = "page" in p.content ? p.content.page : seqSize ?? { w: 1440, h: 900 };
  return p.crop ?? { x: 0, y: 0, w: page.w, h: page.h };
};

/** A page point on a plane (crop-relative page px) in world px. */
export const planePoint = (p: Plane, px: number, py: number, crop = pageOf(p)): V3 => {
  const s = p.w / crop.w;
  const local: V3 = [(px - crop.w / 2) * s, (py - crop.h / 2) * s, 0];
  const r = rotX(p.rx ?? 0, rotY(p.ry ?? 0, rotZ(p.rz ?? 0, local)));
  return [p.x + r[0], p.y + r[1], p.z + r[2]];
};

const keyCam = (key: CamKey, planes: Plane[], crops: Record<string, OneTakeCrop>): Cam => {
  const sh = key.shift ?? { x: 0, y: 0 };
  if (key.plane) {
    const p = planes.find((x) => x.id === key.plane);
    if (!p) throw new Error(`OneTake: no plane "${key.plane}"`);
    const crop = crops[p.id];
    const t = planePoint(p, key.px ?? crop.w / 2, key.py ?? crop.h / 2, crop);
    const scale = p.w / crop.w; // world px per page px
    const dist = (PERSPECTIVE * scale) / (key.zoom ?? 1);
    return { t, dist, rx: -(p.rx ?? 0) + (key.rx ?? 0), ry: -(p.ry ?? 0) + (key.ry ?? 0), rz: -(p.rz ?? 0) + (key.rz ?? 0), sx: sh.x, sy: sh.y };
  }
  return { t: key.look ?? [0, 0, 0], dist: key.dist ?? PERSPECTIVE, rx: key.rx ?? 0, ry: key.ry ?? 0, rz: key.rz ?? 0, sx: sh.x, sy: sh.y };
};

type OneTakeCrop = { x: number; y: number; w: number; h: number };

/** The camera at frame f (fractional frames are fine, for the speed reading). */
export const oneTakeCam = (f: number, keys: CamKey[], planes: Plane[], crops: Record<string, OneTakeCrop>): Cam => {
  if (f <= keys[0].at) return keyCam(keys[0], planes, crops);
  const last = keys[keys.length - 1];
  if (f >= last.at) return keyCam(last, planes, crops);
  const i = keys.findIndex((x, n) => f >= x.at && f < keys[n + 1].at);
  const a = keyCam(keys[i], planes, crops), b = keyCam(keys[i + 1], planes, crops);
  const e = (keys[i + 1].ease ?? SWING)((f - keys[i].at) / (keys[i + 1].at - keys[i].at));
  // distance blends in log space so a push-in feels even all the way in
  const dist = Math.exp(mix(Math.log(a.dist), Math.log(b.dist), e));
  return {
    t: [mix(a.t[0], b.t[0], e), mix(a.t[1], b.t[1], e), mix(a.t[2], b.t[2], e)],
    dist, rx: mix(a.rx, b.rx, e), ry: mix(a.ry, b.ry, e), rz: mix(a.rz, b.rz, e), sx: mix(a.sx, b.sx, e), sy: mix(a.sy, b.sy, e),
  };
};

/** Where a world point lands on the frame, and how far it sits from the focus (world px, + is nearer the viewer). */
export const project = (cam: Cam, w: V3, frame: { width: number; height: number }) => {
  const d: V3 = [w[0] - cam.t[0], w[1] - cam.t[1], w[2] - cam.t[2]];
  const c = rotZ(cam.rz, rotY(cam.ry, rotX(cam.rx, d)));
  const z = c[2] + (PERSPECTIVE - cam.dist);
  const s = PERSPECTIVE / (PERSPECTIVE - z);
  return { x: frame.width / 2 + cam.sx + c[0] * s, y: frame.height / 2 + cam.sy + c[1] * s, s, defocus: c[2] };
};

// ---------------------------------------------------------------------------------------------------------------
// Drawing

const PlaneFace: React.FC<{ p: Plane; f: number; res: number; crop: OneTakeCrop }> = ({ p, f, res, crop }) => {
  const c = p.content;
  const seq = useFrameSeq("frames" in c ? c.frames : undefined) as (ReturnType<typeof useFrameSeq> & { vw?: number; vh?: number }) | null;
  const img = (src: string, page: { w: number; h: number }, opacity = 1, key?: string) => (
    <Img key={key} src={asset(src)} style={{ position: "absolute", left: -crop.x * res, top: -crop.y * res, width: page.w * res, height: page.h * res, maxWidth: "none", opacity }} />
  );
  if ("src" in c) {
    const swaps = (c.swaps ?? []).filter((s) => f >= s.at);
    return (
      <>
        {img(c.src, c.page)}
        {swaps.map((s, i) => img(s.src, c.page, k(f, s.at, s.at + (s.frames ?? 4), OUT), `s${i}`))}
      </>
    );
  }
  if (!seq || !seq.frames.length) return null;
  const t = c.time(f);
  let shown = seq.frames[0];
  for (const fr of seq.frames) {
    if (fr.t <= t) shown = fr;
    else break;
  }
  return img(seq.dir + shown.name, { w: seq.vw ?? 1440, h: seq.vh ?? 900 });
};

/** The stage: void, planes and camera. Overlays (type, logo) go in `children`, drawn flat on top. */
export const OneTake: React.FC<{
  planes: Plane[];
  cam: CamKey[];
  pointer?: PointerKey[];
  /** Page size of each `flow` plane (frames.json vw / vh), by plane id, so crops and the camera can be worked out before the file loads. */
  pages?: Record<string, { w: number; h: number }>;
  ground?: string;
  accent?: string;
  /** Depth of field: frame px of blur for a plane as far from the focus as the camera is from it, and the most. 0 turns it off. */
  focus?: number;
  maxBlur?: number;
  /** A slow drift on top of the keys so a held frame is never still (degrees). Periods are whole fractions of `loop`. */
  drift?: number;
  /** A strip of the void along the bottom (frame px) that the planes pass under, so type set there never sits on the
   *  product. 0 for none. */
  band?: number;
  /** Frames in one loop, so the drift returns to where it began. */
  loop?: number;
  children?: React.ReactNode;
}> = ({ planes, cam, pointer = [], pages = {}, ground = ONE_TAKE.ground, accent = B.color.accent, focus = 6, maxBlur = 8, drift = 0.6, loop, band = 0, children }) => {
  const f = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const frame = { width, height };
  const L = loop ?? durationInFrames;
  const crops: Record<string, OneTakeCrop> = Object.fromEntries(planes.map((p) => [p.id, pageOf(p, pages[p.id])]));

  const at = (ff: number) => {
    const c = oneTakeCam(ff, cam, planes, crops);
    const ph = (ff / L) * Math.PI * 2;
    return { ...c, rx: c.rx + Math.sin(ph) * drift * 0.6, ry: c.ry + Math.sin(ph * 2 + 1.1) * drift };
  };
  const c = at(f);
  // how fast the look point travels across the frame (px a frame, plus the push), for softness on whips
  const a1 = project(c, c.t, frame), a0 = project(at(f - 1), c.t, frame);
  const speed = Math.hypot(a1.x - a0.x, a1.y - a0.y) + Math.abs(a1.s - a0.s) * 150;
  const whipBlur = Math.min(5, Math.max(0, (speed - 30) * 0.1));

  return (
    <AbsoluteFill style={{ background: ground, overflow: "hidden" }}>
      <AbsoluteFill style={{ perspective: PERSPECTIVE, perspectiveOrigin: `${width / 2 + c.sx}px ${height / 2 + c.sy}px` }}>
        <div style={{ position: "absolute", left: width / 2 + c.sx, top: height / 2 + c.sy, transformStyle: "preserve-3d",
          transform: `translateZ(${(PERSPECTIVE - c.dist).toFixed(3)}px) rotateZ(${c.rz.toFixed(4)}deg) rotateY(${c.ry.toFixed(4)}deg) rotateX(${c.rx.toFixed(4)}deg) translate3d(${(-c.t[0]).toFixed(3)}px, ${(-c.t[1]).toFixed(3)}px, ${(-c.t[2]).toFixed(3)}px)` }}>
          {planes.map((p) => {
            const crop = crops[p.id];
            const res = p.res ?? 2;
            const dw = crop.w * res, dh = crop.h * res;
            const s = p.w / dw;
            const pc = project(c, [p.x, p.y, p.z], frame);
            const depth = Math.abs(pc.defocus);
            const blur = Math.min(maxBlur, (depth / c.dist) * focus) + whipBlur;
            const pale = Math.min(0.4, (depth / c.dist) * 0.3);
            const r = (p.radius ?? 14) * res;
            return (
              <div key={p.id} style={{ position: "absolute", left: -dw / 2, top: -dh / 2, width: dw, height: dh,
                transform: `translate3d(${p.x}px, ${p.y}px, ${p.z}px) rotateX(${p.rx ?? 0}deg) rotateY(${p.ry ?? 0}deg) rotateZ(${p.rz ?? 0}deg) scale(${s.toFixed(6)})`,
                borderRadius: r, boxShadow: `0 ${40 * res}px ${90 * res}px -${18 * res}px rgba(60, 30, 40, 0.30), 0 ${12 * res}px ${30 * res}px -${8 * res}px rgba(60, 30, 40, 0.16)`,
                filter: blur > 0.05 ? `blur(${(blur / (s * pc.s)).toFixed(2)}px)` : undefined }}>
                <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: r, background: "#fff" }}>
                  <PlaneFace p={p} f={f} res={res} crop={crop} />
                  <div style={{ position: "absolute", inset: 0, background: "#F3EFEF", opacity: pale }} />
                  <div style={{ position: "absolute", inset: 0, borderRadius: r, boxShadow: `inset 0 0 0 ${res}px rgba(40, 20, 30, 0.07)` }} />
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      {band > 0 ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: band + 90, background: ground,
          WebkitMaskImage: `linear-gradient(to bottom, transparent 0, black 90px)`, maskImage: `linear-gradient(to bottom, transparent 0, black 90px)` }} />
      ) : null}
      {children}
      <Arrow keys={pointer} f={f} where={(key) => {
        const p = planes.find((x) => x.id === key.plane)!;
        return project(c, planePoint(p, key.px, key.py, crops[p.id]), frame);
      }} accent={accent} />
    </AbsoluteFill>
  );
};

/** The oversized black arrow with a soft ring on each press. */
const Arrow: React.FC<{ keys: PointerKey[]; f: number; where: (k: PointerKey) => { x: number; y: number }; accent: string }> = ({ keys, f, where, accent }) => {
  if (!keys.length || f < keys[0].at - (keys[0].glide ?? 16)) return null;
  let i = keys.findIndex((x, n) => n === keys.length - 1 || f < keys[n + 1].at - (keys[n + 1].glide ?? 16));
  if (i < 0) i = keys.length - 1;
  const cur = keys[i];
  const prev = keys[i - 1];
  const g = cur.glide ?? 16;
  const e = prev ? k(f, cur.at - g, cur.at, SWING) : 1;
  const a = where(cur), b = prev ? where(prev) : a;
  // the first key arrives from off the right edge
  const enter = prev ? 0 : 1 - k(f, cur.at - g, cur.at, OUT);
  const x = mix(b.x, a.x, e) + enter * 420, y = mix(b.y, a.y, e) + enter * 160;
  const lastPress = [...keys].filter((x) => x.press && x.at <= f).pop();
  const since = lastPress ? f - lastPress.at : Infinity;
  // motion: the press squashes over 4 frames and springs back over 6, so the arrow never jumps a size in one frame
  const squash = since < 12 ? interpolate(since, [0, 4, 6, 12], [1, 0.88, 0.88, 1], clampX) : 1;
  const ring = since < ONE_TAKE.ringFrames ? since / ONE_TAKE.ringFrames : 1;
  const hidden = cur.hide ? 1 - k(f, cur.at - g, cur.at) : 1;
  const S = ONE_TAKE.arrow;
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: hidden }}>
      {ring < 1 ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: ONE_TAKE.ring * (0.35 + 0.65 * ring), height: ONE_TAKE.ring * (0.35 + 0.65 * ring),
          transform: "translate(-50%, -50%)", borderRadius: "50%", background: `${accent}1F`, border: `3px solid ${accent}`, opacity: 1 - ring * ring }} />
      ) : null}
      <svg width={S} height={S} viewBox="0 0 24 24" style={{ position: "absolute", left: -S * 0.11, top: -S * 0.06, transform: `scale(${squash})`,
        transformOrigin: `${S * 0.11}px ${S * 0.06}px`, filter: "drop-shadow(0 6px 12px rgba(20, 10, 15, 0.35))" }}>
        <path d="M2.6 1.4 L20 12.2 L12.6 13.6 L8.4 20.6 Z" fill="#0C0A0B" stroke="#ffffff" strokeWidth={1.4} strokeLinejoin="round" />
      </svg>
    </div>
  );
};
