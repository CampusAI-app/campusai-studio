import React from "react";
import { Composition } from "remotion";
import { LeftOnRead, LOR_FRAMES } from "./LeftOnRead";
import { DoodleSample, DOODLE_SAMPLE_FRAMES } from "./Sample";

// Muse pass 2026-11-25, jackson. Register this folder's compositions here only.
export const MuseJacksonRoot: React.FC = () => (
  <>
    <Composition id="Muse1125-LeftOnReadDoodle-9x16" component={LeftOnRead} durationInFrames={LOR_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Kit-DoodleCards" component={DoodleSample} durationInFrames={DOODLE_SAMPLE_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
