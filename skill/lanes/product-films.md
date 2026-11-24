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
- **Desk stage** (2026-11-20, XZE Creative's Notion film, read frame by frame): one locked-off shot of a dark desk,
  the film plays on a big monitor that is the room's only real light, a laptop in front shows the product small and
  soft, a POV line sits above the screen the whole time. On the screen: chaos (the student's pieces drifting) pulled
  into one line, one command, a wipe off that line into the real page building part by part, three words landing over
  their real pages, the words stacked beside the pages, then the logo. Kit part `ScreenStage` (the worked example,
  `PostDeskStage-9x16`, stays local with its captures). A real filmed plate (6 s, tripod, monitor on plain white) beats the code-drawn room.
- **Keynote on a monitor** (2026-11-24, bemx.studio's RunInfra launch film, read frame by frame): the launch deck plays on
  a monitor in a dark room for the whole film, the camera drifting slowly, no voice. White slides, small quiet type built a
  word at a time, ONE phrase per slide in a red `HandleHighlight` box, numbers the only big type, real captures framed by
  the same corner handles, a `PixelDissolve` into red at the open, middle and close, and it ends inside the product (the
  pointer presses a real control) before the logo. Room from `ScreenStage`. Worked example `PostKeynoteMonitor-9x16` stays local.
  Round 2 (Jacob, Nov 24: "It's clearly a screenshot... I like showing the data flowing"): never a flat screenshot on a slide.
  Each product piece is a real card cut out of the demo and played arriving with `LivePart` (frame lands, rows fill in, numbers count).
- **Living map** (2026-11-24, Gur's Waze brand film): how CampusAI works underneath, told with people instead of a
  feature list. Real students from our footage on flat red-family cards in a `PortraitFilmstrip` with their own words, the
  mechanism line as a `ChipSentence` built from real product cards, giant cropped type, confetti dots, two first-person
  proof scenes opening the real product, a red flood to the logo. Worked example `PostLivingCampus-16x9` stays local.
- **Presenter demo** (2026-11-24, Alex Prompter's Cicada demo): one student job done end to end around one laptop, the
  camera moving around it (wide, push in until the screen is the frame, a close-up for the one press), the recurring
  `KaraokeKeyword` captions (`keyStyle="plain"`: Jacob, Nov 24, no box or handles over the key word, and no cartoon host needed), real desktop pages on the 3D laptop with camera hand-offs instead of dissolves, a voice, sound on every move, and a payoff the student can click. Check on
  the demo that the job really runs the way the film says before writing a line. Worked example `PostPresenterDemo-9x16` stays local.
- The pop-out, when the film highlights one specific thing.
- **Word phone** (2026-11-20, DrillUp's "I turned a song into an iPhone" reel, read frame by frame; Jacob: "I love how
  this looks for motion graphics"). The words are never captions: every word of the line lands as a phone's own text as it
  is said (suggestion bar, a search, a notification title and body, a "N more" counter, the Dynamic Island, a black pill that
  grows into an alert card whose button carries the last words), under one camera of whips (about 0.2 s, motion-blurred),
  3D tilts and push-ins, every hand-off on a beat. For CampusAI the phone is the student's own, carrying a real student's
  words from the footage library, and the alert's button pushes through into the real web product; never CampusAI on the
  phone (web only until the app ships). Kit part `WordPhone`; worked example `PostWordPhone-9x16` (local, src/trials/).
- **Pastel launch** (2026-11-20, ClickUp's 3:30 launch film, read frame by frame; Jacob: "basically the exact same layout /
  flow / visuals ... but context of campus AI"). A keynote launch without a stage: a pastel void (magenta top left,
  lavender left, blue or coral bottom right, near white centre), dark product captures floating tilted in it (settled at
  about rotateY -6 to -11 deg, turning about 2.5 deg a second), and kinetic type that builds word by word in small ink
  (about 62 px at 1080p, a word every 0.2 to 0.3 s, arriving grey and settling to ink) with ONE huge gradient word per beat
  (about 4x, fading up from washed out over 0.3 s). Every chapter opens on a black card: logo at 31% height, "A way to
  ___ it." at 50% with the verb in its gradient and underlined, the feature name small at 69%, about 2.6 s, hard cuts
  both ends. Inside a chapter, hard cuts between a wide and a tight crop of the same real screen. For CampusAI the cold
  open is student-first ("Every Terp starts with a QUESTION."), the questions are the product's own Ask chips, and the
  gradient keeps ClickUp's violet start but lands on brand red. Kit parts in `PastelLaunch` (PastelVoid, KineticType,
  FloatingScreen, ChapterCard, GlowPrompt, CaptionPill); the numbers are in `LAUNCH`. Worked example `LaunchFilm-16x9`
  (local, src/trials/).
- **One take** (2026-11-21, Ilias Miah's 22 s Kestrel notifications film, read frame by frame; Jacob: "I love how this
  video looks for motion design"). No cuts at all: the product's screens are planes floating at different depths in a
  pale void, tilted 3 to 5 deg with soft shadows, and one camera travels through them. Open on the whole tableau (a big
  page behind, a second page floating in front and overlapping it); a quick dive to a steep view (about 18 deg, 0.2 to
  0.4 s), a glide that hands focus to the front page by depth (the far page blurs and pales, never a cut); the page
  squares up as the camera arrives; inside it the camera travels down the list instead of the page scrolling; an
  oversized black arrow does one real press with a soft ring, and the result plays in place from the real recording;
  a lateral slide at the same height carries to the next thing; then the pull back to the exact opening frame so it
  loops. Everything eases, nothing teleports. Kit part `OneTake` (planes, camera keys that square to a plane and set
  how big a page px looks, depth of field, softness on whips, the arrow riding its plane, in-place swaps); numbers in
  `ONE_TAKE`. Worked example `PostOneTake-4x5` (local, src/trials/).
- **Explainer anatomy** (2026-11-21, Sultan Mahmud's (@sultanmotions, Sleeko) 44 s "HowDo" explainer breakdown,
  instagram.com/reel/DcLzGYovY9B, read frame by frame; Jacob: "I love this"). Four labelled sections, measured: Intro
  0 to 2.7 s (6%), Problem 2.7 to 13.7 s (25%), Use Case 13.7 to 38.5 s (56%), Call to Action 38.5 to 44.4 s (13%).
  For a 30 to 40 s CampusAI piece that is about 2.5 to 3, 8 to 9, 17 to 20 and 5 to 6 s; our reading-time rule can
  stretch the Intro and the CTA. What each section does for us:
  1. Intro: the hook and the logo together. The real product already on screen and moving, a UMD student naming who
     they are ("Junior at Maryland."), the logo by 2 s. Theirs: the hero device, the wordmark, shapes floating in.
  2. Problem: the student's problem in their own words, no product claims. Word by word kinetic type on the off-white
     (each word out of a blur, about 5 frames apart), one picture of the mess made of real pieces (theirs: a swirl of
     tilted cards round "you just want the solution"), then one punch word opened out letterspaced over a blueprint
     grid that hands into the product (theirs: "Simple" into the logo ring).
  3. Use Case: the real product answering that exact problem, most of the runtime, one continuous camera (One take, or
     the reel's push through a monitor into the page), every press showing where it lands.
  4. Call to Action: one line typed and then corrected (theirs: "Do it" becomes "Make it Done!"), the logo, "Link in bio".
  Sections hand off with a move, never a fade. The breakdown frame (the film in a rounded card over the brand ground,
  four pills whose near-black highlight and red playhead advance with the sections, a tick ruler) is kit part
  `SectionFrame`, for "how we built it" cuts and teaching posts; the post itself goes out without it. Worked examples
  `PostFitExplainer-4x5` and `PostFitExplainerFrame-4x5` (local, src/trials/).
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

**Stageshow's rules worth keeping** (2026-11-18, from Stageshow, Muse send; Benji Taylor's skill, MIT, trialled
and security-passed first). `npm run gate` checks the motion faults; these are the framing and craft calls it can't.
- **Poster = the payoff state**, never a frame mid-change. It is also what a reduced-motion viewer sees. The film still
  ends on the logo; the poster PNG is the answer, the filled week, the number landed.
- **Loops reset with a seen cause or out of view.** Data never rewinds in view: a count, a list or an answer that runs
  backwards to restart reads as a glitch. Cut, cover, or let the last frame hand back to the first.
- **Added layers leave in one reverse stagger,** 40 to 80 ms apart, last in first out, never all at once and never one by one at reading pace.
- **Numbers roll last digit first,** and reserve the width of the final number so the line never re-centres when a digit
  column arrives (the gate caught that on `LaunchTransitions-16x9` at 14.7 s: the line jumps 23 px when 9 becomes 10).
- **A status word changes on its own pill:** the pill holds its place and its word changes inside it; the row around it never re-lays out.
- **Crop to where the story happens.** One gutter, either full bleed or a full gutter, the same on every side that has
  one; nothing the story opens (the window, the answer, the card) cut by the frame edge.
- **A word budget of 3 to 7 real strings** a viewer must read in the whole film, product text included. Over 7, cut words or cut a beat.

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
