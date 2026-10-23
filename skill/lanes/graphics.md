# Lane: graphics

Still images built from the same parts as the films: feed images, hero stills, thumbnails,
carousel frames, posters for a film. Not the writing of a social post: `content-engine` owns what
a post says; this lane owns how its images look, and is CampusAI's renderer for content-engine.

## Start from a starter (2026-10-23)
Four starters live in `studio/src/graphics/Starters.tsx`, rendered with
`npx remotion still src/graphics/entry.ts <Id> out/graphics/<name>.png`, all 4:5 on real captures:
- `Graphic-Feed` (Graphic 1): a real screen with one line above it.
- `Graphic-Stat` (Graphic 2): one true number, what it means, and the real page section it comes from.
- `Graphic-Slide` (Graphic 3): one carousel slide; props `n`, `of`, `step`. Change the crop per slide.
- `Graphic-Poster` (Graphic 4): a film's strongest frame with its title and the logo.
Copy the one you need into the piece's own folder and change the words, the crop and the source
frame there. The example words are true of the demo today; a posted graphic's words come from its
own `facts.md`. Crop a page with the kit camera (`cam` = centre and visible width in page px) and
the capture's `.json` layer boxes. Tall captures only paint a panel's first screen: for a section
lower on a page, use a run frame scrolled to it (as the stat card does).

## How a still is made
- A still is a Remotion composition rendered to one PNG with `npm run still <CompositionId>`
  (or `node scripts/still.mjs <Id> <out.png> --frame N`). One frame, no render.
- `studio/src/HeroStill.tsx` is the worked example (`HeroStill-4x5`, `-9x16`, `-16x9`): a real
  capture on a tilted device, one light source, the featured row lifted off the screen. Read its
  header before building a device still: real perspective, not a skew, and lift by scale plus
  shadow, never `translateZ` inside a clipped screen.
- A film's poster is its strongest frame, taken with `--frame N` from the film's own composition.
  Never a separately designed screen.
- A carousel is several compositions (or one with a `slide` prop) sharing one set of parts, so
  every slide carries the same type, colour and margins.

## Sizes
Feed 4:5 (1080x1350), square 1:1 (1080x1080), story 9:16 (1080x1920), wide 16:9 (1920x1080).
One set of parts and a small layout value per size, the same way films make formats.

## Rules
Everything in the Studio rules applies: real product only, colours and fonts from
`kit/brand.ts`, no monospace, no em dashes, the logo on every image, nothing invented. Text on a
still still has to read at phone size: check the PNG at 375 px wide before sending.

## Deliver
PNG to `~/Desktop/Motion/<Mon D> videos/` named by what it shows, format in words, date at the
end, the same as films.
