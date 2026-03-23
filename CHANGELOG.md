# Changelog

## Unreleased - 2026-03-23

### Highlights

- Todo/Notes:
  - Added a shared search field with inline search/clear icons.
  - Search now filters both tasks and notes and persists between sessions.
  - Notes action layout was stabilized so Add/Delete are kept on a dedicated row.
  - Unified Add/Delete heights and fixed responsive wrapping behavior.
- Currency Converter:
  - Added preset pairs in Converter-style chips: `RUB→USD`, `RUB→EUR`, `RUB→TRY`, `RUB→THB`.
  - Currency captions and option labels were improved for readability (`CODE - Name`).
  - Currency display names moved to `src/data/currency-names.js` for cleaner data separation.
  - Added extra localized currency names: `BYN`, `UZS`, `KGS`, `AMD`, `AZN` (plus `THB`, `KRW`, `ARS`).
- Header/UI fixes:
  - Fixed overlap of Back button with burger menu in intermediate viewport widths.
  - Removed unwanted delete/clear button motion to avoid jumpy interactions.

## v1.1.2 - 2026-03-23

### Added

- QR Generator:
  - Text/URL input, QR image generation, clear action, and PNG download.
- Emoji Catalog:
  - Full catalog generated from library data.
  - Search, category filtering, and one-tap emoji copy.
- Budget:
  - Income/expense tracking with running balance.
  - Limit, totals, filtering, and entry management.
  - Currency selector (`USD`, `EUR`, `RUB`) and category dropdowns.

### Changed

- Emoji rendering switched to cleaner Twemoji-based visuals for consistent cross-device look.
- Header controls (burger/back/theme/language) aligned to consistent heights on mobile.
- Overflow menu content simplified:
  - removed GitHub/Telegram buttons (links remain in About),
  - changelog content moved to JSON-driven rendering.
- Notes editor viewport on small screens tuned for better usability.
- Tasks/Notes/Budget action buttons unified to a cleaner style (including compact ghost delete actions).

### Internal

- Added `scripts/generate-emoji-catalog.mjs` for emoji dataset generation.
- Added `scripts/set-version.ps1` to update project version across key files.
- Version and release metadata updated to `1.1.x` across app/footer/changelog/package files.

## v1.0.0 - 2026-03-22

### Features

- PWA shell with offline support (Service Worker + Manifest).
- Light/Dark theme toggle and EN/RU localization with persistence.
- Mobile/desktop adaptive multi-tool UI with card-based pages.

- Todo + Notes:
  - Tasks with add/toggle/remove, filters (All/Active/Done), clear completed.
  - Drag-and-drop sorting for tasks and note cards.
  - Notes editor with rich text actions (bold/italic/underline/strike/ordered list/link), quick add/save, and card previews.
- RSS News:
  - Feed add/remove/load, import/export JSON.
  - Grouped cards (today/yesterday/week/older), read-later mode.
  - Swipe-to-read with gesture feedback animation and threshold commit.
- Weather:
  - Geolocation + reverse geocoding.
  - Manual coordinates, favorites/home point, city presets.
  - Current metrics, sunrise/sunset, and forecast blocks.
- World Time:
  - Timezone selection and 24h/12h format toggle.
- Timer:
  - Start/pause/resume/reset with status updates.
- Stopwatch:
  - Start/pause/resume/reset and lap tracking.
- Calendar + Date Difference:
  - Month navigation, date picking/range highlighting, detailed date diff.
- Unit Converter:
  - Multiple categories, presets, precision slider, swap units.
  - Added mm-inch primary preset and convert action button.
- Calculator:
  - Basic/scientific modes, memory/history, keyboard support.
- Text Editor/Tools:
  - Case transforms, trim, normalize spaces, remove empty lines.
  - Search/replace flow and text metrics.
- Currency Converter:
  - Online rates refresh with built-in fallback rates.
- Paint:
  - Open/save PNG, undo/redo, clear.
  - Crop/resize/rotate/mirror, filters, zoom/grid.
  - Tools: brush/eraser/text/pipette/fill, shapes, selection, copy/paste.
  - Compact mobile toolbar UX.
- Media Player:
  - Local audio/video playlist, previous/next, clear list.
  - Hidden native player when playlist is empty with empty-state placeholder.

### UI/UX

- Left-top animated hamburger (always visible) with mobile off-canvas sidebar.
- Sidebar quick badges for GitHub/Telegram and About action pinned to the bottom.
- Lightweight About modal with app name, short description, and links.
- Mobile header title centering fixes to avoid overlap with hamburger.
- Tasks controls and Notes actions optimized for compact mobile usage.
