import { memo, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/shared/Avatar'
import { Bell, Sun, Moon, Search, Check, X, Loader2, LogOut, Trash2, CloudDownload, RefreshCw } from 'lucide-react'
import { deleteUser } from 'firebase/auth'

export const TopBar = memo(function TopBar() {
  const { isDark, toggleTheme } = useTheme()
  const { user, profile, refreshProfile, logout } = useAuth()
  
  const [showProfile, setShowProfile] = useState(false)
  const [editName, setEditName] = useState(profile?.display_name || '')
  const [editStatus, setEditStatus] = useState(profile?.status || '')
  const [saving, setSaving] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<string | null>(null)
  const [unreadTotal, setUnreadTotal] = useState(0)
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)

  const fetchUnread = useCallback(async () => {
    if (!user) return
    try {
      // 1. Fetch real chat unreads
      const res = await fetch(`https://nl-connect-worker.nabeelhussain2k02.workers.dev/api/chats?uid=${user.uid}`)
      let chatNotifications: any[] = []
      let chatTotal = 0
      
      if (res.ok) {
        const data = await res.json()
        chatTotal = data.reduce((acc: number, chat: any) => acc + (chat.unread_count || 0), 0)
        chatNotifications = data.filter((c: any) => c.unread_count > 0).map((c: any) => ({
            type: 'chat',
            title: c.other_name,
            subtitle: c.last_message ? (c.last_message.length > 50 ? c.last_message.substring(0, 50) + '...' : c.last_message) : 'New message',
            image: c.other_avatar,
            initials: c.other_name?.charAt(0)
        }))
      }

      // 2. Add simulated call & JARVIS unreads from session (could be expanded)
      const aiUnread = localStorage.getItem('nl_ai_unread') === 'true' ? 1 : 0
      const callUnread = localStorage.getItem('nl_call_unread') === 'true' ? 1 : 0
      
      const sessionNotifications = []
      if (aiUnread) sessionNotifications.push({ type: 'ai', title: 'JARVIS', subtitle: 'New system update', initials: 'J' })
      if (callUnread) sessionNotifications.push({ type: 'call', title: 'Missed Call', subtitle: 'Voice call', initials: 'C' })

      setUnreadTotal(chatTotal + aiUnread + callUnread)
      setNotifications([...chatNotifications, ...sessionNotifications])

    } catch (e) { console.error(e) }
  }, [user])

  useEffect(() => {
    fetchUnread()
    const int = setInterval(fetchUnread, 5000)
    return () => clearInterval(int)
  }, [fetchUnread])

  const handleSaveProfile = async () => {
    if (!profile) return
    setSaving(true)
    try {
      await fetch(`https://nl-connect-worker.nabeelhussain2k02.workers.dev/api/users/me?uid=${profile.uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: editName, status: editStatus })
      })
      await refreshProfile()
      setShowProfile(false)
    } finally {
      setSaving(false)
    }
  }


  
  const handleCheckUpdate = async () => {
    setUpdating(true)
    setUpdateStatus('Checking...')
    try {
      const { CapacitorUpdater } = await import('@capgo/capacitor-updater')
      // This will trigger the update process if a new version is available on the configured endpoint
      const result = await CapacitorUpdater.getLatest()
      if (result && result.url) {
        setUpdateStatus('Update found! Downloading...')
        await CapacitorUpdater.download({
          url: result.url,
          version: result.version || 'latest',
        })
        setUpdateStatus('Update ready. Restarting...')
        setTimeout(() => CapacitorUpdater.reload(), 2000)
      } else {
        setUpdateStatus('App is up to date.')
        setTimeout(() => setUpdateStatus(null), 3000)
      }
    } catch (e) {
      console.error(e)
      setUpdateStatus('Update check failed.')
      setTimeout(() => setUpdateStatus(null), 3000)
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user || (!window.confirm("Are you sure you want to permanently delete your N&L Connect profile and messages? This cannot be undone."))) return
    
    try {
      // Delete from D1 
      await fetch(`https://nl-connect-worker.nabeelhussain2k02.workers.dev/api/users/me?uid=${user.uid}`, { method: 'DELETE' })
      // Delete from Firebase
      await deleteUser(user)
      window.location.reload()
    } catch(err) {
      console.error(err)
      alert("Failed to delete account. Please re-authenticate and try again.")
    }
  }

  return (
    <header
      id="top-bar"
      className="flex-shrink-0 pt-safe"
      style={{
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(20px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
        boxShadow: 'var(--shadow-header)',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <div className="flex items-center justify-between px-4 h-14">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-skeuo-sm flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #4f7dff 0%, #6c63ff 100%)',
              boxShadow: '0 4px 12px rgba(79,125,255,0.4), inset 0 1px 0 rgba(255,255,255,0.25)',
            }}
          >
            <span className="text-white font-black text-sm leading-none">N&L</span>
          </div>
          <span
            className="font-extrabold text-base tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Connect
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications / Unread Messages */}
          <motion.button
            id="topbar-notifications"
            className={`skeuo-btn w-9 h-9 flex items-center justify-center relative ${showNotifications ? 'bg-[var(--accent)]/10 text-[var(--accent)] shadow-none' : ''}`}
            onClick={() => setShowNotifications(!showNotifications)}
            whileTap={{ scale: 0.93, y: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            aria-label="Notifications"
          >
            <Bell size={17} />
            {unreadTotal > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: 'var(--accent-danger)', boxShadow: '0 2px 8px rgba(186,26,26,0.5)' }}
              >
                {unreadTotal > 99 ? '99+' : unreadTotal}
              </span>
            )}
          </motion.button>

          {/* Theme toggle */}
          <motion.button
            id="topbar-theme"
            className="skeuo-btn w-9 h-9 flex items-center justify-center"
            onClick={toggleTheme}
            whileTap={{ scale: 0.93, y: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            aria-label="Toggle theme"
          >
            {isDark
              ? <Sun  size={17} style={{ color: '#ffd60a' }} />
              : <Moon size={17} style={{ color: 'var(--text-secondary)' }} />
            }
          </motion.button>

          {/* Avatar */}
          <button className="active:scale-95 transition-transform" onClick={() => {
              setEditName(profile?.display_name || '')
              setEditStatus(profile?.status || '')
              setShowProfile(true)
          }}>
            <Avatar initials={profile?.display_name?.charAt(0) || 'NL'} imageUrl={profile?.avatar_url} size="sm" online={true} />
          </button>
        </div>
      </div>

      {/* Animated Notifications Dropdown */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="absolute top-16 right-4 left-4 sm:left-auto sm:w-80 bg-[var(--surface-raised)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-[100] overflow-hidden"
            style={{ backdropFilter: 'blur(20px)' }}
          >
            <div className="p-4 border-bottom border-white/5 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">Notifications</h3>
              <button onClick={() => setShowNotifications(false)} className="text-[var(--text-tertiary)]"><X size={14} /></button>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((n, i) => (
                  <div key={i} className="p-3 border-b border-white/5 hover:bg-black/5 flex items-center gap-3 transition-colors cursor-pointer">
                    <Avatar initials={n.title?.charAt(0)} imageUrl={n.image} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate">{n.title}</p>
                      <p className="text-[10px] text-[var(--text-secondary)] truncate">
                        {n.subtitle || 'New message available'}
                      </p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Bell size={24} className="mx-auto text-white/5 mb-2" />
                  <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-tighter">No new notifications</p>
                </div>
              )}
            </div>
            
            <div className="p-3 bg-black/5 text-center">
               <button 
                onClick={() => {
                  localStorage.removeItem('nl_ai_unread')
                  localStorage.removeItem('nl_call_unread')
                  setShowNotifications(false)
                  fetchUnread()
                }}
                className="text-[10px] font-black text-[var(--accent)] uppercase tracking-widest"
               >
                 Mark all as read
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Slideout Modal */}
      {showProfile && (
        <motion.div 
           className="absolute top-0 right-0 w-[85%] h-full bg-[var(--surface-raised)] border-l border-[var(--border-color)] shadow-2xl z-50 flex flex-col p-6"
           initial={{ x: '100%' }}
           animate={{ x: 0 }}
           transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
           <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-[var(--text-primary)]">Edit Profile</h2>
              <button onClick={() => setShowProfile(false)} className="w-8 h-8 flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-full"><X size={18} /></button>
           </div>
           
           <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 mb-3 rounded-full overflow-hidden border-2 border-[var(--accent)] shadow-md">
                 <img src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.display_name || '?'}`} className="w-full h-full object-cover" />
              </div>
              <p className="text-xs text-[var(--text-tertiary)] bg-black/5 px-3 py-1 rounded-full">{profile?.phone}</p>
           </div>

           <div className="space-y-4 flex-1">
              <div>
                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">Display Name</label>
                <input 
                  type="text" value={editName} onChange={e => setEditName(e.target.value)}
                  className="w-full h-11 bg-[var(--surface-sunken)] border border-[var(--border-color)] rounded-xl px-4 text-sm focus:ring-1 ring-[var(--accent)] outline-none text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">Bio / Status</label>
                <input 
                  type="text" value={editStatus} onChange={e => setEditStatus(e.target.value)}
                  className="w-full h-11 bg-[var(--surface-sunken)] border border-[var(--border-color)] rounded-xl px-4 text-sm focus:ring-1 ring-[var(--accent)] outline-none text-[var(--text-primary)]"
                />
              </div>
              </div>


           {/* App Update Section */}
           <div className="mb-6 p-4 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-color)]">
              <div className="flex items-center justify-between mb-3">
                 <div className="flex items-center gap-2">
                    <CloudDownload size={16} className="text-[var(--accent)]" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-[var(--text-primary)]">Software Update</span>
                 </div>
                 <span className="text-[9px] font-bold text-[var(--text-tertiary)] bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full">v1.2.0</span>
              </div>
              <p className="text-[10px] text-[var(--text-secondary)] mb-4">Keep your N&L Connect experience smooth and secure with the latest features.</p>
              <button 
                onClick={handleCheckUpdate}
                disabled={updating}
                className="w-full py-2.5 bg-[var(--accent)]/10 text-[var(--accent)] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {updating ? <RefreshCw className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                {updateStatus || 'Check for Update'}
              </button>
           </div>

           <div className="flex flex-col gap-3 mt-4">
               <button 
                 onClick={handleSaveProfile}
                 disabled={saving}
                 className="w-full h-12 bg-[var(--accent)] text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
               >
                 {saving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                 Save Changes
               </button>

               <div className="flex gap-3">
                 <button 
                    onClick={logout}
                    className="flex-1 h-12 bg-black/5 dark:bg-white/5 text-[var(--text-primary)] rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95"
                 >
                    <LogOut size={16} /> Logout
                 </button>
                 <button 
                    onClick={handleDeleteAccount}
                    className="flex-1 h-12 bg-red-500/10 text-red-500 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95"
                 >
                    <Trash2 size={16} /> Delete
                 </button>
               </div>
           </div>
        </motion.div>
      )}
    </header>
  )
})
