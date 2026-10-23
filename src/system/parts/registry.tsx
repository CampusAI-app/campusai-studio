/**
 * The scene parts a storyboard shot can name in `part` (2026-10-23). Every name here is listed in
 * names.json (the checker fails any other); add a part to both in the same change.
 */
import type React from "react";
import names from "./names.json";
import { ControlTitle } from "./ControlTitle";
import { EndUrl } from "./EndUrl";
import { LikeWhenLine } from "./LikeWhenLine";
import { PageWalk } from "./PageWalk";
import { Timelapse } from "./Timelapse";
import type { PartProps } from "./types";

export const PARTS: Record<string, React.FC<PartProps>> = {
  "page-walk": PageWalk,
  "like-when-line": LikeWhenLine,
  "control-title": ControlTitle,
  "end-url": EndUrl,
  timelapse: Timelapse,
};

/** The part for a name. An unknown name (the checker should have caught it) falls back to page-walk, loudly. */
export const partFor = (name: string): React.FC<PartProps> => {
  const p = PARTS[name];
  if (p) return p;
  console.warn(`[film] unknown part "${name}", known: ${names.names.join(", ")}; drawing page-walk instead`);
  return PageWalk;
};

export type { PartProps, Layout, ShotCtx, Handoff } from "./types";
