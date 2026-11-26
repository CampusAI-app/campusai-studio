---
name: laptop-night
description: Product film template from the CampusAI studio. Makes a real laptop on a warm dark desk at night: real UMD pages pile onto the screen and collapse into the CampusAI dashboard, captions build at the top with one red word, the camera pushes in on each real thing, with optional narration (Feature Friday). Use when someone types /laptop-night with a subject, or asks for this look by name.
---

# /laptop-night

A template built from one of Jacob's best recent product films, with the look and the motion kept and the content swapped
for yours. Read the studio skill first (`skill/SKILL.md` and `rules/campusai.md`, "Styles from the recent films"); all
of it applies. The look is the structure, so skip the idea and structure pitch, but never the facts: every word and
number on screen goes in `films/<name>/facts.md` with its source, and if a source is missing, stop and ask.

1. Read the props at the top of `src/templates/LaptopNight.tsx`; every field is explained there.
2. Copy `src/templates/laptop-night.example.json` to `films/<name>/props.json` and change only the content.
3. Record the product fresh on this computer: `npm run flow` for pages and presses, `npm run chat` for the chat
   answering (their headers say how), so the screens are real and current. Paths in the props are under `public/`.
4. Render: `npx remotion render src/templates/laptop-night-entry.tsx Template-LaptopNight-9x16 out/<name>.mp4 --props=../films/<name>/props.json --gl=angle`
5. Look at a contact sheet and frame 0 before handing it over, then run the review loop in `skill/review.md`.

Sound effects, music, voice and photos that are not on this computer are left out on their own, so a first render always
works. A missing capture or clip stops the render with a message saying how to make it.
