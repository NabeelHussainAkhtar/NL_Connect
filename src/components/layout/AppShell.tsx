import { memo } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { TopBar } from './TopBar'
import MiniPlayer from '@/modules/media/music/MiniPlayer'
import YouTubeEngine from '@/modules/media/music/YouTubeEngine'
import { CallScreen } from '@/components/shared/CallScreen'
import { FullPlayerOverlay } from '@/components/layout/FullPlayerOverlay'
import { usePlayer } from '@/contexts/PlayerContext'
import { useRoom } from '@/contexts/RoomContext'
import { useEffect } from 'react'

export const AppShell = memo(function AppShell() {
  const { state, playerApiRef } = usePlayer()
  const { roomId } = useRoom()
  const location = useLocation()
  const isMediaPage = location.pathname.startsWith('/media')
  const isAIPage = location.pathname.startsWith('/ai')
  const isCommsPage = location.pathname.startsWith('/comms')

  // Clear unread pings when entering tabs
  useEffect(() => {
    if (isAIPage) localStorage.removeItem('nl_ai_unread')
    if (isCommsPage) localStorage.removeItem('nl_call_unread')
  }, [isAIPage, isCommsPage])

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <TopBar />

      <YouTubeEngine onApiReady={api => { playerApiRef.current = api }} />

      {/* Page content */}
      <main className="flex-1 overflow-hidden relative">
        <Outlet />
      </main>

      {/* Persistent mini player removed from here, now scoped to Media tab */}

      <CallScreen />
      <FullPlayerOverlay />
    </div>
  )
})
