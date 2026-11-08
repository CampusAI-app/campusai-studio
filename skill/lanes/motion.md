# Lane: motion

No footage: kinetic type, logo builds, stat reveals, animated backgrounds, loops. Built in the
same studio, from the same kit, with the same rules.

## Where the pieces are
- **Names:** `Design/motion-vocabulary.md` Part 4. The families that matter here: Typography
  (112), Shape and vector (84), Broadcast and data (111, including 37 chart moves), Principles and
  timing (101). Look a move up from plain words with the one-liner in Part 4, and write its
  definition beside it in the shot list.
- **Exact keyframes:** Animista in Part 1 (662, all at `Design/parts-bin/animista/`), shrunk from
  landing-page distances to ours.
- **Shots with code:** `shots/` categories Opening and Brand, Typography, Data. Kit parts:
  `TypeLine`, `BlurLines`, `Odometer`, `NumberWheel`, `PatternField`, the logo moments.
- **Measured motion:** Raylight's title_text and logo_brand beat sheets
  (`Lucius/memory/motion-raylight-templates.md`).
- **Style:** Data Storytelling for numbers; Swiss Motion for type-led pieces.

## How it differs from a product film
- There is no product to show, so the carrier object matters more: one shape or word every
  scene is made of, so nothing just cuts.
- Numbers on screen are still facts: every stat comes from `facts.md`.
- **Loops are the default here when the piece has no ending to land:** the last frame hands
  back to the first, checked by sheeting frame 0 beside the final frame. A piece that ends on
  the logo plays once and holds instead.
- Backgrounds stay calm: they sit behind everything, so slow drift, low contrast, nothing that
  competes with type.

## Named styles, one prompt each (2026-11-01)
Say the style and one subject: `/teardown the planner`, `/map-route Stamp to Iribe`. Our own build of
the names in Shaan Johari's reel; his prompts are gated and were never seen. **The style is the
structure, so a named style skips the idea and structure pitch.** It never skips the facts: every word
and number still goes in `films/<name>/facts.md` with its source, and if a source is missing, stop and
ask for it. Everything else in `SKILL.md` applies. All eight are vertical today. Feed and wide are not built.

To make one:
1. Copy the style's example from `src/styles/examples.ts` into `films/<name>/style.json`, change only
   the subject, and write `facts.md`. Each piece has its own folder, so nothing in `src/styles/` changes.
2. Render: `npx remotion render src/styles/entry.ts Style-<Name> out/<name>.mp4 --props=../films/<name>/style.json`
3. Run the review loop on the finished video, then deliver by the naming rule.

| Say | What it shows | What it needs | Keep it honest |
|---|---|---|---|
| `/teardown` | A real page comes apart into labelled plates, then closes | A capture from `public/pass/` with its `.json` boxes, and 3 or 4 sections | Labels are the page's own headings. Never rebuild the UI |
| `/paper-desk` | Real pages as printed sheets on a dark desk, one comes forward, a red pen circles the point | 3 captures and one thing to circle | Sheets are real captures. The circle marks something already on the page |
| `/headline` | A front page: headline stamps, camera pulls back, columns fill in | One true story, its source, one capture for the photo | The masthead is Campus Pulse, never an invented or real paper. Web has no Pulse yet, so never claim it |
| `/stat-chart` | One number grows while its line draws | A true series with a source | The pen drives the number. A line, never rising bars. Label what was actually counted |
| `/map-route` | Real buildings rise, the route draws, minutes count | `python3 scripts/map-route.py <name> "<from lat,lng>" "<to lat,lng>"` first, which bakes `public/styles/<name>.json` | OpenStreetMap credit stays on screen. Never present it as the product's map page, which is not working on the demo. Heights are estimated |
| `/ink-wash` | Red sun, ink mountains, then the title | A title of a few words | A title card, one thought. Drawn in code, on paper |
| `/pov-doodle` | A hand-drawn student, a POV line, sticky notes piling up while their face gets worse, then one line clears the pile | A POV line, 3 to 5 things that pile up, a payoff line | Each note is a real thing a student checks. The payoff names CampusAI but never draws its screens (real product only comes from captures). The person is Open Peeps (CC0) in `src/styles/peeps/`, so add a face or pose from CeamKrier/react-peeps there, never draw a new person by hand |
| `/flat-cartoon` | A flat lecture hall fills or empties as a true number moves, one person per N | A true series with a source, and what one person stands for | Every person is round(value / N) and the legend says N. The number never counts up from zero. Three flat brand colours, no outlines |
| `/paper-cutout` | A cut-paper storybook: a small student walks while hills, buildings and trees pop up and slide past in layers, the light going from afternoon to night, and the payoff lands at a lit window | 3 to 5 story beats (what pops up, its time of day, a caption), a payoff line with one red word, a smaller line under it | Every caption is a true thing from `facts.md`. The payoff names CampusAI but never draws its screens. The student is flat cut-paper shapes drawn in code, never a detailed person. One accent, the red backpack and the payoff word |
| `/chalkboard` | One academic idea at the board: a title, a formula, two cases side by side, a note, then the line naming CampusAI, all chalk writing itself on with dust | A title, a one-line framing, a formula (left side and a fraction), two cases (a big letter and a line or two each), a note, a payoff | Every line is a rule from a real source (the catalog, gened.umd.edu), quoted in `facts.md`. Chalk white plus ONE red chalk circle on the case that is the point. Headline and payoff in Zodiak, board work in Caveat |
| `/blueprint` | A plan drawn as an architect's elevation: one floor per year, one room per term, each dimensioned in credits, the camera riding up as it draws, then a pull back to a red overall dimension and a title block | Floors (label, two rooms, the room dimension), the overall height and width, title-block notes with their sources, a payoff | Never monospace or caps lettering, even though real blueprints use it: Zodiak, Inter, Caveat. The red overall dimension is the one accent. A dimension that is arithmetic says so in the notes |
| `/comic` | A student gag as a one-page comic: four panels ink on in reading order, Ben-Day dot shading, balloons pop, one red sound effect on a burst | A title, an opening caption and line, 3 or 4 things that pile up, a worse line, a short effect word, a payoff line | Every label that names a real thing is in `facts.md`. The payoff names CampusAI but never draws its screens. The cast is Open Peeps from `src/styles/peeps/`, never drawn by hand. The effect word is sentence case |

**Paper cutout (2026-11-05, from the Nov 5 Muse send of Tobi's (@tobiadonadon_) cartoon story reels; his flat paper-cutout look is the one we can draw in code).** Fixed paper grain and torn edges with a drop shadow under every layer, no boil, so it never reads as /pov-doodle.

**Chalkboard, blueprint, comic halftone (2026-11-05, from the Nov 5 Muse send "10 Claude animation styles", one scene in ten looks; its prompts were gated and never seen, so these are our own build of three of the names that fit students).** Grounds the brand has no colour for (the board's green-black, the paper's blue) are named constants in their own files; every mark on them is brand ink and the one red. Samples: `films/chalkboard-w-not-f/`, `films/blueprint-four-years/`, `films/comic-gen-eds/`.

**The cartoon pair (2026-11-04, Jacob through Muse: "cartoon graphics and animations to make reels for CampusAI").**
Both from Shaan Johari's Animation Styles Part 5 (names only, prompts DM-gated). The doodle look is one SVG
"boil" filter whose noise reseeds every 4 frames over the whole drawing, which is what reads as hand-animated.
Handwriting is Caveat (Google Fonts) for notes and tallies only; headlines stay Zodiak. Paper ground, so
they sit beside /ink-wash and /paper-desk, not the near-black films. What a recurring cartoon cast would still
need is a decision, not code: one named character we always use (a CampusAI student), drawn from Open Peeps
pieces so anyone on the team can pose them.

## Generated images, for looks code cannot draw (2026-11-05)
From the Nov 5 Muse sends (Tobi's soft 3D and painterly reels; the CGI, cinematic, toy brick and PS2 looks in "10 Claude
animation styles"). Jacob: Gemini is for when it helps, not every video. Doodle, paper, chalk, ink and flat looks stay in code.
- **How (Jacob's Mac only, agy is signed in there):** `films/cartoon-test/gen.sh <out.jpg> "<scene>" [reference.jpg ...]`.
  It runs the Antigravity CLI in print mode with no permission flags: its image tool needs no approval and saves into
  agy's own folder, and the script copies the file out. Never ask agy to save a file itself, and never use
  `--dangerously-skip-permissions`. 35 to 100 s an image, 768 x 1376 for 9:16, so keep camera moves gentle.
- **One character across scenes:** pass an earlier image as the reference. Tested: same face, hair, clothes and style.
- **Illustration only.** Never generate product UI and never generate text: every prompt says no text, letters,
  numbers, logos or screens with writing (the script adds it), and all type is drawn in code. Ask for empty space
  where the type will sit, as part of the room, or the model pastes a flat band. Look at every image before using it.
- **Putting the real product in the scene:** generate the laptop with a blank screen flat to the camera and nothing
  in front of it, measure the screen, and play a real recording (`npm run flow` or `npm run chat`) inside it. Stay
  on the computer: Jacob rejected zooming into the page until it fills the reel ("it's trying to force it to fit
  within the reel format"). To make one part readable, lift that real piece out of the screen toward the camera.
- Worked example: `films/cartoon-delusional/` (`CartoonDelusional-9x16`, `src/cartoon/`): the job card's skills row
  lifts out of a cartoon laptop, then Learn a skill. In Base's video backlog, not finished.

## Reference: Island "for Agents" by adiiguu (2026-11-03, Jacob: "I love the animations and the noises")
Five-slide carousel (instagram.com/p/DfMPoqACmI3), learned through Muse. Not seen frame by frame
here, so treat timings as feel, not measured numbers. What to take, and the part we already own for each:
- **One system, not five clips.** One ground (warm cream), one type pair (black sans, ONE accent word in
  italic serif for the new thing), one cast (named cursors), one signature move. Every scene is built
  from those, so nothing just cuts. For CampusAI the ground stays our near-black and red; take the
  discipline, not the beige.
- **Tempo alternates across the piece:** fast blurred open, calm data beat, smooth product beat, slow
  type beat, fast close. Never two slow or two fast beats in a row. Write the tempo next to each beat
  in the shot list.
- **Rack focus is the signature:** only one line or tag is sharp at a time and the focus walks down a
  list ("Same visibility. / policy enforcement. / audit trail."). Ours: `BlurLines`, and the shots
  `vertical-word-roll-blur-cycle`, `avatar-bracket-carousel`, `picker-carousel-feature-cycle`.
- **Energy comes from horizontal slides with strong motion blur; product windows land on a soft eased
  stop, never a hard landing.** Ours: `depth-layer-moves`, `scanline-assemble-flyin`, `EASE_CAMERA`.
- **A dashboard feels alive without a scene change:** counters tick up and a ring fills while
  everything else holds. Ours: `Odometer`, `NumberWheel`. Every number still comes from `facts.md`.
- **Named cursors are the cast and carry the story** (humans by name, then one "AI Agent" cursor
  doing the same thing). Ours: `collab-cursor-moves`, `Pointer`. The CampusAI version is a student
  cursor and the assistant doing work side by side in the real product.
- **Logo bubbles drift with slight parallax** behind the beat, frosted, never competing with type.
- **Structure is a demo arc:** what you control today, the same control extended to the new thing,
  parity in three short lines, dark end card with the logo and one line.
- **Sound is the part people praised.** It is voiceover-led with music and effects landing on the
  transitions, not on every UI event. The individual whooshes and clicks could not be heard through
  Instagram, so nothing here says which effect sits where. Apply it as: a sound on each transition
  and each focus change, from `shots/audio/`, chosen by ear in the cut (`shots/method/sound-design.md`).

## Rebuilding a video someone sends, frame for frame (2026-11-04)
When the job is "make ours move like this" from a video file. From HyperFrames' rewritten
`reverse-any-video` skill (heygen-com/hyperframes, Apache-2.0), method only: the skill itself is a paid
HyperFrames Pro feature that signs into HeyGen, sends usage telemetry and re-shoots people with AI, so
none of it is installed or run. Our rebuild is a Remotion composition built from our own kit.
- **Rebuild what we have the right to use.** Steal timing and structure, never footage, and never play
  the original's frame in ours. A logo is the real mark from the brand's own files, never drawn by hand.
- **The original sets the frame:** our composition is its size and frame rate exactly, and its length
  is its frame count, not the music's. Write times as frames, not rounded seconds (a time rounded up
  lands a frame late).
- **Read consecutive frames wherever something changes,** a few either side of each cut, entrance and
  exit. Contact sheets a second apart miss one-to-three-frame timing, which way things enter and leave,
  blurs at cuts and one-frame flashes.
- **Graphics switch on exact frames.** Anything fully there on its first frame is set there, not faded
  in; ease only what you saw move across several frames. A blur, dissolve or wipe at a cut is part of
  the cut and is rebuilt over its measured frames.
- **Size text from its ink, not by eye:** crop the same line from their frame and ours, match the ink
  box height and width, then letter spacing. Try two or three fonts at that size before choosing.
- **Watch every large word through its whole life** (how it arrives, what it does on screen, how it
  leaves) and name what the letters are made of (solid, gradient, outline, glow) before building it.
- **Recipes that hold up frame by frame:** a fill sweeping across a word is two copies with the lit
  one's `clip-path: inset(0 100% 0 0)` driven to `inset(0)`; motion blur along a fast move is an SVG
  `feGaussianBlur` with a one-axis `stdDeviation` (`"24 0"`), because CSS `blur()` smears both ways;
  a ghost trail is two to four copies behind at about 0.5, 0.3 and 0.15 opacity; grain is a seeded
  `feTurbulence` reseeded per frame.
- **Check it the reanimate way** (full method on Jacob's Mac in `Lucius/memory/motion-library.md`, "Rebuilding motion from a
  reference"): film ours the same way as theirs, fix the biggest gap, stop at five rounds, never
  loosen a bar. Start, end and length within 80 ms is the pass mark.
