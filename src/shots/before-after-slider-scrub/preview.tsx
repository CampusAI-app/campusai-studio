import React from 'react';
import { AbsoluteFill, Composition, Img, registerRoot, staticFile, useCurrentFrame } from 'remotion';
import { useZodiak } from '../../kit/parts';
import { RewriteSlider } from './RewriteSlider';

const DUR = 133;
const CUR = { x: 292, y: 524, w: 520, h: 44 };
const SUG = { x: 292, y: 572, w: 520, h: 44 };
const W = 940;
const H = Math.round((CUR.h * W) / CUR.w);

const Crop: React.FC<{ box: typeof CUR }> = ({ box }) => {
  const s = W / box.w;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <Img src={staticFile('speedrun/run/f01814.jpg')} style={{ position: 'absolute', left: -box.x * s, top: -box.y * s, width: 1440 * s, height: 900 * s, maxWidth: 'none' }} />
    </div>
  );
};

const Scene: React.FC<{ labels: boolean }> = ({ labels }) => {
  useZodiak();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: '#0b0708' }}>
      <RewriteSlider f={f} dur={DUR} x={70} y={860} w={W} h={H} before={<Crop box={CUR} />} after={<Crop box={SUG} />}
        beforeLabel={labels ? 'Your line' : undefined} afterLabel={labels ? 'Rewritten' : undefined} />
    </AbsoluteFill>
  );
};

registerRoot(() => (
  <Composition id="Preview-RewriteSlider" component={Scene} width={1080} height={1920} fps={30} durationInFrames={DUR} defaultProps={{ labels: false }} />
));
