# Lane: editing

Footage Jacob (or anyone) recorded: cut it, caption it, sound it, colour it. Talking heads start
here and add `talking-heads.md`.

## Cutting
- **Cut on what is said, not on a frame number.** Transcribe first, then anchor scenes, zooms
  and callouts to transcript phrases, so a re-recorded take or a trimmed pause re-times the edit.
- Exact durations and frames for any clip: `npm run probe -- <file>`.
- Cut dead air and false starts freely; never cut inside a word.
- Footage goes in `studio/public/<film>/`, the brief names each file by path.

## Captions (word level)
**Not set up yet (2026-10-23):** WhisperX is installed on no machine, Jacob's included, and the
studio has no caption command. Until it does, captions come burned in from the person's own editor
(CapCut, as Ashley's study spot cut did) and the studio keeps clear of them. The rules below are
the target for when it is built.

Transcribe with **WhisperX** (`m-bain/whisperX`): a timestamp on every word, not every sentence.
That difference is most of what separates produced captions from automatic ones.
- One timing shape: lines, each with words `{ w, start, end, conf }` in seconds, saved to
  `films/<name>/captions.json`; convert to frames only at the last step. Check low-confidence
  words first.
- **Never highlight ahead of the voice.** Show the line dim up to 0.3 to 0.4 s before its first
  word, light each word from its exact start, return finished words to normal ink. A word held
  longer than 0.6 s lights over its first 0.4 s, so pauses never crawl. The wipe is the word drawn
  twice, the bright copy clipped to `inset(0 X% 0 0)`.
- **Fix the aligner where it is late:** pull starts back on s, sh, f and th; keep a per-film table
  of manual fixes with a reason each; spell our words phonetically for it (CampusAI, UMD, GPA,
  Got60). Separate the voice from music first only when music sits under the speaker.
- An MP3 carries about 23 ms of encoder delay, visible on a word wipe: analyse WAV.
- Caption placement: below the footage over a product; outside the face-safe zone over a person.
  Chunked lines that slam in two or three at a time are a style choice for a piece, not the system.
- Caption reading time follows the Studio rule: at least the line plus 0.6 s.

## Sound and colour
- Music and effects only from `shots/audio/`. Duck music under speech; let silence land.
- Colour: match every clip to one look before anything else; never grade the product's own UI.

## Tools
- WhisperX for transcription (the `remotion-captions` skill's whisper.cpp route is not ours).
- `video-use` (browser-use, MIT) is the candidate for automated talking-head cutting; NOT adopted.
  It needs the adoption gate (read in place, sandbox, security pass) and calls paid ElevenLabs
  Scribe, so ask Jacob before using it.
