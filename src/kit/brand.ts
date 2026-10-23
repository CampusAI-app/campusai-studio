/**
 * One set of colours, fonts and logo per venture (2026-10-22). Films read their brand from here and
 * never type a colour themselves: before this file CampusAI red existed as six different values.
 *
 * CampusAI is lifted from the product's own tokens (campusai-demo src/app/globals.css:
 * --color-primary #D9202E, --glow-primary-rgb 217, 32, 46, the .dark block) and Jacob's film look
 * (near-black #0b0708 with the red glow, 2026-10-16). Fig and FigBlossom get an entry the first time
 * a piece needs them, from their real design systems, never guessed.
 */
import React from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import { THEMES } from "../theme";

export type Brand = {
  name: string;
  /** Paths under public/. `ratio` is width / height. */
  logo: { onDark: string; onLight: string; ratio: number } | null;
  color: {
    /** The product's own page ground. */
    bg: string;
    /** The film ground around the product. */
    bgDeep: string;
    surface: string;
    ink: string;
    inkSoft: string;
    /** The one accent. */
    accent: string;
    accentInk: string;
    /** The accent as "r, g, b" for glows and shadows. */
    glowRgb: string;
    gradient?: string;
  };
  font: { display: "zodiak" | "inter"; ui: "inter" };
};

export const BRANDS = {
  campusai: {
    name: "CampusAI",
    logo: { onDark: "brand/campusai-logo-white.svg", onLight: "brand/campusai-logo.svg", ratio: 223 / 53 },
    color: {
      bg: "#070709",
      bgDeep: "#0b0708",
      surface: "#100b0c",
      ink: "#f7efe6",
      inkSoft: "#d7c3b3",
      accent: "#D9202E",
      accentInk: "#FFFFFF",
      glowRgb: "217, 32, 46",
      gradient: THEMES.campusaiProduct.bgGradient,
    },
    font: { display: "zodiak", ui: "inter" },
  },
  got60: {
    name: "Got60",
    logo: null,
    color: {
      bg: THEMES.got60.bg,
      bgDeep: THEMES.got60.bg,
      surface: THEMES.got60.bgSoft,
      ink: THEMES.got60.ink,
      inkSoft: THEMES.got60.inkSoft,
      accent: THEMES.got60.accent,
      accentInk: THEMES.got60.accentInk,
      glowRgb: "255, 90, 54",
    },
    font: { display: "inter", ui: "inter" },
  },
} satisfies Record<string, Brand>;

export type BrandKey = keyof typeof BRANDS;
export const brand = (key: BrandKey): Brand => BRANDS[key];

/** The accent at an alpha, for glows: `glow(b, 0.4)` gives "rgba(217, 32, 46, 0.4)". */
export const glow = (b: Brand, alpha: number) => `rgba(${b.color.glowRgb}, ${alpha})`;

/**
 * Loads the brand's display face before the first frame renders. Zodiak is self-hosted
 * (Fontshare ITF free licence); Inter comes from `kit/parts` (INTER).
 */
export const useBrandFonts = (b: Brand) => {
  const [wait] = React.useState(() => (b.font.display === "zodiak" ? delayRender("brand fonts") : null));
  React.useEffect(() => {
    if (wait === null) return;
    const faces = [
      new FontFace("Zodiak", `url(${staticFile("fonts/Zodiak-Bold.woff2")}) format("woff2")`, { weight: "700", style: "normal" }),
      new FontFace("Zodiak", `url(${staticFile("fonts/Zodiak-Italic.woff2")}) format("woff2")`, { weight: "400", style: "italic" }),
    ];
    Promise.all(faces.map((x) => x.load().then((l) => document.fonts.add(l)))).finally(() => continueRender(wait));
  }, [wait]);
};
