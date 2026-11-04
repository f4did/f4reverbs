# F4 REVERBS

### Free local audio lab · Browser-first · No upload · No account · Installable PWA

F4 REVERBS is a futuristic, fully client-side music processing studio for turning ordinary tracks into slowed + reverb, phonk, funk, qawwali-inspired, nightcore, daycore, meditation and experimental edits.

This repository contains the production-ready static site. It can be opened locally, published from a Git repository, or installed as an app from a secure HTTPS deployment.

> **Your audio stays in your browser.** Files are decoded, processed, rendered and exported on your device.

![F4 REVERBS studio](../og.png)

## What makes it different

- **Genre lab presets** — PHONK, FUNK FLIP, QAWWALI AIR, SLOW + REVERB, NIGHTCORE, DAYCORE, TAPE GHOST and CLARITY BOOST are real parameter profiles, not decorative labels.
- **Frequency lab** — creative global tuning profiles at 396 Hz, 432 Hz, 528 Hz, 639 Hz, 741 Hz and 852 Hz, plus custom Hz input. The tool applies the mathematically correct pitch offset from A=440.
- **Real browser DSP** — playback speed, independent pitch, bass, treble, mid EQ, warmth, drive, wobble, vinyl texture, reverb, fade-in and fade-out.
- **Trim without leaving the studio** — set IN/OUT points, preview the range and export the selection.
- **Conversion deck** — choose the detected source format on the left, choose MP3 or WAV on the right, then export from the same row. MP4 audio is accepted when the browser can decode its audio track.
- **Local memory** — custom presets and recent sessions persist in browser storage. Nothing is uploaded.
- **Waveform-first workflow** — click or drag the waveform to scrub, loop sections, watch the master meter and export the exact sound you shaped.
- **Installable PWA** — add F4 REVERBS to your phone or desktop home screen, with a service worker for repeat/offline shell loading.
- **Static-host ready** — Next.js static export, no backend, no paid API and no server-side audio queue.

## Supported workflow

1. Open or drop an audio file, or an MP4 under **100 MB**.
2. Pick a genre profile or start from INIT.
3. Tune motion, pitch, EQ, reverb, texture, fades and the 396–852 Hz frequency lab.
4. Set the trim IN and OUT points if you only want a section.
5. Choose MP3 or WAV in the conversion row and export.

Browser codec support varies by browser and operating system. Chromium-based browsers usually provide the broadest MP3, M4A, OGG, WebM and MP4 decoding support.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3123`.

For a quick static preview, serve this folder with any local HTTP server and open its `index.html`. Opening the file directly may limit service-worker installation because browsers require HTTPS or localhost for PWA features.

## Build the static site

```bash
npm run typecheck
npm run build
```

The static site is written to `out/`. It can be hosted on GitHub Pages, Netlify, Cloudflare Pages, or any static file host. The project is configured with relative asset paths so the exported `index.html` also works from the project folder. HTTPS is required for PWA installation, except on `localhost`.

### Install as an app

Open the hosted site in a supported browser, then choose **Install app** or **Add to Home Screen** from the browser menu. The manifest, icons and service worker are already included in the static root. Audio files are still processed locally and are never cached by the service worker.

## Publish the repository

The deploy directory is `slowed-reverb-studio/`. Keep its contents together: `index.html`, `_next/`, `site.webmanifest`, `service-worker.js`, the CSS files, icons and `404.html` are all part of the hosted site.

### Cloudflare Pages

Cloudflare Pages is the recommended free host for this static app.

1. Push this repository to GitHub.
2. In Cloudflare, open **Workers & Pages → Create application → Pages → Connect to Git**.
3. Select the repository and configure the project:
   - **Root directory:** `slowed-reverb-studio`
   - **Build command:** leave empty
   - **Output directory:** `.`, or `slowed-reverb-studio` if the root is not set above
4. Deploy and open the generated HTTPS URL.

The site is already exported, so no server, API key or build step is required. HTTPS is important because browser installation and service workers are disabled on ordinary insecure URLs.

### GitHub Pages

GitHub Pages is also supported:

1. Push the repository to GitHub.
2. Open **Settings → Pages**.
3. Choose **Deploy from a branch**.
4. Select the branch and the `/slowed-reverb-studio` folder if the Pages configuration offers a folder selection.

If the Pages UI only publishes the repository root, move or copy the contents of `slowed-reverb-studio/` into the publishing root, preserving the relative `_next/` paths.

### Repository layout

```text
slowed-reverb-studio/
├── index.html                 # Main static entry point
├── 404.html                   # Branded not-found page
├── site.webmanifest           # Installable app metadata
├── service-worker.js          # Offline app-shell caching
├── f4-mobile-controls.js     # Phone transport and PWA registration
├── f4-ui.css                  # F4 responsive visual layer
├── scroll-fix.css             # Document scrolling fixes
├── _next/                     # Exported application assets
├── legacy/index.html          # Compatibility redirect
└── README.md
```

## Audio engine

The live and offline graphs share the same processing chain:

```text
buffer source → bass shelf → treble shelf → mid EQ → warmth filter → drive
             ↘ dry path → master
             ↘ reverb path → master
```

MP3 export uses the open-source `lamejs` encoder. WAV export uses a local PCM encoder. Fade envelopes are applied to the trimmed offline render and to live preview.

## Credits

Built and directed by **[@f4did](https://t.me/f4did) on Telegram**.

F4 REVERBS is a free local audio tool. Please credit the project when sharing modified versions, presets or screenshots. All processing is intended for creative use; always respect copyright and the rights of the original artists.

## Contributors

- **Farid / [@f4did](https://t.me/f4did)** — creator and developer

## Privacy

F4 REVERBS has no upload server and no account system. Audio decoding, playback, processing and export happen in the browser. Browser history and saved presets use local browser storage. The service worker caches only the application shell, never user audio.

## Contributing

Open an issue or pull request with a focused improvement, reproduction case or accessibility fix. Please test both desktop and narrow phone layouts before submitting UI changes, and keep the project free of paid services and backend requirements.

## License

MIT. See [LICENSE](LICENSE).

---

**F4 REVERBS / FREE LOCAL AUDIO LAB**  
**Developer:** [@f4did on Telegram](https://t.me/f4did)  
**Version:** 3.2.7
