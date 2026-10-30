# Color & Finish Development Calendar

Internal color/texture development tracker for Uncaged Innovations.
Plain HTML, CSS and JavaScript — no build step, no framework.

## Features

- **Timeline** – Gantt chart of every color through Lab Dip 1 → Lab Dip 2 → Approved Standard → Pilot Run → Color Card
- **Swatch board** – collections of swatches with inline-editable name, code, base color, texture, notes and stage; drag to reorder or move; Option/Alt-drag to copy; per-collection **Export PDF**
- **Calendar** – month view of stage start/end dates
- **Textures** – procedural texture previews (croc, scale, liquid, marble, lace, …) recolorable to any color in the library
- **Client A Event** – duplicate textures to build a presentation set in multiple colors

## Run locally

Just open `index.html` in a browser. Or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy for the team

See **[TEAM-SETUP.md](TEAM-SETUP.md)** for step-by-step instructions. In short:

1. Push this repo to GitHub and turn on **Settings → Pages** (branch `main`, folder `/ (root)`).
2. Create a free Firebase project, enable Google sign-in and Firestore, and publish `firestore.rules`.
3. Paste the Firebase web app values into `firebase-config.js`.

## Where data is saved

`storage-shim.js` decides where data goes:

- **Shared team mode** (when `firebase-config.js` has an `apiKey`): everyone signs in
  with a Google account on the allowed domain and works on the same data in Firestore.
  A save is refused if a teammate saved the same data first, and a banner asks the user
  to reload, so nobody overwrites someone else's work.
- **Single-browser mode** (empty `apiKey`): data stays in this browser's localStorage,
  per device, and clearing site data erases it.
- **Inside Claude**: Claude's built-in storage.

## Files

| File | What it is |
|---|---|
| `index.html` | Page structure and shared SVG pattern/filter definitions for textures |
| `styles.css` | All styling |
| `app.js` | All app logic (rendering, editing, drag and drop, PDF export, textures) |
| `storage-shim.js` | `window.storage` for outside Claude: Firebase (shared) or localStorage |
| `firebase-config.js` | Firebase project values and the allowed email domain |
| `firestore.rules` | Database security rules: only company accounts can read or write |
| `TEAM-SETUP.md` | One-time setup guide for GitHub Pages + Firebase |
| `vendor/jspdf.umd.min.js` | [jsPDF](https://github.com/parallax/jsPDF) 2.5.1 (MIT license), used for PDF export |

## Privacy

This is the public copy of the tracker. Client, brand and supplier names in the
starting data have been replaced with placeholders (Client A–D, Supplier A).
Keep real client names out of this repo's code, since anyone can read it. Real names
are fine inside the tracker itself in shared team mode: that data lives in Firestore,
where only signed-in company accounts can read it.
