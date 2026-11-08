/**
 * "Everything those emails were telling you, in one place." The daily brief film (Nov 5, Jacob picked structure A).
 *
 * A student's week arrives as a stream of email. The noise falls away; each email that matters flies into its real
 * row of her daily brief, recorded from the demo; then the brief shows one pick with its reason. Wide 16:9, light,
 * the Morgan Stanley film's look and lines (its parts are imported from it, not copied).
 *
 * Honesty line: CampusAI does not read email. The emails are the "before", drawn; the rows are the real product,
 * which pulls from Canvas, events, postings and clubs. Brief, facts, shot list: Content/video-studio/films/daily-brief/.
 * Music: Cat Walk (Arulo, Mixkit, ~130 BPM), entered 22 beats in so its first lift lands on the first email arriving.
 */
import React from "react";
import { AbsoluteFill, Composition, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { EASE_CAMERA, INTER, PointerAt, brand, useBrandFonts, type Rect } from "../kit";
import { mixCam } from "../kit/camera";
import { pointerAt } from "../kit/FlowRecording";
import { useFrameSeq } from "../system/parts/common";
import { FPS, Line, Logo, Shot, fit, k, mixRect, onCanvas, pop, pw, scaleOf, words } from "../infosession/InfoSession";

const B = brand("campusai");
const W = 1920;
const H = 1080;
const GROUND = "#F6F1ED";
const INK = "#1d1517";
const SOFT = "#7a6c66";
const RED = B.color.accent;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const DIR = "daily-brief";
const FLOW = `${DIR}/flow/frames.json`;
const aud = (n: string) => staticFile(`${DIR}/audio/${n}`);

// ---- the beats: Cat Walk at ~130 BPM ----
const BEAT = (60 / 129.994) * FPS; // 13.85 frames
const Bt = (n: number) => Math.round(n * BEAT);
const T = {
  logo: 8,
  shell: Bt(8), // the brief appears behind the inbox
  noise: Bt(8) + 4, // the emails that don't matter fall away
  fly: Bt(10), // the first email that matters reaches its row; one per beat after
  inPlace: Bt(15) + 8, // "in one place."
  hero: Bt(19), // the camera goes to Worth a look, the pointer rests on a pick
  pick: Bt(21) + 4, // "Picked for you, with the reason."
  end: Bt(30), // the logo
};
export const FRAMES = T.end + 92; // 16.9 s
const BLOOM = T.end + 10;

// ---- the inbox ----
type Mail = { from: string; subject: string; time: string; row?: number };
// In the order they arrive (oldest first). `row` is the brief row an email that matters lands on.
const MAIL: Mail[] = [
  { from: "Dining Services", subject: "This week's menus", time: "7:02 AM" },
  { from: "Canvas Notifications", subject: "Due date changed: Reading Response 6: Remedies", time: "7:15 AM", row: 0 },
  { from: "Testudo Times", subject: "Your weekly digest", time: "7:31 AM" },
  { from: "Canvas Notifications", subject: "Quiz 2 is due Thursday at 11:00 AM", time: "7:48 AM", row: 1 },
  { from: "Canvas Notifications", subject: "Reminder: Reading: Ch. 8 is due Thursday", time: "8:03 AM", row: 2 },
  { from: "RecWell", subject: "Group fitness schedule", time: "8:20 AM" },
  { from: "Job alerts", subject: "New: Investment Banking Summer Analyst, 2027 at Evercore", time: "8:37 AM", row: 3 },
  { from: "Libraries", subject: "Extended hours start Monday", time: "8:52 AM" },
  { from: "Finance Association", subject: "Resume & LinkedIn Night is Thursday at 7 PM", time: "9:06 AM", row: 4 },
  { from: "Transportation Services", subject: "Shuttle detours this week", time: "9:19 AM" },
  { from: "Deloitte Consulting", subject: "Coffee chat, Friday at 4 PM", time: "9:33 AM", row: 5 },
  { from: "Student Government", subject: "Town hall recap", time: "9:41 AM" },
];
const ARRIVE = (a: number) => a * 5; // a new email every 5 frames
const LIST = { x: 510, y: 205, w: 900, h: 70, step: 80 };

// ---- the brief (CSS px of the recording, 1440 x 900) and where it sits on the canvas ----
const PAGE = { w: 1440, h: 900 };
const CARD_PAGE: Rect = { x: 248, y: 32, w: 1160, h: 364 };
const BRIEF_VIEW: Rect = { x: 120, y: 250, w: 1680, h: 527 };
const HERO_PAGE: Rect = { x: 838, y: 140, w: 580, h: 290 }; // Worth a look, with room for the reason to open
const HERO_VIEW: Rect = { x: 380, y: 230, w: 1160, h: 580 };
const ROWS: Rect[] = [
  { x: 281, y: 158, w: 527, h: 67 }, // Moved · BMGT380
  { x: 281, y: 228, w: 527, h: 56 }, // Quiz 2
  { x: 281, y: 288, w: 527, h: 44 }, // Reading: Ch. 8
  { x: 848, y: 156, w: 527, h: 68 }, // Evercore
  { x: 848, y: 228, w: 527, h: 45 }, // Finance Association
  { x: 848, y: 278, w: 527, h: 44 }, // Deloitte Consulting
];
const CHROME: Rect = { x: 1170, y: 28, w: 240, h: 28 }; // the page's floating bell and Feedback buttons over the card's corner
const SPARK_PT = { x: 960 + 265, y: 500 - 51 }; // the spark over the logo's "i" (logo 560 wide at 960, 500)

/** One email: an unread dot, the sender, the time, the subject. No mail app is drawn or named. */
const MailRow: React.FC<{ m: Mail; rect: Rect; opacity: number; rot?: number }> = ({ m, rect, opacity, rot = 0 }) => {
  const z = rect.h / LIST.h;
  return opacity <= 0 ? null : (
    <div style={{ position: "absolute", left: rect.x, top: rect.y, width: rect.w, height: rect.h, opacity, transform: `rotate(${rot}deg)`, borderRadius: 16 * z, background: "#fff",
      boxShadow: "0 0 0 1px rgba(70,30,30,.07), 0 10px 26px rgba(90,40,40,.10)", fontFamily: INTER, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 22 * z, top: 18 * z, width: 10 * z, height: 10 * z, borderRadius: "50%", background: RED }} />
      <div style={{ position: "absolute", left: 46 * z, right: 24 * z, top: 9 * z, display: "flex", justifyContent: "space-between", fontSize: 21 * z, lineHeight: 1.3 }}>
        <span style={{ fontWeight: 650, color: INK, whiteSpace: "nowrap" }}>{m.from}</span>
        <span style={{ fontWeight: 500, color: SOFT, whiteSpace: "nowrap" }}>{m.time}</span>
      </div>
      <div style={{ position: "absolute", left: 46 * z, right: 24 * z, top: 37 * z, fontSize: 20 * z, fontWeight: 500, color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.subject}</div>
    </div>
  );
};

export const DailyBrief: React.FC = () => {
  useBrandFonts(B);
  const f = useCurrentFrame();
  const flow = useFrameSeq(FLOW) as (ReturnType<typeof useFrameSeq> & { marks?: Record<string, number>; moves?: Parameters<typeof pointerAt>[0] }) | null;
  if (!flow) return <AbsoluteFill style={{ background: GROUND }} />;
  const m = flow.marks ?? {};
  const moves = flow.moves ?? [];
  const hoverMove = moves[moves.length - 1];

  // the recording: the clean brief (Spring row already dismissed, nothing hovered), then the hover at true speed
  const CLEAN = (m.clean ?? 8.52) - 0.1;
  const flowT = pw(f, [
    [T.hero + 6, CLEAN],
    [T.hero + 7, hoverMove?.start ?? 8.52],
  ]);

  // ---- the camera on the brief ----
  const hk = k(f, T.hero, T.hero + 26, EASE_CAMERA);
  const shellK = k(f, T.shell, T.shell + 14, EASE_CAMERA);
  const briefOut = k(f, T.end - 4, T.end + 10, EASE_CAMERA);
  const view0 = mixRect(BRIEF_VIEW, HERO_VIEW, hk);
  const view: Rect = { ...view0, y: view0.y + (1 - shellK) * 30 };
  const camBrief = fit(CARD_PAGE, BRIEF_VIEW);
  const camHero = fit(HERO_PAGE, HERO_VIEW);
  const drift = 1 - 0.04 * k(f, T.hero + 26, T.end, (x) => x); // the hold keeps creeping in
  const cam = mixCam(camBrief, { ...camHero, cw: camHero.cw * drift }, hk);
  const rowOnCanvas = (r: Rect): Rect => {
    // where a row sits on the canvas once the brief is up (before the hero move)
    const a = onCanvas(camBrief, BRIEF_VIEW, PAGE, r.x, r.y);
    const s = scaleOf(camBrief, BRIEF_VIEW, PAGE);
    return { x: a.x, y: a.y, w: r.w * s, h: r.h * s };
  };

  // ---- the inbox: each email's place, its fall or its flight ----
  const keyOrder = MAIL.map((x, a) => ({ x, a })).filter((e) => e.x.row !== undefined);
  const landAt = (row: number) => T.fly + Bt(row);
  let noiseN = 0;
  const mails = MAIL.map((mail, a) => {
    const at = ARRIVE(a);
    if (f < at) return null;
    // pushed down one slot by each email that arrives after it
    let y = LIST.y;
    for (let b = a + 1; b < MAIL.length; b++) y += pop(f, ARRIVE(b), 15) * LIST.step;
    const enter = pop(f, at, 14);
    let rect: Rect = { x: LIST.x, y: y - (1 - enter) * 50, w: LIST.w, h: LIST.h };
    let opacity = Math.min(1, enter * 1.6);
    let rot = 0;
    if (mail.row === undefined) {
      const g = k(f, T.noise + noiseN * 3, T.noise + noiseN * 3 + 18, (x) => x * x);
      noiseN++;
      rect = { ...rect, y: rect.y + g * 900 };
      rot = g * (a % 2 ? 7 : -6);
      opacity *= 1 - k(f, T.noise + (noiseN - 1) * 3 + 8, T.noise + (noiseN - 1) * 3 + 18);
    } else {
      const land = landAt(mail.row);
      const fly = k(f, land - 14, land, EASE_CAMERA);
      const to = rowOnCanvas(ROWS[mail.row]);
      rect = mixRect(rect, to, fly);
      opacity *= 1 - k(f, land - 4, land + 2);
    }
    return { mail, rect, opacity, rot, key: a };
  });

  // ---- the end ----
  const endK = k(f, T.end, T.end + 12);
  const markIn = k(f, T.logo, T.logo + 12);
  const markOut = k(f, T.end - 6, T.end + 4);
  const ptr = pointerAt(moves, flowT);
  const ptrOn = f >= T.hero + 6 && f < T.end;

  return (
    <AbsoluteFill style={{ background: GROUND, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(1400px 700px at 50% -15%, rgba(217,32,46,0.07), transparent 70%)" }} />

      {/* the brief, recorded: rows hidden until their email lands on them */}
      {f >= T.shell && briefOut < 1 && (
        <Shot src={FLOW} t={flowT} page={PAGE} cam={cam} view={view} radius={30} opacity={shellK * (1 - briefOut)}>
          {(() => {
            const s = scaleOf(cam, view, PAGE);
            const at = (r: Rect, pad = 3) => {
              const a = onCanvas(cam, view, PAGE, r.x - pad, r.y - pad);
              return { left: a.x, top: a.y, width: (r.w + pad * 2) * s, height: (r.h + pad * 2) * s };
            };
            return (
              <>
                <div style={{ position: "absolute", ...at(CHROME, 0), background: "#fff" }} />
                {ROWS.map((r, i) => {
                  const land = landAt(i);
                  const cover = 1 - k(f, land - 3, land + 6);
                  const ring = k(f, land, land + 16);
                  return (
                    <React.Fragment key={i}>
                      {cover > 0 && <div style={{ position: "absolute", ...at(r), background: "#fff", opacity: cover }} />}
                      {f >= land && ring < 1 && <div style={{ position: "absolute", ...at(r, 6 + 10 * ring), borderRadius: 12, border: `2.5px solid ${RED}`, opacity: 0.8 * (1 - ring) }} />}
                    </React.Fragment>
                  );
                })}
                {ptrOn && ptr.p && (() => {
                  const p = onCanvas(cam, view, PAGE, ptr.p.x, ptr.p.y);
                  return <PointerAt x={p.x} y={p.y} since={null} accent={RED} size={Math.round(20 * s)} opacity={k(f, T.hero + 6, T.hero + 12)} />;
                })()}
              </>
            );
          })()}
        </Shot>
      )}

      {/* the inbox, over the brief */}
      {mails.map((x) => (x ? <MailRow key={x.key} m={x.mail} rect={x.rect} opacity={x.opacity} rot={x.rot} /> : null))}

      {/* lines */}
      <Line ws={words("Your week arrives as email.", ["email"])} at={0} stagger={2} out={T.shell - 6} x={960} y={112} size={60} />
      <Line ws={words("Everything those emails were telling you,")} at={T.shell + 2} stagger={2} out={T.pick - 8} x={960} y={98} size={54} />
      <Line ws={words("in one place.", ["one"])} at={T.inPlace} out={T.pick - 8} x={960} y={164} size={54} />
      <Line ws={words("Picked for you, with the reason.", ["reason"])} at={T.pick} stagger={2} out={T.end - 4} x={960} y={112} size={60} />

      {/* the logo: a small mark from the start, then the end card */}
      {f < T.end + 4 && <Logo x={128} y={64} w={150} opacity={markIn * (1 - markOut)} blur={(1 - markIn) * 10} />}
      {f >= T.end - 4 && (
        <>
          <Logo x={W / 2} y={500} w={560 * (1 + interpolate(f, [BLOOM, FRAMES], [0, 0.015], clamp))} opacity={endK} />
          {f >= BLOOM && (() => {
            const b = k(f, BLOOM, BLOOM + 18);
            return <div style={{ position: "absolute", left: SPARK_PT.x - 70 * b, top: SPARK_PT.y - 70 * b, width: 140 * b, height: 140 * b, borderRadius: "50%", border: `3px solid ${RED}`, opacity: 0.55 * (1 - b) }} />;
          })()}
          <div style={{ position: "absolute", left: 0, right: 0, top: 640, textAlign: "center", fontFamily: INTER, fontWeight: 600, fontSize: 42, color: INK, opacity: k(f, BLOOM + 4, BLOOM + 18), letterSpacing: "-0.01em" }}>campusai.app</div>
        </>
      )}

      {/* sound */}
      <Audio src={aud("cat-walk.mp3")} trimBefore={305} volume={(fr) => 0.5 * Math.min(1, fr / 6) * Math.min(1, Math.max(0, (FRAMES - fr) / 40))} />
      {(
        [
          ...MAIL.map((_, a) => [ARRIVE(a) + 2, "typewriter-hit-soft.mp3", 0.22] as [number, string, number]),
          [T.noise, "swoosh-quick.mp3", 0.35],
          ...keyOrder.map((e) => [landAt(e.x.row as number), "switch-tap.mp3", 0.45] as [number, string, number]),
          [T.hero, "air-woosh-quick.mp3", 0.35],
          [T.hero + 40, "ui-message-pop.mp3", 0.45],
          [BLOOM, "shimmer-sparkle-sweep.mp3", 0.45],
        ] as [number, string, number][]
      ).map(([at, src, v], i) => (
        <Sequence key={i} from={at} layout="none">
          <Audio src={aud(src)} volume={() => v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const DailyBriefRoot: React.FC = () => (
  <Composition id="DailyBrief-16x9" component={DailyBrief} durationInFrames={FRAMES} fps={FPS} width={W} height={H} />
);
