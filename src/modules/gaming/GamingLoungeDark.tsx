import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Users, Flame, Trophy, Clock, Award, Play, Sparkles } from 'lucide-react'
import { mockGames } from '@/lib/mockData'

export default function GamingLoungeDark() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [isMobile, setIsMobile] = useState(false)
  
  const categories = [
    { id: 'all', label: 'All Games', count: mockGames.length },
    { id: 'live', label: 'Live Now', count: mockGames.filter(g => g.isLive).length },
    { id: 'trending', label: 'Trending', count: mockGames.filter(g => g.playersOnline > 1000).length },
  ]

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const filteredGames = mockGames.filter(game => {
    if (activeCategory === 'live') return game.isLive
    if (activeCategory === 'trending') return game.playersOnline > 1000
    if (searchQuery) {
      return game.title.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  const featuredGame = {
    title: 'Elden Grove: The Rooted Expansion',
    description: 'Explore the ancient, overgrown ruins of the forgotten city. New quests, organic weaponry, and earth-shattering bosses await.',
    players: 5230,
    status: 'live',
    accent: '#8fc49e',
  }

  if (isMobile) {
    return (
      <div className="h-full overflow-y-auto bg-[#1a1c1a] pb-24">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-[#1a1c1a]/95 backdrop-blur-md border-b border-[#4a7c59]/20 px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold font-headline text-[#faf6f0]">Terra Gaming</h1>
              <p className="text-sm text-[#faf6f0]/60">Join organic multiplayer sessions</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#242624] flex items-center justify-center border border-[#4a7c59]/30">
                <span className="text-lg">👤</span>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#8fc49e]" />
            <input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#242624] text-[#faf6f0] rounded-xl border border-[#4a7c59]/20 focus:border-[#8fc49e] focus:outline-none focus:ring-2 focus:ring-[#8fc49e]/20 placeholder-[#8fc49e]/50"
            />
          </div>
        </div>

        {/* Featured Event Banner */}
        <div className="px-4 mt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1c1a] via-[#1a1c1a]/60 to-transparent z-10" />
            <img
              src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80"
              alt="Featured Game"
              className="w-full h-48 object-cover opacity-50"
            />
            <div className="absolute inset-0 z-20 p-4 flex flex-col justify-end">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#8fc49e] animate-pulse" />
                <span className="text-xs font-bold text-[#8fc49e]">LIVE EVENT</span>
              </div>
              <h3 className="text-2xl font-bold font-headline text-[#faf6f0] mb-1">Elden Grove</h3>
              <p className="text-sm text-[#faf6f0]/60 mb-4">New expansion is here!</p>
              <button className="w-full py-3 bg-[#8fc49e] text-[#1a1c1a] rounded-xl font-bold flex items-center justify-center gap-2">
                <Play className="w-5 h-5" />
                Play Now
              </button>
            </div>
          </motion.div>
        </div>

        {/* Quick Stats */}
        <div className="px-4 mt-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#242624] p-3 rounded-xl border border-[#4a7c59]/20">
              <p className="text-xs text-[#8fc49e] font-bold">Live Players</p>
              <p className="text-xl font-bold text-[#faf6f0]">
                {mockGames.reduce((sum, game) => sum + game.playersOnline, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-[#242624] p-3 rounded-xl border border-[#4a7c59]/20">
              <p className="text-xs text-[#8fc49e] font-bold">Live Games</p>
              <p className="text-xl font-bold text-[#faf6f0]">{mockGames.filter(g => g.isLive).length}</p>
            </div>
            <div className="bg-[#242624] p-3 rounded-xl border border-[#c4a66a]/20">
              <p className="text-xs text-[#c4a66a] font-bold">Avg. Time</p>
              <p className="text-xl font-bold text-[#faf6f0]">12 min</p>
            </div>
          </div>
        </div>

        {/* Games Categories */}
        <div className="px-4 mt-6">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap ${activeCategory === category.id
                    ? 'bg-[#8fc49e] text-[#1a1c1a] shadow-[0_0_20px_rgba(143,196,158,0.3)]'
                    : 'bg-[#242624] text-[#faf6f0]/60 border border-[#4a7c59]/20'
                  }`}
              >
                <span className="font-medium">{category.label}</span>
                <span className="text-xs font-bold opacity-70">({category.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Game Cards */}
        <div className="px-4 mt-6">
          <div className="grid grid-cols-2 gap-3">
            {filteredGames.slice(0, 6).map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-[#242624] rounded-xl p-4 border border-[#4a7c59]/10 hover:border-[#8fc49e]/30 transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="w-12 h-12 rounded-lg bg-[#1a1c1a] flex items-center justify-center text-xl border border-[#4a7c59]/20">
                    {game.thumbnail}
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${game.isLive
                      ? 'bg-[#8fc49e]/20 text-[#8fc49e]'
                      : 'bg-[#242624] text-[#faf6f0]/40'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${game.isLive ? 'bg-[#8fc49e] animate-pulse' : 'bg-[#faf6f0]/30'}`} />
                    {game.isLive ? 'LIVE' : 'OFF'}
                  </div>
                </div>
                <h4 className="font-bold text-[#faf6f0] mb-1 text-sm">{game.title}</h4>
                <p className="text-xs text-[#faf6f0]/50 mb-3">{game.category}</p>
                <div className="flex items-center justify-between text-xs text-[#faf6f0]/50 mb-4">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{game.playersOnline.toLocaleString()}</span>
                  </div>
                </div>
                <button
                  className="w-full py-2 rounded-lg font-medium text-[#1a1c1a] text-sm"
                  style={{
                    background: `linear-gradient(135deg, ${game.accent}, ${game.accent}dd)`,
                  }}
                >
                  Play Now
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Discover More */}
        <div className="px-4 mt-6 mb-8">
          <div className="border-2 border-dashed border-[#4a7c59]/30 rounded-2xl p-8 flex flex-col items-center justify-center bg-[#1a1c1a]/50">
            <Sparkles className="w-8 h-8 text-[#8fc49e] mb-4" />
            <h3 className="text-lg font-bold text-[#faf6f0] mb-2">Discover More Games</h3>
            <p className="text-sm text-[#faf6f0]/50 text-center mb-4">
              Browse our curated collection
            </p>
            <button className="px-6 py-3 bg-[#8fc49e] text-[#1a1c1a] rounded-xl font-medium">
              Browse Store
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Desktop Dark Mode
  return (
    <div className="h-full overflow-hidden bg-[#1a1c1a]">
      {/* Top Navigation */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-[#4a7c59]/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#8fc49e]/10 flex items-center justify-center border border-[#8fc49e]/30">
            <span className="text-2xl">🎮</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold font-headline text-[#8fc49e]">Terra Gaming</h1>
            <p className="text-sm text-[#faf6f0]/60">Gaming Lounge</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#8fc49e]" />
            <input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-[#242624] text-[#faf6f0] rounded-xl border border-[#4a7c59]/20 focus:border-[#8fc49e] focus:outline-none w-64 placeholder-[#8fc49e]/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#242624] flex items-center justify-center border border-[#4a7c59]/20">
              <Trophy className="w-5 h-5 text-[#8fc49e]" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#242624] flex items-center justify-center border border-[#4a7c59]/20">
              <span className="text-lg">🔔</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100%-88px)]">
        {/* Sidebar */}
        <div className="w-64 border-r border-[#4a7c59]/20 p-6">
          <h3 className="font-headline font-bold text-lg text-[#faf6f0] mb-4">Categories</h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left ${activeCategory === category.id
                    ? 'bg-[#8fc49e] text-[#1a1c1a] shadow-[0_0_20px_rgba(143,196,158,0.3)]'
                    : 'bg-[#242624] text-[#faf6f0]/60 border border-[#4a7c59]/20 hover:border-[#8fc49e]/30'
                  }`}
              >
                <span className="font-medium">{category.label}</span>
                <span className="text-sm font-bold">{category.count}</span>
              </button>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-[#4a7c59]/20">
            <h3 className="font-headline font-bold text-lg text-[#faf6f0] mb-4">Stats</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[#faf6f0]/60">Total Online</p>
                <p className="text-2xl font-bold text-[#faf6f0]">
                  {mockGames.reduce((sum, game) => sum + game.playersOnline, 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#faf6f0]/60">Live Games</p>
                <p className="text-2xl font-bold text-[#8fc49e]">{mockGames.filter(g => g.isLive).length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Game Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Featured Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-[#8fc49e]" />
              <span className="text-sm font-bold text-[#8fc49e] tracking-wider">LIVE EVENT</span>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-3xl overflow-hidden glass-panel emerald-glow"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#1a1c1a] via-[#1a1c1a]/40 to-transparent z-10" />
              <img
                src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=80"
                alt="Featured Game"
                className="w-full h-64 object-cover opacity-40"
              />
              <div className="absolute inset-0 z-20 p-8 flex flex-col justify-end">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-[#8fc49e] animate-pulse" />
                  <span className="text-sm font-bold text-[#faf6f0]">LIVE NOW • {featuredGame.players.toLocaleString()} playing</span>
                </div>
                <h3 className="text-4xl font-bold font-headline text-[#faf6f0] mb-3">{featuredGame.title}</h3>
                <p className="text-lg text-[#faf6f0]/80 mb-6 max-w-2xl">{featuredGame.description}</p>
                <div className="flex items-center gap-4">
                  <button className="px-8 py-3 bg-[#8fc49e] text-[#1a1c1a] rounded-xl font-bold hover:bg-[#a5d4b2] transition-colors flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    Play Now
                  </button>
                  <button className="px-8 py-3 bg-[#faf6f0]/10 text-[#faf6f0] rounded-xl font-bold border border-[#faf6f0]/20 hover:bg-[#faf6f0]/20 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Game Grid */}
          <div>
            <h2 className="text-2xl font-bold font-headline text-[#faf6f0] mb-6">All Games</h2>
            <div className="grid grid-cols-4 gap-6">
              {filteredGames.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="glass-panel rounded-2xl p-5 transition-all duration-300 group cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-16 h-16 rounded-xl bg-[#1a1c1a] flex items-center justify-center text-3xl border border-[#4a7c59]/20">
                      {game.thumbnail}
                    </div>
                    <div className="flex flex-col items-end">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${game.isLive
                          ? 'bg-[#8fc49e]/20 text-[#8fc49e]'
                          : 'bg-[#242624] text-[#faf6f0]/40'
                        }`}>
                        <span className={`w-2 h-2 rounded-full ${game.isLive ? 'bg-[#8fc49e] animate-pulse' : 'bg-[#faf6f0]/30'}`} />
                        {game.isLive ? 'LIVE' : 'OFFLINE'}
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-sm text-[#faf6f0]/60">
                        <Users className="w-4 h-4" />
                        <span>{game.playersOnline.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-5">
                    <h4 className="font-headline font-bold text-xl text-[#faf6f0] mb-2 group-hover:text-[#8fc49e] transition-colors">
                      {game.title}
                    </h4>
                    <span className="px-3 py-1 bg-[#242624] text-[#faf6f0]/60 text-xs font-bold rounded-full">
                      {game.category}
                    </span>
                  </div>

                  <button
                    className="w-full py-3 rounded-xl font-bold text-[#1a1c1a] transition-all duration-300 group-hover:shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${game.accent}, ${game.accent}dd)`,
                    }}
                  >
                    Play Now
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}