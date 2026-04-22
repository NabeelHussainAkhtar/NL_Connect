import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Users, Flame, Trophy, Clock, ChevronRight, Menu, Grid, List, Gamepad2, Video, UsersRound, Settings, Home } from 'lucide-react'
import { mockGames } from '@/lib/mockData'
import { NavLink } from 'react-router-dom'

interface GameGridResponsiveProps {
  onSelectGame?: (gameType: string) => void
}

export default function GameGridResponsive({ onSelectGame }: GameGridResponsiveProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  const categories = [
    { id: 'all', label: 'All Games', count: mockGames.length },
    { id: 'live', label: 'Live Now', count: mockGames.filter(g => g.isLive).length },
    { id: 'trending', label: 'Trending', count: mockGames.filter(g => g.playersOnline > 1000).length },
    { id: 'strategy', label: 'Strategy', count: mockGames.filter(g => g.category.toLowerCase().includes('strategy')).length },
    { id: 'multiplayer', label: 'Multiplayer', count: mockGames.filter(g => g.maxPlayers > 2).length },
  ]

  // Detect mobile/desktop
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const filteredGames = mockGames.filter(game => {
    if (activeCategory !== 'all') {
      if (activeCategory === 'live') return game.isLive
      if (activeCategory === 'trending') return game.playersOnline > 1000
      if (activeCategory === 'strategy') return game.category.toLowerCase().includes('strategy')
      if (activeCategory === 'multiplayer') return game.maxPlayers > 2
    }
    if (searchQuery) {
      return game.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
             game.category.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

// Mobile View
  if (isMobile) {
    return (
      <div className="h-full overflow-y-auto pb-24">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-outline-variant/20 px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold font-headline text-on-surface">Gaming Lounge</h1>
              <p className="text-sm text-on-surface-variant">Join organic multiplayer sessions</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-surface-container p-3 rounded-xl">
              <p className="text-xs text-on-surface-variant">Live Players</p>
              <p className="text-lg font-bold text-on-surface">
                {mockGames.reduce((sum, game) => sum + game.playersOnline, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-surface-container p-3 rounded-xl">
              <p className="text-xs text-on-surface-variant">Live Games</p>
              <p className="text-lg font-bold text-on-surface">{mockGames.filter(g => g.isLive).length}</p>
            </div>
            <div className="bg-surface-container p-3 rounded-xl">
              <p className="text-xs text-on-surface-variant">Avg. Time</p>
              <p className="text-lg font-bold text-on-surface">12 min</p>
            </div>
          </div>
        </div>

        {/* Mobile Glassmorphism Nav Bar */}
        <div className="md:hidden px-4 py-3 border-b border-outline-variant/20" style={{ background: 'rgba(252,249,241,0.6)', backdropFilter: 'blur(16px) saturate(1.4)', WebkitBackdropFilter: 'blur(16px) saturate(1.4)' }}>
          <div className="flex items-center gap-2 p-2 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
            <NavLink
              to="/home"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-all font-medium text-sm"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </NavLink>
            <NavLink
              to="/gaming"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 font-medium text-sm"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Gaming</span>
            </NavLink>
            <NavLink
              to="/media"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-all font-medium text-sm"
            >
              <Video className="w-4 h-4" />
              <span>Library</span>
            </NavLink>
            <NavLink
              to="/comms"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-all font-medium text-sm"
            >
              <UsersRound className="w-4 h-4" />
              <span>Friends</span>
            </NavLink>
            <NavLink
              to="/ai"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-all font-medium text-sm"
            >
              <Settings className="w-4 h-4" />
              <span>AI</span>
            </NavLink>
          </div>
        </div>

        {/* Categories */}
        <div className="px-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold font-headline text-on-surface">Categories</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex flex-col items-center px-4 py-3 rounded-xl whitespace-nowrap ${activeCategory === category.id
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-surface-container text-on-surface-variant'
                  }`}
              >
                <span className="font-bold text-lg">{category.count}</span>
                <span className="text-xs font-medium mt-1">{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Featured Banner */}
        <div className="px-4 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-primary" />
            <span className="text-sm font-bold text-primary tracking-wider">FEATURED</span>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl overflow-hidden"
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
              <button
                onClick={() => onSelectGame?.('elden-grove')}
                className="w-full py-3 bg-accent-success text-white rounded-xl font-bold"
              >
                Play Now
              </button>
            </div>
          </motion.div>
        </div>

        {/* Game Grid/List */}
        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold font-headline text-on-surface">All Games</h2>
            <button className="flex items-center gap-1 text-sm text-primary font-medium">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {viewMode === 'grid' ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-2 gap-3"
              >
                {filteredGames.slice(0, 8).map((game, index) => (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSelectGame?.(game.id)}
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
                      <span>{game.maxPlayers} players</span>
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
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {filteredGames.slice(0, 6).map((game, index) => (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => onSelectGame?.(game.id)}
                    className="bg-surface rounded-xl p-4 flex items-center gap-4 shadow-card"
                  >
                    <div className="w-16 h-16 rounded-xl bg-surface-container-low flex items-center justify-center text-2xl shadow-inner">
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
                      className="px-4 py-2 rounded-lg font-medium text-white text-sm"
                      style={{
                        background: `linear-gradient(135deg, ${game.accent}, ${game.accent}dd)`,
                      }}
                    >
                      Play
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  // Desktop View
  return (
    <div className="h-full overflow-hidden bg-background">
      {/* Universal Header Navigation */}
      <header className="px-8 py-6 border-b border-outline-variant/30 bg-background/95 backdrop-blur-md">
        <div className="flex w-full items-center justify-between gap-4">
          {/* Left Section - Logo & Title */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-2xl">🎮</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold font-headline text-on-surface">Gaming Lounge</h1>
              <p className="text-sm text-on-surface-variant">Join organic multiplayer sessions</p>
            </div>
          </div>
          
          {/* Center Section - Navigation */}
          <nav className="hidden md:flex items-center gap-8" style={{ background: 'rgba(252,249,241,0.6)', backdropFilter: 'blur(16px) saturate(1.4)', WebkitBackdropFilter: 'blur(16px) saturate(1.4)' }}>
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
              <NavLink
                to="/home"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-all font-medium"
              >
                <Home className="w-5 h-5" />
                <span>Home</span>
              </NavLink>
              <NavLink
                to="/gaming"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 font-medium"
              >
                <Gamepad2 className="w-5 h-5" />
                <span>Gaming</span>
              </NavLink>
              <NavLink
                to="/media"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-all font-medium"
              >
                <Video className="w-5 h-5" />
                <span>Library</span>
              </NavLink>
              <NavLink
                to="/comms"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-all font-medium"
              >
                <UsersRound className="w-5 h-5" />
                <span>Friends</span>
              </NavLink>
              <NavLink
                to="/ai"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-all font-medium"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </NavLink>
            </div>
          </nav>
          
          {/* Right Section - Actions */}
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
              <button className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary" />
              </button>
              <button className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center">
                <Menu className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100%-88px)]">
        {/* Sidebar */}
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
                <span className="text-sm font-bold">{category.count}</span>
              </button>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-outline-variant/30">
            <h3 className="font-headline font-bold text-lg text-on-surface mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-on-surface-variant">Total Players Online</p>
                <p className="text-2xl font-bold text-on-surface">
                  {mockGames.reduce((sum, game) => sum + game.playersOnline, 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-on-surface-variant">Live Games</p>
                <p className="text-2xl font-bold text-accent-success">{mockGames.filter(g => g.isLive).length}</p>
              </div>
              <div>
                <p className="text-sm text-on-surface-variant">Average Session</p>
                <p className="text-2xl font-bold text-on-surface">12 minutes</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          {/* Featured Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-primary" />
              <span className="text-sm font-bold text-primary tracking-wider">FEATURED EVENT</span>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-3xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent z-10" />
              <img
                src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80"
                alt="Featured Game"
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 z-20 p-8 flex flex-col justify-end">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-accent-success animate-pulse" />
                  <span className="text-sm font-bold text-accent-success">LIVE NOW • 5.2k playing</span>
                </div>
                <h3 className="text-4xl font-bold font-headline text-white mb-3">Elden Grove: The Rooted Expansion</h3>
                <p className="text-lg text-white/80 mb-6 max-w-2xl">Explore ancient ruins, collect rare artifacts, and build your empire</p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => onSelectGame?.('elden-grove')}
                    className="px-8 py-3 bg-accent-success text-white rounded-xl font-bold hover:bg-accent-success/90 transition-colors"
                  >
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
          <div className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-headline text-on-surface">All Games</h2>
              <div className="flex items-center gap-4">
                <div className="text-sm text-on-surface-variant">
                  Showing {filteredGames.length} of {mockGames.length} games
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {viewMode === 'grid' ? (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-2 xl:grid-cols-3 gap-6"
                >
                  {filteredGames.map((game, index) => (
                    <motion.div
                      key={game.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      onClick={() => onSelectGame?.(game.id)}
                      className="bg-surface rounded-2xl p-5 shadow-card hover:shadow-elevated transition-all duration-300 border border-outline-variant/30 group cursor-pointer"
                    >
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

                      <button
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
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {filteredGames.map((game, index) => (
                    <motion.div
                      key={game.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 4 }}
                      onClick={() => onSelectGame?.(game.id)}
                      className="bg-surface rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all duration-300 border border-outline-variant/30 group cursor-pointer"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-xl bg-surface-container-low flex items-center justify-center text-3xl shadow-inner border border-outline-variant/20">
                          {game.thumbnail}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-headline font-bold text-xl text-on-surface group-hover:text-primary transition-colors">
                              {game.title}
                            </h4>
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${game.isLive
                                ? 'bg-accent-success/20 text-accent-success'
                                : 'bg-surface-container-high text-on-surface-variant'
                              }`}>
                              <span className={`w-2 h-2 rounded-full ${game.isLive ? 'bg-accent-success animate-pulse' : 'bg-outline-variant'}`} />
                              {game.isLive ? 'LIVE' : 'OFFLINE'}
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-sm text-on-surface-variant mb-3">
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 bg-surface-container-high text-xs font-bold rounded-full">
                                {game.category}
                              </span>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{game.playersOnline.toLocaleString()} online</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>Up to {game.maxPlayers} players</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-on-surface-variant">Quick match • Casual play • Cross-platform</p>
                        </div>
                        <button
                          className="px-8 py-3 rounded-xl font-bold text-white transition-all duration-300"
                          style={{
                            background: `linear-gradient(135deg, ${game.accent}, ${game.accent}dd)`,
                            boxShadow: `0 4px 20px ${game.accent}40`,
                          }}
                        >
                          Play Now
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
</AnimatePresence>
            </div>
        </main>
      </div>
    </div>
  )
}