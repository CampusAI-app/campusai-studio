# CampusAI: every rule Jacob has given, in one place

Gathered 2026-10-22 from `motion-library.md` (items 7 to 9 and the 09-16 rules), the hook-films
brief and LOG. Newest wins where two disagree. Add every new note here, dated, the day he gives it.

## The product on screen
- Real dark-mode web captures of campusai-demo (or dev or main), never a mockup, never mobile
  (parked). It must look like the WEB product at phone size: a capture that "looks like mobile,
  can't see anything" failed (10/21). Show the page big and in context.
- The look: dark screens on near-black `#0b0708` with the product's red glow; the red-black
  gradient runs through the whole piece; the product IS the frame, no visible seam or box (10/16).
- **Never show Sandy Spring** (Maya Chen's demo internship), in a film or on a captured page.
  Lean on the Smith Investment Fund for her experience (10/21, in caps).
- Never mention ChatGPT. No Maryland imagery (flag, Testudo, campus photos). No "Free for UMD
  students". Instagram endings may say "Link in bio."
- Every press shows where its result lands. Show, never label ("Missed" was cut).
- Capture from EMPTY: a picker starts empty and gets filled by typing or a tapped suggestion,
  never pre-filled then X'd out (10/21).
- Use different real directions in one run (investment banking, consulting, something else),
  not one track repeated (10/22).
- Explain a concept the first time it appears (what the North Star is) in one line over the
  thing itself (10/22).
- Teach by showing: scan the real posting and show the results; show the specific changes on
  THEIR resume, not a generic before/after (10/21, 10/22).
- Never a demo number that is not true on main. If the demo cannot do something yet (a re-rank),
  the film never claims it.

## Opening and ending
- Logo near the start and always at the end (10/22). Earlier: "any cut gets a short logo
  intro" (10/16) and "logo at 0.5 s with the watermark held top-left" (Job Match, 09/16).
- The hook is in the first 0.5 s; the opening is never slow (10/21).
- Orientation plays OVER the thing, not in front of it: the hook lines sit over the real card
  already on screen, never on black (09/16).
- Never open on the North Star picker for Job Match (rejected twice, 09/16). Skip greeting pages
  and retyping; open each chapter on the question (10/16).
- End by zooming into, or turning something into, the CampusAI logo. No closing slogan line. (Superseded for
  chat films 10/30: "at the end, it should say something like 'Ask CampusAI anything.'" The registration film
  ends on that line above the logo and campusai.app.)
- Films made on the film system (`studio/src/system/`) end on the logo plus "campusai.app"
  ("Link in bio" on Instagram cuts), held about 3 s (10/23, his yes on the What Ships finding:
  logo plus address beats the logo alone; a logo-first opening only works for famous brands).

## How a film gets made (10/23)
- Two modes, picked per film: "individual" shows him a grey draft (real camera, timing and text
  on grey pages) before anything polished renders; "bulk" skips the draft and goes straight to
  final. His words: "sometimes I want a lot of them made in bulk, but sometimes I work on ones
  individually." Never force the draft on a bulk batch.
- Funny "Ask CampusAI" films are welcome back, but not like bingo or Midterms Wrapped (10/23).
  The joke has to land on a real thing the product does.

- A chat answer recorded from the docked panel and blown up to 9x16 reads "stretched", "on a phone", "bad
  text". For a quick ask-and-answer beat, make it a motion graphic of the chat instead: the field zoomed in,
  the question typing, the loader, then the answers as options a cursor opens. Use the product's own words
  (placeholder, loader label, the real answer), never invented ones (10/23, study spot film). This is his
  call for that beat, not a retirement of real captures for whole product films.
- No headline over or above a product beat that competes with it: "the one text block is blocking it"
  (10/23).
- A chat recorded in a narrow window shows the product's MOBILE layout: "it's trying to be on mobile when it's
  getting it from the web" (10/29, registration films). For `npm run chat`, record the desktop web layout in a tall
  window (1100 x 1956, `zoom` 1.8 makes the conversation readable) and frame it with the camera. The 820 px size in
  `scripts/chat.mjs` flips to mobile. Keep the page's top logo row (the school's M beside ours) out of frame.

## Camera and motion
- Smooth and focused: one subject, arrive early, hold, release when the beat completes. Nothing
  moves for a second reason while something is already moving (08/30).
- ONE camera framing through a continuous action. The camera never swings while typing (10/22).
- A streaming chat answer must glide, never jolt: the product scrolls the thread a line at a time, and a film
  that shows those jumps reads as "a little glitchy" (10/30, registration films). Make the recording itself glide:
  `capture/register-chat-record.mjs` turns the product's `scrollTop = scrollHeight` pin into a spring the page
  follows, so a close frame needs no correction in the edit. Typing is one new letter per film frame, about 30 a
  second: "smoother and quicker" than 20 a second, which gave one or two letters per frame unevenly (10/30).
- Two versions of a chat film for students (10/30): the plain one, and a separate "more edited up" one for a Gen Z
  feed, because the plain one "might be a little boring or slow". What he means by edited up is SMALL things: icons,
  soundtrack, noises, things popping up ("smaller things, like icons, soundtracks, noises"), not big set pieces.
  But small icons beside each line were rejected ("doesn't look good"): they only repeated the word next to them.
  What landed in `RegisterChatGenZ-16x9`: one big fact sticker per answer on a held beat, the answer dimmed, every
  word from the answer; the real AOSC123 block lifting once; the opening question over the app.
- Don't make the viewer wait on the chat: "a lot of it is just waiting for the chat to respond" (10/30). Thinking
  steps about half a second each (shorter and the product's fade stacks them unreadably), the answer streamed
  ~2.5x faster, and a close frame on the conversation while it streams.
- A zoom into the screenshot wall was rejected ("makes the rest not look so clean"); one screen
  popping out of its slot landed (10/16).
- **The pop-out** (a real piece of the product lifting off its page in 3D) is liked, not a rule.
  Use it when highlighting one thing; vary how it pops (spotlight lift, `element-body-moves`,
  `depth-layer-moves`, `magician-card-flourish`, `space-camera-moves`).
- Don't go too quick, and use the shotcraft shots rather than hand-built moves (10/21).
- A 3D ring is wrong when the real list does the job; the real list then the press (10/21).
- Films in one batch never share a signature move.
- He loves the motion and the sound of adiiguu's Island "for Agents" carousel (11/03, through Muse): one
  system with one signature move (rack focus), tempo that alternates beat to beat, and sound on the transitions.
  The breakdown and our matching parts are in `lanes/motion.md` under Reference.
- Red bars rising from the bottom on an end card read as AI: never (10/19).
- The drawn `Laptop3D` "looks fake": use `four/real-laptop.tsx` (10/19).

## Shots he likes (reach for these first)
`bottom-push-stack-wipe`, `canvas-materialize-moves`, `card-flip-reveal`, `card-flock-tumble`,
`card-stack`, `carousel-3d`, `circle-match-iris`, `collab-cursor-moves`, `cursor-flyover`,
`deck-deal-flyin`, `graze-face-tour`, `icon-performance-moves`, `integration-hub-map`,
`mosaic-reframe`, `neon-frame-orbit-drop`, `overhead-camera-moves`, `page-waterfall-wall`,
`panel-grid-moves`, `pill-chip-slot-cycle-handled`, `product-card-progressive-assemble`,
`radial-ripple-phone-chips`, `research-card-stack-scroll`, `space-camera-moves`,
`spotlight-hero-card`, `spotlight-sweep-moves`, `steep-tilt-glide`.

## Words
- Titles in Zodiak, streamed with the chat's own soft trail. Headlines small and above the UI.
- The message is "this is where you find everything", not feature slogans. "Your day / Your
  jobs / Your semester" beats were rejected as not enticing (10/16).
- Answers full width, each name on its own line with its reason under it.

## Approved bars to beat
- "Platform tour, dashboard to Job Match" (round 4, Flock-9x16) and "Plan your spring" (round 8,
  Spring-4x5), both in `~/Desktop/Motion/Good to Go/`.
- `ChatAsk-16x9` (`ChatVideo.tsx`) was the signed-off base in August; the Good to Go films
  supersede it as the bar.
