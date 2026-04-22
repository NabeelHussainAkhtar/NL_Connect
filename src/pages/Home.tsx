import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, Music, Image, Bot, Gamepad2, Bell, Video, Rss, Settings, LogOut, Trash2, User as UserIcon, Search, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { SmartSearchBar } from '@/components/shared/SmartSearchBar'
import { getSearchableDataset, DiscoveryResult } from '@/lib/discovery'
import WorkerPool from '@/lib/worker-pool'
import { useRef } from 'react'

interface DashboardModule {
  id: string
  label: string
  emoji: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties; className?: string }>
  path: string
  accent: string
  desc: string
  badge?: string
}

const BASE_MODULES: DashboardModule[] = [
  { id: 'comms', label: 'Chat', emoji: '💬', icon: MessageCircle, path: '/comms', accent: 'var(--accent)', desc: 'Secure comms' },
  { id: 'music', label: 'Music', emoji: '🎵', icon: Music, path: '/media', accent: '#bf5af2', desc: 'YouTube Audio' },
  { id: 'ai', label: 'AI', emoji: '🤖', icon: Bot, path: '/ai', accent: '#4f7dff', desc: 'Ask anything' },
  { id: 'gaming', label: 'Games', emoji: '🎮', icon: Gamepad2, path: '/gaming', accent: '#30d158', desc: 'Live Ludo' },
  { id: 'video', label: 'Video', emoji: '📺', icon: Video, path: '/media', accent: '#ffd60a', desc: 'Watch Party' },
]

export default function Home() {
  const navigate = useNavigate()
  const { profile, user, logout } = useAuth()
  const [showSettings, setShowSettings] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [globalSearch, setGlobalSearch] = useState('')
  const [searchResults, setSearchResults] = useState<DiscoveryResult[]>([])
  const [totalChats, setTotalChats] = useState<number | string>('...')
  const [chatBadgeSeen, setChatBadgeSeen] = useState(false)
  const [notifBadgeSeen, setNotifBadgeSeen] = useState(false)
  
  const workerPoolRef = useRef<WorkerPool | null>(null)

  useEffect(() => {
    if (!user) return
    fetch(`https://nl-connect-worker.nabeelhussain2k02.workers.dev/api/chats?uid=${user.uid}`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) {
          setTotalChats(d.length)
        } else {
          setTotalChats(0)
        }
      })
      .catch(() => setTotalChats(0))
  }, [user])

  useEffect(() => {
    const chatSeen = localStorage.getItem('chatBadgeSeen') === 'true'
    const notifSeen = localStorage.getItem('notifBadgeSeen') === 'true'
    setChatBadgeSeen(chatSeen)
    setNotifBadgeSeen(notifSeen)
  }, [])

  const firstName = profile?.display_name?.split(' ')[0] || 'Friend'

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) return

    try {
      setDeleting(true)
      await fetch(`https://nl-connect-worker.nabeelhussain2k02.workers.dev/api/users/me?uid=${profile?.uid}`, { method: 'DELETE' })
      if (user) await user.delete()
      await logout()
    } catch (err) {
      console.error(err)
      alert("Failed to delete account. Please try logging out and logging back in first before deleting.")
    } finally {
      setDeleting(false)
    }
  }

  const handleModuleClick = (moduleId: string, path: string) => {
    if (moduleId === 'comms' && !chatBadgeSeen) {
      setChatBadgeSeen(true)
      localStorage.setItem('chatBadgeSeen', 'true')
    }
    if (moduleId === 'notifs' && !notifBadgeSeen) {
      setNotifBadgeSeen(true)
      localStorage.setItem('notifBadgeSeen', 'true')
    }
    navigate(path)
  }

  useEffect(() => {
    // [PHASE 9] Initialize Search Worker Pool with static URL factory for Vite
    workerPoolRef.current = new WorkerPool(
      () => new Worker(new URL('../lib/local-worker.ts', import.meta.url), { type: 'module' }),
      1 // 1 thread is enough for home search
    )
    return () => workerPoolRef.current?.terminate()
  }, [])

  useEffect(() => {
    if (!globalSearch.trim()) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      if (workerPoolRef.current) {
        try {
          const results = await workerPoolRef.current.runTask({
            type: 'DISCOVERY_SEARCH',
            data: { 
              query: globalSearch, 
              dataset: getSearchableDataset() 
            }
          })
          setSearchResults(results as DiscoveryResult[])
        } catch (e) {
          console.error("Search worker failed", e)
        }
      }
    }, 50) // Tiny debounce for rapid typing stability

    return () => clearTimeout(timer)
  }, [globalSearch])

  const modules = useMemo(() => {
    // If not searching, show standard dashboard modules
    if (!globalSearch) {
      const copy = [...BASE_MODULES]
      const chatIdx = copy.findIndex(m => m.id === 'comms')
      if (chatIdx >= 0 && !chatBadgeSeen && typeof totalChats === 'number' && totalChats > 0) {
        copy[chatIdx] = { ...copy[chatIdx], badge: totalChats.toString(), desc: `${totalChats} active` }
      } else if (chatIdx >= 0) {
        copy[chatIdx] = { ...copy[chatIdx], badge: undefined, desc: 'Secure comms' }
      }
      const notifIdx = copy.findIndex(m => m.id === 'notifs')
      if (notifIdx >= 0 && !notifBadgeSeen) {
        copy[notifIdx] = { ...copy[notifIdx], badge: '3', desc: '3 alerts' }
      } else if (notifIdx >= 0) {
        copy[notifIdx] = { ...copy[notifIdx], badge: undefined, desc: 'Activity' }
      }
      return copy
    }

    // While searching, return null to hide standard grid if needed, 
    // or keep filtering the modules themselves.
    // In this upgraded version, we use the results from the discovery engine.
    return []
  }, [globalSearch, totalChats, chatBadgeSeen, notifBadgeSeen])

  const handleDiscoverySelect = (res: DiscoveryResult) => {
    if (res.path) navigate(res.path)
    setGlobalSearch('')
  }

  return (
    <div className="h-full overflow-y-auto relative" style={{ background: 'var(--surface)' }}>
      {/* Hero Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Hey {firstName} 👋
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Everything in one place.
          </p>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="relative w-11 h-11 rounded-2xl overflow-hidden active:scale-95 transition-transform"
          style={{ boxShadow: 'var(--shadow-card)', border: '2px solid var(--border-color)' }}
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="w-full h-full flex items-center justify-center text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg, #4f7dff, #6c63ff)' }}>{firstName[0]}</span>
          )}
        </button>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0, scaleY: 0.9 }}
            animate={{ opacity: 1, height: 'auto', scaleY: 1 }}
            exit={{ opacity: 0, height: 0, scaleY: 0.9 }}
            style={{ transformOrigin: 'top' }}
            className="px-5 mb-4"
          >
            <div className="p-4 rounded-2xl space-y-3" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-elevated)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'var(--surface-container-high)' }}>
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : <UserIcon className="w-full h-full p-2 opacity-50" />}
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>{profile?.display_name}</h3>
                  <p className="text-xs opacity-60 truncate" style={{ color: 'var(--text-secondary)' }}>{profile?.phone}</p>
                </div>
              </div>

              <p className="text-xs italic opacity-80 mb-2" style={{ color: 'var(--text-primary)' }}>"{profile?.status}"</p>

              <hr style={{ borderColor: 'var(--border-color)' }} className="my-2" />

              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl active:opacity-70 transition-opacity"
                style={{ color: 'var(--text-primary)', background: 'var(--surface-container)' }}
              >
                <LogOut size={16} /> Sign Out
              </button>

              <button
                onClick={handleDeleteAccount}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl active:opacity-70 transition-opacity"
                style={{ color: 'var(--accent-danger)', background: 'rgba(186,26,26,0.08)' }}
                disabled={deleting}
              >
                <Trash2 size={16} /> {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="px-5 pb-1">
        <SmartSearchBar 
          value={globalSearch}
          onChange={setGlobalSearch}
          results={searchResults}
          onSelect={handleDiscoverySelect}
          placeholder="Search Project (Music, AI, Contacts)..."
        />
      </div>

      {/* Quick Stats Row */}
      {!globalSearch && (
        <div className="flex gap-3 px-5 pb-4 overflow-x-auto no-scrollbar">
          {[
            { label: 'Conversations', val: totalChats, color: '#4f7dff' },
            { label: 'Playing', val: '▶ Music', color: '#bf5af2' },
            { label: 'Cloud Status', val: 'Online', color: '#30d158' },
          ].map(stat => (
            <div key={stat.label} className="flex-shrink-0 px-4 py-3 rounded-2xl" style={{ minWidth: 110, background: 'var(--surface-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-raised)' }}>
              <p className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</p>
              <p className="text-sm font-extrabold mt-0.5" style={{ color: stat.color }}>{stat.val}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search Results */}
      {globalSearch && searchResults.length === 0 && (
        <div className="flex flex-col items-center justify-center p-8 mt-4 opacity-50">
          <Search size={40} className="mb-2" />
          <p className="font-bold">No matching results in project</p>
        </div>
      )}

      {globalSearch && searchResults.length > 0 && (
          <div className="px-5 py-2">
            <p className="text-[10px] font-black uppercase text-[var(--text-tertiary)] opacity-60 mb-2">Search results for "{globalSearch}"</p>
            <div className="grid grid-cols-1 gap-2">
                {searchResults.slice(0, 3).map(res => (
                    <button key={res.id} onClick={() => handleDiscoverySelect(res)} className="flex items-center gap-3 p-3 rounded-2xl text-left" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-raised)' }}>
                         <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-container-high)' }}>
                             <Search size={14} style={{ color: res.accent }} />
                         </div>
                         <div className="flex-1 text-left">
                             <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{res.title}</p>
                             <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{res.subtitle}</p>
                         </div>
                         <Sparkles size={12} style={{ color: 'var(--accent)' }} />
                    </button>
                ))}
            </div>
          </div>
      )}

      {/* Module Grid */}
      <div className="grid grid-cols-2 gap-3 px-5 pb-6">
        {modules.map((mod, i) => {
          const Icon = mod.icon
          return (
            <motion.button
              key={mod.id} id={`module-${mod.id}`}
              className="p-4 flex flex-col gap-3 text-left relative overflow-hidden rounded-2xl"
              style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}
              onClick={() => handleModuleClick(mod.id, mod.path)}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 400, damping: 30 }}
              whileTap={{ scale: 0.97, y: 1 }}
            >
              {/* Subtle accent glow */}
              <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full opacity-15" style={{ background: `radial-gradient(circle, ${mod.accent}, transparent)` }} />
              
              {/* Icon container */}
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${mod.accent}18, ${mod.accent}08)`, border: `1px solid ${mod.accent}15` }}>
                <Icon size={20} style={{ color: mod.accent }} />
              </div>
              
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{mod.label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{mod.desc}</p>
              </div>
              {mod.badge && <span className="chat-badge absolute top-3 right-3" style={{ fontSize: 9 }}>{mod.badge}</span>}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
