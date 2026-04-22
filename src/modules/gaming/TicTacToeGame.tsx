import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, RefreshCw, Bot, Users } from 'lucide-react'

type Player = 'X' | 'O' | null
type Board = Player[][]

export default function TicTacToeGame({ onExit }: { onExit: () => void }) {
    const [board, setBoard] = useState<Board>(Array(3).fill(null).map(() => Array(3).fill(null)))
    const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X')
    const [winner, setWinner] = useState<Player>(null)
    const [isDraw, setIsDraw] = useState(false)
    const [mode, setMode] = useState<'menu' | 'playing'>('menu')
    const [opponent, setOpponent] = useState<'ai' | 'friend'>('friend')

    const checkWinner = (board: Board): Player => {
        // Check rows
        for (let i = 0; i < 3; i++) {
            if (board[i][0] && board[i][0] === board[i][1] && board[i][1] === board[i][2]) {
                return board[i][0]
            }
        }
        // Check columns
        for (let i = 0; i < 3; i++) {
            if (board[0][i] && board[0][i] === board[1][i] && board[1][i] === board[2][i]) {
                return board[0][i]
            }
        }
        // Check diagonals
        if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
            return board[0][0]
        }
        if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
            return board[0][2]
        }
        return null
    }

    const checkDraw = (board: Board): boolean => {
        return board.every(row => row.every(cell => cell !== null))
    }

    const handleCellClick = (row: number, col: number) => {
        if (board[row][col] || winner || isDraw) return

        const newBoard = [...board.map(r => [...r])]
        newBoard[row][col] = currentPlayer
        setBoard(newBoard)

        const newWinner = checkWinner(newBoard)
        if (newWinner) {
            setWinner(newWinner)
            return
        }

        if (checkDraw(newBoard)) {
            setIsDraw(true)
            return
        }

        setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X')

        // AI move if playing vs AI
        if (opponent === 'ai' && currentPlayer === 'X') {
            setTimeout(() => makeAiMove(newBoard), 500)
        }
    }

    const makeAiMove = (currentBoard: Board) => {
        const emptyCells: [number, number][] = []
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (!currentBoard[i][j]) emptyCells.push([i, j])
            }
        }

        if (emptyCells.length > 0) {
            const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)]
            const newBoard = [...currentBoard.map(r => [...r])]
            newBoard[row][col] = 'O'
            setBoard(newBoard)

            const newWinner = checkWinner(newBoard)
            if (newWinner) {
                setWinner(newWinner)
                return
            }

            if (checkDraw(newBoard)) {
                setIsDraw(true)
                return
            }

            setCurrentPlayer('X')
        }
    }

    const resetGame = () => {
        setBoard(Array(3).fill(null).map(() => Array(3).fill(null)))
        setCurrentPlayer('X')
        setWinner(null)
        setIsDraw(false)
    }

    const startGame = (vs: 'ai' | 'friend') => {
        setOpponent(vs)
        setMode('playing')
        resetGame()
    }

    return (
        <motion.div
            className="absolute inset-0 bg-[var(--surface)] z-50 flex flex-col w-full h-full"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
            {/* Header */}
            <div className="h-14 px-2 flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--surface-raised)] shrink-0 shadow-sm">
                <button onClick={onExit} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/5">
                    <ChevronLeft size={24} style={{ color: 'var(--text-primary)' }} />
                </button>
                <h2 className="font-black text-[16px] text-[var(--accent)] tracking-tight">TIC TAC TOE</h2>
                <button onClick={resetGame} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/5">
                    <RefreshCw size={20} style={{ color: 'var(--text-secondary)' }} />
                </button>
            </div>

            {mode === 'menu' ? (
                <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6" style={{ background: 'var(--surface-sunken)' }}>
                    <div className="w-32 h-32 rounded-3xl bg-white shadow-xl flex flex-wrap p-2 overflow-hidden border-4 border-white">
                        {Array(9).fill(null).map((_, i) => (
                            <div key={i} className="w-1/3 h-1/3 border-2 border-gray-300 flex items-center justify-center">
                                {i % 3 === 0 ? 'X' : i % 3 === 1 ? 'O' : 'X'}
                            </div>
                        ))}
                    </div>

                    <div className="text-center mb-4">
                        <h1 className="text-2xl font-black text-[var(--text-primary)]">Tic Tac Toe</h1>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">Classic 3-in-a-row game</p>
                    </div>

                    <div className="w-full space-y-3">
                        <motion.button
                            onClick={() => startGame('ai')}
                            className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-bold text-white shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #bf5af2, #6c63ff)' }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Bot size={20} /> Play vs AI
                        </motion.button>

                        <motion.button
                            onClick={() => startGame('friend')}
                            className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-bold text-white shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #30d158, #00c896)' }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Users size={20} /> Play with Friend
                        </motion.button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-[var(--surface)] p-4">
                    {/* Game status */}
                    <div className="mb-8 text-center">
                        {winner ? (
                            <div className="text-2xl font-bold" style={{ color: winner === 'X' ? '#4f7dff' : '#ff375f' }}>
                                {winner} Wins! 🎉
                            </div>
                        ) : isDraw ? (
                            <div className="text-2xl font-bold text-[var(--text-secondary)]">It's a Draw! 🤝</div>
                        ) : (
                            <div className="text-lg font-bold">
                                <span style={{ color: currentPlayer === 'X' ? '#4f7dff' : '#ff375f' }}>
                                    {currentPlayer}'s Turn
                                </span>
                                <div className="text-sm font-normal text-[var(--text-secondary)] mt-1">
                                    vs {opponent === 'ai' ? 'AI' : 'Friend'}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Game board */}
                    <div className="w-72 h-72 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-4">
                        {board.map((row, rowIndex) => (
                            <div key={rowIndex} className="flex justify-center">
                                {row.map((cell, colIndex) => (
                                    <button
                                        key={`${rowIndex}-${colIndex}`}
                                        onClick={() => handleCellClick(rowIndex, colIndex)}
                                        className="w-20 h-20 border-2 border-gray-300 dark:border-gray-700 flex items-center justify-center text-4xl font-bold disabled:opacity-50"
                                        disabled={!!cell || !!winner || isDraw}
                                        style={{
                                            borderRight: colIndex < 2 ? '2px solid' : 'none',
                                            borderBottom: rowIndex < 2 ? '2px solid' : 'none',
                                            borderColor: 'var(--border-color)',
                                        }}
                                    >
                                        {cell && (
                                            <span style={{ color: cell === 'X' ? '#4f7dff' : '#ff375f' }}>
                                                {cell}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Controls */}
                    <div className="mt-8 flex gap-4">
                        <button
                            onClick={resetGame}
                            className="px-6 py-3 rounded-skeuo-sm font-medium flex items-center gap-2"
                            style={{ background: 'var(--surface-card)', color: 'var(--text-primary)' }}
                        >
                            <RefreshCw size={16} /> New Game
                        </button>
                        <button
                            onClick={() => setMode('menu')}
                            className="px-6 py-3 rounded-skeuo-sm font-medium"
                            style={{ background: 'var(--accent)', color: 'white' }}
                        >
                            Change Mode
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
    )
}