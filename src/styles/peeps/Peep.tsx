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
import type { PieceType } from "./types";

export const FACES = { Calm, Concerned, Hectic, Tired, SmileBig, Driven } satisfies Record<string, React.FC<PieceType>>;
export const BODIES = { Device, Coffee } satisfies Record<string, React.FC<PieceType>>;
export type FaceName = keyof typeof FACES;
export type BodyName = keyof typeof BODIES;

export const Peep: React.FC<{ face: FaceName; body: BodyName; ink: string; fill: string; width: number; style?: React.CSSProperties }> = ({
  face, body, ink, fill, width, style,
}) => {
  const Face = FACES[face];
  const Body = BODIES[body];
  return (
    <svg viewBox="0 0 850 1200" width={width} height={(width * 1200) / 850} style={style}>
      <Body strokeColor={ink} backgroundColor={fill} />
      <g transform="translate(225 0)">
        <ShortMessy strokeColor={ink} backgroundColor={fill} />
        <g transform="translate(159 186)">
          <Face strokeColor={ink} backgroundColor={fill} />
        </g>
      </g>
    </svg>
  );
};
