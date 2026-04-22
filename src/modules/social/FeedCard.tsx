import { useState, memo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Share2, Film } from 'lucide-react'
import { MockPost } from '@/lib/mockData'
import { Avatar } from '@/components/shared/Avatar'

interface FeedCardProps {
  post: MockPost
}

const FeedCard = memo(function FeedCard({ post }: FeedCardProps) {
  const [liked,  setLiked]  = useState(false)
  const [likes,  setLikes]  = useState(post.likes)
  const [shared, setShared] = useState(false)

  const handleLike = useCallback(() => {
    setLiked(p => {
      setLikes(l => p ? l - 1 : l + 1)
      return !p
    })
  }, [])

  return (
    <article className="skeuo-card mx-4 my-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <Avatar initials={post.user.avatar} size="sm" online />
          <div>
            <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
              {post.user.name}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
              @{post.user.handle} · {post.time}
            </p>
          </div>
        </div>
        {post.isReel && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: 'linear-gradient(135deg, #bf5af2, #ff375f)', boxShadow: '0 3px 10px rgba(191,90,242,0.4)' }}>
            <Film size={10} color="#fff" />
            <span className="text-[9px] font-bold text-white">REEL</span>
          </div>
        )}
      </div>

      {/* Image */}
      <div className="relative w-full aspect-square overflow-hidden">
        <img
          src={post.image}
          alt={post.caption}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Actions */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-4 mb-2.5">
          {/* Heart button */}
          <button
            id={`heart-${post.id}`}
            className="heart-btn"
            onClick={handleLike}
            aria-label="Like"
          >
            <motion.div
              animate={liked ? { scale: [1, 1.4, 1] } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 600, damping: 15 }}
            >
              <Heart
                size={24}
                style={{
                  color:   liked ? '#ff375f' : 'var(--text-secondary)',
                  fill:    liked ? '#ff375f' : 'transparent',
                  filter:  liked ? 'drop-shadow(0 0 6px rgba(255,55,95,0.6))' : 'none',
                  transition: 'color 150ms, fill 150ms, filter 150ms',
                }}
              />
            </motion.div>
          </button>

          <motion.button
            id={`comment-${post.id}`}
            className="heart-btn"
            whileTap={{ scale: 0.85 }}
            aria-label="Comment"
          >
            <MessageCircle size={22} style={{ color: 'var(--text-secondary)' }} />
          </motion.button>

          <motion.button
            id={`share-${post.id}`}
            className="heart-btn"
            whileTap={{ scale: 0.85 }}
            onClick={() => setShared(p => !p)}
            aria-label="Share"
          >
            <Share2 size={20} style={{ color: shared ? 'var(--accent)' : 'var(--text-secondary)' }} />
          </motion.button>
        </div>

        <p className="text-xs font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>
          {likes.toLocaleString()} likes
        </p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {post.user.handle}
          </span>{' '}
          {post.caption}
        </p>
        <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
          View all {post.comments} comments
        </p>
      </div>
    </article>
  )
})

export default FeedCard
