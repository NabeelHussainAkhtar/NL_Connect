import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogIn, Apple, MailWarning } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function AuthFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center" style={{ background: 'var(--surface)' }}>
      <div className="p-4 mb-4 rounded-2xl" style={{ color: 'var(--accent)', background: 'var(--surface-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
        <MailWarning size={32} />
      </div>
      <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Authentication Error</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>Too many requests or provider unavailable.<br/>Please try again later.</p>
    </div>
  )
}

export function Auth() {
  const { signInWithGoogle, signInWithApple, signInAsGuest } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleOAuth = async (provider: 'google' | 'apple' | 'guest') => {
    try {
      setLoading(true)
      setError('')
      if (provider === 'google') {
        await signInWithGoogle()
      } else if (provider === 'apple') {
        await signInWithApple()
      } else if (provider === 'guest') {
        await signInAsGuest()
      }
      // Successful login automatically updates AuthContext
      // The AppRouter manages redirecting to /register or /home based on profile exists
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex flex-col items-center justify-center h-full px-6 overflow-hidden safe-p-y" style={{ background: 'var(--surface)' }}>
      {/* Subtle gradient background */}
      <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 30% 20%, rgba(79,125,255,0.15), transparent 60%), radial-gradient(circle at 70% 80%, rgba(108,99,255,0.1), transparent 50%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex flex-col items-center z-10 max-w-xs"
      >
        {/* Logo */}
        <div className="mb-12 text-center">
          <div className="inline-flex p-5 mb-6 rounded-3xl" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-elevated)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4f7dff, #6c63ff)', boxShadow: '0 8px 24px rgba(79,125,255,0.4)' }}>
              <span className="text-3xl font-black text-white">N&L</span>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>Connect</h1>
          <p className="text-base" style={{ color: 'var(--text-tertiary)' }}>Sign in to sync your super-app.</p>
        </div>

        {/* Buttons */}
        <div className="w-full space-y-3">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm font-medium text-center p-3 rounded-xl"
                style={{ color: 'var(--accent-danger)', background: 'rgba(186,26,26,0.08)', border: '1px solid rgba(186,26,26,0.15)' }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => handleOAuth('google')}
            disabled={loading}
            className="w-full relative flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-semibold text-[15px] transition-all active:scale-[0.97] disabled:opacity-50"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', color: 'var(--text-primary)' }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <button
            onClick={() => handleOAuth('apple')}
            disabled={loading}
            className="w-full relative flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-semibold text-[15px] transition-all active:scale-[0.97] disabled:opacity-50"
            style={{ background: '#000', color: '#fff', boxShadow: 'var(--shadow-elevated)' }}
          >
            <Apple strokeWidth={2.5} size={20} />
            Continue with Apple
          </button>

          <button
            onClick={() => handleOAuth('guest')}
            disabled={loading}
            className="w-full relative flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-semibold text-[15px] transition-all active:scale-[0.97] disabled:opacity-50 mt-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
          >
            Continue as Guest
          </button>
        </div>

        <p className="mt-8 text-xs px-8 text-center leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
          By signing in, you agree to our Terms of Service and Privacy Policy. Phone number verification may be required during setup.
        </p>
      </motion.div>
    </div>
  )
}
