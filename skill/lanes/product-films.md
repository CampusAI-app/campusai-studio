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
