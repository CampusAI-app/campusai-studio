/**
 * Sound preview (2026-10-23): 10 s over the real dashboard capture, proving that Score's cues land on their frames,
 * snapping moves the picture and the sound together, the duck and end fade work, and the mix sits near -14 LUFS.
 * Not a film: the rings and frame numbers are there to check sync by eye on a contact sheet.
 *
 *   npx remotion render src/system/sound/entry.ts SoundPreview out/sound/SoundPreview.mp4
 *   npx remotion render src/system/sound/entry.ts SoundPreview-cues out/sound/SoundPreview-cues.mp4   (no music)
 *   python3 scripts/sound-check.py out/sound/SoundPreview.mp4 out/sound/SoundPreview-cues.mp4
 *
 * Measured on the render (scripts/sound-check.py, 2026-10-23):
 *   loudness  -14.4 LUFS integrated, true peak -1.1 dBTP (cues alone -25.0 LUFS)
 *   cues      all 10 hits on their frame: mean error 8.2 ms, max 15.6 ms (one frame is 33.3 ms)
 *   music     +9.3 ms behind the picture's beat grid after Score's one-frame trim for the AAC delay (+42.7 ms raw)
 *   duck      -5.9 dB measured for a -7 dB duck (the music's own level moves under it too)
 * Calibration over other tracks (same score): lofi-01 -14.3, slow-walk -15.2 and cat-walk -17.3 LUFS, the last two
 * held under -14 by the peak ceiling (no limiter in the chain), all at or under -1.1 dBTP.
 */
import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { PageView } from "../../kit/PageView";
import { PointerAt } from "../../kit/Pointer";
import { LogoEnd } from "../../kit/LogoMoment";
import { brand } from "../../kit/brand";
import { camAlong, toCanvas } from "../../kit/camera";
import { INTER } from "../../kit/parts";
import { CURVE } from "../motion";
import { Score, mixPlan, type ScoreProps } from "./Score";
import type { SoundEvent } from "./cues";
import spec from "./preview.json";

const B = brand("campusai");
export const PREVIEW = { fps: spec.fps, durationInFrames: spec.durationInFrames, width: 1080, height: 1350 };
const PAGE = { w: 1440, h: 900 };
const VIEW = { x: 40, y: 230, w: 1000, h: 760 };
// the page camera: close on the brief, then a pull back to the whole page right of the sidebar (x from 248 keeps the
// sidebar, and the Maryland M, out of frame)
const CAM = [
  { t: 0, cam: { cx: 828, cy: 360, cw: 900 } },
  { t: 14, cam: { cx: 828, cy: 360, cw: 900 } },
  { t: 38, cam: { cx: 828, cy: 455, cw: 1160 } },
];

/** `track` / `startAt` swap the music (loudness calibration across tracks); cue sync is checked on the default. */
export const SoundPreview: React.FC<{ music?: boolean; track?: string; startAt?: number }> = ({ music = true, track, startAt }) => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const score: ScoreProps = {
    music: { track: track ?? spec.music.track, startAt: startAt ?? spec.music.startAt, mute: !music },
    events: spec.events as SoundEvent[],
    duck: spec.duck,
    end: spec.end,
  };
  // the picture reads its moments from the same plan as the sound, so a snapped press moves both
  const plan = mixPlan(score, fps, durationInFrames);
  const at = (name: string) => plan.cues.find((c) => c.name === name)?.frame ?? 0;
  const press = at("press: Academics card");
  const land = at("card lands on the lift");
  const endF = spec.end.from;
  const cam = camAlong(f, CAM, CURVE.quiet.standard);
  const card = toCanvas(cam, VIEW, 549 + 137, 510 + 40);
  const chip = toCanvas(cam, VIEW, 1225 + 41, 17 + 17);
  const since = (x: number) => (f >= x && f < x + 20 ? (f - x) / fps : null);
  const lift = f >= land ? Math.min(1, (f - land) / 8) : 0;
  return (
    <AbsoluteFill style={{ background: B.color.bgDeep, fontFamily: INTER }}>
      {f < endF && (
        <PageView src={staticFile("pass/dashboard.jpg")} page={PAGE} cam={cam} view={VIEW} brand={B}>
          <div style={{ position: "absolute", left: card.x - 130 * card.s, top: card.y - 40 * card.s, width: 274 * card.s, height: 80 * card.s,
            borderRadius: 14 * card.s, boxShadow: `0 0 0 ${3 * lift}px ${B.color.accent}`, opacity: lift }} />
          {since(at("6 new chip")) !== null && (
            <div style={{ position: "absolute", left: chip.x, top: chip.y, width: 90, height: 90, transform: "translate(-50%,-50%)", borderRadius: "50%",
              border: `3px solid ${B.color.accent}`, opacity: 1 - (since(at("6 new chip")) ?? 0) * 1.5 }} />
          )}
        </PageView>
      )}
      {f < endF && f >= 30 && <PointerAt x={card.x} y={card.y} since={since(press)} accent={B.color.accent} />}
      {f < endF && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1050, textAlign: "center", color: B.color.inkSoft, fontSize: 34, fontWeight: 500 }}>
          {plan.cues.filter((c) => f >= c.frame && f < c.frame + 12).map((c) => c.name).join("  ·  ") || " "}
        </div>
      )}
      <div style={{ position: "absolute", right: 40, bottom: 40, color: B.color.inkSoft, fontSize: 28, opacity: 0.7 }}>frame {f}</div>
      {f >= endF && (
        <>
          <LogoEnd brand={B} at={endF} x={540} y={620} width={560} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 740, textAlign: "center", color: B.color.ink, fontSize: 44, fontWeight: 600 }}>
            campusai.app
          </div>
        </>
      )}
      <Score {...score} />
    </AbsoluteFill>
  );
};
