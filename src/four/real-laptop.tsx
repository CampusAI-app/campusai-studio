/**
 * RealLaptop: a photoreal laptop for Remotion films (round 2 of the four-video batch, replacing kit
 * Laptop3D, which Jacob said "looks fake"). Matched against Raylight's device templates.
 *
 * WHAT IT IS
 *   A real 3D model rendered with three.js through @remotion/three: PBR aluminium, a black glass
 *   screen that shows the content as light AND reflects the room, a soft contact shadow, and a lid
 *   that opens on a real hinge. Every motion is driven by useCurrentFrame (no useFrame).
 *
 * MODEL (CC-BY-4.0, credit required wherever the film is posted with credits)
 *   "macbook pro M3 16 inch 2024" by jackbaeten
 *   https://sketchfab.com/3d-models/macbook-pro-m3-16-inch-2024-8e34fc2b303144f78490007d91ff57c4
 *   Licence: http://creativecommons.org/licenses/by/4.0/  (copy in public/four/laptop/LICENSE.txt)
 *   Modified: lid split from the base at runtime so it can open, body re-tinted, the badge text on
 *   the underside and the lid logo hidden. The file came Draco-compressed from
 *   github.com/adrianhajdin/gsap_macbook_landing (public/models/macbook-16.glb), metadata intact.
 *
 * RENDERING
 *   WebGL needs a GL backend in headless Chrome. Stills and renders that include this part need
 *   `--gl=angle` (fast, on this Mac) or `--gl=swangle` (software, slow, always works).
 *
 * UNITS
 *   World units are centimetres of a 16-inch laptop: the base is 35.4 wide, sits on the desk at
 *   y = -0.96, its front edge at z = +12.4, the hinge at z = -12.6. Camera keyframes use these.
 */
import React, { useEffect, useMemo, useState } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, useDelayRender, useVideoConfig } from "remotion";

/* ------------------------------------------------------------------ public types */

export type Vec3 = [number, number, number];
/** One camera pose. `at` is the frame it is reached. `ease` shapes the move INTO this key. */
export type CamKey = { at: number; pos: Vec3; target: Vec3; fov?: number; ease?: (t: number) => number };
export type LidKey = { at: number; open: number; ease?: (t: number) => number };

export type ScreenSource =
  | { image: string } // a path under public/ (or a full URL)
  | { frames: string[]; fps?: number; startAt?: number } // a frame sequence, played from startAt
  | { node: React.ReactNode }; // any React content, laid onto the glass by a perspective transform

export type RealLaptopProps = {
  screen: ScreenSource;
  /** A fixed pose, or keyframes. Defaults to the three-quarter hero. */
  camera?: CamKey[] | Omit<CamKey, "at">;
  /** 0 shut, 1 open as designed (about 110 degrees). A number or keyframes. */
  lid?: number | LidKey[];
  /** Turns the whole laptop about its vertical axis, radians. Number or keyframes (open = angle). */
  spin?: number | LidKey[];
  /** For images and frames: which part of a tall capture shows. 0 top, 1 bottom. Number or keyframes. */
  scroll?: number | LidKey[];
  /** Space black (default, what Raylight shows) or silver. */
  finish?: "spaceBlack" | "silver";
  /** Contact shadow under the base. Default true. */
  shadow?: boolean;
  /** Canvas size; defaults to the composition. */
  width?: number;
  height?: number;
  /** Design size of a `node` screen, in CSS px. Height follows the panel's aspect. Default 1440 wide. */
  nodeWidth?: number;
  /**
   * Depth of field, the Raylight push-in look: everything outside an ellipse around `focus` goes soft.
   * focus x,y are fractions of the frame; `radius` its size as a fraction of the frame width.
   * `blur` is px at the frame edge, a number or keyframes (0 = sharp, 8 to 14 reads as a lens).
   */
  focus?: { x: number; y: number; radius?: number };
  blur?: number | LidKey[];
};

/* ------------------------------------------------------------------ model geometry */

const MODEL = "four/laptop/macbook-16.glb";
const DRACO = "four/laptop/draco/";
/**
 * Hinge pivot in world space (x axis through it). Solved from the mesh so that, shut, the glass
 * lies 0.4 above the key tops and the lid's front edge meets the base's front edge.
 */
const HINGE = new THREE.Vector3(0, -0.063, -12.15);
/** The lid as modelled leans back ~19.9 degrees past vertical, i.e. ~109.9 degrees open. */
const LID_DIR = new THREE.Vector3(0, Math.cos(0.3474), -Math.sin(0.3474));
const OPEN_ANGLE = Math.PI / 2 + 0.3474;
/** Desk plane (underside of the feet). */
export const DESK_Y = -0.96;

/** Parts hidden on purpose: no Apple logo or trademark text anywhere on the device. */
const HIDE = new Set(["Object_54", "Object_82", "Object_107"]);
const SCREEN_NODE = "Object_123";
/** Parts that keep their own colour when the body is tinted (keys, legends, glass, rubber). */
const KEEP = new Set(["Object_34", "Object_58", "Object_66", "Object_123", "Object_127", "Object_38"]);

type Built = {
  base: THREE.Group;
  lid: THREE.Group; // pivot at HINGE, children in lid-local space
  screenMesh: THREE.Mesh;
  /** Screen corners in LID-LOCAL space: top-left, top-right, bottom-right, bottom-left (as seen from the front). */
  corners: [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3];
  uvBox: { u0: number; u1: number; v0: number; v1: number };
  aspect: number; // physical width / height of the glass
};

let gltfPromise: Promise<THREE.Group> | null = null;
const loadModel = () => {
  if (!gltfPromise) {
    const draco = new DRACOLoader();
    draco.setDecoderPath(staticFile(DRACO));
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
    gltfPromise = loader.loadAsync(staticFile(MODEL)).then((g) => g.scene);
  }
  return gltfPromise;
};

const texCache = new Map<string, Promise<THREE.Texture>>();
const resolveSrc = (p: string) => (/^(https?:|data:|blob:|\/)/.test(p) ? p : staticFile(p));
const loadTexture = (p: string) => {
  const url = resolveSrc(p);
  let t = texCache.get(url);
  if (!t) {
    t = new THREE.TextureLoader().loadAsync(url).then((tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 16;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      return tex;
    });
    texCache.set(url, t);
  }
  return t;
};

/** Split every mesh into base and lid triangles, bake transforms, build materials. */
const build = (src: THREE.Group, finish: "spaceBlack" | "silver"): Built => {
  src.updateMatrixWorld(true);
  const base = new THREE.Group();
  const lid = new THREE.Group();
  lid.position.copy(HINGE);
  let screenMesh: THREE.Mesh | null = null;
  const tint = finish === "spaceBlack" ? new THREE.Color(0.046, 0.048, 0.053) : null;
  const tmp = new THREE.Vector3();
  const c = new THREE.Vector3();

  src.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || HIDE.has(m.name)) return;
    const g = m.geometry.clone();
    g.applyMatrix4(m.matrixWorld);
    const pos = g.getAttribute("position");
    const index = g.getIndex();
    const tri = index ? index.count / 3 : pos.count / 3;
    const at = (i: number) => (index ? index.getX(i) : i);
    const baseIdx: number[] = [];
    const lidIdx: number[] = [];
    for (let t = 0; t < tri; t++) {
      const a = at(t * 3), b = at(t * 3 + 1), d = at(t * 3 + 2);
      c.set(0, 0, 0)
        .add(tmp.fromBufferAttribute(pos, a))
        .add(tmp.fromBufferAttribute(pos, b))
        .add(tmp.fromBufferAttribute(pos, d))
        .multiplyScalar(1 / 3);
      // The base never rises above the key tops (y 0.35); everything above, or leaning back off the
      // hinge, is lid. Mapped from the mesh's own triangles around the hinge.
      const isLid = c.y > 0.45 || (c.z < -13.1 && c.y > -0.2);
      (isLid ? lidIdx : baseIdx).push(a, b, d);
    }

    let mat = (m.material as THREE.MeshStandardMaterial).clone();
    if (!KEEP.has(m.name)) {
      // Body: one clean anodised finish. Dropping the packed maps also drops the logo, which the
      // model carries only as a gloss difference in the lid's roughness map.
      mat.map = null;
      mat.metalnessMap = null;
      mat.roughnessMap = null;
      mat.color = tint ?? new THREE.Color(0.62, 0.63, 0.65);
      mat.metalness = tint ? 0.7 : 0.9;
      mat.roughness = tint ? 0.36 : 0.3;
      mat.envMapIntensity = 1;
    }

    if (m.name === SCREEN_NODE) {
      // Black glass that shows the content as light and still reflects the room on top of it.
      mat = new THREE.MeshPhysicalMaterial({
        color: 0x000000,
        roughness: 0.06,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.04,
        emissive: 0xffffff,
        emissiveIntensity: 1,
        envMapIntensity: 0.3,
      });
      mat.toneMapped = false;
    }

    const add = (idx: number[], group: THREE.Group, offset: THREE.Vector3 | null) => {
      if (!idx.length) return null;
      const gg = g.clone();
      gg.setIndex(idx);
      if (offset) gg.translate(-offset.x, -offset.y, -offset.z);
      gg.computeBoundingSphere();
      const mesh = new THREE.Mesh(gg, mat);
      mesh.name = m.name;
      mesh.renderOrder = mat.transparent ? 2 : 0;
      group.add(mesh);
      return mesh;
    };
    add(baseIdx, base, null);
    const lm = add(lidIdx, lid, HINGE);
    if (m.name === SCREEN_NODE && lm) screenMesh = lm;
  });
  if (!screenMesh) throw new Error("RealLaptop: screen mesh not found");

  // Glass corners and UV box, in lid-local space.
  const sm = screenMesh as THREE.Mesh;
  const p = sm.geometry.getAttribute("position");
  const uv = sm.geometry.getAttribute("uv");
  let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
  let xMin = Infinity, xMax = -Infinity, sMin = Infinity, sMax = -Infinity;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const s = v.dot(LID_DIR);
    xMin = Math.min(xMin, v.x);
    xMax = Math.max(xMax, v.x);
    sMin = Math.min(sMin, s);
    sMax = Math.max(sMax, s);
    if (uv) {
      u0 = Math.min(u0, uv.getX(i));
      u1 = Math.max(u1, uv.getX(i));
      v0 = Math.min(v0, uv.getY(i));
      v1 = Math.max(v1, uv.getY(i));
    }
  }
  // Mean offset of the glass along the lid's normal (it is flat).
  const n = new THREE.Vector3(0, LID_DIR.z * -1, LID_DIR.y).normalize(); // front-facing normal
  let off = 0;
  for (let i = 0; i < p.count; i++) off += v.fromBufferAttribute(p, i).dot(n);
  off /= p.count;
  const pt = (x: number, s: number) => new THREE.Vector3(x, 0, 0).addScaledVector(LID_DIR, s).addScaledVector(n, off + 0.004);
  const corners: Built["corners"] = [pt(xMin, sMax), pt(xMax, sMax), pt(xMax, sMin), pt(xMin, sMin)];
  return {
    base,
    lid,
    screenMesh: sm,
    corners,
    uvBox: { u0, u1, v0, v1 },
    aspect: (xMax - xMin) / (sMax - sMin),
  };
};

/* ------------------------------------------------------------------ keyframes */

const DEFAULT_EASE = Easing.bezier(0.45, 0, 0.2, 1);

const track = (keys: LidKey[] | number | undefined, frame: number, fallback: number) => {
  if (keys === undefined) return fallback;
  if (typeof keys === "number") return keys;
  if (!keys.length) return fallback;
  if (frame <= keys[0].at) return keys[0].open;
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (frame <= b.at) {
      const t = (b.ease ?? DEFAULT_EASE)(Math.min(1, Math.max(0, (frame - a.at) / Math.max(1, b.at - a.at))));
      return a.open + (b.open - a.open) * t;
    }
  }
  return keys[keys.length - 1].open;
};

const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export const cameraAt = (cam: RealLaptopProps["camera"], frame: number): Omit<CamKey, "at"> => {
  if (!cam) return HERO;
  if (!Array.isArray(cam)) return cam;
  if (frame <= cam[0].at) return cam[0];
  for (let i = 1; i < cam.length; i++) {
    const a = cam[i - 1], b = cam[i];
    if (frame <= b.at) {
      const t = (b.ease ?? DEFAULT_EASE)(Math.min(1, Math.max(0, (frame - a.at) / Math.max(1, b.at - a.at))));
      // Orbit, not a straight line: the offset from the target turns and changes length, so a swing
      // from above to the side never cuts in closer than either end (a chord would).
      const target = lerp3(a.target, b.target, t);
      const oa = new THREE.Vector3(a.pos[0] - a.target[0], a.pos[1] - a.target[1], a.pos[2] - a.target[2]);
      const ob = new THREE.Vector3(b.pos[0] - b.target[0], b.pos[1] - b.target[1], b.pos[2] - b.target[2]);
      const len = oa.length() + (ob.length() - oa.length()) * t;
      const q = new THREE.Quaternion().setFromUnitVectors(oa.clone().normalize(), ob.clone().normalize());
      const dir = oa.clone().normalize().applyQuaternion(new THREE.Quaternion().slerp(q, t)).multiplyScalar(len);
      return { pos: [target[0] + dir.x, target[1] + dir.y, target[2] + dir.z], target, fov: (a.fov ?? 30) + ((b.fov ?? 30) - (a.fov ?? 30)) * t };
    }
  }
  return cam[cam.length - 1];
};

/* ------------------------------------------------------------------ ready-made shots */

/** Three-quarter hero, from the front left and a little above, like Raylight's MacBook template. */
export const HERO: Omit<CamKey, "at"> = { pos: [-52, 38, 92], target: [0, 6, -4], fov: 30 };

/** The glass centre and its front normal when the lid is fully open (world space). */
export const SCREEN_CENTER: Vec3 = [0, 11.75, -16.95];
const SCREEN_NORMAL: Vec3 = [0, Math.sin(0.3474), Math.cos(0.3474)];

/**
 * A camera that looks square-on at a point of the open screen, close enough that `fill` of the
 * frame's width is glass. u,v in 0..1 across the glass (0,0 top-left). fill 1 = glass edge to edge.
 */
export const onScreen = (u: number, v: number, fill: number, aspect: number, fov = 30, glassAspect = 1.55): Omit<CamKey, "at"> => {
  const gw = 34.38; // glass width
  const gh = gw / glassAspect;
  const up: Vec3 = [0, Math.cos(0.3474), -Math.sin(0.3474)];
  const p: Vec3 = [
    -gw / 2 + u * gw,
    SCREEN_CENTER[1] + (0.5 - v) * gh * up[1],
    SCREEN_CENTER[2] + (0.5 - v) * gh * up[2],
  ];
  const hfov = 2 * Math.atan(Math.tan((fov * Math.PI) / 360) * aspect);
  const d = (gw / fill / 2) / Math.tan(hfov / 2);
  return { pos: [p[0] + SCREEN_NORMAL[0] * d, p[1] + SCREEN_NORMAL[1] * d, p[2] + SCREEN_NORMAL[2] * d], target: p, fov };
};

/**
 * The standard sequence: seen from above on the desk, shut; the lid opens while the camera comes
 * down to the three-quarter hero; then a push-in until the glass fills the frame.
 * Returns camera and lid keyframes starting at `from`.
 */
export const laptopIntro = (opts: { from?: number; aspect: number; openAt?: number; heroAt?: number; pushAt?: number; pushEnd?: number; push?: Omit<CamKey, "at"> }) => {
  const f = opts.from ?? 0;
  const openAt = f + (opts.openAt ?? 14);
  const heroAt = f + (opts.heroAt ?? 62);
  const pushAt = f + (opts.pushAt ?? 96);
  const pushEnd = f + (opts.pushEnd ?? 140);
  // Poses are a direction and a distance that fits the laptop to the frame, so the same shot
  // works at 9:16 and 16:9 (portrait needs the camera much further back).
  const fov = 30;
  const tanV = Math.tan((fov * Math.PI) / 360);
  const fit = (w: number, d: number) => Math.max(w / 2 / (tanV * opts.aspect), d / 2 / tanV);
  const pose = (dir: Vec3, target: Vec3, dist: number): Omit<CamKey, "at"> => {
    const n = Math.hypot(...dir);
    return { pos: [target[0] + (dir[0] / n) * dist, target[1] + (dir[1] / n) * dist, target[2] + (dir[2] / n) * dist], target, fov };
  };
  const above = pose([-0.14, 1, 0.5], [0, 3, 0], fit(46, 46));
  const hero = opts.aspect < 1 ? pose([-0.5, 0.33, 0.8], [2, 6, -4], fit(52, 46)) : pose([-0.5, 0.33, 0.8], [0, 7, -4], fit(50, 46));
  const push = opts.push ?? onScreen(0.5, 0.5, 1.02, opts.aspect);
  const camera: CamKey[] = [
    { at: f, ...above },
    { at: heroAt, ...hero, ease: Easing.bezier(0.55, 0, 0.15, 1) },
    { at: pushAt, ...hero },
    { at: pushEnd, ...push, ease: Easing.bezier(0.6, 0, 0.1, 1) },
  ];
  const lid: LidKey[] = [
    { at: openAt, open: 0 },
    { at: openAt + 34, open: 1, ease: Easing.bezier(0.3, 0, 0.15, 1) },
  ];
  return { camera, lid };
};

/* ------------------------------------------------------------------ projection (for node screens and for pinning things to the glass) */

const makeCam = (c: Omit<CamKey, "at">, w: number, h: number) => {
  const cam = new THREE.PerspectiveCamera(c.fov ?? 30, w / h, 1, 3000);
  cam.position.set(...c.pos);
  cam.lookAt(new THREE.Vector3(...c.target));
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();
  return cam;
};

const lidMatrix = (open: number, spin: number) => {
  const m = new THREE.Matrix4().makeRotationY(spin);
  m.multiply(new THREE.Matrix4().makeTranslation(HINGE.x, HINGE.y, HINGE.z));
  m.multiply(new THREE.Matrix4().makeRotationX((1 - open) * OPEN_ANGLE));
  return m;
};

/** Frame-pixel corners of the glass (TL, TR, BR, BL) for a camera, lid and spin. */
export const glassQuad = (corners: Built["corners"], cam: Omit<CamKey, "at">, open: number, spin: number, w: number, h: number) => {
  const camera = makeCam(cam, w, h);
  const m = lidMatrix(open, spin);
  return corners.map((c) => {
    const v = c.clone().applyMatrix4(m).project(camera);
    return { x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h, z: v.z };
  });
};

/** CSS matrix3d that maps a W x H box onto the quad (TL, TR, BR, BL). */
const quadMatrix = (W: number, H: number, q: { x: number; y: number }[]) => {
  const [p0, p1, p2, p3] = q;
  const dx1 = p1.x - p2.x, dx2 = p3.x - p2.x, dx3 = p0.x - p1.x + p2.x - p3.x;
  const dy1 = p1.y - p2.y, dy2 = p3.y - p2.y, dy3 = p0.y - p1.y + p2.y - p3.y;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / den;
  const hh = (dx1 * dy3 - dx3 * dy1) / den;
  const a = p1.x - p0.x + g * p1.x, b = p3.x - p0.x + hh * p3.x, c = p0.x;
  const d = p1.y - p0.y + g * p1.y, e = p3.y - p0.y + hh * p3.y, f = p0.y;
  return `matrix3d(${a / W},${d / W},0,${g / W},${b / H},${e / H},0,${hh / H},0,0,1,0,${c},${f},0,1)`;
};

/* ------------------------------------------------------------------ the scene */

/**
 * A dark photo studio, built in code (no HDR file to licence): black walls, one big soft key above
 * and in front, a strip light at each side for the edge highlights that make aluminium read as
 * metal, and a faint warm-red bounce from the floor to tie the body to the brand glow.
 */
const studio = () => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050505);
  // Soft-edged light: a radial falloff baked into the panel, like the diffusion on a real softbox.
  const cv = document.createElement("canvas");
  cv.width = cv.height = 128;
  const ctx = cv.getContext("2d")!;
  const gr = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "#fff");
  gr.addColorStop(0.55, "#bbb");
  gr.addColorStop(1, "#000");
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, 128, 128);
  const soft = new THREE.CanvasTexture(cv);
  const panel = (w: number, h: number, color: number, intensity: number, pos: Vec3, look: Vec3) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), map: soft, side: THREE.DoubleSide }),
    );
    m.position.set(...pos);
    m.lookAt(new THREE.Vector3(...look));
    scene.add(m);
  };
  panel(22, 22, 0xffffff, 1.5, [0, 9, -2], [0, 0, 0]); // big overhead softbox: the sheen across lid and deck
  panel(2, 12, 0xffffff, 3.2, [-8, 2, -1], [0, 0, 0]); // left strip: edge highlights
  panel(2, 12, 0xffffff, 2.0, [8, 2.5, -3], [0, 0, 0]); // right strip
  panel(14, 3, 0xffffff, 1.2, [0, 3, -9], [0, 0, 0]); // back rim
  panel(18, 8, 0xd9202e, 0.5, [0, -6, 4], [0, 0, 0]); // red floor bounce
  return scene;
};

const Scene: React.FC<{
  built: Built;
  open: number;
  spin: number;
  screenTex: THREE.Texture | null;
  scroll: number;
  glow: number;
  shadow: boolean;
}> = ({ built, open, spin, screenTex, scroll, glow, shadow }) => {
  const gl = useThree((s) => s.gl);
  const env = useMemo(() => {
    // A studio environment generated in code: no HDR file to licence.
    const pm = new THREE.PMREMGenerator(gl);
    const tex = pm.fromScene(studio(), 0.02).texture;
    pm.dispose();
    return tex;
  }, [gl]);

  const shadowTex = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = 256;
    cv.height = 256;
    const ctx = cv.getContext("2d")!;
    const gr = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, "rgba(0,0,0,0.85)");
    gr.addColorStop(0.45, "rgba(0,0,0,0.55)");
    gr.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(cv);
    return t;
  }, []);

  // Screen texture placement: cover the glass, anchored at the top, `scroll` pans down a tall capture.
  const mat = built.screenMesh.material as THREE.MeshPhysicalMaterial;
  if (screenTex) {
    const img = screenTex.image as { width: number; height: number };
    const ia = img.width / img.height;
    const { u0, u1, v0, v1 } = built.uvBox;
    let sx0 = 0, sx1 = 1, sy0 = 0, sy1 = 1; // image window, y from the top
    if (ia < built.aspect) {
      const frac = ia / built.aspect;
      sy0 = (1 - frac) * scroll;
      sy1 = sy0 + frac;
    } else {
      const frac = built.aspect / ia;
      sx0 = (1 - frac) / 2;
      sx1 = sx0 + frac;
    }
    // Texture is loaded flipY = true, so texture v = 1 is the image top. Glass UV v1 is the top.
    const rx = (sx1 - sx0) / (u1 - u0);
    const ry = (sy1 - sy0) / (v1 - v0);
    screenTex.repeat.set(rx, ry);
    screenTex.offset.set(sx0 - u0 * rx, 1 - sy1 - v0 * ry);
    screenTex.wrapS = screenTex.wrapT = THREE.ClampToEdgeWrapping;
    screenTex.needsUpdate = true;
    mat.emissiveMap = screenTex;
  } else {
    mat.emissiveMap = null;
  }
  mat.emissiveIntensity = glow;
  mat.emissive.set(screenTex ? 0xffffff : 0x000000);
  mat.needsUpdate = true;

  return (
    <>
      <primitive object={env} attach="environment" />
      <directionalLight position={[-40, 80, 60]} intensity={1.1} />
      <directionalLight position={[60, 30, -40]} intensity={0.6} color="#ffd9d9" />
      <group rotation={[0, spin, 0]}>
        <primitive object={built.base} />
        <primitive object={built.lid} rotation={[(1 - open) * OPEN_ANGLE, 0, 0]} />
        {shadow ? (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, DESK_Y - 0.02, 0.5]} renderOrder={-1}>
            <planeGeometry args={[52, 40]} />
            <meshBasicMaterial map={shadowTex} transparent depthWrite={false} opacity={0.9} toneMapped={false} />
          </mesh>
        ) : null}
      </group>
    </>
  );
};

/* ------------------------------------------------------------------ component */

export const RealLaptop: React.FC<RealLaptopProps> = (props) => {
  const frame = useCurrentFrame();
  const { width: vw, height: vh, fps } = useVideoConfig();
  const w = props.width ?? vw;
  const h = props.height ?? vh;
  const finish = props.finish ?? "spaceBlack";
  const { delayRender, continueRender, cancelRender } = useDelayRender();

  const [model, setModel] = useState<THREE.Group | null>(null);
  const [handle] = useState(() => delayRender("RealLaptop: loading model and screen"));
  const [textures, setTextures] = useState<Map<string, THREE.Texture> | null>(null);

  const src = props.screen;
  const paths = useMemo(() => ("image" in src ? [src.image] : "frames" in src ? src.frames : []), [src]);

  useEffect(() => {
    let alive = true;
    Promise.all([loadModel(), Promise.all(paths.map((p) => loadTexture(p).then((t) => [p, t] as const)))])
      .then(([m, list]) => {
        if (!alive) return;
        setModel(m);
        setTextures(new Map(list));
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
    return () => {
      alive = false;
    };
  }, [paths, handle, continueRender, cancelRender]);

  const built = useMemo(() => (model ? build(model, finish) : null), [model, finish]);

  const cam = cameraAt(props.camera, frame);
  const open = Math.min(1, Math.max(0, track(props.lid, frame, 1)));
  const spin = track(props.spin, frame, 0);
  const scroll = Math.min(1, Math.max(0, track(props.scroll, frame, 0)));
  // The screen wakes as the lid passes about two thirds open, like the real thing.
  const glow = interpolate(open, [0.55, 0.9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  let tex: THREE.Texture | null = null;
  if (textures) {
    if ("image" in src) tex = textures.get(src.image) ?? null;
    else if ("frames" in src) {
      const sfps = src.fps ?? fps;
      const i = Math.floor(((frame - (src.startAt ?? 0)) / fps) * sfps);
      tex = textures.get(src.frames[Math.min(src.frames.length - 1, Math.max(0, i))]) ?? null;
    }
  }

  const camera = useMemo(() => new THREE.PerspectiveCamera(30, w / h, 1, 3000), [w, h]);
  camera.fov = cam.fov ?? 30;
  camera.aspect = w / h;
  camera.position.set(...cam.pos);
  camera.lookAt(new THREE.Vector3(...cam.target));
  camera.updateProjectionMatrix();

  const blurPx = track(props.blur, frame, 0);
  const fc = props.focus ?? { x: 0.5, y: 0.5 };
  const fr = (fc.radius ?? 0.45) * w;
  const focusMask = `radial-gradient(${fr}px ${fr * 0.8}px at ${fc.x * 100}% ${fc.y * 100}%, transparent 0%, transparent 45%, rgba(0,0,0,0.6) 75%, #000 100%)`;

  if (!built) return null;

  // A React node on the glass: projected with a perspective transform over the canvas.
  let nodeLayer: React.ReactNode = null;
  if ("node" in src) {
    const q = glassQuad(built.corners, cam, open, spin, w, h);
    const area = (q[1].x - q[0].x) * (q[3].y - q[0].y) - (q[1].y - q[0].y) * (q[3].x - q[0].x);
    const NW = props.nodeWidth ?? 1440;
    const NH = Math.round(NW / built.aspect);
    if (area > 0 && glow > 0) {
      nodeLayer = (
        <div style={{ position: "absolute", left: 0, top: 0, width: NW, height: NH, transformOrigin: "0 0", transform: quadMatrix(NW, NH, q), overflow: "hidden", opacity: glow, borderRadius: 10 }}>
          {src.node}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 32%, rgba(255,255,255,0) 48%)", pointerEvents: "none" }} />
        </div>
      );
    }
  }

  return (
    <AbsoluteFill style={{ width: w, height: h }}>
      <ThreeCanvas
        width={w}
        height={h}
        dpr={1}
        camera={camera}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        style={{ position: "absolute", inset: 0 }}
      >
        <Scene built={built} open={open} spin={spin} screenTex={tex} scroll={scroll} glow={glow} shadow={props.shadow ?? true} />
      </ThreeCanvas>
      {nodeLayer}
      {blurPx > 0.2 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backdropFilter: `blur(${blurPx}px)`,
            WebkitBackdropFilter: `blur(${blurPx}px)`,
            maskImage: focusMask,
            WebkitMaskImage: focusMask,
            pointerEvents: "none",
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
