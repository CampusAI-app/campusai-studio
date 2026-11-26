/**
 * The three Like proofs from the Nov 26 Muse pass, each one new kit part on CampusAI content (real crops of the CampusAI
 * app captured Nov 26 in the simulator, public/post-phone-walk/). Numbers come from the captures (films/post-phone-walk/facts.md).
 *   InlineIcon-Proof-9x16   Placed (Halmarr): the icon dropping into the headline
 *   FrostDepth-Proof-9x16   JustPaid (Halmarr): mesh gradient world, frosted cards in depth, giant type beside a tilted phone
 *   PillType-Proof-9x16     Pulse (thejimmy.vision): typed line with the key word in a pill, then the pill funnel
 */
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { INTER, useZodiak } from "../kit/parts";
import { B, Bed, Sfx, k, OUT } from "../kit/effects/shared";
import { InlineIcon } from "../kit/effects/InlineIcon";
import { MeshWorld, FrostCard } from "../kit/effects/FrostDepth";
import { PillType, PillFunnel } from "../kit/effects/PillType";
import { Phone3D, PhoneStage, ScreenPx, poseAt, PHONE_EASE, type PhonePose } from "../kit/effects/PhoneMove";

const P = (n: string) => staticFile(`post-phone-walk/${n}.png`);
const RED = B.color.accent;

export const PROOF = { fps: 30, w: 1080, h: 1920, inline: 135, frost: 165, pill: 180 };

const Mark: React.FC<{ light?: boolean; y?: number; o?: number }> = ({ light, y = 1700, o = 1 }) => (
  <div style={{ position: "absolute", left: 540 - 95, top: y, width: 190, opacity: o }}>
    <Img src={staticFile(light ? B.logo!.onLight : B.logo!.onDark)} style={{ width: "100%" }} />
  </div>
);

// ---------------------------------------------------------------- Placed: "Plan your [app icon] degree."
export const InlineIconProof: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const card = k(f, 52, 72, OUT);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(90% 55% at 50% 45%, #ffffff 0%, #f6eef0 55%, #efe3e6 100%)", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(40% 25% at 50% 47%, rgba(${B.color.glowRgb},0.12), rgba(0,0,0,0) 70%)` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 690, transform: `translateY(${-card * 120}px)` }}>
        <InlineIcon f={f} fps={fps} at={-4} before="Plan your" after="degree." icon={P("app-icon")} size={90} font={INTER} weight={600} ink="#1b1214" afterInk={RED} drop={12} />
      </div>
      <div style={{ position: "absolute", left: 540 - 360, top: 900 + (1 - card) * 80, width: 720, opacity: card, borderRadius: 30, overflow: "hidden",
        boxShadow: "0 30px 70px rgba(90,20,30,0.25)" }}>
        <Img src={P("chip-takenext")} style={{ width: "100%", display: "block" }} />
      </div>
      <Mark light o={k(f, 80, 96)} y={1640} />
      <Sfx on at={18} name="switch-tap" volume={0.5} />
      <Sfx on at={52} name="paper-slide" volume={0.4} />
      <Bed total={PROOF.inline} on volume={0.3} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- JustPaid: frosted cards in depth, giant type beside a tilted phone
const FROST_POSE: PhonePose[] = [
  { t: 0, x: 300, y: 1260, ry: 34, rz: -8, rx: 6, s: 0.92, z: -60 },
  { t: 40, x: 330, y: 1190, ry: 26, rz: -6, rx: 4, s: 0.96, z: 0, ease: PHONE_EASE.land },
  { t: 165, x: 345, y: 1170, ry: 20, rz: -5, rx: 3, s: 0.98, z: 20 },
];
export const FrostDepthProof: React.FC = () => {
  useZodiak();
  const f = useCurrentFrame();
  const drift = f / PROOF.frost;
  const pose = poseAt(FROST_POSE, f);
  const t1 = k(f, 30, 46, OUT);
  const t2 = k(f, 46, 62, OUT);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <MeshWorld t={f} />
      <PhoneStage perspective={2200}>
        <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}>
          <FrostCard x={250} y={360} z={-260} w={360} src={P("chip-gened")} ratio={486 / 214} drift={drift} rz={-5} opacity={k(f, 0, 14)} />
          <FrostCard x={860} y={520} z={-180} w={330} src={P("chip-electives")} ratio={486 / 214} drift={drift} rz={4} opacity={k(f, 4, 18)} />
          <Phone3D width={520} pose={pose} screen={<ScreenPx width={520}><Img src={P("req-top")} style={{ width: 1206, height: 2622 }} /></ScreenPx>} />
          <FrostCard x={830} y={1640} z={120} w={420} src={P("chip-aosc123")} ratio={1126 / 440} drift={drift} rz={-3} opacity={k(f, 10, 24)} />
          <FrostCard x={170} y={1720} z={240} w={300} src={P("chip-core")} ratio={486 / 262} drift={drift} rz={6} opacity={k(f, 14, 28)} />
        </div>
      </PhoneStage>
      <div style={{ position: "absolute", left: 585, top: 940, width: 480, fontFamily: "Zodiak", fontWeight: 700, fontSize: 104, lineHeight: 0.98, letterSpacing: "-0.03em", color: "#fff",
        textShadow: "0 10px 40px rgba(120,40,90,0.25)" }}>
        <div style={{ opacity: t1, transform: `translateX(${(1 - t1) * 80}px)` }}>Every</div>
        <div style={{ opacity: t1, transform: `translateX(${(1 - t1) * 80}px)` }}>credit,</div>
        <div style={{ opacity: t2, transform: `translateX(${(1 - t2) * 80}px)`, color: "#7d2a6b", fontStyle: "italic", fontWeight: 400 }}>counted.</div>
      </div>
      <Mark y={150} o={k(f, 4, 18) * 0.95} />
      <Sfx on at={30} name="transition-soft" volume={0.4} />
      <Bed total={PROOF.frost} on volume={0.3} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- Pulse: typed line with the key word in a pill, then the funnel of pills
export const PillTypeProof: React.FC = () => {
  const f = useCurrentFrame();
  const lineUp = k(f, 70, 88, OUT);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(110% 55% at 50% 110%, rgba(${B.color.glowRgb},0.3), rgba(0,0,0,0) 62%), ${B.color.bgDeep}`, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 820 - lineUp * 260 }}>
        <PillType f={f} at={-2} runs={[{ text: "Which classes actually " }, { text: "count", pill: true }, { text: "?" }]} breaks={[1]}
          size={96} font={INTER} weight={600} ink={B.color.ink} pillBg={RED} pillInk="#fff" speed={1.1} />
      </div>
      <div style={{ position: "absolute", left: 60, top: 1010, opacity: k(f, 80, 92) }}>
        <PillFunnel f={f} at={84} every={14} size={74} font={INTER} pill="#1d1517" pillInk="#fff" soft="#b9a6a2" accent={RED} drift={330}
          steps={[{ value: "120", label: "credits to graduate" }, { value: "61", label: "earned", tag: "51%" }, { value: "18", label: "this term", tag: "15%" }]} />
      </div>
      <Mark y={1660} o={k(f, 120, 136)} />
      {[4, 16, 28].map((a) => <Sfx key={a} on at={a} name="typewriter-hit-soft" volume={0.28} />)}
      <Sfx on at={84} name="switch-tap" volume={0.4} />
      <Sfx on at={98} name="switch-tap" volume={0.4} />
      <Sfx on at={112} name="switch-tap" volume={0.4} />
      <Bed total={PROOF.pill} on volume={0.3} />
    </AbsoluteFill>
  );
};
