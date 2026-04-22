import { memo, useCallback } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Home, MessageCircle, Music, Bot, Gamepad2,
} from 'lucide-react'

interface NavItem {
  path:  string
  icon:  React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties; className?: string }>
  label: string
  id:    string
}

const NAV_ITEMS: NavItem[] = [
  { path: '/home',   icon: Home,          label: 'Home',  id: 'nav-home'   },
  { path: '/comms',  icon: MessageCircle, label: 'Chat',  id: 'nav-comms'  },
  { path: '/media',  icon: Music,         label: 'Media', id: 'nav-media'  },
  { path: '/ai',     icon: Bot,           label: 'AI',    id: 'nav-ai'     },
  { path: '/gaming', icon: Gamepad2,      label: 'Games', id: 'nav-gaming' },
]

const NavTabItem = memo(function NavTabItem({ item }: { item: NavItem }) {
  const location = useLocation()
  const isActive = location.pathname.startsWith(item.path)
  const Icon = item.icon

  return (
    <NavLink
      id={item.id}
      to={item.path}
      className="flex flex-col items-center justify-center flex-1 min-w-0 py-1.5 gap-0.5 relative"
    >
      <motion.div
        className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 w-full"
        whileTap={{ scale: 0.9, y: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {/* Active glow pill */}
        {isActive && (
          <motion.div
            layoutId="nav-active-pill"
            className="absolute inset-x-2 -top-0.5 h-[3px] rounded-full"
            style={{ background: 'var(--nav-active-color)', boxShadow: `0 2px 12px var(--nav-active-color)` }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          />
        )}

        <Icon
          size={21}
          strokeWidth={isActive ? 2.4 : 1.6}
          style={{
            color: isActive ? 'var(--nav-active-color)' : 'var(--nav-inactive)',
            transition: 'color 200ms ease',
          }}
        />
        <span
          className="text-[10px] font-semibold truncate leading-none"
          style={{
            color: isActive ? 'var(--nav-active-color)' : 'var(--nav-inactive)',
            transition: 'color 200ms ease',
          }}
        >
          {item.label}
        </span>
      </motion.div>
    </NavLink>
  )
})

export const BottomNav = memo(function BottomNav() {
  return (
    <nav
      id="bottom-nav"
      className="flex-shrink-0 pb-safe md:hidden"
      style={{
        background:  'var(--nav-bg)',
        backdropFilter: 'blur(20px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
        borderTop: '1px solid var(--border-color)',
      }}
    >
      <div className="flex items-stretch h-14 px-1">
        {NAV_ITEMS.map(item => (
          <NavTabItem key={item.path} item={item} />
        ))}
      </div>
    </nav>
  )
})
