/**
 * The one-prompt styles' own Remotion entry (2026-11-01), separate from Root.tsx so they never fight the
 * older films. `format` is a prop: vertical by default, feed or wide when asked.
 *   npx remotion render src/styles/entry.ts Style-Teardown out/styles/teardown.mp4
 */
import React from "react";
import { Composition, registerRoot } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { END_FRAMES, SIZES, type Format } from "./common";
import { HEADLINE, INK_WASH, MAP_ROUTE, PAPER_DESK, STAT_CHART, TEARDOWN } from "./examples";
import { HEADLINE_END, Headline } from "./Headline";
import { INK_TOTAL, InkWash } from "./InkWash";
import { MapRoute, ROUTE_END } from "./MapRoute";
import { PAPER_DESK_END, PaperDesk } from "./PaperDesk";
import { STAT_END, StatChart } from "./StatChart";
import { TEARDOWN_END, Teardown } from "./Teardown";

/* eslint-disable @typescript-eslint/no-explicit-any */
const STYLES: { id: string; c: React.FC<any>; props: any; frames: number }[] = [
  { id: "Style-Teardown", c: Teardown, props: TEARDOWN, frames: TEARDOWN_END + END_FRAMES + 12 },
  { id: "Style-PaperDesk", c: PaperDesk, props: PAPER_DESK, frames: PAPER_DESK_END + END_FRAMES + 12 },
  { id: "Style-Headline", c: Headline, props: HEADLINE, frames: HEADLINE_END + END_FRAMES + 12 },
  { id: "Style-StatChart", c: StatChart, props: STAT_CHART, frames: STAT_END + END_FRAMES + 12 },
  { id: "Style-MapRoute", c: MapRoute, props: MAP_ROUTE, frames: ROUTE_END + END_FRAMES + 12 },
  { id: "Style-InkWash", c: InkWash, props: INK_WASH, frames: INK_TOTAL },
];

const sized: CalculateMetadataFunction<any> = ({ props }) => SIZES[(props.format as Format) ?? "vertical"];

const Root: React.FC = () =>
  React.createElement(
    React.Fragment,
    null,
    STYLES.map((s) =>
      React.createElement(Composition, {
        key: s.id, id: s.id, component: s.c, defaultProps: s.props, durationInFrames: s.frames,
        fps: 30, width: 1080, height: 1920, calculateMetadata: sized,
      } as any),
    ),
  );

registerRoot(Root);
