# The review loop (every lane, before any full render)

A contact sheet is one image with a labelled frame from every beat. It shows in seconds what
watching a render ten times hides.

1. **Sheet first.** From the source, before any full export:
   `npm run sheet -- --comp <Composition> <out.png> <frames>` from the studio (needs Python's
   Pillow; without it, render each frame with `npx remotion still` and look at them one by one)
   with one frame per beat from `shotlist.md`, plus the middle of every fast transition, plus the
   last frame. Save it to `films/<name>/reviews/`. A graphic gets its still at full size instead.
2. **Judge only what is on the sheet,** never what it was meant to do:
   - text readable at phone size, nothing past the safe area
   - only real product: no invented screen, number or logo
   - type, colour and accent the same in every scene, all from `kit/brand.ts`
   - no frame caught half-way through a transition looking broken
   - a real hook inside the first 0.5 s, and the logo by 2 s
   - the last frame ends on the logo and is strong enough to be the poster
   - house rules: no em dashes, no monospace, captions below the UI, every number true today
3. **The builder never judges its own work.** Hand the sheet, `brief.md` and the references to a
   fresh subagent that saw none of the build, and never tell it what you think you fixed. It
   scores seven things on fixed anchors (style fidelity, concept, motion craft, type and design,
   finish, sound and sync, technical; 5 is student work, 6 a template, 7 professional, 8 agency,
   9 award) and returns the three worst defects, each with its frame, what is wrong on the sheet,
   and the local fix, plus whether the three signature moments land. Nothing ships under 7
   anywhere. Fix only those, re-sheet only those frames, repeat until nothing serious is left.
4. **The hardest seconds.** Before the first full render, render only the hardest 2 to 4 seconds
   and look at every frame in a row: a sheet catches composition, only a strip catches a
   one-frame pop.
5. **After the full render,** sheet it again from the video
   (`sheet.mjs <video> <out.png> <seconds>`) for every format, because a 9x16 that rendered is
   not a 9x16 that survived the format. Then listen with eyes closed: every cut and click should
   land on its sound.
6. Write each round to `films/<name>/reviews/` (round, defect, frame, fix, result). Before a new
   piece, read the reviews of the last two, so it starts from what they got wrong.

Verify by number, not by eye: a sheet finds composition problems, not dropped frames. Sample the
real pixel at fixed points across many timestamps before calling a visual bug fixed.

The full checklist this trims, with the audio checks in depth, is
`Content/video-studio/shots/method/final-review.md` (upstream, in Chinese). Reach for it on a
sound-heavy piece.
