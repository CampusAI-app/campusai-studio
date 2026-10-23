# Motion pass, wave 1: the shared brief for the five films (2026-10-22)

Jacob approved five storylines built from the fifteen new kit parts (all kept). He sees each film as a
finished draft and gives notes. Each builder owns one film end to end, except the final review and delivery,
which the coordinator does.

## Read before anything
- `~/.claude/skills/studio/SKILL.md` (the only rulebook; the order, the rules, deliver), the lane file for
  your film (`lanes/product-films.md`, plus `lanes/motion.md` for type), `rules/campusai.md`, `review.md`.
- `studio/src/kit/pass/BRIEF.md` (the parts' shared rules) and the parts themselves: `studio/src/kit/pass/`
  (camera, stage, chat, type, readout). Each part has a preview in its group's `preview.tsx`: read it, it is
  the worked example of the part's props. Import parts from `../../kit` (they are exported there now). Use
  `MarkPatch` / `PASS_MARK` from the kit for the Maryland "M" (CSS x 116 to 156, y 10 to 46).
- The last two films' reviews: `Content/video-studio/films/howto-internship/reviews/` and the hook films
  history `Content/video-studio/hook-films/BRIEF.md`, so you start from what they got wrong.

## The rules that cost rounds before (short list; the rulebook has them all)
- The real platform big and in context. Never small pieces floating on black.
- Hook inside 0.5 s, logo near the start (inside 2 s, may share the hook), every film ends on the logo.
- Not too quick. One idea per about 1.7 s when nothing is to be read; text holds letters / 15 + 1.5 s, never
  under 1.8 s. ONE camera framing through a continuous action; the camera never swings while typing.
- Every press shows where its result lands. Show, never label. Headlines small and above the UI, never on it.
  Captions in a band below the product. No closing slogan.
- Never show Sandy Spring, never Maryland imagery (the M, Testudo, campus photos), never ChatGPT, no em dashes,
  no monospace, no caps tracked labels, no fake browser chrome, no red bars rising on an end card.
- Every claim true on MAIN, not just the demo: check in `~/Desktop/Claude/CampusAI/build/repos/campusai-uip-frontend`
  (`git show origin/main:<path>`, read only, never change the checkout's branch or files). If a thing is only
  on the demo, say so in facts.md (the film can still be built; it posts when main has it).
- Capture from the real demo, read-only: `https://campusai-demo.vercel.app`. Model new rigs on
  `Content/video-studio/capture/pass-stills.cjs` and `pass-chat.cjs` (dark theme, em dash scrub, popups closed,
  Sandy Spring check). A capture-only response override is allowed where noted in your film's brief, nothing in
  the demo is ever changed. Put captures in `studio/public/w1/<film>/`.

## Sound
Music from `Content/video-studio/shots/audio/bgm/` only (Mixkit, commercial, no credit); BPMs are in
`shots/audio/ATTRIBUTION.md`. Your film's track is named in its prompt. Beat-map the shot list to the track
(`shots/method/music-beat-sync.md`); one soft sound per real on-screen action from `shots/audio/sfx/`. No voice.

## What you deliver
1. `Content/video-studio/films/<film>/brief.md`, `facts.md`, `shotlist.md` (formats per the rulebook: the one
   sentence, audience, length, format, real assets by path, three signature moments in plain words, the one
   carrier, the banned line, references, composition id; every on-screen claim in facts.md with where on main it
   is true; each beat with time, reads, start and end state, motion in numbers with the move's name).
2. The film in `studio/src/wave1/<film>/`, registered by its own `studio/src/wave1/<film>/entry.ts`. Do not edit
   `src/Root.tsx`, the kit, the parts, or another film's folder. If a part needs a change, copy nothing: wrap it
   or pass props; if it truly cannot do the job, say so in the report.
3. Sheet before the full render (`node ../capture/sheet.mjs --comp` does not know your entry, so render stills
   with `npx remotion still src/wave1/<film>/entry.ts <Id> <out.png> --frame=N` or render then
   `node ../capture/sheet.mjs <video> <sheet.png> <seconds>`). Fix what is plainly broken (the M, clipped or
   unreadable text, a jump, a dead frame) before reporting. Then the full render:
   `npx remotion render src/wave1/<film>/entry.ts <Id> out/w1/<Id>.mp4 --crf 16 --concurrency=2`
   (`--gl=angle` if it uses the laptop), and a sheet of it with one frame per beat plus the last frame, saved to
   `films/<film>/reviews/round-1-sheet.png`.
4. `npx tsc --noEmit` clean for your files. No git commits. Nothing to `~/Desktop/Motion` (the coordinator delivers).

## Report back
The film's one sentence, its length and format, composition id, mp4 and sheet paths, the beat list in one line
each, every place it bends a rule or relies on demo-only behaviour, and what is still weak.
