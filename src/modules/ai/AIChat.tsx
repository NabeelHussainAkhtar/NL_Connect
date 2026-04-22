import { useState, useCallback, useRef, useEffect, memo } from 'react'
import WorkerPool from '@/lib/worker-pool';
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Settings, X, Check, Copy, Download, Loader2, ChevronDown, FileText, Code, Image as ImageIcon, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { usePlayer } from '@/contexts/PlayerContext'
import { searchYouTube } from '@/lib/youtube'
import { useNavigate } from 'react-router-dom'
import { getISTTime } from '@/lib/date'
import { AI_CATALOG, AIModel } from '@/lib/ai-models'
import { getModel, setModel, initCache } from '@/lib/model-cache';
import { getAISuggestedPrompts, DiscoveryResult } from '@/lib/discovery'
import { SmartSearchBar } from '@/components/shared/SmartSearchBar'
import { ModelSettingsDrawer } from '@/components/ai/ModelSettingsDrawer'
import { useTheme } from '@/contexts/ThemeContext'
import VirtualList from '@/components/shared/VirtualList'
import { AISkeleton, SuggestionSkeleton } from '@/components/ai/AISkeleton'
import { useAuth } from '@/contexts/AuthContext'
import { generateHumanSpeech, stopSpeech } from '@/lib/ai/tts'
import { routeQuery } from '@/lib/ai/router'
import type { Intent } from '@/lib/ai/router'
import { getFromMemory, saveToMemory } from '@/lib/ai/memory'
import { SmartResponseRenderer } from '@/components/ai/SmartResponseRenderer'
import type { CardPayload } from '@/components/ai/SmartResponseRenderer'

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  card?: CardPayload        // rich UI card payload
}

const BASE_URL = 'https://nl-connect-worker.nabeelhussain2k02.workers.dev/api/ai';

// --- Premium Code Block Component ---
const CodeBlock = memo(function CodeBlock({ code, language = 'javascript' }: { code: string, language?: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="my-4 rounded-xl overflow-hidden border border-white/10 shadow-2xl group mx-1">
      <div className="bg-[#1e1e1e] px-3 py-2 flex justify-between items-center border-b border-white/5">
        <span className="text-[10px] uppercase tracking-widest text-[#00f5d4] font-black">{language}</span>
        <button onClick={handleCopy} className="p-1 px-2 rounded-md bg-white/5 hover:bg-white/10 transition-all flex items-center gap-1.5">
          {copied ? <Check size={10} className="text-[#00f5d4]" /> : <Copy size={10} className="text-white/40" />}
          <span className="text-[9px] text-white/50">{copied ? 'COPIED!' : 'COPY'}</span>
        </button>
      </div>
      <pre className="p-4 bg-[#0d0d0d] overflow-x-auto skeuo-scroll custom-scrollbar transition-all">
        <code className="text-[11px] leading-relaxed" style={{ color: '#d4d4d4', fontFamily: "'JetBrains Mono', monospace" }}>
          {code}
        </code>
      </pre>
    </div>
  )
})

// --- Map Card Component (used by SmartResponseRenderer for maps intent) ---
const MapCard = memo(function MapCard({ data }: { data: { destination: string; distanceInfo: string; mapsUrl: string; directionsUrl: string } }) {
  const lines = data.distanceInfo.split('\n').filter(Boolean);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="mt-2 rounded-2xl overflow-hidden border border-[#4285F4]/25 shadow-xl"
      style={{ background: 'var(--surface)', boxShadow: '0 8px 32px rgba(66,133,244,0.1)' }}
    >
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#4285F4]/15 to-indigo-500/5 border-b border-[#4285F4]/15">
        <motion.span className="text-3xl" animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}>🗺️</motion.span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{data.destination}</p>
          <p className="text-[10px] opacity-40" style={{ color: 'var(--text-primary)' }}>Route Information</p>
        </div>
      </div>
      <div className="px-4 py-3 space-y-2">
        {lines.length > 0 ? lines.map((line, i) => (
          <motion.p key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
            className="text-sm" style={{ color: 'var(--text-primary)' }}>{line}</motion.p>
        )) : (
          <p className="text-xs opacity-40 py-1" style={{ color: 'var(--text-primary)' }}>Fetching route info...</p>
        )}
      </div>
      <div className="px-4 pb-4 flex gap-2">
        <button onClick={() => window.open(data.directionsUrl, '_blank')}
          className="flex-1 py-2.5 rounded-xl bg-[#4285F4] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#3367d6] active:scale-[0.98] transition-all">
          🚗 Start Journey
        </button>
        <button onClick={() => window.open(data.mapsUrl, '_blank')}
          className="px-4 py-2.5 rounded-xl border border-[#4285F4]/30 text-sm font-medium hover:bg-[#4285F4]/10 active:scale-[0.98] transition-all"
          style={{ color: 'var(--text-primary)' }}>
          View Map
        </button>
      </div>
    </motion.div>
  )
})

// --- Content Parser ---
const MessageContent = memo(function MessageContent({ content }: { content: string }) {
  // Check for maps card prefix
  if (content.startsWith('__maps_card__')) {
    try {
      const data = JSON.parse(content.replace('__maps_card__', ''));
      return <MapCard data={data} />;
    } catch { /* fall through to normal render */ }
  }

  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g
  const parts: { type: 'text' | 'code' | 'image', value: string, language?: string }[] = []
  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.substring(lastIndex, match.index)
      parts.push({ type: 'text', value: text })
    }
    parts.push({ type: 'code', language: match[1] || 'code', value: match[2].trim() })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < content.length) parts.push({ type: 'text', value: content.substring(lastIndex) })

  return (
    <div className="space-y-1">
      {parts.map((part, i) => {
        if (part.type === 'code') return <CodeBlock key={i} code={part.value} language={part.language} />

        // Handle Images & Graphics in text
        const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif']
        const hasImageUrl = imageExtensions.some(ext => part.value.toLowerCase().includes(ext)) && part.value.includes('http')

        if (hasImageUrl) {
          const urlMatch = part.value.match(/https?:\/\/[^\s]+(?:\.png|\.jpg|\.jpeg|\.webp|\.gif)/gi)
          if (urlMatch) {
            return (
              <div key={i} className="my-3 relative group rounded-2xl overflow-hidden border border-[#00f5d4]/30 shadow-[0_0_20px_rgba(0,245,212,0.2)]">
                <img src={urlMatch[0]} alt="JARVIS Output" className="w-full h-auto max-h-[400px] object-contain bg-black/40" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => window.open(urlMatch[0], '_blank')} className="p-3 bg-white/10 backdrop-blur-xl rounded-full text-[#00f5d4]"><ImageIcon size={20} /></button>
                </div>
              </div>
            )
          }
        }

        return <p key={i} className="whitespace-pre-wrap leading-relaxed">{part.value}</p>
      })}
    </div>
  )
})


// ── NL Animated Logo ────────────────────────────────────────────────────────
const NLLogo = memo(function NLLogo({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full flex items-center justify-center flex-shrink-0 relative overflow-hidden"
    >
      {/* Animated gradient ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#4285F4] via-[#9B72CB] to-[#D96570] animate-spin" style={{ animationDuration: '3s' }} />
      <div className="absolute inset-[2px] rounded-full bg-[var(--surface)] dark:bg-[#111]" />
      {/* NL Text */}
      <span className="relative z-10 text-[10px] font-black tracking-tighter bg-gradient-to-br from-[#4285F4] to-[#D96570] bg-clip-text text-transparent select-none" style={{ fontFamily: 'Inter, sans-serif' }}>NL</span>
    </div>
  )
})


const MessageBubble = memo(function MessageBubble({ msg }: { msg: AIMessage }) {
  const isUser = msg.role === 'user'
  const [isPlaying, setIsPlaying] = useState(false)
  // Use a ref to track playing state synchronously — avoids race conditions
  const playingRef = useRef(false)

  const handleSpeak = () => {
    if (playingRef.current) {
      // Currently playing → STOP
      playingRef.current = false
      setIsPlaying(false)
      stopSpeech() // stopSpeech resolves the promise, .finally() won't double-set
      return
    }

    // Not playing → START
    let cleanText = msg.content
      .replace(/\{"command":.*?\}/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/[*#_~`]/g, '')
      .trim()
    if (!cleanText) return

    playingRef.current = true
    setIsPlaying(true)

    generateHumanSpeech(cleanText).finally(() => {
      // Only update state if WE are the ones still active (not a new click)
      if (playingRef.current) {
        playingRef.current = false
        setIsPlaying(false)
      }
    })
  }

  // Aggressively strip any raw JSON that leaked from the LLM
  let displayContent = msg.content;
  try {
    const trimmed = displayContent.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = JSON.parse(trimmed);
      displayContent = parsed.message || parsed.response || parsed.text ||
        (parsed.type === 'command' ? `✅ ${parsed.action?.replace(/_/g, ' ')}` : trimmed);
    }
  } catch (e) {
    // Not JSON, display as-is
  }

  return (
    <motion.div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 w-full max-w-3xl mx-auto`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {!isUser && (
        <NLLogo size={34} />
      )}
      <div className={`px-5 py-3.5 text-[15px] leading-relaxed relative group ${isUser ? 'max-w-[70%] rounded-3xl bg-gray-100 dark:bg-[#1e1f20]' : 'flex-1'}`}
        style={{
          color: 'var(--text-primary)',
          fontFamily: "'Inter', sans-serif",
          contain: 'content'
        }}>
        {!isUser && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold opacity-60">Ramsha</span>
            <button
              onClick={handleSpeak}
              title={isPlaying ? 'Stop speaking' : 'Read aloud'}
              className={`transition-all p-1.5 rounded-full ${
                isPlaying
                  ? 'text-[#4285F4] bg-[#4285F4]/10 animate-pulse'
                  : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              {isPlaying ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
          </div>
        )}
        {/* Card + text rendered via SmartResponseRenderer for assistant messages */}
        {!isUser ? (
          <SmartResponseRenderer
            card={msg.card}
            text={displayContent}
            hideText={['weather', 'finance', 'trending', 'market', 'dictionary', 'country', 'music_cmd', 'news', 'cricket'].includes(msg.card?.type ?? '')}
          />
        ) : (
          <MessageContent content={displayContent} />
        )}
      </div>
    </motion.div>
  )
})


export default function AIChat() {
  const workerPoolRef = useRef<WorkerPool | null>(null);
  const { profile } = useAuth()
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const thinkingRef = useRef(false)
  const endRef = useRef<HTMLDivElement>(null)

  const [modelDrawerOpen, setModelDrawerOpen] = useState(false)

  // PERSISTENCE: Load messages on mount
  useEffect(() => {
    const saved = localStorage.getItem('nl_ai_messages')
    if (saved) {
      try {
        setMessages(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load messages', e)
      }
    }
  }, [])

  // PERSISTENCE: Save messages on change
  useEffect(() => {
    if (messages.length > 0) {
      const limited = messages.slice(-50) // Keep last 50
      localStorage.setItem('nl_ai_messages', JSON.stringify(limited))
    }
  }, [messages])

  useEffect(() => {
    // Initialize cache
    initCache();

    // Load model from cache
    const loadCachedModel = async () => {
      try {
        const savedId = localStorage.getItem('nl_ai_model');
        if (savedId) {
          const cached = await getModel(savedId);
          if (cached) {
            setCurrentModel({
              ...cached,
              limits: {
                ...cached.limits,
                rpd: cached.limits?.rpd || 200 // Fallback for type safety
              },
              provider: 'cache',
              type: 'chat' as const
            });
            return;
          }
        }

        // Fallback to default
        setCurrentModel(AI_CATALOG[0]);
      } catch (e) {
        console.error('Cache load error:', e);
        setCurrentModel(AI_CATALOG[0]);
      }
    };

    loadCachedModel();
  }, []);

  useEffect(() => {
    // [PERFORMANCE] Initialize background worker pool with static factory for Vite
    workerPoolRef.current = new WorkerPool(
      () => new Worker(new URL('../../lib/local-worker.ts', import.meta.url), { type: 'module' }),
      2 // 2 threads is enough for parsing & search
    );

    return () => {
      workerPoolRef.current?.terminate();
    };
  }, []);
  const [currentModel, setCurrentModel] = useState<AIModel>(() => {
    const saved = localStorage.getItem('nl_ai_model')
    return AI_CATALOG.find(m => m.id === saved) || AI_CATALOG[0]
  })
  const [usage, setUsage] = useState<Record<string, { requests: number, tokens: number }>>(() => {
    try { return JSON.parse(localStorage.getItem('nl_ai_usage') || '{}') } catch { return {} }
  })
  const [failedModelIds, setFailedModelIds] = useState<Set<string>>(new Set())
  const [suggestions, setSuggestions] = useState<DiscoveryResult[]>([])

  // Voice Recording state
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const { loadTrack, setPlaylist } = usePlayer()
  const navigate = useNavigate()

  const speak = useCallback((text: string) => {
    let cleanText = text.replace(/\{"command":.*?\}/g, '').replace(/```[\s\S]*?```/g, '').replace(/[*#_~]/g, '').trim()
    try {
      if (cleanText.startsWith('{') && cleanText.endsWith('}')) {
        const parsed = JSON.parse(cleanText);
        cleanText = parsed.message || cleanText;
      }
    } catch(e) {}

    if (!cleanText) return
    generateHumanSpeech(cleanText);
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setUsage(prev => {
        const reset = { ...prev }
        Object.keys(reset).forEach(k => { reset[k].requests = 0 })
        return reset
      })
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    localStorage.setItem('nl_ai_usage', JSON.stringify(usage))
    localStorage.setItem('nl_ai_model', currentModel.id)
  }, [usage, currentModel])

  useEffect(() => {
    const filtered = getAISuggestedPrompts(input)
    setSuggestions(filtered.map((p, i) => ({ id: `p-${i}`, type: 'prompt', title: p, accent: '#00f5d4' })))
  }, [input])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, thinking])

  const onSelectModel = (model: AIModel) => {
    setCurrentModel(model)
    setModelDrawerOpen(false)
  }

  const selectModel = (text: string) => {
    return 'llama-3-private';
  };

  const handleAIResponse = async (json: any, assistantMsgId: string) => {
    if (json.type === 'command') {
      const { action, data, message } = json;
      setMessages(p => p.map(m => m.id === assistantMsgId ? { ...m, content: message || `Execution: ${action}...` } : m));
      
      switch (action) {
        case 'play_music':
          const tracks = await searchYouTube(data.query);
          if (tracks[0]) {
            loadTrack(tracks[0]);
            setPlaylist(tracks);
            setMessages(p => p.map(m => m.id === assistantMsgId ? { ...m, content: (message || "") + `\n\n🎵 Now playing: ${tracks[0].title}` } : m));
          }
          break;
        case 'open_music':
          navigate('/media');
          break;
        case 'navigate':
          navigate(data.route);
          break;
        case 'open_camera':
          navigate('/social');
          break;
      }
    } else if (json.type === 'chat') {
      setMessages(p => p.map(m => m.id === assistantMsgId ? { ...m, content: json.message } : m));
    }
  };

  const handleSendWithText = useCallback(async (text: string, isVoice: boolean = false) => {
    if (!text.trim() || thinkingRef.current) return;

    thinkingRef.current = true;
    setThinking(true);

    const userMsg: AIMessage = { id: crypto.randomUUID(), role: 'user', content: text, timestamp: getISTTime() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const assistantMsgId = crypto.randomUUID();
    setMessages(p => [...p, { id: assistantMsgId, role: 'assistant', content: '', timestamp: getISTTime() }]);

    // ── PARALLEL: Memory check + Intent routing run at the same time ─────────
    const [cached, routed] = await Promise.all([
      getFromMemory(text),
      routeQuery(text),
    ]);

    // ── Handle music commands instantly (no LLM call needed) ─────────────────
    if (routed.intent === 'music_cmd') {
      const musicQuery = text
        .replace(/\b(play|chalao|baja|sunao|play me|play song|play music)\b/gi, '')
        .replace(/\b(please|song|music|track|kar|karo)\b/gi, '')
        .trim();
      if (musicQuery.length > 1) {
        setMessages(p => p.map(m => m.id === assistantMsgId ? { ...m, content: `🎵 Searching "${musicQuery}"...` } : m));
        setThinking(false);
        thinkingRef.current = false;
        try {
          const tracks = await searchYouTube(musicQuery);
          if (tracks[0]) {
            loadTrack(tracks[0]);
            setPlaylist(tracks);
            // Show MusicCard with the track data
            const musicCardPayload = {
              type: 'music_cmd' as const,
              data: {
                title: tracks[0].title,
                channelTitle: tracks[0].channelTitle,
                thumbnail: tracks[0].thumbnail,
                videoId: tracks[0].videoId,
              },
            };
            setMessages(p => p.map(m => m.id === assistantMsgId
              ? { ...m, content: '', card: musicCardPayload }
              : m));
            if (isVoice) speak(`Playing ${tracks[0].title}`);
          } else {
            setMessages(p => p.map(m => m.id === assistantMsgId ? { ...m, content: '❌ Song nahi mila, dost. Kuch aur try karo!' } : m));
          }
        } catch {
          setMessages(p => p.map(m => m.id === assistantMsgId ? { ...m, content: '❌ Music search failed.' } : m));
        }
        return;
      }
    }

    // ── Handle maps — enrich the router's structuredData with live geocoding, then show card
    if (routed.intent === 'maps' && routed.structuredData) {
      const { destination, mapsUrl, directionsUrl } = routed.structuredData;
      let distanceInfo = '';
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`);
        const geoData = await geoRes.json() as any[];
        if (geoData[0]) {
          const destLat = parseFloat(geoData[0].lat);
          const destLon = parseFloat(geoData[0].lon);
          const displayName = geoData[0].display_name?.split(',').slice(0, 3).join(', ');
          distanceInfo = `📍 Found: ${displayName}`;
          // Try to get user GPS and compute crow-flies distance
          const pos = await new Promise<GeolocationPosition | null>(res =>
            navigator.geolocation?.getCurrentPosition(res, () => res(null), { timeout: 3000 })
          );
          if (pos) {
            const R = 6371;
            const dLat = (destLat - pos.coords.latitude) * Math.PI / 180;
            const dLon = (destLon - pos.coords.longitude) * Math.PI / 180;
            const a = Math.sin(dLat/2)**2 + Math.cos(pos.coords.latitude * Math.PI/180)
                    * Math.cos(destLat * Math.PI/180) * Math.sin(dLon/2)**2;
            const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const estMin = Math.round((dist / 40) * 60); // ~40 km/h avg speed
            distanceInfo += `\n📏 Distance: ~${dist.toFixed(1)} km`;
            distanceInfo += `\n🕐 Est. time: ~${estMin > 60 ? `${Math.floor(estMin/60)}h ${estMin%60}m` : `${estMin} min`}`;
          }
        }
      } catch { /* ignore */ }

      const cardContent = `__maps_card__${JSON.stringify({ destination, distanceInfo, mapsUrl, directionsUrl })}`;
      setMessages(p => p.map(m => m.id === assistantMsgId ? { ...m, content: cardContent } : m));
      setThinking(false);
      thinkingRef.current = false;
      return;
    }

    // ── Card payload — ALWAYS use fresh structuredData from the router (not from memory) ──
    // Memory cache is only used for the LLM context string (to save API quota)
    // Cards always reflect live data from the current API call
    const cardPayload: import('@/components/ai/SmartResponseRenderer').CardPayload | undefined =
      routed.structuredData ? { type: routed.intent, data: routed.structuredData } : undefined;

    // Dynamic intents (real-time data) should NEVER use memory for LLM context
    const DYNAMIC_INTENTS: Intent[] = ['weather', 'finance', 'trending', 'market', 'search', 'news', 'cricket'];
    let apiContext = '';
    if (cached && !DYNAMIC_INTENTS.includes(routed.intent)) {
      // Only use cached context for static intents (dictionary, country)
      apiContext = cached;
    } else if (routed.apiContext) {
      apiContext = routed.apiContext;
      // Save to memory only for static/semi-static intents
      if (!DYNAMIC_INTENTS.includes(routed.intent)) {
        saveToMemory(text, routed.apiContext, routed.intent).catch(() => {});
      }
    }

    // Attach card to assistant message immediately (shows card before LLM responds)
    if (cardPayload) {
      setMessages(p => p.map(m => m.id === assistantMsgId ? { ...m, card: cardPayload } : m));
    }

    // ── Build system prompt with optional real-time data ─────────────────────
    const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const contextBlock = apiContext
      ? `[LIVE DATA from ${routed.intent.toUpperCase()} API — use this to answer accurately. Do NOT say where it came from]:\n${apiContext}`
      : '[No external data. Answer from your knowledge. Be honest if unsure. Never hallucinate.]';

    const systemPrompt = `You are Ramsha رمشہ, a witty, warm AI companion built by Nabeel Hussain for N&L Connect SuperApp. Speak in Urdish (natural mix of English + Roman Urdu like "Kaisi ho?", "Bilkul!", "Dost"). Reply in plain conversational text.

RULES:
- NEVER output raw JSON, markdown code blocks, or brackets {} in casual chat.
- Do NOT reveal API sources, cache hits, or technical internals.
- Be warm, concise, and direct. Use emojis sparingly (max 2 per response).
- Today is ${today}.

${contextBlock}`;

    try {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: text }
          ],
          model: currentModel.id, // Explicitly pass selected model
          stream: true,
          uid: 'guest'
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.details || `AI Signal Lost (${response.status})`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        const read = async () => {
          try {
            const { done, value } = await reader.read();
            if (done) return;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              const data = line.replace(/^data: /, '').trim();
              if (!data || data === '[DONE]') continue;

              // HEURISTIC PARSER: Try to find JSON block if raw text is sent
              let cleanData = data;
              if (!data.startsWith('{')) {
                const startIdx = data.indexOf('{');
                const endIdx = data.lastIndexOf('}');
                if (startIdx !== -1 && endIdx !== -1) {
                   cleanData = data.slice(startIdx, endIdx + 1);
                }
              }

              try {
                const parsed = JSON.parse(cleanData);
                const content = parsed.message || parsed.response || parsed.choices?.[0]?.delta?.content || "";
                if (content) {
                  fullText += content;
                  setMessages(p => p.map(m => m.id === assistantMsgId ? { ...m, content: fullText } : m));
                }
                
                // Extra: Handle commands immediately if present in the final chunk or midway
                if (parsed.action === 'play_music' && parsed.data?.query) {
                   // This could trigger a side effect in a real app
                   console.log("Ramsha Action: Play Music ->", parsed.data.query);
                }
              } catch (e) {
                // Fallback: If it's not JSON at all, it's probably just raw human text
                if (data && !data.startsWith('{')) {
                  // Filter out common LLM garbage like "```json"
                  const filter = data.replace(/```json|```/g, '').trim();
                  if (filter) {
                    fullText += filter;
                    setMessages(p => p.map(m => m.id === assistantMsgId ? { ...m, content: fullText } : m));
                  }
                }
              }
            }
            return read();
          } catch (err) {
            console.error("Stream Read Error:", err);
          }
        };

        await read();
      }

      setThinking(false);
      
      // Final JSON parse for commands
      try {
        const jsonStart = fullText.indexOf('{');
        const jsonEnd = fullText.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
           // We might have found a JSON command
           const jsonStr = fullText.substring(jsonStart, jsonEnd + 1);
           const parsed = JSON.parse(jsonStr);
           if (parsed.type === 'command') {
             handleAIResponse(parsed, assistantMsgId);
             if (isVoice && parsed.message) speak(parsed.message);
             return;
           }
        }
      } catch (e) {
        // Not a JSON command, just normal text
      }
      
      // Auto-TTS if user used voice
      if (isVoice) {
         speak(fullText);
      }

    } catch (e: any) {
      console.error("AI Fetch Error:", e);
      setMessages(p => p.map(m => m.id === assistantMsgId ? { ...m, content: `❌ AI Error: ${e.message || "Connection timeout"}` } : m));
    } finally {
      setThinking(false);
      thinkingRef.current = false;
    }
  }, [messages, loadTrack, setPlaylist, navigate, currentModel.id, speak]);

  // --- Voice Recording Logic ---
  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Voice input not supported in this browser.");
      return;
    }
    
    // @ts-ignore
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setInput(text);
      handleSendWithText(text, true); // pass true for isVoice
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
  };

  const stopRecording = () => setIsRecording(false);
  const handleSend = () => handleSendWithText(input)

  return (
    <div className="h-full flex flex-col bg-[var(--surface)] relative overflow-hidden">
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-[var(--surface)]/80 backdrop-blur-md">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setModelDrawerOpen(true)}>
            <span className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Ramsha</span>
            <ChevronDown size={16} className="opacity-50 mt-1" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setModelDrawerOpen(true)} className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-tertiary)] transition-colors"><Settings size={18} /></button>
          </div>
        </div>

        <ModelSettingsDrawer
          isOpen={modelDrawerOpen}
          onClose={() => setModelDrawerOpen(false)}
          currentModelId={currentModel.id}
          onSelectModel={onSelectModel}
          usage={usage}
          failedModelIds={failedModelIds}
        />

        {/* Messages or Empty State */}
        <div className="flex-1 overflow-y-auto px-4 py-8 scroll-smooth custom-scrollbar flex flex-col relative z-10 w-full">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-3xl mx-auto w-full">
              <div className="mb-6">
                <NLLogo size={64} />
              </div>
              <h1 className="text-5xl md:text-6xl font-medium mb-12 leading-tight bg-gradient-to-r from-[#4285F4] via-[#9B72CB] to-[#D96570] bg-clip-text text-transparent pb-2">
                Hello, {profile?.display_name?.split(' ')[0] || 'User'}
              </h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-4xl px-4">
                <button onClick={() => handleSendWithText("Summarize my day")} className="flex flex-col items-start gap-2 p-4 h-24 rounded-2xl transition-all bg-gray-50 hover:bg-gray-100 dark:bg-[#1e1f20] dark:hover:bg-[#2a2b2c] text-left">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Summarize my day</span>
                  <span className="text-xs opacity-60">Get a quick overview</span>
                </button>
                <button onClick={() => handleSendWithText("Search for music")} className="flex flex-col items-start gap-2 p-4 h-24 rounded-2xl transition-all bg-gray-50 hover:bg-gray-100 dark:bg-[#1e1f20] dark:hover:bg-[#2a2b2c] text-left">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Search for music</span>
                  <span className="text-xs opacity-60">Discover new tracks</span>
                </button>
                <button onClick={() => handleSendWithText("Tell me a joke")} className="flex flex-col items-start gap-2 p-4 h-24 rounded-2xl transition-all bg-gray-50 hover:bg-gray-100 dark:bg-[#1e1f20] dark:hover:bg-[#2a2b2c] text-left sm:col-span-2 lg:col-span-1">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Tell me a joke</span>
                  <span className="text-xs opacity-60">Lighten the mood</span>
                </button>
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <MessageBubble key={msg.id ? `msg-${msg.id}` : `msg-idx-${i}`} msg={msg} />
              ))}
              {thinking && (
                <motion.div
                  key="thinking-indicator"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="max-w-3xl mx-auto w-full mt-4 flex items-center gap-3 opacity-60"
                >
                  <NLLogo size={32} />
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </motion.div>
              )}
              <div key="scroll-anchor" ref={endRef} />
            </AnimatePresence>

          )}
        </div>

        {/* Floating Footer */}
        <div className="px-4 pb-6 pt-4 bg-gradient-to-t from-[var(--surface)] via-[var(--surface)] to-transparent relative z-20">
          <div className="max-w-3xl mx-auto">
            {isRecording && (
              <div className="flex items-center justify-center gap-3 mb-4 py-2 text-red-500">
                <motion.div className="w-2 h-2 rounded-full bg-red-500" animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1, repeat: Infinity }} />
                 <span className="text-xs font-semibold uppercase tracking-widest">Listening...</span>
              </div>
            )}
            <div className="bg-gray-100 dark:bg-[#1e1f20] rounded-full flex items-center p-2 shadow-sm transition-all focus-within:shadow-md focus-within:ring-2 focus-within:ring-[#4285F4]/30">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5'}`}
              >
                {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <div className="flex-1 px-2">
                 <input 
                   value={input} 
                   onChange={(e) => setInput(e.target.value)} 
                   onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
                   placeholder="Ask Ramsha anything..." 
                   className="w-full bg-transparent border-none outline-none text-[15px] text-[var(--text-primary)] placeholder-gray-500"
                 />
              </div>
              <button 
                onClick={handleSend} 
                disabled={thinking || !input.trim()} 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${input.trim() ? 'bg-[#4285F4] text-white hover:bg-[#3367d6]' : 'text-gray-400 bg-black/5 dark:bg-white/5 cursor-not-allowed'}`}
              >
                <Send size={16} />
              </button>
            </div>
            
            <div className="text-center mt-3">
               <span className="text-[10px] text-gray-400">Ramsha may display inaccurate info, so double-check its responses.</span>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-200%) skewX(12deg); }
          100% { transform: translateX(200%) skewX(12deg); }
        }
      `}</style>
    </div>
  )
}
