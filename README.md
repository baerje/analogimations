# Analogimations

A collection of interactive animations. The home page is a catalog of cards; each animation has its own page under `animations/`.

Live site: https://baerje.github.io/analogimations/

| Animation | Page |
| --- | --- |
| Pressure Vessel Mixer | [animations/pressure-vessel/](https://baerje.github.io/analogimations/animations/pressure-vessel/) |

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | The catalog page. Built from `catalog.json`; don't edit by hand. |
| `catalog.json` | Site title and intro, and the list of animations (id, title, short name, blurb, tags). |
| `animations/<id>/src/index.html` | The source of one animation. Edit this. It links the shared files, so it also opens directly in a browser. |
| `animations/<id>/src/icon.png` | Its home-screen icon (square, 512px or larger). |
| `animations/<id>/index.html` | The built page, with the shared files inlined so it works on its own. Plus `apple-touch-icon.png`, `icon-512.png`, `manifest.webmanifest`. |
| `animations/<id>/thumb.png` | Catalog thumbnail (640x360). |
| `shared/analog.css` | Shared palette (light and dark), fonts, page layout, control chips over a 16:9 diagram, full-screen show mode, phone rules. |
| `shared/analog.js` | Shared behavior: `Analog.showMode` (Full screen button, opens full screen from the iPad home screen), `Analog.fitDiagram` (scales the controls with the diagram, phone and "turn sideways" classes), `Analog.drawDial` (gauge), `Analog.watchColors` (dark mode colors for canvas drawing). |
| `tools/build.py` | Builds every animation and the catalog. |
| `tools/thumbs.js` | Regenerates the thumbnails. |

## Making changes

1. Edit `animations/<id>/src/index.html` (or a file in `shared/`, which affects every animation).
2. Run `python3 tools/build.py` (needs Python 3 with Pillow).
3. If the diagram looks different, run `node tools/thumbs.js` (needs Node with Playwright), then `python3 tools/build.py` again.
4. Commit the source and the built files, and push to `main`. GitHub Pages updates in a minute or two.

## Adding an animation

1. Copy `animations/pressure-vessel/src/` to `animations/<new-id>/src/` and replace the diagram and its script. Keep the page structure (`.show` holding `.presets`, `.stage` with the canvas and `.hud`, and `.bar` with a `#full` button) and the calls to `Analog.showMode` and `Analog.fitDiagram`, and it gets the iPad full screen and phone sideways behavior for free.
2. Replace `src/icon.png`.
3. Add an entry to `catalog.json`.
4. Run the build steps above.

## Hosting

GitHub Pages serves `main`, folder `/ (root)` (Settings → Pages → Deploy from a branch). On an iPad, open an animation's page in Safari and use **Share → Add to Home Screen** to get a full-screen app for it.

## Pressure Vessel Mixer: how it behaves

Three sources push colored particles into a vessel, the particles mix, and the mixture leaves through an outlet valve and sprays into the open air.

- Pressures are in bar, 0 to 10. The vessel reads 10 bar when it holds 400 particles.
- A source flows only while its pressure is above the vessel's. It never flows backward.
- Inflow = 14 particles/s × hand valve opening × (source pressure − vessel pressure).
- Outflow = 16 particles/s × outlet valve opening × vessel pressure.
