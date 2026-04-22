import { initializeApp } from 'firebase/app'
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

import { getAuth } from 'firebase/auth'

export const app = initializeApp(firebaseConfig)

let _auth = null;
try {
  _auth = getAuth(app)
} catch (e) {
  console.error("Firebase Auth init failed", e)
}
export const auth = _auth

let _analytics = null;
try {
  _analytics = typeof window !== 'undefined' ? getAnalytics(app) : null
} catch (e) {
  console.warn("Firebase Analytics blocked or failed", e)
}
export const analytics = _analytics

export { RecaptchaVerifier, signInWithPhoneNumber }
