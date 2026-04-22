import { memo } from 'react'
import { motion } from 'framer-motion'
import { mockGames, MockGame } from '@/lib/mockData'
import { Users } from 'lucide-react'

// Map game IDs to game types expected by Gaming.tsx
const gameIdToType: Record<string, string> = {
  'g1': 'chess-blitz',      // Chess Blitz
  'g2': 'word-blitz',       // Word Blitz
  'g3': 'snake-io',         // Snake.io
  'g4': 'trivia-night',     // Trivia Night
  'g5': 'tic-tac-toe',      // Tic Tac Toe
  'g6': 'battleship',       // Battleship
  'g7': 'love-quiz',        // Love Quiz
  'g8': 'memory-match',     // Memory Match
  'g9': 'would-you-rather', // Would You Rather
  'g10': '8-ball-pool',     // 8 Ball Pool
  'g11': 'uno-online',      // Uno Online
  'g12': 'draw-guess',      // Draw & Guess
}

const GameCard = memo(function GameCard({ game, onSelectGame }: { game: MockGame; onSelectGame: (id: string) => void }) {
  const handlePlayClick = () => {
    const gameType = gameIdToType[game.id] || 'coming-soon'
    onSelectGame(gameType)
  }

  return (
    <motion.div
      className="skeuo-card p-4 flex flex-col gap-3 cursor-pointer"
      whileTap={{ scale: 0.96, y: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      {/* Game icon */}
      <div
        className="w-14 h-14 rounded-skeuo-lg text-3xl flex items-center justify-center mx-auto"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${game.accent}33, ${game.accent}11)`,
          boxShadow: `var(--shadow-raised), 0 0 20px ${game.accent}22`,
          border: `1px solid ${game.accent}33`,
        }}
      >
        {game.thumbnail}
      </div>

      {/* Info */}
      <div className="text-center">
        <p className="text-xs font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>
          {game.title}
        </p>
        <p className="text-[9px] font-medium px-2 py-0.5 rounded-full inline-block"
          style={{ background: 'var(--surface-sunken)', color: 'var(--text-tertiary)' }}>
          {game.category}
        </p>
      </div>

      {/* Players + live */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Users size={10} style={{ color: 'var(--text-tertiary)' }} />
          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
            {game.playersOnline.toLocaleString()}
          </span>
        </div>
        {game.isLive
          ? <span className="flex items-center gap-1">
            <span className="indicator-live" style={{ width: 6, height: 6 }} />
            <span className="text-[9px] font-bold" style={{ color: 'var(--accent-success)' }}>LIVE</span>
          </span>
          : <span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>offline</span>
        }
      </div>

      {/* Play button */}
      <motion.button
        id={`play-${game.id}`}
        onClick={handlePlayClick}
        className="w-full py-2 rounded-skeuo-sm text-[11px] font-bold text-white mt-1"
        style={{
          background: `linear-gradient(135deg, ${game.accent}dd, ${game.accent}88)`,
          boxShadow: `0 4px 12px ${game.accent}44, inset 0 1px 0 rgba(255,255,255,0.2)`,
        }}
        whileTap={{ scale: 0.96, y: 1 }}
        transition={{ type: 'spring', stiffness: 600, damping: 30 }}
      >
        Play Now
      </motion.button>
    </motion.div>
  )
})

export default function GameGrid({ onSelectGame }: { onSelectGame: (id: string) => void }) {
  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>
          Gaming Lounge 🎮
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          {mockGames.filter(g => g.isLive).length} games live now
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 pb-4">
        {mockGames.map((game, i) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.3 }}
          >
            <GameCard game={game} onSelectGame={onSelectGame} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
