import React from 'react';
import { AbsoluteFill, Composition, registerRoot, useCurrentFrame } from 'remotion';
import { useZodiak } from '../../kit/parts';
import { PILL_CHIP_HOOK_DURATION, PillChipHook } from './PillChipHook';

const Scene: React.FC = () => {
  useZodiak();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: '#0b0708' }}>
      <PillChipHook
        f={f}
        dur={PILL_CHIP_HOOK_DURATION}
        prefix={['How to find an', 'internship that']}
        words={['pays well', 'is remote', 'actually fits you']}
      />
    </AbsoluteFill>
  );
};

const Root: React.FC = () => (
  <Composition
    id="Preview-PillChipHook"
    component={Scene}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={PILL_CHIP_HOOK_DURATION}
  />
);

registerRoot(Root);
