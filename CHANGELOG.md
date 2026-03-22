# Changelog

## v1.0.0 - 2026-03-22

### Added

- PWA shell with offline support (Service Worker + Manifest).
- Light/Dark theme toggle and EN/RU localization with persistence.
- Mobile/desktop adaptive multi-tool UI with card-based pages.

### Features

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
