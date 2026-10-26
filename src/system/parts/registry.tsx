/**
 * The scene parts a storyboard shot can name in `part` (2026-10-23). Every name here is listed in
 * names.json (the checker fails any other); add a part to both in the same change.
 */
import type React from "react";
import names from "./names.json";
import { CardDrift } from "./CardDrift";
import { ControlTitle } from "./ControlTitle";
import { EndUrl } from "./EndUrl";
import { LikeWhenLine } from "./LikeWhenLine";
import { PageWalk } from "./PageWalk";
import { RoleCardPart } from "./RoleCardPart";
import { TermTravel } from "./TermTravel";
import { Timelapse } from "./Timelapse";
// wave 2 (2026-10-23): the kit pass parts as storyboard parts
import { CircleIris } from "./CircleIris";
import { CraneRise } from "./CraneRise";
import { ScoreChip } from "./ScoreChip";
import { WordSwapLine } from "./WordSwapLine";
import { FocusWalkPart } from "./FocusWalkPart";
import type { PartProps } from "./types";

export const PARTS: Record<string, React.FC<PartProps>> = {
  "page-walk": PageWalk,
  "like-when-line": LikeWhenLine,
  "control-title": ControlTitle,
  "end-url": EndUrl,
  timelapse: Timelapse,
  "word-swap": WordSwapLine,
  "crane-rise": CraneRise,
  "circle-handoff": CircleIris,
  "score-fill": ScoreChip,
  "focus-walk": FocusWalkPart,
  // wave 2, builder A (2026-10-23): find-your-people, four-years, five-roles
  "card-drift": CardDrift,
  "term-travel": TermTravel,
  "role-card": RoleCardPart,
};

/** The part for a name. An unknown name (the checker should have caught it) falls back to page-walk, loudly. */
export const partFor = (name: string): React.FC<PartProps> => {
  const p = PARTS[name];
  if (p) return p;
  console.warn(`[film] unknown part "${name}", known: ${names.names.join(", ")}; drawing page-walk instead`);
  return PageWalk;
};

export type { PartProps, Layout, ShotCtx, Handoff } from "./types";
