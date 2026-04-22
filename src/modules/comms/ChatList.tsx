import { memo, useEffect, useState, useCallback, useRef } from 'react'
import { Avatar } from '@/components/shared/Avatar'
import VirtualList from '@/components/shared/VirtualList'
import { Flame, Video, Phone, Loader2, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { getISTTime } from '@/lib/date'
import { ChatListItemSkeleton } from '@/components/shared/SkeletonLoaders'

export interface ChatItem {
  chat_id: string
  last_message: string
  created_at: string
  sender_uid: string
  receiver_uid: string
  other_uid: string
  other_name: string
  other_phone: string
  other_avatar: string
  other_status: string
  is_online?: number
  last_seen?: string
  unread_count?: number
}

const ContactRow = memo(function ContactRow({
  chat, onClick, onLongPress
}: {
  chat: ChatItem; onClick: () => void; onLongPress: (e: React.MouseEvent | React.TouchEvent) => void
}) {
  const timeStr = getISTTime(chat.created_at)

  let pressTimer = useRef<any>(null);

  const handlePressStart = (e: any) => {
    pressTimer.current = setTimeout(() => { onLongPress(e) }, 600)
  }
  const handlePressEnd = () => clearTimeout(pressTimer.current)

  // Use real online data from backend
  const online = chat.is_online === 1
  const lastSeen = online ? 'online' : (() => {
    if (!chat.last_seen) return 'offline'
    return `last seen at ${getISTTime(chat.last_seen)}`
  })()

  return (
    <motion.div
      className="flex items-center gap-3 px-4 py-3 border-b cursor-pointer w-full"
      style={{ borderColor: 'var(--border-color)', background: 'var(--surface)' }}
      onClick={onClick}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onContextMenu={(e) => { e.preventDefault(); onLongPress(e); }}
      whileTap={{ backgroundColor: 'var(--surface-card)', scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      <div className="w-[50px] h-[50px] flex-shrink-0">
        <Avatar initials={chat.other_name || '?'} imageUrl={chat.other_avatar} size="lg" online={online} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 line-clamp-1">
          <span className="font-semibold text-[15px] truncate" style={{ color: 'var(--text-primary)' }}>
            {chat.other_name || chat.other_phone}
          </span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: 'var(--surface-container-high)', color: online ? '#30d158' : 'var(--text-tertiary)' }}>
            {online ? 'online' : 'offline'}
          </span>
        </div>
        <p
          className="text-[11px] truncate mt-0.5"
          style={{ color: 'var(--text-secondary)' }}
        >
          <span className="opacity-50">{lastSeen} • </span>
          {chat.last_message}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className="text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
          {timeStr}
        </span>
      </div>
    </motion.div>
  )
})

const COUNTRY_CODES = [
  { code: '+91', label: '+91' },
  { code: '+1', label: '+1' },
  { code: '+44', label: '+44' },
  { code: '+971', label: '+971' },
  { code: '+92', label: '+92' },
  { code: '+61', label: '+61' },
  { code: '+81', label: '+81' },
  { code: '+86', label: '+86' },
  { code: '+49', label: '+49' },
  { code: '+33', label: '+33' },
]

export default function ChatList({ onSelect }: { onSelect: (chat: ChatItem) => void }) {
  const { user } = useAuth()
  const [chats, setChats] = useState<ChatItem[]>([])
  const [loading, setLoading] = useState(true)
  const [countryCode, setCountryCode] = useState('+91')
  const [searchPhone, setSearchPhone] = useState('')
  const [isSearchingPhone, setIsSearchingPhone] = useState(false)

  const fetchChats = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch(`https://nl-connect-worker.nabeelhussain2k02.workers.dev/api/chats?uid=${user.uid}`)
      if (res.ok) {
        const data = await res.json()
        setChats(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchChats()
    // Poll every 5s for new messages (simulate realtime)
    const int = setInterval(fetchChats, 5000)
    return () => clearInterval(int)
  }, [fetchChats])

  const handleStartNewChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchPhone || !user) return
    setIsSearchingPhone(true)

    try {
      const fullPhone = `${countryCode}${searchPhone}`
      // Find user
      const res = await fetch(`https://nl-connect-worker.nabeelhussain2k02.workers.dev/api/users/find?phone=${encodeURIComponent(fullPhone)}`)
      if (res.ok) {
        const otherUser = await res.json()

        // Generate chat ID (alphabetic sort of UIDs)
        const sorted = [user.uid, otherUser.uid].sort()
        const chatId = `${sorted[0]}_${sorted[1]}`

        const newChat: ChatItem = {
          chat_id: chatId,
          last_message: "",
          created_at: new Date().toISOString(),
          sender_uid: user.uid,
          receiver_uid: otherUser.uid,
          other_uid: otherUser.uid,
          other_name: otherUser.display_name,
          other_phone: otherUser.phone,
          other_avatar: otherUser.avatar_url,
          other_status: otherUser.status
        }
        onSelect(newChat)
      } else {
        alert("Number is not registered on N&L Connect. Tell them to install it!")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSearchingPhone(false)
      setSearchPhone('')
    }
  }

  return (
    <div className="h-full flex flex-col w-full">
      {/* Header Add Contact Bar */}
      <div className="px-4 py-3 flex-shrink-0 z-10 bg-[var(--surface)] shadow-sm">
        <form onSubmit={handleStartNewChat} className="flex items-center h-11 overflow-hidden rounded-2xl focus-within:ring-2 ring-[var(--accent)] transition-shadow" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}>
          <select
            value={countryCode}
            onChange={e => setCountryCode(e.target.value)}
            className="h-full px-2 font-bold text-[13px] outline-none border-r cursor-pointer"
            style={{ background: 'var(--surface-container-high)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            {COUNTRY_CODES.map(c => (
              <option key={c.code} value={c.code} className="text-black bg-white dark:bg-black dark:text-white">{c.label}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Enter phone number..."
            value={searchPhone}
            onChange={e => setSearchPhone(e.target.value.replace(/\D/g, ''))}
            className="bg-transparent text-[14px] outline-none flex-1 font-medium px-3 h-full"
            style={{ color: 'var(--text-primary)' }}
          />
          {isSearchingPhone ? (
            <div className="px-3"><Loader2 size={16} className="animate-spin text-[var(--accent)]" /></div>
          ) : (
            searchPhone.length >= 6 && (
              <button type="submit" className="text-xs font-bold px-4 h-full border-l" style={{ color: 'var(--accent)', background: 'var(--surface-container-high)', borderColor: 'var(--border-color)' }}>ADD</button>
            )
          )}
        </form>
      </div>

      {/* List */}
      <div className="flex-1 overflow-hidden w-full relative">
        {loading ? (
          <div className="flex flex-col">
            {[1, 2, 3, 4, 5, 6].map(i => <ChatListItemSkeleton key={i} />)}
          </div>
        ) : chats.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-[var(--text-secondary)]">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--surface-container-high)' }}>
              <Flame size={40} className="text-[var(--text-tertiary)] opacity-30" />
            </div>
            <p className="font-bold text-[16px] text-[var(--text-primary)]">No Chats Yet</p>
            <p className="text-[13px] mt-2 opacity-70">Search a friend's phone number above to start secretly talking.</p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto w-full custom-scrollbar flex flex-col">
            {chats.map((chat) => (
              <ContactRow
                key={chat.chat_id}
                chat={chat}
                onClick={() => onSelect(chat)}
                onLongPress={() => {
                  const confirmDel = window.confirm(`Manage ${chat.other_name || chat.other_phone}?\n\n[OK] to Delete Chat\n[Cancel] to Mute (Mocked)`)
                  if (confirmDel) {
                    setChats(prev => prev.filter(c => c.chat_id !== chat.chat_id))
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
