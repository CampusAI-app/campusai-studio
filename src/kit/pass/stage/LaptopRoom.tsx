/**
 * LaptopRoom: the photoreal laptop (four/real-laptop.tsx, imported, never copied) placed in a mood,
 * with the camera moving slowly around it. Motion pass, wave 0 (2026-10-22).
 *
 * WHERE IT CAME FROM
 *   Raylight's "Light desk" and "Macbook pro around Linear" (Lucius/memory/motion-raylight-templates.md):
 *   a held device under a slow, near-linear dolly of about five seconds, graded (bloom, vignette,
 *   saturation 1.23). The camera does the work; the laptop does nothing.
 *
 * THE ROOM IS LIGHT ONLY
 *   Jacob rejected a drawn laptop as "looks fake", so nothing here is drawn furniture. The place is a
 *   desk plane that exists only where light falls on it, rendered in its own three.js canvas behind
 *   the laptop with the SAME camera, so it never slides against the device:
 *   - a practical lamp (warm 2700K pool, a shade cone, a real soft shadow of the laptop: 12 rays per
 *     pixel at an area light, tested against the base and the lid),
 *   - the screen as an area light (9 samples on the glass, blocked by the base), with its soft
 *     reflection on a slightly glossy surface,
 *   - contact occlusion around the base, and a fade to black so the plane never shows an edge.
 *   The laptop's own studio lighting is then graded per preset through a mask projected from its real
 *   geometry (base slab and lid slab, the glass cut out), so the body darkens with the room while the
 *   screen stays at full light.
 *
 * PRESETS
 *   studio  dark, the product red glow pooled behind and under the laptop, the Raylight look.
 *   lamp    late evening: a warm lamp off to the upper right falls across the laptop and the desk.
 *   night   near dark: the screen is the light, cool spill on the keyboard and the desk in front.
 *   Light colours are light temperatures (lamp 2700K, display white), not palette colours; the one
 *   accent still comes from `brand()`.
 *
 * RENDERING: three.js, so renders need `--gl=angle`.
 */
import React, { useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { AbsoluteFill, Easing, useCurrentFrame, useVideoConfig } from "remotion";
import { RealLaptop, cameraAt, onScreen, DESK_Y, type CamKey, type LidKey, type RealLaptopProps, type Vec3 } from "../../../four/real-laptop";
import { brand as getBrand, type Brand } from "../../brand";

/* ------------------------------------------------------------------ geometry of the real model */

// Measured in four/real-laptop.tsx (its HINGE, LID_DIR, onScreen glass size). Repeated here only as
// numbers so the room can light and mask the device; the model itself is imported, not copied.
const HINGE: Vec3 = [0, -0.063, -12.15];
const LID_TILT = 0.3474;
const OPEN_ANGLE = Math.PI / 2 + LID_TILT;
const BASE = { x: 17.7, y0: DESK_Y + 0.06, y1: 0.5, z0: -12.6, z1: 12.4 };
const GLASS = { half: 34.38 / 2, s0: 1.64, s1: 23.82 };
const LID = { half: 17.7, s0: -0.3, s1: 24.4, back: -0.62 };

export type RoomPreset = "studio" | "lamp" | "night";

type Light = {
  /** Base colour of the frame around the desk (the dark of the room). */
  ground: string;
  /** Desk albedo, linear 0..1. */
  albedo: Vec3;
  ambient: Vec3;
  lamp: null | { pos: Vec3; aim: Vec3; color: Vec3; power: number; size: number; cone: number };
  spill: { color: Vec3; power: number };
  glow: null | { color: Vec3; power: number; at: [number, number]; radius: number };
  gloss: number;
  /** Laptop body grade, multiply colour at the lit side and the far side (0..1 rgb). */
  body: null | { near: Vec3; far: Vec3; litFrom: Vec3 };
  /** Screen light added back on the keyboard deck, rgb 0..1 and strength. */
  deck: null | { color: Vec3; strength: number };
  /** Halo around the glass, strength 0..1. */
  bloom: number;
  /** A soft haze where the lamp would light the air, frame fractions. */
  haze: null | { x: number; y: number; strength: number };
  vignette: number;
};

const K2700: Vec3 = [1.0, 0.66, 0.36];
const DISPLAY: Vec3 = [0.62, 0.74, 1.0];

const hexRgb = (hex: string): Vec3 => {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

const presetLight = (p: RoomPreset, b: Brand): Light => {
  const accent = hexRgb(b.color.accent);
  if (p === "lamp")
    return {
      ground: "#070505",
      albedo: [0.34, 0.3, 0.27],
      ambient: [0.012, 0.01, 0.01],
      lamp: { pos: [46, 52, -16], aim: [-0.55, -1, 0.35], color: K2700, power: 5200, size: 7, cone: 0.55 },
      spill: { color: [1.0, 0.86, 0.8], power: 26 },
      glow: null,
      gloss: 0.35,
      body: { near: [1.0, 0.82, 0.62], far: [0.24, 0.21, 0.21], litFrom: [24, 18, -8] },
      deck: { color: [1.0, 0.72, 0.45], strength: 0.12 },
      bloom: 0.16,
      haze: { x: 0.92, y: 0.06, strength: 0.16 },
      vignette: 0.55,
    };
  if (p === "night")
    return {
      ground: "#020304",
      albedo: [0.3, 0.3, 0.31],
      ambient: [0.004, 0.005, 0.008],
      lamp: null,
      spill: { color: DISPLAY, power: 120 },
      glow: null,
      gloss: 0.7,
      body: { near: [0.16, 0.17, 0.21], far: [0.07, 0.075, 0.09], litFrom: [0, 12, 10] },
      deck: { color: DISPLAY, strength: 0.26 },
      bloom: 0.12,
      haze: null,
      vignette: 0.7,
    };
  return {
    ground: b.color.bgDeep,
    albedo: [0.3, 0.27, 0.27],
    ambient: [0.01, 0.008, 0.008],
    lamp: null,
    spill: { color: [1, 0.9, 0.9], power: 18 },
    glow: { color: accent, power: 0.55, at: [0, -26], radius: 38 },
    gloss: 0.4,
    body: null,
    deck: null,
    bloom: 0.1,
    haze: null,
    vignette: 0.45,
  };
};

/* ------------------------------------------------------------------ projection */

const lidMatrix = (open: number) =>
  new THREE.Matrix4()
    .makeTranslation(...HINGE)
    .multiply(new THREE.Matrix4().makeRotationX((1 - open) * OPEN_ANGLE));

const lidDir = new THREE.Vector3(0, Math.cos(LID_TILT), -Math.sin(LID_TILT));
const lidNormal = new THREE.Vector3(0, Math.sin(LID_TILT), Math.cos(LID_TILT));
/** A point on the lid in lid-local terms: x across, s up the lid, n out of the glass. World space. */
const lidPoint = (open: number, x: number, s: number, n: number) =>
  new THREE.Vector3(x, 0, 0).addScaledVector(lidDir, s).addScaledVector(lidNormal, n).applyMatrix4(lidMatrix(open));

const makeCam = (c: Omit<CamKey, "at">, w: number, h: number) => {
  const cam = new THREE.PerspectiveCamera(c.fov ?? 30, w / h, 1, 3000);
  cam.position.set(...c.pos);
  cam.lookAt(new THREE.Vector3(...c.target));
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();
  return cam;
};

type Pt = { x: number; y: number };
const proj = (v: THREE.Vector3, cam: THREE.PerspectiveCamera, w: number, h: number): Pt => {
  const p = v.clone().project(cam);
  return { x: (p.x * 0.5 + 0.5) * w, y: (-p.y * 0.5 + 0.5) * h };
};

const hull = (pts: Pt[]): Pt[] => {
  const s = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: Pt, a: Pt, b: Pt) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: Pt[] = [];
  for (const p of s) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
    lo.push(p);
  }
  const up: Pt[] = [];
  for (const p of [...s].reverse()) {
    while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop();
    up.push(p);
  }
  return lo.slice(0, -1).concat(up.slice(0, -1));
};
const poly = (pts: Pt[]) => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

/** Where the laptop is on screen this frame: body silhouette (two slabs), glass quad, key points. */
const silhouette = (cam: Omit<CamKey, "at">, open: number, w: number, h: number) => {
  const c = makeCam(cam, w, h);
  const P = (v: THREE.Vector3) => proj(v, c, w, h);
  const base: Pt[] = [];
  for (const x of [-BASE.x, BASE.x]) for (const y of [BASE.y0, BASE.y1]) for (const z of [BASE.z0, BASE.z1]) base.push(P(new THREE.Vector3(x, y, z)));
  const lid: Pt[] = [];
  for (const x of [-LID.half, LID.half]) for (const s of [LID.s0, LID.s1]) for (const n of [LID.back, 0.08]) lid.push(P(lidPoint(open, x, s, n)));
  const glass = [
    P(lidPoint(open, -GLASS.half, GLASS.s1, 0.05)),
    P(lidPoint(open, GLASS.half, GLASS.s1, 0.05)),
    P(lidPoint(open, GLASS.half, GLASS.s0, 0.05)),
    P(lidPoint(open, -GLASS.half, GLASS.s0, 0.05)),
  ];
  return { base: hull(base), lid: hull(lid), glass, project: (v: Vec3) => P(new THREE.Vector3(...v)), cam: c };
};

/* ------------------------------------------------------------------ the desk (light only) */

const VERT = /* glsl */ `
varying vec3 vW;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const FRAG = /* glsl */ `
precision highp float;
varying vec3 vW;
uniform vec3 uCam;
uniform vec3 uAlbedo, uAmbient;
uniform float uLampOn, uLampPower, uLampSize, uLampCone;
uniform vec3 uLampPos, uLampAim, uLampColor;
uniform vec3 uSpillColor; uniform float uSpillPower;
uniform vec3 uScrC, uScrU, uScrV, uScrN;
uniform vec3 uLidO, uLidA, uLidB;
uniform float uGlowOn, uGlowPower, uGlowRadius; uniform vec2 uGlowAt; uniform vec3 uGlowColor;
uniform float uGloss, uFade;

bool hitBox(vec3 o, vec3 d) {
  d += vec3(1e-4);
  vec3 bmin = vec3(-17.4, -0.9, -12.4), bmax = vec3(17.4, 0.45, 12.2);
  vec3 inv = 1.0 / d;
  vec3 t0 = (bmin - o) * inv, t1 = (bmax - o) * inv;
  vec3 tn3 = min(t0, t1), tf3 = max(t0, t1);
  float tn = max(max(tn3.x, tn3.y), tn3.z), tf = min(min(tf3.x, tf3.y), tf3.z);
  return tf > max(tn, 0.0) && tn < 1.0;
}
bool hitLid(vec3 o, vec3 d) {
  vec3 n = cross(uLidA, uLidB);
  float den = dot(n, d);
  if (abs(den) < 1e-5) return false;
  float t = dot(n, uLidO - o) / den;
  if (t <= 0.0 || t >= 1.0) return false;
  vec3 p = o + d * t - uLidO;
  float a = dot(p, uLidA) / dot(uLidA, uLidA), b = dot(p, uLidB) / dot(uLidB, uLidB);
  return a >= 0.0 && a <= 1.0 && b >= 0.0 && b <= 1.0;
}
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  vec3 P = vW;
  vec3 V = normalize(uCam - P);
  vec3 R = vec3(-V.x, V.y, -V.z);
  vec3 light = uAmbient;
  vec3 spec = vec3(0.0);

  if (uLampOn > 0.5) {
    vec3 L = uLampPos - P; float dist = length(L); vec3 l = L / dist;
    float vis = 0.0;
    for (int i = 0; i < 12; i++) {
      float a = float(i) * 2.39996; float r = sqrt((float(i) + 0.5) / 12.0) * uLampSize;
      vec3 S = uLampPos + vec3(cos(a) * r, 0.0, sin(a) * r);
      vec3 d = S - P;
      if (!hitBox(P, d) && !hitLid(P, d)) vis += 1.0;
    }
    vis /= 12.0;
    float cone = smoothstep(uLampCone, uLampCone + 0.3, dot(-l, normalize(uLampAim)));
    float e = uLampPower * max(l.y, 0.0) * cone / (dist * dist + 60.0);
    light += uLampColor * e * vis;
    spec += uLampColor * e * vis * pow(max(dot(R, l), 0.0), 40.0) * 3.0;
  }

  vec3 sp = vec3(0.0); vec3 ss = vec3(0.0);
  for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) {
    vec3 S = uScrC + uScrU * float(i) * 0.7 + uScrV * float(j) * 0.7;
    vec3 d = P - S; float dd = dot(d, d); vec3 dn = d * inversesqrt(dd);
    float emit = max(dot(uScrN, dn), 0.0);
    float ndl = max(-dn.y, 0.0);
    float vis = hitBox(P, S - P) ? 0.0 : 1.0;
    sp += vec3(emit * ndl * vis / (dd + 40.0));
    ss += vec3(emit * vis * pow(max(dot(R, -dn), 0.0), 24.0) / (1.0 + dd * 0.002));
  }
  light += uSpillColor * sp * (uSpillPower / 9.0);
  spec += uSpillColor * ss * (uSpillPower / 9.0) * 0.012;

  if (uGlowOn > 0.5) {
    vec2 g = P.xz - uGlowAt;
    light += uGlowColor * uGlowPower * exp(-dot(g, g) / (uGlowRadius * uGlowRadius));
  }

  vec2 q = abs(P.xz - vec2(0.0, -0.1)) - vec2(17.2, 12.3);
  float bd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
  float ao = mix(0.12, 1.0, smoothstep(-0.5, 6.0, bd));

  vec3 col = uAlbedo * light * ao + spec * uGloss * ao;
  float r = length(P.xz - vec2(0.0, -4.0));
  col *= 1.0 - smoothstep(uFade * 0.35, uFade, r);
  col = pow(max(col, 0.0), vec3(1.0 / 2.2));
  col += (hash(gl_FragCoord.xy) - 0.5) / 255.0 * 1.5;
  gl_FragColor = vec4(col, 1.0);
}`;

const v3 = (v: Vec3 | THREE.Vector3) => (v instanceof THREE.Vector3 ? v.clone() : new THREE.Vector3(...v));

const Desk: React.FC<{ light: Light; cam: Omit<CamKey, "at">; open: number }> = ({ light, cam, open }) => {
  const uniforms = useMemo(
    () => ({
      uCam: { value: new THREE.Vector3() },
      uAlbedo: { value: new THREE.Vector3() },
      uAmbient: { value: new THREE.Vector3() },
      uLampOn: { value: 0 },
      uLampPower: { value: 0 },
      uLampSize: { value: 0 },
      uLampCone: { value: 0 },
      uLampPos: { value: new THREE.Vector3() },
      uLampAim: { value: new THREE.Vector3() },
      uLampColor: { value: new THREE.Vector3() },
      uSpillColor: { value: new THREE.Vector3() },
      uSpillPower: { value: 0 },
      uScrC: { value: new THREE.Vector3() },
      uScrU: { value: new THREE.Vector3() },
      uScrV: { value: new THREE.Vector3() },
      uScrN: { value: new THREE.Vector3() },
      uLidO: { value: new THREE.Vector3() },
      uLidA: { value: new THREE.Vector3() },
      uLidB: { value: new THREE.Vector3() },
      uGlowOn: { value: 0 },
      uGlowPower: { value: 0 },
      uGlowRadius: { value: 1 },
      uGlowAt: { value: new THREE.Vector2() },
      uGlowColor: { value: new THREE.Vector3() },
      uGloss: { value: 0 },
      uFade: { value: 90 },
    }),
    [],
  );
  const u = uniforms;
  u.uCam.value.set(...cam.pos);
  u.uAlbedo.value.set(...light.albedo);
  u.uAmbient.value.set(...light.ambient);
  u.uLampOn.value = light.lamp ? 1 : 0;
  if (light.lamp) {
    u.uLampPower.value = light.lamp.power;
    u.uLampSize.value = light.lamp.size;
    u.uLampCone.value = light.lamp.cone;
    u.uLampPos.value.set(...light.lamp.pos);
    u.uLampAim.value.set(...light.lamp.aim);
    u.uLampColor.value.set(...light.lamp.color);
  }
  // The screen as a light: off while the lid is shut, waking as it opens (as RealLaptop's glass does).
  const wake = Math.min(1, Math.max(0, (open - 0.55) / 0.35));
  u.uSpillColor.value.set(...light.spill.color);
  u.uSpillPower.value = light.spill.power * wake;
  const c = lidPoint(open, 0, (GLASS.s0 + GLASS.s1) / 2, 0);
  const top = lidPoint(open, 0, GLASS.s1, 0);
  const right = lidPoint(open, GLASS.half, (GLASS.s0 + GLASS.s1) / 2, 0);
  const front = lidPoint(open, 0, (GLASS.s0 + GLASS.s1) / 2, 1).sub(c);
  u.uScrC.value.copy(c);
  u.uScrU.value.copy(right.clone().sub(c));
  u.uScrV.value.copy(top.clone().sub(c));
  u.uScrN.value.copy(front.normalize());
  const o = lidPoint(open, -LID.half, 0, -0.2);
  u.uLidO.value.copy(o);
  u.uLidA.value.copy(lidPoint(open, LID.half, 0, -0.2).sub(o));
  u.uLidB.value.copy(lidPoint(open, -LID.half, LID.s1, -0.2).sub(o));
  u.uGlowOn.value = light.glow ? 1 : 0;
  if (light.glow) {
    u.uGlowPower.value = light.glow.power;
    u.uGlowRadius.value = light.glow.radius;
    u.uGlowAt.value.set(...light.glow.at);
    u.uGlowColor.value.set(...light.glow.color);
  }
  u.uGloss.value = light.gloss;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, DESK_Y - 0.01, 0]}>
      <planeGeometry args={[600, 600]} />
      <shaderMaterial vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} toneMapped={false} depthWrite={false} />
    </mesh>
  );
};

/** One full-frame fill (its gradient passed as children, id `${id}-g`) laid only on the laptop body. */
const BodyLayer: React.FC<{ id: string; w: number; h: number; sil: ReturnType<typeof silhouette>; blend: "multiply" | "screen"; children: React.ReactNode }> = ({ id, w, h, sil, blend, children }) => (
  <svg width={w} height={h} style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: blend }}>
    <defs>
      <filter id={`${id}-f`} x="-5%" y="-5%" width="110%" height="110%">
        <feGaussianBlur stdDeviation={1.6} />
      </filter>
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
        <g filter={`url(#${id}-f)`}>
          <polygon points={poly(sil.base)} fill="#fff" />
          <polygon points={poly(sil.lid)} fill="#fff" />
          <polygon points={poly(sil.glass)} fill="#000" />
        </g>
      </mask>
      {children}
    </defs>
    <rect x={0} y={0} width={w} height={h} fill={`url(#${id}-g)`} mask={`url(#${id}-m)`} />
  </svg>
);

/* ------------------------------------------------------------------ public */

export type LaptopRoomProps = {
  /** What the screen shows: an image or a frame sequence under public/ (see RealLaptop). */
  screen: RealLaptopProps["screen"];
  preset?: RoomPreset;
  /** Camera keys in the laptop's centimetre world (see four/real-laptop.tsx). Default: a slow orbit. */
  camera?: CamKey[] | Omit<CamKey, "at">;
  /** 0 shut, 1 open. A number or keys. */
  lid?: number | LidKey[];
  brand?: Brand;
  /** Raylight push-in lens (passed to RealLaptop). */
  focus?: RealLaptopProps["focus"];
  blur?: RealLaptopProps["blur"];
  /** Fine-tune a preset (lamp position, spill strength...). */
  light?: Partial<Light>;
};

const track = (keys: number | LidKey[] | undefined, frame: number, fallback: number) => {
  if (keys === undefined) return fallback;
  if (typeof keys === "number") return keys;
  if (!keys.length) return fallback;
  if (frame <= keys[0].at) return keys[0].open;
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (frame <= b.at) {
      const t = (b.ease ?? Easing.bezier(0.45, 0, 0.2, 1))(Math.min(1, Math.max(0, (frame - a.at) / Math.max(1, b.at - a.at))));
      return a.open + (b.open - a.open) * t;
    }
  }
  return keys[keys.length - 1].open;
};

/** A pose: a direction from the target and a distance. */
export const roomPose = (dir: Vec3, target: Vec3, dist: number, fov = 30): Omit<CamKey, "at"> => {
  const n = Math.hypot(...dir);
  return { pos: [target[0] + (dir[0] / n) * dist, target[1] + (dir[1] / n) * dist, target[2] + (dir[2] / n) * dist], target, fov };
};

/** Default camera: a slow quarter-orbit from front left to front, the Raylight held-device dolly. */
export const roomOrbit = (frames: number, aspect: number): CamKey[] => {
  const d = aspect < 1 ? 150 : 96;
  return [
    { at: 0, ...roomPose([-0.62, 0.36, 0.7], [0, 6, -4], d) },
    { at: frames, ...roomPose([-0.18, 0.3, 0.94], [0, 7, -5], d * 0.9), ease: Easing.bezier(0.3, 0, 0.3, 1) },
  ];
};

/** Re-export so films can frame the glass without importing four/ themselves. */
export { onScreen };

export const LaptopRoom: React.FC<LaptopRoomProps> = (props) => {
  const frame = useCurrentFrame();
  const { width: w, height: h, durationInFrames } = useVideoConfig();
  const b = props.brand ?? getBrand("campusai");
  const preset = props.preset ?? "lamp";
  const light: Light = { ...presetLight(preset, b), ...props.light };
  const camKeys = props.camera ?? roomOrbit(durationInFrames, w / h);
  const cam = cameraAt(camKeys, frame);
  const open = Math.min(1, Math.max(0, track(props.lid, frame, 1)));
  const wake = Math.min(1, Math.max(0, (open - 0.55) / 0.35));

  const deskCam = useMemo(() => new THREE.PerspectiveCamera(30, w / h, 1, 3000), [w, h]);
  deskCam.fov = cam.fov ?? 30;
  deskCam.aspect = w / h;
  deskCam.position.set(...cam.pos);
  deskCam.lookAt(v3(cam.target));
  deskCam.updateProjectionMatrix();

  const sil = silhouette(cam, open, w, h);
  const gw = Math.hypot(sil.glass[1].x - sil.glass[0].x, sil.glass[1].y - sil.glass[0].y);
  const rgb = (v: Vec3, a = 1) => `rgba(${Math.round(v[0] * 255)}, ${Math.round(v[1] * 255)}, ${Math.round(v[2] * 255)}, ${a})`;
  const id = `lr-${preset}`;

  const body = light.body;
  const lit = body ? sil.project(body.litFrom) : null;
  const deckAt = sil.project(lidPoint(open, 0, 0, 0).add(new THREE.Vector3(0, 0.4, 4)).toArray() as Vec3);

  return (
    <AbsoluteFill style={{ background: light.ground, overflow: "hidden" }}>
      {preset === "studio" ? (
        <AbsoluteFill
          style={{ background: `radial-gradient(55% 34% at 50% 42%, rgba(${b.color.glowRgb}, 0.22) 0%, rgba(${b.color.glowRgb}, 0.06) 45%, rgba(0,0,0,0) 75%)` }}
        />
      ) : null}
      {light.haze ? (
        <AbsoluteFill
          style={{
            background: `radial-gradient(48% 36% at ${light.haze.x * 100}% ${light.haze.y * 100}%, ${rgb(K2700, light.haze.strength)} 0%, ${rgb(K2700, light.haze.strength * 0.3)} 40%, rgba(0,0,0,0) 72%)`,
          }}
        />
      ) : null}

      <ThreeCanvas width={w} height={h} dpr={1} camera={deskCam} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }} style={{ position: "absolute", inset: 0 }}>
        <Desk light={light} cam={cam} open={open} />
      </ThreeCanvas>

      <RealLaptop screen={props.screen} camera={camKeys} lid={props.lid} shadow={false} focus={props.focus} blur={props.blur} />

      {/* The body graded into the room. Mask: the two slabs of the real model, minus the glass. The
          blend sits on each svg element, so it mixes with the canvas below (inside one svg it would not). */}
      {body && lit ? (
        <BodyLayer id={`${id}-body`} w={w} h={h} sil={sil} blend="multiply">
          <radialGradient id={`${id}-body-g`} gradientUnits="userSpaceOnUse" cx={lit.x} cy={lit.y} r={w * 0.95}>
            <stop offset="0" stopColor={rgb(body.near)} />
            <stop offset="0.55" stopColor={rgb(body.near.map((c, i) => (c + body.far[i]) / 2) as Vec3)} />
            <stop offset="1" stopColor={rgb(body.far)} />
          </radialGradient>
        </BodyLayer>
      ) : null}
      {light.deck ? (
        <BodyLayer id={`${id}-deck`} w={w} h={h} sil={sil} blend="screen">
          <radialGradient id={`${id}-deck-g`} gradientUnits="userSpaceOnUse" cx={deckAt.x} cy={deckAt.y} r={gw * 0.5}>
            <stop offset="0" stopColor={rgb(light.deck.color, light.deck.strength * wake)} />
            <stop offset="1" stopColor={rgb(light.deck.color, 0)} />
          </radialGradient>
        </BodyLayer>
      ) : null}

      {/* The screen's own light in the air around it: a halo of the glass, never over the glass. */}
      {light.bloom > 0 && wake > 0 ? (
        <svg width={w} height={h} style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "screen" }}>
          <defs>
            <filter id={`${id}-halo`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation={Math.max(6, gw * 0.04)} />
            </filter>
            <mask id={`${id}-out`} maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
              <rect x={0} y={0} width={w} height={h} fill="#fff" />
              <polygon points={poly(sil.glass)} fill="#000" />
            </mask>
          </defs>
          <g mask={`url(#${id}-out)`}>
            <polygon points={poly(sil.glass)} fill={rgb(light.spill.color, Math.min(1, light.bloom * 1.6 * wake))} filter={`url(#${id}-halo)`} />
          </g>
        </svg>
      ) : null}

      <AbsoluteFill style={{ background: `radial-gradient(75% 65% at 50% 46%, rgba(0,0,0,0) 45%, rgba(0,0,0,${light.vignette}) 100%)`, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
