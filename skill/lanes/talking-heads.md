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

## Effects from Skill Stack Store (2026-11-15)
From the TikTok "20 Claude Effects in 20 Secs" (tiktok.com/@skill.stack.store/video/7708204558081690911, Muse, Base
1056), stepped frame by frame; it sells a paid skill we never bought or saw, so all 19 are our own builds from the reel.
Facts and timings: `films/effects-skillstack/facts.md`. We already owned two of its 21 (orbit ring is close to `Orbit`,
dolly zoom is `Vertigo`). All are in the kit (`import { PressFont, ... } from "../kit"`), each taking its content as props,
person effects taking `clip` plus the cutout `person` and/or `matte`. Words on screen come from the clip's
`captions.json`, never made up. Tested on footage that stays on Jacob's Mac, so there is no sample in the repo.
Frame takeovers (the page or picture becomes something else):
- **Press font** (`PressFont`, `PressPage`): hard cut to a cream front page, blackletter masthead, serif caps headline,
  italic deck, the live footage printed as a 45 degree halftone. ~1.4 s; the headline settles in 3 frames.
- **Impact frame** (`ImpactFrame`): 2 inverted flash frames, then a posterised two-tone portrait with screentone and
  manga speed lines redrawn every 2 frames, a huge condensed word slamming in at the bottom, shake 18 px settling to 3.
- **Bank note** (`BankNote`): a green engraved note lands in 6 frames, the live portrait as line engraving in the oval,
  a serif number counting up to land on the spoken number.
- **Letter dive** (`LetterDive`): hard cut to cream, a word types on one letter every ~2.4 frames with the footage only
  through the letters, 14 frame push, then a 5 frame dive into one stroke back to the footage.
- **Paper tear** (`PaperTear`): rips any page open as a V in 6 frames with fibre edges, halves gone within 9 more.
- **Layer explode** (`LayerExplode`): punch out to 62%, the frame turns 28 degrees and splits into five glass planes
  (ground, footage, cutout, title, a waveform from the real audio), then snaps flat in 5 frames.
- Shared engine: `InkScreen` (halftone, engraving, threshold; SVG filters, renders headless).
On and around the person:
- **Clone row** (`CloneRow`): darker copies fan out behind him in pairs every 9 frames, a few frames behind his motion.
- **Day dial** (`DayDial`): a cream clock disc rolls in behind him over 16 frames, days in italic, turns on the spoken day.
- **Code body** (`CodeBody`): his silhouette redrawn as code characters in Geist (proportional, centred in a grid; no
  monospace), colours from the footage inside the matte, grid 90 to 14 px in 3 frame steps. Decodes frames itself with
  mediabunny (`frameGrab`) so the render is deterministic.
- **Post wall** (`PostWall`): square tiles drop in row by row, 2 frames a row, then drift up. Tiles are props.
- **Sketch words** (`SketchWords`): background to cream paper, the word's real outline draws itself over 22 frames,
  a second wobbly pass, then a gold swoosh.
- **Head stack** (`HeadStack`): paper tags land beside the head on each phrase, then flick up in 8 frames.
- **Blow away** (`BlowAway`): he breaks into 3 px dust left to right over 30 frames. There is never a clean plate in
  our footage, so it reveals a `ground` prop (b-roll or another shot). Film two seconds of the empty set on the day
  for the reel's exact look.
Overlays and cuts:
- **Live cursor** (`LiveCursor`): a named cursor glides in on a curve, drags a gold selection box round the person,
  handles pop, a size badge lands.
- **Comment drop** (`CommentDrop`): each spoken phrase drops in as a white pill (6 frame fall, spring), words lit as said.
- **Blade slice** (`BladeSlice`): a streak crosses in 3 frames at 25 degrees, the halves shear 100 px along the cut,
  hold 7 frames, heal in 7.
- **Predict keys** (`PredictKeys`): a phone keyboard we draw types the spoken words, the suggestion bar guessing from
  the captions, send on each sentence end.
- **Rack focus** (`RackFocus`): matte-separated focus pulls (room 26 px blur, person 20 px, 14 frames each). Made
  stronger than the reel's, which was too subtle to read on a phone.
- **Voice note** (`VoiceNote`): ours from the name only (the reel shows nothing for it): a chat voice-note bubble with a
  waveform from the clip's real audio, the play head moving with the speech, a transcript lit word by word.

## Vibha Ramprakash's 51 effects (2026-11-18, `studio/effects`)
Her free MIT renderer, now in the studio: `npm run effects -- <effect> clip.mp4 out.mp4 --start 1 --end 4` puts one of
51 face-tracked effects on a real talking-head clip in about 7 s (Python and ffmpeg, no Remotion; first run sets itself
up). `npm run effects -- --list` names them; options and the plan format are in `effects/EFFECTS.md`. Use it to try a
look on real footage, then build the keeper into the kit if it earns it. All 51 plus three looks are on the Studio
site with previews on Aiden's Connyct clips. It fills two gaps named above, the liquid-glass graph and the match cut.
Close to what the kit owns: orbit, checklist, cover-star, locked-on, select-resize, profile-wall.
Pass our own words and numbers to every effect: left out, several show her sample numbers and text (see
`effects/README.md`).

## When the product appears beside the person
It follows the product-films lane: real capture only, frameless or the real device, captions
still below the product.

## A series gets one house look (2026-11-18)
From @eightsenses.media's reel "ALL OF THIS, 4 speakers one skill" (instagram.com/reel/Df5QrYGkgiR, Muse Nov 18): four
people, four moments, and they read as one show because every clip is made of the same materials. So when clips belong
to a series, choose ONE look once, before the first clip, and record it with the film as `films/<series>/look.json`
(a `HouseLook`: palette, caption style, frosted card, italic serif accent, ring colour). Every clip in the series reads
that file and nothing else; effects from the lists above still go on top, but they take their colours and type from it.
A new look is a new series. In the kit: `houseLook("violet" | "ember" | <look.json>)`, `HouseEdit` (one clip in the
look: word-lit captions held as whole phrases, one frosted card landing on a spoken keyword, the serif accent, an
optional ring) and `SpeakerFan` (the reel's opener: the series' clips fanned in 3D under a short title). Only words the
speakers say go in captions and cards. Tested on Connyct footage (two people, four moments), so the sample is private.

## Podcast edit: dot globe, word behind the head, reeded title (2026-11-18)
From @eightsenses.media's reel "PODCAST edited this, not me" (instagram.com/reel/Df447Vfj36j, Muse Nov 18), read frame
by frame; it sells a paid skill we never bought or saw, so these three are our own builds. The reel edits a raw podcast
clip: a whip in, a keyword behind his head, a dot globe forming round it, then a fluted-glass title on his last words.
All three are in the kit (`import { DotGlobe, BehindWord, ReededTitle } from "../kit"`), take their words from the clip's
`captions.json` and render headless. Person effects take `clip`, the cutout `person` and a `frame`; `DotGlobeLayer` and
`BehindWordLayer` are the same parts without the footage, to stack several on one person.
- **Dot globe** (`DotGlobe`): blue dots fly in from seeded points round the frame on a slight curve with short streaks,
  about 1 s in the reel (ours 32 frames, the last dot landing on the cue), and close into a dotted wireframe sphere
  (meridians and parallels) round the head, then it turns slowly (22 degrees a second, axis tipped 16). The far half
  draws behind the cutout, the near half in front; front dots fade to a trace over the `face` ellipse so nothing crosses
  the face. Make the sphere wider than the head so dots change layer beside it.
- **Behind word** (`BehindWord`): a small lowercase lead line (Inter) above one huge condensed word (Barlow Condensed
  800, white to grey) behind the head. The lead line shows 0.35 s early and lights each word as said; the keyword lands
  on its exact first frame out of a blur in 4 frames, then pushes 4% so it is never still; the next beat swaps in on its
  own keyword. The room darkens a little behind the type, fading out well above the cutout's bottom edge. Hold each beat
  its reading time; a fast talker gets one or two beats, not one per sentence. The kit had nothing like it (the Python
  renderer's `backdrop-word` is one fixed word with no timing).
- **Reeded title** (`ReededTitle`): a full-frame overlay of the closing words seen through vertical glass ribs, built from
  slices (each rib magnifies its own copy of the scene; no `backdrop-filter`). The glass slides in from the right in 8
  frames with a light streak, ribs relax from 2x to 1.32x as the type drifts under them; the small lead line (already
  said) sits ON the glass, since ribs scramble small type, and each title word appears on its own first frame. Inter Tight 800 on deep blue. Hold the reading time.
Order in the reel and our sample: whip in 0 to 0.3 s, keyword behind the head on the word, dots fly in when it ends and
close on the next phrase, the glass on the last words. Captions in the sample are two rolling rows below the face (a new
row pushes the last one up, so each stays its line plus 0.6 s); the last row hands off into the title's lead line. Tested
on Connyct footage (Aiden, the goal moment), so the sample is private: `src/private/person-effects/podcast.tsx`.

## Talking-head edit: face lock, placed captions, matte reveal (2026-11-18)
From Shaan Johari's reel "I filmed this. Claude edited it." (instagram.com/reel/Df4TGYjEZLu, Muse Nov 18), a 9 s
before and after of one take, stepped frame by frame; his breakdown is DM-gated and was never seen, so these are our own
builds. What the frames showed that the text did not: the captions MOVE, each line landing in a different open spot. All
six are in the kit (`import { FaceLock, PlacedCaptions, MatteReveal, GlowIn, ArcWords, RibbonWrap } from "../kit"`), take
their words from the clip's `captions.json`, and take `clip`, the cutout `person` and a `frame` like the parts above.
- **Face track first.** `effects/.venv/bin/python -I effects/scripts/facetrack.py clip.mp4 track.json` writes the face at
  10 Hz (YuNet, the same detector as the 51 effects). In a two-shot add `--near <x>` to follow one person; run it twice
  to get both faces.
- **Face lock** (`FaceLock`): yellow corner brackets ride the face, easing between samples, with a small readout
  (FACE score, X, Y) that steps exactly 10 times a second; a big stat in Barlow Condensed Light types on her word one
  character every 2 frames and clears the same way; an optional word under the face. Keep the stat above the hair.
- **Placed captions** (`PlacedCaptions`): every line is placed where it is free: above the head, left or right of the
  face, or below it, tested at every frame the line is up against the face (expanded 35%), anything in `avoid` (another
  face track or a rect) and the platform's own buttons (`platform`: instagram, tiktok or shorts, from
  `src/lib/platformUI.ts`; approximate zones dated today). Words light on the voice per the editing lane, one accent word
  per line in Newsreader italic. `showZone` draws the dashed box the reel uses to show the rule.
- **Matte reveal** (`MatteReveal`): the show-your-work beat. A hard cut to the cutout as a flat silhouette (cream with
  turning arcs, black on white, or white on black), an italic lead line over one heavy word, held about half a second,
  one inverted flash frame, back to the footage.
- **Glow in** (`GlowIn`): on a hard cut the person is solid glowing white for 2 frames, then real over 3.
- **Arc words** (`ArcWords`): her words arrive one by one on a tilted ring round the head, far side behind it, near side
  in front, each out of a blur; `follow` a face track on handheld footage so the ring stays on her.
- **Ribbon wrap** (`RibbonWrap`): on a black-on-white matte hold a gold ribbon draws on in 12 frames, its upper loop
  behind the body and its lower band in front, while a two-part title lands with the big word behind the head.
Tested on the CampusAI street interview IMG_5696 (`public/post-leftonread/`, git-ignored; the cutout holds both people,
so every matte shows two silhouettes). Test entries are private: `src/private/person-effects/shaan-a.tsx`, `shaan-b.tsx`.
