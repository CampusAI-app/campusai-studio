/**
 * role-card (2026-10-23, wave 2, "Five roles worth a look"): the kit RoleCard (Jacob favorited it on
 * 2026-10-23) as a storyboard part. The real job card lifts off its real Job Match page, which stays on
 * screen behind it, dimmed, with the empty slot where the card was; the card's own reason line and three of
 * its own chips are called out bigger under it, the key chip in the accent; then it goes home into its slot.
 *
 * The words are the shot's `label` text lines, so the checker verifies each one against the capture:
 *   the first label is the reason, the rest are the chips (three), in order.
 * Props:
 *   card: Rect            the card on the page, page px (also give it as `shot.focus`'s heart).
 *   keyChip?: number      which chip carries the accent. Default 0.
 *   width?: number        presented card width as a share of the view. Default 0.88 (reason 36 px, so three chips fit one row).
 * The callout holds for the reading rule of the reason (rules.json), so give the shot at least
 * 38 frames + that hold + 28 frames (role-card's own beat), plus any lead.
 */
import React from "react";
import { interpolate } from "remotion";
import { RoleCardLayer, roleTiming } from "../../kit/pass/readout/RoleCard";
import { asset, num, rectProp, SurfaceView } from "./common";
import { FPS, readFrames } from "../motion";
import type { PartProps } from "./types";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const RoleCardPart: React.FC<PartProps> = ({ shot, surface, brand, f, layout, props, ctx }) => {
  const card = rectProp(props.card);
  const labels = (shot.text ?? []).filter((t) => t.role === "label").map((t) => t.text);
  if (!surface || !card || labels.length < 2) return null;
  const { view, u } = layout;
  const reason = labels[0];
  const chips = labels.slice(1, 4);
  const lead = Math.round(num(props.lead, 0.4) * FPS);
  const hold = Math.max(readFrames(reason), ...chips.map((c) => readFrames(c)));
  const role = { src: asset(surface.src), page: surface.page, card, reason, chips, keyChip: num(props.keyChip, 0) };
  const timing = roleTiming(role, FPS, hold);
  const local = f - lead;
  const cam = ctx.cam(f);
  const dim = interpolate(local, [timing.lift, timing.lift + 22, timing.holdEnd + 8, timing.total], [0, 0.74, 0.74, 0], clamp);
  return (
    <SurfaceView surface={surface} brand={brand} layout={layout} cam={cam} dim={dim}>
      <RoleCardLayer brand={brand} role={role} f={local} cam={cam} view={view} timing={timing} stage={view}
        width={view.w * num(props.width, 0.88)} reasonSize={36 * u} />
    </SurfaceView>
  );
};
