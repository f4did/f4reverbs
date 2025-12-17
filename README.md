# Slowed Reverb Studio

A lightweight, browser-based **slowed + reverb** audio tool built with **HTML/CSS/JavaScript** and the **Web Audio API**. Drop in an audio file, tweak settings, and play the result locally in your browser (no uploads, no backend).

## Demo

- GitHub Pages: `https://tyluur.github.io/slowed-reverb-studio`

## Features

| Feature | What it does |
|--------|---------------|
| Local audio processing | Runs entirely in your browser (no server) |
| Slowed / speed control | Adjust playback speed for the “slowed” vibe |
| Reverb | Adds space/ambience using a reverb effect |
| Simple controls | Minimal UI with quick iteration |
| Static hosting friendly | Works great on GitHub Pages |

## Tech Stack

| Layer | Tech |
|------|------|
| UI | HTML + CSS |
| Logic | JavaScript |
| Audio Engine | Web Audio API |
| Hosting | GitHub Pages (static) |

## Project Structure

| File/Folder | Purpose |
|------------|---------|
| `index.html` | App shell + UI markup |
| `style.css` | Styling |
| `script.js` | Audio graph + controls logic |

## Getting Started

### Run locally

| Method | Steps |
|--------|------|
| Simple (recommended) | Use VS Code **Live Server** extension and open `index.html` |
| Python quick server | `python -m http.server 5173` then open `http://localhost:5173` |
| Node quick server | `npx serve .` then open the shown local URL |

> Some browsers restrict file/audio APIs when opened via `file://`. Running a local server avoids that.

### Deploy to GitHub Pages

| Step | Action |
|------|--------|
| 1 | Repo → **Settings** |
| 2 | **Pages** |
| 3 | Source: **Deploy from a branch** |
| 4 | Branch: `main` |
| 5 | Folder: `/ (root)` |
| 6 | Save → wait for the Pages URL to appear |

## Usage

| Action | How |
|-------|-----|
| Load audio | Use the file picker (or whatever the UI exposes) |
| Adjust slowdown | Change the speed/playback control |
| Adjust reverb | Increase/decrease reverb amount |
| Listen | Hit play and tweak in real time |

## Notes / Limitations

| Topic | Details |
|------|---------|
| Audio format support | Depends on the browser (MP3/WAV/etc.) |
| Quality | “Slowed” via playback rate is not the same as high-quality time-stretching |
| Reverb | Depends on how the reverb is implemented (impulse response vs synthetic) |

## Roadmap

| Idea | Why it’s useful |
|------|------------------|
| Export/download processed audio | Let users save the result |
| Presets (Drake, Vaporwave, etc.) | Quick vibes without fiddling |
| Better time-stretch | Keep pitch stable while slowing down |
| Mobile-friendly UI | Improve touch controls |
| Reverb IR selection | Different rooms/plates/halls |

## Contributing

| Step | What to do |
|------|------------|
| 1 | Fork the repo |
| 2 | Create a feature branch |
| 3 | Make changes + test in browser |
| 4 | Open a PR |

## License

Add a license file (MIT is common for projects like this) if you want others to reuse it.
