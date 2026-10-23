import React from 'react';
import { AbsoluteFill, Composition, Img, registerRoot, staticFile, useCurrentFrame } from 'remotion';
import { useZodiak } from '../../kit/parts';
import { ContactLift } from './ContactLift';

const DUR = 89;
const SRC = staticFile('speedrun/run/f00861.jpg');
const box = { x: 742, y: 258, w: 624, h: 192 };
const from = { x: 300, y: 600, s: 1.5 };

const Shot: React.FC = () => {
  useZodiak();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: '#0b0708' }}>
      {/* stand-in for the film's page under the piece, in VIEW, at the same scale */}
      <div style={{ position: 'absolute', left: 24, top: 430, width: 1032, height: 1150, borderRadius: 34, overflow: 'hidden' }}>
        <Img src={SRC} style={{ position: 'absolute', left: from.x - box.x * from.s - 24, top: from.y - box.y * from.s - 430, width: 1440 * from.s, height: 900 * from.s, maxWidth: 'none' }} />
      </div>
      <ContactLift f={f} dur={DUR} src={SRC} box={box} from={from} />
    </AbsoluteFill>
  );
};

const Root: React.FC = () => (
  <Composition id="Preview-ContactLift" component={Shot} width={1080} height={1920} fps={30} durationInFrames={DUR} />
);

registerRoot(Root);
