/**
 * The doodle cards on their own (kit sample, no footage): what each card does, popping on its beat over the flat
 * ground the reference uses when the speaker sits small. Safe for the public repo: no person, no student words.
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { Chip, DOODLE, DoodleCard, PinList, Starburst } from "./DoodleCards";

export const DOODLE_SAMPLE_FRAMES = 180;

export const DoodleSample: React.FC = () => (
  <AbsoluteFill style={{ background: DOODLE.ground }}>
    <DoodleCard at={0} x={330} y={330} w={240} rot={-4} text="5" />
    <DoodleCard at={6} x={560} y={340} w={240} rot={3} text="PART" />
    <DoodleCard at={12} x={800} y={330} w={300} rot={-2} text="STORY" />
    <DoodleCard at={24} x={330} y={560} w={330} tone="hand" text="1. Hook" size={56} edge rot={-2} />
    <DoodleCard at={26} x={360} y={680} w={400} tone="hand" text="2. Rising action" size={50} edge rot={1} />
    <DoodleCard at={28} x={350} y={800} w={430} tone="hand" text="3. Second conflict" size={48} edge rot={-1} />
    <DoodleCard at={30} x={330} y={920} w={300} tone="hand" text="4. Climax" size={52} edge rot={2} />
    <DoodleCard at={32} x={360} y={1040} w={380} tone="hand" text="5. Resolution" size={52} edge rot={-2} />
    <Starburst at={60} x={800} y={720} r={190} />
    <DoodleCard at={60} x={800} y={720} w={250} rot={-5} icon="clock" label="the timeline" paper="lined" />
    <DoodleCard at={84} x={800} y={1010} w={220} rot={4} icon="question" />
    <PinList at={100} x={760} y={1300} w={420} rot={2} title="open questions" items={[{ label: "answered", tickAt: 130 }, { label: "answered", tickAt: 145 }]} closeAt={160} />
    <Chip at={0} to={60} text="five part" />
    <Chip at={60} to={120} text="second conflict" dark />
    <Chip at={120} to={181} text="all answered" />
  </AbsoluteFill>
);
