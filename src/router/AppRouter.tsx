import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Outlet } from 'react-router-dom'
import { App } from '@capacitor/app'
import { AppShell } from '@/components/layout/AppShell'
import { BottomNav } from '@/components/layout/BottomNav'
import { DesktopLayout } from '@/components/layout/DesktopSidebar'
import { useAuth } from '@/contexts/AuthContext'

const Auth    = lazy(() => import('@/pages/Auth').then(m => ({ default: m.Auth })))
const Register = lazy(() => import('@/pages/Register'))
const Home    = lazy(() => import('@/pages/Home'))
const Comms   = lazy(() => import('@/pages/Comms'))
const Media   = lazy(() => import('@/pages/Media'))
const AI      = lazy(() => import('@/pages/AI'))
const Gaming  = lazy(() => import('@/pages/Gaming'))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/auth" replace />
  if (user && !profile) return <Navigate to="/register" replace />
  return <>{children}</>
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <PageLoader />
  if (user && profile) return <Navigate to="/home" replace />
  if (user && !profile) return <Navigate to="/register" replace />
  return <>{children}</>
}

function RegisterGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/auth" replace />
  if (user && profile) return <Navigate to="/home" replace />
  return <>{children}</>
}

function PageLoader() {
  return (
    <div className="h-full flex items-center justify-center" style={{ background: 'var(--surface)' }}>
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #4f7dff, #6c63ff)', boxShadow: '0 8px 24px rgba(79,125,255,0.4)', animation: 'pulseGlow 1.5s ease-in-out infinite' }}
        >
          <span className="text-white font-black text-sm">N&L</span>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Loading…</p>
      </div>
    </div>
  )
}

/**
 * GlobalLayout — wraps ALL routes with a persistent BottomNav
 * Uses DesktopLayout for desktop to handle sidebar and content margins
 */
function GlobalLayout() {
  return (
    <DesktopLayout>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden relative">
          <Outlet />
        </div>
        <BottomNav />
      </div>
    </DesktopLayout>
  )
}

function CapacitorGlobalHandler() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // 1. Back Button Handler
    const backUnsub = App.addListener('backButton', ({ canGoBack }) => {
      if (location.pathname === '/home' || location.pathname === '/auth') {
        App.exitApp()
      } else if (canGoBack) {
        window.history.back()
      } else {
        navigate('/home')
      }
    })

    // 2. Auto Updater (Live Updates)
    const setupUpdater = async () => {
      try {
        const { CapacitorUpdater } = await import('@capgo/capacitor-updater')
        // Automatically check for updates on app resume (silent)
        App.addListener('appStateChange', async ({ isActive }) => {
          if (isActive) {
            console.log('Checking for Live Updates...')
            // Built-in Capgo auto-update check
            await CapacitorUpdater.notifyAppReady()
          }
        })
      } catch (e) {
        console.error('Updater not available')
      }
    }
    setupUpdater()

    return () => {
      backUnsub.then(h => h.remove())
    }
  }, [location.pathname, navigate])

  return null
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <CapacitorGlobalHandler />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* GlobalLayout wraps everything — BottomNav always visible */}
          <Route element={<GlobalLayout />}>
            <Route path="/auth" element={<AuthGuard><Auth /></AuthGuard>} />
            <Route path="/register" element={<RegisterGuard><Register /></RegisterGuard>} />
            <Route element={<AppShell />}>
              <Route path="/home"   element={<ProtectedRoute><Home   /></ProtectedRoute>} />
              <Route path="/comms"  element={<ProtectedRoute><Comms  /></ProtectedRoute>} />
              <Route path="/media"  element={<ProtectedRoute><Media  /></ProtectedRoute>} />
              <Route path="/ai"     element={<ProtectedRoute><AI     /></ProtectedRoute>} />
              <Route path="/gaming" element={<ProtectedRoute><Gaming /></ProtectedRoute>} />
              <Route path="/"       element={<Navigate to="/home" replace />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
