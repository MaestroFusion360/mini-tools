# Mobile Tools

Mobile Tools is a lightweight PWA with everyday utilities in one app: weather, world time, timer, stopwatch, calendar, converters, calculator, and text editor tools.

## Features

- Weather by geolocation, reverse geocoding, sunrise/sunset, manual coordinates, favorites, home point, and city presets
- World time with 24h/12h toggle
- Timer (hours/minutes/seconds, start/pause/resume/reset, status)
- Stopwatch (start/pause/resume/reset, lap list)
- Calendar with month navigation, day click-to-pick for Date 1/Date 2, range highlighting, and detailed date difference calculation
- Unit converter with multiple categories, precision control, and presets
- Calculator with basic/scientific modes, keyboard input support, and history
- Text editor + analysis: copy, case transforms, cleanup actions, and extended live metrics
- Currency converter with online rate refresh and fallback behavior
- Light/dark theme and language toggle (English/Russian)
- Inline SVG icon sprite (theme-aware icon coloring)
- Offline support via Service Worker + Web App Manifest

## Unit Converter Categories

- Length
- Area
- Volume
- Weight
- Speed
- Temperature
- Pressure
- Energy

## Calculator Capabilities

- Basic and scientific modes
- Keyboard input: `0-9`, `.`, `+ - * / %`, parentheses, `Enter`, `=`, `Backspace`, `Delete`, `Escape`, `^`
- `sin`, `cos`, `tan`
- `sqrt`, `ln`, `log`
- Factorial (`n!`)
- Constants (`π`, `e`)
- Powers, percentages, parentheses
- Expression history and backspace

## Text Editor & Analysis

### Actions

- Copy to clipboard (with animated feedback)
- UPPERCASE
- lowercase
- Title Case
- Sentence case
- Trim
- Normalize spaces
- Remove empty lines

### Metrics

- Lines
- Characters
- Characters without spaces
- UTF-8 size (bytes/KB)
- Words
- Spaces
- Longest line
- Paragraphs
- Average word length
- Estimated reading time

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Service Worker API
- Web App Manifest

## Quick Start

Run through an HTTP server so the Service Worker can register.

### Python

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.

### Node.js

```bash
npx serve .
```

## Project Structure

```text
mini-tools/
├── index.html               # main UI and tool pages
├── styles.css               # styles and responsive layout
├── main.js                  # application bootstrap (ES modules)
├── state.js                 # shared storage/state helpers
├── dom.js                   # shared DOM helpers
├── utils.js                 # shared utilities
├── i18n.js                  # translations API
├── i18n.json                # translation dictionary
├── theme.js                 # theme handling
├── navigation.js            # page navigation
├── weather.js               # weather tool
├── world-time.js            # world time tool
├── timer.js                 # timer tool
├── stopwatch.js             # stopwatch tool
├── calendar.js              # calendar/date diff tool
├── converter.js             # unit converter
├── calculator.js            # calculator
├── text-tools.js            # text editor/analysis
├── currency.js              # currency converter
├── pwa.js                   # PWA registration
├── scripts.js               # compatibility bootstrap
├── sw.js                    # service worker
├── manifest.webmanifest     # PWA manifest
└── assets/                  # static assets (app icon, favicons)
```

## External APIs

- Open-Meteo (weather)
- Nominatim / OpenStreetMap (reverse geocoding)
- WorldTimeAPI (time)
- ExchangeRate-API (currency rates)

If a network request fails, the app falls back gracefully.

## License

See [LICENSE](LICENSE).
