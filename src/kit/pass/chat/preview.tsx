/**
 * Previews for the chat group (1080 x 1350, 30 fps), all on real campusai-demo captures from
 * capture/pass-chat.cjs (public/pass/chat/) and public/pass/dashboard.jpg:
 *   Pass-HonestTyping   "What should I ask at the Evercore chat?" typed into the dashboard's Ask CampusAI box
 *                       ("What should I bring" first, the demo's own follow-up wording, deleted back to "bring"),
 *                       then the real answer streaming, the camera
 *                       staying close and riding the answer's writing edge.
 *   Pass-AnswerToPage   that answer's "Evercore Coffee Chat" lifting into the event's real detail, landing on
 *                       Why this fits you.
 *   Pass-RedDot         the dot leaves Ask CampusAI, lands on today's job (Evercore), the event (Finance
 *                       Association, Resume & LinkedIn Night), the moved assignment (Reading Response 6), goes home.
 */
import React from "react";
import { AbsoluteFill, Composition, staticFile } from "remotion";
import { brand, useBrandFonts } from "../../brand";
import type { Rect } from "../../camera";
import { HonestTyping, scriptFrames } from "./HonestTyping";
import type { TypeStep } from "./HonestTyping";
import { AnswerToPage, ANSWER_TO_PAGE_TIMING } from "./AnswerToPage";
import { RedDot } from "./RedDot";
import type { Recording } from "./shared";
import rec from "../../../../public/pass/chat/answer/frames.json";
import focus from "../../../../public/pass/chat/chat-focus.json";
import typed from "../../../../public/pass/chat/chat-typed.json";
import answer from "../../../../public/pass/chat/chat-answer.json";
import event from "../../../../public/pass/chat/event-evercore.json";
import rowsJson from "../../../../public/pass/chat/dashboard-rows.json";
import edge from "../../../../public/pass/chat/answer/edge.json";

const B = brand("campusai");
const W = 1080;
const H = 1350;
const FPS = 30;
const PAGE = { w: 1440, h: 900 };
const VIEW: Rect = { x: 30, y: 270, w: 1020, h: 810 };
// the sidebar's own colour behind the Maryland mark, sampled per capture
const SIDEBAR = { dashboard: "rgb(33, 21, 21)", focus: "rgb(32, 22, 21)", answer: "rgb(29, 20, 21)", event: "rgb(14, 10, 9)" };

const Ground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useBrandFonts(B);
  return <AbsoluteFill style={{ background: B.color.bgDeep, backgroundImage: B.color.gradient }}>{children}</AbsoluteFill>;
};

/* ------------------------------------------------------------ HonestTyping */

const RECORDING: Recording = { dir: staticFile("pass/chat/answer/"), frames: rec.frames, clip: rec.clip };
const STEPS: TypeStep[] = [
  { type: "type", text: "What should I bring", perChar: 2.1, wobble: 0.4 },
  { type: "pause", frames: 16 },
  { type: "delete", count: 5, perChar: 1.6 },
  { type: "pause", frames: 4 },
  { type: "type", text: "ask at the Evercore chat?", perChar: 1.45, wobble: 0.12 },
];
const TYPE_AT = 6;
const SEND_AT = TYPE_AT + scriptFrames(STEPS) + 8;
// Recording time by segments: the send and the card re-flowing at true speed, the loader wait trimmed, the
// "The **Evercore" quarter second stepped over, then the stream slowed, (line 1 to 0.18x, line 2 to 0.3x) so the
// close camera can ride the writing edge at a readable size, then the finished answer at true speed.
const TIMELINE = [
  { frames: 10, from: rec.marks.send, to: 0.75 },
  { frames: 5, from: 1.47, to: 1.535 },
  { frames: 46, from: 1.8, to: 2.07 },
  { frames: 56, from: 2.07, to: 2.64 },
  { frames: 15, from: 2.64, to: 3.12 },
];
const HT_FRAMES = SEND_AT + TIMELINE.reduce((n, x) => n + x.frames, 0) + 8;
// the answer's line extent on the page and the line pair's centre (chat-answer.json, edge.json)
const FOLLOW = { track: edge.track, cw: 510, cy: 580, x0: answer.boxes.answer.x, x1: answer.boxes.answer.x + answer.boxes.answer.w, lead: 0.32, lag: 10, blend: 10, breakHold: 0.11 };

const HonestTypingPreview: React.FC = () => (
  <Ground>
    <HonestTyping
      brand={B}
      page={{ src: staticFile("pass/chat/chat-focus.jpg"), size: PAGE }}
      view={VIEW}
      cams={[
        { t: 0, cam: { cx: 520, cy: 620, cw: 540 } },

      ]}
      field={{ ...focus.textarea, fontSize: focus.style.fontSize, lineHeight: focus.style.lineHeight, color: focus.style.color }}
      script={{ at: TYPE_AT, steps: STEPS }}
      placeholder={{ rect: { x: 268, y: 629, w: 190, h: 21 }, blankFrom: { x: 700, y: 629, w: 190, h: 21 } }}
      sendLit={{ src: staticFile("pass/chat/chat-typed.jpg"), rect: typed.send as Rect }}
      answer={{ rec: RECORDING, from: rec.marks.send, at: SEND_AT, timeline: TIMELINE, follow: FOLLOW }}
      markColor={SIDEBAR.focus}
    />
  </Ground>
);

/* ------------------------------------------------------------ AnswerToPage */

const T = ANSWER_TO_PAGE_TIMING;
const AP_FRAMES = T.land + T.landLen + 60;

const AnswerToPagePreview: React.FC = () => (
  <Ground>
    <AnswerToPage
      brand={B}
      size={PAGE}
      view={VIEW}
      from={{ src: staticFile("pass/chat/chat-answer.jpg"), name: answer.boxes.name, frame: { cx: 835, cy: 560, cw: 1110 }, markColor: SIDEBAR.answer,
        ground: "rgb(34, 22, 24)" }}
      to={{ src: staticFile("pass/chat/event-evercore.jpg"), panel: event.boxes.panel, radius: event.boxes.panel.radius, title: event.boxes.title,
        land: event.boxes.why as Rect, markColor: SIDEBAR.event }}
    />
  </Ground>
);

/* ------------------------------------------------------------ RedDot */

const R = rowsJson.rows as Record<string, Rect>;
const F1 = { cx: 705, cy: 330, cw: 960 };
const F2 = { cx: 1080, cy: 280, cw: 700 };
const F3 = { cx: 705, cy: 280, cw: 960 };
const F4 = { cx: 640, cy: 330, cw: 800 };
const RD_FRAMES = 258;

const RedDotPreview: React.FC = () => (
  <Ground>
    <RedDot
      brand={B}
      page={{ src: staticFile("pass/dashboard.jpg"), size: PAGE }}
      view={VIEW}
      cams={[
        { t: 0, cam: F1 },
        { t: 56, cam: F1 },
        { t: 78, cam: F2 },
        { t: 106, cam: F2 },
        { t: 132, cam: F3 },
        { t: 160, cam: F3 },
        { t: 186, cam: F4 },
        { t: 212, cam: F4 },
        { t: RD_FRAMES, cam: { ...F4, cw: 770 } },
      ]}
      start={{ rect: R.askMark, ax: 0.5, appear: 10 }}
      stops={[
        { rect: R.evercoreJob, ax: 0.06, at: 52 },
        { rect: R.financeEvent, ax: 0.04, at: 100 },
        { rect: R.moved, ax: 0.08, at: 156 },
      ]}
      home={{ rect: R.askMark, ax: 0.5, at: 210 }}
      size={18}
      markColor={SIDEBAR.dashboard}
    />
  </Ground>
);

export const ChatPassRoot: React.FC = () => (
  <>
    <Composition id="Pass-HonestTyping" component={HonestTypingPreview} durationInFrames={HT_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="Pass-AnswerToPage" component={AnswerToPagePreview} durationInFrames={AP_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="Pass-RedDot" component={RedDotPreview} durationInFrames={RD_FRAMES} fps={FPS} width={W} height={H} />
  </>
);
