
Production
Internal color/texture development tracker. Plain HTML, CSS and JavaScript — no build step, no framework.

Features
Stock Offerings (home tab) – what we can sell: coating colors by base, each with its material (Signature or Luxe), textures (Fine Grain, Pebble, Nappa) and finishes (Satin, Matte), plus uncoated base material by lot. Colors approved in Partner Projects appear automatically. Stock numbers (panels, sq ft, uncoated yards) are hidden for now: stock.js can read the inventory tracking sheet, but it stays switched off (SHOW_STOCK) until the tracker is connected live to that sheet.

Old Stock Offerings – the original swatch board, kept unchanged for reference.
Partner Projects – everything the finishing partners (Pearl, Bader, ...) are working on, grouped by partner and numbered 1, 2, 3 in each partner's priority order (drag ⠿ or use ↑ ↓ to reorder; Copy list pastes a partner's numbered list into an email). Rows are colors in development (partner, stage, project, base & texture, progress, quantity & dates, forecasted order) and other partner jobs added with + New partner job (a gloss adjustment, a panel order...). A color's quantity, due and receive-by dates are its latest trial round's, so they can be changed in the row or in the Progress pop-up. Click Progress to see and add steps (color matching, trial rounds, in-house testing, brand review, ...); rounds are numbered automatically. Show stages picks any mix (finished jobs are under Completed jobs), and the summary cards are quick presets. A forecast summary totals base material needs by base, material and texture per quarter. Starting data is loaded with More → Import from file; it is not stored in this code. This tab replaced In Development and Finishing Priorities; the old priority rows are moved in automatically the first time it loads (and kept, marked as moved).


Calendar – month view of stage start/end dates
Textures – procedural texture previews (croc, scale, liquid, marble, lace, …) recolorable to any color in the library
Client A Event – duplicate textures to build a presentation set in multiple colors
Run locally
Just open index.html in a browser. Or serve the folder:

python3 -m http.server 8000
# then visit http://localhost:8000
Deploy for the team
See TEAM-SETUP.md for step-by-step instructions. In short:

Push this repo to GitHub and turn on Settings → Pages (branch main, folder / (root)).
Create a free Firebase project, enable Google sign-in and Firestore, and publish firestore.rules.
Paste the Firebase web app values into firebase-config.js.
Where data is saved
storage-shim.js decides where data goes:

Shared team mode (when firebase-config.js has an apiKey): everyone signs in with a Google account on the allowed domain and works on the same data in Firestore. A save is refused if a teammate saved the same data first, and a banner asks the user to reload, so nobody overwrites someone else's work.
Single-browser mode (empty apiKey): data stays in this browser's localStorage, per device, and clearing site data erases it.
Inside Claude: Claude's built-in storage.
Files
File	What it is
index.html	Page structure and shared SVG pattern/filter definitions for textures
styles.css	All styling
app.js	All app logic (rendering, editing, drag and drop, PDF export, textures)
storage-shim.js	window.storage for outside Claude: Firebase (shared) or localStorage
firebase-config.js	Firebase project values and the allowed email domain
firestore.rules	Database security rules: only company accounts can read or write
TEAM-SETUP.md	One-time setup guide for GitHub Pages + Firebase
vendor/jspdf.umd.min.js	jsPDF 2.5.1 (MIT license), used for PDF export
Privacy
This is the public copy of the tracker. Client, brand and supplier names in the starting data have been replaced with placeholders (Client A–D, Supplier A). Keep real client names out of this repo's code, since anyone can read it. Real names are fine inside the tracker itself in shared team mode: that data lives in Firestore, where only signed-in company accounts can read it.

