/**
 * /cgi-calm (2026-11-17, from the Nov 17 Muse sends: Matt Penny's ten Claude animation styles, his "CGI Motion" look;
 * Karam Mahaan's six skills where relevant). Prompts gated and unseen, our own build of the look.
 *
 * The reference, read frame by frame: a soft deep-blue sky fading pale toward a warm cream glow band at the horizon,
 * dark low islands on the horizon line, still glassy water with a soft reflection, and a small white paper plane gliding
 * slowly with a gentle bob. Calm and cinematic. Its title was wide-tracked caps; ours is sentence case in a light serif
 * (Newsreader 300), which is the taste law.
 *
 * Ours, student-first at Maryland (round 3, Nov 17; Jacob: show the product, and a joke only if it follows from the
 * screen, so this one plays it straight): the UMD M opens the film, the student's question sits quietly in the sky, then
 * the paper plane glides in, lands on the still water with a few rings, and folds open into a REAL capture of the
 * CampusAI chat answering that same question, a glass panel floating upright and reflected in the water. One or two
 * quiet lines echo what the answer says. Everything around the capture is three.js drawn in code: a gradient sky shader
 * (mirrored below the horizon), island silhouettes fogged by distance, and a real mirror (three's Reflector) under a
 * custom water shader that ripples and blurs the reflection. Render with --gl=angle.
 *
 * Motion in numbers (30 fps): the camera drifts the whole film, 0.3 to -0.2 across and 6 to 4.8 in, then pushes 0.6
 * closer once the plane is down; eye 1.25 above the water, pitched up 3 degrees, fov 40. The plane flies a centripetal
 * Catmull-Rom curve over 96 frames (bezier 0.3, 0.1, 0.45, 1) onto the water; three rings spread 3.2 units over 70
 * frames. The panel unfolds from flat to upright on its bottom edge over 36 frames (showy enter), growing from 0.18 to
 * full size, then floats 0.04 units on a 4.6 s period. The ad lines land 22 frames apart; the scene fades into the
 * ending's sky over 24 frames.
 */
import React, { useEffect, useMemo } from "react";
import { AbsoluteFill, Easing, continueRender, delayRender, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { loadFont } from "@remotion/google-fonts/Newsreader";
import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { CURVE, readHold } from "../system/motion";
import { Cue, clamp, ramp } from "./common";
import type { Format } from "./common";
import { World } from "./world";
import { UmdOpen } from "./UmdOpen";
import { useCaptureTexture } from "../kit/effects/captureTexture";
import type { Capture } from "../kit/effects/shared";

const { fontFamily: NEWSREADER } = loadFont("normal", { weights: ["300", "400"], subsets: ["latin"] });
const { fontFamily: NEWSREADER_I } = loadFont("italic", { weights: ["300"], subsets: ["latin"] });

const FPS = 30;
const INK = "#F6F0E8";
// the ending is the same sky with the scene gone: deep blue into the warm horizon
const END_GROUND = "linear-gradient(180deg, #13223f 0%, #23395f 38%, #4b5d84 64%, #a79db0 84%, #ecd2c2 100%)";

const SKY = { top: "#0f1c3b", mid: "#2f4a7c", low: "#97a9c8", horizon: "#f1dcc6", glow: "#f8e4c4", rose: "#e9b9ad" };
const WATER = "#0b152b";
const ISLAND = "#141a2c";
const FOG = "#d9c9c4";

export type CgiCalmProps = {
  format?: Format;
  /** Who the student is, small, first. */
  who: string;
  /** Their question, in their own words. */
  ask: string;
  /** A real capture: the plane lands on the water and unfolds into it, a glass panel reflected below. */
  capture: Capture;
  /** Corner radius of the panel, in capture pixels. */
  radius?: number;
  /** One or two quiet lines once the panel is up, the second in italic. Each must follow from what the panel says. */
  lines: string[];
  /** Optional small line under them. */
  note?: string;
  /** Seconds the open panel holds at least, so the answer can be read (default 6.5). */
  hold?: number;
  /** One small line at the foot of the frame. */
  source: string;
  cta?: string;
};

export const calmPlan = (p: CgiCalmProps) => {
  const askOut = 10 + Math.round(readHold(`${p.who} ${p.ask}`) * FPS);
  const fly = askOut - 34; // the plane is already gliding in as the question leaves
  const flight = 96;
  const land = fly + flight;
  const unfold: [number, number] = [land + 4, land + 40];
  const line1 = unfold[1] - 6;
  const line2 = line1 + 22;
  const noteAt = line2 + 18;
  const end = Math.max(line1 + Math.round(readHold(`${p.lines.join(" ")} ${p.note ?? ""}`) * FPS) + 14, unfold[1] + Math.round((p.hold ?? 6.5) * FPS));
  return { askOut, fly, flight, land, unfold, line1, line2, noteAt, end };
};
export const calmEnd = (p: CgiCalmProps) => calmPlan(p).end;

/* ---------------- camera and plane, pure ---------------- */

const camAt = (f: number, total: number, aspect: number, land: number) => {
  const t = Math.min(1, f / total);
  const cam = new THREE.PerspectiveCamera(40, aspect, 0.1, 4000);
  // a slow drift the whole film, and a gentle push toward the panel once the plane is down
  const push = interpolate(f, [land, total], [0, 1], { ...clamp, easing: CURVE.quiet.standard });
  const x = 0.3 - 0.5 * t;
  const y = 1.25 + 0.05 * Math.sin(f / 70);
  const z = 6 - 1.2 * t - 0.6 * push;
  cam.position.set(x, y, z);
  const pitch = THREE.MathUtils.degToRad(3);
  cam.lookAt(x * 0.4, y + Math.tan(pitch) * 40, z - 40);
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();
  return cam;
};

const LANDING = new THREE.Vector3(0, 0.12, -6.4);
const PATH = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(-6.4, 4.3, -10),
    new THREE.Vector3(-2.4, 3.5, -11),
    new THREE.Vector3(1.3, 2.3, -9.8),
    new THREE.Vector3(0.7, 0.9, -7.3),
    LANDING,
  ],
  false,
  "centripetal",
);

const planeAt = (f: number, fly: number, flight: number) => {
  const u = interpolate(f, [fly, fly + flight], [0, 1], { ...clamp, easing: Easing.bezier(0.3, 0.1, 0.45, 1) });
  const pos = PATH.getPoint(u);
  const ahead = u < 0.995 ? PATH.getPoint(Math.min(1, u + 0.004)) : pos.clone().add(new THREE.Vector3(0, 0, -0.01));
  const tan = ahead.clone().sub(pos);
  if (tan.lengthSq() < 1e-8) tan.set(0, 0, -1);
  tan.normalize();
  if (u < 1) pos.y += 0.06 * (1 - u) * Math.sin((f / FPS) * ((2 * Math.PI) / 2.6));
  // bank into the turn: how fast the heading swings left or right; level out on the water
  const next = PATH.getTangent(Math.min(1, u + 0.02));
  const bank = THREE.MathUtils.clamp(-(next.x - tan.x) * 9, -0.55, 0.55) * (1 - u * u);
  return { pos, tan, bank, u };
};

/* ---------------- shaders ---------------- */

const skyShader = {
  uniforms: {
    uTop: { value: new THREE.Color(SKY.top) },
    uMid: { value: new THREE.Color(SKY.mid) },
    uLow: { value: new THREE.Color(SKY.low) },
    uHorizon: { value: new THREE.Color(SKY.horizon) },
    uGlow: { value: new THREE.Color(SKY.glow) },
    uRose: { value: new THREE.Color(SKY.rose) },
    uSun: { value: new THREE.Vector3(0.18, 0.015, -1).normalize() },
  },
  vertexShader: /* glsl */ `
    varying vec3 vDir;
    void main() {
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vDir = wp.xyz - cameraPosition;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uLow; uniform vec3 uHorizon; uniform vec3 uGlow; uniform vec3 uRose; uniform vec3 uSun;
    varying vec3 vDir;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec3 d = normalize(vDir);
      float e = abs(d.y);
      vec3 col = mix(uHorizon, uRose, smoothstep(0.004, 0.03, e));
      col = mix(col, uLow, smoothstep(0.02, 0.09, e));
      col = mix(col, uMid, smoothstep(0.07, 0.26, e));
      col = mix(col, uTop, smoothstep(0.22, 0.7, e));
      float band = exp(-pow(e / 0.022, 2.0));
      col = mix(col, uGlow, band * 0.9);
      float s = max(dot(d, uSun), 0.0);
      col += uGlow * (pow(s, 400.0) * 0.5 + pow(s, 30.0) * 0.16) * (1.0 - smoothstep(0.0, 0.2, e));
      col += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
      gl_FragColor = vec4(col, 1.0);
      #include <colorspace_fragment>
    }`,
};

const waterShader = {
  name: "CalmWater",
  uniforms: {
    color: { value: null as THREE.Color | null },
    tDiffuse: { value: null as THREE.Texture | null },
    textureMatrix: { value: null as THREE.Matrix4 | null },
    uTime: { value: 0 },
  },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix;
    varying vec4 vUv;
    varying vec3 vWorld;
    void main() {
      vUv = textureMatrix * vec4(position, 1.0);
      vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 color; uniform sampler2D tDiffuse; uniform float uTime;
    varying vec4 vUv; varying vec3 vWorld;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec3 V = cameraPosition - vWorld;
      float dist = length(V);
      V /= dist;
      vec2 p = vWorld.xz;
      float t = uTime;
      float r = sin(p.y * 1.1 + t * 0.7 + sin(p.x * 0.3) * 1.4) * 0.55
              + sin(p.y * 2.6 - p.x * 0.45 - t * 1.05) * 0.3
              + sin(p.x * 0.8 + p.y * 0.55 + t * 0.5) * 0.15;
      float att = 1.0 / (1.0 + dist * 0.05);
      vec2 uv = vUv.xy / vUv.w;
      uv += vec2(r * 0.0016, r * 0.006) * att;
      // a soft, mostly vertical blur: still water smears a reflection downward, never sideways
      vec3 acc = vec3(0.0); float wsum = 0.0;
      for (int i = -7; i <= 7; i++) {
        float fi = float(i);
        float w = exp(-fi * fi / 24.0);
        acc += texture2D(tDiffuse, uv + vec2(fi * 0.0005, fi * 0.0024)).rgb * w;
        wsum += w;
      }
      acc /= wsum;
      float fres = 0.28 + 0.72 * pow(1.0 - clamp(V.y, 0.0, 1.0), 4.0);
      vec3 col = mix(color, acc * 0.92, fres);
      // a faint sheen line where the ripple crests catch the glow
      col += vec3(0.02, 0.018, 0.015) * smoothstep(0.75, 1.0, r) * att;
      col += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
};

/* ---------------- the world ---------------- */

/** A low island: a smooth ridge line, deterministic, its foot under the water. */
const islandGeo = (width: number, height: number, seed: number, peaks: number) => {
  const s = new THREE.Shape();
  const n = 60;
  s.moveTo(-width / 2, -3);
  for (let i = 0; i <= n; i++) {
    const x = i / n;
    const edge = Math.pow(Math.sin(Math.PI * x), 0.7);
    let hgt = 0;
    for (let k = 0; k < peaks; k++) {
      const c = 0.2 + 0.6 * ((Math.sin(seed * 17.3 + k * 4.1) + 1) / 2);
      const wdt = 0.16 + 0.14 * ((Math.sin(seed * 5.7 + k * 2.3) + 1) / 2);
      const amp = 0.55 + 0.45 * ((Math.sin(seed * 3.1 + k * 7.9) + 1) / 2);
      hgt = Math.max(hgt, amp * Math.exp(-Math.pow((x - c) / wdt, 2)));
    }
    const grain = 0.04 * Math.sin(x * 60 + seed) + 0.025 * Math.sin(x * 140 + seed * 2);
    s.lineTo(-width / 2 + x * width, Math.max(0, (hgt * 0.85 + 0.15 + grain) * edge * height));
  }
  s.lineTo(width / 2, -3);
  s.closePath();
  return new THREE.ShapeGeometry(s, 4);
};

const ISLANDS = [
  { x: -38, z: -260, w: 44, h: 7.5, seed: 1, peaks: 3 },
  { x: -9, z: -300, w: 20, h: 3.5, seed: 4, peaks: 2 },
  { x: 40, z: -320, w: 30, h: 5.5, seed: 7, peaks: 2 },
  { x: 5, z: -560, w: 150, h: 11, seed: 11, peaks: 5 },
];

const PaperPlane: React.FC<{ f: number; p: CgiCalmProps }> = ({ f, p }) => {
  const { fly, flight, land, unfold } = calmPlan(p);
  const geo = useMemo(() => {
    // a classic dart: nose forward (+z), two wings with a little dihedral, a shallow keel
    const nose = [0, 0, 1.15];
    const tail = [0, 0.02, -0.55];
    const lw = [-0.62, 0.11, -0.62];
    const rw = [0.62, 0.11, -0.62];
    const keel = [0, -0.2, -0.55];
    const tri = [nose, tail, lw, nose, rw, tail, nose, keel, tail, nose, tail, keel].flat();
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(tri, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  if (f < fly - 2 || f > unfold[0] + 14) return null;
  const { pos, tan, bank, u } = planeAt(f, fly, flight);
  const o = new THREE.Object3D();
  o.position.copy(pos);
  o.lookAt(pos.clone().add(tan));
  // rolled a little toward the camera in flight so the wings read as a white shape; level once it is on the water
  o.rotateZ(bank - 0.5 * (1 - u));
  o.rotateX(0.04 * Math.sin(f / 13) * (1 - u));
  // on the water it settles, then folds open into the panel
  const gone = ramp(f, unfold[0], unfold[0] + 14, CURVE.quiet.standard);
  const sit = f > land ? 0.02 * Math.sin((f - land) / 6) * Math.exp(-(f - land) / 20) : 0;
  return (
    <mesh geometry={geo} position={[o.position.x, o.position.y + sit, o.position.z]} quaternion={o.quaternion} scale={[0.85 * (1 + gone * 1.6), 0.85 * (1 - gone), 0.85 * (1 - gone * 0.6)]}>
      <meshStandardMaterial color="#f7f3ec" roughness={0.55} metalness={0} side={THREE.DoubleSide} flatShading emissive="#d3d8e6" emissiveIntensity={0.55}
        transparent opacity={1 - gone} />
    </mesh>
  );
};

/** Rings where the plane touches down. */
const Ripples: React.FC<{ f: number; at: number }> = ({ f, at }) => (
  <>
    {[0, 12, 26].map((d, i) => {
      const t = f - at - d;
      if (t < 0 || t > 70) return null;
      const k = t / 70;
      return (
        <mesh key={i} position={[LANDING.x, 0.012, LANDING.z]} rotation={[-Math.PI / 2, 0, 0]} scale={0.25 + k * 3.2}>
          <ringGeometry args={[0.92, 1, 96]} />
          <meshBasicMaterial color="#f6efe6" transparent opacity={0.45 * (1 - k) * (1 - k)} depthWrite={false} toneMapped={false} />
        </mesh>
      );
    })}
  </>
);

const PANEL_W = 3.5;

/** The real capture as a glass panel, hinged at the water: it unfolds upright out of the plane and floats. */
const Panel: React.FC<{ f: number; p: CgiCalmProps }> = ({ f, p }) => {
  const { unfold } = calmPlan(p);
  const tex = useCaptureTexture(p.capture.src, p.capture.crop, p.radius ?? 40);
  const k = ramp(f, unfold[0], unfold[1], CURVE.showy.enter);
  if (k <= 0) return null;
  const h = (PANEL_W * p.capture.crop.h) / p.capture.crop.w;
  const float = 0.04 * Math.sin((f - unfold[1]) / 22) * ramp(f, unfold[1], unfold[1] + 20);
  const fade = Math.min(1, k * 1.6);
  return (
    <group position={[LANDING.x, 0.28 + float, LANDING.z]} rotation={[-(Math.PI / 2) * (1 - k), 0, 0]} scale={0.18 + 0.82 * k}>
      {/* the glass: a faint pane a little larger than the capture, its edge catching the sky */}
      <mesh position={[0, h / 2, -0.012]}>
        <planeGeometry args={[PANEL_W + 0.14, h + 0.14]} />
        <meshBasicMaterial color="#e9eefb" transparent opacity={0.16 * fade} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, h / 2, 0]}>
        <planeGeometry args={[PANEL_W, h]} />
        <meshBasicMaterial map={tex} transparent opacity={fade} alphaTest={0.02} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

const Scene: React.FC<{ p: CgiCalmProps; total: number }> = ({ p, total }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { camera, scene } = useThree();
  const { land } = calmPlan(p);

  const sky = useMemo(() => new THREE.ShaderMaterial({ ...skyShader, uniforms: THREE.UniformsUtils.clone(skyShader.uniforms), side: THREE.BackSide, depthWrite: false }), []);
  const water = useMemo(() => {
    const r = new Reflector(new THREE.PlaneGeometry(4000, 4000), {
      color: new THREE.Color(WATER), textureWidth: width, textureHeight: height, clipBias: 0.002, shader: waterShader, multisample: 4,
    });
    r.rotation.x = -Math.PI / 2;
    return r;
  }, [width, height]);
  const islands = useMemo(() => ISLANDS.map((i) => islandGeo(i.w, i.h, i.seed, i.peaks)), []);
  useMemo(() => {
    scene.fog = new THREE.Fog(FOG, 140, 1100);
  }, [scene]);

  (water.material as THREE.ShaderMaterial).uniforms.uTime.value = f / FPS;
  const c = camAt(f, total, width / height, land);
  camera.position.copy(c.position);
  camera.quaternion.copy(c.quaternion);
  (camera as THREE.PerspectiveCamera).fov = 40;
  camera.updateProjectionMatrix();

  return (
    <>
      <hemisphereLight args={["#a9b9d8", "#1b2236", 1.1]} />
      <directionalLight position={[30, 10, -100]} intensity={1.6} color="#ffe0bd" />
      <directionalLight position={[-4, 6, 10]} intensity={0.75} color="#d6def0" />
      <mesh material={sky} renderOrder={-1}>
        <sphereGeometry args={[2000, 48, 32]} />
      </mesh>
      {ISLANDS.map((i, k) => (
        <mesh key={k} geometry={islands[k]} position={[i.x, 0, i.z]}>
          <meshBasicMaterial color={ISLAND} fog />
        </mesh>
      ))}
      <primitive object={water} />
      <PaperPlane f={f} p={p} />
      <Ripples f={f} at={land} />
      <Panel f={f} p={p} />
    </>
  );
};

// The capture texture suspends the scene; draw the first frame a render tab asks for once more after mount (as CardDrop).
const Kick: React.FC = () => {
  const { advance } = useThree();
  useEffect(() => {
    const h = delayRender("cgi-calm first frame");
    const t = setTimeout(() => {
      advance(performance.now());
      continueRender(h);
    }, 120);
    return () => clearTimeout(t);
  }, [advance]);
  return null;
};

/* ---------------- the type ---------------- */

const Quiet: React.FC<{ k: number; children: React.ReactNode; style: React.CSSProperties }> = ({ k, children, style }) => (
  <div style={{ position: "absolute", left: 72, right: 72, textAlign: "center", color: INK, opacity: k,
    filter: `blur(${((1 - k) * 6).toFixed(2)}px)`, transform: `translateY(${((1 - k) * 10).toFixed(1)}px)`,
    textShadow: "0 2px 24px rgba(10,18,40,.45)", ...style }}>{children}</div>
);

export const CgiCalm: React.FC<CgiCalmProps> = (p) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { askOut, line1, line2, noteAt, end } = calmPlan(p);
  const s = width / 1080;

  // the student, quiet in the sky, under the M's tag
  const whoK = ramp(f, 2, 16, CURVE.quiet.enter) * (1 - ramp(f, askOut - 14, askOut, CURVE.quiet.exit));
  const askK = ramp(f, 6, 22, CURVE.quiet.enter) * (1 - ramp(f, askOut - 12, askOut + 2, CURVE.quiet.exit));
  const out = 1 - ramp(f, end - 26, end - 4, CURVE.quiet.exit);
  const l1 = ramp(f, line1, line1 + 18, CURVE.quiet.enter) * out;
  const l2 = ramp(f, line2, line2 + 18, CURVE.quiet.enter) * out;
  const nk = ramp(f, noteAt, noteAt + 16, CURVE.quiet.enter) * out;
  const fadeToEnd = ramp(f, end - 24, end, CURVE.quiet.standard);
  const top = Math.round(height * 0.17);
  const adTop = Math.round(height * 0.125);

  return (
    <World endAt={end} cta={p.cta} font={NEWSREADER} fontWeight={300} ink={INK} logo="white" logoSpot="top-left" end="wipe-up" endGround={END_GROUND} ground={SKY.top}>
      <AbsoluteFill>
        <ThreeCanvas width={width} height={height} flat camera={{ fov: 40, position: [0, 1.25, 6], near: 0.1, far: 4000 }} gl={{ antialias: true }}>
          <Scene p={p} total={end + 24} />
          <Kick />
        </ThreeCanvas>
      </AbsoluteFill>

      <Quiet k={whoK} style={{ top, fontFamily: NEWSREADER_I, fontWeight: 300, fontStyle: "italic", fontSize: 46 * s, opacity: whoK * 0.85 }}>
        {p.who}
      </Quiet>
      <Quiet k={askK} style={{ top: top + 70 * s, fontFamily: NEWSREADER, fontWeight: 300, fontSize: 88 * s, lineHeight: 1.06, letterSpacing: "-0.015em" }}>
        {p.ask}
      </Quiet>

      {/* the ad voice, quiet in the same place the question sat */}
      <Quiet k={l1} style={{ top: adTop, fontFamily: NEWSREADER, fontWeight: 300, fontSize: 80 * s, lineHeight: 1.04, letterSpacing: "-0.02em" }}>
        {p.lines[0]}
      </Quiet>
      {p.lines[1] ? (
        <Quiet k={l2} style={{ top: adTop + 90 * s, fontFamily: NEWSREADER_I, fontStyle: "italic", fontWeight: 300, fontSize: 80 * s, lineHeight: 1.04, letterSpacing: "-0.02em" }}>
          {p.lines[1]}
        </Quiet>
      ) : null}
      {p.note ? (
        <Quiet k={nk} style={{ top: adTop + 200 * s, fontFamily: NEWSREADER, fontWeight: 400, fontSize: 38 * s, lineHeight: 1.2 }}>
          {p.note}
        </Quiet>
      ) : null}
      <div style={{ position: "absolute", left: 72, right: 72, top: Math.round(height * 0.9), textAlign: "center", fontFamily: NEWSREADER, fontWeight: 400,
        fontSize: 28 * s, color: INK, opacity: 0.7 * nk, textShadow: "0 1px 12px rgba(6,12,30,.9)" }}>{p.source}</div>

      <AbsoluteFill style={{ background: END_GROUND, opacity: fadeToEnd }} />

      <Cue at={calmPlan(p).fly + 4} name="swoosh-slow" volume={0.22} />
      <Cue at={calmPlan(p).land - 2} name="paper-slide" volume={0.25} />
      <Cue at={calmPlan(p).unfold[0]} name="paper-page-turn" volume={0.3} />
      <Cue at={line1 - 4} name="chime-crystal" volume={0.18} />

      {/* the UMD M in the first second, then a small tag top centre, clear of the wordmark top left */}
      <UmdOpen bigCy={Math.round(height * 0.42)} tagCx={width / 2} tagCy={118} />
    </World>
  );
};
