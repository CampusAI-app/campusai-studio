/**
 * The storyboard: a film written down as data before anything renders (2026-10-23).
 *
 * Copied from Lago's pipeline (getlago.com/blog/we-killed-our-motion-design-job): a shot list as a typed
 * file, a grey draft that renders from it, then the final film from the same file. Their feedback rounds
 * fell from about 12 per film to about 1, because the arithmetic (reading holds, logo timing, lengths) is
 * checked by a script and the human only judges the story.
 *
 * One file per film, at Content/video-studio/films/<id>/storyboard.json. The same file drives:
 *   npm run check <id>   the checker (scripts/check-film.mjs), reading rules from system/rules.json
 *   npm run draft <id>   the grey draft (system/Draft.tsx): real camera, timing and text, grey pages
 *   npm run make <id>    the final film (system/Film.tsx), in every aspect the storyboard lists
 *
 * MODE (Jacob, 2026-10-23: "sometimes I want a lot of them made in bulk, sometimes I work on ones
 * individually"):
 *   "individual"  the grey draft is a gate: `make` refuses until `draftApproved` is true.
 *   "bulk"        no gate: `make` checks and renders straight to final, with a contact sheet.
 */

export type Aspect = "9x16" | "4x5" | "16x9" | "1x1";
export type Mode = "individual" | "bulk";
export type Format = "like-when" | "feature-15" | "bumper-6" | "one-task" | "eight-block" | "custom";

/**
 * The eight-block format (2026-10-24, Robin Tempe's short-form structure, sent through Muse): every shot of an
 * "eight-block" film names the block it belongs to, in this order, each block with one job (rules.json
 * `eightBlock`). The CTA is the end card, so no shot names it. Ignored by every other format.
 */
export type Block = "hook" | "lead" | "body-1" | "loop-1" | "body-2" | "loop-2" | "body-3";

/**
 * On the first shot of an open loop: the question it asks and where the NEXT body answers it. The checker
 * fails a loop whose answer is not on screen in a shot of the next body block.
 *   question  the line on screen (one of the loop's hook/line texts), or a visual question described in words
 *   visual    true when the question is a picture, not a line
 *   answer    the shot in the next body that answers it, and `evidence`: words on that shot's screen (its
 *             capture's layers, or one of its text lines) that are the answer
 */
export type Loop = { question: string; visual?: boolean; answer: { shot: string; evidence: string } };

/** Page pixels (CSS px of the capture), never canvas pixels. */
export type Rect = { x: number; y: number; w: number; h: number };
export type PageCam = { cx: number; cy: number; cw: number };

/** A real capture of the product. `src` is a path under studio/public/. */
export type Surface = {
  src: string;
  page: { w: number; h: number };
  /** The capture's device pixel ratio, so the camera never zooms past sharp. Default 2. */
  dpr?: number;
  /** Patches painted in the page's own colour (the Maryland M is added automatically on any page with the sidebar). */
  patch?: (Rect & { color?: string })[];
  /** The capture's measured boxes file, when there is one (public/pass/<page>.json). */
  layers?: string;
};

/**
 * Words on screen. `source` is the truth check:
 *   "capture"  the words are on the captured page (the checker looks for them in the surface's layers file)
 *   "facts"    the words are a claim listed in the storyboard's `facts`
 *   "hook"     a line we wrote that claims nothing about the product ("Like when your due date moves.")
 */
export type TextLine = {
  text: string;
  role: "hook" | "line" | "caption" | "label";
  source: "capture" | "facts" | "hook";
  /** Seconds after the shot starts. Default 0. */
  at?: number;
  /** Seconds fully on screen. Default: the reading rule. The checker fails a hold shorter than the rule. */
  hold?: number;
};

export type Shot = {
  id: string;
  seconds: number;
  /** Which scene part renders it (system/parts/registry.tsx), e.g. "page-walk", "like-when-line", "control-title", "end-url". */
  part: string;
  /** Key into `surfaces`. */
  surface?: string;
  /** Plain words: what happens in this shot. Shown on the grey draft. */
  action: string;
  /** Where the eye goes, in page px. Drives framing in every aspect (cutdowns reframe on it). */
  focus?: Rect;
  /** Optional page camera keys, `t` in seconds after the shot starts. Without them the part frames `focus`. */
  camera?: { t: number; cam: PageCam }[];
  /** A pointer press, in page px, `at` seconds after the shot starts. */
  press?: { x: number; y: number; at: number };
  /** Every press shows where its result lands: the id of the shot that shows it. The checker enforces this. */
  lands?: string;
  text?: TextLine[];
  /** How this shot hands to the next: the camera carries it (default), the same element carries it, or a cut. */
  transition?: "camera" | "carry" | "cut";
  /** Marks the hero moment; the checker wants it at 60 to 75% of the runtime. */
  hero?: boolean;
  /** Part-specific settings. */
  props?: Record<string, unknown>;
  /** Eight-block films only: which block this shot belongs to. */
  block?: Block;
  /** Eight-block films only, on a loop's first shot: the question and where it is answered. */
  loop?: Loop;
};

export type Storyboard = {
  id: string;
  title: string;
  format: Format;
  mode: Mode;
  /** Set true by Jacob's yes on the grey draft. Only read in "individual" mode. */
  draftApproved?: boolean;
  /** 9x16 only: the product fills the frame under the held mark instead of sitting between bands (parts/layout.ts). */
  fill?: boolean;
  /** Every aspect to deliver. The first is the home format the film is composed for. */
  aspects: Aspect[];
  brand: "campusai";
  /** Lago's narrative contract: a student does X, Y changes on screen, they are better off because Z. Every shot must serve it. */
  contract: { does: string; changes: string; better: string };
  surfaces: Record<string, Surface>;
  shots: Shot[];
  /** Instagram cuts say "Link in bio" instead of the address. */
  end: { kind: "logo-url"; hold: number; instagram?: boolean };
  music?: { track: string; startAt?: number };
  /**
   * Length cutdowns: a named subset of shots, in order, rendered with `cut: "<name>"` (logo, end card and sound automatic).
   * Opt-in (2026-10-23): `endHold` gives the cut its own end card hold; a cut may also name shots from `cutShots`.
   */
  cuts?: Record<string, { shots: string[]; format?: Format; endHold?: number }>;
  /**
   * Shots made for a cut only, never rendered in the full film (2026-10-23). A 6 s bumper is built natively,
   * not trimmed (rules.json formats), and a cut never speeds a shot's text up, so a bumper that no full-film
   * shot fits gets its own shot here. The checker checks every cut as a film of its own.
   */
  cutShots?: Shot[];
  facts: { text: string; source: string }[];
};

/** Reading hold in seconds, from system/rules.json. */
export const readHold = (text: string, r = { lettersPerSecond: 15, base: 1.5, min: 1.8 }) => {
  const letters = (text.match(/[\p{L}\p{N}]/gu) ?? []).length;
  return Math.max(r.min, letters / r.lettersPerSecond + r.base);
};

/** Total runtime in seconds, end card included. */
export const runtime = (s: Storyboard) => s.shots.reduce((a, x) => a + x.seconds, 0) + s.end.hold;

/** Canvas size per aspect. */
export const SIZE: Record<Aspect, { w: number; h: number }> = {
  "9x16": { w: 1080, h: 1920 },
  "4x5": { w: 1080, h: 1350 },
  "16x9": { w: 1920, h: 1080 },
  "1x1": { w: 1080, h: 1080 },
};
