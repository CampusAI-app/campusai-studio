/**
 * The film system's own Remotion entry (2026-10-23), separate from src/index.ts and Root.tsx so the
 * system never fights the older films. Two compositions, both fed a storyboard as input props:
 *   Draft  the grey draft (system/Draft.tsx), sized from the storyboard's first aspect
 *   Film   the final film (system/Film.tsx), props = storyboard + `aspect`
 * Rendered by scripts/draft-film.mjs and scripts/make-film.mjs with --props.
 */
import React from "react";
import { Composition, registerRoot } from "remotion";
import type { AnyZodObject } from "remotion";
import { Draft, draftMetadata } from "./Draft";
import { Film, filmMetadata } from "./Film";
import { FPS } from "./motion";
import type { Storyboard } from "./storyboard";

/** Only shown when a composition opens with no props (the Studio); real renders always pass a storyboard. */
const PLACEHOLDER: Storyboard = {
  id: "placeholder",
  title: "Placeholder",
  format: "custom",
  mode: "bulk",
  aspects: ["9x16"],
  brand: "campusai",
  contract: { does: "Nothing yet", changes: "Nothing yet", better: "Pass a storyboard with --props" },
  surfaces: { dashboard: { src: "pass/dashboard.jpg", page: { w: 1440, h: 900 }, dpr: 2 } },
  shots: [{ id: "one", seconds: 3, part: "page-walk", surface: "dashboard", action: "Pass a storyboard with --props" }],
  end: { kind: "logo-url", hold: 3 },
  facts: [],
};

type FilmProps = React.ComponentProps<typeof Film>;

const Root: React.FC = () =>
  React.createElement(
    React.Fragment,
    null,
    React.createElement(Composition<AnyZodObject, Storyboard>, {
      id: "Draft",
      component: Draft,
      defaultProps: PLACEHOLDER,
      calculateMetadata: draftMetadata,
      fps: FPS,
      width: 1080,
      height: 1920,
      durationInFrames: 180,
    }),
    React.createElement(Composition<AnyZodObject, FilmProps>, {
      id: "Film",
      component: Film,
      defaultProps: { ...PLACEHOLDER, aspect: PLACEHOLDER.aspects[0] } as FilmProps,
      calculateMetadata: filmMetadata,
      fps: FPS,
      width: 1080,
      height: 1920,
      durationInFrames: 180,
    }),
  );

registerRoot(Root);
