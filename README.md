# CampusAI Studio

Where CampusAI makes its videos and graphics: product films, reels, motion pieces, and edits of
footage you shot, with the real product on screen. Built on [Remotion](https://www.remotion.dev),
driven by Claude Code. Jacob and the team use this same studio, so every part and rule here is
the one he uses.

## Set up (Mac or Windows, about 10 minutes)

You need Git, Node 18+ ([nodejs.org](https://nodejs.org), the LTS button), Google Chrome and
Claude Code. On Windows also install [Git for Windows](https://git-scm.com/download/win) and, for
contact sheets, [Python](https://www.python.org/downloads/) (tick "Add python.exe to PATH"). Then
paste this in Terminal on a Mac, or in **Git Bash** on Windows (it comes with Git for Windows;
PowerShell will not run it):

```bash
curl -fsSL https://raw.githubusercontent.com/CampusAI-app/campusai-studio/main/install.sh | bash
```

That clones the studio into `~/CampusAI Studio/studio`, installs it, fetches the fonts, makes your
`~/CampusAI Studio/films` folder, and gives Claude Code the `studio` skill plus the skills in
`companion-skills/`. Run it again any time.

**It keeps itself current.** Each time Claude Code starts in the studio folder it pulls Jacob's
latest rules, parts and scripts (`scripts/update.sh`), so nobody runs `git pull`. If you changed a
file Jacob also changed, it keeps your version and Claude tells you.

## Make something

```bash
cd ~/CampusAI\ Studio/studio
claude
```

Tell Claude what you want ("cut my study spot interviews and end on CampusAI answering the
question"). It pitches an idea and a structure first; nothing gets built until you pick.

Useful on their own:

| Command | What it does |
|---|---|
| `npm run dev` | Opens Remotion Studio to watch any film in the browser |
| `npm run chat <film>` | Records the real CampusAI chat answering the question in `films/<film>/chat.json` |
| `npm run flow <film>` | Records your own path through the real demo, written as steps in `films/<film>/flow.json` |
| `npm run film <Composition>` | Renders a film to `out/` |
| `npm run still <Composition>` | Renders one image |
| `npm run sheet -- --comp <Composition> out.png 30,90,150` | One image with a frame from each beat |
| `npm run probe -- <file>` | A clip's exact length and size |

Try `npm run chat examples/study-spots.json` and `npm run flow examples/add-to-calendar.json`, then
`npx remotion studio src/kit/shelf-entry.ts` and open `Kit-ChatRecording` or `Kit-FlowRecording`.

## How work gets to Jacob

Finished pieces go to Jacob as a Base task (`Video review: <what it shows>`) with the file
attached. Nothing is posted until he says yes there. The full process is in `skill/SKILL.md`.

## Where things are

- `skill/` is the rulebook Claude follows: `SKILL.md`, one file per lane, `rules/campusai.md`.
- `src/kit/` holds the parts every film uses: brand colours, the page camera, the pointer, the logo
  moments, `ChatRecording`.
- `src/` holds every film made so far. They're worth copying from.
- `examples/` holds starter files.
- `companion-skills/` holds other skills the studio leans on (writing the hook), linked into
  Claude Code the same way.

## Good to know

- **The demo is the product on screen.** Everything is recorded from the public demo
  (campusai-demo.vercel.app), never a mockup. Its student, Maya Chen, is a made-up demo
  person, and so is her data.
- **Footage, music and renders never go in git.** `.gitignore` already keeps them out.
- **Licences:** Zodiak (ITF Free Font License) is fetched to each machine by `npm run fonts` and
  is never committed. Music comes from [Mixkit](https://mixkit.co), which is free for commercial
  use, and stays on your machine. The MacBook model in `public/four/laptop/` is by jackbaeten,
  CC-BY-4.0 (see its `LICENSE.txt`). Remotion has its own
  [licence terms](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
