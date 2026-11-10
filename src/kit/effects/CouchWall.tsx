/**
 * Couch wall (2026-11-10, from @mrcreates.ai's "17 effects" reel, 1.1 to 2.3 s, stepped frame by frame). What the reel
 * does: the speaker's background is replaced by a warm cream wall, a blue couch back slides up from the bottom of frame
 * behind him, then framed pictures (thin black frames, white mat, drop shadow, each a few degrees off level) pop onto the
 * wall around his head one at a time, about 4 frames apart, each with a small spring overshoot, until he sits in front of
 * a gallery wall.
 *
 * Ours: the real clip plays first; the camera pushes in while the wall comes down over his background, so the cutout's
 * ragged bottom edge (where the cutout stops) leaves frame before anything but the real clip sits behind it. The wall has
 * a faint warm gradient and he casts a soft shadow on it, so he sits in the room rather than floating. The couch is drawn.
 *
 * Props: `clip` (full clip with sound, path under public/), `person` (the same clip cut out, alpha webm), `from` (frames
 * into both), `source` (their pixel size), `bottom` (the source y that ends at the frame's bottom once pushed in: keep it
 * above the cutout's ragged edge), `scale` (the pushed-in scale), `wallAt` / `couchAt` / `picturesAt` / `every` (frames),
 * `pictures` (each a StillSource and its box on the wall in frame px, with `rot` degrees), `couchTop` (frame y),
 * `couchColor`, `wall` (two colours, light then shade), `sound`.
 *
 *   <CouchWall clip="founder/goal/clip.mp4" person="founder/goal/person.webm" source={{ w: 1080, h: 1920 }}
 *     bottom={1245} scale={1.3} pictures={[{ item: { src: "broll/week-0832.mp4", video: true, at: 2 }, x: 215, y: 905, w: 270, h: 340, rot: -3 }]} />
 */
import React from "react";
import { AbsoluteFill, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { OUT, Sfx, k, mix } from "./shared";
import { Still, StillSource } from "./Orbit";

export type WallPicture = { item: StillSource; /** centre, frame px */ x: number; y: number; w: number; h: number; rot: number };

export type CouchWallProps = {
  clip: string;
  person: string;
  from?: number;
  source: { w: number; h: number };
  bottom: number;
  scale: number;
  wallAt?: number;
  couchAt?: number;
  picturesAt?: number;
  every?: number;
  pictures: WallPicture[];
  couchTop?: number;
  couchColor?: { light: string; mid: string; dark: string };
  wall?: { light: string; shade: string };
  volume?: number;
  sound?: boolean;
};

const BLUE = { light: "#7F96BC", mid: "#4F6B98", dark: "#2C4266" };
const CREAM = { light: "#F6EEE1", shade: "#DFCCAE" };

/** A blue couch back: a frame and three back cushions, soft gradients, drawn 1080 wide at (0, 0). */
const Couch: React.FC<{ c: { light: string; mid: string; dark: string }; w: number; h: number }> = ({ c, w, h }) => {
  const cushions = [
    { x: -40, w: 420 },
    { x: 340, w: 400 },
    { x: 700, w: 420 },
  ];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        <linearGradient id="couch-cushion" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.light} />
          <stop offset="0.16" stopColor={c.mid} />
          <stop offset="1" stopColor={c.dark} />
        </linearGradient>
        <linearGradient id="couch-frame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.mid} />
          <stop offset="1" stopColor={c.dark} />
        </linearGradient>
        <radialGradient id="couch-side" cx="0.5" cy="0.2" r="0.8">
          <stop offset="0.55" stopColor="rgba(0,0,0,0)" />
          <stop offset="1" stopColor="rgba(10,20,40,0.35)" />
        </radialGradient>
        <filter id="couch-soft" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0E1A30" floodOpacity="0.45" />
        </filter>
      </defs>
      {/* the frame behind the cushions */}
      <rect x={-80} y={-26} width={w + 160} height={h + 60} rx={90} fill="url(#couch-frame)" />
      {cushions.map((q, i) => (
        <g key={i} filter="url(#couch-soft)">
          <rect x={q.x} y={8 + (i === 1 ? 6 : 0)} width={q.w} height={h + 40} rx={96} fill="url(#couch-cushion)" />
          <rect x={q.x} y={8 + (i === 1 ? 6 : 0)} width={q.w} height={h + 40} rx={96} fill="url(#couch-side)" />
          {/* the soft highlight along the top of the cushion */}
          <rect x={q.x + 40} y={20 + (i === 1 ? 6 : 0)} width={q.w - 80} height={10} rx={5} fill="rgba(255,255,255,0.16)" />
        </g>
      ))}
    </svg>
  );
};

export const CouchWall: React.FC<CouchWallProps> = (p) => {
  const f = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const from = p.from ?? 0;
  const wallAt = p.wallAt ?? 10;
  const couchAt = p.couchAt ?? wallAt + 14;
  const picturesAt = p.picturesAt ?? couchAt + 10;
  const every = p.every ?? 4;
  const couchTop = p.couchTop ?? 1430;
  const c = p.couchColor ?? BLUE;
  const wall = p.wall ?? CREAM;

  // the push: from the clip as shot (scale 1, full frame) to the framing whose bottom is `bottom`
  const push = k(f, wallAt, wallAt + 12, OUT);
  const s = mix(1, p.scale, push);
  const B = mix(p.source.h, p.bottom, push);
  const vLeft = width / 2 - (p.source.w / 2) * s;
  const vTop = height - B * s;
  const video: React.CSSProperties = { position: "absolute", left: vLeft, top: vTop, width: p.source.w * s, height: p.source.h * s, maxWidth: "none" };

  // the wall comes down from the top, and never below the line where the cutout stops being clean
  const wipe = mix(-80, height + 80, k(f, wallAt - 2, wallAt + 9, OUT));
  const cleanLine = (p.bottom - B) * s + height;
  const wallTo = Math.min(wipe, cleanLine);
  const wallIn = k(f, wallAt - 2, wallAt + 9, OUT);
  const feather = 70;

  const couchIn = k(f, couchAt, couchAt + 12, OUT);
  const couchH = height - couchTop + 40;
  const couchY = couchTop + (1 - couchIn) * (couchH + 60);

  return (
    <AbsoluteFill style={{ background: wall.light, overflow: "hidden" }}>
      <OffthreadVideo src={staticFile(p.clip)} startFrom={from} volume={p.volume ?? 1} style={video} />

      {/* the wall: a warm cream with a faint gradient and a little light from the upper left */}
      {wallTo > 0 ? (
        <AbsoluteFill style={{
          background: `radial-gradient(ellipse 85% 60% at 38% 30%, ${wall.light} 0%, ${wall.light} 25%, ${wall.shade} 100%)`,
          WebkitMaskImage: `linear-gradient(to bottom, black ${Math.max(0, wallTo - feather)}px, transparent ${wallTo}px)`,
          maskImage: `linear-gradient(to bottom, black ${Math.max(0, wallTo - feather)}px, transparent ${wallTo}px)` }} />
      ) : null}

      {/* the pictures, one at a time, each landing with a small overshoot */}
      {p.pictures.map((q, i) => {
        const at = picturesAt + i * every;
        if (f < at) return null;
        const pop = spring({ frame: f - at, fps, config: { damping: 13, stiffness: 210, mass: 0.8 } });
        const mat = Math.round(Math.min(q.w, q.h) * 0.09);
        return (
          <div key={i} style={{ position: "absolute", left: q.x - q.w / 2, top: q.y - q.h / 2, width: q.w, height: q.h,
            transform: `rotate(${(q.rot + (1 - pop) * 5).toFixed(3)}deg) scale(${pop.toFixed(4)})`, opacity: Math.min(1, pop * 3),
            background: "#141414", padding: 6, boxSizing: "border-box",
            boxShadow: "0 22px 34px rgba(70, 45, 20, 0.30), 0 5px 10px rgba(40, 25, 10, 0.22)" }}>
            <div style={{ position: "relative", width: "100%", height: "100%", background: "#FBFAF7", padding: mat, boxSizing: "border-box" }}>
              <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.25)" }}>
                <Still item={q.item} />
              </div>
            </div>
          </div>
        );
      })}

      {/* the couch back, sliding up behind him, with its soft shadow on the wall */}
      {couchIn > 0 ? (
        <>
          <div style={{ position: "absolute", left: -100, width: width + 200, top: couchY - 70, height: 160, opacity: couchIn,
            background: "radial-gradient(ellipse 50% 50% at 50% 60%, rgba(90, 60, 30, 0.28), rgba(90, 60, 30, 0))" }} />
          <div style={{ position: "absolute", left: 0, top: couchY, width, height: couchH }}>
            <Couch c={c} w={width} h={couchH} />
          </div>
        </>
      ) : null}

      {/* him, cut out, casting a soft shadow on the wall once it is there */}
      <OffthreadVideo src={staticFile(p.person)} startFrom={from} muted transparent
        style={{ ...video, filter: `drop-shadow(-18px 30px 40px rgba(70, 45, 20, ${(0.5 * wallIn).toFixed(3)}))` }} />

      <Sfx at={couchAt} name="paper-slide" volume={0.3} on={p.sound ?? true} />
    </AbsoluteFill>
  );
};
