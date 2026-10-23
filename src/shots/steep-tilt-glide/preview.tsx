import React from 'react';
import { AbsoluteFill, Composition, Img, registerRoot, staticFile, useCurrentFrame } from 'remotion';
import { useZodiak } from '../../kit/parts';
import { SteepTiltGlideIn } from './SteepTiltGlideIn';

const VIEW = { x: 24, y: 430, w: 1032, h: 1150 };
const DUR = 74;

const Shot: React.FC = () => {
  useZodiak();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: '#0b0708' }}>
      <SteepTiltGlideIn f={f} dur={DUR} view={VIEW}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#130b0d' }}>
          <Img
            src={staticFile('speedrun/run/f00036.jpg')}
            style={{ position: 'absolute', left: 0, top: 0, width: 1440, height: 900, transform: `scale(${VIEW.w / 1440})`, transformOrigin: 'left top' }}
          />
        </div>
      </SteepTiltGlideIn>
    </AbsoluteFill>
  );
};

const Root: React.FC = () => (
  <Composition id="Preview-SteepTiltGlideIn" component={Shot} width={1080} height={1920} fps={30} durationInFrames={DUR} />
);

registerRoot(Root);
