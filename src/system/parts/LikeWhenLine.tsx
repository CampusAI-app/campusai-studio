/**
 * like-when-line (2026-10-23): the scenario opener of the "Like when..." format. The problem line in
 * big Zodiak, sentence case, set OVER the real page of that scenario already on screen and dimmed
 * (orientation plays over the thing, never on black: Jacob, 2026-09-16). Its words arrive out of a
 * blur, it holds for the reading rule, then every word travels to its place in a small headline above
 * the product (each word moves on its own, so the headline re-breaks into one or two lines instead of
 * shrinking the big three) as the page brightens and the next shot takes over.
 *
 * The line is the shot's first text line with role "hook" (or "line"); its `at` and `hold` time it.
 * Props:
 *   accent?: string[]   phrases set in the italic accent ("due date"); a phrase never breaks across lines.
 *   dim?: number        how dark the page sits under the big line. Default 0.78.
 *   moveAt?: number     seconds after the shot starts that the line rises. Default at + hold.
 *   keepHeadline?: bool keep the small headline past a same-surface handoff. Default false.
 */
import React from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import { ZODIAK } from "../../kit/parts";
import { CURVE, DUR, FPS, readHold } from "../motion";
import { num, ramp, SurfaceView } from "./common";
import type { PartProps } from "./types";

const NBSP = " ";
const TRACK = -0.02; // ZODIAK.track, in em

type Token = { text: string; accent: boolean };
type Placed = Token & { x: number; y: number; w: number };

const clean = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}']/gu, "");

/** Words, with each accent phrase merged into one unbreakable token. */
const tokenize = (text: string, accent: string[]): Token[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const phrases = accent.map((a) => a.split(/\s+/).map(clean)).filter((p) => p.length);
  const out: Token[] = [];
  for (let i = 0; i < words.length; ) {
    const hit = phrases.find((p) => p.every((w, j) => clean(words[i + j] ?? "") === w));
    if (hit) {
      out.push({ text: words.slice(i, i + hit.length).join(NBSP), accent: true });
      i += hit.length;
    } else {
      out.push({ text: words[i], accent: false });
      i += 1;
    }
  }
  return out;
};

let measureCtx: CanvasRenderingContext2D | null | undefined;
const measure = (t: Token, size: number) => {
  if (measureCtx === undefined) measureCtx = typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d");
  if (!measureCtx) return t.text.length * 0.5 * size;
  measureCtx.font = `${t.accent ? "italic 400" : "700"} ${size}px Zodiak`;
  return measureCtx.measureText(t.text).width + TRACK * size * t.text.length;
};

/** Greedy wrap at `maxW`, lines centred; positions are each word's top left, relative to the block centre. */
const placeWords = (tokens: Token[], size: number, maxW: number, lh: number) => {
  const space = measure({ text: " ", accent: false }, size);
  const lines: { items: (Token & { w: number })[]; w: number }[] = [];
  let cur: (Token & { w: number })[] = [];
  let curW = 0;
  for (const t of tokens) {
    const w = measure(t, size);
    const next = cur.length ? curW + space + w : w;
    if (cur.length && next > maxW) {
      lines.push({ items: cur, w: curW });
      cur = [{ ...t, w }];
      curW = w;
    } else {
      cur.push({ ...t, w });
      curW = next;
    }
  }
  if (cur.length) lines.push({ items: cur, w: curW });
  const blockH = lines.length * size * lh;
  const placed: Placed[] = [];
  lines.forEach((l, li) => {
    let x = -l.w / 2;
    l.items.forEach((it) => {
      placed.push({ ...it, x, y: -blockH / 2 + li * size * lh });
      x += it.w + space;
    });
  });
  return { placed, blockH };
};

/**
 * Holds the frame until both Zodiak faces are loaded into this page, then measures with them.
 * `document.fonts.check()` cannot be trusted for this: it answers true when no Zodiak face has been
 * added yet, which is how a fresh `remotion still` page measured with fallback metrics and set the
 * words on top of each other. So the faces are loaded here, and readiness is read off the loaded faces.
 */
const zodiakLoaded = () => {
  if (typeof document === "undefined") return true;
  const faces = Array.from(document.fonts as unknown as Iterable<FontFace>).filter((x) => x.family.replace(/["']/g, "") === "Zodiak" && x.status === "loaded");
  return faces.some((x) => x.style === "normal" && String(x.weight) === "700") && faces.some((x) => x.style === "italic");
};
let zodiakLoad: Promise<void> | null = null;
const loadZodiak = () => {
  if (!zodiakLoad) {
    const faces = [
      new FontFace("Zodiak", `url(${staticFile("fonts/Zodiak-Bold.woff2")}) format("woff2")`, { weight: "700", style: "normal" }),
      new FontFace("Zodiak", `url(${staticFile("fonts/Zodiak-Italic.woff2")}) format("woff2")`, { weight: "400", style: "italic" }),
    ];
    zodiakLoad = Promise.all(faces.map((x) => x.load().then((l) => { document.fonts.add(l); }))).then(() => undefined);
  }
  return zodiakLoad;
};
const useZodiakReady = () => {
  const [ready, setReady] = React.useState(zodiakLoaded);
  const [handle] = React.useState(() => (ready ? null : delayRender("Zodiak loaded and measured")));
  React.useEffect(() => {
    if (handle === null) return;
    loadZodiak()
      .then(() => setReady(true))
      .catch(() => setReady(true));
  }, [handle]);
  // the frame is released only after a render that measured with the loaded face
  React.useEffect(() => {
    if (ready && handle !== null) continueRender(handle);
  }, [ready, handle]);
  return ready;
};

export const LikeWhenLine: React.FC<PartProps> = ({ shot, surface, brand, f, layout, props, ctx }) => {
  const ready = useZodiakReady();
  const t = (shot.text ?? []).find((x) => x.role === "hook") ?? (shot.text ?? []).find((x) => x.role === "line");
  const cam = surface ? ctx.cam(f) : null;
  const text = t?.text ?? "";
  const at = (t?.at ?? 0) * FPS;
  const hold = t?.hold ?? readHold(text);
  const moveAt = num(props.moveAt, (t?.at ?? 0) + hold) * FPS;
  const move = ramp(f, moveAt, moveAt + DUR.travel, CURVE.quiet.standard);
  const dim = num(props.dim, 0.78) * (1 - move);

  const accentKey = Array.isArray(props.accent) ? (props.accent as string[]).join("|") : "";
  const { view, headline, u } = layout;
  const big = layout.bigLine.size;
  const lh = 1.08;
  const plan = React.useMemo(() => {
    if (!ready) return null;
    const tokens = tokenize(text, accentKey ? accentKey.split("|") : []);
    const B = placeWords(tokens, big, layout.bigLine.maxW, lh);
    // the headline: its own size, re-broken at its own width, never more than two lines at its full size
    let size = headline.size;
    let S = placeWords(tokens, size, headline.maxW, lh);
    while (S.blockH > headline.size * lh * 2.05 && size > headline.size * 0.7) {
      size *= 0.92;
      S = placeWords(tokens, size, headline.maxW, lh);
    }
    return { B, S, k: size / big, ready };
  }, [text, accentKey, big, layout, headline, ready]);

  const bigC = { x: layout.W / 2, y: view.y + view.h * 0.46 };
  const smallC = { x: headline.cx, y: headline.cy };
  const scale = plan ? 1 + (plan.k - 1) * move : 1;

  // a same-surface handoff would cut the headline off mid-air, so it leaves first
  const leaves = (ctx.handoff.out === "camera-same" || ctx.handoff.out === "carry" || ctx.handoff.out === "end") && props.keepHeadline !== true;
  const out = leaves ? ramp(f, ctx.dur - DUR.panel - 2, ctx.dur - 2) : 0;

  return (
    <>
      {surface && cam ? <SurfaceView surface={surface} brand={brand} layout={layout} cam={cam} dim={dim} /> : null}
      {text && plan ? (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - out, fontFamily: ZODIAK.family, fontWeight: ZODIAK.weight, fontSize: big,
          lineHeight: lh, letterSpacing: `${TRACK}em`, color: brand.color.ink,
          textShadow: `0 ${4 * u}px ${40 * u}px rgba(0,0,0,${(0.55 * (1 - move * 0.5)).toFixed(3)})` }}>
          {plan.B.placed.map((w, i) => {
            const s = plan.S.placed[i];
            const x = bigC.x + w.x + (smallC.x + s.x - (bigC.x + w.x)) * move;
            const y = bigC.y + w.y + (smallC.y + s.y - (bigC.y + w.y)) * move;
            const p = ramp(f, at + i * 3, at + i * 3 + 14, CURVE.quiet.enter);
            return (
              <span key={i} style={{ position: "absolute", left: 0, top: 0, whiteSpace: "nowrap", transformOrigin: "0 0", opacity: p,
                transform: `translate(${x.toFixed(2)}px, ${(y + (1 - p) * 0.28 * big).toFixed(2)}px) scale(${scale.toFixed(4)})`,
                filter: p < 0.999 ? `blur(${((1 - p) * 16).toFixed(2)}px)` : undefined,
                ...(w.accent ? { fontStyle: "italic", fontWeight: 400, color: brand.color.accent } : null) }}>{w.text}</span>
            );
          })}
        </div>
      ) : null}
    </>
  );
};
