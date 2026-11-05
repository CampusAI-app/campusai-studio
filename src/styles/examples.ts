import genEdsPlan from "../../public/pov-gen-eds/convo/frames.json";
import coursesFlow from "../../public/pov-gen-eds/courses/frames.json";
import springPlan from "../../public/pov-gen-eds/flow/frames.json";
/** The worked CampusAI example of each style. Every word and number here is in films/one-prompt-styles/facts.md. */
import type { HeadlineProps } from "./Headline";
import type { InkWashProps } from "./InkWash";
import type { FlatCartoonProps } from "./FlatCartoon";
import type { MapRouteProps } from "./MapRoute";
import type { PovDoodleProps } from "./PovDoodle";
import type { TwoProfessorsProps } from "./TwoProfessors";
import twoProfFlow from "../../public/two-professors/frames.json";
import weekFlow from "../../public/pov-week/frames.json";
import type { PaperDeskProps } from "./PaperDesk";
import type { StatChartProps } from "./StatChart";
import type { TeardownProps } from "./Teardown";

export const TEARDOWN: TeardownProps = {
  title: "What's inside a job posting",
  src: "pass/job-goldman.jpg",
  page: { w: 1440, h: 900 },
  layers: [
    { rect: { x: 731, y: 223, w: 646, h: 148 }, depth: 430, line: "Strong match", spark: true, radius: 10 },
    { rect: { x: 742, y: 377, w: 624, h: 202 }, depth: 300, line: "Why this fits you", spark: true, radius: 12 },
    { rect: { x: 742, y: 580, w: 624, h: 177 }, depth: 180, line: "About this role", radius: 4 },
    { rect: { x: 742, y: 758, w: 624, h: 42 }, depth: 80, line: "What they're looking for", radius: 4 },
  ],
};

export const PAPER_DESK: PaperDeskProps = {
  title: "Your whole week, on one desk",
  hero: 2,
  circle: { x: 40, y: 176, w: 330, h: 26 },
  sheets: [
    { src: "pass/calendar-tall.jpg", pageW: 1440, crop: { x: 225, y: 0, w: 1200, h: 880 }, rest: { x: -150, y: -300, r: -6 } },
    { src: "pass/planner-tall.jpg", pageW: 1440, crop: { x: 225, y: 40, w: 1200, h: 900 }, rest: { x: 150, y: -10, r: 5 } },
    { src: "pass/dashboard-tall.jpg", pageW: 1440, crop: { x: 225, y: 0, w: 1200, h: 1550 }, rest: { x: -50, y: 300, r: -3 } },
  ],
};

export const HEADLINE: HeadlineProps = {
  masthead: "Campus Pulse",
  dateline: "Spring 2027 registration",
  headline: "Two classes can clear four gen eds",
  accent: "four",
  deck: "AOSC123 and JOUR175 double count, so each one covers two requirements.",
  columns: [
    "AOSC123 counts for Natural Science and Big Question. No prerequisites. Average GPA 3.38.",
    "JOUR175 counts for Scholarship in Practice and Diversity. No prerequisites. Average GPA 3.15.",
  ],
  source: "Testudo, Spring 2027. Grade data from PlanetTerp through Spring 2026.",
  photo: { src: "pass/planner.jpg", pageW: 1440, crop: { x: 250, y: 50, w: 700, h: 410 } },
};

export const STAT_CHART: StatChartProps = {
  title: "Business Finance keeps growing",
  unit: "BMGT340 students, fall term",
  points: [
    { label: "Fall 2016", value: 538 }, { label: "2017", value: 501 }, { label: "2018", value: 518 }, { label: "2019", value: 516 }, { label: "2020", value: 506 },
    { label: "2021", value: 524 }, { label: "2022", value: 564 }, { label: "2023", value: 607 }, { label: "2024", value: 635 }, { label: "Fall 2025", value: 659 },
  ],
  callout: "Five straight falls of growth",
  source: "Letter grades reported each fall, PlanetTerp.",
  floor: 500,
  ceil: 700,
};

export const MAP_ROUTE: MapRouteProps = {
  data: "styles/campus.json",
  from: "Stamp",
  to: "Van Munching",
  toBuilding: "Van Munching Hall",
  pass: [{ label: "McKeldin", building: "Theodore R. McKeldin Library" }],
  credit: "Map data OpenStreetMap contributors",
};

export const INK_WASH: InkWashProps = { title: "Spring registration" };

export const POV_DOODLE: PovDoodleProps = {
  pov: "POV: you're a UMD student figuring out gen eds",
  tally: "Things to figure out",
  notes: ["Testudo", "PlanetTerp", "Degree requirements", "4-year plan", "DSNS or DSNL?", "Does it count for DVUP?"],
  faces: ["Calm", "Concerned", "Concerned", "Hectic", "Hectic", "Tired"],
  payoff: "Or ask CampusAI once.",
  accent: "once",
  after: 0,
  // UMD's own mark, copied from the demo's public/brand/umd-m.svg (Jacob 11/04: UMD imagery is fine in a video)
  mark: "styles/umd/umd-m.svg",
  backdrop: "mckeldin",
  then: "Or open your degree progress and find the classes you still need.",
  thenAccent: "progress",
  // Round 11 (Nov 4, Jacob: the chat as it was, but keep the new typing; no planner). Back to back in the one box:
  // 1. the question typed into the drawn composer (DrawnChat's ask beat, ChatVideo's typing motion);
  // 2. the real demo chat from the send: the answer streaming, then AOSC123's card, cut before Add to plan
  //    (films/pov-gen-eds/conversation.json). Starting at the send keeps the empty chat and its Testudo mark out.
  // 3. Courses and Professors, under the `then` line: General Education opened in "What you still need", Natural
  //    Science pressed under Still open, the loading steps, "any DSNS or DSNL course counts" (courses-flow.json).
  answer: [
    { kind: "ask", question: "can you find what gen eds i should take" },
    {
      dir: "pov-gen-eds/convo",
      rec: genEdsPlan,
      x0: 220,
      segs: [{ from: 2.47, to: 7.5, speed: 1.3 }, { from: 8.37, to: 11.4, speed: 1 }],
      cam: [[2.47, 0, 270, 1], [2.6, 0, 270, 1], [3.2, 0, 40, 1], [11.4, 0, 40, 1]],
      pointer: { from: 8.47, to: 11.4 },
      landed: 6.6,
    },
    {
      dir: "pov-gen-eds/courses",
      rec: coursesFlow,
      x0: 215,
      segs: [{ from: 2.4, to: 7.6, speed: 1.4 }, { from: 7.6, to: 12.6, speed: 1 }],
      cam: [[2.4, 15, 30, 2.99], [3.9, 15, 30, 2.99], [4.6, 15, 180, 2.99], [7.45, 15, 180, 2.99], [8.3, 420, 150, 2.6], [12.6, 420, 150, 2.6]],
      pointer: { from: 2.6, to: 7.7, size: 14 },
      landed: 9.0,
    },
  ],
};

/** Round 4 (Nov 4), not the pick: the in-chat spring planner. Kept so it can be re-rendered. */
export const POV_DOODLE_SPRING: PovDoodleProps = {
  pov: "POV: you're figuring out your spring classes",
  tally: "Tabs open",
  notes: ["Testudo", "PlanetTerp", "Degree audit", "4-year plan"],
  faces: ["Calm", "Concerned", "Hectic", "Tired"],
  payoff: "Or plan it with CampusAI once.",
  accent: "once",
  after: 1,
  // The real demo's "Plan your spring" chat: the Spring 2027 template, the class suggestions, a section hovered
  // (its dashed outline on the week), picked, and a second class landing (recorded 2026-11-04 from
  // films/pov-gen-eds/flow.json; the setup questions before the template are cut). Times are the recording's.
  answer: {
    dir: "pov-gen-eds/flow",
    rec: springPlan,
    x0: 215,
    segs: [{ from: 43.3, to: 48.9, speed: 1.4 }, { from: 48.9, to: 57.3, speed: 1.3 }, { from: 57.3, to: 61.4, speed: 1 }, { from: 67.0, to: 69.4, speed: 1 }],
    cam: [[43.3, 200, 92, 1.42], [45.8, 200, 92, 1.42], [46.8, 240, 355, 2], [47.6, 240, 355, 2], [48.2, 613, 355, 2], [48.9, 613, 355, 2],
      [49.7, 485, 200, 1.8], [56.8, 485, 200, 1.8], [57.6, 45, 290, 3.2], [69.4, 45, 290, 3.2]],
    pointer: { from: 44, to: 69.4, size: 22 },
    landed: 60.0,
  },
};

export const FLAT_CARTOON: FlatCartoonProps = {
  title: "BMGT340 keeps filling up",
  unit: "Business Finance students, fall term",
  points: [
    { label: "Fall 2020", value: 506 }, { label: "Fall 2021", value: 524 }, { label: "Fall 2022", value: 564 },
    { label: "Fall 2023", value: 607 }, { label: "Fall 2024", value: 635 }, { label: "Fall 2025", value: 659 },
  ],
  per: 10,
  perLabel: "10 students",
  callout: "Five straight falls of growth",
  source: "Students with a letter grade each fall, PlanetTerp.",
  cols: 12,
  rows: 6,
};

/** Reel 1, second batch, round 2 (2026-11-04): product first in the FocusWalk look. Ratings are what the demo's "Who
 * teaches it" shows, checked against PlanetTerp the same day (films/two-professors/facts.md). Still and recording from
 * films/two-professors/flow.json (1120 x 1100, dpr 3). Rects are page px, measured off the recording. */
export const TWO_PROFESSORS: TwoProfessorsProps = {
  still: "two-professors/who-still.jpg",
  page: { w: 1120, h: 1100 },
  dpr: 3,
  intro: { cx: 878, cy: 560, cw: 520 },
  stops: [
    { rect: { x: 673, y: 735, w: 411, h: 220 }, hold: 40, line: "Who teaches it" },
    { rect: { x: 673, y: 871, w: 411, h: 80 }, hold: 45, line: "3.0 out of 5" },
    { rect: { x: 673, y: 765, w: 411, h: 100 }, hold: 45, line: "4.7 out of 5" },
  ],
  rec: twoProfFlow,
  dir: "two-professors",
  // a cut, not a pan, onto his page: panning crossed the empty half of the page while it loaded
  segs: [{ from: 16.4, to: 16.9 }, { from: 17.4, to: 17.8 }, { from: 20.5, to: 24.8 }],
  cam: [
    { t: 16.4, cam: { cx: 878, cy: 763, cw: 485 } },
    { t: 16.9, cam: { cx: 878, cy: 763, cw: 485 } },
    { t: 17.4, cam: { cx: 505, cy: 480, cw: 520 } },
    { t: 24.8, cam: { cx: 505, cy: 480, cw: 520 } },
  ],
  lines: [
    { text: "David Kass", from: 17.4, to: 20.9 },
    { text: "What students say", from: 21.0, to: 24.8 },
  ],
};

/** Episode 2 of the UMD student (2026-11-04). Every note is on Maya's real week in the demo (My Calendar and Events);
 * the ending is My Calendar's own "Find time to study for Quiz 2": the chat names a time and one press adds the study
 * block (films/pov-week/flow.json, facts in films/pov-week/facts.md). */
export const POV_DOODLE_WEEK: PovDoodleProps = {
  pov: "POV: you're a UMD student and this week is a lot",
  tally: "Things to figure out",
  // Round 2 (Jacob: "exactly the same as the other POV"): the week fills like Tetris instead of sticky notes
  notes: ["Work shift", "Reading due", "Work shift", "Evercore coffee chat", "Case brief due", "Resume night 7 PM", "Study for Quiz 2?"],
  faces: ["Calm", "Calm", "Concerned", "Concerned", "Hectic", "Hectic", "Tired"],
  week: {
    cols: ["Mon", "Tue", "Wed", "Thu"],
    classes: [[0, "BMGT343"], [1, "BMGT310"], [2, "BMGT343"], [3, "BMGT310"], [0, "BMGT380"], [1, "BMGT364"], [2, "BMGT380"], [3, "BMGT364"]],
    days: [0, 1, 2, 3, 2, 2, -1],
  },
  payoff: "Or ask CampusAI once.",
  accent: "once",
  after: 0,
  mark: "styles/umd/umd-m.svg",
  backdrop: "mckeldin",
  answer: {
    dir: "pov-week",
    rec: weekFlow,
    x0: 72,
    // the long wait before the add is the recorder, not the product: cut
    segs: [{ from: 5.0, to: 6.75, speed: 1 }, { from: 6.8, to: 10.4, speed: 1 }, { from: 63.2, to: 68.4, speed: 1 }],
    cam: [[5.0, 148, 520, 3], [6.75, 148, 520, 3], [6.8, 958, 50, 3.34], [64.4, 958, 50, 3.34], [65.2, 378, 330, 2.6], [68.4, 378, 330, 2.6]],
    pointer: { from: 5.0, to: 68.4, size: 14 },
    landed: 63.9,
  },
};
