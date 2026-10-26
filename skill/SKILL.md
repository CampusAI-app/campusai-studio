---
name: studio
description: >-
  The one front door for MAKING CONTENT for any of Jacob's ventures, mostly CampusAI, for Jacob
  and for the CampusAI team (Ashley, Angela) who installed the studio: product
  films, promo and launch videos, reels, motion graphics (kinetic type, logo builds, stat
  reveals, animated backgrounds), editing footage he recorded, talking-head videos, captions,
  and still graphics (hero stills, feed images, thumbnails, carousel frames). Use when Jacob says
  "make a video", "a promo", "launch video", "product video", "a reel for", "a video for this
  feature", "animate this for Instagram/LinkedIn", "cut a demo video", "a motion piece", "a logo
  animation", "a graphic for", "a still for", "edit this video of me", "cut this clip down",
  "add captions to this", "clean up my talking head", "tighten this recording", or sends footage
  and asks for anything, or "show CampusAI answering", "record the chat", "make a chat for".
  Pitches the idea and the structure first, builds only after the person picks.
argument-hint: "[venture] [what it should say] [footage, pages or assets, if any]"
---

# Studio

Ours, built 2026-10-22 from the audit that found the old video setup fighting itself: two
"read this first" lists, rules that disagreed, generic skills that started blank projects, and
every film rebuilding its own camera and cursor. **This file is the only rulebook.** Anything
here wins over every other file, skill, template, shot card or reference. If another file
disagrees with this one, this one is right and the other file is stale: say so and fix it.

Everything builds in ONE place, the studio (Remotion, 30fps): the folder this skill sits in
(`skill/` is inside it). Since 2026-10-23 it is also the team's: one public repo,
github.com/CampusAI-app/campusai-studio, so Jacob and the team build with the same parts and the
same rules, and a rule added here reaches everyone on their next `git pull`. Films live in
`films/<name>/` NEXT TO the studio folder, not inside it. The old Video Kit
(`CampusAI-app/campusai-video-kit`) is retired: never build there.

## Who you're working with

**Jacob** (his Mac: studio at `~/Desktop/Claude/Content/video-studio/studio/`): everything below
applies as written.

**A teammate** (Ashley, Angela, anyone who installed the studio): everything below applies, with
three differences.
- **Their footage is the start.** Most team pieces begin from a cut they made themselves (street
  interviews, a talking head). The studio adds what their editor can't: the real product (a chat
  answering their question, a page), motion, and the logo ending. `src/studyspot/StudySpot.tsx` is
  the worked example: Ashley's interviews, pins over each answer, then the real chat.
- **Shelves that only exist on Jacob's Mac:** `shots/` (shot recipes and licensed audio),
  `Design/...`, `Lucius/...`, the Studio reference page's local files, and Base favorites. When a
  step points at one, skip it and use the kit (`src/kit/`) and the films already in `src/` instead.
  Jacob's `capture/` scripts are one of these: capture the demo with `npm run flow` (and `npm run chat`).
  Music: download free tracks from mixkit.co (free for commercial use, no credit needed) into
  `public/<film>/`; never commit them.
- **Delivery goes to Jacob in Base, never to a social account.** See Deliver.

The person decides; Claude never posts, and nothing is final until Jacob says so.

## Pick the lane

Read this file, then the one lane file the request belongs to. A film can borrow from another
lane; it still has one home lane.

| Lane | What it makes | Read |
|---|---|---|
| Product films | The real product on screen, captured and turned into a film | `lanes/product-films.md` |
| Motion | No footage: kinetic type, logo builds, stat reveals, backgrounds, loops | `lanes/motion.md` |
| Editing | Footage Jacob recorded: cut, sound, captions, colour | `lanes/editing.md` |
| Talking heads | A person speaking to camera, plus on-screen effects | `lanes/editing.md`, then `lanes/talking-heads.md` |
| Graphics | Still images from the same parts: feed images, hero stills, thumbnails, carousel frames | `lanes/graphics.md` |

For CampusAI work also read `rules/campusai.md`: everything Jacob has said across every round.

## Your own chat (2026-10-23): the real chat, answering your question

To show CampusAI answering a specific question, write `films/<name>/chat.json` (question, answer
in markdown, the thinking steps, follow-up chips; the format is at the top of
`scripts/chat.mjs`) and run `npm run chat <name>`. It serves the public demo through localhost,
swaps in only the answer, types the question and records the real chat at true speed into
`public/<name>/chat/`. Play it with `<ChatRecording src="<name>/chat/frames.json" />` from the
kit. Try `npm run chat examples/study-spots.json`, then render `Kit-ChatRecording` from
`src/kit/shelf-entry.ts` to see the whole path. Nothing in the demo changes; you only record it.
**The answer is the one thing you author, so it has to be true:** every name, number and claim
in it goes in `facts.md` with where it came from, the same as any other on-screen claim.

## Your own flow (2026-10-26): any path through the real demo

To show the product being used (open Events, press Add to CampusAI Calendar, open My Calendar), write
`films/<name>/flow.json`, a list of steps in plain words (press, type, scroll, go, wait; the format is
at the top of `scripts/flow.mjs`), and run `npm run flow <name>`. It records the real demo at a
student's pace into `public/<name>/flow/`. Play it with `<FlowRecording src="<name>/flow/frames.json" />`,
which draws the pointer and its presses. Try `npm run flow examples/add-to-calendar.json`, then open
`Kit-FlowRecording` from `src/kit/shelf-entry.ts`. Nothing in the demo changes. This is how a teammate
captures the product: Jacob's `capture/` scripts are not in the repo.

## The film system (2026-10-23): product films as data

A product film can be written as `Content/video-studio/films/<id>/storyboard.json` (type in
`studio/src/system/storyboard.ts`) and made with three commands from `studio/`:
`npm run check <id>` (reading holds, lengths, banned words, every press shows where it lands,
every on-screen string traced to a capture or the facts), `npm run draft <id>` (the grey draft:
real camera, timing and text on grey pages), `npm run make <id>` (the final in every aspect the
storyboard lists, reframed on each shot's focus, with music, cues and a -14 LUFS loudness pass;
`-- --cut <name>|all` for the length cutdowns in its `cuts`; `npm run make -- --all` for a batch).
Mode per film: `individual` makes the grey draft a gate (Jacob says yes, then `draftApproved`),
`bulk` skips it. Numbers live in `src/system/rules.json`, timing in `src/system/motion.ts`
(use its names; a typed-in value needs a `// motion:` reason), parts in `src/system/parts/`,
sound in `src/system/sound/`. The storyboard and its facts replace `shotlist.md` and `facts.md`
for a film made this way; `brief.md` stays. Fix the rule, not the video: a note from Jacob
becomes a line in `rules/campusai.md`, a number in `rules.json`, or a check, before the film is
re-made.

## The order (his, never skipped)

1. **The idea**, in one or two lines: what it says and to whom.
2. **The structure**: beats, each with its part or shot, its length, its real material, what the
   viewer knows by its end, and the state it starts and ends on. A list of effects is not a
   structure. Draft three different structures before pitching one and say why the pick won.
   If it starts from a reference or a past film, at least 4 of these 6 differ from it:
   structure, opening, signature shot, camera path, sound shape, ending. Two or three real forks
   at most, each with my pick. In plain chat, never a popup.
3. **He chooses.**
4. **Write it down, then build.** Every piece, every lane, gets `films/<name>/` (next to the studio):
   - `brief.md`: the one sentence to remember, audience, length, formats, real assets by path,
     three signature moments described without effect names, the one carrier (the object every
     scene is made of, so shots hand off instead of cutting), this piece's banned line, the
     3 to 5 references, and the composition id(s) it renders from.
   - `facts.md`: the only source for any number, name, feature or claim on screen, each checked
     against `main`, not the demo. Not in the file, not on screen.
   - `shotlist.md`: each beat with its time, its reads, start and end state, and its motion in
     numbers (frames, easing or spring, px) with the move's dictionary name and one-line
     definition beside it. "Snappy" is not a spec.
5. **Review loop** (`review.md`) before any full render.
6. **Deliver** (below). Never auto-open. Posting is his.

## Rules for everything (each one settled; the old disagreement is noted so it stays settled)

**Real and honest**
- Anything showing a product shows the REAL product: campusai-demo, dev or the real build. A
  mockup makes it unpostable. Every claim on screen is true of the product today.
- Never invent a number, name or logo. Placeholder faces (`kit/faces/`) are never posted.

**Logo** (Jacob, 2026-10-22)
- The logo appears near the start (a short bumper, or a mark that arrives inside the first two
  seconds and holds, the way Job Match put it in at 0.5 s) and **every piece ends on the logo.**
- The hook still comes first: something worth watching inside 0.5 s. The logo can share that
  opening; it never delays the hook. (Settles "logo first" against "hook in 0.5 s".)
- Make it loop when the last frame can hand back to the first. Nice to have, not required.

**Time on screen**
- Text stays fully on screen at least letters / 15 + 1.5 s, never under 1.8 s; a spoken line's
  caption at least the line plus 0.6 s. **When text is on screen, this wins.**
- Beats with no text to read move at about one idea per 1.7 s. (Settles the pace conflict.)
- The hero moment sits at 60 to 75% of the runtime. The end frame holds 0.8 to 1.2 s and is never
  fully still.

**Look**
- No monospace, ever. No all-caps wide-tracked labels. No em dashes in any copy. Sentence case.
- One accent colour per piece. Each venture's colours and fonts come from `studio/src/kit/brand.ts`
  only, never typed into a film. CampusAI red is `#D9202E` (the product's own `--color-primary`).
- Type: each venture's display face for titles, its UI face for anything that reads as product.
  CampusAI is Zodiak titles and Inter UI. (Settles "Inter only" against Zodiak.)
- No fake browser chrome, ever: no traffic-light dots, URL bars or window frames. The product is
  shown frameless or on the realistic device (`studio/src/four/real-laptop.tsx`), never the old
  drawn `Laptop3D`.
- Glows are NOT banned (Jacob, 2026-10-22: "I don't think that's a rule"). A glow belongs when it
  is the product's own light or is attached to something that matters. Each piece's brief still
  names its own banned line; nothing on it is a standing rule unless it is written here.

**Words on screen**
- Captions over a product sit in a band BELOW the footage, never over live UI.
- Captions over a person follow the word-timing rules in `lanes/editing.md`, outside a face-safe zone.
- Show, never label. Headlines small and above the UI, never on it.

**Sound**
- Default is no voice: music, sound and captions. ElevenLabs' free tier is non-commercial, so a
  voiced piece that will be posted needs a paid key: Jacob's call, asked once, never assumed.
- Licensed sound only: `Content/video-studio/shots/audio/` (Mixkit, commercial, no credit needed).

**Remotion licence**: Jacob's call (2026-08-28) is that it is not a blocker. Not raised again.

## Where things are (one shelf per job)

| Need | Go to |
|---|---|
| Parts to build with (camera, cursor, logo moments, cards, type, device) | `studio/src/kit/index.ts`. Import from the kit; never redefine a part a film already has. |
| A whole shot recipe with code | `Content/video-studio/shots/` (124 shots, README index; see them move at vincentwei1021.github.io/video-shotcraft/library.html) |
| The name of a move | `Design/motion-vocabulary.md` Part 4 (923 techniques, plain words to name). Parts 1 and 2 give the exact keyframes and camera numbers for names they share. |
| Motion numbers (timings, easing, camera chains) | `Lucius/memory/motion-raylight-templates.md`, Raylight's 24 measured beat sheets |
| References to learn from | The Studio page, https://campusai-motion-templates.vercel.app (What Ships launch films first for openings; Raylight for motion) |
| Prompts behind good Opus-made films | `Design/prompts/opus-motion-films.md` |
| Every rule Jacob has given on CampusAI | `rules/campusai.md` |
| What Jacob has favorited (Jacob's Mac only; read before pitching; favorites lead the structure options) | Base's `library_favorites` table, rows with `card_id` starting `studio:` (`studio:kit/Pass-<Name>.mp4`, `studio:graphics/<name>.jpg`, `studio:kit:<kit part>`, `studio:film:<reference film>`), `fav` true. Read with the Supabase connector on project `cjpcvveochjcgyexyyvr`. |

**Other skills, and when (they never override this file):**
- `remotion-best-practices`: Remotion API questions only. Ignore its "creating a video" route.
- `remotion-captions`: the transcription mechanics only. We transcribe with WhisperX and place
  captions by our rules, not its centred-over-the-frame default.
- `remotion-transitions`: `TransitionSeries` mechanics only. Its overshoot and flash recipes are
  not our taste.
- `hook-retention-psychology`: when writing the hook and the first three seconds.
- `video-to-superprompt`: to break down a reference video Jacob sends.
- `content-engine`: owns WHAT a social post says (copy, levers, scoring). The Studio owns how
  it looks and moves; for CampusAI, the Graphics lane is content-engine's renderer.
- **Never** `remotion-create` (it starts a blank project) and never the web-motion skills
  (`animate`, `transitions-dev`, `motion-dev-animations`, `gsap-*`) for anything rendered in
  Remotion: they write browser code that does not run in a Remotion timeline.

## Deliver

1. Render with `npm run film <CompositionId>` (sharper text than plain `remotion render`) or
   `npm run still <CompositionId>` for an image. Renders land in `studio/out/`, which is scratch.
2. Copy the finished file to `~/Desktop/Motion/<Mon D> videos/`, named by WHAT IT SHOWS, format
   in words, date at the end: `Platform tour, dashboard to Job Match, vertical (Oct 21).mp4`
   (vertical 9x16, feed 4x5, square 1x1, wide 16x9; "draft", "round N" or "not used" before the
   format). Older rounds go in that day's `Earlier versions/`. Approved pieces go in
   `Motion/Good to Go/`, and only when Jacob approves. Phone copies over 30 MB get a CRF ~20
   re-encode.
3. Write the composition id next to the delivered file name in `films/<name>/brief.md`, so the
   film can be found from either side.
4. Say what was not checked (a format not rendered, a sound not licence-checked).

**For a teammate, steps 2 and 3 are different:** put the finished file in their own folder,
named the same way, and send it to Jacob in Base (base-one-fawn.vercel.app): a task assigned to
Jacob titled `Video review: <what it shows>`, the file attached (the phone copy, under 30 MB, so it
uploads), and in the note who it's for, where it would post, and anything not checked. If the
Base connector is set up, Claude makes the task; attaching the file is done in Base by dropping it
on the task. His notes come back on that task. Posting happens only after he says yes there.
