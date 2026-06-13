# Media Manifest - grocapitus-investor-tools Proposal

## Demo Assets (Rental Calculator) - Top Level
Captured from local demo: `http://localhost:8231/demos/grocapitus-investor-tools/`

| File | Size | Dimensions | What it shows |
|------|------|-----------|---------------|
| `hero.png` | 248 KB | 1280x800 | Full hero view: calculator interface with input fields, metrics panels, and verdict chip |
| `step-1.png` | 248 KB | 1280x800 | Initial state (above the fold) |
| `step-2.png` | 239 KB | 1280x800 | After rent slider adjustment to $3000 (metrics updated) |
| `step-3.png` | 239 KB | 1280x800 | After manual input adjustment to $2600 (verdict and cash flow metrics updated) |
| `page.png` | 377 KB | 1280x800+ | Full-page screenshot |
| `demo.webm` | 520 KB | 1280x800 | Screen recording of hero flow: adjusting rent input and watching metrics + verdict update live |
| `demo.gif` | 999 KB | 1280x800 | GIF version of demo recording (ffmpeg conversion) |

## Portfolio Assets - `/portfolio` Folder

### Captured via Playwright (Live URLs)

| File | Size | Dimensions | Source | What it shows |
|------|------|-----------|--------|---------------|
| `growyard-hero.png` | 522 KB | 1280x800 | https://mwegter95.github.io/growyard/ | Garden planning app home screen |
| `life-dashboard-hero.png` | 210 KB | 1280x800 | https://mwegter95.github.io/life-dashboard/ | Life tracking dashboard interface |

### Copied from Existing Portfolio (Source: `/michaelwegter.com/public/screenshots/`)

| File | Size | Dimensions | Original Name | What it shows |
|------|------|-----------|----------------|---------------|
| `stage-hero.png` | 2.0 MB | 1280x800 | `gallery_wall_planner_wall_warp_perspective.png` | Gallery Wall Planner: perspective view of wall layout |
| `stage-drag-and-drop-demo.mp4` | 1.3 MB | Video | `gallery_wall_planner_drag_and_drop_main_demo.mp4` | Gallery Wall Planner: drag-and-drop interaction flow |
| `ssut-main.png` | 1.2 MB | 1280x800 | `ssut_main_screenshot_playlist_extractor_to_text.png` | SSUT: playlist extraction interface |
| `ssut-playlist-builder.png` | 1.2 MB | 1280x800 | `ssut_playlist_builder_from_list.png` | SSUT: playlist builder from list feature |

## Summary
- **Demo media (7 assets):** 3 PNG stills capturing key calculation states, 1 webm recording, 1 gif conversion, 2 full-page refs
- **Portfolio media (6 assets):** 2 live-captured hero stills (Growyard, Life Dashboard), 2 copied hero stills (Stage, SSUT), 1 copied demo video (Stage drag-drop)
- **Total files:** 13 assets, all non-empty, ready for proposal deck and one-pager

## Capture Notes
- Demo capture used flow file with three interaction steps: initial load, rent slider increase to $3000, manual input adjustment to $2600
- Growyard and Life Dashboard captured from live GitHub Pages URLs without interaction (first-paint hero only)
- Stage and SSUT assets copied from existing portfolio as per research.md section 6 (no new capture needed for these)
- All media at 1280x800 viewport (2x device scale factor for crispness)
- No console errors on any captures
