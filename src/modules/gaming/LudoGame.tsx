import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, Share2, Bot, Users } from 'lucide-react'

export default function LudoGame({ onExit }: { onExit: () => void }) {
  const [mode, setMode] = useState<'menu' | 'playing'>('menu')
  const [opponent, setOpponent] = useState<'ai' | 'friend' | null>(null)

  const handleShare = async () => {
    const inviteLink = `${window.location.origin}/?game=ludo&join=${Date.now()}`
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Join my Ludo Match!',
          text: 'Play Ludo with me on N&L Connect.',
          url: inviteLink,
        })
      } else {
        await navigator.clipboard.writeText(inviteLink)
        alert('Invite link copied to clipboard!')
      }
    } catch(err) {
      console.error(err)
    }
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
        <h2 className="font-black text-[16px] text-[var(--accent)] tracking-tight">N&L LUDO</h2>
        <div className="w-10" />
      </div>

      {mode === 'menu' ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6" style={{ background: 'var(--surface-sunken)' }}>
           
           <div className="w-32 h-32 rounded-3xl bg-white shadow-xl flex flex-wrap p-2 rotate-3 overflow-hidden border-4 border-white">
              <div className="w-[48%] h-[48%] bg-red-500 m-[1%]" />
              <div className="w-[48%] h-[48%] bg-green-500 m-[1%]" />
              <div className="w-[48%] h-[48%] bg-blue-500 m-[1%]" />
              <div className="w-[48%] h-[48%] bg-yellow-400 m-[1%]" />
           </div>

           <div className="text-center mb-4">
              <h1 className="text-2xl font-black text-[var(--text-primary)]">Ludo Master</h1>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Play globally or challenge the AI.</p>
           </div>

           <div className="w-full space-y-3">
              <motion.button 
                onClick={() => { setOpponent('ai'); setMode('playing') }}
                className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-bold text-white shadow-lg"
                style={{ background: 'linear-gradient(135deg, #bf5af2, #6c63ff)' }}
                whileTap={{ scale: 0.95 }}
              >
                 <Bot size={20} /> Play vs AI
              </motion.button>

              <motion.button 
                onClick={() => { setOpponent('friend'); handleShare() }}
                className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-bold text-white shadow-lg"
                style={{ background: 'linear-gradient(135deg, #30d158, #00c896)' }}
                whileTap={{ scale: 0.95 }}
              >
                 <Share2 size={20} /> Share Invite Link
              </motion.button>
              
              <motion.button 
                onClick={() => { setOpponent('friend'); setMode('playing') }}
                className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-bold text-white shadow-lg"
                style={{ background: 'linear-gradient(135deg, #ff375f, #ff9f0a)' }}
                whileTap={{ scale: 0.95 }}
              >
                 <Users size={20} /> Play Local Multiplayer
              </motion.button>
           </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#E5E5EA] dark:bg-[#1C1C1E] p-4 relative">
             <div className="absolute top-8 text-center w-full">
                <span className="bg-black/5 dark:bg-white/5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                   VS {opponent === 'ai' ? 'N&L AI Bot' : 'Human Player'}
                </span>
             </div>

             {/* Mock Game Board Overlay scaffold */}
             <div className="w-full aspect-square bg-white dark:bg-black rounded-lg shadow-2xl overflow-hidden flex flex-wrap p-1 gap-1 border-4 border-black/10 dark:border-white/10">
                 <div className="w-[calc(40%-2px)] h-[calc(40%-2px)] bg-red-500 rounded-md flex items-center justify-center p-2"><div className="w-full h-full bg-white/20 rounded-full" /></div>
                 <div className="w-[calc(20%-2px)] h-[calc(40%-2px)] bg-gray-200 dark:bg-gray-800 rounded-md relative flex flex-col pt-1 items-center gap-1"><div className="w-3 h-3 bg-red-500/50 rounded-full" /><div className="w-3 h-3 bg-red-500/50 rounded-full" /></div>
                 <div className="w-[calc(40%-2px)] h-[calc(40%-2px)] bg-green-500 rounded-md flex items-center justify-center p-2"><div className="w-full h-full bg-white/20 rounded-full" /></div>
                 
                 {/* Mid row */}
                 <div className="w-[calc(40%-2px)] h-[calc(20%-2px)] bg-gray-200 dark:bg-gray-800 rounded-md flex px-1 items-center gap-1"><div className="w-3 h-3 bg-blue-500/50 rounded-full" /></div>
                 <div className="w-[calc(20%-2px)] h-[calc(20%-2px)] border-[16px] border-l-red-500 border-r-yellow-400 border-t-green-500 border-b-blue-500 rounded-sm relative flex items-center justify-center"><div className="absolute bg-white dark:bg-black w-4 h-4 rounded-full" /></div>
                 <div className="w-[calc(40%-2px)] h-[calc(20%-2px)] bg-gray-200 dark:bg-gray-800 rounded-md flex flex-row-reverse px-1 items-center gap-1"><div className="w-3 h-3 bg-yellow-400/50 rounded-full" /></div>

                 <div className="w-[calc(40%-2px)] h-[calc(40%-2px)] bg-blue-500 rounded-md flex items-center justify-center p-2"><div className="w-full h-full bg-white/20 rounded-full" /></div>
                 <div className="w-[calc(20%-2px)] h-[calc(40%-2px)] bg-gray-200 dark:bg-gray-800 rounded-md flex flex-col pb-1 items-center justify-end gap-1"><div className="w-3 h-3 bg-yellow-400/50 rounded-full" /></div>
                 <div className="w-[calc(40%-2px)] h-[calc(40%-2px)] bg-yellow-400 rounded-md flex items-center justify-center p-2"><div className="w-full h-full bg-white/20 rounded-full" /></div>
             </div>

             <div className="absolute bottom-12 w-full px-8">
                 <button onClick={() => alert("Dice Rolled: " + Math.floor(Math.random() * 6 + 1))} className="w-full py-4 rounded-full bg-[var(--text-primary)] text-[var(--surface)] font-black text-lg shadow-2xl active:scale-95 transition-transform flex items-center justify-center gap-2">
                     Roll Dice 🎲
                 </button>
             </div>
        </div>
      )}
    </motion.div>
  )
}
