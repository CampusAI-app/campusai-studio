/**
 * The grey draft (2026-10-23): the storyboard rendered honestly but cheaply, for Jacob's yes before
 * anything polished renders. Lago's animatic rule: only the camera, the cuts, the focus and the timing
 * are real. Everything else is grey on purpose, so the review is about story and pace, not polish.
 *
 * What is on screen:
 *   - each surface as a grey page, the real capture faint and grayscale (about 18%) so framing can be judged
 *   - the real page camera and framing, from the parts' own layout (parts/layout.ts) and camera planner
 *     (parts/common.tsx planCamera: camAlong over the shot's keys, or framing `focus` when there are none).
 *     Not reproduced: Film's handoff easing between two shots on one surface, so each shot starts on its own framing.
 *   - a dashed red box on `focus`, a dot and a ring at each `press`
 *   - every text line in its real face and size, at its real time, for its real hold (reading time is felt)
 *   - the shot id, part and action in small Inter at the top; a timeline of every shot at the bottom
 *   - the end card as a grey block reading "logo + campusai.app"
 *
 * Rendered by `npm run draft <id>` (scripts/draft-film.mjs) from src/system/entry.ts, composition `Draft`.
 */
import React from "react";
import { AbsoluteFill, CalculateMetadataFunction, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { brand, useBrandFonts } from "../kit/brand";
import { rectOnCanvas, toCanvas } from "../kit/camera";
import { INTER, ZODIAK } from "../kit/parts";
import { CURVE, DUR, FPS } from "./motion";
import { patchesFor, planCamera } from "./parts/common";
import { makeLayout } from "./parts/layout";
import type { Layout } from "./parts/types";
import rules from "./rules.json";
import type { Shot, Storyboard, TextLine } from "./storyboard";
import { readHold, runtime, SIZE } from "./storyboard";

const B = brand("campusai");
const GREY = {
  ground: "#121214",
  /** The camera's view, a step lighter than the ground so the frame reads where the page does not fill it. */
  view: "#1b1b1f",
  page: "#3a3a40",
  ink: "#f2f2f4",
  soft: "#9a9aa2",
  line: "#2a2a2e",
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * Text roles in their face and size, read the way Film.tsx reads them, so the draft reads at the film's
 * size: a line (and a hook outside the like-when-line part) is the small Zodiak headline above the
 * product, a hook in like-when-line is the big line, a caption is Inter at the layout's caption size in
 * the band below the product. A label is drawn small over the focus here; Film does not draw labels yet.
 */
const textStyle = (t: TextLine, L: Layout, big: boolean) => {
  if (t.role === "hook" && big) return { family: ZODIAK.family, weight: ZODIAK.weight, size: L.bigLine.size * L.u, track: ZODIAK.track, maxW: L.bigLine.maxW };
  if (t.role === "line" || t.role === "hook") return { family: ZODIAK.family, weight: ZODIAK.weight, size: L.headline.size * L.u, track: ZODIAK.track, maxW: L.headline.maxW };
  if (t.role === "label") return { family: INTER, weight: 600, size: L.headline.size * L.u * 0.8, track: "0", maxW: L.headline.maxW };
  return { family: INTER, weight: 500, size: L.captionSize, track: "-0.01em", maxW: L.caption?.w ?? L.W * 0.8 };
};

/** One text line, fully on screen from `at` to `at + hold`, with a short fade either side. */
const Line: React.FC<{ t: TextLine; frame: number; L: Layout; big?: boolean }> = ({ t, frame, L, big = false }) => {
  const st = textStyle(t, L, big);
  const a = (t.at ?? 0) * FPS;
  const b = a + (t.hold ?? readHold(t.text, rules.reading)) * FPS;
  const fade = DUR.small + 1; // motion: a draft fade only needs to read as on and off
  const o = Math.min(
    interpolate(frame, [a - fade, a], [0, 1], { ...clamp, easing: CURVE.quiet.enter }),
    interpolate(frame, [b, b + fade], [1, 0], { ...clamp, easing: CURVE.quiet.exit }),
  );
  if (o <= 0) return null;
  return (
    <div style={{ opacity: o, fontFamily: st.family, fontWeight: st.weight, fontSize: st.size, letterSpacing: st.track,
      lineHeight: 1.15, color: GREY.ink, textAlign: "center", maxWidth: st.maxW, margin: "0 auto" }}>
      {t.text}
    </div>
  );
};

const Header: React.FC<{ shot: Shot; w: number; scale: number }> = ({ shot, w, scale }) => (
  <div style={{ position: "absolute", left: 28 * scale, top: 22 * scale, width: w - 56 * scale, fontFamily: INTER, fontWeight: 500,
    fontSize: 22 * scale, lineHeight: 1.3, color: GREY.soft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
    <span style={{ color: GREY.ink, fontWeight: 600 }}>{shot.id}</span>
    {"  ·  "}{shot.part}{shot.hero ? "  ·  hero" : ""}{shot.transition ? `  ·  ${shot.transition} out` : ""}{"  ·  "}{shot.action}
  </div>
);

const ShotView: React.FC<{ sb: Storyboard; shot: Shot; L: Layout }> = ({ sb, shot, L }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const { W: w, H: h, u: scale } = L;
  const sf = shot.surface ? sb.surfaces[shot.surface] : undefined;
  const lines = shot.text ?? [];
  const bigHooks = shot.part === "like-when-line";
  const hooks = bigHooks ? lines.filter((x) => x.role === "hook") : [];
  const heads = lines.filter((x) => x.role === "line" || (x.role === "hook" && !bigHooks));
  const captions = lines.filter((x) => x.role === "caption");
  const labels = lines.filter((x) => x.role === "label");

  let page: React.ReactNode;
  if (sf) {
    const cam = planCamera(shot, sf, L)(frame);
    const o = toCanvas(cam, L.view, 0, 0);
    const focusBox = shot.focus ? rectOnCanvas(cam, L.view, shot.focus) : null;
    const press = shot.press;
    const pp = press ? toCanvas(cam, L.view, press.x, press.y) : null;
    const since = press ? t - press.at : -1;
    page = (
      <div style={{ position: "absolute", left: L.view.x, top: L.view.y, width: L.view.w, height: L.view.h, overflow: "hidden", background: GREY.view }}>
        <div style={{ position: "absolute", left: o.x - L.view.x, top: o.y - L.view.y, width: sf.page.w * o.s, height: sf.page.h * o.s, background: GREY.page }}>
          <Img src={staticFile(sf.src)} style={{ width: "100%", height: "100%", maxWidth: "none", filter: "grayscale(1)", opacity: 0.18 }} />
        </div>
        <div style={{ position: "absolute", left: -L.view.x, top: -L.view.y, width: w, height: h }}>
          {patchesFor(sf).map((p, i) => {
            const r = rectOnCanvas(cam, L.view, p);
            return <div key={i} style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, background: GREY.page }} />;
          })}
          {focusBox && (
            <div style={{ position: "absolute", left: focusBox.x, top: focusBox.y, width: focusBox.w, height: focusBox.h,
              border: `${Math.max(2, 3 * scale)}px dashed ${B.color.accent}`, boxSizing: "border-box" }} />
          )}
          {pp && since > -0.6 && since < 1.2 && (
            <>
              <div style={{ position: "absolute", left: pp.x - 14 * scale, top: pp.y - 14 * scale, width: 28 * scale, height: 28 * scale, borderRadius: "50%",
                background: B.color.accent, opacity: interpolate(since, [-0.6, -0.4, 0.9, 1.2], [0, 1, 1, 0], clamp) }} />
              {since >= 0 && (
                <div style={{ position: "absolute", left: pp.x - 1, top: pp.y - 1, width: 2, height: 2, borderRadius: "50%",
                  boxShadow: `0 0 0 ${interpolate(since, [0, 0.6], [14, 70], clamp) * scale}px rgba(${B.color.glowRgb}, ${interpolate(since, [0, 0.6], [0.55, 0], clamp)})` }} />
              )}
            </>
          )}
          {labels.length > 0 && (
            <div style={{ position: "absolute", left: focusBox ? Math.max(16, focusBox.x) : 0, width: focusBox ? undefined : w,
              top: focusBox ? Math.max(L.view.y + 12, focusBox.y - L.headline.size * 1.6) : L.view.y + 12, display: "flex", flexDirection: "column" }}>
              {labels.map((x, i) => <Line key={i} t={x} frame={frame} L={L} />)}
            </div>
          )}
        </div>
      </div>
    );
  } else {
    page = (
      <div style={{ position: "absolute", left: L.view.x, top: L.view.y, width: L.view.w, height: L.view.h, background: GREY.line,
        display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, fontSize: 28 * scale, color: GREY.soft }}>
        {shot.part}, no surface
      </div>
    );
  }

  return (
    <AbsoluteFill>
      {page}
      <div style={{ position: "absolute", left: 0, width: w, top: L.headline.cy - L.headline.size * L.u * 1.4, height: L.headline.size * L.u * 2.8,
        display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 * scale }}>
        {heads.map((x, i) => <Line key={i} t={x} frame={frame} L={L} />)}
      </div>
      <div style={{ position: "absolute", left: L.view.x, width: L.view.w, top: L.view.y, height: L.view.h, display: "flex",
        flexDirection: "column", justifyContent: "center", gap: 16 * scale }}>
        {hooks.map((x, i) => <Line key={i} t={x} frame={frame} L={L} big />)}
      </div>
      {L.caption && (
        <div style={{ position: "absolute", left: L.caption.x, width: L.caption.w, top: L.caption.y, height: L.caption.h, display: "flex",
          flexDirection: "column", justifyContent: "center", gap: 8 * scale }}>
          {captions.map((x, i) => <Line key={i} t={x} frame={frame} L={L} />)}
        </div>
      )}
      <Header shot={shot} w={w} scale={scale} />
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{ sb: Storyboard; w: number; h: number }> = ({ sb, w, h }) => {
  const scale = Math.min(w, h) / 1080;
  const words = sb.end.instagram ? rules.end.instagram : rules.end.url;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: w * 0.2, top: h * 0.38, width: w * 0.6, height: h * 0.2, background: GREY.page,
        display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, fontWeight: 600, fontSize: 44 * scale, color: GREY.ink }}>
        logo + {words}
      </div>
      <div style={{ position: "absolute", left: 28 * scale, top: 22 * scale, fontFamily: INTER, fontWeight: 500, fontSize: 22 * scale, color: GREY.soft }}>
        <span style={{ color: GREY.ink, fontWeight: 600 }}>end</span>{"  ·  "}end-url{"  ·  "}held {sb.end.hold} s
      </div>
    </AbsoluteFill>
  );
};

/** Every shot as a segment, the end card last, the playhead over them. Hero shots are red. */
const Timeline: React.FC<{ sb: Storyboard; w: number; h: number }> = ({ sb, w, h }) => {
  const frame = useCurrentFrame();
  const scale = Math.min(w, h) / 1080;
  const total = runtime(sb);
  const x0 = 28 * scale;
  const span = w - 56 * scale;
  const y = h - 46 * scale;
  const segs = [...sb.shots.map((s) => ({ id: s.id, sec: s.seconds, hero: !!s.hero })), { id: "end", sec: sb.end.hold, hero: false }];
  let acc = 0;
  const now = frame / FPS;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h }}>
      {segs.map((s, i) => {
        const left = x0 + (acc / total) * span;
        const width = (s.sec / total) * span;
        const on = now >= acc && now < acc + s.sec;
        acc += s.sec;
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: left + 1, top: y, width: Math.max(1, width - 2), height: 10 * scale,
              background: s.hero ? B.color.accent : on ? "#77777f" : i % 2 ? "#4a4a50" : "#3a3a40" }} />
            <div style={{ position: "absolute", left: left + 4, top: y + 14 * scale, width: Math.max(0, width - 6), overflow: "hidden", whiteSpace: "nowrap",
              fontFamily: INTER, fontWeight: 500, fontSize: 16 * scale, color: on ? GREY.ink : GREY.soft }}>{s.id}</div>
          </React.Fragment>
        );
      })}
      <div style={{ position: "absolute", left: x0 + (now / total) * span - 1, top: y - 8 * scale, width: 2, height: 26 * scale, background: GREY.ink }} />
      <div style={{ position: "absolute", right: x0, top: y - 30 * scale, fontFamily: INTER, fontWeight: 500, fontSize: 18 * scale, color: GREY.soft }}>
        {now.toFixed(1)} / {total.toFixed(1)} s
      </div>
    </div>
  );
};

export const Draft: React.FC<Storyboard> = (sb) => {
  useBrandFonts(B);
  const aspect = sb.aspects[0];
  const { w, h } = SIZE[aspect];
  const L = makeLayout(aspect, sb.shots.some((x) => (x.text ?? []).some((l) => l.role === "caption")));
  let acc = 0;
  const seqs = sb.shots.map((shot) => {
    const from = Math.round(acc * FPS);
    acc += shot.seconds;
    return { shot, from, dur: Math.round(acc * FPS) - from };
  });
  const endFrom = Math.round(acc * FPS);
  return (
    <AbsoluteFill style={{ background: GREY.ground }}>
      {seqs.map(({ shot, from, dur }) => (
        <Sequence key={shot.id} from={from} durationInFrames={dur} layout="none">
          <ShotView sb={sb} shot={shot} L={L} />
        </Sequence>
      ))}
      <Sequence from={endFrom} durationInFrames={Math.max(1, Math.round(runtime(sb) * FPS) - endFrom)} layout="none">
        <EndCard sb={sb} w={w} h={h} />
      </Sequence>
      <Timeline sb={sb} w={w} h={h} />
    </AbsoluteFill>
  );
};

export const draftMetadata: CalculateMetadataFunction<Storyboard> = ({ props }) => {
  const { w, h } = SIZE[props.aspects[0]];
  return { width: w, height: h, fps: FPS, durationInFrames: Math.max(1, Math.round(runtime(props) * FPS)) };
};
