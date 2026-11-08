/**
 * A hand-drawn person for the cartoon styles (2026-11-04). The drawings are Open Peeps by Pablo Stanley
 * (openpeeps.com, CC0), taken as React pieces from CeamKrier/react-peeps (MIT, see LICENSE here), read in
 * place and security-passed first. Only the pieces a style uses are kept; add more from that repo the same way.
 * Composition copied from react-peeps' own Peep (body, then the head at 225,0 with the face at 159,186),
 * minus its random gradient ids, which would change between Remotion frames.
 */
import React from "react";
import { Calm } from "./Calm";
import { Coffee } from "./Coffee";
import { Concerned } from "./Concerned";
import { Device } from "./Device";
import { Driven } from "./Driven";
import { Hectic } from "./Hectic";
import { ShortMessy } from "./ShortMessy";
import { SmileBig } from "./SmileBig";
import { Tired } from "./Tired";
import { Afro } from "./Afro";
import { Awe } from "./Awe";
import { BunCurly } from "./BunCurly";
import { ConcernedFear } from "./ConcernedFear";
import { EyesClosed } from "./EyesClosed";
import { Fear } from "./Fear";
import { Gaming } from "./Gaming";
import { GlassRound } from "./GlassRound";
import { GlassRoundThick } from "./GlassRoundThick";
import { Hoodie } from "./Hoodie";
import { LongCurly } from "./LongCurly";
import { MediumStraight } from "./MediumStraight";
import { Paper } from "./Paper";
import { Rage } from "./Rage";
import { Serious } from "./Serious";
import { SmileLol } from "./SmileLol";
import { SmileTeeth } from "./SmileTeeth";
import { Solemn } from "./Solemn";
import { Suspicious } from "./Suspicious";
import { Sweater } from "./Sweater";
import { Twists } from "./Twists";
import type { PieceType } from "./types";

export const FACES = { Calm, Concerned, Hectic, Tired, SmileBig, Driven, Serious, Suspicious, ConcernedFear, Fear, Rage, EyesClosed, Awe, SmileLol, SmileTeeth, Solemn } satisfies Record<string, React.FC<PieceType>>;
export const BODIES = { Device, Coffee, Paper, Hoodie, Sweater, Gaming } satisfies Record<string, React.FC<PieceType>>;
export type FaceName = keyof typeof FACES;
export type BodyName = keyof typeof BODIES;
// More people for the series (11/04, episode 2 round 4, Jacob: "the guys should not be exactly the same as before")
export const HAIRS = { ShortMessy, BunCurly, Afro, LongCurly, MediumStraight, Twists } satisfies Record<string, React.FC<PieceType>>;
export const GLASSES = { GlassRound, GlassRoundThick } satisfies Record<string, React.FC<PieceType>>;
export type HairName = keyof typeof HAIRS;
export type GlassesName = keyof typeof GLASSES;

export const Peep: React.FC<{ face: FaceName; body: BodyName; hair?: HairName; glasses?: GlassesName; ink: string; fill: string; width: number; style?: React.CSSProperties }> = ({
  face, body, hair = "ShortMessy", glasses, ink, fill, width, style,
}) => {
  const Face = FACES[face];
  const Body = BODIES[body];
  const Hair = HAIRS[hair];
  const Glasses = glasses ? GLASSES[glasses] : null;
  return (
    // overflow visible: tall hair (BunCurly) rises above the 0 line and was being sliced flat
    <svg viewBox="0 0 850 1200" width={width} height={(width * 1200) / 850} style={{ overflow: "visible", ...style }}>
      <Body strokeColor={ink} backgroundColor={fill} />
      <g transform="translate(225 0)">
        <Hair strokeColor={ink} backgroundColor={fill} />
        <g transform="translate(159 186)">
          <Face strokeColor={ink} backgroundColor={fill} />
        </g>
        {/* react-peeps' head puts accessories at 47,241 */}
        {Glasses ? (
          <g transform="translate(47 241)">
            <Glasses strokeColor={ink} backgroundColor={fill} />
          </g>
        ) : null}
      </g>
    </svg>
  );
};
