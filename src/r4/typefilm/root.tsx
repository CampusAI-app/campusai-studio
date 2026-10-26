// The two compositions of the round 4 type film (registered by ./entry.ts).
import React from "react";
import { Composition } from "remotion";
import { CLOCK, TypeFilm } from "./TypeFilm";

export const TypeFilmRoot: React.FC = () => (
  <>
    <Composition id="R4-TypeFilm-9x16" component={TypeFilm} fps={30} width={1080} height={1920}
      durationInFrames={CLOCK.duration} defaultProps={{ aspect: "9x16" as const, sound: true }} />
    <Composition id="R4-TypeFilm-16x9" component={TypeFilm} fps={30} width={1920} height={1080}
      durationInFrames={CLOCK.duration} defaultProps={{ aspect: "16x9" as const, sound: true }} />
  </>
);
