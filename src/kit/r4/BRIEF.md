# Round 4 kit and experiments: the shared brief (2026-10-25)

Jacob, Oct 25: "make motion graphics and components that we can use for launch films, product features,
anything else, and maybe even start experimenting with other types of videos. Go ahead." Bulk mode: no grey
draft gate, build through, he reviews everything after.

Two kinds of work in this round:
- **Kit parts** (`src/kit/r4/<group>/`): reusable, parameterised motion graphics any film can drop in, the
  way the Oct 22 pass parts are (`src/kit/pass/`). He favourited FocusWalk, ExplodedPage and RoleCard from
  that pass, so that is the bar.
- **Experiments** (`src/r4/<experiment>/` plus `../films/<film>/`): new TYPES of video we have not made yet,
  built with the kit.

## What Jacob's taste says (read before designing)
- Everything he stars or scores 8 to 10 shows **one thing turning into another**: apps fly into CampusAI, a
  job detail comes apart into its reasons, a job card becomes a tailored resume, events drop into My Calendar.
  Cause and effect you can see. Effects with no job score 1 to 3.
- His recurring notes: "good idea but doesn't look good", "not clear it's moving from the button". Polish is
  half the score. Smooth and focused: one subject moves at a time, arrive early, hold, release.

## Read before writing a line
- `~/.claude/skills/studio/SKILL.md` (the only rulebook), `lanes/motion.md`, `lanes/product-films.md`,
  `rules/campusai.md` (every note Jacob has given on CampusAI films). `review.md` for the review loop.
- The kit: `src/kit/index.ts` and everything it exports, including `src/kit/pass/*` (camera, chat, readout,
  stage, type groups) and the film-system parts `src/system/parts/*` (CardDrift, CircleIris, ControlTitle,
  EndUrl, LikeWhenLine, ScoreChip, TermTravel, Timelapse, WordSwapLine...). **Never redefine a part that
  exists.** If yours is close to one, make it clearly different or extend it in your own folder.
- The shot shelf: `../shots/README.md` (124 shots with code in `../shots/demos/`; ported ones in `src/shots/`).
  PORT from the shelf rather than hand-building a move. Move names: `~/Desktop/Claude/Design/motion-vocabulary.md`.
  Motion numbers: `~/Desktop/Claude/Lucius/memory/motion-raylight-templates.md`.

## Real material
- `public/pass/<page>.jpg` (+ `-tall.jpg`, `.json` with measured boxes in CSS px): dark captures of campusai-demo,
  1440x900 CSS at DPR 2. Pages: dashboard, dashboard-bell, calendar, jobmatch, job-goldman, events,
  organizations, planner, notifications, resume. Land on the JSON boxes. Every string on screen comes from a
  capture, one of these files, or the film's `facts.md`, never invented.
- Older real captures under `public/` may be reused. Fresh captures: the scripts in `../capture/` show how
  (Playwright headless against https://campusai-demo.vercel.app, real Chrome at
  `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, `headless: true`, NEVER false). Capturing is
  read-only: never press anything that writes (save, RSVP, apply, upload, send a chat) on the demo.
- Sound: licensed only, `../shots/audio/` (bgm, music, sfx; see ATTRIBUTION.md).

## Hard rules (each one cost a round before)
- The Maryland "M" mark beside the logo at the sidebar's top left (CSS about x 108 to 156, y 10 to 46) must
  NEVER be visible: crop it or cover it with the sidebar's own colour (`src/kit/pass/stage/cover-mark.py` is the
  helper). The planner disclaimer says "Testudo": keep it out. No Maryland imagery at all.
- Never show "Sandy Spring". Never mention ChatGPT. No "Free for UMD students".
- No em dashes. No monospace. No all-caps wide-tracked labels. Sentence case.
- No fake browser chrome (no dots, URL bars, window frames). Frameless, or the real laptop
  (`src/four/real-laptop.tsx`, renders need `--gl=angle`). Never the drawn Laptop3D.
- One accent: the red from `brand("campusai")`. Zodiak for titles, Inter for anything that reads as product.
  Colours and fonts from `kit/brand.ts` only. Glows are fine when they are the product's own light.
- Show the real product big and in context. Small cropped pieces floating on black were rejected three times.
- Text fully on screen at least letters / 15 + 1.5 s, never under 1.8 s. Captions over product sit in a band
  BELOW the footage. No headline that competes with a product beat.
- Never resize a page image with `transform: scale` (drops frames); lay it out larger (`PageView` does this).
- Logo near the start and every piece ends on the logo (films on the film system: logo plus "campusai.app",
  held about 3 s). Hook inside the first 0.5 s. No red bars rising from the bottom on an end card. End frames
  hold 0.8 to 1.2 s and are never fully still. No closing slogan line.
- No claims the product cannot make. No invented numbers.

## What to deliver
**Kit part:** the component in `src/kit/r4/<group>/<Part>.tsx`, parameterised (image, page size, target rects
or text, timings, brand), plus `src/kit/r4/<group>/index.ts`. A header comment in the house style: what it is,
where it came from (template or shelf shot), the numbers that matter. A preview `R4-<Part>`, 1080x1350, 30 fps,
4 to 9 s, in `src/kit/r4/<group>/preview.tsx`, registered by its own `src/kit/r4/<group>/entry.ts` (same pattern
as `src/kit/pass/<group>/entry.ts`). Each preview is a little scene on real captures showing the part doing its
job.
**Experiment:** code in `src/r4/<experiment>/` with its own `entry.ts`; `../films/<film>/brief.md` (with the
composition ids) and `facts.md` (every on-screen claim and where it came from).
**Render:** `npx remotion render <entry.ts> <Id> out/r4/<Id>.mp4 --concurrency=2 --crf 16` (add `--gl=angle`
for three.js). Run from `studio/`.
**LOOK before reporting:** `node ../capture/sheet.mjs out/r4/<Id>.mp4 out/r4/<Id>-sheet.png <t1,...>` with 6 to 8
times, open the sheet image, fix what is wrong (the M mark, clipped text, a jump, a dead frame, an unreadable
line, anything that looks like a template). At least one fix round.
**Types:** `npx tsc --noEmit` clean for your files.

## Do not touch
`src/Root.tsx`, `src/kit/index.ts`, `src/kit/shelf.tsx`, `src/kit/pass/*`, other builders' folders, the
campusai-demo repo, anything in `~/Desktop/Motion`. No git commits, no installs. Shared helper you need: put it
in your own folder.

## Report back (short, plain words)
Each part or film: id, what it does in one line, your honest rating out of 10, the shelf shot or reference it
came from, render path, sheet path, what you fixed after looking, and anything not checked.
