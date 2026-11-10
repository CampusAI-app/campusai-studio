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
import resumeFlow from "../../public/pov-resume/frames.json";
import advisorChat from "../../public/pov-advisor/chat/frames.json";
import type { PaperDeskProps } from "./PaperDesk";
import type { StatChartProps } from "./StatChart";
import type { TeardownProps } from "./Teardown";
import type { ChalkboardProps } from "./Chalkboard";
import type { BlueprintProps } from "./Blueprint";
import type { ComicProps } from "./Comic";
import type { PaperCutoutProps } from "./PaperCutout";

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
  // Round 3 (Jacob: "the beginning is the exact same thing"): cold open on the week, a different line, a countdown,
  // the dorm desk, and an ending that says what CampusAI actually did (one hour, Wed 6:30 to 7:30 PM).
  pov: "My week, Monday to Thursday",
  tally: "Free hours",
  coldOpen: 26,
  // illustrative hours each thing eats; the quiz finds no room, so it costs nothing
  countdown: { from: 9, costs: [2, 1, 2, 1, 2, 1, 0] },
  markOnShirtOnly: true,
  // Round 2 (Jacob: "exactly the same as the other POV"): the week fills like Tetris instead of sticky notes
  notes: ["Work shift", "Reading due", "Work shift", "Evercore coffee chat", "Case brief due", "Resume night 7 PM", "Study for Quiz 2?"],
  // Round 4: a new student (curly bun, round glasses, holding her papers) with her own arc: flat, side-eye, worried,
  // scared at 0, eyes shut when the quiz has nowhere to go, laughing when CampusAI finds the hour.
  faces: ["Serious", "Serious", "Suspicious", "ConcernedFear", "ConcernedFear", "Fear", "EyesClosed"],
  person: { hair: "BunCurly", body: "Paper", glasses: "GlassRound", rest: "Serious", grin: "SmileLol" },
  week: {
    cols: ["Mon", "Tue", "Wed", "Thu"],
    classes: [[0, "BMGT343"], [1, "BMGT310"], [2, "BMGT343"], [3, "BMGT310"], [0, "BMGT380"], [1, "BMGT364"], [2, "BMGT380"], [3, "BMGT364"]],
    days: [0, 1, 2, 3, 2, 2, -1],
  },
  payoff: "CampusAI found you an hour.",
  accent: "hour",
  after: 1,
  mark: "styles/umd/umd-m.svg",
  backdrop: "dorm",
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

/** Episode 4, "Resume at 2 AM" (11/05): the curly bun student (she is the demo's Maya, so the resume on screen is hers).
 * Cold open on the clock, one bullet rewritten six times until it is the sentence she started with, then the real
 * Resume Review at phone width. Facts: films/pov-resume/facts.md. */
export const POV_DOODLE_RESUME: PovDoodleProps = {
  pov: "Fixing one resume bullet at 2 AM",
  tally: "Times rewritten",
  coldOpen: 26,
  pace: { gap: 30, hold: 40 },
  markOnShirtOnly: true,
  notes: [
    "Analyzed stocks and presented ideas to the group.",
    "Analyzed equities and presented insights to the group.",
    "Spearheaded equity analysis.",
    "Leveraged synergies across equities.",
    "Passionate about stocks.",
    "Researched stocks and presented ideas to the group.",
  ],
  faces: ["Serious", "Suspicious", "Suspicious", "ConcernedFear", "Fear", "EyesClosed"],
  person: { hair: "BunCurly", body: "Paper", glasses: "GlassRound", rest: "Serious", grin: "SmileLol" },
  resume: {
    name: "Maya Chen",
    role: "Analyst, Smith Investment Fund",
    bullet: "Researched stocks and presented ideas to the group.",
    clock: ["1:59 AM", "2:00 AM", "2:08 AM", "2:16 AM", "2:23 AM", "2:31 AM", "2:40 AM", "2:47 AM"],
  },
  // was "CampusAI shows what a recruiter sees.", which wrapped to three lines into the tally and the box
  payoff: "CampusAI reads it like a recruiter.",
  accent: "recruiter",
  after: 6,
  mark: "styles/umd/umd-m.svg",
  backdrop: "dorm",
  answer: {
    dir: "pov-resume",
    rec: resumeFlow,
    x0: 0,
    // phone width (500 css), so the text wraps short and reads at 2x; the page's own scrolls and the long wait
    // after opening the suggestion are cut
    segs: [{ from: 2.9, to: 8.6, speed: 1 }, { from: 10.6, to: 16.2, speed: 1 }],
    // ends at 200 so the whole Suggested rewrite is in the box (at 0 only its label showed)
    cam: [[2.9, 0, 30, 1], [5.9, 0, 30, 1], [6.6, 0, 420, 1], [10.7, 0, 420, 1], [11.3, 0, 200, 1], [16.2, 0, 200, 1]],
    pointer: { from: 6.6, to: 8.6 },
    landed: 11.4,
  },
};

/** Episode 3, "Questions I'd never ask my advisor" (11/05): a new student (afro, hoodie). He types three basic questions
 * into an email to his advisor and deletes each one, then asks CampusAI all three at once and gets a straight answer,
 * (round 2: no degree progress after it, Jacob: "we dont need to show the degree progress"). The cringe is his; the advisor is never the joke. Facts: films/pov-advisor/facts.md. */
export const POV_DOODLE_ADVISOR: PovDoodleProps = {
  pov: "Questions I'd never ask my advisor",
  tally: "Questions not asked",
  coldOpen: 12,
  pace: { first: 6, gap: 86, tick: 82, hold: 20 },
  markOnShirtOnly: true,
  email: { to: "My advisor", subject: "Quick question" },
  notes: ["what even is a gen ed", "what does a W mean on my transcript", "is it bad I don't know what my major actually requires"],
  faces: ["Concerned", "ConcernedFear", "EyesClosed"],
  person: { hair: "Afro", body: "Hoodie", rest: "Suspicious", grin: "SmileTeeth" },
  payoff: "Or ask CampusAI all three.",
  accent: "three",
  after: 0,
  // round 5 (Jacob: "The CTA thing shouldnt just be at the end complete like that"): the call to action is the last
  // beat. In the CampusAI box he types "is this a dumb question?", sends it, and the reply lands as the headline.
  then: "Not to CampusAI.",
  thenAccent: "Not",
  thenSize: 96,
  thenDelay: 58,
  thenHold: 45,
  mark: "styles/umd/umd-m.svg",
  answer: [
    // the typing is drawn in the current composer (as the gen eds reel does): the real empty chat greets "Hi Maya" with
    // the Testudo emblem right above the box, and he is not Maya
    { kind: "ask", question: "ok what even is a gen ed, what does a W mean, and is it bad I don't know what my major actually requires", charMs: 26 },
    {
      dir: "pov-advisor/chat",
      rec: advisorChat,
      x0: 0,
      // round 5 (Jacob: "shouldnt scroll down to the bottom. Should just show the answer"): recorded 1600 tall so the
      // chat never scrolls itself, and the camera holds still on his question and the answer, ending as it finishes
      segs: [{ from: 6.8, to: 13.2, speed: 1 }],
      cam: [[6.8, 105, 160, 1.28], [13.2, 105, 160, 1.28]],
      pointer: { from: 98, to: 99 }, // never: these recordings have no pointer
      landed: 9.0,
    },
    { kind: "ask", question: "is this a dumb question?", charMs: 40 },
  ],
};

/** /paper-cutout (11/05, from the Nov 5 Muse send of Tobi's cartoon reels): a student walks across a cut-paper campus
 * from afternoon into night. Every line is on the demo student's real Wednesday (My Calendar), and the payoff is the
 * hour the demo's chat found for Quiz 2. Facts: films/paper-cutout-sample/facts.md. */
export const PAPER_CUTOUT: PaperCutoutProps = {
  beats: [
    { scene: "library", time: "afternoon", caption: "Her shift at McKeldin starts at 4." },
    { scene: "houses", time: "golden", caption: "Her case brief is due today." },
    { scene: "hills", time: "dusk", caption: "Quiz 2 is tomorrow." },
    { scene: "stars", time: "night", caption: "So when does she study?" },
  ],
  payoff: "CampusAI found her an hour.",
  accent: "hour",
  sub: "Wednesday, 6:30 to 7:30 PM.",
};

/** /chalkboard (11/05, Muse send "10 Claude animation styles"): a W is not an F, worked out at the board.
 * Every line is in films/chalkboard-w-not-f/facts.md. */
export const CHALKBOARD: ChalkboardProps = {
  title: "A W is not an F",
  sub: "How UMD works out your GPA",
  formula: { left: "GPA =", top: "quality points", bottom: "credits attempted" },
  left: { big: "F", lines: ["counts as 0 points", "and its credits count"] },
  right: { big: "W", lines: ["not in your GPA"] },
  arrow: true,
  note: ["W means you withdrew after the", "schedule adjustment period"],
  payoff: ["Not sure what counts?", "Ask CampusAI."],
  source: "UMD Undergraduate Catalog, Academic Records and Regulations",
};

/** /blueprint (11/05, Muse send "10 Claude animation styles"): four years drawn as a building, one floor a year, one
 * room a term. Every line is in films/blueprint-four-years/facts.md. */
export const BLUEPRINT: BlueprintProps = {
  title: "Your degree, drawn to scale",
  floors: [
    { label: "Year 1", rooms: ["Fall", "Spring"], dim: "15 cr" },
    { label: "Year 2", rooms: ["Fall", "Spring"], dim: "15 cr" },
    { label: "Year 3", rooms: ["Fall", "Spring"], dim: "15 cr" },
    { label: "Year 4", rooms: ["Fall", "Spring"], dim: "15 cr" },
  ],
  roof: "Graduation",
  height: "4 years, 8 terms",
  total: "120 credits",
  block: {
    name: "Your degree",
    scale: "Scale: one room, one term",
    notes: ["No degree under 120 credits", "At least 40 of them are gen ed", "120 over 8 terms is 15 a term"],
    source: "Sources: UMD Undergraduate Catalog, gened.umd.edu",
  },
  payoff: "Plan all eight terms in CampusAI.",
};

/** /comic (11/05, Muse send "10 Claude animation styles"): picking gen eds as a one-page comic. The four labels are the
 * four sources the real chat's gen eds answer is built from. Every line is in films/comic-gen-eds/facts.md. */
export const COMIC: ComicProps = {
  title: "Picking gen eds",
  open: { caption: "The night before registration", person: { face: "Concerned", body: "Device" }, says: "Which gen eds do I still need?" },
  pile: { caption: "Four tabs later", items: ["Testudo", "PlanetTerp", "Degree audit", "Gen ed guide"] },
  worse: { person: { face: "Hectic", body: "Device" }, says: "Wait, which tab was the audit?" },
  payoff: { sfx: "Ding!", person: { face: "SmileBig", body: "Device" }, says: "Or ask CampusAI once." },
};

/* ---- Batch 1 of the "30 Claude animations" reel (11/08, Gian Angioletti via Muse, names only). Every line of each is in
 * the matching films/<sample>/facts.md. ---- */
import type { TypeSlamProps } from "./TypeSlam";
import type { SplitFlapProps } from "./SplitFlap";
import type { DayCounterProps } from "./DayCounter";
import type { ReceiptProps } from "./Receipt";
import type { BeforeAfterProps } from "./BeforeAfter";
import type { SwissGridProps } from "./SwissGrid";
import type { MoneyStackProps } from "./MoneyStack";

/** /type-slam: the W and F rule from the catalog. films/type-slam-w-not-f/facts.md. */
export const TYPE_SLAM: TypeSlamProps = {
  cards: [
    { text: "A W is not an F.", accent: "not" },
    { text: "An F counts as zero.", accent: "zero" },
    { text: "A W stays out of your GPA.", accent: "out" },
  ],
  source: "UMD Undergraduate Catalog, Academic Records and Regulations",
  cta: "Ask CampusAI.",
};

/** /split-flap: the credits each Finance class needs before you can take it. films/split-flap-finance/facts.md. */
export const SPLIT_FLAP: SplitFlapProps = {
  title: "When Finance classes open up",
  heads: ["Class", "Credits needed"],
  rows: [
    { left: "BMGT440", right: "68" },
    { left: "BMGT441", right: "72" },
    { left: "BMGT443", right: "84" },
    { left: "BMGT444", right: "84" },
    { left: "BMGT445", right: "84" },
  ],
  accent: [2, 3, 4],
  note: "The last three need 84 credits first.",
  source: "Credits completed before you can register. Testudo, Spring 2027.",
  cta: "Plan around them in CampusAI.",
};

/** /day-counter: fall 2026, first class to first final. films/day-counter-fall/facts.md. */
export const DAY_COUNTER: DayCounterProps = {
  title: "Fall 2026, first class to finals",
  from: { label: "First class", date: "2026-08-31" },
  to: { label: "Finals start", date: "2026-12-14" },
  marks: [
    { label: "Thanksgiving break", date: "2026-11-25" },
    { label: "Last class", date: "2026-12-11" },
  ],
  unit: "days",
  source: "UMD Academic Catalog, semester calendar",
};

/** /receipt: two classes that clear four gen eds. films/receipt-gen-eds/facts.md. */
export const RECEIPT: ReceiptProps = {
  title: "Two classes, four gen eds",
  header: ["Spring 2027", "University of Maryland"],
  items: [
    { label: "AOSC123", lines: ["Natural Science", "Big Question"], amount: "3 cr" },
    { label: "JOUR175", lines: ["Scholarship in Practice", "Diversity"], amount: "3 cr" },
  ],
  totals: [
    { label: "Credits", value: "6" },
    { label: "Gen eds cleared", value: "4" },
  ],
  stamp: "Double counted",
  source: "Testudo, Spring 2027. Only if you still need all four.",
  cta: "Find yours in CampusAI.",
};

/** /before-after: one press of Add to CampusAI Calendar, the same week before and after. films/before-after-calendar/facts.md. */
export const BEFORE_AFTER: BeforeAfterProps = {
  title: "One press, and it's on your week",
  before: { src: "plan-my-week/light/before.jpg", label: "Suggested" },
  after: { src: "plan-my-week/light/event-landed.jpg", label: "Added" },
  image: { w: 4320, h: 2700 },
  crop: { x: 2330, y: 1080, w: 840, h: 960 },
  focus: { x: 2750, y: 1740, w: 380, h: 190 },
  caption: "The Goldman Sachs session is on her week now.",
  source: "The CampusAI demo, My Calendar, Nov 8 to 14.",
  cta: "Ask CampusAI anything.",
};

/** /swiss-grid: BMGT340's fall enrolment. films/swiss-grid-bmgt340/facts.md. */
export const SWISS_GRID: SwissGridProps = {
  headline: "Business Finance keeps growing",
  big: { value: "659", label: "BMGT340 students, fall 2025" },
  cells: [
    { value: "+22%", label: "since fall 2016" },
    { value: "538", label: "students in fall 2016" },
    { value: "5", label: "straight falls of growth" },
  ],
  source: "Letter grades reported each fall, PlanetTerp.",
};

/** /money-stack: a year at UMD, in state, on campus. films/money-stack-year/facts.md. */
export const MONEY_STACK: MoneyStackProps = {
  title: "A year at UMD, in state, on campus",
  parts: [
    { label: "Tuition", amount: 11014 },
    { label: "Housing", amount: 10290 },
    { label: "Food plan", amount: 7180 },
    { label: "Fees", amount: 1820 },
    { label: "Transport", amount: 1514 },
    { label: "Books", amount: 1250 },
    { label: "Personal", amount: 1200 },
  ],
  per: 1000,
  totalLabel: "estimated, 2026 to 2027",
  note: "The last three are averages UMD does not bill.",
  source: "UMD Office of Student Financial Aid, 2026-2027 estimated costs.",
};

/* ---- Batch 2 of the "30 Claude animations" reel (11/08). Every line of each is in the matching films/<sample>/facts.md. ---- */
import type { IcebergProps } from "./Iceberg";
import type { NeonSilhouetteProps } from "./NeonSilhouette";
import type { DeepTimeProps } from "./DeepTime";
import type { HologramProps } from "./Hologram";
import type { InkDoodleProps } from "./InkDoodle";
import type { IsoFlowProps } from "./IsoFlow";
import type { TurntableProps } from "./Turntable";
import type { ParticleLogoProps } from "./ParticleLogo";

/** /iceberg: what BMGT441's name does not tell you. films/iceberg-bmgt441/facts.md. */
export const ICEBERG: IcebergProps = {
  title: "One class, three gates",
  tip: { label: "BMGT441", sub: "Fixed Income, 3 credits" },
  below: ["Needs BMGT340 first", "Finance majors only", "72 credits completed"],
  source: "Testudo, Spring 2027.",
  cta: "Ask CampusAI before you register.",
};

/** /neon-silhouette: finals week, on the wall. films/neon-finals/facts.md. */
export const NEON_SILHOUETTE: NeonSilhouetteProps = {
  person: { face: "Tired", body: "Device", hair: "ShortMessy" },
  lines: ["Finals start", "Dec 14."],
  sub: "Last day of classes is Dec 11.",
  source: "UMD Academic Catalog, semester calendar",
  cta: "Ask CampusAI anything.",
};

/** /deep-time: one term inside UMD's history. films/deep-time-umd/facts.md. */
export const DEEP_TIME: DeepTimeProps = {
  title: "One term, 170 years",
  focus: { label: "Fall 2026, one term", from: 2026.66, to: 2026.97 },
  stages: [
    { from: 2026.3, to: 2030.7, caption: "Inside four years" },
    { from: 1846, to: 2036, caption: "Inside 170 years of UMD" },
  ],
  marks: [
    { year: 1856, label: "Chartered as Maryland Agricultural College" },
    { year: 1920, label: "Becomes the University of Maryland" },
  ],
  line: "One term is a sliver. Make it count.",
  source: "umd.edu/about/history and the UMD Academic Catalog.",
  cta: "Plan all eight terms in CampusAI.",
};

/** /hologram: the gen ed minimum. films/hologram-gen-ed/facts.md. */
export const HOLOGRAM: HologramProps = {
  title: "The gen ed minimum",
  figure: { value: "40", label: "credits of gen eds" },
  caption: "UMD requires at least 40 credits of General Education.",
  source: "gened.umd.edu",
  cta: "Ask CampusAI which ones you still need.",
};

/** /ink-doodle: gen eds that double count. films/ink-doodle-gen-eds/facts.md. */
export const INK_DOODLE: InkDoodleProps = {
  title: "Gen eds that double count",
  notes: [
    { text: "AOSC123 counts twice", mark: "tick" },
    { text: "JOUR175 counts twice", mark: "tick" },
    { text: "2 classes clear 4 gen eds", mark: "circle", circle: "4" },
    { text: "if you still need all four", mark: "underline" },
  ],
  source: "Testudo, Spring 2027.",
  cta: "Find yours in CampusAI.",
};

/** /iso-flow: two feeds into My Calendar. films/iso-flow-calendar/facts.md. */
export const ISO_FLOW: IsoFlowProps = {
  title: "Two feeds, one week",
  nodes: [
    { id: "canvas", label: "Canvas", sub: "your assignments", x: -1.5, y: 1.1 },
    { id: "events", label: "Events", sub: "the ones you add", x: 1.1, y: -1.5 },
    { id: "cal", label: "My Calendar", sub: "one week", x: 1.4, y: 1.4, big: true },
  ],
  edges: [{ from: "canvas", to: "cal" }, { from: "events", to: "cal" }],
  caption: "Assignments and the events you add land on My Calendar.",
  source: "Paste your Canvas calendar link once. Press Add to CampusAI Calendar on an event.",
};

/** /turntable: the four-year planner. films/turntable-planner/facts.md. */
export const TURNTABLE: TurntableProps = {
  title: "Your four-year plan",
  image: { src: "pass/planner.jpg", w: 2880, h: 1800 },
  crop: { x: 470, y: 60, w: 2380, h: 1560 },
  caption: "See what's left to graduate, and what to take next.",
  source: "The CampusAI demo, Planner and Progress.",
  cta: "Ask CampusAI anything.",
};

/** /particle-logo: the logo sting. films/particle-logo/facts.md. */
export const PARTICLE_LOGO: ParticleLogoProps = { line: "Ask CampusAI anything." };

/* ---- Batch 3 of the "30 Claude animations" reel (11/08). Every line of each is in the matching films/<sample>/facts.md. ---- */
import type { GitCityProps } from "./GitCity";
import type { AgentSwarmProps } from "./AgentSwarm";
import type { TerminalBloomProps } from "./TerminalBloom";
import type { LaptopRevealProps } from "./LaptopReveal";
import type { NotificationsProps } from "./Notifications";
import planWeekFlow from "../../public/plan-my-week/flow/frames.json";
import type { BillboardProps } from "./Billboard";
import type { BrandedBagProps } from "./BrandedBag";
import type { PhoneAlertProps } from "./PhoneAlert";
import type { CountdownProps } from "./Countdown";
import type { PhotoPileProps } from "./PhotoPile";
import type { BasketProps } from "./Basket";
import type { SpinWheelProps } from "./SpinWheel";

/** /git-city: ten falls of six Smith core classes. films/git-city-smith-core/facts.md. */
export const GIT_CITY: GitCityProps = {
  title: "Ten falls of the Smith core",
  rows: [
    { label: "BMGT220", values: [542, 508, 415, 409, 458, 467, 401, 361, 384, 569] },
    { label: "BMGT221", values: [302, 314, 279, 280, 339, 288, 262, 307, 343, 421] },
    { label: "BMGT230", values: [588, 558, 335, 513, 443, 485, 489, 514, 506, 592] },
    { label: "BMGT340", values: [538, 501, 518, 516, 506, 524, 564, 607, 635, 659] },
    { label: "BMGT350", values: [560, 512, 515, 495, 542, 594, 560, 518, 540, 718] },
    { label: "BMGT364", values: [518, 486, 512, 477, 552, 478, 525, 486, 559, 624] },
  ],
  cols: ["2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025"],
  accent: 9,
  caption: "Fall 2025 was the biggest of the ten for all six.",
  source: "Students with a letter grade each fall, PlanetTerp.",
};

/** /agent-swarm: the four sources behind the gen eds answer. films/agent-swarm-gen-eds/facts.md. */
export const AGENT_SWARM: AgentSwarmProps = {
  title: "One question, four sources",
  question: "Which gen eds do I still need?",
  sources: ["Testudo", "PlanetTerp", "Degree audit", "Gen ed guide"],
  answer: "One answer, built from all four.",
  source: "The sources the CampusAI chat reads for this answer.",
  cta: "Ask CampusAI anything.",
};

/** /terminal-bloom: when each Finance class opens. films/terminal-bloom-finance/facts.md. */
export const TERMINAL_BLOOM: TerminalBloomProps = {
  title: "When can I take it?",
  command: "credits needed for Finance classes",
  results: [
    { label: "BMGT440", sub: "68 credits" },
    { label: "BMGT441", sub: "72 credits" },
    { label: "BMGT443", sub: "84 credits", accent: true },
    { label: "BMGT444", sub: "84 credits", accent: true },
    { label: "BMGT445", sub: "84 credits", accent: true },
  ],
  caption: "The last three wait for 84 credits.",
  source: "Testudo, Spring 2027.",
  cta: "Plan around them in CampusAI.",
};

/** /laptop-reveal: adding Canvas, recorded on the real demo. films/laptop-reveal-canvas/facts.md. */
export const LAPTOP_REVEAL: LaptopRevealProps = {
  title: "Your week, on your laptop",
  frames: (() => {
    // the recording's own timestamps, sampled to 30 fps from the Canvas dialog opening to the classes landing
    const fr = (planWeekFlow as { frames: { t: number; name: string }[] }).frames;
    const out: string[] = [];
    for (let t = 8.4; t <= 17.6; t += 1 / 30) {
      let best = fr[0];
      for (const x of fr) if (Math.abs(x.t - t) < Math.abs(best.t - t)) best = x;
      out.push(`plan-my-week/flow/${best.name}`);
    }
    return out;
  })(),
  caption: "Paste your Canvas link once. Assignments land on My Calendar.",
  source: "The CampusAI demo, My Calendar.",
  cta: "Ask CampusAI anything.",
};

/** /notifications: three real notification rows. films/notifications-demo/facts.md. */
export const NOTIFICATIONS: NotificationsProps = {
  title: "What changed, while you were in class",
  image: { src: "pass/notifications.jpg", w: 2880, h: 1800 },
  rows: [
    { x: 560, y: 1194, w: 1340, h: 340 },
    { x: 560, y: 848, w: 1340, h: 344 },
    { x: 560, y: 328, w: 1340, h: 306 },
  ],
  caption: "New matches and moved due dates, in one place.",
  source: "The CampusAI demo, Notifications.",
  cta: "Ask CampusAI anything.",
};

// 2026-11-10: seven styles from Shaan Johari's Black Friday Styles Part 6 reel via Muse (prompts gated, our own builds).
// Each sample's facts are in films/<folder>/facts.md, outside the repo.
/** /One press puts it on your week, Add to CampusAI Calendar on a night billboard. films/billboard-calendar/facts.md. */
export const BILLBOARD: BillboardProps = {
  "teaser": "Saw an event you like?",
  "sign": [
    "Your week",
    "Next exit"
  ],
  "capture": {
    "src": "plan-my-week/dark/event-landed.jpg",
    "w": 4320,
    "h": 2700,
    "crop": {
      "x": 2740,
      "y": 1420,
      "w": 800,
      "h": 560
    }
  },
  "headline": "One press puts it on your week.",
  "pill": "Add to CampusAI Calendar",
  "source": "The CampusAI demo, My Calendar, Nov 8 to 14.",
  "cta": "Ask CampusAI anything."
};

/** /Exams are coming, the logo on a swinging bag, finals dates from the UMD catalog. films/branded-bag-finals/facts.md. */
export const BRANDED_BAG: BrandedBagProps = {
  "headline": [
    "Exams",
    "are coming"
  ],
  "date": "Fall finals, December 14 to 21",
  "tag": {
    "src": "plan-my-week/dark/event-landed.jpg",
    "w": 4320,
    "h": 2700,
    "crop": {
      "x": 676,
      "y": 1389,
      "w": 713,
      "h": 500
    }
  },
  "cta": "Ask CampusAI anything."
};

/** /The demo's real BMGT380 assignment moved notification, pressed through to My Calendar. films/phone-alert-moved/facts.md. */
export const PHONE_ALERT: PhoneAlertProps = {
  "title": "BMGT380 assignment moved",
  "body": "Reading Response 6 is now due Sun, Oct 18.",
  "buttons": [
    "Later",
    "Open My Calendar"
  ],
  "pill": "Opened My Calendar, week of Oct 18",
  "product": {
    "src": "sys/moved-2-bell-open-calendar.jpg",
    "w": 2880,
    "h": 1800,
    "crop": {
      "x": 1822,
      "y": 122,
      "w": 795,
      "h": 398
    }
  },
  "opens": {
    "src": "sys/moved-3-calendar.jpg",
    "w": 2880,
    "h": 1800,
    "crop": {
      "x": 943,
      "y": 70,
      "w": 1300,
      "h": 651
    }
  },
  "source": "The CampusAI demo, Oct 23. Canvas moved the date.",
  "cta": "Know when a due date moves."
};

/** /Days to Fall 2026 finals from the UMD catalog, counted from a stated moment. films/countdown-finals/facts.md. */
export const COUNTDOWN: CountdownProps = {
  "lead": "Fall 2026 finals start in",
  "target": "2026-12-14T00:00:00-05:00",
  "asOf": "2026-11-10T09:00:00-05:00",
  "units": [
    "days",
    "hours",
    "min",
    "sec"
  ],
  "url": "campusai.app",
  "product": {
    "src": "sys/moved-3-calendar.jpg",
    "w": 2880,
    "h": 1800,
    "crop": {
      "x": 446,
      "y": 892,
      "w": 484,
      "h": 530
    }
  },
  "source": "Finals Mon, Dec 14 (UMD catalog). As of Nov 10, 9 AM ET.",
  "cta": "Ask CampusAI anything."
};

/** /Real event cards pile up, then clear to the page's own count of 13 ranked events. films/photo-pile-events/facts.md. */
export const PHOTO_PILE: PhotoPileProps = {
  "photoSrc": "pass/events-tall.jpg",
  "photoImage": {
    "w": 2880,
    "h": 3744
  },
  "photos": [
    {
      "x": 470,
      "y": 2980,
      "w": 1200,
      "h": 680
    },
    {
      "x": 1642,
      "y": 2536,
      "w": 1200,
      "h": 680
    },
    {
      "x": 1642,
      "y": 2094,
      "w": 1200,
      "h": 680
    },
    {
      "x": 1642,
      "y": 1772,
      "w": 1200,
      "h": 680
    },
    {
      "x": 470,
      "y": 2094,
      "w": 1200,
      "h": 680
    },
    {
      "x": 470,
      "y": 2536,
      "w": 1200,
      "h": 680
    },
    {
      "x": 470,
      "y": 1772,
      "w": 1200,
      "h": 680
    },
    {
      "x": 1642,
      "y": 764,
      "w": 1200,
      "h": 680
    },
    {
      "x": 470,
      "y": 764,
      "w": 1200,
      "h": 680
    },
    {
      "x": 1642,
      "y": 320,
      "w": 1200,
      "h": 680
    },
    {
      "x": 470,
      "y": 320,
      "w": 1200,
      "h": 680
    }
  ],
  "shot": {
    "src": "pass/events.jpg",
    "crop": {
      "x": 466,
      "y": 40,
      "w": 1540,
      "h": 1760
    }
  },
  "big": "13",
  "pill": "upcoming events, ranked for you",
  "source": "The CampusAI demo, Events, Oct 23 to Nov 8.",
  "cta": "See yours in CampusAI.",
  "mark": {
    "x": 1764,
    "y": 74,
    "w": 198,
    "h": 52
  }
};

/** /Real club cards drop into a basket, the page's own 7 orgs aligned with your profile. films/basket-clubs/facts.md. */
export const BASKET: BasketProps = {
  "kicker": "A question for Terps",
  "headline": "You're still shopping for clubs…",
  "turn": "right?",
  "itemSrc": "pass/organizations-tall.jpg",
  "itemImage": {
    "w": 2880,
    "h": 4540
  },
  "items": [
    {
      "x": 488,
      "y": 2206,
      "w": 774,
      "h": 464
    },
    {
      "x": 1270,
      "y": 2206,
      "w": 774,
      "h": 464
    },
    {
      "x": 2050,
      "y": 2206,
      "w": 774,
      "h": 464
    },
    {
      "x": 488,
      "y": 2678,
      "w": 774,
      "h": 464
    }
  ],
  "pill": "7 orgs aligned with your profile",
  "source": "The CampusAI demo, Organizations, Oct 23.",
  "cta": "Find yours in CampusAI."
};

/** /A random wheel of real demo events, then the real Evercore card and its reason. films/spin-wheel-events/facts.md. */
export const SPIN_WHEEL: SpinWheelProps = {
  "title": "Can't decide what to go to?",
  "segments": [
    "Coffee chat",
    "Billiards",
    "Football",
    "Debate",
    "Stock pitch",
    "Concert",
    "Bootcamp",
    "Dance show"
  ],
  "land": 1,
  "randomLine": "A wheel picks at random.",
  "pickLine": "CampusAI picks with a reason.",
  "pickRed": "reason",
  "card": {
    "src": "campus/ev-evercore.png",
    "w": 1148,
    "h": 420,
    "mark": {
      "x": 30,
      "y": 254,
      "w": 966
    }
  },
  "reason": "Restructuring is on your target list and both analysts came out of Smith finance.",
  "source": "The CampusAI demo's events, for its sample student.",
  "cta": "Ask CampusAI anything."
};
