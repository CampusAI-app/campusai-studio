/**
 * CampusAI "Swap" (four-video batch, type 2), ROUND 2, 2026-10-19. 9:16, ~15s. Notes:
 * ../../four-videos/Swap.md (round 1 kept, "Round 2" added).
 *
 * The one motion idea: THE FOLD. Six apps are flipped through one at a time on a vertical coverflow
 * (each its own window, the way you go app to app), then the coverflow folds flat: each window
 * collapses into a single row, top first, and the six rows are one list. The rows are the REAL rows of
 * the CampusAI daily brief. Then that list goes home: the realistic laptop opens, the camera pushes
 * in on the brief, and each row drops into its own empty spot on the real dashboard. The push carries
 * on until the brief is readable and glides across it.
 *
 * Real: public/morning/tour/dashboard.jpg (campusai-demo, dark, captured 2026-10-19) on the laptop,
 * and public/four/swap/row-*.png, crops of that same capture. Drawn: the six invented apps, the
 * counter, the backgrounds, the dark spots where a row is still missing (they hide UI, add none).
 * Parts and their sources: ./swap-parts.tsx. Laptop: ./real-laptop.tsx (needs --gl=angle).
 */
import React from "react";
import { AbsoluteFill, Easing, Img, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, ramp, useZodiak } from "../kit/parts";
import { RealLaptop, laptopIntro, onScreen, type CamKey, type LidKey } from "./real-laptop";
import {
  APPS, AppWindow, BG, CAP_H, CAP_W, DeskBackground, HEAD_FONT, RED, ROWS, RedHorizon, RollDigit, RollWord, RowImg, SLOT_BG, WIN_H, WIN_W,
} from "./swap-parts";

export const SWAP_FPS = 30;
export const SWAP_SIZE = { width: 1080, height: 1920 };
const W = 1080;
const H = 1920;
const CX = W / 2;
const ASPECT = W / H;

/* ------------------------------------------------------------- timing (frames) */

const STEP = [16, 29, 41, 52, 62]; // the coverflow moves on to apps 2..6
const REGROUP = [80, 98]; // it pulls back so all six show, tilted
const FOLD0 = 100; // the first window starts folding into its row
const FOLD_GAP = 6;
const SWAP_WORD = 138; // "apps" rolls to "place."
const RISE = [172, 196]; // the list shrinks up out of the way
const LAP0 = 186; // the laptop shot starts (local frame 0)
// laptop-local
const L_HERO = 48;
const L_DOCK = 80; // camera holds square on the brief
const L_ROW0 = 82; // first row leaves the list for its spot
const ROW_GAP = 5;
const ROW_FLY = 18;
const L_READ = 124; // push in to readable (left column)
const L_READ_END = 150;
const L_PAN = 166; // glide to the right column
const L_PAN_END = 192;
const LAP_DUR = 222;
const END0 = LAP0 + LAP_DUR - 10;
const END_DUR = 62;
export const SWAP_FRAMES = END0 + END_DUR;

/* ------------------------------------------------------------- the coverflow */

const CF_Y = 1010; // strip centre
const PERSP = 1800;
const ROT = 26; // degrees per step (SmoothUI uses 45 on a horizontal strip)
const DEPTH = 180;
const SCALE_STEP = 0.15;

const stepSpring = (f: number, at: number, fps: number) =>
  f < at ? 0 : spring({ frame: f - at, fps, config: { stiffness: 210, damping: 22, mass: 0.7 } }); // ~bounce 0.1

const coverflow = (f: number, fps: number) => {
  let active = STEP.reduce((a, t) => a + stepSpring(f, t, fps), 0);
  const g = ramp(f, REGROUP[0], REGROUP[1], Easing.bezier(0.45, 0, 0.2, 1));
  active = active + (2.5 - active) * g;
  return { active, spacing: 330 - 120 * g, cutoff: 2.2 + 0.6 * g, regroup: g };
};

/* ------------------------------------------------------------- the list */

const LIST_W = 990;
const LIST_GAP = 16;
const LIST_TOP = 420;
const RISE_SCALE = 0.5;
const RISE_TOP = 170;
const listH = APPS.map((a) => (ROWS[a.row].h * LIST_W) / ROWS[a.row].w);
const listCum = listH.map((_, i) => listH.slice(0, i).reduce((s, h) => s + h + LIST_GAP, 0));

const listSlot = (i: number, f: number) => {
  const r = ramp(f, RISE[0], RISE[1], Easing.bezier(0.55, 0, 0.15, 1));
  const s = 1 + (RISE_SCALE - 1) * r;
  const top = LIST_TOP + (RISE_TOP - LIST_TOP) * r;
  return { cx: CX, cy: top + s * (listCum[i] + listH[i] / 2), w: LIST_W * s, h: listH[i] * s, rise: r };
};

const foldP = (f: number, i: number, fps: number) => {
  const at = FOLD0 + i * FOLD_GAP;
  return f < at ? 0 : spring({ frame: f - at, fps, config: { stiffness: 120, damping: 24, mass: 0.9 } }); // no bounce, like gc-open-sheet
};

/* ------------------------------------------------------------- the laptop */

const DOCK_F = 1.25; // glass width as a share of the frame width while the rows land
const BRIEF = { u: 1652 / CAP_W, v: 497 / CAP_H }; // centre of the brief's two columns
const READ_F = 2.35;
const READ_L = { u: 1092 / CAP_W, v: 0.5 };
const READ_R = { u: 2221 / CAP_W, v: 0.5 };

const intro = laptopIntro({ aspect: ASPECT, openAt: 6, heroAt: L_HERO });
const CAMERA: CamKey[] = [
  intro.camera[0],
  intro.camera[1],
  { ...intro.camera[1], at: L_HERO + 6 },
  { at: L_DOCK, ...onScreen(BRIEF.u, BRIEF.v, DOCK_F, ASPECT), ease: Easing.bezier(0.6, 0, 0.12, 1) },
  { at: L_READ, ...onScreen(BRIEF.u, BRIEF.v, DOCK_F, ASPECT) },
  { at: L_READ_END, ...onScreen(READ_L.u, READ_L.v, READ_F, ASPECT), ease: Easing.bezier(0.6, 0, 0.12, 1) },
  { at: L_PAN, ...onScreen(READ_L.u, READ_L.v, READ_F, ASPECT) },
  { at: L_PAN_END, ...onScreen(READ_R.u, READ_R.v, READ_F, ASPECT), ease: Easing.bezier(0.5, 0, 0.2, 1) },
];
const LID: LidKey[] = intro.lid;
const BLUR: LidKey[] = [
  { at: L_READ, open: 0 },
  { at: L_READ_END, open: 7 },
];

/**
 * Where a point of the screen lands in the frame while the camera holds square on the brief.
 * Affine because the camera looks straight down the screen's normal. Calibrated against a still
 * (see the note): GW and GH are the glass's width and height in frame pixels.
 */
const GW = W * DOCK_F;
const GH = GW / 1.55;
const CAL = { dx: 0, dy: 0, sx: 1, sy: 1 };
const toFrame = (cx: number, cy: number) => ({
  x: CX + CAL.dx + (cx / CAP_W - BRIEF.u) * GW * CAL.sx,
  y: H / 2 + CAL.dy + (cy / CAP_H - BRIEF.v) * GH * CAL.sy,
});
const slotRect = (row: string) => {
  const r = ROWS[row];
  const c = toFrame(r.x + r.w / 2, r.y + r.h / 2);
  return { cx: c.x, cy: c.y, w: (r.w / CAP_W) * GW * CAL.sx, h: (r.h / CAP_H) * GH * CAL.sy };
};

const dockT = (f: number, i: number) => ramp(f, LAP0 + L_ROW0 + i * ROW_GAP, LAP0 + L_ROW0 + i * ROW_GAP + ROW_FLY, Easing.bezier(0.5, 0, 0.12, 1));
const landed = (f: number, i: number) => f >= LAP0 + L_ROW0 + i * ROW_GAP + ROW_FLY;

/** The dashboard on the glass, with a dark spot where each brief row has not landed yet. */
const Screen: React.FC<{ f: number }> = ({ f }) => (
  <div style={{ position: "absolute", inset: 0, background: "#0b0708" }}>
    <Img src={staticFile("morning/tour/dashboard.jpg")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
    {APPS.map((a, i) => {
      if (landed(f, i)) return null;
      const r = ROWS[a.row];
      return (
        <div key={i} style={{ position: "absolute", left: `${(r.x / CAP_W) * 100}%`, top: `${(r.y / CAP_H) * 100}%`, width: `${(r.w / CAP_W) * 100}%`,
          height: `${(r.h / CAP_H) * 100}%`, background: SLOT_BG, borderRadius: 4 }} />
      );
    })}
  </div>
);

/* ------------------------------------------------------------- the film */

const HEAD = 84;
const BAND = 158;

export const SwapFilm: React.FC = () => {
  useZodiak();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cf = coverflow(f, fps);
  const folds = APPS.map((_, i) => foldP(f, i, fps));
  const folded = folds.reduce((a, b) => a + b, 0) / APPS.length;

  // background: graphite desk while the apps are separate, the red horizon once they are one
  const warm = ramp(f, FOLD0 + 20, FOLD0 + 70);
  const intro = ramp(f, 0, 10);

  // counter: "1 app" .. "6 apps", then rolls back down to "1 place."
  const count = 1 + STEP.reduce((a, t) => a + stepSpring(f, t, fps), 0) - 5 * folded;
  const bandOut = ramp(f, RISE[0], RISE[0] + 12);

  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      <DeskBackground opacity={1 - warm} />
      <RedHorizon opacity={warm * (1 - ramp(f, LAP0 + 30, LAP0 + 70) * 0.35)} />

      {/* the laptop shot */}
      <Sequence from={LAP0} durationInFrames={LAP_DUR}>
        <LaptopShot f={f} />
      </Sequence>

      {/* the six windows: coverflow, then the fold into one list, then the list rises and docks */}
      {f < LAP0 + L_ROW0 + 5 * ROW_GAP + ROW_FLY ? (
        <div style={{ position: "absolute", inset: 0, perspective: PERSP, perspectiveOrigin: `${CX}px ${CF_Y}px`, opacity: intro, zIndex: 20 }}>
          {APPS.map((a, i) => {
            if (landed(f, i)) return null;
            const o = i - cf.active;
            const ao = Math.abs(o);
            const s0 = Math.max(1 - ao * SCALE_STEP, 0.4);
            const vis = Math.max(0, Math.min(1, 1 - (ao - cf.cutoff) / 0.6));
            const p = folds[i];
            const t = listSlot(i, f);
            // coverflow pose (box size carries the scale so the fold can morph it into the row)
            const c = { cy: CF_Y + o * cf.spacing, z: -ao * DEPTH, rx: -o * ROT, w: WIN_W * s0, h: WIN_H * s0, op: vis, dim: 1 - Math.min(0.55, ao * 0.22) };
            let cx = CX;
            let cy = c.cy + (t.cy - c.cy) * p;
            let bw = c.w + (t.w - c.w) * p;
            let bh = c.h + (t.h - c.h) * p;
            const z = c.z * (1 - p);
            const rx = c.rx * (1 - p);
            const op = c.op + (1 - c.op) * Math.min(1, p * 2.5);
            const dim = c.dim + (1 - c.dim) * p;
            const radius = 30 * (1 - p) + 14 * p * (bw / LIST_W);
            // dock: from its place in the risen list to its own spot on the screen
            const d = dockT(f, i);
            let arc = 0;
            if (d > 0) {
              const sl = slotRect(a.row);
              cx = t.cx + (sl.cx - t.cx) * d;
              cy = t.cy + (sl.cy - t.cy) * d;
              bw = t.w + (sl.w - t.w) * d;
              bh = t.h + (sl.h - t.h) * d;
              arc = -Math.sin(d * Math.PI) * 30;
            }
            const winOp = 1 - ramp(p, 0.45, 0.85);
            const rowOp = ramp(p, 0.4, 0.8);
            const lift = Math.sin(Math.min(1, p) * Math.PI);
            return (
              <div key={i} style={{ position: "absolute", left: cx - bw / 2, top: cy + arc - bh / 2, width: bw, height: bh, zIndex: Math.round(100 - ao * 10 + p * 50 + i),
                transform: `translateZ(${z}px) rotateX(${rx}deg)`, opacity: op, borderRadius: radius, overflow: "hidden",
                background: "#1c181b", border: `1px solid rgba(255,255,255,${0.1 - 0.02 * p})`,
                boxShadow: `0 ${30 + lift * 30}px ${80 + lift * 40}px rgba(0,0,0,${0.55 * (1 - d * 0.7)})`, filter: dim < 0.99 ? `brightness(${dim})` : undefined }}>
                {winOp > 0 ? (
                  <div style={{ position: "absolute", left: 0, top: 0, width: WIN_W, height: WIN_H, transformOrigin: "0 0", transform: `scale(${bw / WIN_W})`, opacity: winOp }}>
                    <AppWindow app={a} />
                  </div>
                ) : null}
                {rowOp > 0 ? <RowImg row={a.row} style={{ opacity: rowOp, height: (bw * ROWS[a.row].h) / ROWS[a.row].w, bottom: "auto" }} /> : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {/* the counter, in the band above */}
      {f < RISE[0] + 12 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: BAND, zIndex: 60, textAlign: "center", ...HEAD_FONT, fontSize: HEAD,
          opacity: ramp(f, 2, 12) * (1 - bandOut), transform: `translateY(${(1 - ramp(f, 2, 14)) * 18 - bandOut * 20}px)` }}>
          <span style={{ color: RED, fontStyle: "italic", fontWeight: 400 }}><RollDigit value={count} size={HEAD} /></span>
          <span style={{ display: "inline-block", width: 22 }} />
          {f < SWAP_WORD ? (
            <span style={{ display: "inline-block", lineHeight: `${HEAD * 1.14}px`, verticalAlign: "top" }}>{f < FOLD0 && count < 1.5 ? "app" : "apps"}</span>
          ) : (
            <RollWord from="apps" to="place." at={SWAP_WORD} size={HEAD} wFrom={182} wTo={228} />
          )}
        </div>
      ) : null}

      {/* end card */}
      <Sequence from={END0} durationInFrames={END_DUR}>
        <End />
      </Sequence>

      {/* first frames come up from black */}
      <AbsoluteFill style={{ background: BG, opacity: 1 - ramp(f, 0, 8), pointerEvents: "none", zIndex: 100 }} />
    </AbsoluteFill>
  );
};

const LaptopShot: React.FC<{ f: number }> = ({ f }) => {
  const l = useCurrentFrame();
  const op = ramp(l, 6, 18) * (1 - ramp(l, LAP_DUR - 12, LAP_DUR));
  return (
    <AbsoluteFill style={{ opacity: op, zIndex: 10 }}>
      <RealLaptop screen={{ node: <Screen f={f} /> }} camera={CAMERA} lid={LID} focus={{ x: 0.5, y: 0.33, radius: 0.78 }} blur={BLUR} />
    </AbsoluteFill>
  );
};

const End: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const land = pop(f, 6, fps, 11);
  return (
    <AbsoluteFill style={{ alignItems: "center", opacity: ramp(f, 0, 8), zIndex: 90 }}>
      <AbsoluteFill style={{ background: BG, opacity: ramp(f, 0, 10) }} />
      <RedHorizon opacity={ramp(f, 0, 12)} />
      <div style={{ position: "absolute", top: 760, width: 300, height: 300, borderRadius: 70, overflow: "hidden", opacity: ramp(f, 4, 10),
        transform: `translateY(${(1 - land) * -60}px) scale(${0.6 + 0.4 * land})`, boxShadow: "0 30px 90px rgba(217,32,46,.32)" }}>
        <Img src={staticFile("kit/app-icon.png")} style={{ width: "100%", height: "100%", display: "block" }} />
      </div>
      <div style={{ position: "absolute", top: 1130, ...HEAD_FONT, fontSize: 52, color: "rgba(255,255,255,.6)", opacity: ramp(f, 18, 30),
        transform: `translateY(${(1 - ramp(f, 18, 32)) * 16}px)` }}>Link in bio.</div>
    </AbsoluteFill>
  );
};
