import React from 'react';
import { AbsoluteFill, Composition, registerRoot, staticFile, useCurrentFrame } from 'remotion';
import { useZodiak } from '../../kit/parts';
import { JobCarousel3D } from './JobCarousel3D';

const DUR = 89;
const cards = Array.from({ length: 8 }, (_, i) => staticFile(`speedrun/cards/card${i}.png`));

const Shot: React.FC = () => {
  useZodiak();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: '#0b0708' }}>
      <JobCarousel3D f={f} dur={DUR} cards={cards} target={2} />
    </AbsoluteFill>
  );
};

const Root: React.FC = () => (
  <Composition id="Preview-JobCarousel3D" component={Shot} width={1080} height={1920} fps={30} durationInFrames={DUR} />
);

registerRoot(Root);
