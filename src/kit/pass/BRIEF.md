# Motion pass, wave 0: the shared brief for every new kit part (2026-10-22)

Jacob asked for a big motion pass: new parts first, then storylines built from them. These are the parts.
Each one is a reusable, parameterised kit component plus a short preview he will watch and mark keep or kill.
The reference films that inspired them are on https://campusai-motion-templates.vercel.app (the top 10).

## Read before writing a line
- `~/.claude/skills/studio/SKILL.md` (the only rulebook), `lanes/motion.md`, `lanes/product-films.md`,
  `rules/campusai.md` (every note Jacob has given on CampusAI films).
- The kit: `src/kit/index.ts` and what it exports (`brand`, `useBrandFonts`, `PageView`, `camAlong`, `toCanvas`,
  `rectOnCanvas`, `PointerAt`, `LogoOpen`, `LogoEnd`, `parts.tsx`: `ZODIAK`, `INTER`, `TypeLine`, `BlurLines`,
  `Odometer`, `SPARK`...), `src/lib/anim.ts` (`EASE`, `EASE_CAMERA`), `src/four/real-laptop.tsx` (the photoreal
  laptop; renders need `--gl=angle`). Never redefine a part the kit already has.
- The shot shelf: `../shots/README.md` (124 shots with code in `../shots/demos/`). Shots already ported as
  parameterised components live in `src/shots/<shot>/`. PORT from the shelf rather than hand-building a move.
- Motion numbers: `~/Desktop/Claude/Lucius/memory/motion-raylight-templates.md` (measured beat sheets, including
  limelight, manicule and macbook-pro-around-linear). Move names: `~/Desktop/Claude/Design/motion-vocabulary.md`.

## Real material
- `public/pass/<page>.jpg`: fresh dark captures of campusai-demo, a 1440x900 CSS page at DPR 2 (image 2880x1800).
  Pages: dashboard, dashboard-bell (notifications open), calendar, jobmatch, job-goldman (Goldman detail open),
  events, organizations, planner, notifications, resume.
- `public/pass/<page>-tall.jpg`: the full page, 1440 CSS wide (2880 px), height in the JSON as `tallH`.
- `public/pass/<page>.json`: measured boxes in CSS px (`kind` card / heading / button / nav, `x y w h`, `text`).
  Land on these. Every string you put on screen comes from a capture or one of these files, never invented.
- Older real captures under `public/` (campus, flock, howto, spring3, laptop) may be reused.

## Hard rules (each one cost a round before)
- The Maryland "M" mark beside the logo at the sidebar's top left (CSS about x 108 to 156, y 10 to 46; the planner disclaimer card also says "Testudo", keep it out) must
  NEVER be visible. Crop it out or cover it with a patch of the sidebar's own colour. No Maryland imagery at all.
- Never show "Sandy Spring". No em dashes. No monospace. No all-caps wide-tracked labels. Sentence case.
- No fake browser chrome (no dots, URL bars, window frames). The page is frameless or on `RealLaptop`.
- One accent, the brand red from `brand("campusai")`. Zodiak for titles, Inter for anything that reads as product.
  Colours and fonts come from `kit/brand.ts`, never typed in. Glows are fine when they are the product's own light.
- Show the real product big and in context. Small cropped pieces floating on black were rejected three times.
- Smooth and focused: one subject moves at a time, arrive early, hold, release. Not too quick. Text stays fully on
  screen at least letters / 15 + 1.5 s, never under 1.8 s.
- Never resize a page image with `transform: scale` (drops frames); lay it out larger (`PageView` does this).
- No red bars rising from the bottom on an end card. Ends hold 0.8 to 1.2 s and are never fully still.
- No claims the product cannot make. No invented numbers.

## What to deliver, per part
1. The component in `src/kit/pass/<group>/<Part>.tsx`, parameterised (source image, page size, target rects or
   layer text, timings, brand) so a film can reuse it on any capture. Plus `src/kit/pass/<group>/index.ts`
   exporting the group's parts. A short header comment in the house style: what it is, where it came from
   (the reference template or shelf shot), the numbers that matter.
2. A preview composition `Pass-<Part>`, 1080x1350, 30 fps, 4 to 9 s, in `src/kit/pass/<group>/preview.tsx`,
   registered by its own `src/kit/pass/<group>/entry.ts` (same pattern as `src/kit/shelf-entry.ts`). Each preview
   uses real captures and is a little scene that shows the part doing its job, ending cleanly.
3. Render it: `npx remotion render src/kit/pass/<group>/entry.ts Pass-<Part> out/pass/Pass-<Part>.mp4 --concurrency=2`
   (add `--gl=angle` if it uses three.js).
4. LOOK at it before reporting: `node ../capture/sheet.mjs out/pass/Pass-<Part>.mp4 out/pass/Pass-<Part>-sheet.png <t1,...>`
   with 6 to 8 times, then open the sheet image and fix what is wrong (the M mark, clipped text, a jump, a dead
   frame, an unreadable line, anything that looks like a template). At least one fix round.
5. `npx tsc --noEmit` clean for your files.

## Do not touch
`src/Root.tsx`, `src/kit/index.ts`, `src/kit/shelf.tsx`, other groups' folders, the campusai-demo repo, anything in
`~/Desktop/Motion`. No git commits. If you need a shared helper, put it in your own group folder.

## Report back
Per part: one plain line on what it does, the move's dictionary name, file path, composition id, mp4 and sheet
paths, its props, and what is still weak. Then anything you deliberately left out.
