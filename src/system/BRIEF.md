# The film system: shared brief for everyone building it (2026-10-23)

Jacob asked for a system for making CampusAI videos, the way a senior motion team works, so films can be made
one at a time with care OR many at once in bulk. Research behind it (read the parts that touch your job):
- `/private/tmp/claude-501/-Users-jacobfeigenblum-Desktop-Claude/0f94a42f-3d1e-4919-a81e-fed7b6dd7ef3/scratchpad/research-pro-process.md`
  (Lago's storyboard-as-data, grey animatic, validators; Carbon motion tokens; cutdowns; sound)
- `/private/tmp/claude-501/-Users-jacobfeigenblum-Desktop-Claude/0f94a42f-3d1e-4919-a81e-fed7b6dd7ef3/scratchpad/research-whatships.md`
  (what launch films that perform organically do)

## Already written (read first, do not redesign without saying why)
- `src/system/storyboard.ts`: the storyboard type (one JSON per film at `Content/video-studio/films/<id>/storyboard.json`),
  modes "individual" (grey draft is a gate) and "bulk" (no gate), `readHold`, `runtime`, `SIZE`.
- `src/system/rules.json`: every number the checker and films share (reading rule, logo timing, end card, format
  lengths, banned strings, the Maryland M patch rect).
- `src/system/motion.ts`: motion tokens (CURVE quiet/showy, DUR scale, durFor, SPRING, readHold, DRIFT). Use these names;
  any typed-in value needs a `// motion: <reason>` comment.

## The studio rules still apply in full
Read `~/.claude/skills/studio/SKILL.md`, `lanes/product-films.md`, `rules/campusai.md`. In short: real product only,
every string from a capture or the facts list, no em dashes, no monospace, no all-caps tracked labels, no fake browser
chrome, Zodiak titles and Inter UI from `src/kit/brand.ts`, one red accent, the Maryland M never visible (patch rect in
rules.json; x 108 to 112 is our own logo's sparkle, keep it), never Sandy Spring, Testudo or ChatGPT, product shown big
and in context (small pieces floating on black were rejected three times), smooth and not too quick, hook in 0.5 s,
logo by 2 s, end on the logo plus campusai.app held about 3 s (Instagram cuts: "Link in bio").

## Kit to build on
`src/kit/` (import from the individual files, e.g. `../kit/PageView`, `../kit/camera`, `../kit/Pointer`, `../kit/LogoMoment`,
`../kit/brand`, `../kit/parts`, not from `kit/index.ts`, which another session is editing), `src/shots/<shot>/` (ported shelf
shots), `../shots/` (124 shot recipes with code), `src/four/real-laptop.tsx`. Real captures: `public/pass/*.jpg|json`
(1440x900 CSS pages at DPR 2, layers files with measured boxes), `public/pass/chat/`, `public/spring3/`, `public/spring4/`,
`public/howto/`.

## Do not touch (another session owns them right now)
`src/kit/pass/`, `src/wave1/`, `public/w1/`, `src/kit/index.ts`, `src/Root.tsx`, anything in `~/Desktop/Motion`. No git commits.

## Look before you report
Render, then `node ../capture/sheet.mjs <video> <sheet.png> <t1,...>` and open the sheet; fix what is wrong. `npx tsc --noEmit`
clean for your files. Report: what you built in plain words, files, commands, what is weak, what you left out.
