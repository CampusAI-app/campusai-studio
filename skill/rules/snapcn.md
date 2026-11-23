# snapcn parts: which one, and how long it runs

Written 2026-11-23 from snapcn's own agent skill (github.com/snapcndev/snapcn, `skills/snapcn`, MIT), read in
place and harvested, not installed. It came in on Jacob's second Muse send about snapcn ("need this asap"). The
parts themselves have lived in `studio/src/snapcn/` since 2026-11-06; this file is what lets a film pick one and
budget its timeline without guessing. What was taken and left out, and why: `src/snapcn/README.md`.

## The rule that comes first

A snapcn part is seasoning on a real film, never the film. The 2026-11-06 snapcn sample (big lines on the dark
red glow, no story, no product) was rejected as "classically AI-generated". Every part below goes over or between
real captures of the demo, real footage or a real number, inside a story that was pitched first.

## Budget the Sequence to the part's natural length

Every part has a natural length at 30 fps. Give its `<Sequence>` that length. Shorter clips the motion mid-move,
longer leaves dead air. Speed a part with its `speed` prop (a time multiplier), never by squeezing the Sequence.

## They are laid out for a wide frame

snapcn parts are built for 1280 x 720 and most of them scale with the frame's height. Dropped straight into a
1080 x 1920 vertical they render about 2.7 times too big and crop off both sides. In a vertical, wrap the part in
an absolutely filled div with `transform: scale(...)` (0.45 to 0.6 is typical; the Studio site previews in
`src/private/site-previews/` show the working value for each) and look at a frame before building on it.

## Pick by the job

| Part | Reach for it when | Not when | Length |
|---|---|---|---|
| text-reveal | A headline needs an entrance where one word carries the moment | A subtitle or label; the swell is too loud | 90f |
| text-swell | A promise or punchline should sit forward and hold | Under about 90 frames; the hold gets cut | 110f |
| text-highlight | One phrase in a still line carries the point (a number, a name) | The whole line should move | 56f |
| text-swap | One label or stat becomes another in the same slot (before and after) | Text arriving for the first time | 90f |
| text-build | A short headline assembles, the reflow doing the work | Seven words or more; it turns busy | 75f |
| text-rewrite | The correction is the beat: a line edited on camera into the truth | The two versions share nothing; use text-swap | 102f |
| text-select | The cheapest emphasis beat there is | Only part of the line matters; use text-highlight | 72f |
| type-morph | The line says two things and the second is the payoff | The two words share no letters | 94f |
| word-flip | One line has to cover several audiences or uses | Short budgets; typing the prefix eats the shot | 180f |
| word-wheel | A fixed lead-in with one slot spinning through uses ("CampusAI for ...") | One word only | 66f |
| brand-wheel | A lead word beside a rolling column of pills that a cursor clicks last. `marks={false}` for plain labels | The pills are logos we have no right to show | 139f |
| word-gather | A short tagline that arrives out of order and settles | Over about eight words | 49f |
| punch-lines | A run of full-frame statements with hard cuts. Script: `\|` starts a card, `/` a line | One quiet line | 144f |
| spec-sweep | A one-line spec, word by word, with a highlight running along it | Anything longer than a spec line | 75f |
| drop-line | Words cut past one card at a time, the last one sinking away | A line that needs reading time | 38f |
| hello-zoom | An opener: words flicker, one line types, the camera dives through the type | Mid-film; it is an entrance | 75f |
| portal-intro | Sentence to picture: a small picture chip in the line grows to fill the frame | No real picture to grow into | 108f |
| word-captions | Burned-in captions from word timings, paged properly over a long clip | A karaoke fill is wanted | 96f per page |
| karaoke-captions | The line fills as it is spoken, talking-head energy | A full transcript over a long clip | 150f |
| block-wordmark | A short wordmark builds from blocks | Names past about eight letters | 150f |
| wordmark-cut | The end card: a huge wordmark, then a hard cut to its last letters | Long names | 66f |
| cut-lockup | Logo intro or outro in hard cuts, paper to night to lockup. Pass our logo paths | A text-only title | 108f |
| sky-lockup | A quick outro: a short promise takes itself apart into the logo | Long sentences | 57f |
| title-sweep | An end title lit by a gradient travelling through the letters | Body text | 76f |
| logo-assemble | A ring of real screenshots contracts into the logo | One or two images | 108f |
| logo-collapse | A short intro: a stack of real shots flicks and collapses into the mark | Long bumpers | 52f |
| logo-flicker | A fast bumper, real images flipping to the mark | The images deserve to be seen | 100f |
| logo-drift | A field of drifting tiles where no single one is the hero | One mark has to land | 108f |
| count-grid | The "it scales" stat: cards multiply and a counter jumps | Any number that is not true and sourced | 47f |
| cursor-track | A pointer doing a recorded path with click rings, over a capture that lost its cursor | The recording already has a cursor | 132f |
| dot-bloom | A halftone dot transition between two real shots | Every cut; it is a once-a-film move | 30f |

## Checks before calling it done

- Scene changes are `@remotion/transitions` inside a `<TransitionSeries>`. snapcn ships no transition except
  dot-bloom, and text-swap changes a line, not a scene.
- One accent colour, sentence case, real content in every slot. Pass our own colours and fonts; the parts
  default to snapcn's light palette, so a dark film passes `mode="dark"` and our `theme`.
- No glow halos, no gradient wash behind type, no feature list read off one by one.
- Animate transform, never top, left, width or height. No `Math.random()`, timers or `Date.now()` in a part.
- Pass real images and our logo. Several parts default to stand-ins; never let one reach a film.
