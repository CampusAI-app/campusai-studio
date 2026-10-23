// The readout parts: RoleCard (a real job card lifted off its page with its reason and chips called out),
// ScoreFill (the profile strength ring filling as real steps land), ShapeMorph (one shape through real UI states).
export { RoleCardLayer, RoleSequence, roleCam, roleSchedule, roleTiming } from "./RoleCard";
export type { Role, RoleTiming } from "./RoleCard";
export { ScoreFill, scoreAt } from "./ScoreFill";
export type { ScoreChip, ScoreFillTiming, ScoreStep } from "./ScoreFill";
export { ShapeMorph } from "./ShapeMorph";
export type { MorphLook, MorphRun, MorphState } from "./ShapeMorph";
export { MaskM, readFrames, springStep } from "./shared";
