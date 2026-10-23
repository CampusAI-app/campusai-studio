import React from 'react';
import { AbsoluteFill, Composition, Img, registerRoot, staticFile, useCurrentFrame } from 'remotion';
import { useZodiak } from '../../kit/parts';
import { NorthStarDeal } from './NorthStarDeal';

const DUR = 118;
// Crop of the real picker chips (screen CSS px in a 1440x900 capture).
const BOX = { x: 266, y: 176, w: 532, h: 50 };
const SIZE = { w: 860, h: Math.round((860 * BOX.h) / BOX.w) };

const Chips: React.FC = () => {
  const s = SIZE.w / BOX.w;
  return (
    <div style={{ position: 'relative', width: SIZE.w, height: SIZE.h, overflow: 'hidden', borderRadius: 16 }}>
      <Img
        src={staticFile('speedrun/run/f00428.jpg')}
        style={{ position: 'absolute', left: -BOX.x * s, top: -BOX.y * s, width: 1440 * s, height: 900 * s, maxWidth: 'none' }}
      />
    </div>
  );
};

const Shot: React.FC = () => {
  useZodiak();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: '#0b0708' }}>
      <NorthStarDeal
        f={f}
        dur={DUR}
        center={<Chips />}
        centerSize={SIZE}
        screens={[
          { src: staticFile('speedrun/run/f00036.jpg'), label: 'Job Match' },
          { src: staticFile('speedrun/run/f00861.jpg'), label: 'Events' },
          { src: staticFile('speedrun/run/f01553.jpg'), label: 'Organizations' },
          { src: staticFile('speedrun/run/f02020.jpg'), label: 'Resume Review' },
        ]}
      />
    </AbsoluteFill>
  );
};

const Root: React.FC = () => (
  <Composition id="Preview-NorthStarDeal" component={Shot} width={1080} height={1920} fps={30} durationInFrames={DUR} />
);

registerRoot(Root);
