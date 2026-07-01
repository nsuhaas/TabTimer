# TabTimer

A lightweight Chrome extension that shows how long each browser tab has been open — so you can finally close the ones you forgot about.

<!-- screenshot: popup overview showing tabs grouped by age with colored badges -->
> **Screenshot needed:** Open the extension popup with several tabs open across multiple age categories and take a full popup screenshot. Save as `screenshots/overview.png` and update the path below.

![TabTimer Popup Overview](screenshots/overview.png)

---

## Features

- **Live age tracking** — every tab shows exactly how long it has been open (seconds, minutes, hours, days)
- **Color-coded badges** — instantly see which tabs are fresh, moderate, aging, or forgotten
- **Grouped sections** — tabs are organized into four categories sorted by age
- **Search & filter** — type to narrow down tabs by title or URL
- **Sort toggle** — switch between oldest-first and newest-first ordering
- **One-click switching** — click any tab row to jump straight to it
- **Close individual tabs** — hit × on any row to close that tab
- **Bulk close** — close all Forgotten tabs (>24h) with one button
- **Persistent tracking** — open times survive browser restarts

---

## Age Categories

| Badge | Range | Meaning |
|-------|-------|---------|
| 🟢 Fresh | < 1 hour | Recently opened |
| 🟡 Moderate | 1 – 8 hours | Getting old |
| 🟠 Aging | 8 – 24 hours | Probably not needed |
| 🔴 Forgotten | > 24 hours | You forgot about this one |

---

## Screenshots

### Popup overview
<!-- screenshot: full popup with tabs in all four categories visible -->
> Save a screenshot of the popup showing tabs in all four age categories as `screenshots/overview.png`

![Overview](screenshots/overview.png)

### Forgotten tabs bulk close
<!-- screenshot: popup with the red "Close X Forgotten Tabs" button active -->
> Save a screenshot with several red Forgotten tabs and the close button enabled as `screenshots/forgotten.png`

![Forgotten Tabs](screenshots/forgotten.png)

### Search filtering
<!-- screenshot: search bar with a query typed, filtered list shown -->
> Type a search term in the popup and save a screenshot as `screenshots/search.png`

![Search](screenshots/search.png)

---

## Installation

1. Download or clone this repo:
   ```bash
   git clone https://github.com/nsuhaas/TabTimer.git
   ```
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked**
5. Select the `TabTimer` folder
6. The TabTimer icon will appear in your toolbar

> **Note:** Open times are recorded from the moment the extension is installed. Tabs already open before installation will show time elapsed since install, not since they were originally opened.

---

## How It Works

| File | Role |
|------|------|
| `background.js` | Service worker — records tab creation timestamps in `chrome.storage.local`, cleans up closed tabs, prunes stale entries every 5 minutes |
| `popup.js` | Loads all open tabs + stored timestamps, computes durations, renders the grouped list |
| `popup.html` | Popup UI shell |
| `popup.css` | Styling — color tokens, layout, badges |
| `icons/` | SVG icons (16 × 16, 48 × 48, 128 × 128) |

### Permissions used

| Permission | Why |
|------------|-----|
| `tabs` | Read tab titles, URLs, favicons; switch/close tabs |
| `storage` | Persist tab open timestamps across sessions |
| `alarms` | Periodic cleanup of stale storage entries |
| `windows` | Focus the correct window when switching to a tab |

---

## License

MIT
