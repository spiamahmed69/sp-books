// Seed the real Firestore database for SP Books from src/data/demo.js.
//
// Usage:
//   SEED_ADMIN_EMAIL=admin@example.com SEED_ADMIN_PASSWORD='...' node scripts/seed-firestore.mjs
//
// ADMIN BOOTSTRAP — decided 2026-11-24, option A (one-time service-account
// key). This script does NOT do the bootstrap; it only uses the result.
// The flow, in order:
//   1. The user registers his OWN admin account on the LIVE site (/register)
//      with his own password. A freshly registered account is just a
//      customer — it has no admin claim yet, and that is fine: it can already
//      browse, cart, checkout and see its orders.
//   2. The parent (main agent) creates a service-account key ONCE, sets the
//      admin custom claim on that account's UID
//      (admin.auth().setCustomUserClaims(uid, { admin: true })), and deletes
//      the key immediately afterwards.
//   3. Only then run this script, with that account's email/password in the
//      env vars above. The script signs in, verifies the admin claim, and
//      seeds. If the claim is missing it exits with a clear error and seeds
//      nothing — that is the Firestore rules working, not a bug.
//
// This script NEVER creates a service-account key and NEVER sets a custom
// claim. Credentials are read ONLY from env vars — never hardcode them here.
//
// The Firestore rules deny plain users from writing books/authors/publishers/
// categories/coupons/banners/settings, so signing in as a non-admin will fail
// with permission-denied and nothing will be seeded.
//
// The script is idempotent: a document that already exists is skipped, never
// overwritten. Re-running it after a partial run only fills the gaps.
//
// What is seeded: 28 books (approvalStatus 'approved'), 17 authors,
// 7 publishers, 10 categories, 5 sellers, coupons, banners, settings.
// NOT seeded: demo users (Auth accounts are created separately), demo
// reviews (they need real userIds), and PENDING_BOOK (the pending-approval
// demo book — the admin can add a real pending book from the seller flow).
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'
import { BOOKS, AUTHORS, PUBLISHERS, CATEGORIES, SELLERS, COUPONS, BANNERS, SETTINGS } from '../src/data/demo.js'

const firebaseConfig = {
  apiKey: 'AIzaSyAkL73jaGPdhpWd6cG4Ew2Ysw6wbibbg_4',
  authDomain: 'sp-books-c9e41.firebaseapp.com',
  projectId: 'sp-books-c9e41',
  storageBucket: 'sp-books-c9e41.firebasestorage.app',
  messagingSenderId: '463709436708',
  appId: '1:463709436708:web:f37e98588147f45c48d1b1',
}

const email = process.env.SEED_ADMIN_EMAIL
const password = process.env.SEED_ADMIN_PASSWORD
if (!email || !password) {
  console.error('Missing env: set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (admin account with the admin custom claim).')
  process.exit(1)
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

let created = 0
let skipped = 0
let failed = 0

async function seedOne(collection, id, data) {
  const ref = doc(db, collection, String(id))
  const existing = await getDoc(ref)
  if (existing.exists()) { skipped++; return }
  try {
    await setDoc(ref, data)
    created++
  } catch (err) {
    failed++
    console.error(`  FAILED ${collection}/${id}: ${err.code || err.message}`)
  }
}

async function main() {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  const token = await cred.user.getIdTokenResult()
  if (!token.claims.admin) {
    console.error('Signed in, but this account has no admin custom claim yet. The one-time admin bootstrap (option A in DEPLOYMENT.md) has not run for this account: register on the live site, have the parent set the admin claim once, then re-run this script. Nothing was seeded.')
    process.exit(1)
  }
  console.log(`Signed in as ${email} (admin claim confirmed). Seeding sp-books-c9e41…`)

  for (const b of BOOKS) await seedOne('books', b.id, { ...b, approvalStatus: 'approved' })
  for (const a of AUTHORS) await seedOne('authors', a.id, a)
  for (const p of PUBLISHERS) await seedOne('publishers', p.id, p)
  for (const c of CATEGORIES) await seedOne('categories', c.slug, c)
  for (const s of SELLERS) await seedOne('sellers', s.id, s)
  for (const c of COUPONS) await seedOne('coupons', c.code.toUpperCase(), c)
  for (const b of BANNERS) await seedOne('banners', b.id, b)
  await seedOne('settings', 'main', SETTINGS)

  console.log(`Done. created=${created} skipped(existing)=${skipped} failed=${failed}`)
  await signOut(auth)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Seed failed:', err.code || err.message)
  process.exit(1)
})
