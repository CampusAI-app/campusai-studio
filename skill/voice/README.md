# The CampusAI voice

`campusai-student.wav` is the studio's voice: a 20 year old college student, quick and upbeat,
talking to a friend. Jacob picked it on 2026-11-10 ("I think D") after three rounds. Earlier rounds
were rejected as too slow, too "classically AI" (Kokoro), and a "girl" voice that measured in the
male pitch range. This one sits around 215 Hz.

It is a made-up voice, not a real person, so no one's permission is needed and it is free to post.

## Use it

1. Install VoiceStudio (free, runs on your Mac):
   `brew tap debpalash/tap && brew install --cask debpalash/tap/voicestudio`, open it once, and
   finish its setup.
2. In VoiceStudio's models, install `mlx-community/VoxCPM2-8bit` and make it the active voice
   engine (family tts, backend mlx-audio).
3. Save this clip as a voice: Voices, new clone voice, upload `campusai-student.wav`, and paste
   this as its transcript:
   "Okay so. Classes, events, deadlines... all in different places, right? CampusAI puts it all
   in one place. You connect Canvas, and your assignments just show up on your week. So you
   actually know what's next."
   Name it `CampusAI student`.
4. Read a line with it:

```bash
curl -s -X POST localhost:3900/v1/audio/speech -H 'Content-Type: application/json' \
  -d '{"model":"mlx-audio","input":"YOUR LINE","voice":"CampusAI student","speed":1.1,"seed":7,"response_format":"wav"}' \
  -o line.wav
```

## Never

- Never use VoiceStudio's default engine, OmniVoice, or any of its model packs (fast, balanced,
  quality, max) for anything posted. Its weights are non-commercial (CC-BY-NC). VoxCPM2 is
  Apache-2.0, which is why this voice is made on it.
- Never swap in a different engine or seed and call it the CampusAI voice. If a line sounds off,
  re-read it with another seed on the same voice, then check it with Jacob.
