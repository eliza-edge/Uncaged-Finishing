/*
 * Shared team storage settings.
 *
 * Paste the values from Firebase console → Project settings → Your apps → Web app
 * (see TEAM-SETUP.md). These values are safe to publish: access is controlled by
 * the Firestore security rules in firestore.rules, not by keeping these secret.
 *
 * Leave apiKey empty to run the tracker in single-browser mode (localStorage).
 */
window.TRACKER_CONFIG = {
  firebase: {
    apiKey: 'AIzaSyDwEbq6ffBLVzXyZHNt8q-eZg5IaKvNWXQ',
    authDomain: 'uncaged-color-tracker.firebaseapp.com',
    projectId: 'uncaged-color-tracker',
    appId: '1:537702685262:web:424989d8a07e90172c411f',
  },
  // Only Google accounts with this email domain can sign in.
  // Must match the domain in firestore.rules.
  allowedEmailDomain: 'uncagedinnovations.com',
};
