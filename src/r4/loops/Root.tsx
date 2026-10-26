/**
 * The feature loop compositions (round 4, 2026-10-25): three loops, each square (1080x1080) and vertical
 * (1080x1920), 30 fps. Ids: Loop-<Name>-1x1, Loop-<Name>-9x16.
 */
import React from "react";
import { Composition } from "remotion";
import { CALENDAR_LOOP_FRAMES, CalendarLoop } from "./CalendarLoop";
import { PLANNER_LOOP_FRAMES, PlannerLoop } from "./PlannerLoop";
import type { LoopAspect } from "./shared";
import { FPS, SIZE } from "./shared";
import { WHY_LOOP_FRAMES, WhyFitsLoop } from "./WhyFitsLoop";

const LOOPS: { name: string; frames: number; C: React.FC<{ aspect: LoopAspect }> }[] = [
  { name: "Calendar", frames: CALENDAR_LOOP_FRAMES, C: CalendarLoop },
  { name: "WhyFits", frames: WHY_LOOP_FRAMES, C: WhyFitsLoop },
  { name: "Planner", frames: PLANNER_LOOP_FRAMES, C: PlannerLoop },
];
const ASPECTS: LoopAspect[] = ["1x1", "9x16"];

export const LoopsRoot: React.FC = () => (
  <>
    {LOOPS.flatMap(({ name, frames, C }) =>
      ASPECTS.map((aspect) => (
        <Composition key={`${name}-${aspect}`} id={`Loop-${name}-${aspect}`} component={C} defaultProps={{ aspect }}
          durationInFrames={frames} fps={FPS} width={SIZE[aspect].w} height={SIZE[aspect].h} />
      )),
    )}
  </>
);
