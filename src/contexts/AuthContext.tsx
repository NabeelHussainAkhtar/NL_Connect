import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { 
  User, 
  onAuthStateChanged, 
  signOut, 
  GoogleAuthProvider, 
  OAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult,
  signInAnonymously,
  signInWithCredential
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Capacitor } from '@capacitor/core'
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth'

export interface AppProfile {
  id: number
  uid: string
  phone: string
  display_name: string
  status: string
  avatar_url: string
  created_at: string
}

interface AuthContextValue {
  user: User | null
  profile: AppProfile | null
  loading: boolean
  signInWithGoogle: () => Promise<User | null>
  signInWithApple: () => Promise<User | null>
  signInAsGuest: () => Promise<User | null>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const BYPASS_AUTH = false;

const MOCK_USER: any = {
  uid: 'demo-user-id',
  displayName: 'Demo User',
  email: 'demo@example.com',
  photoURL: 'https://ui-avatars.com/api/?name=Demo+User',
};

const MOCK_PROFILE: AppProfile = {
  id: 0,
  uid: 'demo-user-id',
  phone: '+1555000000',
  display_name: 'Demo User',
  status: 'Exploring N&L Connect!',
  avatar_url: 'https://ui-avatars.com/api/?name=Demo+User',
  created_at: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AppProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      GoogleAuth.initialize();
    }
  }, []);

  const refreshProfile = useCallback(async (currentUid?: string) => {
    if (BYPASS_AUTH) return; // Don't refresh profile if bypassing
    const targetUid = currentUid || user?.uid
    if (!targetUid) {
      setProfile(null)
      return
    }
    try {
      const res = await fetch(`https://nl-connect-worker.nabeelhussain2k02.workers.dev/api/users/me?uid=${targetUid}`)
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
      } else {
        setProfile(null)
      }
    } catch (e) {
      setProfile(null)
    }
  }, [user])

  useEffect(() => {
    if (BYPASS_AUTH) {
      setLoading(false);
      return;
    }
    if (!auth) return

    const unsub = onAuthStateChanged(auth, async u => {
      setUser(u)
      if (u) {
        await refreshProfile(u.uid)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    // Handle the redirect result when the app returns from the browser on mobile
    const checkRedirect = async () => {
      if (!auth) return
      try {
        await getRedirectResult(auth)
      } catch (error: any) {
        if (error.code !== 'auth/no-current-user') {
          console.warn('Firebase Auth Redirect handled:', error.code)
        }
      }
    }
    
    checkRedirect()

    return unsub
  }, [refreshProfile])

  const signInWithGoogle = useCallback(async () => {
    if (BYPASS_AUTH) return MOCK_USER;
    if (!auth) throw new Error('Firebase Auth not initialized')
    
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await GoogleAuth.signIn();
        if (result && result.authentication.idToken) {
          const credential = GoogleAuthProvider.credential(result.authentication.idToken);
          const res = await signInWithCredential(auth, credential);
          return res.user;
        }
        return null;
      } else {
        const provider = new GoogleAuthProvider()
        const res = await signInWithPopup(auth, provider)
        return res.user
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err.code, err.message)
      throw err
    }
  }, [])

  const signInWithApple = useCallback(async () => {
    if (BYPASS_AUTH) return MOCK_USER;
    if (!auth) throw new Error('Firebase Auth not initialized')
    const provider = new OAuthProvider('apple.com')
    
    try {
      if (Capacitor.isNativePlatform()) {
        await signInWithRedirect(auth, provider)
        return null
      } else {
        const res = await signInWithPopup(auth, provider)
        return res.user
      }
    } catch (err: any) {
      console.error('Apple Sign-In Error:', err.code, err.message)
      throw err
    }
  }, [])

  const signInAsGuest = useCallback(async () => {
    if (BYPASS_AUTH) return MOCK_USER;
    if (!auth) throw new Error('Firebase Auth not initialized')
    try {
      const res = await signInAnonymously(auth)
      return res.user
    } catch (err: any) {
      console.error('Guest Sign-In Error:', err.code, err.message)
      throw err
    }
  }, [])

  const logout = useCallback(async () => {
    if (BYPASS_AUTH) {
      // In bypass mode, logout doesn't do much or we could disable bypass
      return;
    }
    if (!auth) return
    await signOut(auth)
    setProfile(null)
  }, [])

  return (
    <AuthContext.Provider value={{ 
      user: BYPASS_AUTH ? MOCK_USER : user, 
      profile: BYPASS_AUTH ? MOCK_PROFILE : profile, 
      loading: BYPASS_AUTH ? false : loading, 
      signInWithGoogle, 
      signInWithApple, 
      signInAsGuest,
      logout, 
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
