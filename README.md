<!-- markdownlint-disable MD033 -->
<!-- markdownlint-disable MD039 -->

# <img src="assets/icon.svg" alt="Mobile Tools" height="24" /> Mobile Tools

Mobile Tools is a vanilla JavaScript PWA with everyday utilities in one app:
weather, world time, timer, stopwatch, calendar/date diff, unit converter,
calculator, text editor/analysis, currency conversion, todo/notes, and RSS news.

- [ Mobile Tools](#-mobile-tools)
  - [✨ Features](#-features)
  - [🧱 Architecture](#-architecture)
    - [🚀 Startup Flow](#-startup-flow)
    - [🗂️ Module Responsibilities](#️-module-responsibilities)
  - [🧭 Project Structure](#-project-structure)
  - [⚡ Quick Start](#-quick-start)
  - [🧪 Testing](#-testing)
  - [🧭 Playwright Layout Testing](#-playwright-layout-testing)
  - [📍 Geolocation Notes (Chrome/Firefox)](#-geolocation-notes-chromefirefox)
  - [🌐 External APIs](#-external-apis)
  - [📄 License](#-license)

## ✨ Features

- Todo + Notes 📋:
  - task list with visibility groups (All/Active/Done)
  - drag&drop sorting for tasks
  - notes cards with title + rich text editor
  - drag&drop sorting for notes cards
- RSS news 📰:
  - feed list management (add/remove/load)
  - import/export feeds JSON
  - news cards view (not history list)
  - swipe-right to mark item as read (muted card state)
- Weather 🌤️:
  - geolocation + reverse geocoding
  - manual coordinates mode
  - favorites + home point + city presets
  - current metrics (temperature, humidity, wind)
  - sunrise/sunset
  - forecast blocks (morning/day/evening/tomorrow)
- World time with 24h/12h toggle 🌍
- Timer (start/pause/resume/reset) ⏱️
- Stopwatch (start/pause/resume/reset + laps) 🏁
- Calendar 📅:
  - month navigation
  - clickable date picking for Date 1 / Date 2
  - range highlighting
  - detailed date difference calculator
- Unit converter with presets and precision slider 🔁
- Calculator 🧮:
  - basic/scientific mode
  - keyboard support (`0-9`, operators, Enter, Backspace, Delete, Escape, `^`)
  - history
- Text editor + analysis 📝:
  - actions: Copy, UPPER/lower/Title/Sentence, Trim, Normalize spaces, Remove empty lines
  - metrics: lines, chars, chars without spaces, UTF-8 size, words, spaces, max line, paragraphs, avg word length, reading time
- Currency converter with online refresh + fallback rates 💱
- Paint editor:
  - open/save PNG, undo/redo, clear
  - fullscreen mode (stable enter/exit)
  - crop/resize/rotate/mirror
  - filters: brightness, contrast, saturation
  - tools: brush, eraser (BackColor-based), text, pipette, fill
  - shapes: rectangle, ellipse, line, spline (2-step curve)
  - zoom in/out/reset + grid overlay
  - selection tool + Delete clears selected area
  - copy/paste with selection-aware behavior
  - Color + BackColor + Size are always in one row
  - text extras: text input + fonts panel
- Media player:
  - open local audio/video files
  - playlist select + previous/next controls
  - clear playlist
  - built-in HTML5 media controls (play/pause/seek/volume)
- Theme + language persistence 🎨🌐
- Offline shell via Service Worker + Manifest 📦

## 🧱 Architecture

### 🚀 Startup Flow

`index.html` loads `src/main.js` as an ES module.

`src/main.js`:

1. initializes theme
2. initializes i18n
3. exposes required handlers to `window` (for existing inline HTML handlers)
4. initializes navigation and all feature modules
5. initializes PWA registration
6. applies translations

### 🗂️ Module Responsibilities

- `src/main.js`: app bootstrap and init orchestration
- `src/core/state.js`: localStorage keys + centralized feature runtime state
- `src/core/dom.js`: shared DOM utilities
- `src/core/utils.js`: shared formatting and generic helpers
- `src/core/i18n.js`: translation loading and runtime language switching
- `i18n.json`: translation dictionary (`en`, `ru`)
- `src/core/theme.js`: light/dark theme handling
- `src/core/navigation.js`: page switching and last-page restore
- `src/features/weather.js`: weather UI/data/favorites/manual mode
- `src/features/world-time.js`: world clock and format toggle
- `src/features/timer.js`: timer logic and UI updates
- `src/features/stopwatch.js`: stopwatch and laps
- `src/features/calendar.js`: calendar rendering + date diff
- `src/features/converter.js`: unit conversion
- `src/features/calculator.js`: calculator logic, history, keyboard input
- `src/features/text-tools.js`: compatibility re-export for text editor module
- `src/features/text-editor/index.js`: text transforms + metrics + copy feedback
- `src/features/text-editor/state.js`: text editor runtime state slice
- `src/features/currency.js`: rates loading and conversion
- `src/features/paint.js`: compatibility re-export for paint module
- `src/features/paint/index.js`: paint module public entry
- `src/features/paint/api.js`: exported paint actions
- `src/features/paint/core.js`: paint internal canvas/UI/event logic
- `src/features/paint/fonts.js`: paint font discovery/options helpers
- `src/features/paint/pixels.js`: paint pixel/filter helpers
- `src/features/paint/state.js`: paint runtime state + constants
- `src/features/media-player.js`: media playlist and player controls
- `src/features/todo-notes.js`: todo tasks + notes cards/editor
- `src/features/rss-news.js`: RSS feed management and news cards
- `src/features/shared/time-format.js`: shared time formatting helpers for timer/stopwatch
- `src/core/pwa.js`: service worker registration wrapper

## 🧭 Project Structure

```text
mini-tools/
├── index.html
├── i18n.json
├── src/
│   ├── app.html
│   ├── icons.html
│   ├── main.js
│   ├── styles.css
│   ├── core/
│   │   ├── state.js
│   │   ├── dom.js
│   │   ├── utils.js
│   │   ├── i18n.js
│   │   ├── theme.js
│   │   ├── navigation.js
│   │   └── pwa.js
│   └── features/
│       ├── weather.js
│       ├── world-time.js
│       ├── timer.js
│       ├── stopwatch.js
│       ├── calendar.js
│       ├── converter.js
│       ├── calculator.js
│       ├── text-tools.js
│       ├── text-editor/
│       │   ├── index.js
│       │   └── state.js
│       ├── currency.js
│       ├── paint.js
│       ├── paint/
│       │   ├── index.js
│       │   ├── api.js
│       │   ├── core.js
│       │   ├── fonts.js
│       │   ├── pixels.js
│       │   └── state.js
│       ├── media-player.js
│       ├── todo-notes.js
│       └── rss-news.js
│   └── tests/
│       ├── paint.test.js
│       ├── media-player.test.js
│       ├── todo-notes.test.js
│       ├── rss-news.test.js
│       └── layout/
│           ├── layout.spec.js
│           └── paint-media.spec.js
├── sw.js
├── manifest.webmanifest
└── assets/
```

## ⚡ Quick Start

Use an HTTP server (Service Worker requires non-file protocol).

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.

## 🧪 Testing

```bash
npm install
npm test
```

Watch mode:

```bash
npm run test:watch
```

Format:

```bash
npx prettier --write .
```

New unit tests:

- `src/tests/paint.test.js`
- `src/tests/media-player.test.js`
- `src/tests/todo-notes.test.js`
- `src/tests/rss-news.test.js`

## 🧭 Playwright Layout Testing

Setup once:

```bash
npx playwright install chromium
```

Run layout tests:

```bash
npm run test:layout
```

## 📍 Geolocation Notes (Chrome/Firefox)

If geolocation works in Firefox but fails in Chrome, check:

1. Site permission in Chrome (`Allow` for Location).
2. Secure context (`https://`, `http://localhost`, or `http://127.0.0.1`).
3. OS-level location access (Windows Privacy -> Location).
4. DevTools sensor overrides (disable forced location).
5. Cached permission state (reset site settings and reload).

The app already handles denied/failed location and supports manual coordinates as fallback.

## 🌐 External APIs

- Open-Meteo (weather + forecast)
- Nominatim / OpenStreetMap (reverse geocoding)
- WorldTimeAPI (location time)
- ExchangeRate-API (currency rates)
- rss2json (RSS feed parsing proxy)
  If any network request fails, the app falls back safely where possible.

## 📄 License

See [LICENSE](LICENSE).

<p align="center">
  <a href="https://github.com/MaestroFusion360/mini-tools/issues">
    <img src="https://img.shields.io/github/issues/MaestroFusion360/mini-tools" alt="Issues" />
  </a>
  <a href="https://github.com/MaestroFusion360/mini-tools/stargazers">
    <img src="https://img.shields.io/github/stars/MaestroFusion360/mini-tools" alt="Stars" />
  </a>
</p>

<p align="center">
  <img src="https://komarev.com/ghpvc/?username=MaestroFusion360-mini-tools&label=Project+Views&color=blue" alt="Project Views" />
</p>
