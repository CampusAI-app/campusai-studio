import React from 'react';
import { AbsoluteFill, Composition, registerRoot, staticFile, useCurrentFrame } from 'remotion';
import { useZodiak } from '../../kit/parts';
import { HubIcon, NorthStarHub } from './NorthStarHub';

const DUR = 133;

const Shot: React.FC = () => {
  useZodiak();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: '#0b0708' }}>
      <NorthStarHub
        f={f}
        dur={DUR}
        front={{ src: staticFile('speedrun/run/f00428.jpg'), box: { x: 240, y: 100, w: 960, h: 700 } }}
        roles={['Investment Banking Summer Analyst', 'Investment Banking Analyst']}
        nodes={[
          { icon: <HubIcon name="briefcase" />, title: 'Job Match', line: 'Ranks jobs closest to all of these roles first.' },
          { icon: <HubIcon name="book" />, title: 'Courses', line: 'Suggests classes that build toward your roles.' },
          { icon: <HubIcon name="user" />, title: 'Professors', line: "Notes when a professor's class fits one of your roles." },
        ]}
      />
    </AbsoluteFill>
  );
};

const Root: React.FC = () => (
  <Composition id="Preview-NorthStarHub" component={Shot} width={1080} height={1920} fps={30} durationInFrames={DUR} />
);

registerRoot(Root);
