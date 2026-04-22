import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Bot, User, Music, Video, Gamepad2, Sparkles, ChevronRight } from 'lucide-react'
import { DiscoveryResult } from '@/lib/discovery'

interface SmartSearchBarProps {
  placeholder?: string
  onSelect: (result: DiscoveryResult) => void
  onSubmit?: (query: string) => void
  results: DiscoveryResult[]
  value: string
  onChange: (val: string) => void
  onFocus?: () => void
  autoFocus?: boolean
  className?: string
}

const ResultIcon = ({ type }: { type: DiscoveryResult['type'] }) => {
  switch (type) {
    case 'module': return <Sparkles size={16} className="text-[var(--accent)]" />
    case 'contact': return <User size={16} className="text-blue-400" />
    case 'game': return <Gamepad2 size={16} className="text-green-400" />
    case 'prompt': return <Bot size={16} className="text-purple-400" />
    default: return <Search size={16} className="text-gray-400" />
  }
}

export const SmartSearchBar = memo(function SmartSearchBar({
  placeholder = "Search...",
  onSelect,
  onSubmit,
  results,
  value,
  onChange,
  onFocus,
  autoFocus,
  className = ""
}: SmartSearchBarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(prev => (prev > 0 ? prev - 1 : prev))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0) {
        onSelect(results[activeIndex])
      } else if (value.trim() && onSubmit) {
        onSubmit(value)
      }
      setIsOpen(false)
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <div 
        className={`flex items-center gap-2 px-4 py-3 glass border rounded-full transition-all duration-300 ${isOpen ? 'ring-2 ring-[var(--accent)] border-[var(--accent)] shadow-lg' : 'border-[var(--border-color)] shadow-sm'}`}
      >
        <Search size={18} className={`${isOpen ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'} transition-colors`} />
        <input
          autoFocus={autoFocus}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setIsOpen(true)
            setActiveIndex(-1)
          }}
          onFocus={() => {
            setIsOpen(true)
            if (onFocus) onFocus()
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none outline-none text-sm font-medium placeholder:text-[var(--text-tertiary)]"
          style={{ color: 'var(--text-primary)' }}
        />
        {value && (
          <button onClick={() => onChange('')} className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
            <X size={14} className="text-[var(--text-tertiary)]" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="absolute top-14 left-0 right-0 z-50 overflow-hidden glass border border-[var(--border-color)] rounded-3xl shadow-2xl backdrop-blur-xl"
          >
            <div className="max-h-[350px] overflow-y-auto p-2 scrollbar-hide">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)] px-4 py-2 opacity-50">Discovery Suggestions</p>
              {results.map((res, i) => (
                <button
                  key={res.id}
                  onClick={() => {
                    onSelect(res)
                    setIsOpen(false)
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 text-left ${i === activeIndex ? 'bg-[var(--accent)]/10 translate-x-1' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${i === activeIndex ? 'bg-[var(--accent)]/20' : 'bg-[var(--surface-sunken)]'}`}
                    style={{ border: i === activeIndex ? `1px solid var(--accent)` : '1px solid var(--border-color)' }}>
                    {res.image ? (
                        <div className="w-full h-full rounded-xl overflow-hidden flex items-center justify-center text-sm font-bold character-avatar">
                           {res.image.length > 2 ? <img src={res.image} className="w-full h-full object-cover" /> : res.image}
                        </div>
                    ) : <ResultIcon type={res.type} />}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                       <p className="text-sm font-bold truncate" style={{ color: i === activeIndex ? 'var(--accent)' : 'var(--text-primary)' }}>{res.title}</p>
                       <span className="text-[9px] font-black uppercase opacity-40 px-1.5 py-0.5 rounded-md border border-current">{res.type}</span>
                    </div>
                    {res.subtitle && <p className="text-[11px] opacity-60 truncate" style={{ color: 'var(--text-secondary)' }}>{res.subtitle}</p>}
                  </div>
                  {i === activeIndex && (
                    <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}>
                      <ChevronRight size={16} className="text-[var(--accent)]" />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>
            <div className="p-3 bg-[var(--surface-sunken)] border-t border-[var(--border-color)]">
               <p className="text-[10px] text-center font-bold text-[var(--text-tertiary)]">
                 Press <span className="px-1.5 py-0.5 bg-black/5 rounded font-mono">Enter</span> to select
               </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})
