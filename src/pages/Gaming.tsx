import { useState, useEffect } from 'react'
import GameGridResponsive from '../modules/gaming/GameGridResponsive'
import LudoGame from '../modules/gaming/LudoGame'
import TicTacToeGame from '../modules/gaming/TicTacToeGame'
import CouplesQuizGame from '../modules/gaming/CouplesQuizGame'
import MultiplayerLobby from '../modules/gaming/MultiplayerLobby'

export default function Gaming() {
  const [activeGame, setActiveGame] = useState<string | null>(null)

  useEffect(() => {
    // Check if user clicked a share link to join a game
    const params = new URLSearchParams(window.location.search)
    const gameParam = params.get('game')
    if (gameParam) setActiveGame(gameParam)
  }, [])

  const renderGame = () => {
    switch (activeGame) {
      case 'ludo':
        return <LudoGame onExit={() => setActiveGame(null)} />
      case 'tic-tac-toe':
        return <TicTacToeGame onExit={() => setActiveGame(null)} />
      case 'love-quiz':
      case 'memory-match':
      case 'would-you-rather':
        return <CouplesQuizGame gameType={activeGame} onExit={() => setActiveGame(null)} />
      case '8-ball-pool':
      case 'uno-online':
      case 'draw-guess':
        return <MultiplayerLobby gameType={activeGame} onExit={() => setActiveGame(null)} />
      // Map new game IDs to appropriate components
      case 'g1': // Chess Blitz
      case 'g2': // Word Roots
      case 'g3': // Terra Solitaire
      case 'g4': // Backgammon
      case 'g5': // Arboretum
      case 'g6': // Zen Pond
      case 'g7': // Trailblazer
      case 'g8': // Terracotta
      case 'g9': // Verdant Keep
      case 'g10': // Roots of Empire
      case 'g11': // Canopy Logic
      case 'g12': // Elden Grove
      case 'g13': // Snake.io
      case 'g14': // Trivia Night
      case 'g15': // Tic Tac Toe
      case 'g16': // Battleship
      case 'g17': // Love Quiz
      case 'g18': // Memory Match
      case 'g19': // Would You Rather
      case 'g20': // 8 Ball Pool
      case 'g21': // Uno Online
      case 'g22': // Draw & Guess
        return <MultiplayerLobby gameType={activeGame} onExit={() => setActiveGame(null)} />
      default:
        return (
          <div className="flex-1 flex flex-col items-center justify-center h-full p-6">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--surface-card)' }}>
                <span className="text-3xl">🎮</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Game Coming Soon!</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                This game is currently in development. Check back soon!
              </p>
              <button
                onClick={() => setActiveGame(null)}
                className="px-6 py-3 rounded-skeuo-sm font-medium"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                Back to Games
              </button>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="h-full overflow-hidden relative">
      {!activeGame ? (
        <GameGridResponsive onSelectGame={setActiveGame} />
      ) : (
        renderGame()
      )}
    </div>
  )
}
