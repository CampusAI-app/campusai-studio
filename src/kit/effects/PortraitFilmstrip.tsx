/**
 * PortraitFilmstrip (2026-11-24, from Gur's Waze brand film "The Living Map", Muse pass): people as flat-colour portrait
 * cards on one strip that slides right to left without stopping, each card a real person cut out onto its own flat
 * colour, a small chip bottom left, and a giant word whose letters pass behind the cards at a slower speed, cropped by
 * the frame. Built for post-living-campus (src/trials/post-living-campus.tsx), where the chips carry each student's own
 * words from the footage catalog.
 *
 *   <PortraitFilmstrip cards={[{ src: "film/people/a.png", color: "#F26B5B", chip: "Finding contacts to network with." }]}
 *     speed={13} word="Terps" font={figtree} />
 *
 * Frame 0 is the frame the strip starts; wrap it in a Sequence. `startX` is where the first card's left edge sits on
 * frame 0 (negative starts the strip already full, the way the reference opens). Cards repeat when the strip runs out.
 * Portraits are PNG cutouts (transparent ground) drawn bottom aligned; a plain photo also works (object-fit cover).
 */
import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export type FilmstripCard = {
  /** Path under public/ to the portrait (a cutout PNG reads best). */
  src: string;
  /** The card's flat colour. */
  color: string;
  /** The chip bottom left. Keep it the person's own words or name; never invented. */
  chip?: string;
  /** Scale and nudge of the portrait inside the card (1 = fills the card height). */
  zoom?: number;
  dx?: number;
};

export type PortraitFilmstripProps = {
  cards: FilmstripCard[];
  /** px per frame, leftwards. The reference moves about one card per 0.6 s; 12 to 16 leaves chips readable. */
  speed?: number;
  startX?: number;
  cardW?: number;
  cardH?: number;
  gap?: number;
  radius?: number;
  /** Vertical centre of the strip. Default: the middle of the frame. */
  cy?: number;
  /** The giant word behind the cards, and its look. */
  word?: string;
  wordColor?: string;
  wordSize?: number;
  /** The word's speed as a share of the strip's (parallax). 0.55 by default. */
  wordSpeed?: number;
  wordStartX?: number;
  font: string;
  chipFont?: string;
  chipSize?: number;
  /** Frames the strip takes to slide up into place at the start (0 = already there). */
  enter?: number;
  /** Draw only these card indices on top of the word (others go behind it), for the in-and-out weave. Default all on top. */
  frontOf?: (i: number) => boolean;
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const PortraitFilmstrip: React.FC<PortraitFilmstripProps> = ({
  cards, speed = 13, startX = 0, cardW = 400, cardH = 500, gap = 34, radius = 22, cy, word, wordColor = "#141012",
  wordSize = 760, wordSpeed = 0.55, wordStartX, font, chipFont, chipSize = 25, enter = 0, frontOf,
}) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const mid = cy ?? height / 2;
  const pitch = cardW + gap;
  const shift = f * speed;
  const lift = enter > 0 ? interpolate(f, [0, enter], [1, 0], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) }) : 0;
  // which card slots are on screen this frame
  const first = Math.floor((shift - startX - cardW) / pitch);
  const last = Math.ceil((shift - startX + width) / pitch);
  const slots: number[] = [];
  for (let s = Math.max(0, first); s <= last; s++) slots.push(s);

  const card = (s: number) => {
    const c = cards[s % cards.length];
    const x = startX + s * pitch - shift;
    const top = mid - cardH / 2 + lift * (height * 0.6 + (s % 3) * 60);
    return (
      <div key={s} style={{ position: "absolute", left: x, top, width: cardW, height: cardH, borderRadius: radius, overflow: "hidden", background: c.color }}>
        <Img src={staticFile(c.src)} style={{
          position: "absolute", bottom: 0, left: "50%", height: `${(c.zoom ?? 1) * 100}%`, maxWidth: "none",
          transform: `translateX(calc(-50% + ${c.dx ?? 0}px))`,
        }} />
        {c.chip ? (
          <div style={{
            position: "absolute", left: 18, bottom: 18, maxWidth: cardW - 36, padding: "10px 16px", borderRadius: 18,
            background: "rgba(255,255,255,0.96)", color: "#141012", fontFamily: chipFont ?? font, fontWeight: 600, fontSize: chipSize,
            lineHeight: 1.18, boxShadow: "0 6px 18px rgba(20,16,18,0.16)",
          }}>{c.chip}</div>
        ) : null}
      </div>
    );
  };

  const wordX = (wordStartX ?? width * 0.15) - shift * wordSpeed;
  const wordEl = word ? (
    <div style={{
      position: "absolute", left: wordX, top: mid - wordSize * 0.62, fontFamily: font, fontWeight: 900, fontSize: wordSize,
      lineHeight: 1, letterSpacing: -wordSize * 0.03, color: wordColor, whiteSpace: "nowrap",
    }}>{word}</div>
  ) : null;

  const front = frontOf ?? (() => true);
  return (
    <>
      {slots.filter((s) => !front(s)).map(card)}
      {wordEl}
      {slots.filter((s) => front(s)).map(card)}
    </>
  );
};
