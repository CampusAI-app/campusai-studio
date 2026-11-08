/**
 * Ask CampusAI, highlighted answer (2026-11-06). One 9:16 film, the replacement for the rejected snapcn sample.
 *
 * One question typed into the real CampusAI chat ("what do i actually need to get a banking internship this summer"),
 * one real answer, and snapcn's text-highlight marker sweeping the two lines that matter: "Your resume already shows
 * 4", then, a beat later, "The 2 you're missing are financial modeling and valuation." It ends on "Ask CampusAI
 * anything." (snapcn karaoke-captions) above the logo and campusai.app.
 *
 * The product fills the frame the whole time: the recording is the desktop /ai page at 1100 x 1956 css px (zoom 1.8,
 * the 11/06 rule), recorded by `npm run chat ask-highlight` into public/ask-highlight/chat/. Facts:
 * films/ask-highlight/facts.md. Camera and exit follow AskSeries; the signature (the marker) is this film's own.
 *
 * Coordinates: canvas px of the recording drawn at 1080 wide (recording px at DPR 2 x 1080 / 2200). The marker bands
 * were measured from the recording's settled frame (f00699.jpg): ink rows and word gaps per line, the font size from
 * the line pitch (94 rec px = 1.625 x 57.6), then text-highlight's own marker box around each line box.
 */
import React from "react";
import { AbsoluteFill, Audio, Composition, Freeze, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { brand as getBrand, glow, INTER, LogoEnd, LogoOpen, useBrandFonts } from "../kit";
import { EASE, EASE_CAMERA } from "../lib/anim";
import { KaraokeCaptions } from "../snapcn/karaoke-captions";
import rec from "../../public/ask-highlight/chat/frames.json";

const FPS = 30;
const W = 1080;
const H = 1920;
const K = W / 2200; // recording px (DPR 2) -> canvas px
const PAGE_H = 3912 * K; // 1920.4
const B = getBrand("campusai");
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const DIR = "ask-highlight/chat";

type Rec = { marks: { typeStart: number; send: number; done: number }; frames: { t: number; name: string }[] };
const R = rec as Rec;

// ---- time: the typing plays 1.5x (about one new letter per film frame, the 10/30 rule), everything after the send at true speed
const REC_FROM = 0.66; // just after the first keystroke, so frame one already shows the question typing
const TYPE_SPEED = 1.5;
const SEND = Math.round(((R.marks.send - REC_FROM) / TYPE_SPEED) * FPS); // 79
const SETTLED = SEND + Math.round((8.18 - R.marks.send) * FPS); // the last word's soft trail has finished (measured: frames stop changing at 8.17 s)
const recT = (f: number) => (f < SEND ? REC_FROM + (f / FPS) * TYPE_SPEED : R.marks.send + (f - SEND) / FPS);

// ---- the beats, in film frames
const LEAN = SETTLED + 2; // the camera settles on the answer
const SWEEP_1 = SETTLED + 48; // "Your resume already shows 4"
const SWEEP_2 = SETTLED + 120; // "The 2 you're missing are financial modeling and valuation."
const READ = 270; // frames the whole answer holds after it lands (see brief.md for the reading-rule note)
const ASK_LEN = SETTLED + READ; // the exit into the end card
const END_LEN = 96; // "Ask CampusAI anything.", the logo, campusai.app (22 letters / 15 + 1.5 s = 3 s on screen)
const TOTAL = ASK_LEN + END_LEN;

// ---- text-highlight's marker (src/snapcn/text-highlight, preset "marker"): a spring with damping 18 over drawDuration
// (14 frames), scaleX from the left, the box inset -0.02em top and bottom and -0.12em at the sides around a 1.25 line
// box, corners 0.12em. Measured line boxes below, in recording px; EM is the answer's font size.
const EM = 57.6;
const DRAW = 14;
type Band = { x0: number; x1: number; baseline: number; at: number };
const band = (x0: number, x1: number, baseline: number, at: number): Band => ({ x0, x1, baseline, at });
const BANDS: Band[] = [
  band(1083, 1821, 967, SWEEP_1), // "Your resume already shows 4" (the colon at 1829 to 1835 left out)
  band(794, 1933, 1289, SWEEP_2), // "The 2 you're missing are financial modeling"
  band(794, 1158, 1383, SWEEP_2 + DRAW - 2), // "and valuation." (the pen carries on to the next line)
];

const Marker: React.FC<{ b: Band }> = ({ b }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sweep = spring({ frame: f - b.at, fps, config: { damping: 18 }, durationInFrames: DRAW });
  if (sweep <= 0.001) return null;
  const left = (b.x0 - 0.12 * EM) * K;
  const right = (b.x1 + 0.12 * EM) * K;
  const top = (b.baseline - 1.009 * EM) * K; // ascent 0.969 + half-leading 0.02 + inset 0.02
  const bottom = (b.baseline + 0.282 * EM) * K; // descent 0.242 + half-leading 0.02 + inset 0.02
  return (
    <div style={{ position: "absolute", left, top, width: right - left, height: bottom - top, borderRadius: 0.12 * EM * K,
      background: "rgba(217, 32, 46, 0.42)", mixBlendMode: "screen", transformOrigin: "left center", transform: `scaleX(${sweep.toFixed(4)})` }} />
  );
};

// ---- camera: page point (fx, fy) drawn at (540, cy) at scale s
type Cam = { fx: number; fy: number; s: number; cy: number };
const lerpCam = (a: Cam, b: Cam, k: number): Cam => ({ fx: a.fx + (b.fx - a.fx) * k, fy: a.fy + (b.fy - a.fy) * k, s: a.s + (b.s - a.s) * k, cy: a.cy + (b.cy - a.cy) * k });
const camTransform = (c: Cam) => `translate(${(W / 2 - c.fx * c.s).toFixed(2)}px, ${(c.cy - c.fy * c.s).toFixed(2)}px) scale(${c.s.toFixed(4)})`;

// The box (canvas x 321 to 971, y 1713 to 1828 once the question wraps) fills the width while the question types.
const TYPE_CAM: Cam = { fx: 646, fy: 1775, s: 1.55, cy: 1180 };
// The whole page, edge to edge, on the way from the box to the conversation.
const WIDE_CAM: Cam = { fx: 540, fy: 960, s: 1.0, cy: 960 };
// The conversation: avatar (x 321) to bubble edge (x 971) inside the frame, the bubble near the top.
const CONVO_CAM: Cam = { fx: 646, fy: 440, s: 1.58, cy: 900 };
// Settled on the answer: centred and a touch closer. 1.6 is the most the frame takes with the avatar (x 321) and the
// longest line's end (x 963) both inside it; at 1.8 (round 1) the right edge cut "accounting" and the avatar half.
const LEAN_CAM: Cam = { fx: 646, fy: 470, s: 1.6, cy: 950 };

const BOTTOM = 1914; // the page's last clean rows (canvas y), stretched below it

const frameAt = (t: number) => {
  let best = R.frames[0];
  for (const fr of R.frames) {
    if (fr.t <= t) best = fr;
    else break;
  }
  return best;
};

const Ask: React.FC = () => {
  const f = useCurrentFrame();
  const src = `${DIR}/${frameAt(recT(f)).name}`;
  // the pull-back: out from the box to the whole page, then in to the conversation (round 2: a straight lerp crossed
  // ~1300 px of empty page and left mid-move frames nearly black)
  const back = interpolate(f, [SEND + 2, SEND + 20], [0, 1], { ...clamp, easing: EASE_CAMERA });
  const pull = interpolate(f, [SEND + 14, SEND + 38], [0, 1], { ...clamp, easing: EASE_CAMERA });
  const lean = interpolate(f, [LEAN, LEAN + 42], [0, 1], { ...clamp, easing: EASE_CAMERA });
  let cam = lerpCam(lerpCam(lerpCam(TYPE_CAM, WIDE_CAM, back), CONVO_CAM, pull), LEAN_CAM, lean);
  // the exit: a push into the page that blurs out as the end card arrives
  const out = interpolate(f, [ASK_LEN - 14, ASK_LEN], [0, 1], { ...clamp, easing: EASE });
  cam = { ...cam, s: cam.s * (1 + 0.18 * out) };
  const typingVeil = 1 - back;

  return (
    <AbsoluteFill style={{ opacity: 1 - out, filter: out > 0 ? `blur(${(out * 12).toFixed(2)}px)` : undefined }}>
      <AbsoluteFill style={{ transformOrigin: "0 0", transform: camTransform(cam) }}>
        <Img src={staticFile(src)} style={{ position: "absolute", left: 0, top: 0, width: W, height: PAGE_H, maxWidth: "none", display: "block" }} />
        {BANDS.map((b, i) => (
          <Marker key={i} b={b} />
        ))}
        {/* the page's own top bar (canvas y 0 to ~93) sits under the ground colour, so no frame shows it cut at the edges */}
        <div style={{ position: "absolute", left: -400, top: -400, width: W + 800, height: 400 + 108,
          background: `linear-gradient(to bottom, ${B.color.bgDeep} 0, ${B.color.bgDeep} ${400 + 84}px, rgba(11,7,8,0) ${400 + 120}px)` }} />
        {/* below the page's own bottom edge (y 1920) its last rows carry on and darken slowly, so the typing frame never
            shows a seam where the box's red glow meets the ground (round 1 and 2: a flat fill read as an edge) */}
        <div style={{ position: "absolute", left: 0, top: BOTTOM, width: W, height: 800, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: W, height: 4, overflow: "hidden", transformOrigin: "0 0", transform: "scaleY(200)" }}>
            <Img src={staticFile(src)} style={{ position: "absolute", left: 0, top: -BOTTOM, width: W, height: PAGE_H, maxWidth: "none", display: "block" }} />
          </div>
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, rgba(11,7,8,0) 0, ${B.color.bgDeep} 520px)` }} />
        </div>
      </AbsoluteFill>
      {/* while typing: everything above the box sits in the dark, so the greeting and starter chips never compete */}
      {typingVeil > 0 && (
        <AbsoluteFill style={{ opacity: typingVeil,
          background: `linear-gradient(to bottom, ${B.color.bgDeep} 0, ${B.color.bgDeep} 640px, rgba(11,7,8,0) 900px)` }} />
      )}
    </AbsoluteFill>
  );
};

const theme = {
  background: "transparent",
  foreground: B.color.ink,
  mutedForeground: B.color.inkSoft,
  primary: B.color.accent,
  card: B.color.surface,
  border: B.color.surface,
};

/** The end line, snapcn's karaoke-captions filling word by word, frozen once full (there is no next spoken line). */
const EndLine: React.FC = () => {
  const f = useCurrentFrame();
  const FILL_END = 30;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: 960 }}>
      <Sequence width={W} height={960} layout="none">
        <Freeze frame={FILL_END} active={f >= FILL_END}>
          <AbsoluteFill>
            <KaraokeCaptions
              lines={[{ text: "Ask CampusAI anything.", startFrame: 2, endFrame: FILL_END, emphasize: [2] }]}
              preset="karaoke"
              aspect="portrait"
              mode="dark"
              fontFamily={INTER}
              fontWeight={700}
              fontSize={84}
              strokeRatio={0}
              emphasisScale={1.03}
              accentColor={B.color.accent}
              baseColor={B.color.inkSoft}
              fillColor={B.color.ink}
              theme={theme}
            />
          </AbsoluteFill>
        </Freeze>
      </Sequence>
    </div>
  );
};

const Address: React.FC = () => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, 14], [0, 1], { ...clamp, easing: EASE });
  return (
    <div style={{ position: "absolute", top: 1130, width: "100%", textAlign: "center", fontFamily: INTER, fontWeight: 500, fontSize: 46,
      color: B.color.inkSoft, opacity: p, transform: `translateY(${((1 - p) * 12).toFixed(2)}px)` }}>
      campusai.app
    </div>
  );
};

export const AskHighlight: React.FC = () => {
  useBrandFonts(B);
  const typeStart = 0; // the recording starts mid-word
  const keys = Math.ceil(64 / 3);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 70% at 50% 100%, ${glow(B, 0.28)} 0%, rgba(11,7,8,0) 60%), ${B.color.bgDeep}` }}>
      <Sequence durationInFrames={ASK_LEN}>
        <Ask />
      </Sequence>
      {/* the mark arrives with the hook, above the box, and leaves as the camera pulls back */}
      <LogoOpen brand={B} at={2} x={W / 2} y={800} width={300} leaveAt={SEND - 2} />
      <Sequence from={ASK_LEN - 4}>
        <EndLine />
      </Sequence>
      <LogoEnd brand={B} at={ASK_LEN + 8} x={W / 2} y={990} width={520} />
      <Sequence from={ASK_LEN + 20}>
        <Address />
      </Sequence>

      {/* sound: the Ask track under everything, a tap under the typing, a click on the send, one soft swipe per marker
          sweep, the logo hit */}
      <Audio src={staticFile("ask-series/music.mp3")} volume={(fr) => interpolate(fr, [0, 8, TOTAL - 30, TOTAL], [0, 0.32, 0.32, 0], clamp)} />
      {Array.from({ length: keys }, (_, i) => (
        <Sequence key={`k${i}`} from={typeStart + Math.round((i / keys) * (SEND - typeStart))} durationInFrames={10}>
          <Audio src={staticFile("sound/cues/type-switch-tap.wav")} volume={0.14} />
        </Sequence>
      ))}
      <Sequence from={SEND} durationInFrames={30}>
        <Audio src={staticFile("sound/cues/press-ui-select-click.wav")} volume={0.4} />
      </Sequence>
      {[SWEEP_1, SWEEP_2].map((at) => (
        <Sequence key={at} from={at} durationInFrames={30}>
          <Audio src={staticFile("sound/cues/move-swoosh-quick.wav")} volume={0.22} />
        </Sequence>
      ))}
      <Sequence from={ASK_LEN + 8} durationInFrames={60}>
        <Audio src={staticFile("sound/cues/logo-bass-hit-futuristic.wav")} volume={0.45} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const AskHighlightRoot: React.FC = () => (
  <Composition id="AskHighlight-9x16" component={AskHighlight} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
);
