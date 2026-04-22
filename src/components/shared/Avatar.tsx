import { memo } from 'react'

interface AvatarProps {
  initials: string
  size?:    'sm' | 'md' | 'lg' | 'xl'
  online?:  boolean
  color?:   string
  imageUrl?: string
}

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
}

const colorMap: Record<string, string> = {
  LH: '#4f7dff', AM: '#ff375f', SN: '#30d158', OF: '#ffd60a',
  ZS: '#bf5af2', BR: '#00f5d4', NK: '#ff9f0a', TJ: '#6c63ff',
  FA: '#ff375f', HM: '#30d158', HB: '#4f7dff', FQ: '#bf5af2',
}

export const Avatar = memo(function Avatar({ initials, size = 'md', online, imageUrl }: AvatarProps) {
  const bg = colorMap[initials] ?? '#4f7dff'
  return (
    <div className="relative flex-shrink-0">
      <div
        className={`${sizeMap[size]} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 overflow-hidden`}
        style={{
          background: `radial-gradient(circle at 30% 30%, ${bg}dd, ${bg}88)`,
          boxShadow: `0 3px 10px ${bg}55, inset 0 1px 0 rgba(255,255,255,0.3)`,
        }}
      >
        {imageUrl ? (
            <img src={imageUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
            initials
        )}
      </div>
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--surface)] ${online ? 'indicator-live' : 'bg-[var(--text-tertiary)]'}`}
          style={{ width: 11, height: 11 }}
        />
      )}
    </div>
  )
})
