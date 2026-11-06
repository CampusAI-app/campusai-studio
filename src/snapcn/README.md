# snapcn parts (taken 2026-11-06)

Free Remotion components from snapcn (github.com/shadcn-labs/snapcn, MIT, see `LICENSE`), taken from
commit `9c57e1b6196d7c895d74ec52934298120b22ffb6` on 2026-11-06, from Jacob's Muse send ("Need asap").
Only the free `registry/snap-cn/` and `registry/snap-cn-ui/core` code. snapcn's paid Pro items live on
their server and were never fetched.

Import a part from its folder, for example `import { TextReveal } from "../snapcn/text-reveal"`.
Shared helpers are in `ui/`. Worked example: `src/snapcn-sample/SnapcnSample.tsx` (composition
`SnapcnSample-9x16`). The parts measure text on mount, so load the brand face before they mount (the
sample shows how).

## Taken (30)

Titles and type: text-reveal, text-highlight, text-rewrite, text-select, text-swap, text-swell,
text-build, word-flip, word-gather, word-wheel, type-morph, punch-lines, spec-sweep, drop-line,
hello-zoom, portal-intro.
Captions: word-captions, karaoke-captions.
Logo moments: block-wordmark, wordmark-cut, cut-lockup, sky-lockup, title-sweep, logo-assemble,
logo-collapse, logo-drift, logo-flicker.
Other: dot-bloom (transition), count-grid (stat grid), cursor-track (a cursor only).

## Changed from snapcn's copy

- Import paths point at `../ui` and `../text-reveal`. snapcn's website customizer files (`config.ts`)
  and tests were not taken.
- `ui/color.ts` is rewritten without the `culori` package (same function names and behaviour), so no
  new dependency.
- `ui/fonts.ts` loads Inter only (snapcn loaded six Google families on import). Pass any other face,
  such as Zodiak, as a CSS family name.
- Default images and logos that pointed at snapcn's own CDN (logo-assemble, logo-flicker,
  logo-collapse, count-grid, portal-intro, sky-lockup) now point at our local
  `public/brand/campusai-logo-white.svg`, so nothing is fetched from snapcn and their showcase pictures
  can never end up in a film. Always pass real images.
- word-captions and karaoke-captions: the presets that shipped in all caps are now sentence case.

Still in the code, worth knowing: cut-lockup and sky-lockup default to snapcn's own mark as SVG path
data (pass ours); portal-intro loads the Geist font from cdn.jsdelivr.net at render; count-grid's
label counts up (five to five hundred by default), so only use it with a true number.

## Left out, and why

- Fake device or browser chrome: phone-frame, laptop-frame, phone-stack, terminal-simulator (also
  monospace), capture-reveal (draws a browser window).
- Fake chat or product UI (CampusAI is only ever shown from real captures): answer-stream,
  answer-highlight, channel-thread, prompt-send, prompt-zoom, click-type, agent-steps, search-typing,
  follower-rush, roster-grant, button-press, status-cycle, check-cycle.
- Monospace: font-shuffle (cycles through a mono face; also loads fonts from jsdelivr), bloom-lockup
  (Geist Mono tagline, plus a wall of snapcn's stock pictures).
- Needs `@paper-design/shaders-react`: pulsing-border.
- Not needed this pass, image galleries built on snapcn's stock pictures: announce-title,
  gather-lockup, hero-launch, moodboard-reveal, orbit-gallery, reel-collage, reel-wall, card-rail,
  orb-swarm, screen-recording.

## Security pass (read only, nothing from the clone was installed or run)

Grepped every taken file for fetch, XMLHttpRequest, http(s) URLs, eval, `new Function`, process,
child_process, fs, dynamic imports, analytics, storage, cookies and sockets. None of the code calls
out. The only remote references were default image, video and font URLs on snapcn's CDN, jsdelivr and
picsum; the taken files' image defaults were replaced as above.
