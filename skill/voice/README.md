# The CampusAI voice

**Made with ElevenLabs now (Jacob, 2026-11-24).** VoiceStudio is uninstalled; never open it or
call localhost:3900. Use the ElevenLabs MCP (`elevenlabs`, hosted at
https://api.elevenlabs.io/v1/mcp, sign in once through `/mcp`) signed in to the CampusAI
workspace, which is on an ElevenLabs grant plan (paid level, so posted work is covered).

The voice is an ElevenLabs instant clone of `campusai-student.wav`, named `CampusAI student`:

- **Voice id:** `g6PlIofSO4V6imLxqaGU`
- **Model:** `eleven_v4`

`campusai-student.wav` is the studio's voice: a 20 year old college student, quick and upbeat,
talking to a friend. Jacob picked it on 2026-11-10 ("I think D") after three rounds. Earlier rounds
were rejected as too slow, too "classically AI" (Kokoro), and a "girl" voice that measured in the
male pitch range. This one sits around 215 Hz.

It is a made-up voice, not a real person, so no one's permission is needed to clone it.

## Use it

Read a line with the ElevenLabs MCP:

```
mcp__elevenlabs__creative_generate_speech
  prompt:   "YOUR LINE"
  model_id: "eleven_v4"
  voice_id: "g6PlIofSO4V6imLxqaGU"
```

It returns two takes on a flow. Get the files with `mcp__elevenlabs__creative_get_generations`
(the `flow_id` and the `pending` generation ids from the result), then download each
`full_res_url` with curl. Each call spends credits, so never call it again to retry.

## Trial reels: the voice (Jacob, 2026-11-24)

**Victor is the trial reel voice.** Victor, Casual and Friendly (library), `ArXfhUVzPRAarfbwzkDv`, on `eleven_v4`.
Rejected by Jacob on 2026-11-24 after hearing them on a real reel: `CampusAI student` and Jessa ("really don't like"),
Knox `cgLpYGyXZhkyalKZ0xeZ` (too deep, does not sound like a frat bro), and the workspace's `Fratboy_Campusai` (not frat
enough). The plan of two girls and two guys is on hold until replacements are picked.

**When a voiced reel has type on screen, the voice says exactly the type, and the type lands as it is said.**
- The voice starts at the hook and introduces the piece with the hook's own words, not only the end (round 2 note).
- One generation per line (not a whole script in one call), each opened with a light delivery cue that fits the
  speaker (`[casually]`, `[curious]`, `[warmly]`, `[confident]`) and breath written in as ellipses or `[short pause]`.
  The words stay exactly the screen's; cues and ellipses are not spoken. Read `creative_get_model_guide` for
  `eleven_v4` first. This is the method from the Love Island voice tests, which Jacob said did not sound AI (Nov 24).
- Transcribe each take with ElevenLabs Scribe (`mcp__elevenlabs__creative_transcribe_audio` on the take pinned with
  `creative_add_flow_asset_node`) and time each word on screen to its spoken start, two frames early. Measure where the
  sound really starts and stops on each take; Scribe pads a sentence's last word.
- No screen is only words (Jacob, Nov 24): a line plays over the product it describes, its words small above the
  product on a soft white band, landing as said. On a product page, the voice can say the page's own headings as the
  camera reaches them (no extra words on screen). A person on camera keeps their captions on the footage.
- Never speed the voice to fit; give the shot the time, or cut a line.
- Level the take to any real voice in the piece before the mix (speech frames, not the whole file): the loudness pass
  rides gain dynamically and hides the imbalance afterwards.
- Worked example: the six `PostHowdoRemake-Who*/Week*-9x16` trial reels in `src/trials/post-howdo-remake.tsx` (the
  `VO` table, `CUTS`, `VoHead`, `VoTerp`); the `...Text` ones are the same cut with the voice off.

Lines in a speaker's own words (`[laughs] Bro...`) are for a voice with no type on screen. Square-bracket tags like
`[laughs]` are delivery cues `eleven_v4` performs, not words it reads. Use one or two, never a pile.

## If the clone ever has to be remade

The MCP has no clone tool, so it is made on the site: elevenlabs.io, Voices, Create Voice,
Instant Voice Clone. Upload `campusai-student.wav`, untick "Remove background noise" (the clip is
already clean), name it `CampusAI student`, tick the rights box, Save voice. The site does not ask
for a transcript. For the record, the clip says: "Okay so. Classes, events, deadlines... all in
different places, right? CampusAI puts it all in one place. You connect Canvas, and your
assignments just show up on your week. So you actually know what's next."

## Never

- Never use VoiceStudio again, or its default engine, OmniVoice, or any of its model packs.
  Its weights are non-commercial (CC-BY-NC).
- Never swap in a different voice or model and call it the CampusAI voice. If a line sounds off,
  pick the other take or read it again on the same voice, then check it with Jacob.
