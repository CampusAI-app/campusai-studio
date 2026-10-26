/**
 * FeatureTag (round 4 titles, 2026-10-25): a lower third for launch and feature films. At the moment a feature
 * appears, a thin accent outline traces the real control on the page; the outline then leaves the page and travels
 * down into the caption band below the footage, folding into the tag's accent rule, and the feature's name (Zodiak)
 * and one short line (Inter) rise out of a blur beside it. A faint ring stays on the control while the tag holds,
 * so the name never floats free of the thing it names. On `outAt` the words lift away and the rule shrinks to
 * nothing: the footage is all that is left.
 *
 * From two shelf shots: typography/title-demote-to-label (a title that changes role without leaving the screen,
 * travelling on one asymmetric in-out, bezier(0.6, 0, 0.18, 1), the only thing moving while it travels) run the other
 * way, the page element becoming the label; and typography/blur-slide for the words (y 0.38 em, blur, opacity on
 * one progress, 4 f apart, 22 f a word; the line 2.4 f apart, 20 f a word, starting before the name finishes so the
 * pair reads as one sentence).
 *
 * Numbers: the trace draws 14 f (stroke from the control's top-left, clockwise), holds 8 f, travels 26 f with the
 * rect morphing into a 6 px rule as tall as the tag; the name starts 6 f before the rule lands. The tag holds
 * readFrames(name + line) from the moment the line has fully arrived. Out: 10 f lift and blur, rule 12 f.
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import type { Brand } from "../../brand";
import { glow } from "../../brand";
import type { PageCam, Rect, Size } from "../../camera";
import { camAlong, clampCam, rectOnCanvas } from "../../camera";
import { PageView } from "../../PageView";
import { INTER } from "../../parts";
import { CURVE } from "../../../system/motion";
import type { MarkPatchSpec } from "./shared";
import { DEMOTE, MarkPatch, WordsIn, inflate, lerp, mixRect, ramp, readFrames } from "./shared";

export type FeatureTagProps = {
  brand: Brand;
  page: { src: string; size: Size };
  view: Rect;
  mark: MarkPatchSpec | null;
  /** Camera keys in frames. The part does not move the camera itself; land the framing before `at`. */
  cams: { t: number; cam: PageCam }[];
  /** The control the tag names, page px, and its corner radius (page px). */
  element: Rect;
  radius?: number;
  name: string;
  line: string;
  /** The caption band below the footage, canvas px. The tag sits on its left, vertically centred. */
  band: Rect;
  /** Frame the trace starts: the moment the feature appears. */
  at: number;
  /** Frame the tag leaves. Default: the reading hold after the line lands. */
  outAt?: number;
  /** Name size, canvas px. Default 64. The line is 0.48 of it. */
  size?: number;
};

export const featureTagTimes = (p: Pick<FeatureTagProps, "at" | "outAt" | "name" | "line">) => {
  const traced = p.at + 14;
  const travelAt = traced + 8;
  const landed = travelAt + 26;
  const nameAt = landed - 6;
  const nameWords = p.name.split(" ").length;
  const lineAt = nameAt + 4 * nameWords + 4;
  const lineDone = lineAt + 2.4 * (p.line.split(" ").length - 1) + 20;
  const outAt = p.outAt ?? Math.ceil(lineDone + readFrames(`${p.name} ${p.line}`));
  return { traced, travelAt, landed, nameAt, lineAt, lineDone, outAt, end: outAt + 14 };
};

export const FeatureTag: React.FC<FeatureTagProps> = (props) => {
  const { brand, page, view, mark, cams, element, name, line, band } = props;
  const f = useCurrentFrame();
  const T = featureTagTimes(props);
  const cam = clampCam(camAlong(f, cams), page.size, view);
  const size = props.size ?? 64;
  const lineSize = size * 0.48;
  const pad = 6;
  const el = rectOnCanvas(cam, view, inflate(element, pad));
  const s = el.w / (element.w + pad * 2);
  const rad = ((props.radius ?? 8) + pad) * s;

  // the tag block in the band: rule on the left, name over line
  const blockH = size * 1.12 + lineSize * 1.35 + size * 0.12;
  const rule: Rect = { x: band.x, y: band.y + (band.h - blockH) / 2, w: 6, h: blockH };

  // 1. the trace
  const per = 2 * (el.w + el.h);
  const trace = ramp(f, props.at, T.traced, CURVE.quiet.standard);
  // 2. the travel: the outline rect becomes the rule
  const tr = ramp(f, T.travelAt, T.landed, DEMOTE);
  const r = mixRect(el, rule, tr);
  const radNow = lerp(rad, 3, tr);
  const strokeW = lerp(2.5, 3, tr);
  // 3. the ring that stays on the control while the tag holds
  const ring = ramp(f, T.travelAt + 4, T.landed) * 0.6 * (1 - ramp(f, T.outAt, T.outAt + 12));
  // out: the rule shrinks from the bottom up
  const out = ramp(f, T.outAt, T.outAt + 12, CURVE.quiet.exit);

  const textX = rule.x + rule.w + size * 0.42;

  return (
    <>
      <PageView src={page.src} page={page.size} cam={cam} view={view} brand={brand}>
        <MarkPatch cam={cam} view={view} spec={mark} />
        {/* the trace, drawn on the control, until the travel lifts it */}
        {f >= props.at && tr === 0 ? (
          <svg style={{ position: "absolute", left: el.x - 4, top: el.y - 4, overflow: "visible" }} width={el.w + 8} height={el.h + 8}>
            <rect x={4} y={4} width={el.w} height={el.h} rx={rad} ry={rad} fill="none" stroke={brand.color.accent} strokeWidth={2.5}
              strokeDasharray={`${per * trace} ${per}`} style={{ filter: `drop-shadow(0 0 10px ${glow(brand, 0.7)})` }} />
          </svg>
        ) : null}
        {ring > 0.001 ? (
          <div style={{ position: "absolute", left: el.x, top: el.y, width: el.w, height: el.h, borderRadius: rad, border: `2px solid ${brand.color.accent}`,
            boxSizing: "border-box", opacity: ring, boxShadow: `0 0 26px ${glow(brand, 0.5 * ring)}` }} />
        ) : null}
      </PageView>
      {/* the travelling outline, outside the page so it can cross into the band */}
      {tr > 0 && out < 1 ? (
        <div style={{ position: "absolute", left: r.x, top: r.y + r.h * out, width: r.w, height: r.h * (1 - out), borderRadius: radNow, boxSizing: "border-box",
          border: `${strokeW}px solid ${brand.color.accent}`,
          boxShadow: `0 0 ${lerp(22, 16, tr).toFixed(0)}px ${glow(brand, 0.55)}` }} />
      ) : null}
      {f >= T.nameAt - 1 ? (
        <div style={{ position: "absolute", left: textX, top: rule.y - size * 0.06, width: band.x + band.w - textX }}>
          <WordsIn text={name} f={f} at={T.nameAt} size={size} family="Zodiak" weight={700} color={brand.color.ink} out={{ at: T.outAt }} />
          <div style={{ height: size * 0.1 }} />
          <WordsIn text={line} f={f} at={T.lineAt} size={lineSize} family={INTER} weight={500} color={brand.color.inkSoft} track="-0.01em"
            stagger={2.4} win={20} dy={0.5} blur={0.25} lineHeight={1.3} out={{ at: T.outAt + 2 }} />
        </div>
      ) : null}
    </>
  );
};

