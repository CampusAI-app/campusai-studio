/**
 * House look (2026-11-18, from @eightsenses.media's reel "ALL OF THIS, 4 speakers one skill",
 * instagram.com/reel/Df5QrYGkgiR, Muse Nov 18; the paid skill was never bought or seen, this is our own build from the
 * frames). The lesson of that reel: four different people, four different moments, and they read as one show because
 * every clip is made of the SAME materials: one palette, one frosted card, one caption treatment, one small italic serif
 * accent, one ring colour.
 *
 * A look is plain data, so a series can record the one it chose next to the film (`films/<series>/look.json`) and every
 * clip in that series reads it. `HouseEdit` applies a look to one clip; `SpeakerFan` fans several of them out.
 * Fonts are named, not loaded here: HouseEdit loads the ones listed in `HOUSE_FONTS`.
 */

/** The caption and card faces HouseEdit knows how to load. A look names one sans and one serif from these. */
export const HOUSE_FONTS = {
  sans: ["Geist", "Plus Jakarta Sans"],
  serif: ["Instrument Serif", "Newsreader"],
} as const;
export type HouseSans = (typeof HOUSE_FONTS.sans)[number];
export type HouseSerif = (typeof HOUSE_FONTS.serif)[number];

export type HouseLook = {
  name: string;
  /** The palette. `deep` is the shadow colour (vignette, grounds), `accent` the one loud colour. */
  palette: { deep: string; ground: [string, string, string]; accent: string; ink: string; dim: string };
  /** Applied the same to the clip and its cutout, so the two stay one picture. CSS filter. */
  grade: { filter: string; vignette: number };
  /** Captions: a whole phrase held still, words lit as said. `size` in px at 1080 wide, `y` the line's centre (0 to 1). */
  caption: { font: HouseSans; weight: number; size: number; case: "sentence" | "lower"; y: number };
  /** The one accent: a small italic serif, used for the keyword in captions and the big word on the card. */
  serif: { font: HouseSerif; scale: number };
  /** The one frosted card. `veil` tints the glass, `edge` is its hairline, `blur` the frost in px. */
  card: { veil: string; edge: string; blur: number; radius: number; size: number; serifSize: number };
  /** The ring's colour (around the person, and the fan's card edges). */
  ring: string;
};

/** The reel's own palette: deep purple and acid green, a lowercase sans with an italic serif accent. */
const violet: HouseLook = {
  name: "violet",
  palette: { deep: "#130A28", ground: ["#120926", "#25124E", "#3A1B76"], accent: "#C9F23A", ink: "#FFFFFF", dim: "rgba(255,255,255,0.42)" },
  grade: { filter: "contrast(1.06) saturate(0.86) brightness(0.98)", vignette: 0.6 },
  caption: { font: "Geist", weight: 600, size: 50, case: "lower", y: 0.79 },
  serif: { font: "Instrument Serif", scale: 1.3 },
  card: { veil: "rgba(196,178,255,0.16)", edge: "rgba(255,255,255,0.34)", blur: 26, radius: 34, size: 44, serifSize: 118 },
  ring: "#C9F23A",
};

/** A warm second look: oxblood and amber, sentence case, Newsreader italic. */
const ember: HouseLook = {
  name: "ember",
  palette: { deep: "#1C0907", ground: ["#1C0907", "#3A120B", "#5C1E10"], accent: "#FFB45C", ink: "#FFF8F0", dim: "rgba(255,248,240,0.42)" },
  grade: { filter: "contrast(1.05) saturate(0.92) sepia(0.08) brightness(0.98)", vignette: 0.55 },
  caption: { font: "Plus Jakarta Sans", weight: 600, size: 48, case: "sentence", y: 0.79 },
  serif: { font: "Newsreader", scale: 1.25 },
  card: { veil: "rgba(255,214,186,0.15)", edge: "rgba(255,240,226,0.32)", blur: 26, radius: 30, size: 42, serifSize: 108 },
  ring: "#FFB45C",
};

export const HOUSE_LOOKS = { violet, ember } as const;
export type HouseLookName = keyof typeof HOUSE_LOOKS;

/** A look by name, or a look read from a series' look.json (any missing field falls back to violet's). */
export const houseLook = (look: HouseLookName | Partial<HouseLook>): HouseLook => {
  if (typeof look === "string") return HOUSE_LOOKS[look];
  const base = HOUSE_LOOKS[(look.name as HouseLookName) in HOUSE_LOOKS ? (look.name as HouseLookName) : "violet"];
  return {
    ...base,
    ...look,
    palette: { ...base.palette, ...look.palette },
    grade: { ...base.grade, ...look.grade },
    caption: { ...base.caption, ...look.caption },
    serif: { ...base.serif, ...look.serif },
    card: { ...base.card, ...look.card },
  };
};
