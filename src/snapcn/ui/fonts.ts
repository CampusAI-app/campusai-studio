"use client";

import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

/**
 * The type faces a scene's `fontFamily` may name.
 *
 * ## Why an allowlist and not a free string
 *
 * Every component in this registry loads its face through
 * `@remotion/google-fonts` rather than a CSS variable, for the reason spelled
 * out at the top of each one: a Remotion bundle has none of the app's CSS, so
 * `var(--font-…)` gets you the right face in the Player and a **fallback in the
 * mp4**. A bare family name handed to a component has exactly the same problem
 * — the browser preview finds it, the render does not, and the bug is invisible
 * until someone plays the file.
 *
 * So a name only counts as a font here if this module has loaded it. Values map
 * label → the real CSS family string `loadFont` returns, which is not always the
 * label ("Instrument Serif", not "InstrumentSerif").
 *
 * ## A raw stack still works
 *
 * `resolveFont` passes anything it does not recognise straight through, so a
 * caller who has loaded their own face — a brand font, a local `@font-face` —
 * names it directly and gets it. The allowlist is the safe path, not the only one.
 *
 * ponytail: all six load at module scope, so a render fetches six latin subsets
 * whether or not the video uses them. Move to a lazy per-family `loadFont()` if
 * bundle time ever shows up in a render trace.
 */
// Studio trim (2026-11-06): snapcn loaded six Google families here at import time. The studio keeps
// only Inter (CampusAI's UI face); Zodiak and any other face are passed in as a raw CSS family, which
// `resolveFont` hands straight through.
export const FONTS: Record<string, string> = {
  Inter: loadInter("normal", {
    weights: ["400", "500", "600", "700"],
    subsets: ["latin"],
  }).fontFamily,
};

/**
 * What a select control offers. `DEFAULT_FONT` first: a scene's own face is a
 * design decision, so the knob has to have an "off", and it has to be the
 * value it ships at.
 */
export const DEFAULT_FONT = "Default";
export const FONT_NAMES = [DEFAULT_FONT, ...Object.keys(FONTS)];

/**
 * Label → loaded CSS family. Anything unrecognised passes through unchanged, so
 * a caller's own stack is never swallowed. `undefined` in, `undefined` out —
 * that is the signal for "keep the component's own face".
 */
export const resolveFont = (name?: string): string | undefined =>
  !name || name === DEFAULT_FONT ? undefined : (FONTS[name] ?? name);
