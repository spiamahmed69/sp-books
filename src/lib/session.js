// Module-level session info, set by AuthContext after sign-in / sign-out.
// The data layer (lib/firestore.js) uses it to build rule-compatible queries
// (e.g. a seller only queries their own books). These values are UI/display
// helpers only — Firestore Security Rules enforce everything server-side,
// and a role stored here is NEVER trusted for admin rights (only the custom
// claim on the auth token counts).
let session = { uid: null, role: 'customer', sellerId: null, isAdmin: false, isModerator: false }
export const getSession = () => session
export const setSession = (patch) => { session = { ...session, ...patch } }
export const clearSession = () => { session = { uid: null, role: 'customer', sellerId: null, isAdmin: false, isModerator: false } }
