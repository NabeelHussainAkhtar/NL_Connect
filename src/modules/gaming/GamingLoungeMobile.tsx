import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Search, Play, Flame, ChevronRight, Clock, Award } from 'lucide-react'
import { mockGames } from '@/lib/mockData'

export default function GamingLoungeMobile() {
  const [activeTab, setActiveTab] = useState('discover')
  const [searchQuery, setSearchQuery] = useState('')

  const featuredGames = mockGames.filter(game => game.isLive && game.playersOnline > 200).slice(0, 3)
  const recentGames = mockGames.slice(0, 4)

  const tabs = [
    { id: 'discover', label: 'Discover', icon: '🔍' },
    { id: 'trending', label: 'Trending', icon: '🔥' },
    { id: 'friends', label: 'Friends', icon: '👥' },
    { id: 'library', label: 'Library', icon: '🎮' },
  ]

  return (
    <div className="h-full overflow-y-auto bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-outline-variant/20 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold font-headline text-on-surface">Terra Gaming</h1>
            <p className="text-sm text-on-surface-variant">Join organic multiplayer sessions</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
              <span className="text-lg">👤</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap ${activeTab === tab.id
                  ? 'bg-primary text-on-primary shadow-md shadow-primary/20'
                  : 'bg-surface-container text-on-surface-variant'
                }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Featured Banner */}
      <div className="px-4 mt-4">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="w-5 h-5 text-primary" />
          <span className="text-sm font-bold text-primary tracking-wider">TRENDING NOW</span>
        </div>
<motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden mt-2"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
          <img
            src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80"
            alt="Featured Game"
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 z-20 p-4 flex flex-col justify-end">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-accent-success animate-pulse" />
              <span className="text-xs font-bold text-accent-success">LIVE • 3.4k playing</span>
            </div>
            <h3 className="text-2xl font-bold font-headline text-white mb-1">Elden Grove</h3>
            <p className="text-sm text-white/80 mb-4">Explore ancient ruins and discover secrets</p>
            <button className="w-full py-3 bg-accent-success text-white rounded-xl font-bold flex items-center justify-center gap-2">
              <Play className="w-5 h-5" />
              Play Now
            </button>
          </div>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 mt-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface-container p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
            </div>
            <p className="text-xs text-on-surface-variant">Live Players</p>
            <p className="text-xl font-bold text-on-surface">
              {mockGames.reduce((sum, game) => sum + game.playersOnline, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-surface-container p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-accent-success/10 flex items-center justify-center">
                <Flame className="w-4 h-4 text-accent-success" />
              </div>
            </div>
            <p className="text-xs text-on-surface-variant">Live Games</p>
            <p className="text-xl font-bold text-on-surface">{mockGames.filter(g => g.isLive).length}</p>
          </div>
          <div className="bg-surface-container p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-tertiary/10 flex items-center justify-center">
                <Award className="w-4 h-4 text-tertiary" />
              </div>
            </div>
            <p className="text-xs text-on-surface-variant">Avg. Time</p>
            <p className="text-xl font-bold text-on-surface">12 min</p>
          </div>
        </div>
      </div>

      {/* Live Games Section */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-headline text-on-surface">Live Now 🔴</h2>
          <button className="flex items-center gap-1 text-sm text-primary font-medium">
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          {featuredGames.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-surface rounded-xl p-4 flex items-center gap-4 shadow-card"
            >
              <div className="w-16 h-16 rounded-xl bg-surface-container-low flex items-center justify-center text-2xl shadow-inner border border-outline-variant/20">
                {game.thumbnail}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-on-surface">{game.title}</h3>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-accent-success animate-pulse" />
                    <span className="text-xs font-bold text-accent-success">LIVE</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{game.playersOnline.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{game.category}</span>
                  </div>
                </div>
              </div>
              <button
                className="px-4 py-2 rounded-lg font-medium text-white"
                style={{
                  background: `linear-gradient(135deg, ${game.accent}, ${game.accent}dd)`,
                }}
              >
                Join
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Game Grid */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-headline text-on-surface">All Games</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-on-surface-variant">Sort by:</span>
            <select className="bg-surface-container text-on-surface text-sm py-1 px-2 rounded-lg border border-outline-variant/30">
              <option>Popular</option>
              <option>Newest</option>
              <option>A-Z</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {recentGames.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-surface rounded-xl p-4 shadow-card border border-outline-variant/30"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="w-12 h-12 rounded-lg bg-surface-container-low flex items-center justify-center text-xl shadow-inner">
                  {game.thumbnail}
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${game.isLive
                    ? 'bg-accent-success/20 text-accent-success'
                    : 'bg-surface-container-high text-on-surface-variant'
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${game.isLive ? 'bg-accent-success animate-pulse' : 'bg-outline-variant'}`} />
                  {game.isLive ? 'LIVE' : 'OFF'}
                </div>
              </div>
              <h4 className="font-bold text-on-surface mb-1 text-sm">{game.title}</h4>
              <p className="text-xs text-on-surface-variant mb-3">{game.category}</p>
              <div className="flex items-center justify-between text-xs text-on-surface-variant mb-4">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{game.playersOnline.toLocaleString()}</span>
                </div>
                <span>2-4 players</span>
              </div>
              <button
                className="w-full py-2 rounded-lg font-medium text-white text-sm"
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

      {/* Add Game Card */}
      <div className="px-4 mt-6 mb-8">
        <div className="border-2 border-dashed border-outline-variant/50 rounded-2xl p-8 flex flex-col items-center justify-center bg-surface-container/30">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <span className="text-3xl text-primary">+</span>
          </div>
          <h3 className="text-lg font-bold text-on-surface mb-2">Discover More Games</h3>
          <p className="text-sm text-on-surface-variant text-center mb-4">
            Browse our curated collection of premium games
          </p>
          <button className="px-6 py-3 bg-primary text-on-primary rounded-xl font-medium">
            Browse Store
          </button>
        </div>
      </div>
    </div>
  )
}