/**
 * The calm tour (wave 1, 2026-10-22). The brand piece for the website and LinkedIn: CampusAI is a real
 * product you open in your browser, and this is where you find everything.
 *
 * One continuous move: the real laptop in the dark (LaptopRoom, studio preset) with the dashboard on its
 * glass; the camera pushes in until the glass fills the frame and passes through it; the page lets go
 * onto a slow glide across five real surfaces (SlowGlide); the last one opens back up to fill the frame
 * and the camera pulls back out of the glass to the laptop, its screen brightening; the logo arrives (NameToLogo,
 * shimmer, no name line since round 2). Brief, facts and shot list: Content/video-studio/films/calm-tour/.
 *
 * THE TWO HAND-OFFS (why there is no visible swap)
 *   The glass shows a `node` screen: the page laid "cover" on the glass, so it shows CSS x 22.5 to
 *   1417.5 and the full 900 height (the glass is 1.55 wide to 1, the page 1.6). The camera ends square
 *   on the glass at fill F, so the glass is F x 1920 px wide, centred. The glide's first card is given
 *   exactly that crop and width, untilted, with SlowGlide's own 3 degree arc cancelled through its tilt
 *   prop, so for ten frames the two layers are the same picture and one dissolves into the other. The
 *   only thing that changes is the glass's own reflection, which goes away: we are through it.
 *   The exit is the same thing backwards.
 *
 * Everything on screen is a real capture (public/w1/calm-tour/*.jpg are public/pass captures with the
 * Maryland mark painted out by cover-mark.py; the planner is cropped from CSS y 250, below its
 * disclaimer card, so "Testudo" never shows). Every line is the product's own heading.
 *
 * Render: npx remotion render src/wave1/calm-tour/entry.ts Tour-16x9 out/w1/Tour-16x9.mp4 --crf 16 --concurrency=2 --gl=angle
 */
import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import {
  brand,
  useBrandFonts,
  LaptopRoom,
  LogoOpen,
  NameToLogo,
  SlowGlide,
  roomPose,
} from "../../kit";
import type { Rect, Size } from "../../kit";
import { onScreen, type CamKey } from "../../four/real-laptop";

const B = brand("campusai");
export const W = 1920;
export const H = 1080;
export const FPS = 30;
const ASPECT = W / H;

/* ------------------------------------------------------------------ timing (frames, 30 fps) */
// Music: G Eazy NBA type (~86.1 BPM, a beat is 20.93 frames). Its drums drop at 14.73 s; the track is
// trimmed so the drop lands on the pass through the glass (frame 104). Beats then fall at 104 + 20.93 k.
const BEAT = (60 / 86.13) * FPS;
const beat = (k: number) => Math.round(104 + BEAT * k);
const MUSIC_TRIM = Math.round((14.73 - 104 / FPS) * FPS);

const PUSH_END = 100; // camera square on the glass
const IN_FADE = [100, 110] as const; // glass dissolves into the flat page
const ROOM_IN_END = 114;
const GLIDE_FROM = 100; // the glide sequence starts here (global)
const RELEASE = [10, 62] as const; // local: the page lets go onto its rail (overlaps the glide's eased start)
const GLIDE_AT = 56; // local: the train starts moving (card 0 rests so its line reads 2.4 s)
const TRAVEL = 268; // local: first card centred to last card centred
const OPEN = [GLIDE_AT + TRAVEL + 22, GLIDE_AT + TRAVEL + 52] as const; // local: the last card rests (its line reads), then opens to fill (30 f; round 2, was 38)
const GLIDE_LEN = OPEN[1] + 14;
const OUT_FROM = GLIDE_FROM + OPEN[1]; // room-out starts (global)
const OUT_FADE = [OUT_FROM, OUT_FROM + 10] as const;
const PULL = [10, 62] as const; // local to room-out: the camera pulls back out of the glass
const LOGO_AT = beat(21); // round 2: no name line, the logo arrives as the pull settles (pull ends at OUT_FROM + 62)
const SHEEN_AT = LOGO_AT + 30;
export const DURATION = SHEEN_AT + 62 + 24;

/* ------------------------------------------------------------------ the surfaces */

const PAGE: Size = { w: 1440, h: 900 };
const img = (n: string) => staticFile(`w1/calm-tour/${n}.jpg`);
/** What the glass shows of a 1440 x 900 page: "cover" on a 1.55 panel. */
const GLASS_CROP: Rect = { x: 22.5, y: 0, w: 1395, h: 900 };
/** Round 2: what the exit glass shows of the answered page, a 1.55 window around the Ask CampusAI card, so
 * the return opens only 289 CSS px of the brief above it (the whole page showed 428). */
const GLASS_CROP_OUT: Rect = { x: 236, y: 139, w: 1180, h: 761 };
const FILL = 1.02;
const GLASS_W = W * FILL;

type Surface = { src: string; page: Size; crop: Rect; line: string };
const SURFACES: Surface[] = [
  { src: img("dashboard"), page: PAGE, crop: { x: 0, y: 0, w: 1440, h: 800 }, line: "Your daily brief" },
  { src: img("jobmatch"), page: PAGE, crop: { x: 0, y: 0, w: 1440, h: 770 }, line: "Jobs for you" },
  { src: staticFile("pass/planner-tall.jpg"), page: { w: 1440, h: 1991 }, crop: { x: 0, y: 250, w: 1440, h: 630 }, line: "Maya's 4-year plan" },
  { src: img("calendar"), page: PAGE, crop: { x: 0, y: 0, w: 1440, h: 790 }, line: "October 2026" },
  { src: img("chat-answer"), page: PAGE, crop: { x: 0, y: 402, w: 1440, h: 470 }, line: "Ask CampusAI" },
];
const CARD_W = 1240;
const PITCH = 820;
const TILT = { x: 22, y: -18, z: 3 };

/* ------------------------------------------------------------------ cameras */

const PUSH_EASE = Easing.bezier(0.72, 0, 0.24, 1);
const START = roomPose([-0.6, 0.5, 0.64], [-1, 11, -4], 132);
const GLASS = onScreen(0.5, 0.5, FILL, ASPECT);
const ROOM_IN_CAM: CamKey[] = [
  { at: 0, ...START },
  { at: PUSH_END, ...GLASS, ease: PUSH_EASE },
];
const END_POSE = roomPose([0.0, 0.5, 0.87], [0, 18.8, -5], 112); // round 2: closer, so the end frame is a product shot
const ROOM_OUT_CAM: CamKey[] = [
  { at: 0, ...GLASS },
  { at: PULL[0], ...GLASS },
  { at: PULL[1], ...END_POSE, ease: Easing.bezier(0.55, 0, 0.2, 1) },
  { at: 300, ...roomPose([0.0, 0.5, 0.87], [0, 18.85, -5], 115), ease: Easing.linear },
];

/* ------------------------------------------------------------------ the glass */

/** The page laid on the glass, cover-fit (the RealLaptop node screen is 1440 wide). */
const GlassPage: React.FC<{ src: string }> = ({ src }) => (
  <div style={{ position: "absolute", inset: 0, background: B.color.bg }}>
    <Img src={src} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
  </div>
);

/** Round 2, the exit glass: the GLASS_CROP_OUT window of the page, and the screen brightening as the camera
 * pulls back (the screen is the light of the end frame). Brightness is 1 at the hand-off so it matches the flat card. */
const NODE_W = 1440;
const GlassWindow: React.FC<{ src: string; crop: Rect }> = ({ src, crop }) => {
  const f = useCurrentFrame();
  const k = NODE_W / crop.w;
  // the window is centred on the glass (like the entry's cover fit), so a panel a few px off 1.55 splits evenly
  const lift = interpolate(f, [PULL[0] + 6, PULL[1] + 10], [1, 1.32], { ...clamp, easing: Easing.inOut(Easing.sin) });
  return (
    <div style={{ position: "absolute", inset: 0, background: B.color.bg, overflow: "hidden" }}>
      <Img src={src} style={{ position: "absolute", left: -crop.x * k, top: `calc(50% - ${((crop.y + crop.h / 2) * k).toFixed(2)}px)`, width: PAGE.w * k, height: PAGE.h * k, maxWidth: "none",
        filter: lift > 1.001 ? `brightness(${lift.toFixed(3)})` : undefined }} />
    </div>
  );
};

/* ------------------------------------------------------------------ the glide, with both hand-offs */

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const mixRect = (a: Rect, b: Rect, k: number): Rect => ({ x: mix(a.x, b.x, k), y: mix(a.y, b.y, k), w: mix(a.w, b.w, k), h: mix(a.h, b.h, k) });
const SETTLE = Easing.bezier(0.45, 0, 0.2, 1);

const Glide: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  // SlowGlide's ambient arc (3 to -3 degrees, linear over its sequence), cancelled while a card is flat
  const life = interpolate(f, [0, durationInFrames], [0, 1], clamp);
  const arc = interpolate(life, [0, 1], [3, -3]);
  const rel = interpolate(f, [RELEASE[0], RELEASE[1]], [0, 1], { ...clamp, easing: SETTLE });
  const opn = interpolate(f, [OPEN[0], OPEN[1]], [0, 1], { ...clamp, easing: SETTLE });
  // 0 = flat and frame filling, 1 = on the rail
  const k = f < OPEN[0] ? rel : 1 - opn;
  const width = mix(GLASS_W, CARD_W, k);
  const s = width / CARD_W;
  const surfaces = SURFACES.map((x, i) => {
    if (i === 0) return { ...x, crop: mixRect(GLASS_CROP, x.crop, rel) };
    if (i === SURFACES.length - 1) return { ...x, crop: mixRect(x.crop, GLASS_CROP_OUT, opn) };
    return x;
  });
  return (
    <SlowGlide
      brand={B}
      surfaces={surfaces}
      at={GLIDE_AT}
      travel={TRAVEL}
      ramp={34}
      cardWidth={width}
      pitch={PITCH * s}
      tilt={{ x: TILT.x * k, y: mix(-arc, TILT.y, k), z: TILT.z * k }}
      drift={1}
      lineSize={54}
    />
  );
};

/* ------------------------------------------------------------------ sound */

const sfx = (n: string) => staticFile(`w1/calm-tour/audio/${n}.mp3`);
const CUES: { at: number; file: string; volume: number }[] = [
  { at: 2, file: "light-aura", volume: 0.35 }, // the logo arrives
  { at: 78, file: "air-woosh-deep", volume: 0.5 }, // the push reaches the glass
  { at: OUT_FROM + 8, file: "swoosh-slow", volume: 0.35 }, // the pull back out
  { at: SHEEN_AT - 2, file: "shimmer-sparkle-sweep", volume: 0.4 }, // the sheen across the logo
];

const musicVolume = (f: number) =>
  interpolate(f, [0, 8, PUSH_END, PUSH_END + 4, SHEEN_AT + 10, DURATION - 2], [0, 0.55, 0.62, 0.8, 0.8, 0], clamp);

/* ------------------------------------------------------------------ the film */

export const CalmTour: React.FC = () => {
  useBrandFonts(B);
  const f = useCurrentFrame();
  const inFade = interpolate(f, [IN_FADE[0], IN_FADE[1]], [0, 1], clamp);
  const outFade = interpolate(f, [OUT_FADE[0], OUT_FADE[1]], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: B.color.bgDeep }}>
      <Sequence from={0} durationInFrames={ROOM_IN_END} layout="none">
        <AbsoluteFill>
          <LaptopRoom screen={{ node: <GlassPage src={img("dashboard")} /> }} preset="studio" camera={ROOM_IN_CAM} brand={B} />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={GLIDE_FROM} durationInFrames={GLIDE_LEN} layout="none">
        <AbsoluteFill style={{ opacity: inFade, background: B.color.bgDeep, backgroundImage: B.color.gradient }}>
          <Glide />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={OUT_FROM} layout="none">
        <AbsoluteFill style={{ opacity: outFade }}>
          <LaptopRoom screen={{ node: <GlassWindow src={img("chat-answer")} crop={GLASS_CROP_OUT} /> }} preset="studio" camera={ROOM_OUT_CAM} brand={B}
            light={{ bloom: 0.2, spill: { color: [1, 0.9, 0.9], power: 34 } }} />
        </AbsoluteFill>
      </Sequence>

      {/* the logo inside the first second, over the dark above the laptop; it leaves as the push quickens */}
      <LogoOpen brand={B} at={4} x={W / 2} y={190} width={400} leaveAt={44} />

      <NameToLogo
        brand={B}
        variant="shimmer"
        x={W / 2}
        y={250}
        width={460}
        logoAt={LOGO_AT}
        sheenAt={SHEEN_AT}
      />

      <Audio src={sfx("g-eazy-nba-type")} trimBefore={MUSIC_TRIM} volume={(fr: number) => musicVolume(fr)} />
      {CUES.map((c) => (
        <Sequence key={c.file} from={c.at} layout="none">
          <Audio src={sfx(c.file)} volume={c.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
