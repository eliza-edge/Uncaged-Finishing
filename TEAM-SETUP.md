# Team setup: one shared tracker for everyone

Follow these steps once. When you're done, the team opens one link, signs in with
their **@uncagedinnovations.com** Google account, and everyone sees and edits the
same colors.

It takes about 20 minutes and costs nothing: Firebase's free plan is far more than
this tracker needs.

**How it fits together**

- **GitHub Pages** hosts the app: the page, its code and the shared link.
- **Firebase** (Google) handles sign-in and stores the shared data.

The code on GitHub is public. The tracker data is not: Firebase only lets
signed-in company accounts read or change it.

---

## Part 1 — Put the code on GitHub

1. Sign in at [github.com](https://github.com) and click **New repository**
   (the **+** at the top right).
2. Name it `uncaged-color-tracker`, choose **Public**, and click
   **Create repository**.
3. On the empty repo page, click **uploading an existing file**.
4. In Finder, open the `uncaged-color-tracker-public` folder, select **everything
   inside it** (all the files plus the `vendor` folder), and drag it into the
   upload box. Click **Commit changes**.
5. Go to **Settings → Pages**. Under *Build and deployment*, choose
   **Deploy from a branch**, set the branch to **main** and the folder to
   **/ (root)**, then click **Save**.
6. After a minute or two, refresh. The link appears at the top of the page:
   `https://<your-github-name>.github.io/uncaged-color-tracker/`.
   Write down the `<your-github-name>.github.io` part for Part 2.

At this point the link works, but each person's edits stay in their own browser.
Part 2 makes the data shared.

## Part 2 — Create the shared database (Firebase)

Use your @uncagedinnovations.com Google account for all of this.

### 2a. Create the project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and click
   **Create a project** (or **Add project**).
2. Name it `uncaged-color-tracker`. Google Analytics isn't needed, so you can turn
   it off. Click **Create project**.

### 2b. Turn on Google sign-in

1. In the left menu: **Build → Authentication → Get started**.
2. On the **Sign-in method** tab, click **Google**, switch it **on**, pick your
   email as the support email, and click **Save**.
3. Open the **Settings** tab → **Authorized domains** → **Add domain**, and enter
   `<your-github-name>.github.io` from Part 1, step 6.

### 2c. Create the database and lock it to the company

1. In the left menu: **Build → Firestore Database → Create database**.
2. Pick a location near the team (e.g. `nam5 (United States)`). Start in
   **production mode**. Click **Create**.
3. Open the **Rules** tab, delete everything there, paste in the full contents
   of `firestore.rules` from this repo, and click **Publish**.

### 2d. Connect the app to the database

1. Click the **gear icon → Project settings**. Under **Your apps**, click the
   **web** icon (`</>`).
2. Name it `tracker`. Leave "Firebase Hosting" unchecked. Click **Register app**.
3. Firebase shows a block of code containing `firebaseConfig = { ... }`. Copy these
   four values: `apiKey`, `authDomain`, `projectId` and `appId`.
4. In your GitHub repo, open `firebase-config.js` and click the **pencil** (Edit).
   Paste each value between the matching quotes, for example:

   ```js
   firebase: {
     apiKey: 'AIzaSy...',
     authDomain: 'uncaged-color-tracker.firebaseapp.com',
     projectId: 'uncaged-color-tracker',
     appId: '1:1234567890:web:abc123',
   },
   ```

   Click **Commit changes**. These values are safe to publish: they identify the
   project but don't grant access. The rules from step 2c control access.

## Part 3 — Try it, then share it

1. Wait about a minute for GitHub Pages to update, then open your link. You should
   see a **Sign in with Google** screen.
2. Sign in with your work account. The tracker opens with the starting colors,
   which are now saved to the shared database.
3. Ask a teammate to open the same link, sign in, and change something. Reload,
   and you'll see their change.
4. Share the link with the team.

---

## What teammates should know

- **Only @uncagedinnovations.com Google accounts can get in.** Personal Gmail
  accounts are turned away.
- **Reload to see others' changes.** If someone else saves while you have the
  tracker open, a banner says so with a **Reload** button.
- **Changes are never silently overwritten.** If a teammate saves first, your
  save is blocked and a banner asks you to reload and redo your change. This stops
  one person's old screen from wiping out another person's work.
- **Still no undo.** Deletes are shared too, so a deleted swatch is gone for
  everyone.
- **Start here, not from Casey's chat copy.** Edits made in the original Claude
  artifact don't carry over. The shared tracker starts from the built-in colors.

## Troubleshooting

| What you see | Fix |
|---|---|
| Sign-in popup closes with an "unauthorized domain" error | Step 2b.3: add `<your-github-name>.github.io` to Authorized domains |
| "That account isn't allowed" | Sign in with your @uncagedinnovations.com account, not a personal one |
| Signed in, but saves fail with `permission-denied` | Step 2c.3: the rules weren't published, or the domain in them is wrong |
| No sign-in screen, and edits don't sync | `firebase-config.js` still has an empty `apiKey`, or GitHub Pages hasn't updated yet |
| "Couldn't connect" screen | The browser couldn't load Google's sign-in code. Check the connection or turn off a strict ad blocker |
