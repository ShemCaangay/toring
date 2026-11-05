# TORING website

A static, dependency-free site (HTML + CSS + one JS file, raw WebGL) in the **same theme as the app**: the widget's own tokens (backdrop gradient, drifting blobs, cursor highlight, liquid-glass fill + rim, black text, grayscale hierarchy, JetBrains Mono with thin weight for big lines) and green only for the live status dot. Open `index.html` through any static server, e.g. `npx serve site` or `python -m http.server -d site`.

- **Structure** follows the reference video: fixed nav (logo tile, hanging island with links, download button), one pinned stage with seven scroll-driven scenes, letter-by-letter blur reveals, floating cards, a closing call-to-action and footer.
- **Particle shapes** (graphite ink on the light glass) each mean something: seed head (hero), orbiting tokens, a box with dust inside (stays on this PC), CPU candlesticks, a wireframe bell (alerts), tick-mark rings (limit bars), the live ring (download).
- **Download**: on load the page asks `api.github.com/repos/ShemCaangay/toring-updates/releases/latest` and points every download control at that release's `.exe` (version, size and accessible names come from it; the island's status dot is green + pulsing once the release was reached, amber if not). If GitHub is unreachable the buttons fall back to the latest-release page. Publishing a new release updates the site automatically.
- **Screenshots** (`img/*.webp`) are the real TORING UI running against an isolated instance with *sample* usage data and a stand-in plan-limit provider (no personal data); the System shot is cropped above the process list.
- **Fonts** (`fonts/`): JetBrains Mono (SIL OFL), the same files as the app.
- `prefers-reduced-motion` turns off transitions and ambient animation (scenes still follow the scroll); `prefers-reduced-transparency` makes the glass opaque.
- Hosting: any static host works (GitHub Pages, Netlify, ...). The folder is not part of the installer (`package.json` build.files is an allow-list).
