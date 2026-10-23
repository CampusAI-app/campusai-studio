/**
 * Short previews of the kit parts, for the Studio page (2026-10-22). Their own entry point
 * (`shelf-entry.ts`), so Root.tsx is never edited for them:
 *   npx remotion render src/kit/shelf-entry.ts Kit-PageCamera out/kit/Kit-PageCamera.mp4
 * Every preview uses a real campusai-demo capture and the real logo.
 */
import React from "react";
import { AbsoluteFill, Composition, staticFile, useCurrentFrame } from "remotion";
import { brand } from "./brand";
import { camAlong, toCanvas } from "./camera";
import { PageView } from "./PageView";
import { PointerAt } from "./Pointer";
import { LogoEnd, LogoOpen } from "./LogoMoment";
import { ChatRecording } from "./ChatRecording";

const B = brand("campusai");
const W = 1080;
const H = 1350;
const FPS = 30;

const Ground: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: B.color.bgDeep, backgroundImage: B.color.gradient }}>{children}</AbsoluteFill>
);

const LogoOpenPreview: React.FC = () => (
  <Ground>
    <LogoOpen brand={B} at={4} x={540} y={675} width={640} settle={{ at: 42, x: 540, y: 130, width: 230 }} />
  </Ground>
);

const LogoEndPreview: React.FC = () => (
  <Ground>
    <LogoEnd brand={B} at={6} x={540} y={675} width={560} />
  </Ground>
);

const PAGE = { w: 1440, h: 900 };
const VIEW = { x: 40, y: 362, w: 1000, h: 625 };
const CAMS = [
  { t: 0, cam: { cx: 720, cy: 450, cw: 1440 } },
  { t: 28, cam: { cx: 720, cy: 450, cw: 1440 } },
  { t: 62, cam: { cx: 470, cy: 330, cw: 760 } },
  { t: 118, cam: { cx: 470, cy: 330, cw: 760 } },
  { t: 150, cam: { cx: 720, cy: 450, cw: 1440 } },
];
const PAGE_CameraPreview: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAlong(f, CAMS);
  // the pointer travels on the page and clicks once; the camera arrives before it does
  const k = Math.min(1, Math.max(0, (f - 30) / 44));
  const ease = 1 - Math.pow(1 - k, 3);
  const px = 980 + (420 - 980) * ease;
  const py = 700 + (300 - 700) * ease;
  const p = toCanvas(cam, VIEW, px, py);
  const since = f >= 82 ? (f - 82) / FPS : null;
  return (
    <Ground>
      <PageView src={staticFile("howto/stills/jobmatch.jpg")} page={PAGE} cam={cam} view={VIEW} brand={B} />
      <PointerAt x={p.x} y={p.y} since={since} accent={B.color.accent} />
    </Ground>
  );
};

// Run `npm run chat examples/study-spots.json` first: the real chat, then the logo the piece ends on.
const ChatRecordingPreview: React.FC = () => {
  const f = useCurrentFrame();
  const out = Math.min(1, Math.max(0, (f - 300) / 12));
  return (
    <AbsoluteFill style={{ background: B.color.bgDeep }}>
      <ChatRecording src="study-spots/chat/frames.json" style={{ opacity: 1 - out }} />
      <LogoEnd brand={B} at={306} x={540} y={960} width={560} />
    </AbsoluteFill>
  );
};

export const KitShelfRoot: React.FC = () => (
  <>
    <Composition id="Kit-LogoOpen" component={LogoOpenPreview} durationInFrames={75} fps={FPS} width={W} height={H} />
    <Composition id="Kit-LogoEnd" component={LogoEndPreview} durationInFrames={100} fps={FPS} width={W} height={H} />
    <Composition id="Kit-ChatRecording" component={ChatRecordingPreview} durationInFrames={360} fps={FPS} width={1080} height={1920} />
    <Composition id="Kit-PageCamera" component={PAGE_CameraPreview} durationInFrames={170} fps={FPS} width={W} height={H} />
  </>
);
