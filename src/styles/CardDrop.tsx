/**
 * /card-drop (2026-11-16, ported from the Nov 15 React Rapier trial, Jacob approved Nov 16). Real cards cut from a
 * capture fall one after another as rigid bodies onto a floor under a crimson pool of light and pile up, tumbling and
 * sliding over each other. The card that matters (`hero`, often the same card after the press) falls last and lands on
 * top, and the camera pushes in onto it, turning to square up with how it landed.
 *
 * Every card is a REAL crop of a capture, cut with the page's own rounded corners, never rebuilt.
 *
 * The physics is Rapier (@dimforge/rapier3d-compat, its WASM build, used directly; no React wrapper). The whole fall is
 * baked once before the first frame: a fresh world stepped on a fixed 1/120 s timestep, 4 steps per video frame, from
 * frame 0 to the end, and every frame reads its poses from that bake. So any frame is the same whichever render tab draws
 * it and in whatever order. Same props, same pile.
 *
 * Motion in numbers (30 fps, the trial's): the first card falls at frame 4, the rest `every` frames apart (default 9.5),
 * each from 7 units up (plus 0.3 per card) at -4 u/s with a little spin, gravity -32, friction 0.8, restitution 0.08.
 * The hero falls 36 frames after the last card. The camera looks down at 1.08 rad from 19 units; 26 frames after the hero
 * falls it pushes over 64 frames on (0.45, 0, 0.2, 1) to 13.6 units at 1.42 rad, centred on the hero and turned to its
 * yaw. The headline sits low in the frame and leaves as the push starts; the source shows under the hero once it lands.
 */
import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, Easing, cancelRender, continueRender, delayRender, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { loadFont } from "@remotion/google-fonts/Urbanist";
import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import { useCaptureTexture } from "../kit/effects/captureTexture";
import type { Capture } from "../kit/effects/shared";
import { CURVE, readHold } from "../system/motion";
import { Cue, clamp, ramp } from "./common";
import type { Format } from "./common";
import { Heading, World } from "./world";

const { fontFamily: URBANIST } = loadFont("normal", { weights: ["500", "700", "800"], subsets: ["latin"] });

// its own world: a crimson pool of light on a dark floor, the cards' shadows falling into it
const GROUND = "radial-gradient(120% 70% at 50% 42%, #5a0f17 0%, #2a0a0e 38%, #0b0708 75%)";
const INK = "#FBE9EA";
const END_GROUND = "#5a0f17";
const FPS = 30;

export type CardDropProps = {
  format?: Format;
  /** One short true line, low in the frame while the cards fall. "\n" breaks it. */
  headline: string;
  /** The cards that fall first, in order, each a real crop. */
  cards: Capture[];
  /** The card that falls last and lands on top; the camera ends on it. */
  hero: Capture;
  source: string;
  cta?: string;
  /** Frames between drops (default 9.5). */
  every?: number;
  /** Corner radius of the cut cards in capture pixels (default 24, a CampusAI card at 2x). */
  radius?: number;
};

const W = 5; // card width in world units; height follows the crop
const THICK = 0.04;
const SUB = 4; // physics substeps per video frame, fixed timestep 1/120 s
const EASE = Easing.bezier(0.45, 0, 0.2, 1);
// where each card is let go and how it is turned, the trial's five, mirrored on each pass round for a longer list
const PLACES = [
  { x: -0.9, z: -2.6, yaw: 0.35, tilt: 0.25 },
  { x: 1.1, z: 2.9, yaw: -0.5, tilt: -0.3 },
  { x: 0.8, z: -0.4, yaw: -0.22, tilt: 0.35 },
  { x: -1.2, z: 1.4, yaw: 0.6, tilt: 0.2 },
  { x: -0.3, z: 0.9, yaw: 0.18, tilt: -0.35 },
];
const HERO_PLACE = { x: 0.05, z: 0.15, yaw: 0.05, tilt: 0.12 };

export const dropPlan = (p: CardDropProps) => {
  const every = p.every ?? 9.5;
  const ats = p.cards.map((_, i) => 4 + Math.round(i * every));
  const heroAt = (ats[ats.length - 1] ?? 4) + 36;
  const push: [number, number] = [heroAt + 26, heroAt + 90];
  const end = push[1] + Math.max(12, Math.round(readHold(p.source) * FPS * 0.4));
  return { ats, heroAt, push, end };
};
export const dropEnd = (p: CardDropProps) => dropPlan(p).end;

type Pose = { p: [number, number, number]; q: [number, number, number, number] } | null;

let rapierReady: Promise<void> | null = null;

/** The deterministic bake: poses[frame][card], hero last. Null until Rapier's WASM is in. */
const useBake = (p: CardDropProps, frames: number): Pose[][] | null => {
  const [ok, setOk] = useState(false);
  const [handle] = useState(() => delayRender("Rapier WASM for /card-drop"));
  useEffect(() => {
    (rapierReady ??= RAPIER.init())
      .then(() => {
        setOk(true);
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [handle]);
  const { ats, heroAt } = dropPlan(p);
  const all = [...p.cards, p.hero];
  const key = JSON.stringify([all.map((c) => c.crop), ats, heroAt, frames]);
  return useMemo(() => {
    if (!ok) return null;
    const world = new RAPIER.World({ x: 0, y: -32, z: 0 });
    world.timestep = 1 / 120;
    const floor = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0));
    world.createCollider(RAPIER.ColliderDesc.cuboid(30, 0.5, 30).setFriction(0.9), floor);
    const bodies: (RAPIER.RigidBody | null)[] = all.map(() => null);
    const out: Pose[][] = [];
    for (let f = 0; f < frames; f++) {
      all.forEach((c, i) => {
        const hero = i === all.length - 1;
        if (f !== (hero ? heroAt : ats[i])) return;
        const base = PLACES[i % PLACES.length];
        const m = !hero && Math.floor(i / PLACES.length) % 2 === 1 ? -1 : 1;
        const pl = hero ? HERO_PLACE : { ...base, x: base.x * m, yaw: base.yaw * m };
        const aspect = c.crop.h / c.crop.w;
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(pl.tilt, pl.yaw, pl.tilt * 0.6));
        const b = world.createRigidBody(
          RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(pl.x, 7 + i * 0.3, pl.z)
            .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
            .setLinvel(0, -4, 0)
            .setAngvel({ x: pl.tilt * 2, y: pl.yaw * 1.5, z: -pl.tilt })
            .setCcdEnabled(true),
        );
        world.createCollider(RAPIER.ColliderDesc.cuboid(W / 2, THICK / 2, (W * aspect) / 2).setFriction(0.8).setRestitution(0.08).setDensity(2), b);
        bodies[i] = b;
      });
      for (let s = 0; s < SUB; s++) world.step();
      out.push(bodies.map((b) => {
        if (!b) return null;
        const t = b.translation();
        const r = b.rotation();
        return { p: [t.x, t.y, t.z], q: [r.x, r.y, r.z, r.w] };
      }));
    }
    world.free();
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ok, key]);
};

const Card: React.FC<{ shot: Capture; radius: number; pose: Pose }> = ({ shot, radius, pose }) => {
  const tex = useCaptureTexture(shot.src, shot.crop, radius);
  if (!pose) return null;
  const aspect = shot.crop.h / shot.crop.w;
  return (
    <group position={pose.p} quaternion={new THREE.Quaternion(...pose.q)}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, THICK / 2 + 0.001, 0]} castShadow receiveShadow>
        <planeGeometry args={[W, W * aspect]} />
        <meshStandardMaterial map={tex} alphaTest={0.5} roughness={0.75} metalness={0} emissiveMap={tex} emissive="#ffffff" emissiveIntensity={0.55} />
      </mesh>
    </group>
  );
};

const Scene: React.FC<{ p: CardDropProps; bake: Pose[][] }> = ({ p, bake }) => {
  const frame = useCurrentFrame();
  const { camera } = useThree();
  const all = [...p.cards, p.hero];
  const poses = bake[Math.min(frame, bake.length - 1)];
  const { push } = dropPlan(p);
  // wide on the pile, then a slow push onto the hero, turned to its yaw
  const last = bake[bake.length - 1][all.length - 1]!;
  const yaw = new THREE.Euler().setFromQuaternion(new THREE.Quaternion(...last.q), "YXZ").y;
  const k = interpolate(frame, push, [0, 1], { ...clamp, easing: EASE });
  const target = new THREE.Vector3(0, 0, 0.2).lerp(new THREE.Vector3(...last.p), k);
  const dist = interpolate(k, [0, 1], [19, 13.6]);
  const pitch = interpolate(k, [0, 1], [1.08, 1.42]);
  const off = new THREE.Vector3(0, Math.sin(pitch) * dist, Math.cos(pitch) * dist).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw * k);
  camera.position.copy(target.clone().add(off));
  camera.up.set(0, 1, 0);
  camera.lookAt(target);
  camera.updateProjectionMatrix();
  const radius = p.radius ?? 24;
  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[-4, 12, 5]} intensity={1.4} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-9} shadow-camera-right={9}
        shadow-camera-top={9} shadow-camera-bottom={-9} shadow-bias={-0.0004} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <shadowMaterial opacity={0.55} />
      </mesh>
      {all.map((c, i) => <Card key={i} shot={c} radius={radius} pose={poses[i]} />)}
    </>
  );
};

// The cards' textures suspend the scene; when it resumes, Remotion has already asked for this frame, so the first frame
// a render tab draws could miss them. Draw that frame once more after mount, as GlowFocus does.
const Kick: React.FC = () => {
  const { advance } = useThree();
  useEffect(() => {
    const h = delayRender("card-drop first frame");
    const t = setTimeout(() => {
      advance(performance.now());
      continueRender(h);
    }, 120);
    return () => clearTimeout(t);
  }, [advance]);
  return null;
};

export const CardDrop: React.FC<CardDropProps> = (p) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { ats, heroAt, push, end } = dropPlan(p);
  const bake = useBake(p, end + 1);
  const src = ramp(f, heroAt + 18, heroAt + 34, CURVE.quiet.enter) * (1 - ramp(f, end - 8, end, CURVE.quiet.exit));
  return (
    <World endAt={end} cta={p.cta} font={URBANIST} fontWeight={800} ink={INK} logo="white" logoSpot="top-right" end="iris" endGround={END_GROUND} ground={GROUND}>
      <AbsoluteFill>
        {bake ? (
          <ThreeCanvas width={width} height={height} shadows camera={{ fov: 38, position: [0, 16, 7], near: 0.1, far: 100 }} gl={{ antialias: true, alpha: true }}>
            <Scene p={p} bake={bake} />
            <Kick />
          </ThreeCanvas>
        ) : null}
      </AbsoluteFill>
      {/* a soft dark halo keeps the words readable over a card that slides under them */}
      <AbsoluteFill style={{ filter: "drop-shadow(0 4px 22px rgba(11,7,8,.95))" }}>
        <Heading font={URBANIST} color={INK} size={Math.round(width * 0.072)} weight={800} top={Math.round(height * 0.8)} align="center" out={push[0]} at={2} tracking="-0.03em">
          <span style={{ whiteSpace: "pre-line" }}>{p.headline}</span>
        </Heading>
        <div style={{ position: "absolute", left: 64, right: 64, top: Math.round(height * 0.86), textAlign: "center", fontFamily: URBANIST, fontWeight: 500,
          fontSize: Math.round(width * 0.028), color: INK, opacity: 0.75 * src }}>{p.source}</div>
      </AbsoluteFill>
      {ats.map((at, i) => <Cue key={i} at={at + 8} name={i % 2 ? "paper-slide" : "paper-move-quick"} volume={0.3} />)}
      <Cue at={heroAt + 8} name="switch-tap" volume={0.4} />
      <Cue at={push[0]} name="swoosh-slow" volume={0.25} />
    </World>
  );
};
