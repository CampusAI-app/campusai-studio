/**
 * CampusAI wall loop (2026-10-16). The motion version of the Instagram / LinkedIn
 * wall graphic in Content/campusai/banners/ (ig.html, wall.html): the same dark
 * screens and phones on one tilted plane, nothing on top of anything.
 *
 * Motion is Aceternity's 3D Marquee idea (shelf: @aceternity/3d-marquee): neighbouring
 * columns drift in opposite directions. Web columns drift up, phone columns down.
 *
 * SEAMLESS LOOP, and that is the constraint everything else bends to. Each column
 * repeats a TWO-screen sequence, and over the whole duration it moves exactly two
 * item pitches, so the last frame is the first frame. The logo and line arrive after
 * a beat and leave before the end, so they are absent on both seams too.
 *
 * Every screen is a real capture of campusai-demo.vercel.app in dark mode (demo data).
 */
import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["700"] });

export const WALL_FPS = 30;
export const WALL_FRAMES = 10 * WALL_FPS;
export { layoutFor };

/** bare: the moving wall and its fades only, no logo or line (CampusStory draws its own). */
export type CampusWallProps = { line: "a" | "b"; bare?: boolean };

const LINES: Record<CampusWallProps["line"], [string, string | null]> = {
  a: ["Your student", "operating system"],
  b: ["Every part of college,", "connected"],
};

const WEBS = ["D_dashboard", "D_planner", "D_jobs", "D_calendar", "D_resume", "D_eventdetail", "D_degree", "D_chat", "D_orgs"];
const PHONES = ["MD_dash", "MD_events", "MD_orgs", "MD_jobs", "MD_degree"];

const TILT = -11;
const TAN = Math.tan((-TILT * Math.PI) / 180);
const GAP = 22;
const WEB = { w: 540, h: 337.5 };
const PHONE = { w: 230, h: 491 };
const EASE = Easing.bezier(0.16, 1, 0.3, 1);

type Layout = {
  planeLeft: number;
  baseY: number;
  head: { left: number; top: number; logo: number; size: number; centerY?: boolean };
  fade: "top" | "left";
};

const layoutFor = (w: number, h: number): Layout => {
  if (w > h) {
    // 16:9, LinkedIn. Logo and line sit left, the wall runs right.
    return { planeLeft: 470, baseY: -300, head: { left: 100, top: h / 2, logo: 340, size: 52, centerY: true }, fade: "left" };
  }
  if (h / w >= 1.5) {
    // 9:16 Reel. Head inside the safe band (y 285 to 1500, see lib/safeArea.ts).
    return { planeLeft: -80, baseY: 120, head: { left: 84, top: 330, logo: 320, size: 72 }, fade: "top" };
  }
  // 4:5 feed.
  return { planeLeft: -80, baseY: 60, head: { left: 84, top: 96, logo: 300, size: 64 }, fade: "top" };
};

const Phone: React.FC<{ src: string }> = ({ src }) => (
  <div
    style={{
      position: "relative", width: PHONE.w, height: PHONE.h, borderRadius: 38, padding: 8, flex: "none",
      background: "linear-gradient(148deg, #7a6e6b 0%, #322b2d 20%, #181415 50%, #262022 76%, #665c5b 100%)",
      boxShadow: "0 0 0 1px rgba(255,255,255,.13), 0 24px 48px rgba(0,0,0,.6), 0 8px 18px rgba(0,0,0,.45)",
    }}
  >
    <div style={{ position: "relative", width: PHONE.w - 16, height: PHONE.h - 16, overflow: "hidden", borderRadius: 31, background: "#000" }}>
      <Img src={staticFile(`wall/${src}.jpg`)} style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "auto" }} />
      <div style={{ position: "absolute", left: "50%", top: 7, transform: "translateX(-50%)", width: 62, height: 18, borderRadius: 10, background: "#000" }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: 31, background: "linear-gradient(118deg, rgba(255,255,255,.08) 0%, rgba(255,255,255,.02) 15%, rgba(255,255,255,0) 33%)" }} />
    </div>
  </div>
);

const Web: React.FC<{ src: string }> = ({ src }) => (
  <div
    style={{
      position: "relative", width: WEB.w, height: WEB.h, borderRadius: 14, overflow: "hidden", background: "#1a1416", flex: "none",
      boxShadow: "0 0 0 1.2px rgba(255,255,255,.10), 0 24px 48px rgba(0,0,0,.55), 0 8px 18px rgba(0,0,0,.40)",
    }}
  >
    <Img src={staticFile(`wall/${src}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top left" }} />
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,.06), rgba(255,255,255,0) 40%)" }} />
  </div>
);


export type WallColumn = { index: number; x: number; y0: number; isPhone: boolean; pair: [string, string]; count: number; pitch: number; w: number; h: number };

/**
 * Where every column of the wall sits at loop progress t (0..1, two pitches of travel per unit),
 * in the plane's own coordinates before the -11deg rotation. Shared by the loop and the story
 * cut, so the story's camera can find any screen's exact position on any frame.
 */
export const wallColumns = (width: number, height: number, t: number, pools = { webs: WEBS, phones: PHONES }): WallColumn[] => {
  const L = layoutFor(width, height);
  const out: WallColumn[] = [];
  const stagger = [0, 150, 60, 210];
  let x = 0;
  for (let c = 0; x < width + 900; c++) {
    const isPhone = c % 2 === 1;
    const size = isPhone ? PHONE : WEB;
    const pitch = size.h + GAP;
    const pool = isPhone ? pools.phones : pools.webs;
    const pair: [string, string] = [pool[(c * 2) % pool.length], pool[(c * 2 + 1) % pool.length]];
    const count = Math.ceil((height / Math.cos((TILT * Math.PI) / 180) + 900) / pitch) + 4;
    // Web up, phones down. Each column travels exactly two pitches per loop.
    const travel = 2 * pitch * t * (isPhone ? 1 : -1);
    const y0 = L.baseY + x * TAN + stagger[c % 4] - 2 * pitch + travel;
    out.push({ index: c, x, y0, isPhone, pair, count, pitch, w: size.w, h: size.h });
    x += size.w + GAP;
  }
  return out;
};

export { TILT, WEB, PHONE, GAP, Web, Phone };

export const CampusWall: React.FC<CampusWallProps> = ({ line, bare }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const L = layoutFor(width, height);
  const t = frame / durationInFrames;

  const cols = wallColumns(width, height, t).map((c) => (
    <div key={c.index} style={{ position: "absolute", left: c.x, top: c.y0, display: "flex", flexDirection: "column", gap: GAP }}>
      {Array.from({ length: c.count }, (_, k) =>
        c.isPhone ? <Phone key={k} src={c.pair[k % 2]} /> : <Web key={k} src={c.pair[k % 2]} />,
      )}
    </div>
  ));

  // Head: in after a beat, out before the seam.
  const inLogo = interpolate(frame, [24, 46], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });
  const inLine = interpolate(frame, [34, 58], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });
  const out = interpolate(frame, [durationInFrames - 30, durationInFrames - 6], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const [l1, l2] = LINES[line];
  const muted = line === "b";

  return (
    <AbsoluteFill style={{ background: "#0b0708", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: width * 0.2, top: height * 0.15, width: width * 1.1, height: height, borderRadius: "50%",
        background: "radial-gradient(closest-side, rgba(226,24,51,.30), rgba(226,24,51,0) 72%)" }} />
      <div style={{ position: "absolute", left: L.planeLeft, top: 0, transformOrigin: "0 0", transform: `rotate(${TILT}deg)` }}>
        {cols}
      </div>
      {L.fade === "top" ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: L.head.top + 470,
          background: "linear-gradient(180deg, #0b0708 0%, rgba(11,7,8,.92) 50%, rgba(11,7,8,0) 100%)" }} />
      ) : (
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 900,
          background: "linear-gradient(90deg, #0b0708 0%, #0b0708 38%, rgba(11,7,8,.8) 60%, rgba(11,7,8,0) 100%)" }} />
      )}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 180, background: "linear-gradient(0deg, rgba(11,7,8,.55), rgba(11,7,8,0))" }} />

      {bare ? null : (
      <div style={{ position: "absolute", left: L.head.left, top: L.head.top, transform: L.head.centerY ? "translateY(-50%)" : undefined }}>
        <Img src={staticFile("wall/campusai-wordmark-white.svg")}
          style={{ width: L.head.logo, display: "block", opacity: inLogo * out, transform: `translateY(${(1 - inLogo) * 18}px)` }} />
        <div style={{ marginTop: L.head.size * 0.52, fontFamily, fontWeight: 700, fontSize: L.head.size, lineHeight: 1.04,
          letterSpacing: "-0.025em", color: "#fff", opacity: inLine * out, transform: `translateY(${(1 - inLine) * 22}px)` }}>
          {l1}
          <br />
          <span style={{ color: muted ? "rgba(255,255,255,.55)" : "#fff" }}>{l2}</span>
        </div>
      </div>
      )}
    </AbsoluteFill>
  );
};
