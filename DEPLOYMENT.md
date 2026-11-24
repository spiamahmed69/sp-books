# SP Books — Deployment Guide

## Local / Demo
```bash
npm install
npm run dev      # demo mode, http://localhost:5173
npm run build    # production build -> dist/
npm run preview  # serve dist/ locally
```

## Firebase Hosting
```bash
cp .env.example .env   # fill with YOUR project keys (never commit .env)
firebase login
firebase deploy --only firestore:rules,storage
firebase deploy --only functions   # needs Blaze for ImgBB/gateway calls
firebase deploy --only hosting
```

## Vercel
- Import the repo, framework: Vite, build command `npm run build`, output `dist`.
- Set the `VITE_FIREBASE_*` env vars in the Vercel dashboard (never in git).
- Without env vars the site still works in Demo Mode.

## First admin (trusted server-side process)
1. Create a user in Firebase Auth (Console or sign-up flow).
2. From a trusted environment (Admin SDK / functions shell), call the
   `setAdminClaim` callable with `{ uid, role: 'admin' }` using an existing
   admin's credentials — or set the custom claim directly with the Admin SDK:
   `admin.auth().setCustomUserClaims(uid, { admin: true })`.
3. That admin can then grant/revoke moderator and seller roles.

## Notes
- ImgBB key lives ONLY in `functions/.env` (gitignored). Rotate it in the
  ImgBB dashboard if ever exposed.
- Firestore rules + Storage rules are role-based (custom claims); never
  relax them to `allow read, write: if true`.
- Payments: connect a real bKash/Nagad/card gateway callback to the
  server-side `verifyPayment` function before going live.
