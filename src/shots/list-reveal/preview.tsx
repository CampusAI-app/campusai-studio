import React from 'react';
import { AbsoluteFill, Composition, registerRoot, useCurrentFrame } from 'remotion';
import { useZodiak } from '../../kit/parts';
import { STEPS_LIST_REVEAL_DURATION, StepsListReveal } from './StepsListReveal';
import { ArrowIcon, BriefcaseIcon, DocIcon, SparkIcon, StepTile } from './tiles';

const ROWS = [
  { icon: <StepTile><SparkIcon /></StepTile>, step: 'Step 1', label: 'Pick your North Star' },
  { icon: <StepTile><BriefcaseIcon /></StepTile>, step: 'Step 2', label: 'Find jobs that fit you' },
  { icon: <StepTile><DocIcon /></StepTile>, step: 'Step 3', label: 'Tailor your resume for that job' },
  { icon: <StepTile><ArrowIcon /></StepTile>, step: 'Step 4', label: 'Apply' },
];

const Scene: React.FC = () => {
  useZodiak();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: '#0b0708' }}>
      <StepsListReveal f={f} dur={STEPS_LIST_REVEAL_DURATION} title="in 4 steps" rows={ROWS} />
    </AbsoluteFill>
  );
};

const Root: React.FC = () => (
  <Composition
    id="Preview-StepsListReveal"
    component={Scene}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={STEPS_LIST_REVEAL_DURATION}
  />
);

registerRoot(Root);
