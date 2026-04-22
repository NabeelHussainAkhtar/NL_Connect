export interface MockContact {
  id: string
  name: string
  avatar: string
  lastMessage: string
  time: string
  unread: number
  online: boolean
  isEphemeral?: boolean
  typing?: boolean
}

export interface MockPost {
  id: string
  user: { name: string; avatar: string; handle: string }
  image: string
  caption: string
  likes: number
  comments: number
  time: string
  isReel?: boolean
}

export interface MockGame {
  id: string
  title: string
  thumbnail: string
  category: string
  playersOnline: number
  maxPlayers: number
  isLive: boolean
  accent: string
}

export interface MockAIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

// ── Contacts ──────────────────────────────────────────────────
export const mockContacts: MockContact[] = [
  { id: '1', name: 'Layla Hassan', avatar: 'LH', lastMessage: 'Are you coming tonight? 🎉', time: '9:41 AM', unread: 3, online: true },
  { id: '2', name: 'Ahmed Malik', avatar: 'AM', lastMessage: 'Check out this track 🎵', time: '9:15 AM', unread: 0, online: true, isEphemeral: true },
  { id: '3', name: 'Sara Noor', avatar: 'SN', lastMessage: 'Loved the reel you posted!', time: '8:52 AM', unread: 1, online: false },
  { id: '4', name: 'Omar Farooq', avatar: 'OF', lastMessage: 'gg on that chess match 😂', time: '8:30 AM', unread: 0, online: true },
  { id: '5', name: 'Zara Sheikh', avatar: 'ZS', lastMessage: 'Watch party starts at 10!', time: 'Yesterday', unread: 2, online: false },
  { id: '6', name: 'Bilal Raza', avatar: 'BR', lastMessage: '👍', time: 'Yesterday', unread: 0, online: true, typing: true },
  { id: '7', name: 'Nadia Khan', avatar: 'NK', lastMessage: 'Can you hear me in the call?', time: 'Mon', unread: 0, online: false },
  { id: '8', name: 'Tariq Javed', avatar: 'TJ', lastMessage: 'New AI feature is insane!', time: 'Mon', unread: 5, online: true },
  { id: '9', name: 'Fatima Ali', avatar: 'FA', lastMessage: 'See you at the gaming lounge', time: 'Sun', unread: 0, online: false },
  { id: '10', name: 'Hassan Mirza', avatar: 'HM', lastMessage: 'Stream was 🔥🔥🔥', time: 'Sun', unread: 0, online: true },
  { id: '11', name: 'Hira Baig', avatar: 'HB', lastMessage: 'Snapshot saved!', time: 'Sat', unread: 0, online: false, isEphemeral: true },
  { id: '12', name: 'Faisal Qureshi', avatar: 'FQ', lastMessage: 'ping me when online', time: 'Sat', unread: 0, online: false },
]

// ── Social Posts ───────────────────────────────────────────────
export const mockPosts: MockPost[] = [
  {
    id: 'p1',
    user: { name: 'Layla Hassan', avatar: 'LH', handle: 'layla.h' },
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
    caption: 'Golden hour ✨ nothing beats this view after a long week',
    likes: 847, comments: 32, time: '2h',
  },
  {
    id: 'p2',
    user: { name: 'Ahmed Malik', avatar: 'AM', handle: 'ahmedm' },
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80',
    caption: 'Studio session was 🔥 New drop coming soon 🎵',
    likes: 1204, comments: 67, time: '4h',
  },
  {
    id: 'p3',
    user: { name: 'Sara Noor', avatar: 'SN', handle: 'sara.noor' },
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
    caption: 'Today\'s brunch 🥑🍳 Recipe in bio!',
    likes: 523, comments: 18, time: '6h',
  },
  {
    id: 'p4',
    user: { name: 'Omar Farooq', avatar: 'OF', handle: 'omar_f' },
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80',
    caption: 'Gaming setup FINAL FORM 🎮💻',
    likes: 2100, comments: 145, time: '1d',
    isReel: true,
  },
  {
    id: 'p5',
    user: { name: 'Zara Sheikh', avatar: 'ZS', handle: 'zarashk' },
    image: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=600&q=80',
    caption: 'Weekend vibes 🌊☀️ #Travel #Explore',
    likes: 982, comments: 44, time: '1d',
  },
  {
    id: 'p6',
    user: { name: 'Bilal Raza', avatar: 'BR', handle: 'bilalr' },
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80',
    caption: 'New build 🖥️ Beast mode activated',
    likes: 1567, comments: 89, time: '2d',
  },
]

// ── Games ──────────────────────────────────────────────────────
export const mockGames: MockGame[] = [
  // From stitch code examples - Terra Gaming theme
  { id: 'g1', title: 'Chess Blitz', thumbnail: '♟️', category: 'Strategy', playersOnline: 1200, maxPlayers: 2, isLive: true, accent: '#4a7c59' },
  { id: 'g2', title: 'Word Roots', thumbnail: '📝', category: 'Word', playersOnline: 850, maxPlayers: 4, isLive: true, accent: '#705c30' },
  { id: 'g3', title: 'Terra Solitaire', thumbnail: '🃏', category: 'Card', playersOnline: 320, maxPlayers: 1, isLive: false, accent: '#8fc49e' },
  { id: 'g4', title: 'Backgammon', thumbnail: '🎲', category: 'Board', playersOnline: 450, maxPlayers: 2, isLive: true, accent: '#c4a66a' },
  
  // From stitch code examples - Nature theme
  { id: 'g5', title: 'Arboretum', thumbnail: '🌳', category: 'Strategy', playersOnline: 3400, maxPlayers: 4, isLive: true, accent: '#30d158' },
  { id: 'g6', title: 'Zen Pond', thumbnail: '🎋', category: 'Simulation', playersOnline: 1856, maxPlayers: 1, isLive: true, accent: '#00b894' },
  { id: 'g7', title: 'Trailblazer', thumbnail: '🥾', category: 'Adventure', playersOnline: 2450, maxPlayers: 4, isLive: true, accent: '#ff9e00' },
  { id: 'g8', title: 'Terracotta', thumbnail: '🏺', category: 'Crafting', playersOnline: 941, maxPlayers: 1, isLive: true, accent: '#c4a66a' },
  
  // From stitch code examples - Fantasy theme
  { id: 'g9', title: 'Verdant Keep', thumbnail: '🏰', category: 'RPG', playersOnline: 3420, maxPlayers: 8, isLive: true, accent: '#4a7c59' },
  { id: 'g10', title: 'Roots of Empire', thumbnail: '👑', category: 'Strategy', playersOnline: 1890, maxPlayers: 6, isLive: false, accent: '#8fc49e' },
  { id: 'g11', title: 'Canopy Logic', thumbnail: '🧩', category: 'Puzzle', playersOnline: 1120, maxPlayers: 2, isLive: true, accent: '#30d158' },
  { id: 'g12', title: 'Elden Grove', thumbnail: '🌿', category: 'Adventure', playersOnline: 5230, maxPlayers: 4, isLive: true, accent: '#4a7c59' },
  
  // Existing games kept for compatibility
  { id: 'g13', title: 'Snake.io', thumbnail: '🐍', category: 'Arcade', playersOnline: 2891, maxPlayers: 100, isLive: true, accent: '#00f5d4' },
  { id: 'g14', title: 'Trivia Night', thumbnail: '🎯', category: 'Trivia', playersOnline: 1640, maxPlayers: 8, isLive: true, accent: '#ffd60a' },
  { id: 'g15', title: 'Tic Tac Toe', thumbnail: '✖️', category: 'Classic', playersOnline: 822, maxPlayers: 2, isLive: true, accent: '#bf5af2' },
  { id: 'g16', title: 'Battleship', thumbnail: '🚢', category: 'Strategy', playersOnline: 947, maxPlayers: 2, isLive: false, accent: '#ff375f' },
  { id: 'g17', title: 'Love Quiz', thumbnail: '💕', category: 'Couples', playersOnline: 1289, maxPlayers: 2, isLive: true, accent: '#ff6b9d' },
  { id: 'g18', title: 'Memory Match', thumbnail: '🧠', category: 'Memory', playersOnline: 756, maxPlayers: 2, isLive: true, accent: '#9d4edd' },
  { id: 'g19', title: 'Would You Rather', thumbnail: '🤔', category: 'Social', playersOnline: 2112, maxPlayers: 8, isLive: true, accent: '#ff9e00' },
  { id: 'g20', title: '8 Ball Pool', thumbnail: '🎱', category: 'Sports', playersOnline: 4423, maxPlayers: 2, isLive: true, accent: '#00b894' },
  { id: 'g21', title: 'Uno Online', thumbnail: '🃏', category: 'Card', playersOnline: 3287, maxPlayers: 4, isLive: true, accent: '#fdcb6e' },
  { id: 'g22', title: 'Draw & Guess', thumbnail: '🎨', category: 'Creative', playersOnline: 3198, maxPlayers: 8, isLive: true, accent: '#6c5ce7' },
]

// ── AI Chat ────────────────────────────────────────────────────
export const mockAIChat: MockAIMessage[] = [
  { id: 'a1', role: 'assistant', content: 'N&L AI online. How can I assist you today?', timestamp: '09:40:01' },
  { id: 'a2', role: 'user', content: 'Summarize the latest news in tech.', timestamp: '09:40:15' },
  { id: 'a3', role: 'assistant', content: 'Scanning feeds... Top stories: [1] Apple announces M4 Ultra chip with 512GB unified memory. [2] OpenAI releases o3 model with 90% ARC-AGI score. [3] Cloudflare launches AI Gateway for enterprise LLM routing. Want deep-dives on any of these?', timestamp: '09:40:17' },
  { id: 'a4', role: 'user', content: 'Tell me more about the Cloudflare one.', timestamp: '09:41:02' },
  { id: 'a5', role: 'assistant', content: 'Cloudflare AI Gateway provides a unified API layer routing requests to OpenAI, Anthropic, Gemini, and open-source models. Key features: caching, rate limiting, analytics, and fallback chains. This means you can switch LLM providers zero-downtime. Integrates directly with Workers — relevant to your app architecture.', timestamp: '09:41:04' },
]
