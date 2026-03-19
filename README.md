<!-- markdownlint-disable MD033 -->

# <img src="assets/icon.svg" alt="Mobile Tools" height="24" /> Mobile Tools

Mobile Tools is a vanilla JavaScript PWA with everyday utilities in one app:
weather, world time, timer, stopwatch, calendar/date diff, unit converter,
calculator, text editor/analysis, and currency conversion.

- [ Mobile Tools](#-mobile-tools)
  - [✨ Features](#-features)
  - [🧱 Architecture](#-architecture)
    - [🚀 Startup Flow](#-startup-flow)
    - [🗂️ Module Responsibilities](#️-module-responsibilities)
  - [🧭 Project Structure](#-project-structure)
  - [⚡ Quick Start](#-quick-start)
  - [🌐 External APIs](#-external-apis)
  - [📄 License](#-license)

## ✨ Features

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
- Theme + language persistence 🎨🌐
- Offline shell via Service Worker + Manifest 📦

## 🧱 Architecture

### 🚀 Startup Flow

`index.html` loads `main.js` as an ES module.

`main.js`:

1. initializes theme
2. initializes i18n
3. exposes required handlers to `window` (for existing inline HTML handlers)
4. initializes navigation and all feature modules
5. initializes PWA registration
6. applies translations

### 🗂️ Module Responsibilities

- `main.js`: app bootstrap and init orchestration
- `state.js`: localStorage keys and storage helpers
- `dom.js`: shared DOM utilities
- `utils.js`: shared formatting and generic helpers
- `i18n.js`: translation loading and runtime language switching
- `i18n.json`: translation dictionary (`en`, `ru`)
- `theme.js`: light/dark theme handling
- `navigation.js`: page switching and last-page restore
- `weather.js`: weather UI/data/favorites/manual mode
- `world-time.js`: world clock and format toggle
- `timer.js`: timer logic and UI updates
- `stopwatch.js`: stopwatch and laps
- `calendar.js`: calendar rendering + date diff
- `converter.js`: unit conversion
- `calculator.js`: calculator logic, history, keyboard input
- `text-tools.js`: text transforms + metrics + copy feedback
- `currency.js`: rates loading and conversion
- `pwa.js`: service worker registration wrapper
- `scripts.js`: compatibility bootstrap for older cached app shells

## 🧭 Project Structure

```text
mini-tools/
├── index.html
├── styles.css
├── main.js
├── state.js
├── dom.js
├── utils.js
├── i18n.js
├── i18n.json
├── theme.js
├── navigation.js
├── weather.js
├── world-time.js
├── timer.js
├── stopwatch.js
├── calendar.js
├── converter.js
├── calculator.js
├── text-tools.js
├── currency.js
├── pwa.js
├── scripts.js
├── sw.js
├── manifest.webmanifest
└── assets/
```

## ⚡ Quick Start

Use an HTTP server (Service Worker requires non-file protocol).

Python:

```bash
python -m http.server 8000
```

Node.js:

```bash
npx serve .
```

Open `http://localhost:8000`.

Format all project files with Prettier:

```bash
npx prettier --write "*.{js,json,md,css,html,webmanifest}"
```

## 🌐 External APIs

- Open-Meteo (weather + forecast)
- Nominatim / OpenStreetMap (reverse geocoding)
- WorldTimeAPI (location time)
- ExchangeRate-API (currency rates)

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
