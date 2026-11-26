/**
 * /clay-explainer (2026-11-17, from the Nov 17 Muse sends: Matt Penny's ten Claude animation styles, and Karam Mahaan's
 * six skills where this look is his "what happens if" 3D cartoon explainer. Both prompts are gated and were never seen,
 * so this is our own build of the look, read frame by frame. The look's maker is never named on screen.)
 *
 * The reference: a soft clay-like 3D cartoon character (round head, big eyes, a cap, a t-shirt) against a pale sky; the
 * camera pushes in and the body turns to clear glass so what is inside shows; an object drops in ringed in pink, red
 * ripple rings pulse outward through the body; short bold white captions in the lower third, two or three words each.
 * Matt's version puts it in a pastel suburb: rounded houses, round green trees.
 *
 * Ours (round 2, Jacob Nov 17: show the product, or be a little funny; best both): the UMD M opens it. A clay Maryland
 * student on a pastel campus holds their phone, its screen a REAL capture of CampusAI. They say their line, deadpan. A
 * question asks what happens when CampusAI looks at it. The camera pushes into the phone, its shell turns to glass and the
 * real screen floats inside it, and clay pieces drop onto the real things on that screen one by one: each ringed in pink,
 * red ripple rings pulse out through the phone and the student, a pink outline stays on the real block, a two or three
 * word caption under each. The hero is a clay block dropped onto a real button's result: as it lands the screen swaps to
 * the real capture taken after the press, and the block sinks into it. Then the camera pulls back and the student hops.
 * The screen is never drawn: both pictures are captures, and the boxes are measured from them.
 *
 * Everything is primitives drawn in code (spheres, capsules, rounded boxes, MeshPhysicalMaterial with transmission for
 * the glass), soft light from a room environment plus one shadowed key, gentle camera moves. Render with --gl=angle.
 *
 * Motion in numbers (30 fps): each student line holds the reading rule (letters / 15 + 1.5 s). The push starts 30 frames
 * before the last line ends and runs 75 frames on (0.45, 0, 0.2, 1); the glass clears over 22 frames inside it. Each step
 * holds its caption's reading time (at least 62 frames); a piece falls 2.6 units in 12 frames (ease-in, like gravity),
 * lands with a squash spring (damping 9, stiffness 220), and throws ripple rings that grow 0.1 to 2.6 units over 34
 * frames, 6 frames apart. The pull back runs 40 frames and the end card comes 14 frames after the last caption leaves.
 */
import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, Easing, cancelRender, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { loadFont } from "@remotion/google-fonts/Baloo2";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { CURVE, readFrames } from "../system/motion";
import { Cue, clamp, ramp } from "./common";
import type { Format } from "./common";
import { World } from "./world";
import { UmdOpen } from "./UmdOpen";

const { fontFamily: BALOO } = loadFont("normal", { weights: ["600", "800"], subsets: ["latin"] });

// its own world: a pale clay sky over a pastel campus lawn
const GROUND = "linear-gradient(180deg, #BFE1F5 0%, #D9EEF8 38%, #F6E7E1 68%, #F7D9CF 100%)";
const INK = "#2B1A1E";
const END_GROUND = "#F6D3C8";
const SKIN = "#F2C2A0";
const RED = "#D9202E";
const TEE = "#E2483F";
const DENIM = "#3E4D7E";
const PINK = "#FF7DB8";
const RIPPLE = "#E3263A";
const EASE = Easing.bezier(0.45, 0, 0.2, 1);

/** A box on the screen capture, in the capture's own 1x pixels. */
export type ClayBox = { x: number; y: number; w: number; h: number };

export type ClayStep = {
  /** Two or three words, under the piece as it lands. */
  caption: string;
  /** "pin": a clay pin drops onto each box and a pink outline stays on it. "drop": the hero, a clay block drops onto the
   * box and, as it lands, the screen swaps to the after capture and the block sinks into it (use once, on the box the
   * press changed). */
  kind: "pin" | "drop";
  /** What it points at on the real screen. */
  boxes: ClayBox[];
  /** The pin's clay colour (default coral). */
  color?: string;
};

export type ClayExplainerProps = {
  format?: Format;
  /** Who the student is, a small tag over them while they speak. */
  who: string;
  /** The student's own words, one caption each (1 or 2). */
  lines: string[];
  /** The "what happens when" question, held at the top once the camera goes in. */
  question: string;
  /** The phone's screen: two real captures of the same crop, before and after the press, under public/, and the crop's
   * size in 1x pixels (its aspect should be about 0.55, the phone screen's). */
  screen: { before: string; after: string; w: number; h: number };
  /** 3 to 6 steps, in order; at most one "drop". */
  steps: ClayStep[];
  source: string;
  cta?: string;
};

export const clayPlan = (p: ClayExplainerProps) => {
  const lineAt: number[] = [];
  let t = 4;
  for (const l of p.lines) {
    lineAt.push(t);
    t += readFrames(l);
  }
  const linesEnd = t;
  const qAt = linesEnd - 8;
  const push: [number, number] = [linesEnd - 30, linesEnd + 45];
  const glass: [number, number] = [linesEnd + 8, linesEnd + 30];
  const stepAt: number[] = [];
  let s = linesEnd + 42;
  for (const st of p.steps) {
    stepAt.push(s);
    s += Math.max(62, readFrames(st.caption));
  }
  const stepsEnd = s;
  const pull: [number, number] = [stepsEnd - 34, stepsEnd + 6];
  const end = stepsEnd + 14;
  return { lineAt, linesEnd, qAt, push, glass, stepAt, stepsEnd, pull, end };
};
export const clayEnd = (p: ClayExplainerProps) => clayPlan(p).end;

/* ---------------------------------------------------------------- shared geometry, made once */
const SPHERE = new THREE.SphereGeometry(1, 48, 32);
const HALF = new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
const PHONE_W = 1.2;
const PHONE_H = 0.26;
const PHONE_L = 2.1;
const SHELL = new RoundedBoxGeometry(PHONE_W, PHONE_H, PHONE_L, 6, 0.12);
const SCREEN_W = PHONE_W - 0.12;
const SCREEN_L = PHONE_L - 0.14;
const RIPPLE_RING = new THREE.RingGeometry(0.92, 1, 96);
const PINK_RING = new THREE.TorusGeometry(1, 0.08, 12, 64);
const PIN_HEAD = new THREE.SphereGeometry(1, 32, 24);
const PIN_TIP = new THREE.ConeGeometry(1, 2.4, 24);

// the phone, held in both hands in front of the chest, its face tipped toward the camera
const PHONE_POS = new THREE.Vector3(0, 1.72, 1.32);
const PHONE_TILT = 0.56;
const PHONE_Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(PHONE_TILT, 0, 0));
const UP_LOCAL = new THREE.Vector3(0, 1, 0).applyQuaternion(PHONE_Q.clone().invert());
// the screen sits on the face, then sinks to the middle of the glass as it clears
const screenY = (glassK: number) => interpolate(glassK, [0, 1], [PHONE_H / 2 + 0.004, -0.01]);

/** A box on the capture, as a centre and size on the phone's screen plane. */
const onScreen = (b: ClayBox, sc: ClayExplainerProps["screen"], y: number) => ({
  c: new THREE.Vector3(((b.x + b.w / 2) / sc.w - 0.5) * SCREEN_W, y, ((b.y + b.h / 2) / sc.h - 0.5) * SCREEN_L),
  w: (b.w / sc.w) * SCREEN_W,
  l: (b.h / sc.h) * SCREEN_L,
});

/** A thin rounded-rectangle outline, flat, for a box on the screen. */
const outlineGeo = (w: number, l: number, t: number) => {
  const r = Math.min(w, l) * 0.18;
  const sh = new THREE.Shape();
  sh.moveTo(-w / 2 - t, -l / 2 - t);
  sh.absarc(0, 0, 0, 0, 0, false);
  const rr = (x: number, y: number, ww: number, hh: number, rad: number, path: THREE.Path) => {
    path.moveTo(x + rad, y);
    path.lineTo(x + ww - rad, y);
    path.quadraticCurveTo(x + ww, y, x + ww, y + rad);
    path.lineTo(x + ww, y + hh - rad);
    path.quadraticCurveTo(x + ww, y + hh, x + ww - rad, y + hh);
    path.lineTo(x + rad, y + hh);
    path.quadraticCurveTo(x, y + hh, x, y + hh - rad);
    path.lineTo(x, y + rad);
    path.quadraticCurveTo(x, y, x + rad, y);
  };
  const outer = new THREE.Shape();
  rr(-w / 2 - t, -l / 2 - t, w + 2 * t, l + 2 * t, r + t, outer);
  const hole = new THREE.Path();
  rr(-w / 2, -l / 2, w, l, r, hole);
  outer.holes.push(hole);
  return new THREE.ShapeGeometry(outer, 6);
};

const Clay: React.FC<{ color: string; rough?: number; emissive?: string; ei?: number }> = ({ color, rough = 0.78, emissive, ei = 0 }) => (
  <meshStandardMaterial color={color} roughness={rough} metalness={0} emissive={emissive ?? "#000000"} emissiveIntensity={ei} />
);

const Ball: React.FC<{ p: [number, number, number]; s: [number, number, number] | number; color: string; rough?: number; shadow?: boolean }> = ({ p, s, color, rough, shadow = true }) => (
  <mesh geometry={SPHERE} position={p} scale={s} castShadow={shadow} receiveShadow>
    <Clay color={color} rough={rough} />
  </mesh>
);

/** A capsule laid between two points. */
const Limb: React.FC<{ a: THREE.Vector3; b: THREE.Vector3; r: number; color: string }> = ({ a, b, r, color }) => {
  const d = b.clone().sub(a);
  const len = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  const mid = a.clone().add(b).multiplyScalar(0.5);
  return (
    <mesh position={mid} quaternion={q} castShadow receiveShadow>
      <capsuleGeometry args={[r, len, 10, 20]} />
      <Clay color={color} />
    </mesh>
  );
};

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/* ---------------------------------------------------------------- the campus around them */
const House: React.FC<{ p: [number, number, number]; w: number; h: number; d: number; color: string; roof: string; ry?: number }> = ({ p, w, h, d, color, roof, ry = 0 }) => {
  const body = useMemo(() => new RoundedBoxGeometry(w, h, d, 4, 0.22), [w, h, d]);
  const top = useMemo(() => new RoundedBoxGeometry(w * 0.74, w * 0.74, d * 1.06, 4, 0.25), [w, d]);
  const win = useMemo(() => new RoundedBoxGeometry(0.42, 0.56, 0.1, 3, 0.08), []);
  const cols = Math.max(1, Math.floor(w / 1.05));
  const rows = Math.max(1, Math.floor((h - 0.5) / 1.05));
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <mesh geometry={body} position={[0, h / 2, 0]} castShadow receiveShadow><Clay color={color} /></mesh>
      {/* a soft pitched roof: two rounded slabs leaning in */}
      <group position={[0, h - 0.1, 0]} scale={[1, 0.55, 1]}>
        <mesh geometry={top} rotation={[0, 0, Math.PI / 4]} castShadow><Clay color={roof} /></mesh>
      </group>
      {Array.from({ length: cols * rows }, (_, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        return (
          <mesh key={i} geometry={win} position={[-((cols - 1) * 0.95) / 2 + c * 0.95, 0.9 + r * 1.0, d / 2 + 0.02]}>
            <Clay color="#FFF6EC" rough={0.5} emissive="#FFF1DC" ei={0.15} />
          </mesh>
        );
      })}
    </group>
  );
};

const Tree: React.FC<{ p: [number, number, number]; s?: number; tone?: string }> = ({ p, s = 1, tone = "#86C77A" }) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.55, 0]} castShadow>
      <capsuleGeometry args={[0.14, 0.9, 6, 12]} />
      <Clay color="#B88A62" />
    </mesh>
    <Ball p={[0, 1.75, 0]} s={0.82} color={tone} rough={0.9} />
    <Ball p={[0.42, 1.45, 0.2]} s={0.5} color={tone} rough={0.9} />
    <Ball p={[-0.4, 1.5, 0.1]} s={0.52} color={tone} rough={0.9} />
  </group>
);

const Cloud: React.FC<{ p: [number, number, number]; s?: number }> = ({ p, s = 1 }) => (
  <group position={p} scale={s}>
    {([[0, 0, 0, 1], [1.05, -0.2, 0, 0.75], [-1.0, -0.25, 0, 0.7], [0.5, 0.4, -0.2, 0.7]] as const).map(([x, y, z, r], i) => (
      <mesh key={i} geometry={SPHERE} position={[x, y, z]} scale={r}>
        <meshStandardMaterial color="#FFFFFF" roughness={1} emissive="#FFFFFF" emissiveIntensity={0.35} />
      </mesh>
    ))}
  </group>
);

const Campus: React.FC = () => {
  const path = useMemo(() => new RoundedBoxGeometry(3.0, 0.04, 40, 2, 0.02), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[60, 64]} />
        <Clay color="#B5DC98" rough={0.95} />
      </mesh>
      <mesh geometry={path} position={[0, 0.02, -8]} receiveShadow><Clay color="#E8B5A2" rough={0.95} /></mesh>
      <House p={[-6.2, 0, -9]} w={4.2} h={3.6} d={3} color="#F2AE9F" roof="#C9584A" ry={0.25} />
      <House p={[6.4, 0, -10]} w={4.6} h={4.2} d={3} color="#F7D3A3" roof="#C9584A" ry={-0.3} />
      <House p={[-1.2, 0, -19]} w={6.4} h={5.2} d={3} color="#F3B8C4" roof="#B9464E" />
      <House p={[10.5, 0, -18]} w={4} h={3.4} d={3} color="#F2AE9F" roof="#B9464E" ry={-0.4} />
      <House p={[-11, 0, -17]} w={4.4} h={3.8} d={3} color="#F7D3A3" roof="#C9584A" ry={0.4} />
      <Tree p={[-3.2, 0, -4.2]} s={1.15} />
      <Tree p={[3.4, 0, -5.4]} s={1.3} tone="#93CF84" />
      <Tree p={[-8.6, 0, -4]} s={1.1} tone="#93CF84" />
      <Tree p={[8.4, 0, -4.6]} s={1.0} />
      <Tree p={[2.2, 0, -14]} s={1.4} />
      <Tree p={[-5.0, 0, -13.5]} s={1.2} tone="#93CF84" />
      <Cloud p={[-5, 11, -24]} s={1.6} />
      <Cloud p={[6, 13.5, -28]} s={1.9} />
      <Cloud p={[1, 9.5, -30]} s={1.2} />
    </group>
  );
};

/* ---------------------------------------------------------------- the student */
const Student: React.FC<{ f: number; plan: ReturnType<typeof clayPlan>; screen: THREE.Texture | null; glassK: number; children: React.ReactNode }> = ({ f, plan, screen, glassK, children }) => {
  const { fps } = useVideoConfig();
  const breathe = Math.sin(f * 0.12) * 0.015;
  // looks down at the phone, up at us on the second line (a little puzzled), back down as the camera goes in
  const second = plan.lineAt[1] ?? plan.lineAt[0];
  const up = ramp(f, second - 4, second + 10, CURVE.quiet.enter) * (1 - ramp(f, plan.push[0] + 10, plan.push[0] + 28));
  const hop = f < plan.pull[0] ? 0 : spring({ frame: f - plan.pull[0] - 8, fps, config: { damping: 8, stiffness: 140 } });
  const hopY = Math.max(0, Math.sin(Math.min(1, Math.max(0, (f - plan.pull[0] - 8) / 14)) * Math.PI)) * 0.35;
  const happy = Math.min(1, hop);
  const pitch = interpolate(up, [0, 1], [0.32, -0.02]) * (1 - happy) - 0.05 * happy;
  const roll = up * 0.14 + Math.sin(f * 0.05) * 0.02;
  const blink = [52, 141, 260, 420].some((b) => f >= b && f < b + 4) ? 0.12 : 1;
  const eyeY = (happy > 0.5 ? 0.35 : 1) * blink;
  const look = interpolate(up, [0, 1], [-0.07, 0.0]);

  const hands = [v(-0.64, 1.68, 1.28), v(0.64, 1.68, 1.28)];
  const elbows = [v(-0.98, 1.42, 0.5), v(0.98, 1.42, 0.5)];
  const shoulders = [v(-0.66, 2.2, 0), v(0.66, 2.2, 0)];

  return (
    <group position={[0, hopY, 0]}>
      {/* shoes and legs */}
      <Ball p={[-0.3, 0.16, 0.1]} s={[0.28, 0.18, 0.42]} color="#FFFFFF" />
      <Ball p={[0.3, 0.16, 0.1]} s={[0.28, 0.18, 0.42]} color="#FFFFFF" />
      <Limb a={v(-0.3, 0.32, 0)} b={v(-0.3, 1.2, 0)} r={0.21} color={DENIM} />
      <Limb a={v(0.3, 0.32, 0)} b={v(0.3, 1.2, 0)} r={0.21} color={DENIM} />
      {/* torso */}
      <mesh position={[0, 1.78, 0]} scale={[1.06 + breathe, 1 + breathe, 0.86]} castShadow receiveShadow>
        <capsuleGeometry args={[0.62, 0.62, 12, 28]} />
        <Clay color={TEE} />
      </mesh>
      {/* arms: short sleeves, then clay arms to both hands on the phone */}
      {[0, 1].map((i) => (
        <group key={i}>
          <Limb a={shoulders[i]} b={shoulders[i].clone().lerp(elbows[i], 0.45)} r={0.24} color={TEE} />
          <Limb a={shoulders[i].clone().lerp(elbows[i], 0.3)} b={elbows[i]} r={0.15} color={SKIN} />
          <Limb a={elbows[i]} b={hands[i]} r={0.14} color={SKIN} />
          <Ball p={[hands[i].x, hands[i].y, hands[i].z]} s={0.18} color={SKIN} />
        </group>
      ))}
      {/* head */}
      <group position={[0, 3.02, 0.02]} rotation={[pitch, 0, roll]}>
        <Ball p={[0, 0, 0]} s={[0.8, 0.76, 0.76]} color={SKIN} />
        <Ball p={[-0.79, -0.04, 0]} s={0.17} color={SKIN} />
        <Ball p={[0.79, -0.04, 0]} s={0.17} color={SKIN} />
        {/* big eyes */}
        {[-0.28, 0.28].map((x) => (
          <group key={x} position={[x, 0.07, 0.6]} scale={[1, eyeY, 1]}>
            <Ball p={[0, 0, 0]} s={[0.21, 0.24, 0.14]} color="#FFFFFF" rough={0.35} shadow={false} />
            <Ball p={[0, look - 0.02, 0.1]} s={[0.12, 0.13, 0.07]} color="#231518" rough={0.3} shadow={false} />
            <Ball p={[0.04, look + 0.04, 0.16]} s={0.035} color="#FFFFFF" rough={0.2} shadow={false} />
          </group>
        ))}
        {/* brows lift when puzzled */}
        {[-0.28, 0.28].map((x) => (
          <mesh key={x} position={[x, 0.36 + up * 0.05, 0.62]} rotation={[0, 0, Math.PI / 2 + (x < 0 ? -1 : 1) * up * 0.25]}>
            <capsuleGeometry args={[0.03, 0.14, 4, 8]} />
            <Clay color="#5A3527" />
          </mesh>
        ))}
        {/* cheeks and mouth */}
        <Ball p={[-0.46, -0.16, 0.52]} s={[0.12, 0.08, 0.05]} color="#F59A9A" shadow={false} />
        <Ball p={[0.46, -0.16, 0.52]} s={[0.12, 0.08, 0.05]} color="#F59A9A" shadow={false} />
        <mesh position={[0, -0.26, 0.69]} rotation={[-0.2, 0, Math.PI]} scale={[1 + happy * 0.2, 1 + happy * 0.3 - up * 0.4, 1]}>
          <torusGeometry args={[0.12, 0.03, 8, 24, Math.PI]} />
          <Clay color="#6B2A2E" />
        </mesh>
        {/* cap, brim forward, a button on top */}
        <group rotation={[-0.12, 0, 0]}>
          <mesh geometry={HALF} position={[0, 0.12, 0]} scale={[0.84, 0.7, 0.82]} castShadow><Clay color={RED} /></mesh>
          <mesh position={[0, 0.16, 0.66]} rotation={[0.18, 0, 0]} scale={[1, 1, 0.75]} castShadow>
            <cylinderGeometry args={[0.52, 0.56, 0.06, 40]} />
            <Clay color={RED} />
          </mesh>
          <Ball p={[0, 0.82, 0]} s={0.08} color={RED} />
        </group>
      </group>
      {/* the phone, and whatever is inside it */}
      <group position={PHONE_POS} quaternion={PHONE_Q}>
        <Phone screen={screen} glassK={glassK} />
        {children}
      </group>
    </group>
  );
};

const Phone: React.FC<{ screen: THREE.Texture | null; glassK: number }> = ({ screen, glassK }) => (
  <group>
    <mesh geometry={SHELL} castShadow={glassK < 0.5} receiveShadow renderOrder={2}>
      <meshPhysicalMaterial
        color={new THREE.Color("#2D2530").lerp(new THREE.Color("#EAF6FF"), glassK)}
        roughness={interpolate(glassK, [0, 1], [0.55, 0.03])}
        envMapIntensity={1 + glassK * 1.2}
        metalness={0}
        transmission={glassK}
        thickness={0.35}
        ior={1.35}
        clearcoat={glassK}
        clearcoatRoughness={0.1}
        attenuationColor="#DDF1FF"
        attenuationDistance={2.5}
      />
    </mesh>
    {/* the real screen: on the face, then floating inside the glass */}
    {screen ? (
      <mesh position={[0, screenY(glassK), 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[SCREEN_W, SCREEN_L]} />
        <meshBasicMaterial map={screen} toneMapped={false} />
      </mesh>
    ) : null}
  </group>
);

/* ---------------------------------------------------------------- what drops in */
const fall = (f: number, at: number) => {
  const k = Math.min(1, Math.max(0, (f - at) / 12));
  return { h: (1 - k * k) * 2.6, landed: f >= at + 12 };
};
const SURFACE = -0.01;

/** The pink ring that faces the camera and hugs a falling piece, then lets go. */
const PinkRing: React.FC<{ f: number; at: number; pos: THREE.Vector3; size: number }> = ({ f, at, pos, size }) => {
  const { camera } = useThree();
  const k = 1 - ramp(f, at + 26, at + 40);
  if (k <= 0) return null;
  const q = PHONE_Q.clone().invert().multiply(camera.quaternion);
  return (
    <mesh geometry={PINK_RING} position={pos} quaternion={q} scale={size * (1 + Math.sin(f * 0.5) * 0.04)} renderOrder={5}>
      <meshBasicMaterial color={PINK} transparent opacity={k} depthTest={false} toneMapped={false} />
    </mesh>
  );
};

/** A clay pin that drops onto a box on the screen, then a pink outline that stays on the box. */
const Pin: React.FC<{ f: number; at: number; box: ReturnType<typeof onScreen>; color: string }> = ({ f, at, box, color }) => {
  const { fps } = useVideoConfig();
  const geo = useMemo(() => outlineGeo(box.w, box.l, 0.022), [box.w, box.l]);
  if (f < at) return null;
  const { h, landed } = fall(f, at);
  const sq = landed ? spring({ frame: f - at - 12, fps, config: { damping: 9, stiffness: 220 } }) : 1;
  // the pin stands at the box's top-right corner so the real words under it stay readable
  const spot = box.c.clone().add(new THREE.Vector3(box.w / 2 - 0.03, 0, -box.l / 2 + 0.03));
  const pos = spot.clone().add(UP_LOCAL.clone().multiplyScalar(h));
  const s = 0.055;
  const outK = ramp(f, at + 12, at + 20, CURVE.showy.enter);
  return (
    <group>
      <group position={pos} scale={[1 + (1 - sq) * 0.3, landed ? 0.7 + 0.3 * sq : 1.1, 1 + (1 - sq) * 0.3]}>
        <mesh geometry={PIN_TIP} position={[0, s * 1.2, 0]} rotation={[Math.PI, 0, 0]} scale={s * 0.45} castShadow><Clay color="#F3E9E2" /></mesh>
        <mesh geometry={PIN_HEAD} position={[0, s * 2.7, 0]} scale={s} castShadow><Clay color={color} rough={0.6} /></mesh>
      </group>
      {outK > 0 ? (
        <mesh geometry={geo} position={[box.c.x, SURFACE + 0.006, box.c.z]} rotation={[-Math.PI / 2, 0, 0]} scale={[1 + (1 - outK) * 0.25, 1 + (1 - outK) * 0.25, 1]}>
          <meshBasicMaterial color={PINK} toneMapped={false} />
        </mesh>
      ) : null}
      <PinkRing f={f} at={at} pos={pos.clone().add(UP_LOCAL.clone().multiplyScalar(s * 2.6))} size={0.13} />
    </group>
  );
};

/** The hero: a clay block the size of the box drops onto it; the screen swaps under it, and it sinks in. */
const Drop: React.FC<{ f: number; at: number; box: ReturnType<typeof onScreen> }> = ({ f, at, box }) => {
  const { fps } = useVideoConfig();
  const geo = useMemo(() => new RoundedBoxGeometry(box.w, 0.09, box.l, 4, 0.03), [box.w, box.l]);
  if (f < at) return null;
  const { h, landed } = fall(f, at);
  const sq = landed ? spring({ frame: f - at - 12, fps, config: { damping: 9, stiffness: 220 } }) : 1;
  const sink = ramp(f, at + 22, at + 34, CURVE.quiet.standard);
  if (sink >= 1) return null;
  const pos = box.c.clone().setY(SURFACE + 0.045 - sink * 0.05).add(UP_LOCAL.clone().multiplyScalar(h));
  const sy = (landed ? 0.6 + 0.4 * sq : 1.1) * (1 - sink);
  const sxz = landed ? 1.14 - 0.14 * sq : 0.94;
  return (
    <group>
      <mesh geometry={geo} position={pos} scale={[sxz, Math.max(0.01, sy), sxz]} castShadow>
        <Clay color="#E8423C" emissive="#E8423C" ei={0.15} rough={0.65} />
      </mesh>
      <PinkRing f={f} at={at} pos={pos.clone().add(UP_LOCAL.clone().multiplyScalar(0.08))} size={0.36} />
    </group>
  );
};

/** Red rings that grow out from a landing, flat in the phone's plane, seen through the body. */
const Ripples: React.FC<{ f: number; at: number; at3: THREE.Vector3; count?: number; reach?: number }> = ({ f, at, at3, count = 3, reach = 2.6 }) => (
  <>
    {Array.from({ length: count }, (_, i) => {
      const s = at + i * 6;
      const k = (f - s) / 34;
      if (k < 0 || k > 1) return null;
      const e = Easing.out(Easing.cubic)(k);
      return (
        <mesh key={i} geometry={RIPPLE_RING} position={[at3.x, SURFACE + 0.05, at3.z]} rotation={[-Math.PI / 2, 0, 0]} scale={0.1 + e * reach} renderOrder={6}>
          <meshBasicMaterial color={RIPPLE} transparent opacity={(1 - k) * 0.85} depthTest={false} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      );
    })}
  </>
);

/** The frame the hero lands on (the screen swaps then), or Infinity when there is no hero. */
export const claySwapAt = (p: ClayExplainerProps) => {
  const plan = clayPlan(p);
  const i = p.steps.findIndex((s) => s.kind === "drop");
  return i < 0 ? Infinity : plan.stepAt[i] + 6 + 12;
};

const Inside: React.FC<{ f: number; p: ClayExplainerProps; plan: ReturnType<typeof clayPlan> }> = ({ f, p, plan }) => {
  const out: React.ReactNode[] = [];
  p.steps.forEach((st, i) => {
    const at = plan.stepAt[i] + 6;
    st.boxes.forEach((b, j) => {
      const box = onScreen(b, p.screen, SURFACE);
      const a = at + j * 8;
      if (st.kind === "drop") {
        out.push(<Drop key={`d${i}-${j}`} f={f} at={a} box={box} />);
        out.push(<Ripples key={`dr${i}-${j}`} f={f} at={a + 12} at3={box.c} count={5} reach={3.6} />);
      } else {
        out.push(<Pin key={`p${i}-${j}`} f={f} at={a} box={box} color={st.color ?? "#F0564B"} />);
        out.push(<Ripples key={`pr${i}-${j}`} f={f} at={a + 12} at3={box.c} count={2} reach={1.6} />);
      }
    });
  });
  return <>{out}</>;
};

/* ---------------------------------------------------------------- camera, light, environment */
const Env: React.FC = () => {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.6;
    pm.dispose();
  }, [gl, scene]);
  return null;
};

const Scene: React.FC<{ p: ClayExplainerProps; screens: Screens }> = ({ p, screens }) => {
  const f = useCurrentFrame();
  const { camera } = useThree();
  const plan = clayPlan(p);
  // wide, drifting on a slow arc; push into the phone; hold close with a breath of drift; pull back to the student
  const drift = Math.sin(f * 0.02) * 0.25;
  const wide = { pos: v(1.1 - f * 0.012 + drift, 2.9, 10.4 - f * 0.006), tgt: v(0, 2.15, 0) };
  const phoneW = PHONE_POS.clone();
  const close = { pos: phoneW.clone().add(v(0.24 + drift * 0.2, 4.8, 3.5)), tgt: phoneW.clone().add(v(0, -0.1, 0.12)) };
  const back = { pos: v(0.9 + drift, 3.0, 7.6), tgt: v(0, 2.3, 0.3) };
  const kin = interpolate(f, plan.push, [0, 1], { ...clamp, easing: EASE });
  const kout = interpolate(f, plan.pull, [0, 1], { ...clamp, easing: EASE });
  const pos = wide.pos.clone().lerp(close.pos, kin).lerp(back.pos, kout);
  const tgt = wide.tgt.clone().lerp(close.tgt, kin).lerp(back.tgt, kout);
  camera.position.copy(pos);
  camera.up.set(0, 1, 0);
  camera.lookAt(tgt);
  camera.updateProjectionMatrix();
  const glassK = interpolate(f, plan.glass, [0, 1], { ...clamp, easing: CURVE.quiet.standard });
  return (
    <>
      <Env />
      <fog attach="fog" args={["#F4E4DF", 22, 60]} />
      <hemisphereLight args={["#DFF0FF", "#F6D9C6", 0.9]} />
      <directionalLight position={[-5, 11, 8]} intensity={1.7} castShadow shadow-mapSize={[2048, 2048]} shadow-radius={6}
        shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-bias={-0.0005} />
      <Campus />
      <Student f={f} plan={plan} screen={f >= claySwapAt(p) ? screens.after : screens.before} glassK={glassK}>
        <Inside f={f} p={p} plan={plan} />
      </Student>
    </>
  );
};

type Screens = { before: THREE.Texture; after: THREE.Texture };

/** The phone's screen: the two real captures, loaded before the first frame. */
const useScreens = (sc: ClayExplainerProps["screen"]) => {
  const [tex, setTex] = useState<Screens | null>(null);
  const [h] = useState(() => delayRender("clay-explainer screen captures"));
  useEffect(() => {
    const load = (src: string) => new Promise<THREE.Texture>((res, rej) => {
      new THREE.TextureLoader().load(staticFile(src), (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        res(t);
      }, undefined, rej);
    });
    Promise.all([load(sc.before), load(sc.after)])
      .then(([before, after]) => {
        setTex({ before, after });
        continueRender(h);
      })
      .catch(() => cancelRender(new Error(`clay-explainer: could not load ${sc.before} or ${sc.after}`)));
  }, [h, sc.before, sc.after]);
  return tex;
};

/** The first frame a render tab draws can miss the scene; draw it once more after mount (as /card-drop does). */
const Kick: React.FC = () => {
  const { advance } = useThree();
  useEffect(() => {
    const h = delayRender("clay-explainer first frame");
    const t = setTimeout(() => {
      advance(performance.now());
      continueRender(h);
    }, 120);
    return () => clearTimeout(t);
  }, [advance]);
  return null;
};

/* ---------------------------------------------------------------- words */
const OUTLINE = [
  "0 6px 0 rgba(43,26,30,.9)",
  "4px 4px 0 #2B1A1E", "-4px 4px 0 #2B1A1E", "4px -4px 0 #2B1A1E", "-4px -4px 0 #2B1A1E",
  "0 5px 0 #2B1A1E", "0 -5px 0 #2B1A1E", "5px 0 0 #2B1A1E", "-5px 0 0 #2B1A1E",
  "0 14px 30px rgba(43,26,30,.35)",
].join(", ");

/** One short caption in the lower third: pops in with an overshoot, holds, drops away. */
const Caption: React.FC<{ text: string; at: number; out: number; size: number; top: number }> = ({ text, at, out, size, top }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at || f > out) return null;
  // long lines step down so they stay on one line (about 0.5 em a character in this face)
  const fit = Math.min(size, Math.round(1000 / (text.length * 0.5)));
  const pop = spring({ frame: f - at, fps, config: { damping: 10, stiffness: 210 } });
  const leave = ramp(f, out - 6, out, CURVE.quiet.exit);
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top, textAlign: "center", fontFamily: BALOO, fontWeight: 800, fontSize: fit, lineHeight: 1.0,
      color: "#FFFFFF", letterSpacing: "-0.01em", textShadow: OUTLINE, opacity: 1 - leave,
      transform: `scale(${(0.55 + 0.45 * pop) * (1 - leave * 0.15)}) translateY(${leave * 30}px)`, zIndex: 30 }}>{text}</div>
  );
};

export const ClayExplainer: React.FC<ClayExplainerProps> = (p) => {
  const f = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const plan = clayPlan(p);
  const screens = useScreens(p.screen);
  const cap = Math.round(width * 0.105);
  const capTop = Math.round(height * 0.835);
  const tagK = spring({ frame: f - 3, fps, config: { damping: 12, stiffness: 160 } }) * (1 - ramp(f, plan.qAt - 8, plan.qAt));
  const qK = ramp(f, plan.qAt, plan.qAt + 14, CURVE.showy.enter) * (1 - ramp(f, plan.pull[0], plan.pull[0] + 10, CURVE.quiet.exit));
  const srcK = ramp(f, plan.stepAt[plan.stepAt.length - 1] + 20, plan.stepAt[plan.stepAt.length - 1] + 34) * (1 - ramp(f, plan.end - 8, plan.end));
  return (
    <World endAt={plan.end} cta={p.cta} font={BALOO} fontWeight={800} ink={INK} logo="dark" logoSpot="top-right" end="iris" endGround={END_GROUND} ground={GROUND}>
      <AbsoluteFill>
        {screens ? (
          <ThreeCanvas width={width} height={height} shadows flat camera={{ fov: 36, position: [0, 3, 10], near: 0.05, far: 200 }} gl={{ antialias: true, alpha: true }}>
            <Scene p={p} screens={screens} />
            <Kick />
          </ThreeCanvas>
        ) : null}
      </AbsoluteFill>
      {/* who they are, a clay pill tag while they talk */}
      {tagK > 0.01 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: Math.round(height * 0.115), display: "flex", justifyContent: "center", zIndex: 25 }}>
          <div style={{ fontFamily: BALOO, fontWeight: 800, fontSize: Math.round(width * 0.052), color: "#FFFFFF", background: RED, borderRadius: 999,
            padding: "14px 42px 10px", boxShadow: "inset 0 -8px 0 rgba(0,0,0,.14), 0 14px 30px rgba(120,20,30,.25)", transform: `scale(${tagK})`, opacity: Math.min(1, tagK * 1.4) }}>
            {p.who}
          </div>
        </div>
      ) : null}
      {/* the question, held at the top once the camera goes in */}
      <div style={{ position: "absolute", left: 48, right: 48, top: Math.round(height * 0.09), textAlign: "center", fontFamily: BALOO, fontWeight: 800,
        fontSize: Math.round(width * 0.058), lineHeight: 1.04, color: INK, letterSpacing: "-0.015em", opacity: qK, transform: `translateY(${(1 - qK) * 24}px)`, zIndex: 25,
        textShadow: "0 3px 0 rgba(255,255,255,.7)" }}>{p.question}</div>
      {p.lines.map((l, i) => (
        <Caption key={`l${i}`} text={l} at={plan.lineAt[i]} out={(plan.lineAt[i + 1] ?? plan.linesEnd) - 1} size={cap} top={capTop} />
      ))}
      {p.steps.map((s, i) => (
        <Caption key={`s${i}`} text={s.caption} at={plan.stepAt[i] + 8} out={(plan.stepAt[i + 1] ?? plan.stepsEnd) - 1} size={cap} top={capTop} />
      ))}
      <div style={{ position: "absolute", left: 80, right: 80, top: Math.round(height * 0.915), textAlign: "center", fontFamily: BALOO, fontWeight: 600,
        fontSize: Math.round(width * 0.03), color: INK, opacity: 0.75 * srcK, zIndex: 25 }}>{p.source}</div>
      <Cue at={plan.push[0]} name="swoosh-slow" volume={0.3} />
      {p.steps.map((s, i) => (
        <React.Fragment key={i}>
          <Cue at={plan.stepAt[i] + 18} name={s.kind === "drop" ? "bass-hit-short" : "hit-weak"} volume={s.kind === "drop" ? 0.45 : 0.4} />
          {s.kind === "drop" ? <Cue at={plan.stepAt[i] + 26} name="chime-crystal" volume={0.3} /> : null}
        </React.Fragment>
      ))}
      <Cue at={plan.pull[0] + 8} name="switch-tap" volume={0.35} />
      {/* the UMD M in the first second, then a small tag top centre (Jacob, Nov 17), above the who pill */}
      <UmdOpen bigCy={Math.round(height * 0.36)} tagCx={width / 2} tagCy={128} outAt={plan.end - 6} />
    </World>
  );
};
