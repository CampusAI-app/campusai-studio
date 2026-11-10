# Lane: product films

The real product on screen, captured and turned into a film. Most CampusAI work lives here.

## Capturing the real product
- **Scripted page runs (the default now):** Playwright headless with the real Chrome binary
  against campusai-demo, written as `Content/video-studio/capture/<film>-run.cjs` writing to
  `studio/public/<film>/` plus a `take.json` of timings. `capture/howto-run.cjs` is the newest
  pattern; `capture/shelf-jobmatch.cjs` is the stills pattern. Scrub em dashes on capture,
  close first-visit popups, check Sandy Spring is absent.
- **A flow written as steps:** `npm run flow <film>` reads `films/<film>/flow.json` (press, type,
  scroll, go, wait) and records it from campusai-demo the same slow-motion way; play it with the
  kit's `FlowRecording`. The team's way to capture, and enough for most single-path runs.
- **Jacob recording:** Cap in Studio mode with every beautify option off, dropped in
  `studio/public/footage/`. Only when a run cannot be scripted.
- **Read the product's source, not a screenshot**, when drawing any product surface: strings
  verbatim from the component, colours from its own tokens. Every divergence is then deliberate.

## Building it
- **Take shots, do not write them.** Copy a shot from `Content/video-studio/shots/demos/` into
  `studio/src/shots/<name>/` with the `_fixtures/` it imports, swap in the real capture, the
  venture's brand from `kit/brand.ts`, and our copy. Ported shots so far live in
  `studio/src/shots/` (each with a `preview.tsx`); take from there before porting again.
- **Parts come from the kit** (`studio/src/kit/index.ts`): camera, cursor, logo moments, cards,
  type lines, device. A film that needs a part the kit lacks builds it IN the kit, then imports it.
- **One film, one folder** in `studio/src/<film>/`, registered in `Root.tsx`.
- **Every format from one set of scenes:** scenes take a small layout value (portrait or not, a
  font scale, a padding) so 16:9, 4:5 and 9:16 are three compositions of the same scenes.
  Portrait stacks what landscape puts side by side, scales type up, narrows padding.
- **Timing with transitions:** in a `TransitionSeries` total frames = sum of scene frames minus
  (number of transitions x transition frames). Compute it, never guess.
- **Device:** frameless, or `studio/src/four/real-laptop.tsx`. Never fake browser chrome.

## References before the shot list
Pick 3 to 5 and name them in `brief.md`. Start with the Studio page's launch films (What Ships),
then What Ships itself: its full catalogue with view counts is one public JSON
(`directory-index.json`); filter by category and keyword, sort by views, and sheet an opening at
0.3, 1 and 2 seconds to steal timing, never footage. Motion numbers come from Raylight's beat
sheets (`Lucius/memory/motion-raylight-templates.md`).

**Openings that work:** a cursor already moving toward a real, pressable control in frame one;
one real component scaled to fill the frame before pulling back to the full page; a notification
on a real phone as the hook; the feature name as the real UI chip inside the headline sentence;
capabilities as pills stacking under one phrase.

**Story shapes that work:**
- The question answered by the number: open on the problem as a question, close on the number.
- Problem, silence, turn: the frustration, a hard cut to a beat of black, then the product solves
  the exact thing shown. The silence is a cut, never a fade.
- The UI pulled apart into single cards, every press showing where its result lands.
- The pop-out, when the film highlights one specific thing.
- **The meeting nobody needs** (2026-11-04, Echo's monday.com launch spot, learned through Muse; Jacob:
  "a great video, learn from it and apply"). One before/after argument in about a minute. The
  before is the pain in the customer's own words, quoted as they would say it ("Same as last
  week." "Almost there." "Waiting on review."). The turn is one line naming the product. Then
  exactly three named capabilities, each with one plain verb (read every task, flag what is stuck,
  push it forward). The proof is countable and shown moving (3 trends found, statuses flipping to
  Done), never claimed. It closes on ONE real UI gesture that lands the point (a toggle flipping the
  status meeting to Cancelled), then the logo. For CampusAI the pain lines come from real students
  (survey answers, walk-ups), every count from `facts.md`, and the gesture is a real control in the
  demo. Seen once through Muse, not frame by frame, so its timings are feel, not numbers.
- **The NestPay hand-offs** (2026-11-10, Jimmy's 21 s NestPay launch film, @thejimmy.vision, learned
  through Muse; Jacob: "It's more about the transition and how it moves it"). Stepped frame by frame.
  The lesson is how each beat hands to the next, never a cut to a fresh layout. One object carries the
  eye per hand-off, exits speed up, entrances slow down, and fast moves carry motion blur.
  1. Line to product. The product rises from below the frame tipped back about 50 degrees and
     straightens as it climbs (0.7 s, ease-out), passing up through the line, which leaves the moment
     the product crosses it. Then a 0.3 s drift, never a dead hold.
  2. Push through. A fast push-in (about 0.4 s, 1.5x) until the screen content is the frame, then a
     glide along the one list or row that matters (0.8 s, blurred while it moves).
  3. Turn away into the dark. The surface swings on its vertical axis and drifts right while it blurs
     and goes black (0.4 s), then about 0.1 s of near black before the next line.
  4. Words. Each word fades in left to right about 0.08 s apart, lit in the accent as it lands.
  5. Line to logo. The line shrinks toward the centre and vanishes (0.2 s), and the logo opens from that
     same point (0.25 s), holds 0.5 s, then completes.
  6. Scale hand-off across a hard cut. The logo shrinks about 15% (0.2 s), hard cut, and the next object
     arrives about 1.5x and blurred and settles to size in 0.25 s. The only hard cut in the film.
  7. Tip over. The object tips back on its bottom edge and falls out the bottom (about 0.9 s,
     accelerating) while the next one rises behind it from about 0.85x (decelerating).
  8. Spin in. The next object enters from the frame edge showing its back and turns about 180 degrees
     on its vertical axis on the way to the centre (0.6 s).
  9. Accumulation. The number rolls up digit by digit (about 2.4 s) while the pieces it counts fade in
     around the object, one side then the other, about 0.35 s apart.
  10. Sink and rhyme. The object sinks out the bottom (0.6 s), 0.15 s of empty ground, and the logo
     builds exactly as it did the first time.
  For CampusAI: the product is a real capture lifted as one panel (the week, a dialog, a card), every
  count comes from `facts.md`, and our reading-time rule still wins over the reel's short holds (its
  lines sat about 0.4 s). Worked example `src/launch-transitions/` (`LaunchTransitions-16x9`, its own
  entry file), which uses hand-offs 1 to 7, 9 and 10.

**Film styles to borrow motion from** (Studio page, "Film styles"): Dark Tech Keynote for
CampusAI launches (its grammar only: one accent for what the product does, transitions only as
UI expanding or collapsing, numbers resolving from noise), Swiss Motion for FigBlossom, Data
Storytelling for numbers, One-line Drawing for Fig. A style is its rules, not its palette.

## Sound
Licensed tracks and 144 effects in `shots/audio/`. Cut to the beat with
`shots/method/music-beat-sync.md`, and let the song's sections set each shot's energy.
`shots/method/sound-design.md`: a sound on the moments that matter, not every cut; the problem's
sounds scattered, the product's sounds one family, centred; two real silences before the turn.

## Remotion traps (learned on real films)
- ANGLE is OFF (`remotion.config.ts`): it dropped whole layers out of frames after layout
  changes. Turn it on for one composition only if GL transitions are truly needed, then check
  every frame of every beat whose layout changes.
- Avoid compositing triggers in any beat that animates layout: `transform: scale()`, `zoom`, and
  `overflow: hidden` with `border-radius` each cost frames. A push-in on layout is a resize.
- Reserve a fixed height on any line being typed so arriving text never reflows its block.
- When a visual bug moves to a different element each fix, the variable is the renderer, not the CSS.
