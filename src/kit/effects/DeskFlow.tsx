/**
 * DeskFlow (2026-11-25, Muse): the screen grammar of XZE Creative's "Flow.ai" spec film (instagram.com/reel/DgHAfQtI8GM,
 * 15 s, read frame by frame; our own build), the follow-up to their Notion desk film that gave us ScreenStage. The whole
 * film plays on one monitor filmed in a dark room; these are the moves it makes on that screen, measured:
 *
 *  - RibbonSweep: two glossy twisting ribbons of light sweep across the dark screen (0.0 to 0.6 s), then a dark breath.
 *  - Spark3D / SparkLockup: the four-point star tumbles in extruded and glossy (0.25 s), the name types in to its right a
 *    letter about every 0.08 s with wide tracking that tightens while the lockup slides a little left (0.75 s). For
 *    CampusAI the star IS our spark, so it finishes by hopping onto its home over the i.
 *  - GlowPill: the hook typed huge in a glowing pill, the camera riding the caret, then a 0.2 s blurred whip out to the
 *    whole line small (the film does the camera; `measureLine` tells it where the caret is).
 *  - VortexRing: the dashboard's cards bend into a spinning ring around the centre line, the line swaps word by word,
 *    and the ring flies out past the camera (0.9 s in, 0.4 s out).
 *
 * Everything is authored flat at the screen's own size and pinned into a room with ScreenStage (plate or drawn room).
 * Worked example PostDeskFlow-9x16 (src/trials/post-desk-flow.tsx) stays local with its captures.
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { IN, OUT, SWING, k, mix } from "./shared";

/* ------------------------------------------------------------------ the CampusAI wordmark, letter by letter */
/** The spark over the i, in the wordmark's own 223 x 53 units (public/brand/campusai-logo-white.svg). */
export const SPARK_D =
  "M223 5.82387C220.2 5.00657 217.993 2.79984 217.176 0C216.359 2.79984 214.152 5.00657 211.352 5.82387C214.152 6.64117 216.359 8.8479 217.176 11.6477C217.993 8.8479 220.2 6.64117 223 5.82387Z";
export const SPARK_HOME = { cx: 217.176, cy: 5.824, size: 11.648 };
export const WORDMARK = { w: 223, h: 53, xMid: 26.4 };
/** c a m p u s a i(stem), left to right, measured with getBBox. */
export const WORDMARK_LETTERS: { x: number; w: number; d: string }[] = [
  { x: 0, w: 25.42, d: "M0 26.4238C0 23.6992 0.554432 21.323 1.6633 19.2954C2.77216 17.2361 4.30873 15.652 6.27301 14.5431C8.23728 13.4025 10.4867 12.8323 13.0212 12.8323C16.2845 12.8323 18.9774 13.656 21.1001 15.3035C23.2545 16.9192 24.696 19.2003 25.4247 22.1467H18.2487C17.8686 21.0062 17.2191 20.1191 16.3003 19.4855C15.4132 18.8201 14.3044 18.4875 12.9737 18.4875C11.0728 18.4875 9.56792 19.1845 8.45905 20.5785C7.35019 21.9408 6.79576 23.8892 6.79576 26.4238C6.79576 28.9267 7.35019 30.8751 8.45905 32.2691C9.56792 33.6314 11.0728 34.3126 12.9737 34.3126C15.6667 34.3126 17.425 33.1087 18.2487 30.7008H25.4247C24.696 33.5522 23.2545 35.8175 21.1001 37.4966C18.9457 39.1757 16.2528 40.0153 13.0212 40.0153C10.4867 40.0153 8.23728 39.4609 6.27301 38.352C4.30873 37.2115 2.77216 35.6274 1.6633 33.5997C0.554432 31.5404 0 29.1484 0 26.4238Z" },
  { x: 27.1, w: 27.42, d: "M39.1204 12.8323C41.0845 12.8323 42.7949 13.2288 44.2522 14.0208C45.7411 14.8127 46.9296 15.8102 47.8167 17.0139V13.26H54.5178V21.8264C53.2466 23.9703 51.1932 25.5956 48.7502 26.3088C51.1929 27.022 53.2466 28.6468 54.5178 30.7903V39.5872H47.8167V35.7385C46.9613 36.974 45.7728 38.0037 44.2522 38.8274C42.7632 39.6193 41.0366 40.0149 39.0725 40.0149C36.8548 40.0149 34.827 39.4454 32.9895 38.3049C31.1838 37.1645 29.7424 35.5643 28.6653 33.5051C27.6198 31.4141 27.0969 29.0213 27.0969 26.3284C27.097 23.6674 27.6199 21.3074 28.6653 19.2483C29.7424 17.189 31.1837 15.6042 32.9895 14.4954C34.827 13.3865 36.8709 12.8323 39.1204 12.8323ZM40.8313 18.678C39.5958 18.678 38.4549 18.9784 37.4094 19.5803C36.364 20.1822 35.5083 21.0693 34.843 22.2415C34.2094 23.3819 33.8929 24.7444 33.8928 26.3284C33.8928 27.9125 34.2094 29.3071 34.843 30.511C35.5083 31.6832 36.364 32.5864 37.4094 33.22C38.4865 33.8535 39.6275 34.1702 40.8313 34.1702C42.0668 34.1701 43.223 33.8688 44.3 33.2668C45.3772 32.6332 46.2328 31.7463 46.8665 30.6057C47.5 29.4336 47.8166 28.0397 47.8167 26.4241C47.8167 24.8083 47.5001 23.4298 46.8665 22.2893C46.2328 21.1171 45.3772 20.2301 44.3 19.6282C43.223 18.9946 42.0668 18.678 40.8313 18.678Z" },
  { x: 56.26, w: 43.48, d: "M88.9595 12.8794C92.1909 12.8794 94.7892 13.8776 96.7534 15.8735C98.7491 17.8377 99.7465 20.594 99.7466 24.1421V39.5874H93.0933V25.0454C93.0933 22.9862 92.5713 21.4175 91.5259 20.3403C90.4804 19.2315 89.0544 18.6773 87.2485 18.6772C85.4428 18.6772 84.0015 19.2317 82.9243 20.3403C81.8788 21.4175 81.356 22.9861 81.356 25.0454V39.5874H74.7026V25.0454C74.7026 22.9861 74.1798 21.4175 73.1343 20.3403C72.0888 19.2315 70.6628 18.6772 68.8569 18.6772C67.0195 18.6773 65.562 19.2315 64.4849 20.3403C63.4394 21.4175 62.9165 22.9861 62.9165 25.0454V39.5874H56.2632V31.2017C57.5082 28.8553 59.6646 27.0671 62.2612 26.3091C59.6642 25.551 57.5081 23.7615 56.2632 21.4146V13.2593H62.9165V16.4438C63.7719 15.335 64.8652 14.4632 66.1958 13.8296C67.558 13.196 69.047 12.8794 70.6626 12.8794C72.7219 12.8794 74.5595 13.3234 76.1753 14.2104C77.791 15.0658 79.0431 16.3008 79.9302 17.9165C80.7855 16.396 82.0207 15.176 83.6362 14.2573C85.2837 13.3386 87.0586 12.8794 88.9595 12.8794Z" },
  { x: 101.61, w: 27.37, d: "M108.263 17.0618C109.119 15.8579 110.291 14.8599 111.78 14.0679C113.301 13.2441 115.027 12.8323 116.96 12.8323C119.209 12.8323 121.237 13.3867 123.043 14.4956C124.88 15.6044 126.322 17.1885 127.367 19.2478C128.445 21.2755 128.983 23.6358 128.983 26.3287C128.983 29.0217 128.445 31.4137 127.367 33.5047C126.322 35.564 124.88 37.1639 123.043 38.3045C121.237 39.445 119.209 40.0153 116.96 40.0153C115.027 40.0153 113.317 39.6193 111.828 38.8272C110.37 38.0352 109.182 37.0372 108.263 35.8333V52.1336H101.61V13.26H108.263V17.0618ZM122.187 26.3287C122.187 24.7447 121.855 23.3823 121.189 22.2418C120.556 21.0696 119.7 20.1825 118.623 19.5805C117.578 18.9786 116.437 18.6776 115.202 18.6776C113.998 18.6776 112.857 18.9944 111.78 19.628C110.734 20.23 109.879 21.1171 109.214 22.2893C108.58 23.4615 108.263 24.8397 108.263 26.4238C108.263 28.0079 108.58 29.386 109.214 30.5583C109.879 31.7305 110.734 32.6334 111.78 33.2671C112.857 33.869 113.998 34.17 115.202 34.17C116.437 34.17 117.578 33.8532 118.623 33.2195C119.7 32.5859 120.556 31.683 121.189 30.5107C121.855 29.3385 122.187 27.9445 122.187 26.3287Z" },
  { x: 130.85, w: 25.09, d: "M155.939 13.26V39.5876H149.238V36.261C148.383 37.4016 147.258 38.3045 145.864 38.9698C144.502 39.6035 143.013 39.9203 141.397 39.9203C139.338 39.9203 137.516 39.4926 135.932 38.6372C134.348 37.7501 133.096 36.467 132.178 34.7878C131.29 33.077 130.847 31.0494 130.847 28.7049V13.26H137.5V27.7545C137.5 29.8455 138.023 31.4612 139.068 32.6018C140.114 33.7106 141.54 34.2651 143.345 34.2651C145.183 34.2651 146.624 33.7106 147.67 32.6018C148.715 31.4612 149.238 29.8455 149.238 27.7545V13.26H155.939Z" },
  { x: 157.8, w: 21.86, d: "M169.303 40.0153C167.149 40.0153 165.216 39.6351 163.505 38.8748C161.795 38.0827 160.432 37.0214 159.419 35.6907C158.436 34.3601 157.898 32.8869 157.803 31.2711H164.503C164.63 32.2849 165.121 33.1245 165.977 33.7898C166.864 34.4551 167.957 34.7878 169.256 34.7878C170.523 34.7878 171.505 34.5343 172.202 34.0274C172.931 33.5205 173.295 32.871 173.295 32.079C173.295 31.2236 172.852 30.59 171.965 30.1781C171.109 29.7345 169.731 29.2593 167.83 28.7524C165.866 28.2772 164.25 27.7861 162.983 27.2792C161.747 26.7723 160.67 25.9961 159.751 24.9506C158.864 23.9051 158.421 22.4952 158.421 20.7211C158.421 19.2637 158.832 17.9331 159.656 16.7291C160.512 15.5252 161.715 14.5748 163.268 13.8778C164.852 13.1808 166.705 12.8323 168.828 12.8323C171.965 12.8323 174.467 13.6243 176.337 15.2084C178.206 16.7608 179.236 18.8677 179.426 21.5289H173.058C172.963 20.4834 172.519 19.6597 171.727 19.0578C170.967 18.4241 169.937 18.1073 168.638 18.1073C167.434 18.1073 166.499 18.3291 165.834 18.7726C165.2 19.2162 164.884 19.834 164.884 20.626C164.884 21.5131 165.327 22.1943 166.214 22.6695C167.101 23.113 168.48 23.5724 170.349 24.0476C172.25 24.5229 173.818 25.0139 175.054 25.5209C176.289 26.0278 177.35 26.8198 178.238 27.897C179.156 28.9425 179.632 30.3365 179.663 32.079C179.663 33.5997 179.236 34.962 178.38 36.166C177.556 37.3699 176.352 38.3203 174.768 39.0173C173.216 39.6826 171.394 40.0153 169.303 40.0153Z" },
  { x: 183.1, w: 27.42, d: "M183.103 26.328C183.103 23.6667 183.625 21.3064 184.671 19.2471C185.748 17.1878 187.189 15.6037 188.995 14.4948C190.833 13.386 192.876 12.8315 195.126 12.8315C197.09 12.8315 198.801 13.2276 200.258 14.0196C201.747 14.8117 202.935 15.8096 203.822 17.0135V13.2592H210.523V39.5869H203.822V35.7375C202.967 36.9731 201.779 38.0028 200.258 38.8265C198.769 39.6185 197.043 40.0146 195.078 40.0146C192.861 40.0146 190.833 39.4443 188.995 38.3038C187.189 37.1632 185.748 35.5633 184.671 33.504C183.625 31.4129 183.103 29.021 183.103 26.328ZM203.822 26.4231C203.822 24.8073 203.506 23.4291 202.872 22.2886C202.238 21.1163 201.383 20.2293 200.306 19.6273C199.229 18.9937 198.072 18.6768 196.837 18.6768C195.601 18.6768 194.46 18.9778 193.415 19.5798C192.369 20.1817 191.514 21.0688 190.849 22.2411C190.215 23.3816 189.898 24.7439 189.898 26.328C189.898 27.9121 190.215 29.3061 190.849 30.51C191.514 31.6822 192.369 32.5852 193.415 33.2188C194.492 33.8525 195.633 34.1693 196.837 34.1693C198.072 34.1693 199.229 33.8683 200.306 33.2663C201.383 32.6327 202.238 31.7456 202.872 30.6051C203.506 29.4328 203.822 28.0388 203.822 26.4231Z" },
  { x: 213.69, w: 6.65, d: "M220.348 13.2593V39.5867H213.694V13.2593H220.348Z" },
];

const LETTER_INK = "#f7efe6";

/* ------------------------------------------------------------------ ribbons */
type Ribbon = { lag: number; bow: number; thick: number; twist: number };
const RIBBONS: Ribbon[] = [
  { lag: 0, bow: 0.34, thick: 0.1, twist: 0 },
  { lag: 0.16, bow: 0.22, thick: 0.065, twist: 1.3 },
];

/** Two glossy ribbons of light sweeping left to right across a `w` x `h` screen. `t` runs 0 to 1 over the sweep;
 *  start a film at about 0.2 so frame 0 is already mid-motion. `rgb` is the ribbon family, dark to light. */
export const RibbonSweep: React.FC<{ t: number; w: number; h: number; rgb?: [string, string, string]; id?: string }> = ({
  t, w, h, rgb = ["90, 4, 14", "217, 32, 46", "255, 168, 178"], id = "rs",
}) => {
  if (t <= 0 || t >= 1) return null;
  const env = Math.min(1, t / 0.12) * Math.min(1, (1 - t) / 0.3);
  return (
    <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: env }}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="0.2">
          <stop offset="0" stopColor={`rgb(${rgb[0]})`} />
          <stop offset="0.55" stopColor={`rgb(${rgb[1]})`} />
          <stop offset="1" stopColor={`rgb(${rgb[2]})`} />
        </linearGradient>
        <filter id={`${id}-b`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={w * 0.004} /></filter>
        <filter id={`${id}-glow`} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation={w * 0.02} /></filter>
      </defs>
      {RIBBONS.map((r, j) => {
        const p = Math.max(0, Math.min(1, (t - r.lag) / (1 - r.lag)));
        if (p <= 0) return null;
        const x0 = mix(-0.15 * w, 1.2 * w, SWING(p));
        // a bowed band from above the screen to below it, leaning back as it travels
        const P = [
          [x0 - 0.1 * w, -0.2 * h],
          [x0 + r.bow * w, 0.25 * h],
          [x0 - r.bow * 0.4 * w, 0.8 * h],
          [x0 + 0.18 * w, 1.2 * h],
        ];
        const N = 36;
        const A: string[] = [];
        const B: string[] = [];
        const E: string[] = [];
        for (let i = 0; i <= N; i++) {
          const s = i / N, u = 1 - s;
          const x = u * u * u * P[0][0] + 3 * u * u * s * P[1][0] + 3 * u * s * s * P[2][0] + s * s * s * P[3][0];
          const y = u * u * u * P[0][1] + 3 * u * u * s * P[1][1] + 3 * u * s * s * P[2][1] + s * s * s * P[3][1];
          const dx = 3 * u * u * (P[1][0] - P[0][0]) + 6 * u * s * (P[2][0] - P[1][0]) + 3 * s * s * (P[3][0] - P[2][0]);
          const dy = 3 * u * u * (P[1][1] - P[0][1]) + 6 * u * s * (P[2][1] - P[1][1]) + 3 * s * s * (P[3][1] - P[2][1]);
          const L = Math.hypot(dx, dy) || 1;
          const nx = -dy / L, ny = dx / L;
          // the twist: the band narrows and widens along its length as if turning over
          const half = (w * r.thick * (0.25 + 0.75 * Math.abs(Math.cos(Math.PI * (s * 1.4 + p * 1.2 + r.twist))))) / 2;
          A.push(`${(x + nx * half).toFixed(1)},${(y + ny * half).toFixed(1)}`);
          B.unshift(`${(x - nx * half).toFixed(1)},${(y - ny * half).toFixed(1)}`);
          E.push(`${(x + nx * half * 0.8).toFixed(1)},${(y + ny * half * 0.8).toFixed(1)}`);
        }
        const band = `M${A.join(" L")} L${B.join(" L")} Z`;
        return (
          <g key={j}>
            <path d={band} fill={`rgba(${rgb[1]}, 0.55)`} filter={`url(#${id}-glow)`} />
            <path d={band} fill={`url(#${id}-g)`} filter={`url(#${id}-b)`} opacity={0.92} />
            <path d={`M${E.join(" L")}`} fill="none" stroke={`rgba(${rgb[2]}, 0.9)`} strokeWidth={w * 0.0025} filter={`url(#${id}-b)`} />
          </g>
        );
      })}
    </svg>
  );
};

/* ------------------------------------------------------------------ the spark, extruded and glossy */
/** The CampusAI spark as a solid: `depth` stacked layers behind a glossy face, turned in 3D. Centred on its box. */
export const Spark3D: React.FC<{ size: number; rx?: number; ry?: number; rz?: number; depth?: number; glow?: number; id: string }> = ({
  size, rx = 0, ry = 0, rz = 0, depth = 9, glow = 0.6, id,
}) => {
  const vb = `${SPARK_HOME.cx - SPARK_HOME.size / 2} 0 ${SPARK_HOME.size} ${SPARK_HOME.size}`;
  const layers = [];
  for (let i = depth; i >= 1; i--) {
    layers.push(
      <svg key={i} width={size} height={size} viewBox={vb} style={{ position: "absolute", inset: 0, transform: `translateZ(${-i * size * 0.014}px)` }}>
        <path d={SPARK_D} fill={i === depth ? "#3a0308" : `rgb(${Math.round(mix(150, 70, i / depth))}, ${Math.round(mix(14, 4, i / depth))}, ${Math.round(mix(30, 12, i / depth))})`} />
      </svg>,
    );
  }
  return (
    <div style={{ width: size, height: size, perspective: size * 6, filter: glow > 0 ? `drop-shadow(0 0 ${size * 0.12}px rgba(217, 32, 46, ${glow}))` : undefined }}>
      <div style={{ position: "relative", width: size, height: size, transformStyle: "preserve-3d", transform: `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)` }}>
        {layers}
        <svg width={size} height={size} viewBox={vb} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id={`${id}-f`} x1={SPARK_HOME.cx} y1="0" x2={SPARK_HOME.cx} y2={SPARK_HOME.size} gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF5068" />
              <stop offset="1" stopColor="#E21833" />
            </linearGradient>
            <radialGradient id={`${id}-s`} cx="0.38" cy="0.3" r="0.45">
              <stop offset="0" stopColor="rgba(255,235,238,0.85)" />
              <stop offset="1" stopColor="rgba(255,235,238,0)" />
            </radialGradient>
          </defs>
          <path d={SPARK_D} fill={`url(#${id}-f)`} />
          <path d={SPARK_D} fill={`url(#${id}-s)`} />
        </svg>
      </div>
    </div>
  );
};

/**
 * The spark tumbles in at `at`, the wordmark types in from `typeAt`, and the spark hops home over the i at `homeAt`.
 * Drawn centred on (cx, cy) in the parent's px, `width` the wordmark's width. `out` (0 to 1) fades it all.
 */
export const SparkLockup: React.FC<{ f: number; at: number; typeAt: number; homeAt: number; cx: number; cy: number; width: number; id: string; out?: number }> = ({
  f, at, typeAt, homeAt, cx, cy, width, id, out = 0,
}) => {
  if (f < at) return null;
  const s = width / WORDMARK.w;
  const settle = k(f, typeAt, typeAt + 26, SWING);
  const left = cx - width / 2 + mix(0.07 * width, 0, settle);
  const top = cy - WORDMARK.xMid * s;
  const tr = mix(0.05 * width, 0, settle);
  // the spark: tumbling in, parked left of the c, then the hop onto the i
  const a = k(f, at, at + 9, OUT);
  const hop = k(f, homeAt, homeAt + 10, SWING);
  const parkSize = 0.2 * width;
  const parkX = left - 0.17 * width, parkY = cy;
  const homeX = left + SPARK_HOME.cx * s, homeY = top + SPARK_HOME.cy * s;
  const sx = mix(mix(parkX - 0.55 * width, parkX, a), homeX, hop);
  const sy = mix(mix(parkY - 0.3 * width, parkY, a), homeY, hop) - Math.sin(Math.PI * hop) * 0.18 * width;
  const size = mix(mix(parkSize * 1.7, parkSize, a), SPARK_HOME.size * s, hop);
  const rx = (1 - a) * 70, ry = (1 - a) * 230 + Math.sin(f / 9) * 10 * (1 - hop), rz = (1 - a) * -80 + hop * 360;
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      <svg width={width * 1.6} height={WORDMARK.h * s} viewBox={`0 0 ${WORDMARK.w * 1.6} ${WORDMARK.h}`} style={{ position: "absolute", left, top, overflow: "visible" }}>
        {WORDMARK_LETTERS.map((L, i) => {
          const la = k(f, typeAt + i * 2.6, typeAt + i * 2.6 + 6, OUT);
          if (la <= 0) return null;
          const dx = ((i - 3.5) * tr) / s;
          return (
            <g key={i} opacity={la} transform={`translate(${dx} ${(1 - la) * 3})`} style={{ filter: la < 1 ? `blur(${(1 - la) * 3}px)` : undefined }}>
              <path d={L.d} fill={LETTER_INK} />
            </g>
          );
        })}
      </svg>
      <div style={{ position: "absolute", left: sx - size / 2, top: sy - size / 2 }}>
        <Spark3D size={size} rx={rx} ry={ry} rz={rz} id={id} glow={mix(0.7, 0.35, hop)} depth={hop >= 1 ? 0 : 9} />
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ the hook pill */
let mctx: CanvasRenderingContext2D | null = null;
/** Width of a line of text in px for a CSS font string, e.g. `600 180px Inter`. */
export const measureLine = (text: string, font: string) => {
  if (!mctx) mctx = document.createElement("canvas").getContext("2d");
  mctx!.font = font;
  return mctx!.measureText(text).width;
};

/** A line typed into a glowing pill: the pill is sized to the whole line from the start, the typed part in a light
 *  gradient with a glow, a caret after it. Natural size; the film moves the camera. */
export const GlowPill: React.FC<{ text: string; n: number; fontSize: number; family: string; weight?: number; caret?: boolean; glow?: number; rgb?: string }> = ({
  text, n, fontSize, family, weight = 600, caret = true, glow = 1, rgb = "217, 32, 46",
}) => {
  const shown = text.slice(0, Math.max(0, Math.round(n)));
  const font: React.CSSProperties = { fontFamily: family, fontWeight: weight, fontSize, letterSpacing: -0.02 * fontSize, whiteSpace: "pre", lineHeight: 1 };
  return (
    <div style={{ position: "relative", display: "inline-block", padding: `${0.34 * fontSize}px ${0.62 * fontSize}px`, borderRadius: fontSize, border: `${Math.max(2, fontSize * 0.022)}px solid rgba(255, 120, 132, ${0.75 * glow})`,
      background: "linear-gradient(180deg, rgba(60, 6, 12, 0.55), rgba(25, 3, 6, 0.55))",
      boxShadow: `0 0 ${fontSize * 0.35}px rgba(${rgb}, ${0.7 * glow}), inset 0 0 ${fontSize * 0.3}px rgba(${rgb}, ${0.35 * glow})` }}>
      <span style={{ ...font, color: "transparent" }}>{text}</span>
      <span style={{ ...font, position: "absolute", left: 0.62 * fontSize, top: 0.34 * fontSize, filter: `drop-shadow(0 0 ${0.12 * fontSize}px rgba(${rgb}, ${0.9 * glow}))` }}>
        <span style={{ backgroundImage: "linear-gradient(90deg, #ff6676 0%, #ffc4ca 55%, #ffffff 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{shown}</span>
        {caret ? <span style={{ display: "inline-block", width: 0.045 * fontSize, height: 0.95 * fontSize, marginLeft: 0.06 * fontSize, verticalAlign: "-0.12em", background: `rgb(${rgb})`, boxShadow: `0 0 ${0.1 * fontSize}px rgba(${rgb},1)` }} /> : null}
      </span>
    </div>
  );
};

/* ------------------------------------------------------------------ the vortex */
export type VortexItem = { node: React.ReactNode; w: number; h: number; x: number; y: number };

/**
 * Cards that sit flat at (x, y) from the centre bend into a spinning ring around the centre as `p` goes 0 to 1, then fly
 * out past the camera as `fly` goes 0 to 1. `spin` is the ring's turn in degrees (drive it from the frame); `speed`
 * (deg per frame) draws that many motion-blur ghosts.
 */
export const VortexRing: React.FC<{ items: VortexItem[]; p: number; fly: number; spin: number; radius: number; tilt?: number; speed?: number; w: number; h: number }> = ({
  items, p, fly, spin, radius, tilt = 58, speed = 0, w, h,
}) => {
  const N = items.length;
  const ghosts = speed > 1.5 ? 2 : 0;
  return (
    <AbsoluteFill style={{ perspective: 1100, perspectiveOrigin: `${w / 2}px ${h / 2}px` }}>
      {items.map((it, i) => {
        const th = (i / N) * 360 + spin;
        const R = radius * (1 + fly * 1.6);
        return [0, ...Array.from({ length: ghosts }, (_, g) => g + 1)].map((g) => {
          const tg = th - g * speed * 0.9;
          const tf = `translate(${w / 2 - it.w / 2}px, ${h / 2 - it.h / 2}px) translate3d(${mix(it.x, 0, p)}px, ${mix(it.y, 0, p)}px, ${fly * 500}px) rotateZ(${tg * p}deg) translateY(${-R * p}px) rotateX(${-tilt * p}deg)`;
          return (
            <div key={`${i}-${g}`} style={{ position: "absolute", left: 0, top: 0, width: it.w, height: it.h, transform: tf, transformOrigin: "50% 50%", opacity: (g ? 0.28 / g : 1) * (1 - k(fly, 0.3, 1, IN)), backfaceVisibility: "visible" }}>
              {it.node}
            </div>
          );
        });
      })}
    </AbsoluteFill>
  );
};

/** Numbers measured off the reference (seconds at its 30 fps): sweep 0 to 0.6, star 0.85, name 1.0 to 1.75, fly-through
 *  1.9 to 2.2, hook 2.3 to 4.4 (whip out at 3.15), prompt 4.5 to 5.6, answer 6.1 to 7.5, dashboard 7.55 to 9.05, vortex 9.1
 *  to 10.6, tagline held to 11.3, ribbon again 11.35, star 11.9, name 12.2 to 13.0, held to 14.5. */
export const DESK_FLOW = { sweep: [0, 0.6], star: 0.85, name: [1.0, 1.75], through: [1.9, 2.2], hook: [2.3, 4.4], whip: 3.15, prompt: [4.5, 5.6], answer: [6.1, 7.5], dash: [7.55, 9.05], vortex: [9.1, 10.6], end: [11.35, 14.5] } as const;
