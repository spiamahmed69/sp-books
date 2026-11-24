// Auth.
// Demo Mode: localStorage accounts (DEMO_USERS).
// Real Mode: Firebase Auth (Email/Password). Google sign-in is OFF in the
// Firebase project — the Google button keeps an honest note (see below).
// SECURITY NOTE: a role stored in the browser is NEVER trusted for admin
// rights. Real admin/moderator rights come from Firebase custom claims
// (setAdminClaim Cloud Function). The role in context is display/routing
// only; Firestore Rules enforce everything server-side.
import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  onAuthStateChanged, updateProfile as updateAuthProfile,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db, isDemoMode } from '../lib/firebase'
import { getSession, setSession, clearSession } from '../lib/session'
import { getSellerByOwner } from '../lib/firestore'
import { DEMO_USERS } from '../data/demo'
const AuthContext = createContext()
const KEY = 'spb_auth_user'
const USERS_KEY = 'spb_users_extra'

const friendlyAuthError = (e) => {
  const code = e?.code || ''
  if (code === 'auth/email-already-in-use') return 'এই ইমেইলে ইতিমধ্যে অ্যাকাউন্ট আছে। / An account with this email already exists.'
  if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') return 'ইমেইল বা পাসওয়ার্ড ভুল। / Invalid email or password.'
  if (code === 'auth/weak-password') return 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে। / Password must be at least 6 characters.'
  if (code === 'auth/too-many-requests') return 'অনেকবার চেষ্টা হয়েছে — কিছুক্ষণ পর আবার চেষ্টা করুন।'
  if (code === 'auth/network-request-failed') return 'নেটওয়ার্ক সমস্যা — সংযোগ দেখে আবার চেষ্টা করুন।'
  return e?.message || 'কিছু ভুল হয়েছে। আবার চেষ্টা করুন।'
}

// Resolve the app-level user record from a Firebase user: custom claims win
// for admin/moderator; otherwise the users doc; sellers get their sellerId
// from the sellers doc they own.
async function resolveProfile(fbUser) {
  const base = { id: fbUser.uid, name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User', email: fbUser.email || '', role: 'customer' }
  try {
    const claims = (await fbUser.getIdTokenResult()).claims
    if (claims.admin) return { ...base, role: 'admin' }
    if (claims.moderator) return { ...base, role: 'moderator' }
  } catch { /* claims unreadable — fall through to doc lookups */ }
  try {
    const snap = await getDoc(doc(db, 'users', fbUser.uid))
    if (snap.exists()) Object.assign(base, { name: snap.data().name || base.name, phone: snap.data().phone || '' })
  } catch { /* users doc may not exist yet */ }
  try {
    const seller = await getSellerByOwner(fbUser.uid)
    if (seller) return { ...base, role: 'seller', sellerId: seller.id }
  } catch { /* no seller record */ }
  return base
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (isDemoMode) { try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null } }
    return null
  })
  const [loading, setLoading] = useState(false)
  const [authReady, setAuthReady] = useState(isDemoMode)

  useEffect(() => {
    if (isDemoMode) {
      if (user) localStorage.setItem(KEY, JSON.stringify(user))
      else localStorage.removeItem(KEY)
      return
    }
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) { setUser(null); clearSession(); setAuthReady(true); return }
      try {
        const profile = await resolveProfile(fbUser)
        setUser(profile)
        setSession({ uid: fbUser.uid, role: profile.role, sellerId: profile.sellerId || null, isAdmin: profile.role === 'admin', isModerator: profile.role === 'moderator' })
      } catch {
        setUser({ id: fbUser.uid, name: fbUser.displayName || fbUser.email, email: fbUser.email, role: 'customer' })
        setSession({ uid: fbUser.uid, role: 'customer', sellerId: null, isAdmin: false, isModerator: false })
      }
      setAuthReady(true)
    })
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (email, password) => {
    setLoading(true)
    try {
      if (isDemoMode) {
        await new Promise((r) => setTimeout(r, 400))
        const all = [...DEMO_USERS, ...JSON.parse(localStorage.getItem(USERS_KEY) || '[]')]
        const found = all.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password)
        if (!found) throw new Error('Invalid email or password.')
        const { password: _pw, ...safe } = found
        setUser(safe)
        return safe
      }
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const profile = await resolveProfile(cred.user)
      setUser(profile)
      setSession({ uid: cred.user.uid, role: profile.role, sellerId: profile.sellerId || null, isAdmin: profile.role === 'admin', isModerator: profile.role === 'moderator' })
      return profile
    } catch (e) { throw new Error(friendlyAuthError(e)) }
    finally { setLoading(false) }
  }

  const register = async ({ name, email, password }) => {
    setLoading(true)
    try {
      if (isDemoMode) {
        await new Promise((r) => setTimeout(r, 400))
        const all = [...DEMO_USERS, ...JSON.parse(localStorage.getItem(USERS_KEY) || '[]')]
        if (all.some((u) => u.email.toLowerCase() === email.toLowerCase())) throw new Error('An account with this email already exists.')
        const safe = { id: 'u_' + Date.now(), name, email, role: 'customer' }
        localStorage.setItem(USERS_KEY, JSON.stringify([...JSON.parse(localStorage.getItem(USERS_KEY) || '[]'), { ...safe, password }]))
        setUser(safe)
        return safe
      }
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await updateAuthProfile(cred.user, { displayName: name })
      await setDoc(doc(db, 'users', cred.user.uid), {
        id: cred.user.uid, name, email, role: 'customer',
        createdAt: new Date().toISOString(),
      })
      const safe = { id: cred.user.uid, name, email, role: 'customer' }
      setUser(safe)
      setSession({ uid: cred.user.uid, role: 'customer', sellerId: null, isAdmin: false, isModerator: false })
      return safe
    } catch (e) { throw new Error(friendlyAuthError(e)) }
    finally { setLoading(false) }
  }

  const registerSeller = async ({ name, email, password, storeName }) => {
    const safe = await register({ name, email, password })
    if (isDemoMode) {
      const seller = { id: 's_' + Date.now(), storeName, storeNameBn: storeName, owner: name, rating: 0, books: 0, followers: 0, verified: false, status: 'pending' }
      const extra = JSON.parse(localStorage.getItem('spb_sellers_extra') || '[]')
      localStorage.setItem('spb_sellers_extra', JSON.stringify([...extra, seller]))
      setUser({ ...safe, role: 'seller', sellerId: seller.id })
      return seller
    }
    // Real mode: sellers + stores docs owned by this uid (rules: create only
    // when ownerId == request.auth.uid). Status stays 'pending' until an
    // admin approves the store.
    const sellerId = 's_' + Date.now().toString(36)
    const seller = {
      id: sellerId, ownerId: safe.id, storeName, storeNameBn: storeName, owner: name,
      rating: 0, books: 0, followers: 0, verified: false, status: 'pending',
      createdAt: new Date().toISOString(),
    }
    await setDoc(doc(db, 'sellers', sellerId), seller)
    await setDoc(doc(db, 'stores', sellerId), {
      id: sellerId, ownerId: safe.id, name: storeName, nameBn: storeName,
      description: '', logo: '', banner: '', createdAt: new Date().toISOString(),
    })
    setUser({ ...safe, role: 'seller', sellerId })
    setSession({ uid: safe.id, role: 'seller', sellerId, isAdmin: false, isModerator: false })
    return seller
  }

  const logout = async () => {
    if (isDemoMode) { setUser(null); return }
    await signOut(auth)
    setUser(null)
    clearSession()
  }

  const updateProfile = async (patch) => {
    if (isDemoMode) { setUser((u) => ({ ...u, ...patch })); return }
    if (!user) return
    const allowed = {}
    if (patch.name !== undefined) allowed.name = patch.name
    if (patch.phone !== undefined) allowed.phone = patch.phone
    if (Object.keys(allowed).length) {
      await updateDoc(doc(db, 'users', user.id), allowed)
      if (auth.currentUser && allowed.name) await updateAuthProfile(auth.currentUser, { displayName: allowed.name })
    }
    setUser((u) => ({ ...u, ...patch }))
  }

  const googleSignInNote = () => (isDemoMode
    ? 'Google sign-in needs Firebase configuration. In Demo Mode it is unavailable — please use a demo account or register with email.'
    : 'Google সাইন-ইন এই Firebase প্রজেক্টে বন্ধ আছে — ইমেইল দিয়ে লগইন করুন। / Google sign-in is disabled in this Firebase project — please use email login.')

  return (
    <AuthContext.Provider value={{ user, loading, authReady, login, register, registerSeller, logout, updateProfile, isDemoMode, googleSignInNote, getSession }}>
      {children}
    </AuthContext.Provider>
  )
}
export const useAuth = () => useContext(AuthContext)
