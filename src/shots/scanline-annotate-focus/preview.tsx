import React from 'react';
import { AbsoluteFill, Composition, registerRoot, useCurrentFrame } from 'remotion';
import { useZodiak } from '../../kit/parts';
import { POSTING_SCAN_DURATION, PostingScan } from './PostingScan';

const Scene: React.FC = () => {
  useZodiak();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: '#0b0708' }}>
      <PostingScan f={f} dur={POSTING_SCAN_DURATION} />
    </AbsoluteFill>
  );
};

registerRoot(() => (
  <Composition id="Preview-PostingScan" component={Scene} width={1080} height={1920} fps={30} durationInFrames={POSTING_SCAN_DURATION} />
));
