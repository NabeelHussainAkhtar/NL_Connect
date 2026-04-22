import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Search, Play, TrendingUp, Clock, Home, Gamepad2, Video, UsersRound, Settings, Flame } from 'lucide-react'
import { mockGames } from '@/lib/mockData'
import { NavLink } from 'react-router-dom'

export default function GamingLoungeDesktop() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  const categories = [
    { id: 'all', label: 'All Games' },
    { id: 'trending', label: 'Trending' },
    { id: 'strategy', label: 'Strategy' },
    { id: 'multiplayer', label: 'Multiplayer' },
    { id: 'casual', label: 'Casual' },
  ]

  const featuredGame = {
    title: 'Verdant Keep',
    description: 'Explore ancient ruins, collect rare artifacts, and build your empire in this immersive RPG adventure.',
    players: 3420,
    status: 'live',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80',
    accentColor: '#30d158',
  }

  const filteredGames = mockGames.filter(game => {
    if (activeCategory !== 'all') {
      if (activeCategory === 'trending') return game.playersOnline > 200
      if (activeCategory === 'strategy') return game.category.toLowerCase().includes('strategy')
      if (activeCategory === 'multiplayer') return game.maxPlayers > 2
      if (activeCategory === 'casual') return ['Word', 'Trivia', 'Classic'].some(cat => game.category.includes(cat))
    }
    if (searchQuery) {
      return game.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
             game.category.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  return (
    <div className="h-full overflow-hidden bg-background">
      {/* Top Navigation */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-outline-variant/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-2xl">🎮</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold font-headline text-on-surface">Gaming Lounge</h1>
            <p className="text-sm text-on-surface-variant">Join organic multiplayer sessions</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">12</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center">
              <span className="text-xs">🏆</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100%-88px)]">
        {/* Left Sidebar */}
        <aside className="w-64 border-r border-outline-variant/30 p-6 bg-surface-container-low">
          <h3 className="font-headline font-bold text-lg text-on-surface mb-4">Categories</h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left ${activeCategory === category.id
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
              >
                <span className="font-medium">{category.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-outline-variant/30">
            <h3 className="font-headline font-bold text-lg text-on-surface mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-on-surface-variant">Total Players</p>
                <p className="text-2xl font-bold text-on-surface">
                  {mockGames.reduce((sum, game) => sum + game.playersOnline, 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-on-surface-variant">Live Games</p>
                <p className="text-2xl font-bold text-accent-success">{mockGames.filter(g => g.isLive).length}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          {/* Featured Game Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span className="text-sm font-bold text-primary tracking-wider">FEATURED EVENT</span>
                </div>
                <h2 className="text-3xl font-bold font-headline text-on-surface">Your Organic Playground</h2>
              </div>
              <button className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary/90 transition-colors">
                <Play className="w-5 h-5" />
                Join Now
              </button>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-3xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent z-10" />
              <img
                src={featuredGame.image}
                alt={featuredGame.title}
                className="w-full h-80 object-cover"
              />
              <div className="absolute inset-0 z-20 p-8 flex flex-col justify-end">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-accent-success animate-pulse" />
                  <span className="text-sm font-bold text-accent-success">LIVE NOW • {featuredGame.players.toLocaleString()} playing</span>
                </div>
                <h3 className="text-4xl font-bold font-headline text-white mb-3">{featuredGame.title}</h3>
                <p className="text-lg text-white/80 mb-6 max-w-2xl">{featuredGame.description}</p>
                <div className="flex items-center gap-4">
                  <button className="px-8 py-3 bg-accent-success text-white rounded-xl font-bold hover:bg-accent-success/90 transition-colors flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    Play Now
                  </button>
                  <button className="px-8 py-3 bg-white/10 backdrop-blur-sm text-white rounded-xl font-bold border border-white/20 hover:bg-white/20 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Game Grid Section */}
          <div>
            <h2 className="text-2xl font-bold font-headline text-on-surface mb-6">All Games</h2>
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredGames.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="bg-surface rounded-2xl p-5 shadow-card hover:shadow-elevated transition-all duration-300 border border-outline-variant/30 group cursor-pointer"
                >
            {/* Game Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="w-16 h-16 rounded-xl bg-surface-container-low flex items-center justify-center text-3xl shadow-inner border border-outline-variant/20">
                {game.thumbnail}
              </div>
              <div className="flex flex-col items-end">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${game.isLive
                    ? 'bg-accent-success/20 text-accent-success'
                    : 'bg-surface-container-high text-on-surface-variant'
                  }`}>
                  <span className={`w-2 h-2 rounded-full ${game.isLive ? 'bg-accent-success animate-pulse' : 'bg-outline-variant'}`} />
                  {game.isLive ? 'LIVE' : 'OFFLINE'}
                </div>
                <div className="flex items-center gap-1 mt-2 text-sm text-on-surface-variant">
                  <Users className="w-4 h-4" />
                  <span>{game.playersOnline.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Game Info */}
            <div className="mb-5">
              <h4 className="font-headline font-bold text-xl text-on-surface mb-2 group-hover:text-primary transition-colors">
                {game.title}
              </h4>
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-xs font-bold rounded-full">
                  {game.category}
                </span>
                <div className="flex items-center gap-1 text-sm text-on-surface-variant">
                  <Clock className="w-4 h-4" />
                  <span>5-15 min</span>
                </div>
              </div>
            </div>

            {/* Play Button */}
            <button
              onClick={() => console.log(`Playing ${game.title}`)}
              className="w-full py-3 rounded-xl font-bold text-white transition-all duration-300 group-hover:shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${game.accent}, ${game.accent}dd)`,
                boxShadow: `0 4px 20px ${game.accent}40`,
              }}
            >
              Play Now
            </button>
          </motion.div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}