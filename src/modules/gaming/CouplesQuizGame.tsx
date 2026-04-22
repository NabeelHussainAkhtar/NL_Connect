import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, Heart, Users, Trophy, Sparkles } from 'lucide-react'

interface Question {
    id: number
    text: string
    options: string[]
    correctAnswer: number
}

const loveQuizQuestions: Question[] = [
    { id: 1, text: "What's your partner's favorite movie genre?", options: ["Romance", "Action", "Comedy", "Horror"], correctAnswer: 0 },
    { id: 2, text: "Where did you have your first date?", options: ["Coffee shop", "Park", "Restaurant", "Movie theater"], correctAnswer: 2 },
    { id: 3, text: "What's your partner's dream vacation?", options: ["Beach resort", "Mountain cabin", "City tour", "Camping"], correctAnswer: 1 },
    { id: 4, text: "What's their go-to comfort food?", options: ["Pizza", "Ice cream", "Pasta", "Chocolate"], correctAnswer: 3 },
    { id: 5, text: "How would they describe their ideal weekend?", options: ["Adventure", "Relaxation", "Socializing", "Productivity"], correctAnswer: 1 },
]

const memoryMatchQuestions: Question[] = [
    { id: 1, text: "What was the first gift you gave each other?", options: ["Jewelry", "Book", "Flowers", "Personalized item"], correctAnswer: 2 },
    { id: 2, text: "What's your shared favorite song?", options: ["Pop hit", "Classic rock", "R&B", "Indie"], correctAnswer: 0 },
    { id: 3, text: "What's your most memorable trip together?", options: ["Beach vacation", "Road trip", "City break", "Camping"], correctAnswer: 1 },
    { id: 4, text: "What's your inside joke?", options: ["Movie quote", "Funny incident", "Pet name", "Shared meme"], correctAnswer: 3 },
    { id: 5, text: "What's your couple's tradition?", options: ["Weekly date night", "Annual trip", "Cooking together", "Movie marathon"], correctAnswer: 0 },
]

const wouldYouRatherQuestions: Question[] = [
    { id: 1, text: "Would you rather have a romantic dinner at home or at a fancy restaurant?", options: ["Home dinner", "Fancy restaurant"], correctAnswer: 0 },
    { id: 2, text: "Would you rather watch a movie or go for a walk together?", options: ["Watch movie", "Go for walk"], correctAnswer: 1 },
    { id: 3, text: "Would you rather receive a handwritten letter or a surprise gift?", options: ["Handwritten letter", "Surprise gift"], correctAnswer: 0 },
    { id: 4, text: "Would you rather have a weekend getaway or a day spa together?", options: ["Weekend getaway", "Day spa"], correctAnswer: 0 },
    { id: 5, text: "Would you rather cook together or order takeout?", options: ["Cook together", "Order takeout"], correctAnswer: 0 },
]

interface CouplesQuizGameProps {
    gameType: string
    onExit: () => void
}

export default function CouplesQuizGame({ gameType, onExit }: CouplesQuizGameProps) {
    const [currentQuestion, setCurrentQuestion] = useState(0)
    const [score, setScore] = useState(0)
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'results'>('menu')
    const [playerAnswers, setPlayerAnswers] = useState<number[]>([])
    const [partnerAnswers, setPartnerAnswers] = useState<number[]>([])

    const getGameTitle = () => {
        switch (gameType) {
            case 'love-quiz': return 'Love Quiz'
            case 'memory-match': return 'Memory Match'
            case 'would-you-rather': return 'Would You Rather'
            default: return 'Couples Game'
        }
    }

    const getQuestions = () => {
        switch (gameType) {
            case 'love-quiz': return loveQuizQuestions
            case 'memory-match': return memoryMatchQuestions
            case 'would-you-rather': return wouldYouRatherQuestions
            default: return loveQuizQuestions
        }
    }

    const questions = getQuestions()

    const handleAnswer = (answerIndex: number) => {
        const newPlayerAnswers = [...playerAnswers, answerIndex]
        setPlayerAnswers(newPlayerAnswers)

        // Generate random partner answers for demo
        const newPartnerAnswers = [...partnerAnswers, Math.floor(Math.random() * questions[currentQuestion].options.length)]
        setPartnerAnswers(newPartnerAnswers)

        // Check if answer matches partner's (for demo, we'll say it matches if both chose same)
        if (answerIndex === newPartnerAnswers[currentQuestion]) {
            setScore(score + 10)
        }

        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1)
        } else {
            setGameState('results')
        }
    }

    const startGame = () => {
        setCurrentQuestion(0)
        setScore(0)
        setPlayerAnswers([])
        setPartnerAnswers([])
        setGameState('playing')
    }

    const getMatchPercentage = () => {
        if (playerAnswers.length === 0) return 0
        let matches = 0
        for (let i = 0; i < Math.min(playerAnswers.length, partnerAnswers.length); i++) {
            if (playerAnswers[i] === partnerAnswers[i]) matches++
        }
        return Math.round((matches / playerAnswers.length) * 100)
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
                <h2 className="font-black text-[16px] text-[var(--accent)] tracking-tight">{getGameTitle().toUpperCase()}</h2>
                <div className="w-10" />
            </div>

            {gameState === 'menu' ? (
                <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6" style={{ background: 'var(--surface-sunken)' }}>
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ff6b9d, #ff375f)' }}>
                            <Heart size={48} color="white" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center">
                            <Sparkles size={20} style={{ color: '#ff6b9d' }} />
                        </div>
                    </div>

                    <div className="text-center mb-4">
                        <h1 className="text-2xl font-black text-[var(--text-primary)]">{getGameTitle()}</h1>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                            Test how well you know each other!
                        </p>
                    </div>

                    <div className="w-full space-y-3">
                        <motion.button
                            onClick={startGame}
                            className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-bold text-white shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #ff6b9d, #ff375f)' }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Users size={20} /> Start Game
                        </motion.button>

                        <div className="bg-white/5 dark:bg-black/5 rounded-xl p-4">
                            <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                                <Trophy size={14} /> How to Play
                            </h3>
                            <ul className="text-xs text-[var(--text-secondary)] space-y-1">
                                <li>• Answer questions about your partner</li>
                                <li>• Your partner answers the same questions</li>
                                <li>• See how well your answers match!</li>
                                <li>• Perfect for couples to bond</li>
                            </ul>
                        </div>
                    </div>
                </div>
            ) : gameState === 'playing' ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-[var(--surface)] p-6">
                    {/* Progress */}
                    <div className="w-full mb-6">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-[var(--text-secondary)]">Question {currentQuestion + 1} of {questions.length}</span>
                            <span className="font-bold" style={{ color: '#ff6b9d' }}>Score: {score}</span>
                        </div>
                        <div className="w-full h-2 bg-[var(--surface-card)] rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                    width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                                    background: 'linear-gradient(90deg, #ff6b9d, #ff375f)'
                                }}
                            />
                        </div>
                    </div>

                    {/* Question */}
                    <div className="w-full bg-[var(--surface-card)] rounded-2xl p-6 mb-8 shadow-lg">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,107,157,0.1)' }}>
                                <Heart size={14} style={{ color: '#ff6b9d' }} />
                            </div>
                            <h3 className="text-lg font-bold text-[var(--text-primary)]">
                                {questions[currentQuestion].text}
                            </h3>
                        </div>

                        {/* Options */}
                        <div className="space-y-3">
                            {questions[currentQuestion].options.map((option, index) => (
                                <motion.button
                                    key={index}
                                    onClick={() => handleAnswer(index)}
                                    className="w-full p-4 text-left rounded-xl border transition-all"
                                    whileTap={{ scale: 0.98 }}
                                    style={{
                                        background: 'var(--surface)',
                                        borderColor: 'var(--border-color)',
                                        color: 'var(--text-primary)',
                                    }}
                                    whileHover={{ borderColor: '#ff6b9d' }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                            style={{ background: 'rgba(255,107,157,0.1)', color: '#ff6b9d' }}>
                                            {String.fromCharCode(65 + index)}
                                        </div>
                                        <span>{option}</span>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Hint */}
                    <div className="text-xs text-[var(--text-secondary)] text-center">
                        Choose the answer you think your partner would choose
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-[var(--surface)] p-6">
                    {/* Results */}
                    <div className="text-center mb-8">
                        <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #ff6b9d, #ff375f)' }}>
                            <Trophy size={36} color="white" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Game Complete!</h2>
                        <p className="text-[var(--text-secondary)] mb-6">
                            Here's how well you know each other
                        </p>
                    </div>

                    {/* Match percentage */}
                    <div className="relative w-48 h-48 mb-8">
                        <div className="absolute inset-0 rounded-full border-8" style={{ borderColor: 'var(--surface-card)' }} />
                        <div
                            className="absolute inset-4 rounded-full flex items-center justify-center flex-col"
                            style={{ background: 'linear-gradient(135deg, #ff6b9d, #ff375f)' }}
                        >
                            <span className="text-4xl font-bold text-white">{getMatchPercentage()}%</span>
                            <span className="text-sm text-white/80">Match</span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="w-full max-w-sm bg-[var(--surface-card)] rounded-2xl p-6 mb-8">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold" style={{ color: '#ff6b9d' }}>{score}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Score</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold" style={{ color: '#30d158' }}>{questions.length}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Questions</div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            onClick={startGame}
                            className="px-6 py-3 rounded-skeuo-sm font-medium"
                            style={{ background: 'var(--accent)', color: 'white' }}
                        >
                            Play Again
                        </button>
                        <button
                            onClick={() => setGameState('menu')}
                            className="px-6 py-3 rounded-skeuo-sm font-medium"
                            style={{ background: 'var(--surface-card)', color: 'var(--text-primary)' }}
                        >
                            Back to Menu
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
    )
}