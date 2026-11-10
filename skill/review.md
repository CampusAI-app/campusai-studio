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

## Video or slideshow (run on the sheet before the critic sees it)

A film that is really a slide deck reads as AI-made at a glance. Check the sheet and the code,
not the feeling. Fail one and rework it before anyone sees it.

1. **Scenes change because something moves.** The camera moves, pushes through, whips, or an
   object carries the eye into the next beat. Three or more beats that swap by fading one layer
   out and the next in is a deck.
2. **One thing carries through.** One subject, or one world the camera travels, stays across beats.
   A new picture plus a new sentence every beat is a slideshow even if the camera drifts.
3. **Two levels of text at most per beat.** One big line or number plus one label. A kicker, a title
   and a body line is a slide. Text that is part of the real product screen does not count.
4. **No headline slot.** Two beats in a row never put their line at the same size, in the same
   place, arriving the same way.
5. **Nothing tiny.** If the product sits so small that its own text is unreadable on a phone for
   more than a beat, the camera is too far back. Go in to the part that is talking.
6. **Every second moves.** A hold is fine while something on screen acts; a held frame where only
   the cursor drifts is a stall. Stretches of 3 s with no real change are a defect. The check by
   number, from the studio: `DYLD_LIBRARY_PATH=node_modules/@remotion/compositor-darwin-arm64
   node_modules/@remotion/compositor-darwin-arm64/ffmpeg -i <video> -vf freezedetect=n=0.003:d=3
   -map 0:v:0 -f null - 2>&1 | grep freeze` (a cursor counts as change here, so look too).
7. **Not the template skeleton.** Hook, then feature, feature, feature, then promise, logo and
   call to action, with three feature tiles in a row, is the default every tool produces. Two of
   those without a reason in the concept means pick a different spine.
8. **On time with the words.** Where there is a voice or captions, the thing a line names appears
   no more than 3 frames after the line starts and no more than 6 before. Check four frames per
   line: 6 before, on, 3 after, 8 after. Every line gets some change on screen.

2026-11-10, Muse send (seven Claude video repos). Checks 1 to 5 and 7 are from Bang Motion's
anti-slideshow rules (bangtutorial/bang-motion, MIT, read in place). Check 8 and the 3 s stall
are technique from Anything2Explainer's QC protocol (PolyForm Noncommercial, so ideas only, in
our own words). First run: `films/daily-brief/reviews/` (three findings).

Verify by number, not by eye: a sheet finds composition problems, not dropped frames. Sample the
real pixel at fixed points across many timestamps before calling a visual bug fixed.

The full checklist this trims, with the audio checks in depth, is
`Content/video-studio/shots/method/final-review.md` (upstream, in Chinese). Reach for it on a
sound-heavy piece.
