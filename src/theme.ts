// Brand tokens for the demo-video pipeline.
// CampusAI values are lifted from CampusAI/design/CampusAI Design System/colors_and_type.css
// Got60 values are the locked Ember Noir palette.
// Taste laws enforced here: no monospace anywhere, no all-caps wide-tracked labels.

export type Theme = {
  name: string;
  // Surface behind the footage
  bg: string;
  bgSoft: string;
  /** Optional layered gradient painted over `bg`. CSS background-image value. */
  bgGradient?: string;
  // Text
  ink: string;
  inkSoft: string;
  // One accent, used sparingly
  accent: string;
  accentInk: string;
  // Footage treatment
  radius: number;
  shadow: string;
  // Type
  displayWeight: number;
  displayTracking: string;
};

export const THEMES: Record<string, Theme> = {
  campusai: {
    name: "CampusAI",
    bg: "#FBFAF7",
    bgSoft: "#F4F1EC",
    ink: "#141414",
    inkSoft: "#6B6B6B",
    accent: "#C8102E",
    accentInk: "#FFFFFF",
    radius: 18,
    shadow: "0 40px 90px rgba(20,20,20,0.16), 0 8px 24px rgba(20,20,20,0.08)",
    displayWeight: 700,
    displayTracking: "-0.03em",
  },
  /**
   * The product's OWN dark tokens, lifted verbatim from campusai-demo
   * src/app/globals.css (.dark block). Used when compositing captured UI, so a
   * card sits on the same ground it sits on in the app and its edges never read
   * as a pasted rectangle.
   */
  campusaiProduct: {
    name: "CampusAI Product",
    bg: "#070709",
    bgSoft: "#100b0c",
    bgGradient:
      "radial-gradient(ellipse at 80% 0%, rgba(217, 32, 46, 0.22) 0%, transparent 50%), " +
      "radial-gradient(ellipse at 0% 100%, rgba(245, 200, 66, 0.15) 0%, transparent 50%), " +
      "radial-gradient(ellipse at 50% 30%, rgba(23, 16, 18, 0.8) 0%, transparent 70%)",
    ink: "#f7efe6",
    inkSoft: "#d7c3b3",
    accent: "#D9202E",
    accentInk: "#FFFFFF",
    radius: 13,
    shadow: "0 40px 90px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.35)",
    displayWeight: 700,
    displayTracking: "-0.03em",
  },
  campusaiDark: {
    name: "CampusAI Dark",
    bg: "#0F0F11",
    bgSoft: "#1C1C1F",
    ink: "#FBFAF7",
    inkSoft: "#97938C",
    accent: "#FFB81C",
    accentInk: "#3A0008",
    radius: 18,
    shadow: "0 40px 90px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4)",
    displayWeight: 700,
    displayTracking: "-0.03em",
  },
  got60: {
    name: "Got60",
    bg: "#0F0F11",
    bgSoft: "#1C1C1F",
    ink: "#FBFAF7",
    inkSoft: "#97938C",
    accent: "#FF5A36",
    accentInk: "#15120F",
    radius: 20,
    shadow: "0 40px 90px rgba(0,0,0,0.65), 0 8px 24px rgba(0,0,0,0.45)",
    displayWeight: 700,
    displayTracking: "-0.03em",
  },
  neutral: {
    name: "Neutral",
    bg: "#F7F7F8",
    bgSoft: "#EDEDEF",
    ink: "#111113",
    inkSoft: "#6E6E76",
    accent: "#2C6BED",
    accentInk: "#FFFFFF",
    radius: 18,
    shadow: "0 40px 90px rgba(17,17,19,0.14), 0 8px 24px rgba(17,17,19,0.07)",
    displayWeight: 700,
    displayTracking: "-0.03em",
  },
};

export const getTheme = (key: string): Theme => THEMES[key] ?? THEMES.neutral;
