import React from 'react';
import { AbsoluteFill, Composition, registerRoot, staticFile, useCurrentFrame } from 'remotion';
import { useZodiak } from '../../kit/parts';
import { JobScrollBrake } from './JobScrollBrake';

const DUR = 89;
const VIEW = { x: 24, y: 430, w: 1032, h: 1150 };
// howto/stills/list-tall.json: clip.y 211, goldman y 561 h 194.94 (CSS px), image is 2x
const TARGET = { y: (561 - 211) * 2, h: 194.9375 * 2 };

const Scene: React.FC = () => {
  useZodiak();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: '#0b0708' }}>
      <JobScrollBrake
        f={f}
        dur={DUR}
        src={staticFile('howto/stills/list-tall.png')}
        imgW={934}
        imgH={6980}
        target={TARGET}
        view={VIEW}
      />
    </AbsoluteFill>
  );
};

registerRoot(() => (
  <Composition id="Preview-JobScrollBrake" component={Scene} width={1080} height={1920} fps={30} durationInFrames={DUR} />
));
