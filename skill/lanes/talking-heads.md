# Lane: talking heads

A person speaking to camera (Jacob, a founder, a student). Everything in `editing.md` applies;
this adds the face and the effects.

## The face
- State a **face-safe zone** in the brief: where the face lives and where captions and effects
  may go. Nothing ever crosses the face.
- Captions word-lit by the editing lane's rules, never ahead of the voice.
- Punch-ins on a person are cuts between two framings of the same take, not zooms that crawl.

## The effects (Jacob, 2026-10-22: build them when the first talking-head film arrives)
The list, what each looks like, and what we already own is `Design/motion-vocabulary.md` Part 3
(from Corbin Sylk's Effect of the Day). The missing ones sit on the Elevation Run want-list
(`Lucius/packages/elevations/wants.md`). The first talking-head film is the moment to build the
ones it needs, **into the kit** (`studio/src/kit/`), so the second film just imports them.

What we own today: the 3D card ring (`carousel-3d`), slot-machine rolls
(`pill-chip-slot-cycle-handled`), a before/after slider, push-in and pass-through camera moves.
Missing: the match cut onto a lit word, the liquid-glass graph, the close-up monitor look, the
A vs B jump, the shutter strike.

## Effects from @mrcreates.ai (2026-11-10)
From his reel "17 effects. Zero editing." (instagram.com/reel/DfgiBYTIUmV), stepped frame by frame; his prompts are
DM-gated and were never seen. We owned 7 of the 17. These four need no person and are built **in the kit**
(`import { Checklist, GlassType, CoverStory, UIWorld } from "../kit"`, source `src/kit/effects/`), each its own look,
each taking its content as props and real captures only. Samples render from `src/kit/effects/entry.ts`
(`Effect-<Name>`), facts in `films/effects-mrcreates/facts.md`.
- **Checklist** (`Checklist`): a numbered list on screen the whole time, the current item boxed and bold, done ones
  ticked, the rest grey; one card below plays the item, a 02/04 counter in its corner, the name in a pill on its bottom
  edge. Reel: 17 items in 19.5 s (0.95 to 1.45 s each), hard cuts, the box snaps a row and widens over 3 frames, the
  pill pops from 60%, the card blurs out over 3 frames first. Ours holds each item for the reading rule. Blush grid
  paper, Plus Jakarta Sans and a Newsreader italic. Vertical.
- **Glass type** (`GlassType`): a hard cut to a loud gradient (ours crimson to pink with a warm sun), then a frosted
  panel with one huge outlined word sharpens in 4 frames after the cut (0.13 s), BEHIND a real capture that covers the
  bottom of the letters; 3 frame blur-out; the ending shrinks the glass to a tile holding the logo. Frost is a blurred
  copy of the ground clipped to the panel (renders headless; no `backdrop-filter`). Outfit. Any shape, sample square.
- **Cover story** (`CoverStory`): a cream page with the subject already on it; a red Didone masthead drops from above
  the frame in 3 to 4 frames behind the subject, then the issue line (+0.25 s), a big red number (+0.35 s), a black
  label box out of a blur (+0.55 s), a barcode (+0.65 s); the ending puts the logo where the masthead was. Bodoni Moda,
  Hanken Grotesk. Sample 4:5.
- **UI world** (`UIWorld`): the subject fills the frame about 0.15 s, a hard ease-out pull-back (8 frames) reveals it
  inside the interface, and real CampusAI pieces build around it one at a time, each out of a blur in 5 frames, 7
  frames apart; one can change state on screen (`swap`: a before and after capture). The reel's interface is flat; ours
  sits the pieces at depth in real CSS 3D with a slow orbit, on deep oxblood, Geist. Ends by pushing through the
  phrase into the logo. Sample wide.

The six that need a person are built too (2026-11-10), in the kit (`import { Orbit, CouchWall, FrameBreak,
GreenScreen, DigitalZoom, Vertigo } from "../kit"`). Each takes the person's `clip` and their cutout `person` (a VP9
alpha webm, made with MediaPipe; the editing lane says how) and is framed so the cutout's bottom edge stays off
frame. They were tested on Connyct footage that stays on Jacob's Mac, so there is no sample in the repo.
- **Orbit** (`Orbit`): three small tiles travel a dashed ring around the chest, behind the person on the far side and
  in front on the near side, full frame. Pick the start angle (`phase`) so no tile changes sides over their body.
- **Couch wall** (`CouchWall`): the background wipes to a warm wall, a couch back slides up behind them, then framed
  pictures pop on one at a time, 4 frames apart, each a few degrees off level.
- **Frame break** (`FrameBreak`): they sit in a card that insets while they stay the same size, so a gesture breaks
  the card's edge; small chevrons mark where.
- **Green screen** (`GreenScreen`): a snap to flat chroma green, then a diagonal wipe to the new background, blurred
  and darkened a little, with a soft light wrap.
- **Digital zoom** (`DigitalZoom`): a phone camera's interface (corner brackets, red dot, a yellow focus square that
  locks on the face, a 1.5x / 1.6x / 2.3x readout in Inter) while the shot punches in on the words that matter. Best
  on a wide shot.
- **Vertigo** (`Vertigo`): the background becomes a thin blue line corridor that stretches while the person holds the
  same size, landing on the line that matters.

## When the product appears beside the person
It follows the product-films lane: real capture only, frameless or the real device, captions
still below the product.
