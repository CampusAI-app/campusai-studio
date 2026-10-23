import React from 'react';
import { AbsoluteFill, Composition, registerRoot, staticFile, useCurrentFrame } from 'remotion';
import { useZodiak } from '../../kit/parts';
import { WhyDepthLayers } from './WhyDepthLayers';

const DUR = 103;
type Page = { x: number; y: number; s: number };
// detail panel (CSS x 742..1366) centred in VIEW at s 1.6; --props '{"page":{...}}' tries another camera
const PAGE: Page = { x: 41 - 742 * 1.6, y: 430 - 60 * 1.6, s: 1.6 };

const Scene: React.FC<{ page: Page }> = ({ page }) => {
  useZodiak();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: '#0b0708' }}>
      <WhyDepthLayers
        f={f}
        dur={DUR}
        src={staticFile('speedrun/run/f00861.jpg')}
        page={page}
        layers={[
          { x: 742, y: 88, w: 624, h: 160 }, // job title and buttons
          { x: 742, y: 462, w: 624, h: 176 }, // About this role, through its last bullet
        ]}
        hero={{ x: 742, y: 258, w: 624, h: 200 }} // Why this fits you, panel top to its divider
        view={{ x: 24, y: 430, w: 1032, h: 1150 }}
      />
    </AbsoluteFill>
  );
};

registerRoot(() => (
  <Composition id="Preview-WhyDepthLayers" component={Scene} defaultProps={{ page: PAGE }} width={1080} height={1920} fps={30} durationInFrames={DUR} />
));
