# Cambridge-Exam audio prototype

This is a dependency-free browser prototype. It uses static WAV files for Listening and the browser's `MediaRecorder` API for Speaking.

## Run locally

1. Generate the sample original listening audio:
   ```powershell
   .\scripts\generate-listening-audio.ps1
   ```
2. Serve the folder from the included local web server (microphone access requires `http://localhost` or HTTPS):
   ```powershell
   node .\scripts\serve-local.mjs
   ```
3. Open the localhost address shown by the command, then allow microphone access when prompted.

Opening `index.html` directly is enough for audio playback, but not consistently for microphone recording.

## Add a new listening item

1. Write an original teacher-only script.
2. Generate or place a WAV/MP3 in `audio/listening/`.
3. Add its `<audio>` source and student questions to `index.html`.
4. Do not place the transcript or correct answer in the student page.

## Speaking data

Recording is held as an in-memory browser `Blob` and preview URL. It disappears after refresh/close unless the learner selects **Save a copy**. No audio is uploaded or evaluated by this local prototype.

For GitHub Copilot or Codex, ask for changes such as: “Add Listening Part 2 using `audio/listening/diagnostic-part-2.wav`; keep the teacher transcript out of `index.html`.”
