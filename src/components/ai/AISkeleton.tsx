import { motion } from 'framer-motion'
import { Cpu } from 'lucide-react'

export function AISkeleton() {
  return (
    <div className="flex justify-start mb-4 animate-pulse">
      <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-0.5 bg-white/5 border border-white/10">
        <Cpu size={14} className="text-white/20" />
      </div>
      <div className="max-w-[70%] space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-2 w-12 bg-white/10 rounded-full" />
          <div className="h-2 w-8 bg-white/5 rounded-full" />
        </div>
        <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/5 space-y-2 w-[240px]">
          <div className="h-2 bg-white/10 rounded-full w-full" />
          <div className="h-2 bg-white/10 rounded-full w-[80%]" />
          <div className="h-2 bg-white/10 rounded-full w-[90%]" />
        </div>
      </div>
    </div>
  )
}

export function SuggestionSkeleton() {
  return (
    <div className="flex gap-2 overflow-hidden mb-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-8 w-24 rounded-full bg-white/5 border border-white/10 shrink-0 animate-pulse" />
      ))}
    </div>
  )
}
