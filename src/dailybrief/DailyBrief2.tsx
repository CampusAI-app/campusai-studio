/**
 * Round 2 (Nov 10) of the daily brief film. Same story, beats and recording as DailyBrief.tsx (the Nov 5 cut, kept as is),
 * with the three fixes the "Video or slideshow" test found (skill/review.md; findings in
 * films/daily-brief/reviews/video-or-slideshow (Nov 10).md):
 *  1. No headline slot: line 1 stays top centre, line 2 sits low under the brief, line 3 comes out of the job card
 *     and settles to the left of it.
 *  2. Nothing tiny: the camera goes into Your week while its three emails land, crosses to Worth a look for the next
 *     three, then pulls back for "in one place."
 *  3. No stall: the pointer rests on each of the three picks in turn and each opens its own reason.
 * Round 6 (Nov 10, Jacob: the ending "should be more about bringing the important things to them", not 24 emails to 6):
 * the payoff is now "What matters, brought to you." with the six real things from the brief flying in from the edges
 * of the frame and settling under it, one per beat.
 * Round 5 (Nov 10, Jacob: the picks "a little quicker", and "put some information or some pictures on the left side"):
 * the rests between the three hovers are cut and that stretch plays at 1.25x, and as each reason opens the left side
 * shows that pick: its logo (the UMD M for the Finance Association), its real details from the demo, and the first
 * clause of its own reason, quoted.
 * Round 4 (Nov 10, Jacob: "add some more UMD and components to catch people's eyes"; UMD imagery is fine in videos):
 * the inbox opens over McKeldin Mall with real UMD senders (ELMS-Canvas, Careers4Terps, Shuttle-UM...), 24 emails
 * instead of 12, an unread counter with the UMD M that climbs to 24 and rolls down to 6 as the noise falls, and a
 * payoff before the logo: 24 emails, 6 that matter.
 * Round 2b (Nov 10, Jacob's notes on round 2): the full brief stays on screen while the emails land (no going into one
 * column), bigger, with softer arcing flights that melt into their rows; and since the line promises reasons, all
 * three picks show theirs. That needed a fresh recording (films/daily-brief-r2/flow.json, Nov 10), so the emails now
 * match the brief as the demo shows it today (Ch. 6-7 reading and the Palsgraf case brief replaced Quiz 2 and Ch. 8,
 * the events moved to Tue and Wed).
 *
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
import { Img } from "remotion";
import { EASE_CAMERA, INTER, Odometer, PointerAt, brand, useBrandFonts, type Rect } from "../kit";
import { camAlong } from "../kit/camera";
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
const FLOW = `daily-brief-r2/flow/frames.json`; // recorded Nov 10, all three picks hovered
const aud = (n: string) => staticFile(`${DIR}/audio/${n}`);

// ---- the beats: Cat Walk at ~130 BPM ----
const BEAT = (60 / 129.994) * FPS; // 13.85 frames
const Bt = (n: number) => Math.round(n * BEAT);
// Round 7 (Jacob: "make the beginning a lil quicker"): emails every 2 frames, the brief two beats sooner, the six
// emails land two to every three beats, and the whole first half arrives about 1.8 s sooner.
const LAND_STEP = BEAT * 0.67;
const T = {
  logo: 8,
  shell: Bt(6), // the brief appears behind the inbox
  noise: Bt(6) - 8, // the emails that don't matter fall away, newest first (before the brief shows, not across it)
  fly: Bt(8), // the first email that matters reaches its row; then one every two thirds of a beat
  inPlace: Bt(12), // "in one place."
  hero: Bt(15), // the camera goes to Worth a look, the pointer rests on a pick
  pick: Bt(17) + 4, // "Picked for you, each with its reason."
  stat: Bt(29), // round 6: "What matters, brought to you." and the six things gathering to the viewer
  end: Bt(34), // the logo
};
export const FRAMES = T.end + 78; // about 22 s
const BLOOM = T.end + 10;
const PHOTO = staticFile("campus-guide/photos/mall.jpg"); // Wikimedia Commons, Radhika Kshirsagar, CC BY-SA 4.0
const UMD_M = staticFile("styles/umd/umd-m.svg");

// ---- the inbox ----
type Mail = { from: string; subject: string; time: string; row?: number };
// In the order they arrive (oldest first). `row` is the brief row an email that matters lands on.
const MAIL: Mail[] = [
  { from: "UMD Dining Services", subject: "This week's menus", time: "6:12 AM" },
  { from: "The Diamondback", subject: "Today's headlines", time: "6:20 AM" },
  { from: "Division of IT", subject: "Duo security reminder", time: "6:31 AM" },
  { from: "Resident Life", subject: "Room inspections this week", time: "6:45 AM" },
  { from: "Maryland Athletics", subject: "Student tickets for Saturday", time: "7:02 AM" },
  { from: "ELMS-Canvas", subject: "Due date changed: Reading Response 6: Remedies", time: "7:15 AM", row: 0 },
  { from: "Stamp Student Union", subject: "Late night bingo Friday", time: "7:22 AM" },
  { from: "TerpLink", subject: "3 new posts in your groups", time: "7:31 AM" },
  { from: "ELMS-Canvas", subject: "Reminder: Reading: Ch. 6-7 is due Tuesday", time: "7:48 AM", row: 1 },
  { from: "University Health Center", subject: "Flu shots this week", time: "7:55 AM" },
  { from: "ELMS-Canvas", subject: "Case brief: Palsgraf is due Wednesday", time: "8:03 AM", row: 2 },
  { from: "Smith School of Business", subject: "Speaker series this week", time: "8:12 AM" },
  { from: "UMD RecWell", subject: "Group fitness schedule", time: "8:20 AM" },
  { from: "Bursar's Office", subject: "Your statement is ready", time: "8:29 AM" },
  { from: "Careers4Terps", subject: "New: Investment Banking Summer Analyst, 2027 at Evercore", time: "8:37 AM", row: 3 },
  { from: "Writing Center", subject: "Book a session", time: "8:44 AM" },
  { from: "UMD Libraries", subject: "McKeldin extended hours start Monday", time: "8:52 AM" },
  { from: "Do Good Institute", subject: "Volunteer fair Thursday", time: "9:00 AM" },
  { from: "Finance Association", subject: "Resume & LinkedIn Night is Tuesday at 7 PM", time: "9:06 AM", row: 4 },
  { from: "Shuttle-UM", subject: "Detours this week", time: "9:12 AM" },
  { from: "Student Government", subject: "Town hall recap", time: "9:19 AM" },
  { from: "Stamp Gallery", subject: "New exhibit opens", time: "9:26 AM" },
  { from: "Deloitte Consulting", subject: "Coffee chat, Wednesday at 4 PM", time: "9:33 AM", row: 5 },
  { from: "University Career Center", subject: "Career fair recap", time: "9:41 AM" },
];
const NOISE = MAIL.map((m, a) => (m.row === undefined ? a : -1)).filter((a) => a >= 0).reverse(); // newest falls first
const ARRIVE = (a: number) => a * 2; // round 7: a new email every 2 frames, 24 of them
const LIST = { x: 510, y: 205, w: 900, h: 70, step: 80 };

// ---- the brief (CSS px of the recording, 1440 x 900) and where it sits on the canvas ----
const PAGE = { w: 1440, h: 900 };
const CARD_PAGE: Rect = { x: 248, y: 32, w: 1160, h: 364 };
const BRIEF_VIEW: Rect = { x: 60, y: 226, w: 1800, h: 565 }; // round 2b: the whole brief, as big as the frame allows
const HERO_PAGE: Rect = { x: 836, y: 108, w: 584, h: 330 }; // Worth a look, with room for any one reason to open
const HERO_VIEW: Rect = { x: 700, y: 214, w: 1100, h: 652 }; // round 2: right of centre, so line 3 has the left
const ROWS: Rect[] = [
  { x: 281, y: 158, w: 527, h: 67 }, // Moved · BMGT380
  { x: 281, y: 228, w: 527, h: 56 }, // Quiz 2
  { x: 281, y: 288, w: 527, h: 44 }, // Reading: Ch. 8
  { x: 848, y: 156, w: 527, h: 68 }, // Evercore
  { x: 848, y: 228, w: 527, h: 45 }, // Finance Association
  { x: 848, y: 278, w: 527, h: 44 }, // Deloitte Consulting
];
const CHROME: Rect = { x: 1172, y: 20, w: 246, h: 36 }; // the page's floating bell and Feedback buttons over the card's corner
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
  const hoverMove = moves.find((mv) => mv.start >= (m.clean ?? 8.3) - 0.05); // the move onto Evercore

  // the recording: the clean brief (Spring row already dismissed, nothing hovered), then the hover at true speed
  const CLEAN = (m.clean ?? 8.52) - 0.1;
  // round 5: the rests between hovers are cut (the frames there are identical, so the jumps do not show) and the
  // stretch plays at 1.25x. Flow times: Evercore move 8.357, Finance Association moves from 11.03, Deloitte from 14.06.
  const P0 = T.hero + 7;
  const R = 1.25;
  const fs = (sec: number) => Math.round((sec * FPS) / R);
  const A1 = P0 + fs(2.0), B0 = A1 + 1, B1 = B0 + fs(2.42), C0 = B1 + 1;
  const flowT = pw(f, [
    [T.hero + 6, CLEAN],
    [P0, hoverMove?.start ?? 8.357],
    [A1, (hoverMove?.start ?? 8.357) + 2.0],
    [B0, 11.03],
    [B1, 13.45],
    [C0, 14.06],
    [C0 + 200, 14.06 + (200 * R) / FPS],
  ]);

  // ---- the camera on the brief ----
  const shellK = k(f, T.shell + 6, T.shell + 22, EASE_CAMERA);
  const briefOut = k(f, T.stat - 14, T.stat, EASE_CAMERA); // round 2: gone before the logo, no half-and-half frame
  const camBrief = fit(CARD_PAGE, BRIEF_VIEW);
  const camHero = fit(HERO_PAGE, HERO_VIEW);
  // the window on the canvas and the camera inside it move together, one key per move
  const keys: { t: number; cam: typeof camBrief; view: Rect }[] = [
    { t: 0, cam: camBrief, view: BRIEF_VIEW },
    { t: T.hero, cam: camBrief, view: BRIEF_VIEW },
    { t: T.hero + 26, cam: camHero, view: HERO_VIEW },
  ];
  const cam = camAlong(f, keys.map(({ t, cam }) => ({ t, cam })));
  const vi = keys.findIndex((x, n) => n < keys.length - 1 && f >= x.t && f < keys[n + 1].t);
  const view0 = f <= keys[0].t ? keys[0].view : vi < 0 ? keys[keys.length - 1].view
    : mixRect(keys[vi].view, keys[vi + 1].view, k(f, keys[vi].t, keys[vi + 1].t, EASE_CAMERA));
  const view: Rect = { ...view0, y: view0.y + (1 - shellK) * 30 };
  const rowOnCanvas = (r: Rect): Rect => {
    // where a row sits on the canvas right now, so a flying email follows the moving camera
    const a = onCanvas(cam, view, PAGE, r.x, r.y);
    const s = scaleOf(cam, view, PAGE);
    return { x: a.x, y: a.y, w: r.w * s, h: r.h * s };
  };

  // ---- the inbox: each email's place, its fall or its flight ----
  const keyOrder = MAIL.map((x, a) => ({ x, a })).filter((e) => e.x.row !== undefined);
  const landAt = (row: number) => T.fly + Math.round(row * LAND_STEP);
  // the unread counter: every email that has arrived, minus every one that has fallen away
  let unread = 0;
  const mails = MAIL.map((mail, a) => {
    const at = ARRIVE(a);
    if (f < at) return null;
    // pushed down one slot by each email that arrives after it
    let y = LIST.y;
    for (let b = a + 1; b < MAIL.length; b++) y += pop(f, ARRIVE(b), 15) * LIST.step;
    const enter = pop(f, at, 14);
    unread += Math.min(1, enter);
    let rect: Rect = { x: LIST.x, y: y - (1 - enter) * 50, w: LIST.w, h: LIST.h };
    let opacity = Math.min(1, enter * 1.6);
    let rot = 0;
    if (mail.row === undefined) {
      const n = NOISE.indexOf(a);
      const g = k(f, T.noise + n * 2, T.noise + n * 2 + 15, (x) => x * x);
      rect = { ...rect, y: rect.y + g * 900 };
      rot = g * (a % 2 ? 7 : -6);
      opacity *= 1 - k(f, T.noise + n * 2 + 6, T.noise + n * 2 + 15);
      unread -= k(f, T.noise + n * 2 + 2, T.noise + n * 2 + 8);
    } else {
      const land = landAt(mail.row);
      // round 2: once the noise is gone, the emails that matter tuck into a small stack in the corner, so the camera
      // can go into the brief without them on top of it; each one flies from there to its row
      // (the first one flies straight from the list, it is already on its way)
      const tuck = mail.row === 0 ? 0 : k(f, T.noise + 2, T.noise + 26, EASE_CAMERA);
      const tray: Rect = { x: 1546, y: 872 + mail.row * 32, w: 344, h: LIST.h * 0.38 };
      rect = mixRect(rect, tray, tuck);
      const fly = k(f, land - 22, land, EASE_CAMERA); // round 2b: longer, and on an arc
      const to = rowOnCanvas(ROWS[mail.row]);
      rect = mixRect(rect, to, fly);
      rect = { ...rect, y: rect.y - Math.sin(Math.PI * fly) * 70 };
      opacity *= 1 - k(f, land - 8, land + 2); // melts into the row as the row fades up under it
    }
    return { mail, rect, opacity, rot, key: a };
  });

  // ---- the end ----
  const endK = k(f, T.end, T.end + 12);
  // round 4: McKeldin Mall behind the inbox, pushing in, gone once the brief is up
  const photoIn = interpolate(f, [0, T.shell + 22], [1, 1.1], clamp);
  const photoOut = k(f, T.shell + 4, T.shell + 24, EASE_CAMERA);
  const markIn = k(f, T.logo, T.logo + 12);
  const markOut = k(f, T.stat - 6, T.stat + 4);
  const ptr = pointerAt(moves, flowT);
  const ptrOn = f >= T.hero + 6 && f < T.stat - 12;

  return (
    <AbsoluteFill style={{ background: GROUND, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(1400px 700px at 50% -15%, rgba(217,32,46,0.07), transparent 70%)" }} />
      {photoOut < 1 && (
        <AbsoluteFill style={{ opacity: 1 - photoOut }}>
          <Img src={PHOTO} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${photoIn})`, transformOrigin: "50% 60%" }} />
          {/* a light wash so the inbox and the line read, darker at the top where the line sits */}
          <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(246,241,237,0.86) 0%, rgba(246,241,237,0.42) 34%, rgba(246,241,237,0.30) 70%, rgba(246,241,237,0.62) 100%)" }} />
          <div style={{ position: "absolute", left: 40, bottom: 26, fontFamily: INTER, fontWeight: 500, fontSize: 17, color: "rgba(29,21,23,0.72)" }}>
            McKeldin Mall, University of Maryland. Photo by Radhika Kshirsagar, CC BY-SA 4.0
          </div>
        </AbsoluteFill>
      )}

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
                  const cover = 1 - k(f, land - 7, land + 6);
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
                  return <PointerAt x={p.x} y={p.y} since={null} accent={RED} size={Math.round(20 * s)} opacity={k(f, T.hero + 6, T.hero + 12) * (1 - k(f, T.stat - 20, T.stat - 12))} />;
                })()}
              </>
            );
          })()}
        </Shot>
      )}

      {/* the inbox, over the brief */}
      {mails.map((x) => (x ? <MailRow key={x.key} m={x.mail} rect={x.rect} opacity={x.opacity} rot={x.rot} /> : null))}

      {/* round 4: the unread counter, top right, with the UMD M */}
      {(() => {
        const inK = pop(f, 2, 16);
        const outK = k(f, T.shell + 30, T.shell + 44, EASE_CAMERA);
        if (outK >= 1) return null;
        return (
          <div style={{ position: "absolute", right: 56, top: 40, display: "flex", alignItems: "center", gap: 16, padding: "12px 26px 12px 16px", borderRadius: 999,
            background: "#fff", boxShadow: "0 0 0 1px rgba(70,30,30,.08), 0 12px 30px rgba(90,40,40,.14)", opacity: Math.min(1, inK) * (1 - outK),
            transform: `translateY(${(1 - inK) * -24 - outK * 20}px)` }}>
            <Img src={UMD_M} style={{ width: 40, height: 44 }} />
            <Odometer value={Math.max(0, unread)} digits={unread >= 9.5 ? 2 : 1} size={46} color={RED} />
            <span style={{ fontFamily: INTER, fontWeight: 600, fontSize: 30, color: INK }}>unread</span>
          </div>
        );
      })()}

      {/* round 6: the payoff before the logo. The six things the brief brought, flying in to the viewer */}
      {f >= T.stat - 2 && f < T.end + 6 && (() => {
        const out = k(f, T.end - 6, T.end + 4);
        const things: { t: string; kind: string; from: [number, number] }[] = [
          { t: "Reading Response 6, now due Sun", kind: "BMGT380", from: [-700, -300] },
          { t: "Evercore summer analyst role", kind: "Job", from: [2600, -260] },
          { t: "Reading: Ch. 6-7, due Tue", kind: "BMGT364", from: [-760, 560] },
          { t: "Resume & LinkedIn Night, Tue 7 PM", kind: "Event", from: [2700, 520] },
          { t: "Case brief: Palsgraf, due Wed", kind: "BMGT380", from: [-600, 1400] },
          { t: "Deloitte Coffee Chat, Wed 4 PM", kind: "Event", from: [2500, 1450] },
        ];
        const COL = [250, 990];
        const ROW0 = 470;
        return (
          <>
            <div style={{ opacity: 1 - out, transform: `translateY(${-out * 16}px)` }}>
              <Line ws={words("What matters, brought to you.", ["you."])} at={T.stat} stagger={2} x={960} y={300} size={84} />
            </div>
            {things.map((th, i) => {
              const at = T.stat + 8 + i * 4;
              const p = pop(f, at, 16);
              const col = COL[i % 2], row = ROW0 + Math.floor(i / 2) * 104;
              const x = th.from[0] + (col - th.from[0]) * p;
              const y = th.from[1] + (row - th.from[1]) * p;
              if (f < at) return null;
              return (
                <div key={i} style={{ position: "absolute", left: x, top: y, width: 680, height: 80, borderRadius: 20, background: "#fff",
                  boxShadow: "0 0 0 1px rgba(70,30,30,.08), 0 14px 32px rgba(90,40,40,.13)", display: "flex", alignItems: "center", gap: 18, padding: "0 26px",
                  fontFamily: INTER, opacity: (1 - out) * Math.min(1, p * 1.4), transform: `rotate(${(1 - Math.min(1, p)) * (i % 2 ? 8 : -8)}deg)` }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: RED, flex: "none" }} />
                  <span style={{ fontSize: 22, fontWeight: 600, color: RED, flex: "none" }}>{th.kind}</span>
                  <span style={{ fontSize: 27, fontWeight: 600, color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{th.t}</span>
                </div>
              );
            })}
          </>
        );
      })()}

      {/* lines */}
      <Line ws={words("Your week at Maryland arrives as email.", ["email"])} at={0} stagger={2} out={T.shell - 6} x={900} y={112} size={60} />
      {/* line 2 sits low, under the brief, smaller, and arrives whole */}
      <Line ws={words("Everything those emails were telling you,")} at={T.shell + 2} stagger={1} out={T.pick - 8} x={960} y={924} size={46} />
      <Line ws={words("in one place.", ["one"])} at={T.inPlace} stagger={1} out={T.pick - 8} x={960} y={984} size={46} />
      {/* line 3 comes out of the job card and settles to its left */}
      {(() => {
        const o = k(f, T.pick, T.pick + 18, EASE_CAMERA);
        const dx = (1 - o) * 640;
        const dy = (1 - o) * 120;
        const sc = 0.45 + 0.55 * o;
        return (
          <div style={{ position: "absolute", inset: 0, transform: `translate(${dx}px, ${dy}px) scale(${sc})`, transformOrigin: "360px 270px" }}>
            <Line ws={words("Picked for you, each with its reason.", ["reason"])} at={T.pick} stagger={2} out={T.stat - 14} x={370} y={270} size={56} maxW={620} />
          </div>
        );
      })()}

      {/* round 5: the pick whose reason is open, on the left: logo, real details from the demo, its reason's first clause */}
      {(() => {
        const P0 = T.hero + 7;
        const at = (sec: number, base: number, from: number) => base + Math.round(((sec - from) * FPS) / 1.25);
        const A1 = P0 + Math.round((2.0 * FPS) / 1.25), B0 = A1 + 1, B1 = B0 + Math.round((2.42 * FPS) / 1.25), C0 = B1 + 1;
        const picks = [
          { at: at(9.6, P0, 8.357), logo: staticFile("daily-brief-r2/logos/evercore.png"), kind: "Job", name: "Investment Banking Summer Analyst, Evercore",
            facts: ["New York, NY", "$110k to $120k"], quote: ["Your Investment Fund pitches line up directly with an M&A analyst's ", "core work."] },
          { at: at(12.1, B0, 11.03), logo: UMD_M, kind: "Event", name: "Finance Association, Resume & LinkedIn Night",
            facts: ["Tue 7 PM", "Van Munching 1330"], quote: ["Your resume is going into fall banking books ", "now."] },
          { at: at(15.1, C0, 14.06), logo: staticFile("daily-brief-r2/logos/deloitte.png"), kind: "Event", name: "Deloitte Consulting, Coffee Chat",
            facts: ["Wed 4 PM", "Van Munching Atrium"], quote: ["Consulting sits right next to the finance work you already do, so it's a real ", "backup lane."] },
        ];
        return picks.map((p, i) => {
          const next = i < picks.length - 1 ? picks[i + 1].at : T.stat - 12;
          const inK = k(f, p.at, p.at + 12, EASE_CAMERA);
          const outK = k(f, next - 2, next + 8, EASE_CAMERA);
          if (inK <= 0 || outK >= 1) return null;
          return (
            <div key={i} style={{ position: "absolute", left: 70, top: 410, width: 590, opacity: inK * (1 - outK), transform: `translateY(${(1 - inK) * 40 - outK * 30}px)` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
                <div style={{ width: 104, height: 104, flex: "none", borderRadius: 24, background: "#fff", boxShadow: "0 0 0 1px rgba(70,30,30,.08), 0 12px 28px rgba(90,40,40,.12)",
                  display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  <Img src={p.logo} style={{ width: 72, height: 72, objectFit: "contain" }} />
                </div>
                <div style={{ fontFamily: INTER }}>
                  <div style={{ fontSize: 22, fontWeight: 600, color: RED }}>{p.kind}</div>
                  <div style={{ fontSize: 30, fontWeight: 650, color: INK, lineHeight: 1.18 }}>{p.name}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 22 }}>
                {p.facts.map((t, j) => (
                  <span key={j} style={{ fontFamily: INTER, fontSize: 22, fontWeight: 600, color: INK, background: "#fff", borderRadius: 999, padding: "9px 18px",
                    boxShadow: "0 0 0 1px rgba(70,30,30,.10)", opacity: k(f, p.at + 6 + j * 3, p.at + 14 + j * 3) }}>{t}</span>
                ))}
              </div>
              <div style={{ marginTop: 28, fontFamily: "Zodiak", fontWeight: 700, fontSize: 36, lineHeight: 1.2, color: INK, letterSpacing: "-0.01em", opacity: k(f, p.at + 10, p.at + 20) }}>
                {p.quote[0]}<span style={{ color: RED, fontStyle: "italic", fontWeight: 400 }}>{p.quote[1]}</span>
              </div>
            </div>
          );
        });
      })()}

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
          ...MAIL.filter((_, a) => a % 2 === 0).map((_, i) => [ARRIVE(i * 2) + 2, "typewriter-hit-soft.mp3", 0.2] as [number, string, number]),
          ...[0, 1, 2, 3, 4, 5].map((i) => [T.stat + 14 + i * 4, "switch-tap.mp3", 0.3] as [number, string, number]),
          [T.noise, "swoosh-quick.mp3", 0.35],
          ...keyOrder.map((e) => [landAt(e.x.row as number), "switch-tap.mp3", 0.45] as [number, string, number]),
          [T.hero, "air-woosh-quick.mp3", 0.35],
          [T.hero + 40, "ui-message-pop.mp3", 0.45],
          // each later reason opening gets the same pop (flow times from the recording's marks)
          // round 5: the same pop as each later reason opens, on the compressed clock
          ...[T.hero + 7 + 48 + 1 + Math.round(((12.1 - 11.03) * FPS) / 1.25), T.hero + 7 + 48 + 1 + 58 + 1 + Math.round(((15.1 - 14.06) * FPS) / 1.25)].map((fr) => [fr, "ui-message-pop.mp3", 0.4] as [number, string, number]),
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

export const DailyBrief2Comp: React.FC = () => (
  <Composition id="DailyBrief-r2-16x9" component={DailyBrief} durationInFrames={FRAMES} fps={FPS} width={W} height={H} />
);
