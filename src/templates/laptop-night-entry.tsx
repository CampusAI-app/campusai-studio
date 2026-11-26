// Remotion entry for the "Laptop at night" template (2026-11-25), kept out of Root.tsx.
// A new film is a new JSON file shaped like laptop-night.example.json, passed as props:
//   npx remotion render src/templates/laptop-night-entry.tsx Template-LaptopNight-9x16 out/my-film.mp4 --gl=angle --props=path/to/my-film.json
// On Jacob's Mac public/ is huge: render with the Node API and symlinkPublicDir: true instead (see LaptopNight.tsx).
import React from "react";
import { Composition, registerRoot } from "remotion";
import { LaptopNight, LN45_H, LN_FPS, LN_H, LN_W, calculateLaptopNightMetadata, laptopNightFrames, type LaptopNightProps } from "./LaptopNight";
import example from "./laptop-night.example.json";

const defaults = example as LaptopNightProps;

const Root: React.FC = () => (
  <>
    <Composition id="Template-LaptopNight-9x16" component={LaptopNight} durationInFrames={laptopNightFrames(defaults)} fps={LN_FPS} width={LN_W} height={LN_H}
      defaultProps={defaults} calculateMetadata={calculateLaptopNightMetadata} />
    {/* the same film reframed for the feed: captions higher, the product a little lower */}
    <Composition id="Template-LaptopNight-4x5" component={LaptopNight} durationInFrames={laptopNightFrames(defaults)} fps={LN_FPS} width={LN_W} height={LN45_H}
      defaultProps={defaults} calculateMetadata={calculateLaptopNightMetadata} />
  </>
);
registerRoot(Root);
