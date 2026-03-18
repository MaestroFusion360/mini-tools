# Mobile Tools

Mobile Tools is a lightweight PWA with everyday utilities in one app: weather, world time, calendar, unit converter, calculator, text analysis, and currency conversion.

## Features

- Weather by geolocation, including reverse geocoding and sunrise/sunset
- World time with 24h/12h toggle
- Calendar with detailed date difference calculation
- Unit converter with multiple categories and precision control
- Calculator with basic/scientific modes and history
- Text analysis (lines, words, characters, bytes, spaces, longest line)
- Currency converter with online rate refresh
- Light/dark theme and language toggle (English/Russian)
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
- `sin`, `cos`, `tan`
- `sqrt`, `ln`, `log`
- Factorial (`n!`)
- Constants (`π`, `e`)
- Powers, percentages, parentheses
- Expression history and backspace

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
├── scripts.js               # application logic
├── sw.js                    # service worker
├── manifest.webmanifest     # PWA manifest
└── assets/                  # icons
```

## External APIs

- Open-Meteo (weather)
- Nominatim / OpenStreetMap (reverse geocoding)
- WorldTimeAPI (time)
- ExchangeRate-API (currency rates)

If a network request fails, the app falls back gracefully.

## License

See [LICENSE](LICENSE).
