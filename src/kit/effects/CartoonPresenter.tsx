/**
 * CartoonPresenter (2026-11-24, Muse pass, from Alex Prompter's Cicada demo reel, instagram.com/reel/DgFw8w-xrJD). One
 * small cartoon college student who stands at the bottom centre of the frame for the whole film, cropped at the waist,
 * and changes pose on the beats: shrugs at the problem, points up at the screen, holds up a card (the logo),
 * stands proud at the payoff. Jacob has asked for one recurring cartoon student for CampusAI; this is that student.
 *
 * The drawings are Open Peeps by Pablo Stanley (openpeeps.com, CC0) through CeamKrier/react-peeps (MIT): head pieces from
 * `styles/peeps` (imported, not copied), and four bust poses in `./presenter/`: PointingUp, Whatever (the shrug) and
 * ArmsCrossed taken from react-peeps the same way, and PaperPlain, a copy of the Paper bust in `styles/peeps`. Each bust
 * comes in its own printed shirt, so the prints were removed from PointingUp and PaperPlain: one plain dark tee in every
 * pose, one recognisable student. Open Peeps has no wave or thumbs up bust, so those are not offered; Explaining was
 * tried and dropped because its striped shirt cannot be made to match.
 *
 * Usage: <CartoonPresenter poses={[{ at: 0, pose: "shrug" }, { at: 90, pose: "point" }]} hold={<Logo />} />
 * A pose change pops (a quick dip and settle, 7 frames); between changes the student breathes (a slow 2 px bob). A thin
 * warm rim light outlines the figure so the dark tee still reads on a dark ground.
 * `hold` is drawn on the paper while the pose is "hold", turned and sized to sit on the sheet.
 */
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { FACES, HAIRS, type FaceName, type HairName } from "../../styles/peeps/Peep";
import { PaperPlain } from "./presenter/PaperPlain";
import { PointingUp } from "./presenter/PointingUp";
import { Whatever } from "./presenter/Whatever";
import { ArmsCrossed } from "./presenter/ArmsCrossed";
import type { PieceType } from "../../styles/peeps/types";

export type PresenterPose = "point" | "shrug" | "hold" | "proud";

const BODY: Record<PresenterPose, React.FC<PieceType>> = {
  point: PointingUp,
  shrug: Whatever,
  hold: PaperPlain,
  proud: ArmsCrossed,
};
/** The face that goes with each pose (Open Peeps faces). */
const FACE: Record<PresenterPose, FaceName> = {
  point: "SmileTeeth",
  shrug: "Concerned",
  hold: "SmileBig",
  proud: "SmileBig",
};

export type CartoonPresenterProps = {
  poses: { at: number; pose: PresenterPose; face?: FaceName }[];
  /** Visible height in px (the figure is cropped at the waist by the frame bottom). Default 420 (22% of 1920). */
  height?: number;
  /** Centre x, px. Default 540. */
  cx?: number;
  hair?: HairName;
  ink?: string;
  fill?: string;
  /** What the student holds up in the "hold" pose, drawn over the sheet. */
  hold?: React.ReactNode;
  /** Where the sheet sits in the 850 x 1200 drawing, for `hold`. Measured on the Paper bust. */
  sheet?: { x: number; y: number; w: number; h: number; rotate: number };
};

/** The Paper bust's sheet, measured on a still (viewBox units). */
const SHEET = { x: 575, y: 690, w: 210, h: 150, rotate: -28 };
/** The drawing is 850 x 1200; the frame crops it at about the waist. */
const VIEW_H = 1000;

export const CartoonPresenter: React.FC<CartoonPresenterProps> = ({
  poses, height = 420, cx = 540, hair = "ShortMessy", ink = "#120c0d", fill = "#f7efe6", hold, sheet = SHEET,
}) => {
  const f = useCurrentFrame();
  const sorted = [...poses].sort((a, b) => a.at - b.at);
  const cur = [...sorted].reverse().find((p) => f >= p.at) ?? sorted[0];
  const since = f - cur.at;
  const Body = BODY[cur.pose];
  const Face = FACES[cur.face ?? FACE[cur.pose]];
  const Hair = HAIRS[hair];
  // the pop: dip 4% and settle, so the swap reads as a move rather than a cut
  const pop = sorted.indexOf(cur) === 0 ? 1 : interpolate(since, [0, 2, 7], [0.95, 0.97, 1], { extrapolateRight: "clamp" });
  const bob = Math.sin(f / 22) * 2;
  const scale = height / VIEW_H;
  const w = 850 * scale;
  return (
    <div style={{ position: "absolute", left: cx - w / 2, bottom: 0, width: w, height, overflow: "hidden", pointerEvents: "none" }}>
      <svg viewBox="0 -40 850 1040" width={w} height={height * 1.04} style={{ position: "absolute", left: 0, top: -height * 0.0 + bob, overflow: "visible", transform: `scale(${pop})`, transformOrigin: "50% 100%", filter: "drop-shadow(0 0 1.5px rgba(255,236,222,0.95)) drop-shadow(0 0 1.5px rgba(255,236,222,0.95)) drop-shadow(0 0 14px rgba(255,200,170,0.28)) drop-shadow(0 10px 24px rgba(0,0,0,0.55))" }}>
        <Body strokeColor={ink} backgroundColor={fill} />
        <g transform="translate(225 0)">
          <Hair strokeColor={ink} backgroundColor={fill} />
          <g transform="translate(159 186)">
            <Face strokeColor={ink} backgroundColor={fill} />
          </g>
        </g>
        {cur.pose === "hold" && hold ? (
          <foreignObject x={sheet.x} y={sheet.y} width={sheet.w} height={sheet.h} transform={`rotate(${sheet.rotate} ${sheet.x + sheet.w / 2} ${sheet.y + sheet.h / 2})`}>
            <div style={{ width: sheet.w, height: sheet.h, display: "flex", alignItems: "center", justifyContent: "center" }}>{hold}</div>
          </foreignObject>
        ) : null}
      </svg>
    </div>
  );
};
