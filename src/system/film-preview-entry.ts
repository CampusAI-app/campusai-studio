/**
 * Preview entry for the final film (2026-10-23): registers `Film` with the parts demo storyboard as
 * its default props, so the renderer can be rendered and looked at without the make script.
 *   npx remotion render src/system/film-preview-entry.ts Film out/system/parts-demo-4x5.mp4
 *   npx remotion render src/system/film-preview-entry.ts Film out/system/parts-demo-9x16.mp4 --props='{"aspect":"9x16"}'
 * Input props merge over the defaults, so `aspect` alone switches the cut.
 */
import React from "react";
import { Composition, registerRoot } from "remotion";
import type { AnyZodObject } from "remotion";
import demo from "../../../films/_parts-demo/storyboard.json";
import { Film, filmMetadata } from "./Film";
import type { FilmProps } from "./Film";
import { FPS } from "./motion";

const board = demo as unknown as FilmProps;

const Root: React.FC = () =>
  React.createElement(Composition<AnyZodObject, FilmProps>, {
    id: "Film",
    component: Film,
    defaultProps: { ...board, aspect: board.aspects[0] },
    calculateMetadata: filmMetadata,
    fps: FPS,
    width: 1080,
    height: 1350,
    durationInFrames: 300,
  });

registerRoot(Root);
