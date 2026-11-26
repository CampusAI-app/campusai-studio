/**
 * /low-poly (2026-11-17, from the Nov 17 Muse sends: Matt Penny's ten Claude animation styles, Karam Mahaan's six skills
 * where relevant. Prompts gated and unseen, so this is our own build of the look, read frame by frame. The console era it
 * borrows from is never named.)
 *
 * The reference: low-poly retro 3D, a purple-to-blue gradient sky, a blocky low-resolution city with noisy window
 * textures, a checkered ground running to the horizon, a chunky flat-shaded plane, a bold italic title.
 *
 * Ours: a low-poly fly-through of the Maryland campus, opened by the UMD M. A chunky paper plane flies the length of
 * McKeldin Mall (the Mall is the checkered ground, two greens) between blocky brick halls toward a blocky McKeldin Library
 * dome. Round 2 (Jacob Nov 17: show the product, or be a little funny; best both): a blocky retro billboard stands on the
 * Mall in front of McKeldin like a game's quest board, headed "Quest log", and as the camera settles on it the screen
 * powers on with a REAL capture of CampusAI's Planner & Progress page, crisp, laid on the low-res world with a perspective
 * transform measured from the 3D corners each frame. The plane climbs over it toward the dome. Three retro title cards:
 * where we are, the student's line, then CampusAI's answer.
 *
 * Getting the era right: the scene draws at 360 x 640 (a third of the frame) and is blown up with nearest-neighbour
 * pixels; every surface is flat shaded; vertices snap to a coarse screen grid so edges wobble as things move; colour is
 * cut to 32 levels per channel with a 4 x 4 ordered dither; simple linear fog; textures are tiny and drawn with
 * NearestFilter. No antialiasing, no shadows. Only the title cards are crisp. Render with --gl=angle.
 *
 * Motion in numbers (30 fps): the plane flies 0.5 units a frame down the Mall, sways +-2.2 units on a 150 frame sine
 * and banks with it, and from 3 s before the answer climbs 0.14 units a frame so it clears the board; the chase camera
 * sits 3.4 up and 11 back, then over 60 frames (0.4, 0, 0.2, 1) settles front-on to the board 40 units out and pushes
 * 2 units while the answer reads. The board's screen powers on over 12 frames (a CRT line opening to full height).
 * Cards hold the reading rule (letters / 15 + 1.5 s), slide in 14 frames from the right with a skew that settles
 * (0.16, 1, 0.3, 1), 20 frames apart, and leave 8 frames to the left.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { loadFont } from "@remotion/google-fonts/Exo2";
import * as THREE from "three";
import { CURVE, readFrames } from "../system/motion";
import { Cue, ramp } from "./common";
import type { Format } from "./common";
import { World } from "./world";
import { UmdOpen } from "./UmdOpen";

const { fontFamily: EXO } = loadFont("italic", { weights: ["700", "900"], subsets: ["latin"] });

// its own world: a dusk sky from deep blue through purple to a rose horizon, over a checkered campus
const SKY_TOP = "#18206E";
const SKY_MID = "#5A2F9E";
const SKY_LOW = "#D2477E";
const HORIZON = "#B14A8C";
const GROUND = `linear-gradient(180deg, ${SKY_TOP} 0%, ${SKY_MID} 45%, ${SKY_LOW} 100%)`;
const INK = "#FFFFFF";
const END_GROUND = "#241466";
const RED = "#D9202E";
const LOW_W = 360;
const LOW_H = 640;

export type LowPolyProps = {
  format?: Format;
  /** Where we are, the first card (a real place, a few words). */
  place: string;
  /** A smaller line under the place. */
  placeSub?: string;
  /** Who the student is, small over their line. */
  who: string;
  /** The student's line, in their own words. */
  ask: string;
  /** Who answers, small over the answer. */
  answerBy: string;
  /** The answer, true on main. */
  answer: string;
  /** The billboard's screen: a real capture crop under public/ and its size in pixels, and the line on its header bar. */
  board: { src: string; w: number; h: number; title: string };
  source: string;
  cta?: string;
};

export const polyPlan = (p: LowPolyProps) => {
  const placeAt = 2;
  const placeOut = placeAt + readFrames(`${p.place} ${p.placeSub ?? ""}`.trim());
  const askAt = placeOut + 8;
  const askOut = askAt + readFrames(`${p.who} ${p.ask}`);
  const answerAt = askOut + 20;
  const answerOut = answerAt + readFrames(`${p.answerBy} ${p.answer}`) + 8;
  const end = answerOut + 4;
  return { placeAt, placeOut, askAt, askOut, answerAt, answerOut, end };
};
export const polyEnd = (p: LowPolyProps) => polyPlan(p).end;

/* ---------------------------------------------------------------- the era: snap, dither, quantise */
const SNAP = new THREE.Vector2(120, 213);
const BAYER = `
float retroBayer(vec2 p) {
  int x = int(mod(p.x, 4.0));
  int y = int(mod(p.y, 4.0));
  float m[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
  return (m[x + y * 4] + 0.5) / 16.0;
}
`;
const retro = <T extends THREE.Material>(m: T, snap = true): T => {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uSnap = { value: SNAP };
    if (snap) {
      sh.vertexShader = "uniform vec2 uSnap;\n" + sh.vertexShader.replace(
        "#include <project_vertex>",
        "#include <project_vertex>\n  if (gl_Position.w > 0.5) {\n    vec4 snapped = gl_Position;\n    snapped.xy = floor(snapped.xy / snapped.w * uSnap + 0.5) / uSnap * snapped.w;\n    gl_Position = snapped;\n  }",
      );
    }
    sh.fragmentShader = BAYER + sh.fragmentShader.replace(
      "#include <dithering_fragment>",
      "#include <dithering_fragment>\n  gl_FragColor.rgb = floor(gl_FragColor.rgb * 31.0 + retroBayer(gl_FragCoord.xy)) / 31.0;",
    );
  };
  m.customProgramCacheKey = () => `retro-${snap}`;
  return m;
};

const flat = (color: string, map?: THREE.Texture) => retro(new THREE.MeshLambertMaterial({ color, map: map ?? null, flatShading: true }));

/* ---------------------------------------------------------------- tiny textures, drawn pixel by pixel */
const rng = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const hex = (c: string) => new THREE.Color(c);
const pixTex = (w: number, h: number, paint: (x: number, y: number) => THREE.Color, rx = 1, ry = 1) => {
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = paint(x, y).clone().convertLinearToSRGB();
      const i = (y * w + x) * 4;
      data[i] = Math.round(c.r * 255);
      data[i + 1] = Math.round(c.g * 255);
      data[i + 2] = Math.round(c.b * 255);
      data[i + 3] = 255;
    }
  }
  const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.needsUpdate = true;
  return t;
};

/** A checker with a little per-pixel noise, 8 x 8 pixels per tile pair. */
const checker = (a: string, b: string, rx: number, ry: number, seed: number) => {
  const r = rng(seed);
  const A = hex(a);
  const Bc = hex(b);
  return pixTex(8, 8, (x, y) => ((x < 4) !== (y < 4) ? A : Bc).clone().multiplyScalar(0.9 + r() * 0.2), rx, ry);
};

/** A brick wall with a grid of windows, some lit warm, most dark, with noise: one texture pixel per ~0.6 units. */
const facade = (w: number, h: number, brick: string, seed: number) => {
  const r = rng(seed);
  const pw = Math.max(8, Math.round(w / 0.6));
  const ph = Math.max(8, Math.round(h / 0.6));
  const B0 = hex(brick);
  const lit = hex("#FFD27A");
  const dark = hex("#2A2F6A");
  const trim = hex("#EDE6DA");
  const lits = new Map<string, boolean>();
  return pixTex(pw, ph, (x, y) => {
    if (y >= ph - 2) return trim.clone().multiplyScalar(0.9 + r() * 0.1);
    const cx = x % 4;
    const cy = y % 5;
    const win = cx >= 1 && cx <= 2 && cy >= 1 && cy <= 3 && x > 1 && x < pw - 2 && y > 1 && y < ph - 3;
    if (win) {
      const key = `${Math.floor(x / 4)}-${Math.floor(y / 5)}`;
      if (!lits.has(key)) lits.set(key, r() < 0.28);
      return (lits.get(key) ? lit : dark).clone().multiplyScalar(0.85 + r() * 0.3);
    }
    return B0.clone().multiplyScalar(0.82 + r() * 0.3);
  });
};

/* ---------------------------------------------------------------- the campus */
const BRICKS = ["#A6443A", "#B5503F", "#94392F", "#AE4A44"];

const Hall: React.FC<{ x: number; z: number; w: number; h: number; d: number; seed: number; ry?: number }> = ({ x, z, w, h, d, seed, ry = 0 }) => {
  const mats = useMemo(() => {
    const brick = BRICKS[seed % BRICKS.length];
    const front = flat("#FFFFFF", facade(w, h, brick, seed));
    const side = flat("#FFFFFF", facade(d, h, brick, seed + 7));
    const roof = flat("#3A3550");
    return [side, side, roof, roof, front, front];
  }, [w, h, d, seed]);
  const roofMat = useMemo(() => flat("#433A5E"), []);
  return (
    <group position={[x, 0, z]} rotation={[0, ry, 0]}>
      <mesh position={[0, h / 2, 0]} material={mats}>
        <boxGeometry args={[w, h, d]} />
      </mesh>
      {/* a slate gable roof, a three-sided prism */}
      <mesh position={[0, h + 1.6, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 1]} material={roofMat}>
        <cylinderGeometry args={[2.2, 2.2, w * 0.98, 3, 1]} />
      </mesh>
    </group>
  );
};

const Tree: React.FC<{ x: number; z: number; s: number; tone: string }> = ({ x, z, s, tone }) => {
  const leaf = useMemo(() => flat(tone), [tone]);
  const trunk = useMemo(() => flat("#5B3A2E"), []);
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 1.2, 0]} material={trunk}><boxGeometry args={[0.6, 2.4, 0.6]} /></mesh>
      <mesh position={[0, 3.6, 0]} material={leaf}><icosahedronGeometry args={[2.2, 0]} /></mesh>
    </group>
  );
};

/** McKeldin Library, blocky: a long brick block, a white portico of columns under a pediment, a drum, a dome, a lantern. */
const McKeldin: React.FC<{ z: number }> = ({ z }) => {
  const body = useMemo(() => {
    const front = flat("#FFFFFF", facade(64, 15, "#A6443A", 91));
    const side = flat("#FFFFFF", facade(22, 15, "#A6443A", 92));
    const roof = flat("#3A3550");
    return [side, side, roof, roof, front, front];
  }, []);
  const white = useMemo(() => flat("#EDE8E0"), []);
  const dome = useMemo(() => flat("#DCE3E8"), []);
  const slate = useMemo(() => flat("#433A5E"), []);
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, 7.5, 0]} material={body}><boxGeometry args={[64, 15, 22]} /></mesh>
      {/* portico */}
      <mesh position={[0, 0.6, 13.5]} material={white}><boxGeometry args={[22, 1.2, 6]} /></mesh>
      {[-9, -5.4, -1.8, 1.8, 5.4, 9].map((cx) => (
        <mesh key={cx} position={[cx, 7.6, 14.6]} material={white}><boxGeometry args={[1.5, 13, 1.5]} /></mesh>
      ))}
      <mesh position={[0, 14.6, 13.4]} material={white}><boxGeometry args={[22, 1.6, 4.6]} /></mesh>
      <mesh position={[0, 17.2, 13.4]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 1]} material={white}>
        <cylinderGeometry args={[6.6, 6.6, 4.4, 3, 1, false, Math.PI, Math.PI]} />
      </mesh>
      {/* the roof line, then the drum, dome and lantern */}
      <mesh position={[0, 15.8, 0]} rotation={[0, 0, Math.PI / 2]} material={slate}><cylinderGeometry args={[3, 3, 63, 3, 1]} /></mesh>
      <mesh position={[0, 20.5, 0]} material={white}><cylinderGeometry args={[6.8, 7.2, 6, 10, 1]} /></mesh>
      <mesh position={[0, 23.5, 0]} material={dome}><sphereGeometry args={[6.8, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
      <mesh position={[0, 31.2, 0]} material={white}><cylinderGeometry args={[1.4, 1.6, 2.6, 6, 1]} /></mesh>
      <mesh position={[0, 33.6, 0]} material={dome}><coneGeometry args={[1.6, 2.4, 6, 1]} /></mesh>
    </group>
  );
};

const Sky: React.FC = () => {
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(500, 16, 12);
    const pos = g.attributes.position;
    const cols: number[] = [];
    const top = hex(SKY_TOP);
    const mid = hex(SKY_MID);
    const low = hex(SKY_LOW);
    for (let i = 0; i < pos.count; i++) {
      const k = Math.max(0, pos.getY(i) / 500);
      const c = k < 0.18 ? low.clone().lerp(mid, k / 0.18) : mid.clone().lerp(top, Math.min(1, (k - 0.18) / 0.5));
      cols.push(c.r, c.g, c.b);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    return g;
  }, []);
  const mat = useMemo(() => retro(new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }), false), []);
  return <mesh geometry={geo} material={mat} renderOrder={-1} />;
};

/** A chunky paper plane, a few big triangles, flat shaded. */
const PAPER = (() => {
  const nose = [0, 0, -2.2];
  const lt = [-1.8, 0.2, 1.4];
  const rt = [1.8, 0.2, 1.4];
  const tail = [0, 0.05, 1.4];
  const keel = [0, -0.7, 1.2];
  const wing = new THREE.BufferGeometry();
  wing.setAttribute("position", new THREE.Float32BufferAttribute([...nose, ...tail, ...lt, ...nose, ...rt, ...tail], 3));
  wing.computeVertexNormals();
  const k = new THREE.BufferGeometry();
  k.setAttribute("position", new THREE.Float32BufferAttribute([...nose, ...keel, ...tail], 3));
  k.computeVertexNormals();
  return { wing, keel: k };
})();

const Plane: React.FC<{ pos: THREE.Vector3; roll: number; pitch: number }> = ({ pos, roll, pitch }) => {
  const wing = useMemo(() => retro(new THREE.MeshLambertMaterial({ color: "#F1EDFF", emissive: "#4A3D7A", side: THREE.DoubleSide, flatShading: true })), []);
  const keel = useMemo(() => retro(new THREE.MeshLambertMaterial({ color: RED, side: THREE.DoubleSide, flatShading: true })), []);
  return (
    <group position={pos} rotation={[pitch, 0, roll]}>
      <mesh geometry={PAPER.wing} material={wing} />
      <mesh geometry={PAPER.keel} material={keel} />
    </group>
  );
};

const MALL_Z0 = 30;
const MALL_LEN = 250;
const DOME_Z = -238;
const FOV = 62;
// the quest board: a screen 20 units wide on two posts, standing on the Mall in front of McKeldin, off to the right
const BOARD_Z = -150;
const BOARD_X = 13; // right of the Mall's middle, so McKeldin's dome stays in view down the Mall
const BOARD_W = 20;
const BOARD_BOTTOM = 2.5;
const HEADER = 2.0; // the header bar over the screen, in world units
const boardH = (p: LowPolyProps) => (BOARD_W * p.board.h) / p.board.w;

const flight = (f: number, answerAt: number) => {
  const z = 18 - f * 0.5;
  const x = Math.sin(f / 24) * 2.2;
  const climb = Math.max(0, f - answerAt + 90);
  const y = 7 + Math.sin(f / 37) * 0.6 + climb * 0.14;
  const roll = -Math.cos(f / 24) * 0.32;
  const pitch = climb > 0 ? Math.min(0.22, climb * 0.005) : 0;
  return { pos: new THREE.Vector3(x, y, z), roll, pitch };
};

/** Where the camera is on a frame: the chase behind the plane, easing for the answer to a still front-on view of the
 * board with the dome over it. Pure, so the crisp overlay can project the board's corners with the very same camera. */
const camPose = (f: number, p: LowPolyProps) => {
  const plan = polyPlan(p);
  const fl = flight(f, plan.answerAt);
  const lag = flight(f - 6, plan.answerAt);
  const k = ramp(f, plan.answerAt - 40, plan.answerAt + 20, CURVE.quiet.standard);
  const chasePos = new THREE.Vector3(lag.pos.x * 0.6, fl.pos.y + 3.4, fl.pos.z + 11);
  const chaseLook = new THREE.Vector3(fl.pos.x * 0.4, fl.pos.y + 1.2, fl.pos.z - 24);
  // front-on, the board above the middle of the frame, a slow push of 2 units while the answer reads
  const push = ramp(f, plan.answerAt, plan.end, CURVE.quiet.standard) * 2;
  const boardPos = new THREE.Vector3(BOARD_X, 11, BOARD_Z + 40 - push);
  const boardLook = new THREE.Vector3(BOARD_X, 7, BOARD_Z);
  const pos = chasePos.lerp(boardPos, k);
  const look = chaseLook.lerp(boardLook, k);
  const up = new THREE.Vector3(Math.sin(fl.roll * 0.25) * (1 - k), 1, 0).normalize();
  return { pos, look, up, fl };
};

const Scene: React.FC<{ p: LowPolyProps }> = ({ p }) => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  useMemo(() => {
    scene.fog = new THREE.Fog(HORIZON, 50, 290);
  }, [scene]);
  const { pos, look, up, fl } = camPose(f, p);
  camera.position.copy(pos);
  camera.up.copy(up);
  camera.lookAt(look);
  camera.updateProjectionMatrix();

  const ground = useMemo(() => flat("#FFFFFF", checker("#2C1F5C", "#3B2A78", 120, 120, 3)), []);
  const lawn = useMemo(() => flat("#FFFFFF", checker("#3E8E4B", "#4FA85A", 8, 50, 5)), []);
  const walk = useMemo(() => flat("#FFFFFF", checker("#C98F7A", "#B67A66", 1, 60, 9)), []);
  const halls = useMemo(() => {
    const out: { x: number; z: number; w: number; h: number; d: number; seed: number }[] = [];
    let i = 0;
    for (let z = 10; z > -200; z -= 30) {
      for (const side of [-1, 1]) {
        const w = 18 + ((i * 7) % 3) * 3;
        out.push({ x: side * (34 + ((i * 5) % 4)), z: z - ((i * 11) % 7), w, h: 11 + ((i * 13) % 4) * 2, d: 14, seed: 17 + i * 3 });
        i++;
      }
    }
    return out;
  }, []);
  const trees = useMemo(() => {
    const out: { x: number; z: number; s: number; tone: string }[] = [];
    for (let z = 14; z > -205; z -= 12) {
      for (const side of [-1, 1]) out.push({ x: side * 21, z: z + (side > 0 ? 6 : 0), s: 0.95 + ((Math.abs(z) * 7) % 5) / 20, tone: side > 0 ? "#2F7A3E" : "#3B8A45" });
    }
    return out;
  }, []);
  return (
    <>
      <hemisphereLight args={["#C9B8FF", "#4A2A5E", 1.4]} />
      <directionalLight position={[30, 60, 40]} intensity={1.6} color="#FFE2C8" />
      <Sky />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, -150]} material={ground}><planeGeometry args={[900, 900, 90, 90]} /></mesh>
      {/* the Mall: a long lawn in two greens, brick walks either side */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, MALL_Z0 - MALL_LEN / 2]} material={lawn}><planeGeometry args={[36, MALL_LEN, 6, 60]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-21, 0.02, MALL_Z0 - MALL_LEN / 2]} material={walk}><planeGeometry args={[5, MALL_LEN, 1, 60]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[21, 0.02, MALL_Z0 - MALL_LEN / 2]} material={walk}><planeGeometry args={[5, MALL_LEN, 1, 60]} /></mesh>
      {halls.map((h, i) => <Hall key={i} {...h} />)}
      {trees.map((t, i) => <Tree key={i} {...t} />)}
      <McKeldin z={DOME_Z} />
      <Board p={p} />
      <Plane pos={fl.pos} roll={fl.roll} pitch={-fl.pitch} />
    </>
  );
};

/** The quest board in the low-res world: two posts, a chunky frame, a dark screen the crisp capture is laid over. */
const Board: React.FC<{ p: LowPolyProps }> = ({ p }) => {
  const frame = useMemo(() => flat("#2A2350"), []);
  const trim = useMemo(() => flat(RED), []);
  const post = useMemo(() => flat("#6B6488"), []);
  const dark = useMemo(() => flat("#120C24"), []);
  const h = boardH(p);
  const cy = BOARD_BOTTOM + (h + HEADER) / 2;
  return (
    <group position={[BOARD_X, 0, BOARD_Z]}>
      {[-BOARD_W * 0.32, BOARD_W * 0.32].map((x) => (
        <mesh key={x} position={[x, BOARD_BOTTOM / 2, -0.6]} material={post}><boxGeometry args={[1.2, BOARD_BOTTOM, 1.2]} /></mesh>
      ))}
      <mesh position={[0, cy, -0.7]} material={frame}><boxGeometry args={[BOARD_W + 2.4, h + HEADER + 2.2, 1]} /></mesh>
      <mesh position={[0, cy - (h + HEADER) / 2 - 1.1, -0.15]} material={trim}><boxGeometry args={[BOARD_W + 2.4, 0.5, 0.5]} /></mesh>
      <mesh position={[0, cy, -0.12]} material={dark}><boxGeometry args={[BOARD_W + 0.6, h + HEADER + 0.6, 0.2]} /></mesh>
    </group>
  );
};

/** A CSS matrix3d that maps a w x h box onto four screen points (top-left, top-right, bottom-right, bottom-left). */
const quadMatrix = (w: number, h: number, q: [number, number][]) => {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / den;
  const hh = (dx1 * dy3 - dx3 * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + hh * x3, c = x0;
  const d = y1 - y0 + g * y1, e = y3 - y0 + hh * y3, f = y0;
  const m = [a / w, d / w, 0, g / w, b / h, e / h, 0, hh / h, 0, 0, 1, 0, c, f, 0, 1];
  return `matrix3d(${m.map((x) => x.toFixed(8)).join(",")})`;
};

/** The real capture, crisp, laid over the board's screen with the same camera as the scene; it powers on like a CRT. */
const BoardScreen: React.FC<{ p: LowPolyProps }> = ({ p }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const plan = polyPlan(p);
  const on = ramp(f, plan.answerAt - 16, plan.answerAt - 4, CURVE.showy.enter);
  if (on <= 0) return null;
  const { pos, look, up } = camPose(f, p);
  const cam = new THREE.PerspectiveCamera(FOV, width / height, 0.5, 1200);
  cam.position.copy(pos);
  cam.up.copy(up);
  cam.lookAt(look);
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  const h = boardH(p);
  const top = BOARD_BOTTOM + h + HEADER;
  const z = BOARD_Z;
  const corners = [[-BOARD_W / 2, top], [BOARD_W / 2, top], [BOARD_W / 2, BOARD_BOTTOM], [-BOARD_W / 2, BOARD_BOTTOM]].map(([x0, y]) => {
    const x = x0 + BOARD_X;
    const v = new THREE.Vector3(x, y, z).project(cam);
    return [((v.x + 1) / 2) * width, ((1 - v.y) / 2) * height] as [number, number];
  });
  // the box is drawn at the capture's width; the header bar sits on top in the same proportion as in the world
  const W = p.board.w;
  const headPx = (HEADER / BOARD_W) * W;
  const H = p.board.h + headPx;
  const flicker = on < 1 ? 1 : 0.96 + 0.04 * Math.sin(f * 2.1);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: quadMatrix(W, H, corners), zIndex: 4 }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: headPx, background: "#1A1240", display: "flex", alignItems: "center", gap: headPx * 0.3,
        padding: `0 ${headPx * 0.4}px`, fontFamily: EXO, fontStyle: "italic", fontWeight: 900, fontSize: headPx * 0.62, color: "#FFFFFF", opacity: on }}>
        <span style={{ width: headPx * 0.34, height: headPx * 0.34, background: RED, transform: "rotate(45deg)" }} />
        {p.board.title}
      </div>
      <div style={{ position: "absolute", left: 0, top: headPx, width: W, height: p.board.h, overflow: "hidden", background: "#120C24" }}>
        <Img src={staticFile(p.board.src)} style={{ width: W, height: p.board.h, display: "block", opacity: flicker,
          transform: `scaleY(${(0.02 + 0.98 * on).toFixed(3)})`, filter: `brightness(${(1 + (1 - on) * 2).toFixed(2)})` }} />
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- the title cards */
const Card: React.FC<{ at: number; out: number; top: number; small?: string; big: string; size: number; align?: "left" | "right" }> = ({ at, out, top, small, big, size, align = "left" }) => {
  const f = useCurrentFrame();
  const { width } = useVideoConfig();
  if (f < at || f > out) return null;
  const k = ramp(f, at, at + 14, CURVE.showy.enter);
  const leave = ramp(f, out - 8, out, CURVE.showy.exit);
  const x = (1 - k) * width * 0.9 - leave * width;
  const skew = -12 + (1 - k) * -18;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top, transform: `translateX(${x.toFixed(1)}px) skewX(${skew.toFixed(2)}deg)`, textAlign: align, zIndex: 30 }}>
      {small ? (
        <div style={{ display: "inline-block", fontFamily: EXO, fontStyle: "italic", fontWeight: 700, fontSize: Math.round(size * 0.42), color: "#FFFFFF", background: RED,
          padding: "6px 22px 8px", marginBottom: 18, transform: "skewX(-4deg)", boxShadow: "6px 6px 0 #1A0F45" }}>{small}</div>
      ) : null}
      <div style={{ fontFamily: EXO, fontStyle: "italic", fontWeight: 900, fontSize: size, lineHeight: 0.98, letterSpacing: "-0.01em",
        backgroundImage: "linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 48%, #FFC6D8 52%, #FF8FB1 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
        filter: "drop-shadow(5px 5px 0 #D9202E) drop-shadow(5px 5px 0 #1A0F45)" }}>{big}</div>
    </div>
  );
};

export const LowPoly: React.FC<LowPolyProps> = (p) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const plan = polyPlan(p);
  const srcK = ramp(f, plan.answerAt + 20, plan.answerAt + 34) * (1 - ramp(f, plan.end - 8, plan.end));
  return (
    <World endAt={plan.end} cta={p.cta} font={EXO} fontWeight={900} ink={INK} logo="white" logoSpot="top-right" end="wipe-left" endGround={END_GROUND}
      ground={GROUND}>
      <AbsoluteFill style={{ imageRendering: "pixelated" }}>
        <ThreeCanvas width={width} height={height} dpr={LOW_W / width} camera={{ fov: FOV, position: [0, 10, 30], near: 0.5, far: 1200 }}
          gl={{ antialias: false, alpha: false }} style={{ imageRendering: "pixelated" }}>
          <Scene p={p} />
        </ThreeCanvas>
      </AbsoluteFill>
      {/* a faint scanline wash over the blown-up pixels, one line per low-res row */}
      <BoardScreen p={p} />
      <AbsoluteFill style={{ backgroundImage: `repeating-linear-gradient(180deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) ${height / LOW_H - 1}px, rgba(10,4,30,.16) ${height / LOW_H - 1}px, rgba(10,4,30,.16) ${height / LOW_H}px)`, zIndex: 5 }} />
      <Card at={plan.placeAt} out={plan.placeOut} top={Math.round(height * 0.16)} big={p.place} small={p.placeSub} size={Math.round(width * 0.12)} />
      <Card at={plan.askAt} out={plan.askOut} top={Math.round(height * 0.16)} small={p.who} big={p.ask} size={Math.round(width * 0.105)} />
      <Card at={plan.answerAt} out={plan.answerOut} top={Math.round(height * 0.655)} small={p.answerBy} big={p.answer} size={Math.round(width * 0.082)} />
      <div style={{ position: "absolute", left: 60, right: 60, top: Math.round(height * 0.915), fontFamily: EXO, fontStyle: "italic", fontWeight: 700,
        fontSize: Math.round(width * 0.03), color: "#FFFFFF", opacity: 0.85 * srcK, textShadow: "3px 3px 0 #1A0F45", zIndex: 30 }}>{p.source}</div>
      <Cue at={plan.placeAt} name="air-woosh-quick" volume={0.4} />
      <Cue at={plan.askAt} name="typewriter-hit-hard" volume={0.35} />
      <Cue at={plan.answerAt} name="bass-hit-short" volume={0.45} />
      <Cue at={plan.answerAt + 8} name="swoosh-slow" volume={0.25} />
      <Cue at={plan.answerAt - 16} name="data-scan" volume={0.3} />
      {/* the UMD M in the first second, then a small tag top centre (Jacob, Nov 17), clear of the cards at 16% */}
      <UmdOpen bigCy={Math.round(height * 0.42)} tagCx={width / 2} tagCy={118} outAt={plan.end - 6} />
    </World>
  );
};
