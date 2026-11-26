// Remotion entry for the MonitorTour template ("Monitor in a dark room"), kept out of Root.tsx.
// Make a new film: copy monitor-tour.example.json, change the words and point the beats at your own recordings, then
// pass it as props (--props=path/to/your.json). The film times itself from the recordings when it loads.
// On a Mac without the room photo, the UMD M, the music or the sound effects (all kept off GitHub), the film still
// renders: the drawn room, no mark, no music, those cues skipped. A missing recording, page or still stops the render
// with a message naming the file and the command that makes it.
//
// Vertical only: the room is a vertical shot (a 16x9 would need its own room plate).
//
// public/ is very large on some Macs, so render with the public folder linked, not copied:
//   npx remotion render src/templates/monitor-tour-entry.tsx Template-MonitorTour-9x16 out/my-film.mp4 --gl=angle
// works when public/ is small; otherwise use the Node API's renderMedia with `symlinkPublicDir: true`.
import React from "react";
import { Composition, registerRoot } from "remotion";
import { MT_FPS, MT_H, MT_W, MonitorTour, calculateMonitorTourMetadata, monitorTourFrames, type MonitorTourProps } from "./MonitorTour";
import example from "./monitor-tour.example.json";

const EXAMPLE = example as unknown as MonitorTourProps;

const Root: React.FC = () => (
  <Composition
    id="Template-MonitorTour-9x16"
    component={MonitorTour}
    fps={MT_FPS}
    width={MT_W}
    height={MT_H}
    durationInFrames={monitorTourFrames(EXAMPLE)}
    defaultProps={EXAMPLE}
    calculateMetadata={calculateMonitorTourMetadata}
  />
);

registerRoot(Root);
