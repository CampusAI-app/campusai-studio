import React from 'react';
import { AbsoluteFill, Composition, Img, registerRoot, staticFile, useCurrentFrame } from 'remotion';
import { useZodiak } from '../../kit/parts';
import { ScanBrackets } from './ScanBrackets';

const DUR = 89;
const VIEW = { x: 24, y: 430, w: 1032, h: 1150 };
// the film's camera at this beat: cw 660, centred on x 600, clamped y 367 (screen CSS px)
const CAM = { cx: 600, cy: 367, cw: 660 };
const S = VIEW.w / CAM.cw;
const toCanvas = (x: number, y: number) => ({ x: VIEW.x + VIEW.w / 2 + (x - CAM.cx) * S, y: VIEW.y + VIEW.h / 2 + (y - CAM.cy) * S });
// the requirement rows, "4 lines land" down to the last check row
const A = toCanvas(282, 150);
const B = toCanvas(896, 600);
const RECT = { x: A.x, y: A.y, w: B.x - A.x, h: B.y - A.y };

const Scene: React.FC = () => {
  useZodiak();
  const f = useCurrentFrame();
  const o = toCanvas(0, 0);
  return (
    <AbsoluteFill style={{ background: '#0b0708' }}>
      <div style={{ position: 'absolute', left: VIEW.x, top: VIEW.y, width: VIEW.w, height: VIEW.h, overflow: 'hidden', borderRadius: 34 }}>
        <Img src={staticFile('speedrun/run/f01553.jpg')} style={{ position: 'absolute', left: o.x - VIEW.x, top: o.y - VIEW.y, width: 1440 * S, height: 900 * S, maxWidth: 'none' }} />
      </div>
      <ScanBrackets f={f} dur={DUR} rect={RECT} />
    </AbsoluteFill>
  );
};

registerRoot(() => (
  <Composition id="Preview-ScanBrackets" component={Scene} width={1080} height={1920} fps={30} durationInFrames={DUR} />
));
