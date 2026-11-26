/**
 * /brick-world (2026-11-17, from the Nov 17 Muse sends: Matt Penny's ten Claude animation styles, his toy-brick look;
 * Karam Mahaan's six skills where relevant). Prompts gated and unseen, our own build of the look. No brand name, no logo
 * on the studs, and the figure is our own blocky student, not a copy of any toy maker's figure.
 *
 * The reference, read frame by frame: a toy-brick landscape on a blue sky. Green studded baseplate hills built in steps,
 * little brick houses with red sloped roofs and white windows, a blocky toy figure standing in the scene, studded white
 * brick clouds, and a red brick title banner.
 *
 * Ours, student-first at Maryland (round 3, Nov 17; Jacob: show the actual planning, never the planner's disclaimer):
 * the UMD M opens the film and a red brick banner hangs in the sky with the student's line. Under it the student piles
 * up a brick for every place they check (the four a gen ed answer really comes from), the pile sways, rocks on its edge
 * and topples comically off to the side. Then a big brick screen lights and scrolls through the REAL plan, one term card
 * at a time, while that term's brick clicks in under it, and ends on the real General Education requirements. All
 * three.js in code around the captures: rounded plastic boxes, instanced studs on every top face, soft shadows, labels
 * printed on the bricks from a canvas. Render with --gl=angle.
 *
 * Motion in numbers (30 fps): the banner drops 3 units onto its spot in 9 frames and bounces. Tab bricks drop 12 frames
 * apart from 5 units; the pile then rocks onto its right edge, up to 0.16 rad on a 20-frame period, growing until it
 * leans to 0.62 rad over 10 frames (ease-in) and breaks: each brick hops off on its own arc in 10 + 3i frames and bounces
 * 0.3 units. The screen flickers on over 10 frames. Term bricks click in 18 frames apart from 3 units, the screen scrolling to that term over 10 frames as each falls, each a 9-frame
 * ease-in fall and a 0.24-unit bounce decaying over 12 frames. The camera orbits from 0.12 to 0.03 rad, 34 units
 * out, then pushes in to 27.5 units on the screen over 40 frames as it lights.
 */
import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, Easing, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useLoader, useThree } from "@react-three/fiber";
import { loadFont } from "@remotion/google-fonts/Rubik";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { CURVE, readHold } from "../system/motion";
import { Cue, RED, clamp, ramp } from "./common";
import type { Format } from "./common";
import { World } from "./world";
import { UmdOpen } from "./UmdOpen";

const { fontFamily: RUBIK, waitUntilDone } = loadFont("normal", { weights: ["500", "800"], subsets: ["latin"] });

const FPS = 30;
const SKY = "linear-gradient(180deg, #6ec3fb 0%, #a6dcff 55%, #d9f1ff 100%)";
const NAVY = "#0f2a4d";
// the ending: a blue baseplate, its studs catching the light
const END_GROUND = "radial-gradient(circle at 50% 50%, #2e74cc 0 30%, #184f96 33% 38%, transparent 40%) 0 0 / 60px 60px, #1E5AA8";

const C = {
  green: "#3fae4b", greenDark: "#2d8c3a", red: RED, blue: "#1f5fbf", yellow: "#f6c21c", white: "#f3f2ec", orange: "#f08a24",
  tan: "#e6c78f", brown: "#7a4a24", dark: "#2c2e35", skin: "#f1c48e", hair: "#3b2416", jeans: "#2b4c8c", glass: "#bfe3ff",
};
const TERM_COLORS = [C.blue, C.yellow, C.white, C.orange, C.blue, C.yellow, C.white, C.orange];

export type BrickWorldProps = {
  format?: Format;
  /** Who the student is (banner, first line). */
  who: string;
  /** Their question, in their own words (banner, second line). */
  ask: string;
  /** The places they check, one wobbly brick each, bottom up. They pile up, sway and topple. */
  tabs: string[];
  /** The line over the toppled pile. */
  tabsLine: string;
  /** The real plan as one tall picture, square panels stacked top to bottom: one per term (in brick order), then the
   * requirements panel last. The brick screen scrolls through it, one panel per brick. */
  plan: { src: string; panels: number };
  /** Who answers, small, over the answer. */
  answerBy?: string;
  /** The answer once the screen lights. */
  answer: string;
  /** Term bricks, bottom up, two per row (left then right), clicking in under the screen; each its panel's own term. */
  bricks: string[];
  /** The line once the screen reaches the requirements panel. */
  endLine: string;
  /** One small line at the foot of the frame. */
  source: string;
  cta?: string;
};

export const brickPlan = (p: BrickWorldProps) => {
  const askOut = 8 + Math.round(readHold(`${p.who} ${p.ask}`) * FPS);
  // the tabs start piling up under the question, so the joke is already moving while it reads
  const tabDrops = p.tabs.map((_, i) => 34 + i * 12);
  const settled = tabDrops[tabDrops.length - 1] + FALL;
  const tip = askOut + 14; // the sway gives out
  const brk = tip + 8; // the pile breaks apart mid-lean
  // the screen lights while the punchline still reads; the answer swaps in once the line has had its time
  const screenOn = Math.max(brk + 36, askOut + 40);
  const answerAt = Math.max(screenOn + 8, askOut + Math.round(readHold(p.tabsLine) * FPS));
  // one brick per term, each landing as the screen scrolls to that term's real card
  const drops = p.bricks.map((_, i) => screenOn + 16 + i * 18);
  const lastLand = drops[drops.length - 1] + FALL;
  const reqAt = lastLand + 8; // the screen scrolls on to the requirements
  const end = Math.max(reqAt + 14 + Math.round(readHold(p.endLine) * FPS) + 20, answerAt + Math.round(readHold(`${p.answerBy ?? ""} ${p.answer}`) * FPS));
  return { askOut, tabDrops, settled, tip, brk, screenOn, answerAt, drops, lastLand, reqAt, end };
};
export const brickEnd = (p: BrickWorldProps) => brickPlan(p).end;

const BH = 1.2; // a brick's height, one stud pitch is 1
const FALL = 9;

/** Where a dropped brick sits: falling on an ease-in, then a small decaying bounce. */
const dropY = (f: number, at: number, rest: number, height = 5.5) => {
  if (f < at) return null;
  const t = f - at;
  if (t < FALL) return rest + height * (1 - Easing.in(Easing.quad)(t / FALL));
  const b = t - FALL;
  return rest + 0.24 * Math.exp(-b / 4) * Math.abs(Math.sin((b * Math.PI) / 5));
};

/* ---------------- parts ---------------- */

const plastic = (color: string) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.32, metalness: 0, clearcoat: 0.55, clearcoatRoughness: 0.22 });
const STUD = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 24);

/** Stud positions on a w x d top face centred on the origin, at height y. */
const studGrid = (w: number, d: number, y: number) => {
  const out: [number, number, number][] = [];
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) out.push([i - (w - 1) / 2, y + 0.1, j - (d - 1) / 2]);
  return out;
};

const Studs: React.FC<{ at: [number, number, number][]; mat: THREE.Material }> = ({ at, mat }) => {
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(STUD, mat, Math.max(1, at.length));
    const o = new THREE.Object3D();
    at.forEach((p, i) => {
      o.position.set(...p);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.count = at.length;
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }, [at, mat]);
  return <primitive object={mesh} />;
};

/** A brick: w x d studs, h tall, its bottom at the group's origin, studs on top unless told not. */
const Brick: React.FC<{ w: number; d: number; h?: number; color: string; studs?: boolean; position?: [number, number, number]; children?: React.ReactNode }> = ({
  w, d, h = BH, color, studs = true, position = [0, 0, 0], children,
}) => {
  const mat = useMemo(() => plastic(color), [color]);
  const geo = useMemo(() => new RoundedBoxGeometry(w - 0.04, h, d - 0.04, 3, 0.07), [w, d, h]);
  const at = useMemo(() => (studs ? studGrid(w, d, h) : []), [w, d, h, studs]);
  return (
    <group position={position}>
      <mesh geometry={geo} material={mat} position={[0, h / 2, 0]} castShadow receiveShadow />
      {studs ? <Studs at={at} mat={mat} /> : null}
      {children}
    </group>
  );
};

/** A printed label on a brick's front face, drawn on a canvas in the style's face. */
const usePrint = (lines: { text: string; size: number; weight: number; align?: "left" | "right" | "center"; x?: number; y: number }[], w: number, h: number, color: string, ready: boolean) =>
  useMemo(() => {
    if (!ready) return null;
    const px = 160;
    const cv = document.createElement("canvas");
    cv.width = Math.round(w * px);
    cv.height = Math.round(h * px);
    const g = cv.getContext("2d")!;
    g.fillStyle = color;
    g.textBaseline = "middle";
    for (const l of lines) {
      g.font = `${l.weight} ${l.size * px}px ${RUBIK}`;
      // never wider than the face: shrink the line to fit
      const room = cv.width * 0.92;
      const wide = g.measureText(l.text).width;
      if (wide > room) g.font = `${l.weight} ${((l.size * px * room) / wide).toFixed(1)}px ${RUBIK}`;
      g.textAlign = l.align ?? "center";
      const x = l.x !== undefined ? l.x * px : cv.width / 2;
      g.fillText(l.text, x, l.y * px);
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, JSON.stringify(lines), w, h, color]);

const Print: React.FC<{ tex: THREE.Texture | null; w: number; h: number; y: number; z: number }> = ({ tex, w, h, y, z }) =>
  tex ? (
    <mesh position={[0, y, z]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  ) : null;

const House: React.FC<{ position: [number, number, number]; wall: string; w?: number; d?: number }> = ({ position, wall, w = 4, d = 3 }) => {
  const roof = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2 - 0.35, 0);
    s.lineTo(w / 2 + 0.35, 0);
    s.lineTo(0, 1.7);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: d + 0.4, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2 });
    g.translate(0, 0, -(d + 0.4) / 2);
    return g;
  }, [w, d]);
  const roofMat = useMemo(() => plastic(C.red), []);
  return (
    <group position={position}>
      <Brick w={w} d={d} h={2.4} color={wall} studs={false} />
      {/* white windows with a pale pane, and a door */}
      {[-w / 4, w / 4].map((x, i) => (
        <group key={i} position={[x, 1.45, d / 2 + 0.02]}>
          <mesh castShadow><boxGeometry args={[0.95, 0.95, 0.12]} /><meshPhysicalMaterial color={C.white} roughness={0.3} clearcoat={0.5} /></mesh>
          <mesh position={[0, 0, 0.07]}><boxGeometry args={[0.62, 0.62, 0.02]} /><meshStandardMaterial color={C.glass} roughness={0.2} /></mesh>
        </group>
      ))}
      <mesh position={[0, 0.55, d / 2 + 0.03]}><boxGeometry args={[0.8, 1.1, 0.1]} /><meshPhysicalMaterial color={C.brown} roughness={0.35} clearcoat={0.4} /></mesh>
      <mesh geometry={roof} material={roofMat} position={[0, 2.4, 0]} castShadow receiveShadow />
    </group>
  );
};

const Tree: React.FC<{ position: [number, number, number] }> = ({ position }) => (
  <group position={position}>
    <Brick w={1} d={1} h={2.4} color={C.brown} studs={false} />
    <Brick w={3} d={3} color={C.greenDark} position={[0, 2.4, 0]} studs={false} />
    <Brick w={2} d={2} color={C.green} position={[0, 3.6, 0]} />
  </group>
);

/** White brick clouds; lit from the sky side so their undersides stay white, not grey. */
const Cloud: React.FC<{ position: [number, number, number] }> = ({ position }) => (
  <group position={position}>
    <Brick w={6} d={2} color="#ffffff" />
    <Brick w={3} d={2} color="#ffffff" position={[-0.5, BH, 0]} />
    <pointLight position={[0, -3, 4]} intensity={30} distance={10} color="#ffffff" />
  </group>
);


/** Our own blocky student: square head, hoodie in Maryland red, jeans. Not any toy maker's figure. `arms` 0 is down, 1 is
 * both up (shock as the pile goes, joy at the end); `look` tips the head up. */
const Student: React.FC<{ f: number; arms: number; jump: number; look: number; position: [number, number, number]; turn: number }> = ({ f, arms, jump, look, position, turn }) => {
  const sway = 0.03 * Math.sin(f / 9);
  const skin = useMemo(() => plastic(C.skin), []);
  const hood = useMemo(() => plastic(C.red), []);
  const jeans = useMemo(() => plastic(C.jeans), []);
  const hair = useMemo(() => plastic(C.hair), []);
  const box = (w: number, h: number, d: number) => new RoundedBoxGeometry(w, h, d, 2, 0.08);
  const g = useMemo(() => ({ leg: box(0.85, 1.8, 0.9), torso: box(2.1, 1.9, 1.1), arm: box(0.55, 1.6, 0.6), head: box(1.35, 1.3, 1.2), hair: box(1.45, 0.4, 1.3), hand: box(0.5, 0.45, 0.5) }), []);
  return (
    <group position={[position[0], position[1] + jump, position[2]]} rotation={[0, turn, sway]}>
      <mesh geometry={g.leg} material={jeans} position={[-0.47, 0.9, 0]} castShadow />
      <mesh geometry={g.leg} material={jeans} position={[0.47, 0.9, 0]} castShadow />
      <mesh geometry={g.torso} material={hood} position={[0, 2.75, 0]} castShadow />
      {([-1, 1] as const).map((side) => (
        <group key={side} position={[side * 1.38, 3.55, 0]} rotation={[arms * -2.9, 0, side * (0.1 * (1 - arms) - 0.1 * arms)]}>
          <mesh geometry={g.arm} material={hood} position={[0, -0.75, 0]} castShadow />
          <mesh geometry={g.hand} material={skin} position={[0, -1.7, 0]} castShadow />
        </group>
      ))}
      <group position={[0, 3.75, 0]} rotation={[-look, 0, 0]}>
        <mesh geometry={g.head} material={skin} position={[0, 0.68, 0]} castShadow />
        <mesh geometry={g.hair} material={hair} position={[0, 1.38, -0.05]} castShadow />
        {[-0.3, 0.3].map((x) => (
          <mesh key={x} position={[x, 0.78, 0.61]}><boxGeometry args={[0.14, 0.2 + 0.1 * arms, 0.04]} /><meshBasicMaterial color="#1a1412" /></mesh>
        ))}
        <mesh position={[0, 0.42, 0.61]}><boxGeometry args={[0.42, 0.07 + 0.12 * arms, 0.04]} /><meshBasicMaterial color="#1a1412" /></mesh>
      </group>
    </group>
  );
};

/* ---------------- the wobbly pile of tabs ---------------- */

const TAB_W = 4.5;
const PILE = { x: -0.6, z: 3.0 };
const TAB_DX = [0, 0.55, -0.45, 0.8, -0.3, 0.6];
const TAB_YAW = [0, 0.1, -0.08, 0.16, -0.12, 0.08];
const TAB_COLORS = [C.white, C.yellow, C.orange, C.blue, C.white, C.yellow];
// where each lands once the pile breaks: tumbling off to the right, away from the student
const TAB_LAND = [
  { x: 3.6, z: 3.6, yaw: 0.35 }, { x: 6.0, z: 2.0, yaw: -0.55 }, { x: 8.2, z: 4.6, yaw: 0.9 }, { x: 10.4, z: 2.8, yaw: -0.25 },
  { x: 12.0, z: 4.0, yaw: 0.5 }, { x: 13.4, z: 2.4, yaw: -0.4 },
];

type Pose = { pos: THREE.Vector3; q: THREE.Quaternion };

/** Where tab brick i sits at frame f: dropped on, rocking on its right edge, leaning, then flying apart and bouncing. */
const tabPose = (i: number, f: number, p: BrickWorldProps): Pose | null => {
  const { tabDrops, settled, tip, brk } = brickPlan(p);
  const dx = TAB_DX[i % TAB_DX.length];
  const yaw = TAB_YAW[i % TAB_YAW.length];
  const y = dropY(f, tabDrops[i], i * BH, 5);
  if (y === null) return null;
  const rigid = (g: number) => {
    // the sway grows as the pile gets taller, rocking onto the bottom brick's right edge and back
    const grow = ramp(g, settled, tip);
    const rock = -0.16 * grow * (0.5 - 0.5 * Math.cos((2 * Math.PI * (g - settled)) / 20));
    const lean = interpolate(g, [tip, tip + 10], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
    const th = rock * (1 - lean) + -0.62 * lean;
    const pivot = new THREE.Vector3(PILE.x + TAB_W / 2, 0, PILE.z);
    const b = new THREE.Vector3(PILE.x + dx, g < tabDrops[i] + FALL ? (dropY(g, tabDrops[i], i * BH, 5) ?? 0) : i * BH, PILE.z);
    const rz = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), th);
    const pos = b.sub(pivot).applyQuaternion(rz).add(pivot);
    const q = rz.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw));
    return { pos, q };
  };
  if (f < brk) {
    const r = rigid(f);
    if (f < tabDrops[i] + FALL) r.pos.y = y;
    return r;
  }
  const from = rigid(brk);
  const land = TAB_LAND[i % TAB_LAND.length];
  const dur = 10 + 3 * i;
  const t = f - brk;
  const u = Math.min(1, t / dur);
  const ue = Easing.in(Easing.quad)(u);
  const to = new THREE.Vector3(land.x, 0, land.z);
  const pos = from.pos.clone().lerp(to, ue);
  pos.y += (0.5 + 0.55 * i) * Math.sin(Math.PI * u) * (1 - u * 0.3);
  if (u >= 1) pos.y = 0.3 * Math.exp(-(t - dur) / 4) * Math.abs(Math.sin(((t - dur) * Math.PI) / 5));
  const qEnd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), land.yaw);
  const q = from.q.clone().slerp(qEnd, Easing.out(Easing.quad)(u));
  return { pos, q };
};

/* ---------------- the scene ---------------- */

const FRAME_W = 10;
const SCREEN_W = 9.2; // square: one real term card at a time
const LEG_H = 4 * BH;
const SCREEN_Z = -1;

/** The real plan on the brick screen: one tall picture, scrolled a panel at a time. Suspends until the picture is in. */
const ScreenPicture: React.FC<{ p: BrickWorldProps; on: number; panel: number; y: number }> = ({ p, on, panel, y }) => {
  const base = useLoader(THREE.TextureLoader, staticFile(p.plan.src));
  const tex = useMemo(() => {
    const t = base.clone();
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.repeat.set(1, 1 / p.plan.panels);
    t.needsUpdate = true;
    return t;
  }, [base, p.plan.panels]);
  // panel 0 is the top of the picture; texture v runs bottom up
  tex.offset.set(0, 1 - (panel + 1) / p.plan.panels);
  return (
    <mesh position={[0, y, SCREEN_Z + 0.52]}>
      <planeGeometry args={[SCREEN_W, SCREEN_W]} />
      <meshBasicMaterial map={tex} transparent opacity={on} toneMapped={false} />
    </mesh>
  );
};

const Scene: React.FC<{ p: BrickWorldProps; ready: boolean }> = ({ p, ready }) => {
  const f = useCurrentFrame();
  const { camera } = useThree();
  const { askOut, tip, brk, screenOn, drops, lastLand, reqAt, end } = brickPlan(p);

  // the camera: a slow orbit; it starts on the pile and rises to the screen once it lights
  const t = interpolate(f, [0, end], [0, 1], clamp);
  const act = ramp(f, screenOn - 24, screenOn + 16, CURVE.quiet.standard);
  const az = interpolate(t, [0, 1], [0.12, 0.03]);
  const dist = interpolate(act, [0, 1], [34, 27.5]) - 0.6 * t;
  const aimY = interpolate(act, [0, 1], [7.4, 9.0]);
  camera.position.set(Math.sin(az) * dist, aimY + interpolate(act, [0, 1], [4.6, 2.2]), Math.cos(az) * dist);
  camera.lookAt(new THREE.Vector3(0, aimY, 0));
  camera.updateProjectionMatrix();

  // the student's line on a red banner in the sky: drops in, holds, lifts away
  const bannerIn = dropY(f, 0, 0, 3) ?? 3;
  const bannerOut = interpolate(f, [askOut - 12, askOut + 6], [0, 14], { ...clamp, easing: Easing.in(Easing.cubic) });
  const bannerTex = usePrint(
    [
      { text: p.who, size: 0.62, weight: 500, y: 0.8 },
      { text: p.ask, size: 0.86, weight: 800, y: 1.68 },
    ],
    BANNER_W - 0.6, 2.3, "#ffffff", ready,
  );
  const tabTex = p.tabs.map((label, i) => {
    const c = TAB_COLORS[i % TAB_COLORS.length];
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return usePrint([{ text: label, size: 0.62, weight: 800, y: 0.6 }], TAB_W - 0.2, 1.1, c === C.blue ? "#ffffff" : NAVY, ready);
  });
  const termTex = p.bricks.map((label, i) => {
    const dark = TERM_COLORS[i % TERM_COLORS.length] === C.blue;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return usePrint([{ text: label, size: 0.5, weight: 800, y: 0.6 }], 4 - 0.2, 1.1, dark ? "#ffffff" : NAVY, ready);
  });

  // the screen: dark, then a flicker, then on
  const sh = SCREEN_W;
  // which panel the screen shows: each term's card as its brick falls, then the requirements
  const steps = [...drops.map((at, i) => ({ at: at - 4, to: i })), { at: reqAt, to: p.bricks.length }];
  let panel = 0;
  for (const st of steps.slice(1)) panel += ramp(f, st.at, st.at + 10, CURVE.quiet.standard) * 1;
  const frameH = sh + 0.8;
  const flick = [0, 0.7, 0.15, 0.9, 0.35, 1];
  const on = f < screenOn ? 0 : f >= screenOn + 10 ? 1 : flick[Math.min(flick.length - 1, Math.floor((f - screenOn) / 2))];

  // the student: shock as the pile goes, joy once the plan clicks in
  const shock = ramp(f, tip + 2, tip + 8, CURVE.showy.enter) * (1 - ramp(f, brk + 26, brk + 40));
  const joy = ramp(f, lastLand, lastLand + 8, CURVE.showy.enter);
  const jt = f - lastLand - 2;
  const jump = jt > 0 && jt < 16 ? Math.sin((jt / 16) * Math.PI) * 1.3 : 0;
  const look = 0.08 + 0.12 * ramp(f, screenOn - 6, screenOn + 10);
  const drift = (f / FPS) * 0.18;

  return (
    <>
      <hemisphereLight args={["#e3f3ff", "#5d8a4a", 0.9]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[10, 22, 14]} intensity={2.1} color="#fff6e8" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-26} shadow-camera-right={26}
        shadow-camera-top={26} shadow-camera-bottom={-26} shadow-camera-far={80} shadow-bias={-0.0004} shadow-radius={4} />

      {/* the baseplate and the stepped hills behind */}
      <Brick w={44} d={34} h={0.4} color={C.green} position={[0, -0.4, -6]} />
      <Brick w={14} d={10} color={C.greenDark} position={[-9, 0, -16]} />
      <Brick w={11} d={8} color={C.green} position={[-9.5, BH, -16.5]} />
      <Brick w={8} d={6} color={C.greenDark} position={[-10, BH * 2, -17]} />
      <Brick w={6} d={4} color={C.green} position={[-10, BH * 3, -17.5]} />
      <Brick w={14} d={10} color={C.green} position={[8.5, 0, -18]} />
      <Brick w={10} d={8} color={C.greenDark} position={[9, BH, -18.5]} />
      <Brick w={7} d={5} color={C.green} position={[9.5, BH * 2, -19]} />
      <Brick w={26} d={6} color={C.greenDark} position={[0, 0, -27]} />
      <Brick w={18} d={4} color={C.green} position={[-1, BH, -27.5]} />
      <House position={[-10, BH * 4, -17.5]} wall={C.yellow} d={3} />
      <House position={[9.5, BH * 3, -19]} wall={C.white} w={5} />
      <House position={[-1, BH * 2, -27.5]} wall={C.blue} w={3} d={3} />
      <Tree position={[-6.8, 0, -7]} />
      <Tree position={[7.2, 0, -8]} />
      <Tree position={[14, BH, -17]} />

      {/* clouds drift slowly to the right */}
      <Cloud position={[-11 + drift, 13.5, -34]} />
      <Cloud position={[10 + drift * 0.7, 15, -40]} />
      <Cloud position={[1 + drift * 0.5, 19, -50]} />

      {/* the brick screen on two legs: dark until it lights with the real capture */}
      <Brick w={1} d={1} h={LEG_H} color={C.dark} position={[-FRAME_W / 2 + 0.5, 0, SCREEN_Z]} studs={false} />
      <Brick w={1} d={1} h={LEG_H} color={C.dark} position={[FRAME_W / 2 - 0.5, 0, SCREEN_Z]} studs={false} />
      <Brick w={FRAME_W} d={1} h={frameH} color={C.dark} position={[0, LEG_H, SCREEN_Z]} />
      <mesh position={[0, LEG_H + frameH / 2, SCREEN_Z + 0.51]}>
        <planeGeometry args={[SCREEN_W, sh]} />
        <meshBasicMaterial color="#0d0e12" toneMapped={false} />
      </mesh>
      <ScreenPicture p={p} on={on} panel={panel} y={LEG_H + frameH / 2} />

      {/* the plan, a brick per term, clicking in under the screen between its legs */}
      {p.bricks.map((_, i) => {
        const y = dropY(f, drops[i], Math.floor(i / 2) * BH, 3);
        if (y === null) return null;
        return (
          <Brick key={i} w={4} d={1} color={TERM_COLORS[i % TERM_COLORS.length]} position={[i % 2 === 0 ? -2 : 2, y, SCREEN_Z]}>
            <Print tex={termTex[i]} w={4 - 0.2} h={1.1} y={BH / 2} z={0.51} />
          </Brick>
        );
      })}

      {/* the wobbly pile of tabs */}
      {p.tabs.map((_, i) => {
        const pose = tabPose(i, f, p);
        if (!pose) return null;
        return (
          <group key={i} position={pose.pos} quaternion={pose.q}>
            <Brick w={TAB_W} d={2} color={TAB_COLORS[i % TAB_COLORS.length]}>
              <Print tex={tabTex[i]} w={TAB_W - 0.2} h={1.1} y={BH / 2} z={1.0} />
            </Brick>
          </group>
        );
      })}

      {/* the banner, two bricks tall, hung in the sky */}
      {f < askOut + 8 ? (
        <group rotation={[0, az, 0]} position={[0, 11.9 + bannerIn + bannerOut, 0.5]}>
          <Brick w={BANNER_W} d={1} h={2.4} color={C.red}>
            <Print tex={bannerTex} w={BANNER_W - 0.6} h={2.3} y={1.2} z={0.51} />
          </Brick>
        </group>
      ) : null}

      <Student f={f} arms={Math.max(shock, joy)} jump={jump} look={look} turn={0.45} position={[-5.4, 0, 3.4]} />
    </>
  );
};

const BANNER_W = 10;

/** Wait for the face before printing labels on a canvas. */
const useFontReady = () => {
  const [ready, setReady] = useState(false);
  const [h] = useState(() => delayRender("Rubik for /brick-world labels"));
  useEffect(() => {
    waitUntilDone()
      .then(() => document.fonts.load(`800 40px ${RUBIK}`))
      .then(() => document.fonts.load(`500 40px ${RUBIK}`))
      .then(() => {
        setReady(true);
        continueRender(h);
      });
  }, [h]);
  return ready;
};

// The capture texture suspends the scene; draw the first frame a render tab asks for once more after mount (as CardDrop).
const Kick: React.FC = () => {
  const { advance } = useThree();
  useEffect(() => {
    const h = delayRender("brick-world first frame");
    const t = setTimeout(() => {
      advance(performance.now());
      continueRender(h);
    }, 120);
    return () => clearTimeout(t);
  }, [advance]);
  return null;
};

export const BrickWorld: React.FC<BrickWorldProps> = (p) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const ready = useFontReady();
  const { askOut, tabDrops, tip, brk, screenOn, answerAt, drops, lastLand, reqAt, end } = brickPlan(p);
  const s = width / 1080;
  const tabsK = ramp(f, askOut, askOut + 12, CURVE.showy.enter) * (1 - ramp(f, answerAt - 10, answerAt, CURVE.quiet.exit));
  const ansK = ramp(f, answerAt, answerAt + 14, CURVE.showy.enter) * (1 - ramp(f, reqAt - 6, reqAt + 4, CURVE.quiet.exit));
  const endK = ramp(f, reqAt + 6, reqAt + 20, CURVE.showy.enter) * (1 - ramp(f, end - 6, end));
  const srcK = ramp(f, lastLand, lastLand + 14) * (1 - ramp(f, end - 6, end));
  const pop = (k: number) => `translateY(${((1 - k) * 22).toFixed(1)}px) scale(${(0.94 + 0.06 * k).toFixed(3)})`;
  const type: React.CSSProperties = { position: "absolute", left: 64, right: 64, textAlign: "center", fontFamily: RUBIK, color: NAVY, zIndex: 20 };
  const top = Math.round(height * 0.115);

  return (
    <World endAt={end} cta={p.cta} font={RUBIK} fontWeight={800} ink="#ffffff" logo="white" logoSpot="top-right" end="drop" endGround={END_GROUND} ground={SKY}>
      <AbsoluteFill>
        <ThreeCanvas width={width} height={height} shadows flat camera={{ fov: 40, position: [4, 10, 33], near: 0.1, far: 300 }} gl={{ antialias: true, alpha: true }}>
          <Scene p={p} ready={ready} />
          <Kick />
        </ThreeCanvas>
      </AbsoluteFill>

      <div style={{ ...type, top, opacity: tabsK, transform: pop(tabsK) }}>
        <div style={{ fontWeight: 800, fontSize: 84 * s, lineHeight: 1.0, letterSpacing: "-0.01em" }}>{p.tabsLine}</div>
      </div>
      <div style={{ ...type, top, opacity: ansK, transform: pop(ansK) }}>
        {p.answerBy ? <div style={{ fontWeight: 500, fontSize: 40 * s, opacity: 0.8 }}>{p.answerBy}</div> : null}
        <div style={{ fontWeight: 800, fontSize: 84 * s, lineHeight: 1.0, letterSpacing: "-0.01em" }}>{p.answer}</div>
      </div>
      <div style={{ ...type, top, opacity: endK, transform: pop(endK) }}>
        <div style={{ fontWeight: 800, fontSize: 70 * s, lineHeight: 1.0, letterSpacing: "-0.01em" }}>{p.endLine}</div>
      </div>
      <div style={{ ...type, top: Math.round(height * 0.94), color: "#ffffff", fontWeight: 500, fontSize: 30 * s, opacity: 0.92 * srcK,
        textShadow: "0 2px 10px rgba(10,40,20,.55)" }}>{p.source}</div>

      <Cue at={2} name="hit-weak" volume={0.35} />
      {tabDrops.map((at, i) => <Cue key={`t${i}`} at={at + FALL - 1} name="switch-tap" volume={0.35} />)}
      <Cue at={tip} name="paper-slide" volume={0.3} />
      <Cue at={brk + 10} name="hit-weak" volume={0.45} />
      <Cue at={brk + 16} name="paper-move-quick" volume={0.35} />
      <Cue at={screenOn} name="data-scan" volume={0.25} />
      {drops.map((at, i) => <Cue key={`d${i}`} at={at + FALL - 1} name="switch-tap" volume={0.4} />)}
      <Cue at={lastLand + 4} name="chime-crystal" volume={0.25} />

      {/* the UMD M in the first second, big on the dark brick screen, then a small tag top left, clear of the wordmark
          top right and the banner */}
      <UmdOpen bigCy={Math.round(height * 0.39)} tagCx={110} tagCy={112} />
    </World>
  );
};
