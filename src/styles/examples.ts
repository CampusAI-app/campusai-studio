/** The worked CampusAI example of each style. Every word and number here is in films/one-prompt-styles/facts.md. */
import type { HeadlineProps } from "./Headline";
import type { InkWashProps } from "./InkWash";
import type { MapRouteProps } from "./MapRoute";
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
