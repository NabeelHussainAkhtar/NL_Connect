import { memo, useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar } from '@/components/shared/Avatar'
import { ChevronLeft, Phone, Video, Send, Loader2, MoreVertical, Bell, BellOff, Trash2, Shield, VolumeX, UserX, Smile, Paperclip, Image, Camera, Mic, File, Play, Headphones, Download, Share2, X, ExternalLink, Check, CheckCheck, Gift, Sticker as StickerIcon, Search as SearchIcon } from 'lucide-react'
import { ChatItem } from './ChatList'
import { useAuth } from '@/contexts/AuthContext'
import { useCall } from '@/contexts/CallContext'
import { getISTTime } from '@/lib/date'
import VirtualList from '@/components/shared/VirtualList'
import { MessageSkeleton } from '@/components/shared/SkeletonLoaders'

const WORKER = 'https://nl-connect-worker.nabeelhussain2k02.workers.dev'

interface Message {
  id: number
  chat_id: string
  sender_uid: string
  receiver_uid: string
  content: string
  created_at: string
  media_url?: string
  media_type?: 'image' | 'video' | 'audio' | 'document'
  media_name?: string
  media_size?: number
  status?: 'sent' | 'delivered' | 'seen'
}

const toIST = getISTTime

// Render text with clickable links
function MessageText({ text, isMe }: { text: string; isMe: boolean }) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)
  return (
    <span>
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={`underline inline-flex items-center gap-0.5 ${isMe ? 'text-white/90' : 'text-blue-500'}`}
            onClick={e => e.stopPropagation()}
          >
            {part.length > 40 ? part.slice(0, 40) + '…' : part}
            <ExternalLink size={10} />
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}

// Full WhatsApp-style emoji categories
const EMOJI_CATEGORIES = {
  '😀 Smileys': ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','☺️','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖','😺','😸','😹','😻','😼','😽','🙀','😿','😾'],
  '👋 People': ['👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁️','👅','👄','🫦','💋','👶','🧒','👦','👧','🧑','👱','👨','🧔','👩','🧓','👴','👵','🙍','🙎','🙅','🙆','💁','🙋','🧏','🙇','🤦','🤷'],
  '🐶 Animals': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪲','🦟','🦗','🕷️','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🦣','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐕‍🦺','🐈','🐾','🦃','🦤','🦚','🦜','🦢','🦩','🕊️','🐇','🦝','🦨','🦡','🦫','🦦','🦥','🐁','🐀','🐿️','🦔'],
  '🍎 Food': ['🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥮','🍢','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🧃','🥤','🧋','☕','🍵','🧉','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧊','🥄','🍴','🍽️','🥣','🥡','🥢'],
  '⚽ Activity': ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','🎯','🪀','🪆','🎮','🕹️','🎲','🧩','♟️','🪅','🩰','🎭','🎨','🎬','🎤','🎧','🎼','🎵','🎶','🎹','🪘','🥁','🎷','🎺','🎸','🪕','🎻','🎙️','📻','📺','📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟','📠','📺','📻','🧭','⏱️','⏰','⌛','⏳'],
  '🚗 Travel': ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🏍️','🛵','🛺','🚲','🛴','🛹','🛼','🚏','🛣️','🛤️','⛽','🚨','🚥','🚦','🛑','🚧','⚓','🪝','⛵','🛶','🚤','🛳️','⛴️','🛥️','🚢','✈️','🛩️','🛫','🛬','🪂','💺','🚁','🚟','🚠','🚡','🛰️','🚀','🛸','🎆','🎇','🗺️','🧳','🗼','🏰','🏯','🗽','🗿','🏛️','🕌','🕍','⛪','🕋','⛩️','🛕','🏠','🏡','🏢','🏣','🏤','🏥','🏦','🏨','🏩','🏪','🏫','🏭','🏗️'],
  '💡 Objects': ['💡','🔦','🕯️','🪔','🧱','💎','🔮','🪄','🧿','💈','🔭','🔬','🩺','💊','🩹','🩺','🩻','🩹','🧬','🦠','🧪','🧫','🧲','🪜','🧰','🪛','🔧','🔨','⚒️','🛠️','⛏️','🪚','🔩','🪤','🪣','🪟','🛋️','🪑','🚿','🛁','🪥','🧴','🧹','🧺','🧻','🪣','🧼','🫧','🪥','🪒','🧷','🪡','🪢','🧵','🧶','🪞','🪟','🛏️','🛒','🎁','🎀','🎊','🎉','🎈','🎏','🎐','🎑','🧨','✨','💥','💢','💬','💭','🗯️','♨️','💦','💧','🫧','💨','🌪️','🌫️','🌈','⚡','🔥','✨','⭐','🌟','💫','⭕','❌','❓','❗','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤'],
  '🏳️ Flags': ['🏳️','🏴','🏁','🚩','🏳️‍🌈','🏳️‍⚧️','🏴‍☠️','🇦🇪','🇦🇫','🇦🇺','🇧🇩','🇧🇷','🇨🇦','🇨🇳','🇩🇪','🇪🇬','🇪🇸','🇫🇷','🇬🇧','🇮🇩','🇮🇳','🇮🇶','🇮🇷','🇮🇹','🇯🇵','🇰🇷','🇲🇾','🇲🇽','🇳🇬','🇳🇱','🇳🇵','🇳🇿','🇵🇰','🇵🇭','🇷🇺','🇸🇦','🇸🇬','🇹🇷','🇹🇿','🇺🇸','🇻🇳','🇿🇦'],
}

const RECENTS_KEY = 'nl_emoji_recents'

function getRecentEmojis(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]') }
  catch { return [] }
}

function saveRecentEmoji(emoji: string) {
  try {
    const recents = getRecentEmojis().filter(e => e !== emoji)
    recents.unshift(emoji)
    localStorage.setItem(RECENTS_KEY, JSON.stringify(recents.slice(0, 24)))
  } catch { /* ignore */ }
}

export default function ChatThread({ chat, onClose }: { chat: ChatItem, onClose: () => void }) {
  const { user } = useAuth()
  const { initiateCall } = useCall()

  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  
  // Drawer State (Keyboard Replacement)
  const [activeDrawer, setActiveDrawer] = useState<'emoji' | 'sticker' | 'gif' | null>(null)
  const [emojiCategory, setEmojiCategory] = useState('😀 Smileys')
  const [mediaQuery, setMediaQuery] = useState('')
  const [emojiQuery, setEmojiQuery] = useState('')
  const [gifs, setGifs] = useState<any[]>([])
  const [stickers, setStickers] = useState<any[]>([])
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
  const [loadingMedia, setLoadingMedia] = useState(false)

  const [recentEmojis, setRecentEmojis] = useState<string[]>(getRecentEmojis())
  const [isTyping, setIsTyping] = useState(false) // other user typing
  const [presence, setPresence] = useState<{ is_online: boolean, last_seen: string | null } | null>(null)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  
  // Audio Recorder State
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingReportedRef = useRef(false)

  const fetchMessages = useCallback(async () => {
    // [PERFORMANCE] Skip polling if tab is backgrounded and we already have messages
    if (!document.hasFocus() && messages.length > 0) return

    if (!user?.uid || !chat.chat_id) return
    try {
      const res = await fetch(`${WORKER}/api/messages?chat_id=${chat.chat_id}`)
      if (res.ok) {
        const msgs = await res.json()
        setMessages(msgs)
        // Mark as seen if there are messages from the other user
        if (msgs.some((m: Message) => m.sender_uid !== user.uid && m.status !== 'seen')) {
          fetch(`${WORKER}/api/messages/read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chat.chat_id, uid: user.uid })
          }).catch(() => {})
        }
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [chat.chat_id, user?.uid, messages.length])

  // Poll messages, typing, and presence
  // Poll messages, typing, and presence
  useEffect(() => {
    if (!chat.chat_id || !user?.uid) return
    fetchMessages()
    const msgInt = setInterval(fetchMessages, 2000) // Faster polling for auto-read feel
    
    const typingInt = setInterval(async () => {
      if (!chat.other_uid) return
      try {
        const [typeRes, presRes] = await Promise.all([
          fetch(`${WORKER}/api/typing?chat_id=${chat.chat_id}&uid=${user.uid}`),
          fetch(`${WORKER}/api/presence?uids=${chat.other_uid}`)
        ])
        if (typeRes.ok) {
          const d = await typeRes.json()
          setIsTyping(d.typing === true)
        }
        if (presRes.ok) {
          const p = await presRes.json()
          if (Array.isArray(p) && p.length > 0) setPresence(p[0])
        }
      } catch { /* ignore */ }
    }, 2000)
    
    return () => { clearInterval(msgInt); clearInterval(typingInt) }
  }, [chat.chat_id, fetchMessages, user?.uid, chat.other_uid])

  // Report presence: online on mount, offline on unmount
  useEffect(() => {
    if (!user) return
    fetch(`${WORKER}/api/presence`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: user.uid, is_online: true })
    }).catch(() => {})
    return () => {
      fetch(`${WORKER}/api/presence`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, is_online: false })
      }).catch(() => {})
    }
  }, [user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (settingsOpen && !t.closest('.settings-dropdown-container')) setSettingsOpen(false)
      if (activeDrawer && !t.closest('.emoji-picker-container')) setActiveDrawer(null)
      if (showAttachmentMenu && !t.closest('.attachment-menu-container')) setShowAttachmentMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [settingsOpen, activeDrawer, showAttachmentMenu])

  // Report typing to backend
  const reportTyping = useCallback(async (typing: boolean) => {
    if (!user) return
    try {
      await fetch(`${WORKER}/api/typing`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chat.chat_id, uid: user.uid, typing })
      })
    } catch { /* ignore */ }
  }, [chat.chat_id, user])

  const handleInputChange = (val: string) => {
    setInputText(val)
    if (!typingReportedRef.current && val.length > 0) {
      typingReportedRef.current = true
      reportTyping(true)
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      typingReportedRef.current = false
      reportTyping(false)
    }, 3000)
  }

  const handleSend = async (e?: React.FormEvent, type: 'text' | 'sticker' | 'gif' = 'text', content?: string) => {
    if (e) e.preventDefault()
    const msgContent = content || inputText.trim()
    if (!msgContent && type === 'text') return
    if (!user) return
    
    reportTyping(false)
    typingReportedRef.current = false
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)

    const tempMsg: Message = {
      id: Date.now(), chat_id: chat.chat_id,
      sender_uid: user.uid, receiver_uid: chat.other_uid,
      content: type === 'text' ? msgContent : '', 
      media_url: type !== 'text' ? msgContent : undefined,
      media_type: type === 'sticker' ? 'image' : type === 'gif' ? 'video' : undefined,
      created_at: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, tempMsg])
    if (type === 'text') setInputText('')
    
    try {
      await fetch(`${WORKER}/api/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chat_id: chat.chat_id, sender_uid: user.uid, receiver_uid: chat.other_uid, 
          content: tempMsg.content, media_url: tempMsg.media_url, media_type: tempMsg.media_type 
        })
      })
    } catch (err) { console.error('send failed', err) }
  }

  const handleMediaSearch = async (q: string, type: 'gif' | 'sticker') => {
    setMediaQuery(q)
    if (!q.trim()) {
      fetchTrendingMedia(type)
      return
    }
    setLoadingMedia(true)
    const apiKey = import.meta.env.VITE_GIPHY_API_KEY || 'nr9qFeFYIHy3EDbqH8snWAhklgwUQHCY'
    const endpoint = type === 'gif' ? 'gifs' : 'stickers'
    try {
      const res = await fetch(`https://api.giphy.com/v1/${endpoint}/search?api_key=${apiKey}&q=${encodeURIComponent(q)}&limit=24&rating=g`) 
      if (res.ok) {
        const d = await res.json()
        if (type === 'gif') setGifs(d.data || [])
        else setStickers(d.data || [])
      }
    } catch { 
      if (type === 'gif') setGifs([])
      else setStickers([])
    }
    finally { setLoadingMedia(false) }
  }

  const fetchTrendingMedia = async (type: 'gif' | 'sticker') => {
    setLoadingMedia(true)
    const apiKey = import.meta.env.VITE_GIPHY_API_KEY || 'nr9qFeFYIHy3EDbqH8snWAhklgwUQHCY'
    const endpoint = type === 'gif' ? 'gifs' : 'stickers'
    try {
      const res = await fetch(`https://api.giphy.com/v1/${endpoint}/trending?api_key=${apiKey}&limit=24&rating=g`) 
      if (res.ok) {
        const d = await res.json()
        if (type === 'gif') setGifs(d.data || [])
        else setStickers(d.data || [])
      }
    } catch { }
    finally { setLoadingMedia(false) }
  }

  const handleCall = (type: 'audio' | 'video') => initiateCall(chat.other_uid, type === 'video')

  const handleSettingsAction = (action: string) => {
    setSettingsOpen(false)
    switch (action) {
      case 'mute': alert(`Muted notifications for ${chat.other_name}`); break
      case 'unmute': alert(`Unmuted notifications for ${chat.other_name}`); break
      case 'delete': if (confirm(`Delete chat with ${chat.other_name}?`)) alert('Chat deleted'); break
      case 'block': if (confirm(`Block ${chat.other_name}?`)) alert('User blocked'); break
      case 'report': alert(`Reported ${chat.other_name}`); break
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    saveRecentEmoji(emoji)
    setRecentEmojis(getRecentEmojis())
    setInputText(prev => prev + emoji)
  }

  const handleDownload = async (url: string, name: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = name || 'file'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
    } catch (error) {
      console.error('Download failed', error)
      const a = document.createElement('a')
      a.href = url; a.download = name; a.target = '_blank'; a.click()
    }
  }

  const handleShare = async (msg: Message) => {
    const shareData: ShareData = {
      title: 'N&L Connect',
      text: msg.content || msg.media_name || 'Shared from N&L Connect',
      url: msg.media_url || window.location.href
    }
    try { await navigator.share(shareData) } catch { /* User cancelled */ }
  }

  const uploadAndSend = async (blob: Blob, name: string, type: 'image' | 'audio' | 'document') => {
    if (!user) return
    try {
      const buffer = await blob.arrayBuffer()
      const uploadRes = await fetch(`${WORKER}/api/media/upload?name=${encodeURIComponent(name)}`, {
        method: 'PUT',
        headers: { 'Content-Type': blob.type || 'application/octet-stream' },
        body: buffer
      })

      if (!uploadRes.ok) throw new Error('Upload failed')
      const { url: mediaUrl } = await uploadRes.json()

      const msgRes = await fetch(`${WORKER}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chat.chat_id,
          sender_uid: user.uid,
          receiver_uid: chat.other_uid,
          content: '',
          media_url: mediaUrl,
          media_type: type,
          media_name: name,
          media_size: blob.size
        })
      })

      if (msgRes.ok) {
        const newMsg = await msgRes.json()
        setMessages(prev => [...prev, newMsg])
      }
    } catch (err) {
      console.error(err)
      alert('Failed to send media.')
    }
  }

  const handleAttachmentSelect = async (type: 'image' | 'camera' | 'document' | 'audio') => {
    setShowAttachmentMenu(false)
    if (!user) return

    if (type === 'camera') {
       try {
         const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')
         const photo = await Camera.getPhoto({
           quality: 80,
           allowEditing: false,
           resultType: CameraResultType.Base64,
           source: CameraSource.Camera
         })
         
         if (photo.base64String) {
           const blob = await (await fetch(`data:image/${photo.format};base64,${photo.base64String}`)).blob()
           await uploadAndSend(blob, `cam_${Date.now()}.${photo.format}`, 'image')
         }
       } catch (e) {
         console.warn("Camera cancelled or failed", e)
       }
       return
    }

    const input = document.createElement('input')
    input.type = 'file'
    switch (type) {
      case 'image': input.accept = 'image/*,video/*'; break
      case 'document': input.accept = '.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx'; break
      case 'audio': input.accept = 'audio/*'; break
    }
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const mediaType = type === 'document' ? 'document' : type === 'audio' ? 'audio' : 'image'
      await uploadAndSend(file, file.name, mediaType)
    }
    input.click()
  }

  // Handle Audio Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        if (recTimerRef.current) clearInterval(recTimerRef.current)
        setRecordingTime(0)
        setIsRecording(false)

        if (audioChunksRef.current.length > 0 && user) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          
          try {
            const uploadRes = await fetch(`${WORKER}/api/media/upload?name=voice_note.webm`, {
              method: 'PUT', headers: { 'Content-Type': 'audio/webm' }, body: audioBlob
            })
            if (!uploadRes.ok) throw new Error('Upload failed')
            
            const { url: mediaUrl } = await uploadRes.json()
            const msgRes = await fetch(`${WORKER}/api/messages`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: chat.chat_id, sender_uid: user.uid, receiver_uid: chat.other_uid, content: '', media_url: mediaUrl, media_type: 'audio', media_name: 'Voice Note' })
            })
            if (msgRes.ok) { const newMsg = await msgRes.json(); setMessages(prev => [...prev, newMsg]) }
          } catch (e) {
            console.error('Audio send failed', e)
          }
        }
      }

      recorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      recTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000)
    } catch (e) {
      alert('Microphone access denied or unavailable.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      audioChunksRef.current = [] // Clear chunks so onstop sends nothing
      mediaRecorderRef.current.stop()
    }
  }

  const allCategories = { '🕐 Recents': recentEmojis, ...EMOJI_CATEGORIES }
  const filteredEmojis = emojiQuery.trim() 
    ? Object.values(EMOJI_CATEGORIES).flat().filter((e, i) => e.includes(emojiQuery) || i === 0) // Basic search if needed
    : (allCategories as any)[emojiCategory] as string[]

  return (
    <motion.div
      className="absolute inset-0 bg-[var(--surface)] z-50 flex flex-col w-full h-full"
      initial={{ x: '100%', opacity: 0.5 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0.5 }}
      transition={{ type: 'spring', damping: 30, stiffness: 400 }}
    >
      {/* Header */}
      <div className="h-16 px-2 flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--surface-raised)] shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/5">
            <ChevronLeft size={24} style={{ color: 'var(--text-primary)' }} />
          </button>
          <div className="flex items-center gap-3">
            <Avatar initials={chat.other_name || '?'} imageUrl={chat.other_avatar} size="md" />
            <div>
              <h3 className="font-bold text-[16px] leading-none" style={{ color: 'var(--text-primary)' }}>{chat.other_name || chat.other_phone}</h3>
              <p className="text-[11px] font-medium" style={{ color: isTyping ? '#30d158' : presence?.is_online ? 'var(--accent)' : 'var(--text-secondary)' }}>
                {isTyping ? '✏️ typing…' : presence?.is_online ? 'Active Now' : presence?.last_seen ? `last seen at ${toIST(presence.last_seen)}` : 'Offline'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 pr-2 relative settings-dropdown-container">
          <button onClick={() => handleCall('audio')} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/5">
            <Phone size={20} style={{ color: 'var(--accent)' }} />
          </button>
          <button onClick={() => handleCall('video')} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/5">
            <Video size={21} style={{ color: 'var(--accent)' }} />
          </button>
          <button onClick={() => setSettingsOpen(!settingsOpen)} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/5">
            <MoreVertical size={20} style={{ color: 'var(--text-secondary)' }} />
          </button>

          {settingsOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="absolute top-12 right-2 w-56 bg-[var(--surface-raised)] border border-[var(--border-color)] rounded-2xl shadow-xl z-50 overflow-hidden"
            >
              <div className="p-2">
                {[
                  { action: 'mute', Icon: BellOff, label: 'Mute Notifications' },
                  { action: 'unmute', Icon: Bell, label: 'Unmute Notifications' },
                ].map(({ action, Icon, label }) => (
                  <button key={action} onClick={() => handleSettingsAction(action)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left">
                    <Icon size={18} style={{ color: 'var(--text-secondary)' }} />
                    <span className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>{label}</span>
                  </button>
                ))}
                <div className="h-px bg-[var(--border-color)] my-1" />
                {[
                  { action: 'delete', Icon: Trash2, label: 'Delete Chat', danger: true },
                  { action: 'block', Icon: UserX, label: 'Block User', danger: false },
                  { action: 'report', Icon: Shield, label: 'Report', danger: false },
                ].map(({ action, Icon, label, danger }) => (
                  <button key={action} onClick={() => handleSettingsAction(action)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${danger ? 'hover:bg-red-500/10 text-red-500' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>
                    <Icon size={18} style={danger ? undefined : { color: 'var(--text-secondary)' }} />
                    <span className="text-[14px] font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto" style={{ background: 'var(--surface-sunken)' }}>
        {loading ? (
          <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-[var(--accent)]" /></div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-xs text-[var(--text-tertiary)] bg-black/5 px-4 py-2 rounded-2xl">
            Say hi to {chat.other_name}!
          </div>
        ) : (
          <div className="h-full overflow-y-auto w-full custom-scrollbar flex flex-col px-4 py-4 gap-3">
            {messages.map((msg, i) => {
              const isMe = msg.sender_uid === user?.uid
              const hasMedia = msg.media_url && msg.media_type
              return (
                <div key={msg.id || i}
                  className={`group max-w-[85%] rounded-2xl shadow-sm text-[15px] relative ${isMe ? 'ml-auto rounded-tr-sm' : 'mr-auto rounded-tl-sm'} ${hasMedia ? 'p-2' : 'px-4 py-2.5'}`}
                  style={{ 
                    background: isMe ? 'var(--chat-sent-bg, var(--accent))' : 'var(--surface-raised)', 
                    color: isMe ? 'var(--chat-sent-text, #fff)' : 'var(--text-primary)',
                    contain: 'content'
                  }}
                >
                  {/* Media Preview */}
                  {hasMedia && (
                    <div className="mb-2 rounded-xl overflow-hidden">
                      {msg.media_type === 'image' && (
                        <div className="relative">
                          <img src={msg.media_url} 
                            className="w-full max-h-64 object-cover cursor-pointer rounded-lg"
                            onClick={() => setLightboxSrc(msg.media_url!)} />
                          <div className="absolute bottom-2 right-2 flex gap-1">
                            <button onClick={() => handleDownload(msg.media_url!, msg.media_name || 'image')}
                              className="w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-white">
                              <Download size={13} />
                            </button>
                          </div>
                        </div>
                      )}
                      {msg.media_type === 'audio' && (
                        <div className="flex items-center gap-3 p-3 bg-black/10 dark:bg-white/10 rounded-lg">
                          <Headphones size={24} className={isMe ? 'text-white/80' : 'text-[var(--text-secondary)]'} />
                          <div className="flex-1">
                            <p className="text-sm font-medium truncate">{msg.media_name || 'Audio'}</p>
                          </div>
                          <audio src={msg.media_url} controls className="h-8" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Text */}
                  {msg.content && (
                    <div className={hasMedia ? 'mt-1 px-1' : ''}>
                      <MessageText text={msg.content} isMe={isMe} />
                    </div>
                  )}

                  {/* Timestamp + Status */}
                  <div className={`flex items-center justify-end mt-1 gap-1 text-[9px] ${isMe ? 'text-white/70' : 'opacity-60'}`}>
                    <span>{toIST(msg.created_at)}</span>
                    {isMe && (
                      <span className="ml-0.5">
                        {msg.status === 'seen' ? <CheckCheck size={11} className="text-white" /> :
                         msg.status === 'delivered' ? <CheckCheck size={11} /> :
                         <Check size={11} />}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="self-start flex items-center gap-2 px-4 py-2.5 rounded-2xl rounded-tl-sm ml-4"
              style={{ background: 'var(--surface-raised)' }}
            >
              {[0,1,2].map(i => (
                <motion.span key={i} className="w-2 h-2 rounded-full bg-[var(--text-tertiary)]"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input & Keyboards */}
      <div className="bg-[var(--surface-raised)] border-t border-[var(--border-color)] shrink-0 relative emoji-picker-container attachment-menu-container">
        <form onSubmit={handleSend} className="flex items-center gap-2 p-3">
          <button type="button"
            onClick={() => setActiveDrawer(activeDrawer === 'emoji' ? null : 'emoji')}
            className={`w-10 h-10 flex items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/5 transition-colors ${activeDrawer === 'emoji' ? 'text-[var(--accent)] bg-[var(--accent)]/10' : 'text-[var(--text-secondary)]'}`}>
            <Smile size={20} />
          </button>
          
          <button type="button"
            onClick={() => setActiveDrawer(activeDrawer === 'sticker' ? null : 'sticker')}
            className={`w-10 h-10 flex items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/5 transition-colors ${activeDrawer === 'sticker' ? 'text-[var(--accent)] bg-[var(--accent)]/10' : 'text-[var(--text-secondary)]'}`}>
            <StickerIcon size={20} />
          </button>

          <button type="button"
            onClick={() => { setActiveDrawer(activeDrawer === 'gif' ? null : 'gif'); if (!activeDrawer) fetchTrendingMedia('gif') }}
            className={`w-10 h-10 flex items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/5 transition-colors ${activeDrawer === 'gif' ? 'text-[var(--accent)] bg-[var(--accent)]/10' : 'text-[var(--text-secondary)]'}`}>
            <Gift size={20} />
          </button>

          {isRecording ? (
            <div className="flex-1 h-11 bg-red-500/10 border border-red-500/30 rounded-full px-4 flex items-center gap-3">
              <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-red-500 font-medium text-sm flex-1">{Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
              <button type="button" onClick={cancelRecording} className="text-xs font-bold text-red-500 opacity-80 hover:opacity-100">Cancel</button>
            </div>
          ) : (
            <div className="flex-1 relative flex items-center">
               <input
                autoFocus type="text" placeholder="Message..."
                value={inputText} onChange={e => handleInputChange(e.target.value)}
                onFocus={() => setActiveDrawer(null)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend(e as any)}
                className="w-full h-11 bg-[var(--surface-sunken)] border border-[var(--border-color)] rounded-full px-4 pr-10 text-[15px] outline-none placeholder:text-[var(--text-tertiary)] focus:ring-1 ring-[var(--accent)]"
                style={{ color: 'var(--text-primary)' }}
              />
              <button type="button" onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                className="absolute right-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 text-[var(--text-secondary)]">
                <Paperclip size={18} />
              </button>
            </div>
          )}

          {inputText.trim() ? (
            <button type="submit" disabled={!inputText.trim()}
              className="w-11 h-11 flex-shrink-0 rounded-full flex items-center justify-center bg-[var(--accent)] text-white shadow-md active:scale-95 transition-all">
              <Send size={18} className="translate-x-[2px] -translate-y-[1px]" />
            </button>
          ) : (
            <button type="button" onClick={isRecording ? stopRecording : startRecording}
              className={`w-11 h-11 flex-shrink-0 rounded-full flex items-center justify-center text-white shadow-md active:scale-95 transition-all ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-[var(--accent)]'}`}>
              <Mic size={18} />
            </button>
          )}
        </form>

        {/* Drawer Content */}
        <AnimatePresence>
          {activeDrawer && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: '45vh', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="chat-drawer overflow-hidden bg-[var(--surface-sunken)] border-t border-[var(--border-color)] flex flex-col shadow-[0_-8px_30px_rgb(0,0,0,0.12)]"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)', maxHeight: '400px' }}
            >
              {/* Category Selector Tab Bar */}
              <div className="flex items-center px-4 py-3 bg-[var(--surface-raised)] border-b border-[var(--border-color)] gap-3 overflow-x-auto no-scrollbar shrink-0">
                {[
                  { id: 'emoji', label: 'Emoji', icon: Smile },
                  { id: 'sticker', label: 'Stickers', icon: StickerIcon },
                  { id: 'gif', label: 'GIFs', icon: Gift }
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => {
                      setActiveDrawer(tab.id as any)
                      if (tab.id !== 'emoji' && !(tab.id === 'gif' ? gifs : stickers).length) {
                        fetchTrendingMedia(tab.id as any)
                      }
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${activeDrawer === tab.id ? 'bg-[var(--accent)] text-white shadow-lg' : 'hover:bg-[var(--surface-sunken)] text-[var(--text-tertiary)]'}`}
                  >
                    <tab.icon size={14} /> {tab.label}
                  </button>
                ))}

                <div className="flex-1 min-w-[140px] relative">
                  <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30 text-[var(--text-primary)]" />
                  <input 
                    type="text" 
                    placeholder={activeDrawer === 'emoji' ? "Search Emoji..." : activeDrawer === 'gif' ? "Search GIPHY..." : "Search Stickers..."}
                    className="w-full bg-[var(--surface-sunken)] border border-[var(--border-color)] rounded-full pl-9 pr-4 py-2 text-[11px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-tertiary)]"
                    value={activeDrawer === 'emoji' ? emojiQuery : mediaQuery}
                    onChange={e => {
                      if (activeDrawer === 'emoji') setEmojiQuery(e.target.value)
                      else handleMediaSearch(e.target.value, activeDrawer as 'gif' | 'sticker')
                    }}
                  />
                </div>
              </div>

              {/* Emoji Content */}
              {activeDrawer === 'emoji' && (
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="flex overflow-x-auto no-scrollbar px-3 py-2 gap-2 bg-[var(--surface-sunken)] shrink-0 border-b border-[var(--border-color)]">
                    {Object.keys(allCategories).map(cat => (
                      <button key={cat} onClick={() => { setEmojiCategory(cat); setEmojiQuery(''); }}
                        className={`whitespace-nowrap px-4 py-2 rounded-xl text-[13px] transition-all ${emojiCategory === cat && !emojiQuery ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-bold shadow-sm' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]'}`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 grid grid-cols-8 gap-y-4 gap-x-2 content-start custom-scrollbar">
                    {filteredEmojis.map((emoji, i) => (
                      <button key={`${emoji}-${i}`} onClick={() => handleEmojiSelect(emoji)}
                        className="aspect-square flex items-center justify-center rounded-2xl hover:bg-[var(--surface-raised)] text-[26px] transition-all hover:scale-125 active:scale-90">
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sticker/GIF Content */}
              {(activeDrawer === 'sticker' || activeDrawer === 'gif') && (
                <div className="flex-1 overflow-y-auto p-3 scroll-smooth custom-scrollbar">
                  <div className={activeDrawer === 'sticker' ? "grid grid-cols-3 gap-3" : "grid grid-cols-2 gap-2"}>
                    {loadingMedia ? (
                      Array(9).fill(0).map((_, i) => (
                        <div key={i} className="aspect-square bg-[var(--surface-raised)] rounded-2xl animate-pulse" />
                      ))
                    ) : (
                      (activeDrawer === 'gif' ? gifs : stickers).map(item => (
                        <button 
                          key={item.id} 
                          onClick={() => { handleSend(undefined, activeDrawer as any, item.images.fixed_height.url); setActiveDrawer(null); }}
                          className={`relative rounded-2xl overflow-hidden group bg-[var(--surface-sunken)] border border-[var(--border-color)] hover:border-[var(--accent)] transition-all ${activeDrawer === 'sticker' ? 'aspect-square p-2' : 'aspect-video'}`}
                        >
                          <img 
                            src={item.images.fixed_height.url} 
                            className={`w-full h-full ${activeDrawer === 'sticker' ? 'object-contain' : 'object-cover'}`} 
                            alt="Giphy Media" 
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/0 group-active:bg-black/20 transition-colors" />
                        </button>
                      ))
                    )}
                  </div>
                  {!(activeDrawer === 'gif' ? gifs : stickers).length && !loadingMedia && (
                    <div className="py-16 text-center text-[11px] uppercase font-black tracking-widest text-[var(--text-tertiary)] animate-pulse">
                       No results in the vibe...
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attachment Menu */}
        <AnimatePresence>
          {showAttachmentMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute bottom-16 left-4 right-4 bg-[var(--surface-raised)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-50 overflow-hidden"
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <div className="p-3 grid grid-cols-4 gap-3">
                {[
                  { type: 'image' as const, Icon: Image, label: 'Photos', theme: '#a275ff' },
                  { type: 'camera' as const, Icon: Camera, label: 'Camera', theme: '#ff5a5a' },
                  { type: 'document' as const, Icon: Paperclip, label: 'File', theme: '#5a9aff' },
                  { type: 'audio' as const, Icon: Mic, label: 'Audio', theme: '#5ad3ff' },
                ].map(({ type, Icon, label, theme }) => (
                  <button key={type} onClick={() => handleAttachmentSelect(type)}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl active:bg-black/5">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md" style={{ background: theme }}>
                      <Icon size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-tighter">{label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxSrc && (
          <motion.div
            className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxSrc(null)}
          >
            <motion.img
              src={lightboxSrc}
              className="max-w-full max-h-full object-contain"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={e => e.stopPropagation()}
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <button onClick={(e) => { e.stopPropagation(); handleDownload(lightboxSrc, 'image') }}
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                <Download size={20} />
              </button>
              <button onClick={() => setLightboxSrc(null)}
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                <X size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
