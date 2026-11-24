# SP Books — Deployment Guide

## Live project (2026-11-24)

- **Site:** https://sp-books.vercel.app (Vercel project `sp-books`, status Ready)
- **GitHub:** `spiamahmed69/sp-books`
- **Firebase project:** `sp-books-c9e41` (Spark plan, Singapore region)
  - `projectId: sp-books-c9e41`, `authDomain: sp-books-c9e41.firebaseapp.com`
  - Email/Password Auth: **enabled**. Google sign-in: **off** (leave off; the UI says so honestly).
  - Firestore: Production mode, rules from `firestore.rules` already published.
  - Firebase Storage: **NOT enabled** (needs Blaze/billing — do not enable).
  - Cloud Functions: written in `functions/index.js` but **not deployed** (needs Blaze).

## Local / Demo

```bash
npm install   # VM-এ npm registry সমস্যা হলে ../sp-marketplace থেকে node_modules কপি করুন
npm run dev      # demo mode, http://localhost:5173
npm run build    # production build -> dist/
npm run preview  # serve dist/ locally
```

Without Firebase env vars (or with `VITE_DEMO_MODE=true`) the app runs in
Demo Mode on `src/data/demo.js` + localStorage. The demo banner says so.

## Real mode — local testing

1. Copy `.env.example` to `.env` and fill the `VITE_FIREBASE_*` values for
   `sp-books-c9e41` (already filled in the local `.env`, gitignored).
   Set `VITE_DEMO_MODE=false`.
2. `npm run dev` — the app now talks to real Firebase Auth + Firestore.
3. **Before seeding, the catalog is empty** — that is expected. Public pages
   show honest empty states until the seed runs.

## Vercel (production)

- Import the repo, framework: Vite, build command `npm run build`, output `dist`.
- Set these env vars in the Vercel dashboard (never in git):
  - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`,
    `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`,
    `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`
  - `VITE_DEMO_MODE=false`
  - `IMGBB_API_KEY` — server-side only, used by `api/upload.js`. See
    "Image uploads" below.
- Without env vars the site still works in Demo Mode.

## Seeding the catalog

```bash
SEED_ADMIN_EMAIL=admin@example.com SEED_ADMIN_PASSWORD='...' node scripts/seed-firestore.mjs
```

- Seeds from `src/data/demo.js`: 28 books (`approvalStatus: 'approved'`),
  17 authors, 7 publishers, 10 categories, 5 sellers, coupons (SP10 etc.),
  banners, settings (`settings/main`).
- **Idempotent** — existing docs are skipped, never overwritten.
- The admin account must already exist in Firebase Auth **and** carry the
  admin custom claim (see below). A plain user gets `permission-denied`
  and nothing is seeded — that is the rules working, not a bug.
- Not seeded: demo users (Auth accounts are separate), demo reviews,
  `PENDING_BOOK` (the pending-approval demo book).

## Admin bootstrap — DECIDED 2026-11-24: option A (one-time service-account key)

No admin user exists yet. Roles are enforced **only via custom claims**
(`request.auth.token.admin` / `.moderator`); a `role` field in a user doc
is never trusted, and the rules must not be weakened to work around this.

The flow, in order (the parent handles this AFTER the wiring + Vercel
redeploy):

1. **The user registers his own admin account on the live site**
   (`/register`) with his own password. A freshly registered account is
   just a customer — no claim yet. It can already browse, cart, checkout
   and see its orders; opening `/admin` shows a clear "admin setup
   pending" message until step 2 is done.
2. **The parent creates a service-account key ONCE**, sets the admin
   custom claim on that account's UID
   (`admin.auth().setCustomUserClaims(uid, { admin: true })`), and
   **deletes the key immediately afterwards**. No service-account key is
   stored in this repo, and this wiring task creates none.
3. **Then seed the catalog** with that account:
   `SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... node scripts/seed-firestore.mjs`
   (the script signs in, verifies the claim, and seeds; it never touches
   service accounts or claims).

Until an admin exists: seeding cannot run, no book/author/category/coupon/
banner/settings writes are possible from the app, and the admin dashboard
is unreachable (the `/admin` route shows the setup-pending message).
Customer sign-up and public reads work without an admin.

Alternative (not chosen): **Blaze Functions deploy** — upgrade the
Firebase project to Blaze, deploy `functions/index.js`, then an existing
admin calls the `setAdminClaim` callable. The first admin still needs a
one-time trusted bootstrap (step 2 above).

## Image uploads (ImgBB, no Firebase Storage)

- `ImageUpload` posts to `/api/upload` (Vercel serverless, `api/upload.js`):
  dependency-free multipart parser, image type + 5 MB validation, forwards
  to ImgBB with `process.env.IMGBB_API_KEY`, returns `{ url }`.
- The ImgBB key lives **only** as the Vercel env var `IMGBB_API_KEY` —
  never in code, `.env.example`, or any committed file.
- **⚠️ ImgBB account activation pending (2026-11-24):** the supplied key
  returns HTTP 400, code 103 ("You have been forbidden to use this
  website") — the ImgBB account (spsiamahmed1111@gmail.com) was left on
  the resend-activation page, not activated. Until the account is activated
  via the email link, `/api/upload` will fail with an honest error + retry
  in the UI. Activate the account first, then test the key again.
- Known limitation: `/api/upload` is unauthenticated — anyone who can
  reach it can upload through the key. Verifying the caller's Firebase ID
  token would need the Firebase Admin SDK (see `functions/index.js`).
- Under `vite dev` there is no `/api` route, so uploads fail locally with
  an honest error + retry; they work on Vercel.

## What works in real mode — and what waits for the server side

Works now (client-side, against real Firestore):
- Auth: register / login / logout, `users/{uid}` docs, seller registration
  (sellers doc, status `pending`).
- Public catalog reads (approved books only), search, categories/authors/
  publishers, reviews (approved only).
- Cart / wishlist / addresses in per-user Firestore docs when signed in
  (`carts/{uid}` etc.); guests keep localStorage.
- Checkout: parent `orders` doc + `payments` doc in one batch, immutable
  item snapshots, per-seller `sellerBreakdown`, 10% commission math,
  idempotency key (one key per checkout session — retries can't duplicate).
- Reviews: signed-in users can post (start as `pending`).

Waits for the Cloud Function deploy (`functions/index.js`, Blaze):
- `sellerOrders` creation per order (rules: only the function can create
  them) — until then the seller dashboard's Orders tab is empty, with an
  honest note in the UI.
- Stock decrement on approved books (clients cannot decrement stock).
- `setAdminClaim` callable (admin bootstrap option 1).
- Server-side payment verification (`functions/verifyPayment`): until then
  bKash/Nagad/card verification is the existing simulated provider in
  `src/services/payment.js` — **not a real gateway callback**. Do not treat
  a "payment successful" message as verified money.

Other real-mode rules to know:
- Sellers editing an approved book re-submits it as `pending` (approval
  flow); sellers cannot create coupons (admin/moderator only).
- Moderators are claims-managed — there is no moderators collection; the
  admin dashboard's moderators tab is read-only in real mode.

## Notes

- Firestore rules + Storage rules are role-based (custom claims); never
  relax them to `allow read, write: if true`.
- Never create service-account keys in this repo; never commit `.env`.
- Payments: connect a real bKash/Nagad/card gateway callback to the
  server-side `verifyPayment` function before going live.
