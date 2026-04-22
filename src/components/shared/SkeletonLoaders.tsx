import { motion } from 'framer-motion'

const Shimmer = () => (
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 translate-x-[-200%] animate-[shimmer_2s_infinite]" />
)

export function MessageSkeleton({ isMe = false }) {
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3 opacity-50`}>
      <div 
        className={`px-4 py-2.5 rounded-2xl w-48 h-10 relative overflow-hidden`}
        style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-color)' }}
      >
        <div className="h-2 w-24 bg-white/10 rounded-full" />
        <Shimmer />
      </div>
    </div>
  )
}

export function MediaSkeleton() {
  return (
    <div className="rounded-skeuo-lg overflow-hidden relative bg-white/5 border border-white/10 aspect-video animate-pulse">
      <div className="absolute bottom-4 left-4 right-4 space-y-2">
        <div className="h-3 w-1/2 bg-white/10 rounded-full" />
        <div className="h-2 w-1/3 bg-white/5 rounded-full" />
      </div>
      <Shimmer />
    </div>
  )
}

export function ChatListItemSkeleton() {
  return (
    <div className="p-4 flex items-center gap-3 border-b border-white/5 opacity-50">
      <div className="w-12 h-12 rounded-full bg-white/5" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-24 bg-white/10 rounded-full" />
        <div className="h-2 w-48 bg-white/5 rounded-full" />
      </div>
    </div>
  )
}
