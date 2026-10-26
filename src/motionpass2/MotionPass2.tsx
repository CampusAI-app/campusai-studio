/**
 * Motion pass 2 (2026-10-23): three logo builds, three website background loops, one kinetic type
 * loop. Motion lane, no product screens. Its own entry (`./entry.ts`) so Root.tsx is never edited:
 *   npx remotion render src/motionpass2/entry.ts MP2-LogoLock-1x1 out/mp2/MP2-LogoLock-1x1.mp4 --crf 16
 * Brief, with the reasoning per piece: Content/video-studio/films/motion-pass-2/brief.md
 *
 * Every logo build is made of the real logo's own parts: its eight letter paths and the red sparkle,
 * lifted from public/brand/campusai-logo-white.svg and drawn one part at a time. One thing in that
 * file nobody uses yet: the "a" and the "m" carry matching notches, so between them sits a
 * sparkle-shaped hole the same shape as the red dot. MP2-LogoLock is built on it.
 */
import React from "react";
import { AbsoluteFill, Composition, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { brand, glow, useBrandFonts } from "../kit/brand";
import { EASE, EASE_CAMERA } from "../lib/anim";

const B = brand("campusai");
const FPS = 30;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const EXPO_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ramp = (f: number, a: number, b: number, easing = EASE) => interpolate(f, [a, b], [0, 1], { ...clamp, easing });

/* ------------------------------------------------------------------ the logo, part by part */

type PartId = "c" | "a" | "m" | "p" | "u" | "s" | "a2" | "i" | "spark";
/** The real logo, one path per part (public/brand/campusai-logo-white.svg). */
const D: Record<PartId, string> = {
  c: "M0 26.4238C0 23.6992 0.554432 21.323 1.6633 19.2954C2.77216 17.2361 4.30873 15.652 6.27301 14.5431C8.23728 13.4025 10.4867 12.8323 13.0212 12.8323C16.2845 12.8323 18.9774 13.656 21.1001 15.3035C23.2545 16.9192 24.696 19.2003 25.4247 22.1467H18.2487C17.8686 21.0062 17.2191 20.1191 16.3003 19.4855C15.4132 18.8201 14.3044 18.4875 12.9737 18.4875C11.0728 18.4875 9.56792 19.1845 8.45905 20.5785C7.35019 21.9408 6.79576 23.8892 6.79576 26.4238C6.79576 28.9267 7.35019 30.8751 8.45905 32.2691C9.56792 33.6314 11.0728 34.3126 12.9737 34.3126C15.6667 34.3126 17.425 33.1087 18.2487 30.7008H25.4247C24.696 33.5522 23.2545 35.8175 21.1001 37.4966C18.9457 39.1757 16.2528 40.0153 13.0212 40.0153C10.4867 40.0153 8.23728 39.4609 6.27301 38.352C4.30873 37.2115 2.77216 35.6274 1.6633 33.5997C0.554432 31.5404 0 29.1484 0 26.4238Z",
  a: "M39.1204 12.8323C41.0845 12.8323 42.7949 13.2288 44.2522 14.0208C45.7411 14.8127 46.9296 15.8102 47.8167 17.0139V13.26H54.5178V21.8264C53.2466 23.9703 51.1932 25.5956 48.7502 26.3088C51.1929 27.022 53.2466 28.6468 54.5178 30.7903V39.5872H47.8167V35.7385C46.9613 36.974 45.7728 38.0037 44.2522 38.8274C42.7632 39.6193 41.0366 40.0149 39.0725 40.0149C36.8548 40.0149 34.827 39.4454 32.9895 38.3049C31.1838 37.1645 29.7424 35.5643 28.6653 33.5051C27.6198 31.4141 27.0969 29.0213 27.0969 26.3284C27.097 23.6674 27.6199 21.3074 28.6653 19.2483C29.7424 17.189 31.1837 15.6042 32.9895 14.4954C34.827 13.3865 36.8709 12.8323 39.1204 12.8323ZM40.8313 18.678C39.5958 18.678 38.4549 18.9784 37.4094 19.5803C36.364 20.1822 35.5083 21.0693 34.843 22.2415C34.2094 23.3819 33.8929 24.7444 33.8928 26.3284C33.8928 27.9125 34.2094 29.3071 34.843 30.511C35.5083 31.6832 36.364 32.5864 37.4094 33.22C38.4865 33.8535 39.6275 34.1702 40.8313 34.1702C42.0668 34.1701 43.223 33.8688 44.3 33.2668C45.3772 32.6332 46.2328 31.7463 46.8665 30.6057C47.5 29.4336 47.8166 28.0397 47.8167 26.4241C47.8167 24.8083 47.5001 23.4298 46.8665 22.2893C46.2328 21.1171 45.3772 20.2301 44.3 19.6282C43.223 18.9946 42.0668 18.678 40.8313 18.678Z",
  m: "M88.9595 12.8794C92.1909 12.8794 94.7892 13.8776 96.7534 15.8735C98.7491 17.8377 99.7465 20.594 99.7466 24.1421V39.5874H93.0933V25.0454C93.0933 22.9862 92.5713 21.4175 91.5259 20.3403C90.4804 19.2315 89.0544 18.6773 87.2485 18.6772C85.4428 18.6772 84.0015 19.2317 82.9243 20.3403C81.8788 21.4175 81.356 22.9861 81.356 25.0454V39.5874H74.7026V25.0454C74.7026 22.9861 74.1798 21.4175 73.1343 20.3403C72.0888 19.2315 70.6628 18.6772 68.8569 18.6772C67.0195 18.6773 65.562 19.2315 64.4849 20.3403C63.4394 21.4175 62.9165 22.9861 62.9165 25.0454V39.5874H56.2632V31.2017C57.5082 28.8553 59.6646 27.0671 62.2612 26.3091C59.6642 25.551 57.5081 23.7615 56.2632 21.4146V13.2593H62.9165V16.4438C63.7719 15.335 64.8652 14.4632 66.1958 13.8296C67.558 13.196 69.047 12.8794 70.6626 12.8794C72.7219 12.8794 74.5595 13.3234 76.1753 14.2104C77.791 15.0658 79.0431 16.3008 79.9302 17.9165C80.7855 16.396 82.0207 15.176 83.6362 14.2573C85.2837 13.3386 87.0586 12.8794 88.9595 12.8794Z",
  p: "M108.263 17.0618C109.119 15.8579 110.291 14.8599 111.78 14.0679C113.301 13.2441 115.027 12.8323 116.96 12.8323C119.209 12.8323 121.237 13.3867 123.043 14.4956C124.88 15.6044 126.322 17.1885 127.367 19.2478C128.445 21.2755 128.983 23.6358 128.983 26.3287C128.983 29.0217 128.445 31.4137 127.367 33.5047C126.322 35.564 124.88 37.1639 123.043 38.3045C121.237 39.445 119.209 40.0153 116.96 40.0153C115.027 40.0153 113.317 39.6193 111.828 38.8272C110.37 38.0352 109.182 37.0372 108.263 35.8333V52.1336H101.61V13.26H108.263V17.0618ZM122.187 26.3287C122.187 24.7447 121.855 23.3823 121.189 22.2418C120.556 21.0696 119.7 20.1825 118.623 19.5805C117.578 18.9786 116.437 18.6776 115.202 18.6776C113.998 18.6776 112.857 18.9944 111.78 19.628C110.734 20.23 109.879 21.1171 109.214 22.2893C108.58 23.4615 108.263 24.8397 108.263 26.4238C108.263 28.0079 108.58 29.386 109.214 30.5583C109.879 31.7305 110.734 32.6334 111.78 33.2671C112.857 33.869 113.998 34.17 115.202 34.17C116.437 34.17 117.578 33.8532 118.623 33.2195C119.7 32.5859 120.556 31.683 121.189 30.5107C121.855 29.3385 122.187 27.9445 122.187 26.3287Z",
  u: "M155.939 13.26V39.5876H149.238V36.261C148.383 37.4016 147.258 38.3045 145.864 38.9698C144.502 39.6035 143.013 39.9203 141.397 39.9203C139.338 39.9203 137.516 39.4926 135.932 38.6372C134.348 37.7501 133.096 36.467 132.178 34.7878C131.29 33.077 130.847 31.0494 130.847 28.7049V13.26H137.5V27.7545C137.5 29.8455 138.023 31.4612 139.068 32.6018C140.114 33.7106 141.54 34.2651 143.345 34.2651C145.183 34.2651 146.624 33.7106 147.67 32.6018C148.715 31.4612 149.238 29.8455 149.238 27.7545V13.26H155.939Z",
  s: "M169.303 40.0153C167.149 40.0153 165.216 39.6351 163.505 38.8748C161.795 38.0827 160.432 37.0214 159.419 35.6907C158.436 34.3601 157.898 32.8869 157.803 31.2711H164.503C164.63 32.2849 165.121 33.1245 165.977 33.7898C166.864 34.4551 167.957 34.7878 169.256 34.7878C170.523 34.7878 171.505 34.5343 172.202 34.0274C172.931 33.5205 173.295 32.871 173.295 32.079C173.295 31.2236 172.852 30.59 171.965 30.1781C171.109 29.7345 169.731 29.2593 167.83 28.7524C165.866 28.2772 164.25 27.7861 162.983 27.2792C161.747 26.7723 160.67 25.9961 159.751 24.9506C158.864 23.9051 158.421 22.4952 158.421 20.7211C158.421 19.2637 158.832 17.9331 159.656 16.7291C160.512 15.5252 161.715 14.5748 163.268 13.8778C164.852 13.1808 166.705 12.8323 168.828 12.8323C171.965 12.8323 174.467 13.6243 176.337 15.2084C178.206 16.7608 179.236 18.8677 179.426 21.5289H173.058C172.963 20.4834 172.519 19.6597 171.727 19.0578C170.967 18.4241 169.937 18.1073 168.638 18.1073C167.434 18.1073 166.499 18.3291 165.834 18.7726C165.2 19.2162 164.884 19.834 164.884 20.626C164.884 21.5131 165.327 22.1943 166.214 22.6695C167.101 23.113 168.48 23.5724 170.349 24.0476C172.25 24.5229 173.818 25.0139 175.054 25.5209C176.289 26.0278 177.35 26.8198 178.238 27.897C179.156 28.9425 179.632 30.3365 179.663 32.079C179.663 33.5997 179.236 34.962 178.38 36.166C177.556 37.3699 176.352 38.3203 174.768 39.0173C173.216 39.6826 171.394 40.0153 169.303 40.0153Z",
  a2: "M183.103 26.328C183.103 23.6667 183.625 21.3064 184.671 19.2471C185.748 17.1878 187.189 15.6037 188.995 14.4948C190.833 13.386 192.876 12.8315 195.126 12.8315C197.09 12.8315 198.801 13.2276 200.258 14.0196C201.747 14.8117 202.935 15.8096 203.822 17.0135V13.2592H210.523V39.5869H203.822V35.7375C202.967 36.9731 201.779 38.0028 200.258 38.8265C198.769 39.6185 197.043 40.0146 195.078 40.0146C192.861 40.0146 190.833 39.4443 188.995 38.3038C187.189 37.1632 185.748 35.5633 184.671 33.504C183.625 31.4129 183.103 29.021 183.103 26.328ZM203.822 26.4231C203.822 24.8073 203.506 23.4291 202.872 22.2886C202.238 21.1163 201.383 20.2293 200.306 19.6273C199.229 18.9937 198.072 18.6768 196.837 18.6768C195.601 18.6768 194.46 18.9778 193.415 19.5798C192.369 20.1817 191.514 21.0688 190.849 22.2411C190.215 23.3816 189.898 24.7439 189.898 26.328C189.898 27.9121 190.215 29.3061 190.849 30.51C191.514 31.6822 192.369 32.5852 193.415 33.2188C194.492 33.8525 195.633 34.1693 196.837 34.1693C198.072 34.1693 199.229 33.8683 200.306 33.2663C201.383 32.6327 202.238 31.7456 202.872 30.6051C203.506 29.4328 203.822 28.0388 203.822 26.4231Z",
  i: "M220.348 13.2593V39.5867H213.694V13.2593H220.348Z",
  spark: "M223 5.82387C220.2 5.00657 217.993 2.79984 217.176 0C216.359 2.79984 214.152 5.00657 211.352 5.82387C214.152 6.64117 216.359 8.8479 217.176 11.6477C217.993 8.8479 220.2 6.64117 223 5.82387Z",
};
/** Horizontal extent of each part in logo units (viewBox 223 x 53). */
const BOX: Record<PartId, { x0: number; x1: number }> = {
  c: { x0: 0, x1: 25.43 },
  a: { x0: 27.1, x1: 54.52 },
  m: { x0: 56.26, x1: 99.75 },
  p: { x0: 101.61, x1: 128.99 },
  u: { x0: 130.85, x1: 155.94 },
  s: { x0: 157.8, x1: 179.67 },
  a2: { x0: 183.1, x1: 210.53 },
  i: { x0: 213.69, x1: 220.35 },
  spark: { x0: 211.35, x1: 223 },
};
const LETTERS: PartId[] = ["c", "a", "m", "p", "u", "s", "a2", "i"];
const LW = 223;
const LH = 53;
/** The red dot's centre and width, logo units. */
const DOT = { x: 217.176, y: 5.824, w: 11.648 };
/** The sparkle-shaped hole between the a and the m, logo units (its points sit at x 48.75 and 62.26). */
const NOTCH = { x: 55.5, y: 26.31, fit: 1.16 };
const INK = B.color.ink;

type PartStyle = {
  /** Offset in logo units. */
  tx?: number;
  ty?: number;
  scale?: number;
  scaleY?: number;
  rot?: number;
  rotY?: number;
  origin?: string;
  opacity?: number;
  blur?: number;
  bright?: number;
};

/** One letter, drawn in place inside a logo-sized box (`k` px per logo unit). */
const Letter: React.FC<{ id: PartId; k: number; st?: PartStyle }> = ({ id, k, st = {} }) => {
  const b = BOX[id];
  const w = b.x1 - b.x0;
  const op = st.opacity ?? 1;
  if (op <= 0.001) return null;
  const filters = [st.blur ? `blur(${st.blur.toFixed(2)}px)` : "", st.bright !== undefined ? `brightness(${st.bright.toFixed(3)})` : ""].join(" ").trim();
  return (
    <div
      style={{
        position: "absolute", left: b.x0 * k, top: 0, width: w * k, height: LH * k, opacity: op,
        transform: `translate(${((st.tx ?? 0) * k).toFixed(2)}px, ${((st.ty ?? 0) * k).toFixed(2)}px) rotateY(${(st.rotY ?? 0).toFixed(3)}deg) rotate(${(st.rot ?? 0).toFixed(3)}deg) scale(${(st.scale ?? 1).toFixed(4)}, ${((st.scale ?? 1) * (st.scaleY ?? 1)).toFixed(4)})`,
        transformOrigin: st.origin ?? "50% 50%", filter: filters || undefined, backfaceVisibility: "hidden",
      }}
    >
      <svg viewBox={`${b.x0} 0 ${w} ${LH}`} width={w * k} height={LH * k} style={{ display: "block", overflow: "visible" }}>
        <path d={D[id]} fill={INK} />
      </svg>
    </div>
  );
};

/** The red sparkle, centred on a canvas point, `size` px wide, with its own light. */
const Spark: React.FC<{ x: number; y: number; size: number; rot?: number; opacity?: number; blur?: number; glowPx?: number; glowA?: number; uid: string }> = ({
  x, y, size, rot = 0, opacity = 1, blur = 0, glowPx = 18, glowA = 0.55, uid,
}) => {
  if (opacity <= 0.001) return null;
  const f = [blur > 0.01 ? `blur(${blur.toFixed(2)}px)` : "", glowPx > 0 ? `drop-shadow(0 0 ${glowPx.toFixed(1)}px ${glow(B, glowA)})` : ""].join(" ").trim();
  return (
    <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, opacity, transform: `rotate(${rot.toFixed(3)}deg)`, filter: f || undefined }}>
      <svg viewBox={`211.352 0 ${DOT.w} 11.6477`} width={size} height={size} style={{ display: "block", overflow: "visible" }}>
        <defs>
          <linearGradient id={`sg-${uid}`} x1="217.176" y1="0" x2="217.176" y2="11.6476" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF5068" />
            <stop offset="1" stopColor="#E21833" />
          </linearGradient>
        </defs>
        <path d={D.spark} fill={`url(#sg-${uid})`} />
      </svg>
    </div>
  );
};

/** Logo-unit point to canvas px, for a logo of scale `k` centred at (cx, cy) and shifted by `tx` px. */
const toPx = (u: number, v: number, k: number, cx: number, cy: number, tx = 0) => ({ x: cx - (LW / 2) * k + u * k + tx, y: cy - (LH / 2) * k + v * k });

/** The film ground every CampusAI piece sits on. */
const Ground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useBrandFonts(B);
  return <AbsoluteFill style={{ background: B.color.bgDeep, backgroundImage: B.color.gradient, overflow: "hidden" }}>{children}</AbsoluteFill>;
};

/** The held end never goes fully still: 1% over the hold. */
const breathe = (f: number, from: number, len: number) => 1 + 0.01 * ramp(f, from, from + len, Easing.inOut(Easing.sin));

/* ------------------------------------------------------------------ A1. Lock: the dot fits the a·m notch */

const LOCK_LEN = 120;
const LogoLock: React.FC = () => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const k = 760 / LW;
  const cy = H / 2;
  // the camera tracks: notch centred at the start, the whole logo centred by f78
  const track = (LW / 2 - NOTCH.x) * k * (1 - ramp(f, 40, 78, EASE_CAMERA));
  const hold = breathe(f, 96, 24);
  const ox = W / 2 - (LW / 2) * k + track;
  const oy = cy - (LH / 2) * k;

  // the a and the m clamp the sparkle (f22 to 38)
  const clampK = ramp(f, 22, 38, EXPO_OUT);
  const aSt: PartStyle = { tx: -46 * (1 - clampK), opacity: ramp(f, 22, 30) };
  const mSt: PartStyle = { tx: 46 * (1 - clampK), opacity: ramp(f, 22, 30) };
  // the rest telescope out (f42 to 72): the c from behind the a; p from behind the m, u from behind the p, and on,
  // each riding its neighbour, so a letter only ever crosses the one it came out of
  const st: Partial<Record<PartId, PartStyle>> = { a: aSt, m: mSt };
  const chain: [PartId, PartId, number][] = [["c", "a", 42], ["p", "m", 42], ["u", "p", 45], ["s", "u", 48], ["a2", "s", 51], ["i", "a2", 54]];
  for (const [id, from, at] of chain) {
    const p = ramp(f, at, at + 18, EASE);
    const base = from === "a" || from === "m" ? 0 : st[from]?.tx ?? 0;
    const hidden = id === "c" ? BOX.a.x0 + 3 - BOX.c.x0 : BOX[from].x1 - 3 - BOX[id].x1;
    // they only show once mostly clear of the letter they came from, so white never stacks on white
    st[id] = { tx: base + hidden * (1 - p), opacity: interpolate(p, [0.35, 0.8], [0, 1], clamp), blur: (1 - p) * 5 };
  }
  // the stem catches the dot when it lands (f96)
  const catchK = f >= 96 ? spring({ frame: f - 96, fps: FPS, config: { damping: 11, stiffness: 220 } }) : 0;
  st.i = { ...st.i, ty: (st.i?.ty ?? 0) + 1.1 * Math.sin(Math.PI * Math.min(1, catchK)) * (1 - ramp(f, 100, 110)) };

  // the sparkle
  let sx: number, sy: number, size: number, rot: number, op = 1, blur = 0, gA = 0.55, gPx = 18;
  const notchPx = { x: ox + NOTCH.x * k, y: oy + NOTCH.y * k };
  const dotPx = { x: ox + DOT.x * k, y: oy + DOT.y * k };
  const unit = DOT.w * k;
  if (f < 74) {
    const arrive = ramp(f, 0, 12, EXPO_OUT);
    const shrink = ramp(f, 12, 30, EASE);
    const s0 = lerp(7.2, 5.2, arrive);
    let s = lerp(s0, NOTCH.fit, shrink);
    // squeezed for a moment when the letters close on it
    s *= 1 - 0.07 * Math.sin(Math.PI * ramp(f, 36, 46, Easing.linear));
    size = unit * s;
    sx = notchPx.x;
    sy = notchPx.y;
    rot = lerp(-70, 0, ramp(f, 0, 30, EASE));
    op = ramp(f, -2, 3, Easing.linear);
    blur = (1 - arrive) * 12;
    gA = 0.55 + 0.35 * Math.sin(Math.PI * ramp(f, 36, 52, Easing.linear));
    gPx = 18 + 22 * Math.sin(Math.PI * ramp(f, 36, 52, Easing.linear));
  } else {
    // it leaves the notch, which shows the hole it came from, and arcs onto the i (f74 to 96)
    const p = ramp(f, 74, 96, EASE_CAMERA);
    sx = lerp(notchPx.x, dotPx.x, p);
    sy = lerp(notchPx.y, dotPx.y, p) - 30 * k * 4 * p * (1 - p);
    const land = f >= 96 ? spring({ frame: f - 96, fps: FPS, config: { damping: 12, stiffness: 200 } }) : 0;
    size = unit * (lerp(NOTCH.fit, 1, p) + (f >= 96 ? 0.12 * (1 - land) : 0)) * hold;
    rot = 90 * p;
    gPx = 18;
    // ride the hold's breathing, which scales about the canvas centre
    sx = W / 2 + (sx - W / 2) * hold;
    sy = cy + (sy - cy) * hold;
  }

  return (
    <Ground>
      <div style={{ position: "absolute", left: ox, top: oy, width: LW * k, height: LH * k, transform: `scale(${hold.toFixed(4)})`, transformOrigin: "50% 50%" }}>
        {LETTERS.map((id) => <Letter key={id} id={id} k={k} st={st[id]} />)}
      </div>
      <Spark uid="lock" x={sx} y={sy} size={size} rot={rot} opacity={op} blur={blur} glowA={gA} glowPx={gPx} />
    </Ground>
  );
};

/* ------------------------------------------------------------------ A2. Pull back out of the dot */

const PULL_LEN = 105;
const LogoPull: React.FC = () => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const k = 760 / LW;
  // camera: scale from inside the sparkle (130x) to 7x fast, then to 1x slow; focus from the dot to the logo centre
  const p1 = ramp(f, 0, 20, EXPO_OUT);
  const p2 = ramp(f, 20, 72, EASE_CAMERA);
  const S = f < 20 ? Math.exp(lerp(Math.log(130), Math.log(7), p1)) : Math.exp(lerp(Math.log(7), 0, p2));
  const fx = lerp(DOT.x, LW / 2, p2);
  const fy = lerp(DOT.y, LH / 2, p2);
  const hold = breathe(f, 80, 25);
  const ox = W / 2 - fx * k * S;
  const oy = H / 2 - fy * k * S;
  // letters come into focus right to left as the camera passes them
  const st = (id: PartId): PartStyle => {
    const d = (DOT.x - (BOX[id].x0 + BOX[id].x1) / 2) / 200; // 0 near the dot, 1 at the c
    const sharp = ramp(f, 22 + d * 34, 44 + d * 34, EASE);
    return { blur: (1 - sharp) * 10, opacity: 0.35 + 0.65 * sharp };
  };
  const rot = lerp(-28, 0, ramp(f, 0, 26, EXPO_OUT));
  const unit = DOT.w * k;
  return (
    <Ground>
      <div style={{ position: "absolute", left: ox, top: oy, width: LW * k, height: LH * k, transform: `scale(${(S * hold).toFixed(4)})`, transformOrigin: "0 0" }}>
        {LETTERS.map((id) => <Letter key={id} id={id} k={k} st={st(id)} />)}
        <Spark uid="pull" x={DOT.x * k} y={DOT.y * k} size={unit} rot={rot} glowPx={lerp(0, 16, ramp(f, 30, 72))} glowA={0.55} />
      </div>
    </Ground>
  );
};

/* ------------------------------------------------------------------ A3. Unfold from the i */

const UNFOLD_LEN = 120;
const UNFOLD_ORDER: PartId[] = ["a2", "s", "u", "p", "m", "a", "c"];
const LogoUnfold: React.FC = () => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const k = 760 / LW;
  const u: Partial<Record<PartId, number>> = {};
  UNFOLD_ORDER.forEach((id, n) => (u[id] = ramp(f, 16 + n * 6, 32 + n * 6, EASE)));
  // the visible word stays centred while it grows to the left
  // the left edge grows by each letter's own step (its left edge to its right neighbour's), so it ends exactly at the c
  let lead = BOX.i.x0;
  UNFOLD_ORDER.forEach((id, n) => {
    const right = n === 0 ? BOX.i.x0 : BOX[UNFOLD_ORDER[n - 1]].x0;
    lead -= (right - BOX[id].x0) * (u[id] ?? 0);
  });
  const centre = (Math.min(lead, BOX.spark.x0) + LW) / 2;
  const track = (LW / 2 - centre) * k;
  const hold = breathe(f, 84, 36);
  const ox = W / 2 - (LW / 2) * k + track;
  const oy = H / 2 - (LH / 2) * k;
  const st = (id: PartId): PartStyle => {
    if (id === "i") return { scaleY: ramp(f, 6, 18, EXPO_OUT), origin: "50% 74.7%" };
    const p = u[id] ?? 0;
    const ang = -90 * (1 - p);
    return { rotY: ang, origin: "100% 50%", opacity: p > 0.02 ? 1 : 0, bright: 0.3 + 0.7 * Math.cos((ang * Math.PI) / 180) };
  };
  const arrive = ramp(f, 0, 14, EXPO_OUT);
  const turn = ramp(f, 68, 86, EASE);
  const unit = DOT.w * k;
  const dot = toPx(DOT.x, DOT.y, k, W / 2, H / 2, track);
  return (
    <Ground>
      <div style={{ position: "absolute", left: ox, top: oy, width: LW * k, height: LH * k, perspective: 900, transform: `scale(${hold.toFixed(4)})`, transformOrigin: `${(LW / 2) * k}px 50%` }}>
        {LETTERS.map((id) => <Letter key={id} id={id} k={k} st={st(id)} />)}
      </div>
      <Spark uid="unfold" x={W / 2 + (dot.x - W / 2) * hold} y={H / 2 + (dot.y - H / 2) * hold} size={unit * lerp(3.2, 1, arrive) * hold}
        rot={lerp(120, 0, arrive) + 90 * turn} opacity={ramp(f, -2, 3, Easing.linear)} blur={(1 - arrive) * 8}
        glowPx={18 + 20 * Math.sin(Math.PI * turn)} glowA={0.55 + 0.3 * Math.sin(Math.PI * turn)} />
    </Ground>
  );
};

/* ------------------------------------------------------------------ B. Website background loops */

const BG_LEN = 360; // 12 s; every motion below is periodic in BG_LEN, so frame 360 is frame 0
const TAU = Math.PI * 2;

/** Fixed fine grain, the same on every frame, so dark gradients never band. */
const Grain: React.FC<{ opacity: number; id: string }> = ({ opacity, id }) => (
  <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity, mixBlendMode: "soft-light" }}>
    <filter id={`grain-${id}`}>
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter={`url(#grain-${id})`} />
  </svg>
);

/** A soft pool of light: an eased falloff (not a straight ramp), so pools blend without edges. */
const rg = (cx: number, cy: number, rx: number, ry: number, rgba: string) => {
  const m = rgba.match(/rgba\(([^)]+),\s*([\d.]+)\)/);
  const rgb = m ? m[1] : "217, 32, 46";
  const a = m ? parseFloat(m[2]) : 0.2;
  const stops = [[0, 1], [25, 0.72], [50, 0.38], [72, 0.14], [88, 0.03], [100, 0]]
    .map(([at, k]) => `rgba(${rgb}, ${(a * k).toFixed(4)}) ${at}%`).join(", ");
  return `radial-gradient(${rx.toFixed(1)}px ${ry.toFixed(1)}px at ${cx.toFixed(1)}px ${cy.toFixed(1)}px, ${stops})`;
};

/** B1. Slow red field: the hero's own red light, in three soft pools that circle once a loop. */
const BgField: React.FC = () => {
  const f = useCurrentFrame();
  const t = (f / BG_LEN) * TAU;
  const layers = [
    rg(960 + 70 * Math.sin(t + 0.4), 220 + 22 * Math.cos(t + 0.4), 360 + 14 * Math.sin(t), 240, "rgba(255, 80, 104, 0.10)"),
    rg(960 + 80 * Math.sin(t), -60 + 34 * Math.cos(t), 1350 * (1 + 0.035 * Math.sin(t)), 860, "rgba(217, 32, 46, 0.42)"),
    rg(260 + 150 * Math.cos(t + 1), 960 + 70 * Math.sin(t + 1), 1100, 700, "rgba(150, 18, 30, 0.2)"),
    rg(1680 + 130 * Math.cos(-t + 2.2), 860 + 90 * Math.sin(-t + 2.2), 1050, 760, "rgba(120, 14, 26, 0.2)"),
  ];
  return (
    <AbsoluteFill style={{ background: "#0b0708", backgroundImage: layers.join(", ") }}>
      <AbsoluteFill style={{ background: "radial-gradient(130% 120% at 50% 40%, transparent 55%, rgba(5, 3, 4, 0.55) 100%)" }} />
      <Grain opacity={0.5} id="field" />
    </AbsoluteFill>
  );
};

/** B2. Sparkle field: the logo's dot as a quiet constellation, a red light walking through it once a loop. */
const STARS = (() => {
  const out: { x: number; y: number; size: number; a: number; ph: number; k: number }[] = [];
  const gap = 104;
  for (let r = -1; r < 12; r++) {
    for (let c = -1; c < 20; c++) {
      const seed = `s${r}-${c}`;
      if (random(seed + "skip") < 0.28) continue;
      const x = c * gap + (r % 2 ? gap / 2 : 0) + (random(seed + "x") - 0.5) * 50;
      const y = r * gap * 0.9 + (random(seed + "y") - 0.5) * 44;
      // quieter in the middle, where the headline sits
      const dx = (x - 960) / 760;
      const dy = (y - 430) / 380;
      const m = Math.min(1, Math.sqrt(dx * dx + dy * dy));
      out.push({ x, y, size: 7 + random(seed + "s") * 11, a: (0.05 + random(seed + "a") * 0.11) * (0.3 + 0.7 * m), ph: random(seed + "p") * TAU, k: random(seed + "k") < 0.5 ? 1 : 2 });
    }
  }
  return out;
})();
const SPARK_PATH = "M12 0C12.9 6.6 17.4 11.1 24 12C17.4 12.9 12.9 17.4 12 24C11.1 17.4 6.6 12.9 0 12C6.6 11.1 11.1 6.6 12 0Z";
const BgStars: React.FC = () => {
  const f = useCurrentFrame();
  const t = (f / BG_LEN) * TAU;
  const lx = 960 + 720 * Math.cos(t - 1.2);
  const ly = 560 + 300 * Math.sin(t - 1.2);
  const dxAll = 16 * Math.sin(t);
  const dyAll = 10 * Math.cos(t);
  return (
    <AbsoluteFill style={{ background: "#0b0708", backgroundImage: `${rg(960, -60, 1150, 640, "rgba(217, 32, 46, 0.26)")}, ${rg(lx, ly, 420, 420, "rgba(217, 32, 46, 0.10)")}` }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {STARS.map((s, n) => {
          const x = s.x + dxAll;
          const y = s.y + dyAll;
          const d2 = (x - lx) ** 2 + (y - ly) ** 2;
          const w = Math.exp(-d2 / (2 * 240 * 240));
          const tw = 0.62 + 0.38 * Math.sin(s.k * t + s.ph);
          const a = Math.min(0.6, s.a * tw + 0.32 * w);
          const r = Math.round(lerp(247, 236, w));
          const g = Math.round(lerp(239, 52, w));
          const b = Math.round(lerp(230, 70, w));
          const sc = (s.size * (1 + 0.25 * w)) / 24;
          return <path key={n} d={SPARK_PATH} fill={`rgb(${r}, ${g}, ${b})`} opacity={a} transform={`translate(${(x - 12 * sc).toFixed(2)} ${(y - 12 * sc).toFixed(2)}) scale(${sc.toFixed(4)})`} />;
        })}
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(130% 120% at 50% 40%, transparent 55%, rgba(5, 3, 4, 0.5) 100%)" }} />
      <Grain opacity={0.45} id="stars" />
    </AbsoluteFill>
  );
};

/** B3. Sparkle contours: the dot's outline as rings that widen from the top edge, one ring-step a loop. */
const BgRings: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / BG_LEN;
  const O = { x: 960, y: -150 };
  const step = 150;
  const rings = [];
  for (let n = 0; n < 18; n++) {
    const r = (n + t) * step;
    const fadeIn = interpolate(r, [0, 330], [0, 1], clamp);
    const fadeOut = interpolate(r, [1500, 2600], [1, 0], clamp);
    const a = 0.15 * fadeIn * fadeOut;
    if (a < 0.002) continue;
    const red = interpolate(r, [200, 1400], [1, 0], clamp);
    const col = `rgb(${Math.round(lerp(247, 230, red))}, ${Math.round(lerp(239, 60, red))}, ${Math.round(lerp(230, 76, red))})`;
    const sc = r / 12; // SPARK_PATH's tip sits 12 units from its centre
    rings.push(
      <path key={n} d={SPARK_PATH} fill="none" stroke={col} strokeOpacity={a} strokeWidth={1.4} vectorEffect="non-scaling-stroke"
        transform={`translate(${O.x} ${O.y}) rotate(45) scale(${sc.toFixed(4)}) translate(-12 -12)`} />,
    );
  }
  const T = t * TAU;
  return (
    <AbsoluteFill style={{ background: "#0b0708", backgroundImage: `${rg(960, -80, 1050 + 40 * Math.sin(T), 620, "rgba(217, 32, 46, 0.32)")}, ${rg(960, 1180, 1300, 420, "rgba(120, 14, 26, 0.16)")}` }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>{rings}</svg>
      <AbsoluteFill style={{ background: "radial-gradient(130% 120% at 50% 40%, transparent 55%, rgba(5, 3, 4, 0.5) 100%)" }} />
      <Grain opacity={0.45} id="rings" />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ C. Kinetic type: the sparkle writes the nav */

/**
 * The product's own top-level sections, in its own order, read off campusai-demo.vercel.app's
 * sidebar on 2026-10-23. Career Advisor and Academic Advisor carry the sparkle in the real nav,
 * so they carry it here. Widths are Zodiak Bold at 100px with -0.02em tracking, measured headless.
 */
const NAV: { text: string; w100: number; mark?: boolean }[] = [
  { text: "Dashboard", w100: 552.3 },
  { text: "My Calendar", w100: 631.4 },
  { text: "Career Advisor", w100: 750.5, mark: true },
  { text: "Academic Advisor", w100: 902.6, mark: true },
  { text: "Organizations", w100: 705.7 },
  { text: "Events", w100: 337.2 },
  { text: "Dining", w100: 334.1 },
];
const TYPE_LEN = 300;
const T_SIZE = 96;
const T_X = 76;
const T_PITCH = 138;
const T_TOP = 960 - 3 * T_PITCH;
const MARK = 38;
const MARK_GAP = 58;
const PEN = 56;
const PEN_LEAD = 26;

type LineT = { start: number; end: number; markAt?: number; x: number; w: number; y: number };
const NAV_T: LineT[] = (() => {
  const out: LineT[] = [];
  let t = 2;
  NAV.forEach((l, n) => {
    if (n > 0) t += 7; // the pen travels to the next line
    let markAt: number | undefined;
    if (l.mark) {
      markAt = t;
      t += 5;
    }
    const w = (l.w100 * T_SIZE) / 100;
    const d = Math.round(6 + w / 55);
    out.push({ start: t, end: t + d, markAt, x: T_X + (l.mark ? MARK_GAP : 0), w, y: T_TOP + n * T_PITCH });
    t += d;
  });
  return out;
})();
const T_EXIT = 228;
const T_LOGO = 236;
const T_RELEASE = 284;

const KineticNav: React.FC = () => {
  const f = useCurrentFrame();
  const W = 1080;
  const H = 1920;
  const k = 620 / LW;
  const dot = toPx(DOT.x, DOT.y, k, W / 2, H / 2);
  const penStart = { x: T_X - PEN_LEAD, y: NAV_T[0].y };

  // where the pen is
  let px = penStart.x;
  let py = penStart.y;
  let psize = PEN;
  let prot = 0;
  const last = NAV_T[NAV_T.length - 1];
  const penEnd = (l: LineT) => ({ x: l.x + l.w + PEN_LEAD, y: l.y });
  for (let n = 0; n < NAV_T.length; n++) {
    const l = NAV_T[n];
    const prev = n > 0 ? penEnd(NAV_T[n - 1]) : penStart;
    const travelFrom = n > 0 ? NAV_T[n - 1].end : 0;
    const writeFrom = { x: l.x - PEN_LEAD, y: l.y };
    const markPos = { x: T_X + MARK / 2, y: l.y };
    if (f < l.start) {
      if (l.markAt !== undefined) {
        if (f < l.markAt) {
          const p = ramp(f, travelFrom, l.markAt, EASE_CAMERA);
          px = lerp(prev.x, markPos.x, p);
          py = lerp(prev.y, markPos.y, p);
        } else {
          const p = ramp(f, l.markAt + 1, l.start, EASE);
          px = lerp(markPos.x, writeFrom.x, p);
          py = l.y;
        }
      } else {
        const p = ramp(f, travelFrom, l.start, EASE_CAMERA);
        px = lerp(prev.x, writeFrom.x, p);
        py = lerp(prev.y, writeFrom.y, p);
      }
      prot = 90 * ramp(f, travelFrom, l.start, EASE_CAMERA) + n * 90;
      break;
    }
    if (f <= l.end || n === NAV_T.length - 1) {
      const p = ramp(f, l.start, l.end, Easing.inOut(Easing.quad));
      px = lerp(writeFrom.x, l.x + l.w + PEN_LEAD, p);
      py = l.y;
      prot = (n + 1) * 90;
      if (f > l.end) {
        // the pen rests after the last word, then rises to dot the logo's i
        const up = ramp(f, T_EXIT, T_LOGO + 12, EASE_CAMERA);
        const end = penEnd(last);
        px = lerp(end.x, dot.x, up);
        py = lerp(end.y, dot.y, up) - 120 * 4 * up * (1 - up);
        psize = lerp(PEN, DOT.w * k, up);
        prot = (n + 1) * 90 + 90 * up;
        if (f >= T_RELEASE) {
          // released: back to where the first word starts (frame 300 is frame 0)
          const back = ramp(f, T_RELEASE, TYPE_LEN, EASE_CAMERA);
          px = lerp(dot.x, penStart.x, back);
          py = lerp(dot.y, penStart.y, back) - 90 * 4 * back * (1 - back);
          psize = lerp(DOT.w * k, PEN, back);
          prot = (n + 2) * 90 + 90 * back;
        }
      }
      break;
    }
  }
  prot = prot % 360; // four-fold, so every quarter turn lands where it started

  const hold = breathe(f, T_LOGO + 22, T_RELEASE - T_LOGO - 22);
  const logoIn = (id: PartId) => {
    const n = LETTERS.indexOf(id);
    const p = ramp(f, T_LOGO + n * 2, T_LOGO + 14 + n * 2, EASE);
    const o = ramp(f, T_RELEASE, T_RELEASE + 10, EASE);
    return { opacity: p * (1 - o), blur: (1 - p) * 10 + o * 10, ty: (1 - p) * 4 };
  };

  return (
    <Ground>
      {/* the pen's own light on the ground */}
      <AbsoluteFill style={{ backgroundImage: rg(px, py, 300, 300, "rgba(217, 32, 46, 0.12)") }} />
      {NAV.map((l, n) => {
        const L = NAV_T[n];
        if (f < (L.markAt ?? L.start)) return null;
        const p = ramp(f, L.start, L.end, Easing.inOut(Easing.quad));
        const edge = p * (L.w + 70);
        const ex = ramp(f, T_EXIT + n * 2, T_EXIT + 12 + n * 2, EASE);
        if (ex >= 1) return null;
        return (
          <div key={l.text} style={{ position: "absolute", left: 0, top: L.y - T_SIZE * 0.62, width: W, height: T_SIZE * 1.3, opacity: 1 - ex, transform: `translateY(${(-26 * ex).toFixed(2)}px)`, filter: ex > 0 ? `blur(${(ex * 12).toFixed(2)}px)` : undefined }}>
            {l.mark && L.markAt !== undefined ? (
              <Spark uid={`mark-${n}`} x={T_X + MARK / 2} y={T_SIZE * 0.62} size={MARK * (1 + 0.35 * (1 - ramp(f, L.markAt, L.markAt + 8, EASE)))} glowPx={8} glowA={0.4} />
            ) : null}
            <div style={{
              position: "absolute", left: L.x, top: 0, whiteSpace: "nowrap", fontFamily: "Zodiak", fontWeight: 700, fontSize: T_SIZE,
              letterSpacing: "-0.02em", lineHeight: `${T_SIZE * 1.3}px`, color: INK,
              WebkitMaskImage: `linear-gradient(90deg, #000 ${(edge - 70).toFixed(1)}px, transparent ${edge.toFixed(1)}px)`,
              maskImage: `linear-gradient(90deg, #000 ${(edge - 70).toFixed(1)}px, transparent ${edge.toFixed(1)}px)`,
            }}>
              {l.text}
            </div>
          </div>
        );
      })}
      {f >= T_LOGO ? (
        <div style={{ position: "absolute", left: W / 2 - (LW / 2) * k, top: H / 2 - (LH / 2) * k, width: LW * k, height: LH * k, transform: `scale(${hold.toFixed(4)})`, transformOrigin: "50% 50%" }}>
          {LETTERS.map((id) => <Letter key={id} id={id} k={k} st={logoIn(id)} />)}
        </div>
      ) : null}
      <Spark uid="pen" x={W / 2 + (px - W / 2) * (f >= T_LOGO + 12 && f < T_RELEASE ? hold : 1)} y={H / 2 + (py - H / 2) * (f >= T_LOGO + 12 && f < T_RELEASE ? hold : 1)} size={psize} rot={prot} glowPx={16} glowA={0.6} />
    </Ground>
  );
};

/* ------------------------------------------------------------------ compositions */

export const MotionPass2Root: React.FC = () => (
  <>
    <Composition id="MP2-LogoLock-1x1" component={LogoLock} durationInFrames={LOCK_LEN} fps={FPS} width={1080} height={1080} />
    <Composition id="MP2-LogoLock-9x16" component={LogoLock} durationInFrames={LOCK_LEN} fps={FPS} width={1080} height={1920} />
    <Composition id="MP2-LogoPull-1x1" component={LogoPull} durationInFrames={PULL_LEN} fps={FPS} width={1080} height={1080} />
    <Composition id="MP2-LogoPull-9x16" component={LogoPull} durationInFrames={PULL_LEN} fps={FPS} width={1080} height={1920} />
    <Composition id="MP2-LogoUnfold-1x1" component={LogoUnfold} durationInFrames={UNFOLD_LEN} fps={FPS} width={1080} height={1080} />
    <Composition id="MP2-LogoUnfold-9x16" component={LogoUnfold} durationInFrames={UNFOLD_LEN} fps={FPS} width={1080} height={1920} />
    <Composition id="MP2-BgField-16x9" component={BgField} durationInFrames={BG_LEN} fps={FPS} width={1920} height={1080} />
    <Composition id="MP2-BgStars-16x9" component={BgStars} durationInFrames={BG_LEN} fps={FPS} width={1920} height={1080} />
    <Composition id="MP2-BgRings-16x9" component={BgRings} durationInFrames={BG_LEN} fps={FPS} width={1920} height={1080} />
    <Composition id="MP2-KineticNav-9x16" component={KineticNav} durationInFrames={TYPE_LEN} fps={FPS} width={1080} height={1920} />
  </>
);
