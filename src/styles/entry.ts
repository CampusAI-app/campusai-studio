/**
 * The one-prompt styles' own Remotion entry (2026-11-01), separate from Root.tsx so they never fight the
 * older films. `format` is a prop: vertical by default, feed or wide when asked.
 *   npx remotion render src/styles/entry.ts Style-Teardown out/styles/teardown.mp4
 */
import React from "react";
import { Composition, registerRoot } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { END_FRAMES, SIZES, type Format } from "./common";
import { POV_DOODLE_ADVISOR, POV_DOODLE_RESUME, POV_DOODLE_WEEK, TWO_PROFESSORS, FLAT_CARTOON, HEADLINE, INK_WASH, MAP_ROUTE, PAPER_DESK, POV_DOODLE, STAT_CHART, TEARDOWN } from "./examples";
import { FlatCartoon, flatEnd } from "./FlatCartoon";
import { PovDoodle, answerFrames, povEnd } from "./PovDoodle";
import { TwoProfessors, twoProfessorsEnd } from "./TwoProfessors";
import { HEADLINE_END, Headline } from "./Headline";
import { INK_TOTAL, InkWash } from "./InkWash";
import { MapRoute, ROUTE_END } from "./MapRoute";
import { PAPER_DESK_END, PaperDesk } from "./PaperDesk";
import { STAT_END, StatChart } from "./StatChart";
import { TEARDOWN_END, Teardown } from "./Teardown";
import { BLUEPRINT, CHALKBOARD, COMIC } from "./examples";
import { Comic, comicEnd } from "./Comic";
import { Blueprint, blueprintEnd } from "./Blueprint";
import { Chalkboard, chalkEnd } from "./Chalkboard";
import { PAPER_CUTOUT } from "./examples";
import { PaperCutout, paperEnd } from "./PaperCutout";
import { BEFORE_AFTER, DAY_COUNTER, MONEY_STACK, RECEIPT, SPLIT_FLAP, SWISS_GRID, TYPE_SLAM } from "./examples";
import { TypeSlam, slamEnd } from "./TypeSlam";
import { SplitFlap, flapEnd } from "./SplitFlap";
import { DayCounter, counterEnd } from "./DayCounter";
import { Receipt, receiptEnd } from "./Receipt";
import { BeforeAfter, beforeAfterEnd } from "./BeforeAfter";
import { SwissGrid, swissEnd } from "./SwissGrid";
import { MoneyStack, stackEnd } from "./MoneyStack";
import { DEEP_TIME, HOLOGRAM, ICEBERG, INK_DOODLE, ISO_FLOW, NEON_SILHOUETTE, PARTICLE_LOGO, TURNTABLE } from "./examples";
import { Iceberg, icebergEnd } from "./Iceberg";
import { NeonSilhouette, neonEnd } from "./NeonSilhouette";
import { DeepTime, deepEnd } from "./DeepTime";
import { Hologram, hologramEnd } from "./Hologram";
import { InkDoodle, doodleEnd } from "./InkDoodle";
import { IsoFlow, isoEnd } from "./IsoFlow";
import { Turntable, turntableEnd } from "./Turntable";
import { ParticleLogo, particleEnd } from "./ParticleLogo";
import { AGENT_SWARM, GIT_CITY, LAPTOP_REVEAL, NOTIFICATIONS, TERMINAL_BLOOM } from "./examples";
import { GitCity, cityEnd } from "./GitCity";
import { AgentSwarm, swarmEnd } from "./AgentSwarm";
import { TerminalBloom, bloomEnd } from "./TerminalBloom";
import { LaptopReveal, laptopEnd } from "./LaptopReveal";
import { Notifications, notifEnd } from "./Notifications";

/* eslint-disable @typescript-eslint/no-explicit-any */
const STYLES: { id: string; c: React.FC<any>; props: any; frames: number; dur?: (p: any) => number }[] = [
  { id: "Style-Teardown", c: Teardown, props: TEARDOWN, frames: TEARDOWN_END + END_FRAMES + 12 },
  { id: "Style-PaperDesk", c: PaperDesk, props: PAPER_DESK, frames: PAPER_DESK_END + END_FRAMES + 12 },
  { id: "Style-Headline", c: Headline, props: HEADLINE, frames: HEADLINE_END + END_FRAMES + 12 },
  { id: "Style-StatChart", c: StatChart, props: STAT_CHART, frames: STAT_END + END_FRAMES + 12 },
  { id: "Style-MapRoute", c: MapRoute, props: MAP_ROUTE, frames: ROUTE_END + END_FRAMES + 12 },
  { id: "Style-InkWash", c: InkWash, props: INK_WASH, frames: INK_TOTAL },
  // The cartoon pair (2026-11-04): their length follows the subject, so it is worked out from the props.
  { id: "Style-PovDoodle", c: PovDoodle, props: POV_DOODLE, frames: 0, dur: (p) => povEnd(p.notes.length, p.answer ? answerFrames(p.answer) : 0) + END_FRAMES + 12 },
  { id: "Style-PovDoodle-Week", c: PovDoodle, props: POV_DOODLE_WEEK, frames: 0, dur: (p) => povEnd(p.notes.length, p.answer ? answerFrames(p.answer) : 0) + END_FRAMES + 12 },
  { id: "Style-PovDoodle-Resume", c: PovDoodle, props: POV_DOODLE_RESUME, frames: 0, dur: (p) => povEnd(p.notes.length, p.answer ? answerFrames(p.answer) : 0, p.pace) + END_FRAMES + 12 },
  { id: "Style-PovDoodle-Advisor", c: PovDoodle, props: POV_DOODLE_ADVISOR, frames: 0, dur: (p) => povEnd(p.notes.length, (p.answer ? answerFrames(p.answer) : 0) + (p.thenHold ?? 0), p.pace) + END_FRAMES + 12 },
  { id: "Reel-TwoProfessors", c: TwoProfessors, props: TWO_PROFESSORS, frames: 0, dur: (p) => twoProfessorsEnd(p) + END_FRAMES + 12 },
  { id: "Style-FlatCartoon", c: FlatCartoon, props: FLAT_CARTOON, frames: 0, dur: (p) => flatEnd(p.points.length) + END_FRAMES + 12 },
  // Chalkboard, blueprint, comic halftone (2026-11-05, Muse send "10 Claude animation styles")
  { id: "Style-Chalkboard", c: Chalkboard, props: CHALKBOARD, frames: 0, dur: (p) => chalkEnd(p) + END_FRAMES + 12 },
  { id: "Style-Blueprint", c: Blueprint, props: BLUEPRINT, frames: 0, dur: (p) => blueprintEnd(p) + END_FRAMES + 12 },
  { id: "Style-Comic", c: Comic, props: COMIC, frames: 0, dur: (p) => comicEnd(p) + END_FRAMES + 12 },
  // 11/05: the paper cutout storybook, its length from its beats
  { id: "Style-PaperCutout", c: PaperCutout, props: PAPER_CUTOUT, frames: 0, dur: (p) => paperEnd(p) + END_FRAMES + 12 },
  // 11/08, batch 1 of the "30 Claude animations" reel (Gian Angioletti via Muse): type and number looks
  { id: "Style-TypeSlam", c: TypeSlam, props: TYPE_SLAM, frames: 0, dur: (p) => slamEnd(p) + END_FRAMES + 12 },
  { id: "Style-SplitFlap", c: SplitFlap, props: SPLIT_FLAP, frames: 0, dur: (p) => flapEnd(p) + END_FRAMES + 12 },
  { id: "Style-DayCounter", c: DayCounter, props: DAY_COUNTER, frames: 0, dur: (p) => counterEnd(p) + END_FRAMES + 12 },
  { id: "Style-Receipt", c: Receipt, props: RECEIPT, frames: 0, dur: (p) => receiptEnd(p) + END_FRAMES + 12 },
  { id: "Style-BeforeAfter", c: BeforeAfter, props: BEFORE_AFTER, frames: 0, dur: (p) => beforeAfterEnd(p) + END_FRAMES + 12 },
  { id: "Style-SwissGrid", c: SwissGrid, props: SWISS_GRID, frames: 0, dur: (p) => swissEnd(p) + END_FRAMES + 12 },
  { id: "Style-MoneyStack", c: MoneyStack, props: MONEY_STACK, frames: 0, dur: (p) => stackEnd(p) + END_FRAMES + 12 },
  // 11/08, batch 2: scenes and stings
  { id: "Style-Iceberg", c: Iceberg, props: ICEBERG, frames: 0, dur: (p) => icebergEnd(p) + END_FRAMES + 12 },
  { id: "Style-NeonSilhouette", c: NeonSilhouette, props: NEON_SILHOUETTE, frames: 0, dur: (p) => neonEnd(p) + END_FRAMES + 12 },
  { id: "Style-DeepTime", c: DeepTime, props: DEEP_TIME, frames: 0, dur: (p) => deepEnd(p) + END_FRAMES + 12 },
  { id: "Style-Hologram", c: Hologram, props: HOLOGRAM, frames: 0, dur: (p) => hologramEnd(p) + END_FRAMES + 12 },
  { id: "Style-InkDoodle", c: InkDoodle, props: INK_DOODLE, frames: 0, dur: (p) => doodleEnd(p) + END_FRAMES + 12 },
  { id: "Style-IsoFlow", c: IsoFlow, props: ISO_FLOW, frames: 0, dur: (p) => isoEnd(p) + END_FRAMES + 12 },
  { id: "Style-Turntable", c: Turntable, props: TURNTABLE, frames: 0, dur: (p) => turntableEnd(p) + END_FRAMES + 12 },
  { id: "Style-ParticleLogo", c: ParticleLogo, props: PARTICLE_LOGO, frames: 0, dur: (p) => particleEnd(p) + END_FRAMES + 12 },
  // 11/08, batch 3: data, product and process looks (Globe Arcs and Contour Map wait on Jacob's call on the 11/06 no-map rule)
  { id: "Style-GitCity", c: GitCity, props: GIT_CITY, frames: 0, dur: (p) => cityEnd(p) + END_FRAMES + 12 },
  { id: "Style-AgentSwarm", c: AgentSwarm, props: AGENT_SWARM, frames: 0, dur: (p) => swarmEnd(p) + END_FRAMES + 12 },
  { id: "Style-TerminalBloom", c: TerminalBloom, props: TERMINAL_BLOOM, frames: 0, dur: (p) => bloomEnd(p) + END_FRAMES + 12 },
  // renders need --gl=angle (the photoreal laptop is WebGL)
  { id: "Style-LaptopReveal", c: LaptopReveal, props: LAPTOP_REVEAL, frames: 0, dur: (p) => laptopEnd(p) + END_FRAMES + 12 },
  { id: "Style-Notifications", c: Notifications, props: NOTIFICATIONS, frames: 0, dur: (p) => notifEnd(p) + END_FRAMES + 12 },
];

const sized = (dur?: (p: any) => number): CalculateMetadataFunction<any> => ({ props }) => ({
  ...SIZES[(props.format as Format) ?? "vertical"],
  ...(dur ? { durationInFrames: dur(props) } : {}),
});

const Root: React.FC = () =>
  React.createElement(
    React.Fragment,
    null,
    STYLES.map((s) =>
      React.createElement(Composition, {
        key: s.id, id: s.id, component: s.c, defaultProps: s.props, durationInFrames: s.frames || (s.dur ? s.dur(s.props) : 1),
        fps: 30, width: 1080, height: 1920, calculateMetadata: sized(s.dur),
      } as any),
    ),
  );

registerRoot(Root);
