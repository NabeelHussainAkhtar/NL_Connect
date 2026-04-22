import { createContext, useContext, useState, useEffect, useCallback, memo, ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, MessageCircle, Music, Bot, Gamepad2,
  Menu, User, Settings, LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface SidebarItem {
  path:  string
  icon:  React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties; className?: string }>
  label: string
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { path: '/home',   icon: Home,          label: 'Home'   },
  { path: '/comms',  icon: MessageCircle, label: 'Chat'   },
  { path: '/media',  icon: Music,         label: 'Media'  },
  { path: '/ai',     icon: Bot,           label: 'AI'     },
  { path: '/gaming', icon: Gamepad2,      label: 'Games'  },
]

const SIDEBAR_OPEN_WIDTH = 260
const SIDEBAR_CLOSED_WIDTH = 72

interface SidebarContextType {
  isOpen: boolean
  width: number
  isDesktop: boolean
  toggle: () => void
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: true,
  width: SIDEBAR_OPEN_WIDTH,
  isDesktop: false,
  toggle: () => {},
})

export const useSidebar = () => useContext(SidebarContext)

export const Sidebar = memo(function Sidebar() {
  const { isOpen, toggle } = useSidebar()

  return (
    <>
      {/* Toggle Button when collapsed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={toggle}
            className="fixed top-4 left-4 z-50 p-3 rounded-xl bg-surface-container-high shadow-card hover:shadow-elevated transition-shadow"
            style={{ color: 'var(--primary)' }}
          >
            <Menu size={22} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? SIDEBAR_OPEN_WIDTH : SIDEBAR_CLOSED_WIDTH }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 h-full z-40 flex flex-col bg-surface-container-low border-r border-outline-variant/30"
        style={{ height: '100vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-outline-variant/30 min-h-[72px]">
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="open"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--primary)', boxShadow: '0 4px 16px var(--primary)' }}
                >
                  <span className="text-white font-black text-sm">N&L</span>
                </div>
                <span className="font-bold text-on-surface">NL Connect</span>
              </motion.div>
            ) : (
              <motion.div
                key="closed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto"
                style={{ background: 'var(--primary)', boxShadow: '0 4px 16px var(--primary)' }}
              >
                <span className="text-white font-black text-xs">N&L</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={toggle}
            className="p-2 rounded-lg hover:bg-surface-container-high transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {SIDEBAR_ITEMS.map(item => (
            <SidebarNavItem key={item.path} item={item} />
          ))}
        </nav>

        {/* Profile Section */}
        <ProfileSection />
      </motion.aside>
    </>
  )
})

function SidebarNavItem({ item }: { item: SidebarItem }) {
  const location = useLocation()
  const { isOpen } = useSidebar()
  const isActive = location.pathname.startsWith(item.path)
  const Icon = item.icon

  return (
    <NavLink
      to={item.path}
      className="flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200 group relative"
      style={{
        background: isActive ? 'var(--surface-container-high)' : 'transparent',
      }}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full"
          style={{ background: 'var(--primary)' }}
        />
      )}
      <Icon
        size={22}
        strokeWidth={isActive ? 2.4 : 1.8}
        className="flex-shrink-0"
        style={{ color: isActive ? 'var(--primary)' : 'var(--text-secondary)' }}
      />
      <AnimatePresence>
        {isOpen && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="text-sm font-medium whitespace-nowrap"
            style={{ color: isActive ? 'var(--primary)' : 'var(--text-secondary)' }}
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </NavLink>
  )
}

function ProfileSection() {
  const { profile, signOut } = useAuth()
  const { isOpen } = useSidebar()

  return (
    <div className="px-3 pt-4 border-t border-outline-variant/30">
      <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <User size={20} className="text-primary" />
          )}
        </div>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex-1 min-w-0"
            >
              <p className="text-sm font-semibold text-on-surface truncate">
                {profile?.displayName || 'Guest'}
              </p>
              <p className="text-xs text-on-surface-variant truncate">
                {profile?.username ? `@${profile.username}` : 'Tap to set up'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2 px-2 py-2 mt-1 rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer">
        <Settings size={18} className="text-on-surface-variant" />
        <AnimatePresence>
          {isOpen && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-on-surface-variant"
            >
              Settings
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <button
        onClick={() => signOut()}
        className="flex items-center gap-2 px-2 py-2 w-full mt-1 rounded-xl hover:bg-surface-container-high transition-colors"
      >
        <LogOut size={18} className="text-on-surface-variant" />
        <AnimatePresence>
          {isOpen && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-on-surface-variant"
            >
              Sign Out
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  )
}

interface DesktopLayoutProps {
  children: ReactNode
}

export const DesktopLayout = memo(function DesktopLayout({ children }: DesktopLayoutProps) {
  const [isDesktop, setIsDesktop] = useState(false)
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768)
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  const toggle = useCallback(() => setIsOpen(prev => !prev), [])

  const sidebarWidth = isOpen ? SIDEBAR_OPEN_WIDTH : SIDEBAR_CLOSED_WIDTH

  return (
    <SidebarContext.Provider value={{ isOpen, width: sidebarWidth, isDesktop, toggle }}>
      {isDesktop && <Sidebar />}
      <motion.div
        initial={false}
        animate={{ marginLeft: isDesktop ? sidebarWidth : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex-1 flex flex-col overflow-hidden"
        style={{ background: 'var(--surface)' }}
      >
        {children}
      </motion.div>
    </SidebarContext.Provider>
  )
})