import React from 'react';
import { AbsoluteFill, Composition, registerRoot, useCurrentFrame } from 'remotion';
import { useZodiak } from '../../kit/parts';
import { RESUME_REWRITE_DURATION, ResumeRewrite } from './ResumeRewrite';

const Scene: React.FC = () => {
  useZodiak();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: '#0b0708' }}>
      <ResumeRewrite f={f} dur={RESUME_REWRITE_DURATION} />
    </AbsoluteFill>
  );
};

registerRoot(() => (
  <Composition id="Preview-ResumeRewrite" component={Scene} width={1080} height={1920} fps={30} durationInFrames={RESUME_REWRITE_DURATION} />
));
