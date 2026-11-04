/**
 * The one-prompt styles' own Remotion entry (2026-11-01), separate from Root.tsx so they never fight the
 * older films. `format` is a prop: vertical by default, feed or wide when asked.
 *   npx remotion render src/styles/entry.ts Style-Teardown out/styles/teardown.mp4
 */
import React from "react";
import { Composition, registerRoot } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { END_FRAMES, SIZES, type Format } from "./common";
import { FLAT_CARTOON, HEADLINE, INK_WASH, MAP_ROUTE, PAPER_DESK, POV_DOODLE, STAT_CHART, TEARDOWN } from "./examples";
import { FlatCartoon, flatEnd } from "./FlatCartoon";
import { PovDoodle, povEnd } from "./PovDoodle";
import { HEADLINE_END, Headline } from "./Headline";
import { INK_TOTAL, InkWash } from "./InkWash";
import { MapRoute, ROUTE_END } from "./MapRoute";
import { PAPER_DESK_END, PaperDesk } from "./PaperDesk";
import { STAT_END, StatChart } from "./StatChart";
import { TEARDOWN_END, Teardown } from "./Teardown";

/* eslint-disable @typescript-eslint/no-explicit-any */
const STYLES: { id: string; c: React.FC<any>; props: any; frames: number; dur?: (p: any) => number }[] = [
  { id: "Style-Teardown", c: Teardown, props: TEARDOWN, frames: TEARDOWN_END + END_FRAMES + 12 },
  { id: "Style-PaperDesk", c: PaperDesk, props: PAPER_DESK, frames: PAPER_DESK_END + END_FRAMES + 12 },
  { id: "Style-Headline", c: Headline, props: HEADLINE, frames: HEADLINE_END + END_FRAMES + 12 },
  { id: "Style-StatChart", c: StatChart, props: STAT_CHART, frames: STAT_END + END_FRAMES + 12 },
  { id: "Style-MapRoute", c: MapRoute, props: MAP_ROUTE, frames: ROUTE_END + END_FRAMES + 12 },
  { id: "Style-InkWash", c: InkWash, props: INK_WASH, frames: INK_TOTAL },
  // The cartoon pair (2026-11-04): their length follows the subject, so it is worked out from the props.
  { id: "Style-PovDoodle", c: PovDoodle, props: POV_DOODLE, frames: 0, dur: (p) => povEnd(p.notes.length) + END_FRAMES + 12 },
  { id: "Style-FlatCartoon", c: FlatCartoon, props: FLAT_CARTOON, frames: 0, dur: (p) => flatEnd(p.points.length) + END_FRAMES + 12 },
];

const sized = (dur?: (p: any) => number): CalculateMetadataFunction<any> => ({ props }) => ({
  ...SIZES[(props.format as Format) ?? "vertical"],
  ...(dur ? { durationInFrames: dur(props) } : {}),
});

const Root: React.FC = () =>
  React.createElement(
    React.Fragment,
    null,
    STYLES.map((s) =>
      React.createElement(Composition, {
        key: s.id, id: s.id, component: s.c, defaultProps: s.props, durationInFrames: s.frames || (s.dur ? s.dur(s.props) : 1),
        fps: 30, width: 1080, height: 1920, calculateMetadata: sized(s.dur),
      } as any),
    ),
  );

registerRoot(Root);
