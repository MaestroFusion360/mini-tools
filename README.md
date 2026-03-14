# Mobile Tools

A multifunctional PWA that bundles several everyday utilities into one lightweight app: weather, world time, calendar, unit conversion, calculator, text analysis, and currency conversion.

## Features

- Weather by geolocation, including address lookup and sunrise/sunset times
- World time with 24-hour / 12-hour format toggle
- Calendar with detailed date difference calculation
- Unit converter with multiple measurement categories
- Calculator with basic and scientific modes
- Text analysis: lines, words, characters, bytes, spaces, and longest line
- Currency converter with online rate refresh
- Light and dark theme with saved preferences
- Language toggle (English / Russian)
- PWA support with offline caching of static assets

## Unit Converter

The unit converter includes:

- Length
- Area
- Volume
- Weight
- Speed
- Temperature
- Pressure
- Energy

It also provides:

- additional units such as nautical mile and Mach
- quick conversion presets
- adjustable result precision

## Calculator

The calculator supports:

- basic and scientific modes
- `sin`, `cos`, `tan`
- `sqrt`, `ln`, `log`
- factorial `n!`
- constants `π` and `e`
- powers, percentages, and parentheses
- calculation history
- backspace for deleting the last entered character

## Stability

The app includes:

- safer handling of network/API errors
- fallback behavior when external services are unavailable
- basic validation for calculator expressions

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Service Worker API
- Web App Manifest

## Quick Start

> Run the project through an HTTP server so the service worker can work correctly.

### Python

```bash
python3 -m http.server 8000

Open: http://localhost:8000

Node.js

npx serve .

Project Structure

mini-tools/
├── index.html               # main UI and tool pages
├── styles.css               # styles and responsive layout
├── scripts.js               # application logic
├── sw.js                    # service worker
├── manifest.webmanifest     # PWA manifest
└── assets/                  # icons

External APIs

The app uses public services:

Open-Meteo — weather data

Nominatim (OpenStreetMap) — reverse geocoding

WorldTimeAPI — current time

ExchangeRate-API — currency exchange rates


If a network request fails or a service is unavailable, the app falls back gracefully instead of breaking the interface.

License

See [LICENSE](LICENSE.md)
