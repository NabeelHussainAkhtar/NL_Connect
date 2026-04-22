import { useRef, useCallback, useState } from 'react'

export interface YouTubePlayerAPI {
  play:           () => void
  pause:          () => void
  seekTo:         (seconds: number) => void
  setVolume:      (volume: number) => void
  getDuration:    () => number
  getCurrentTime: () => number
  isReady:        boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useYouTubePlayer(): { playerRef: React.MutableRefObject<any>; api: YouTubePlayerAPI; onReady: (e: any) => void } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null)
  const [isReady, setIsReady]  = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onReady = useCallback((event: any) => {
    playerRef.current = event.target
    setIsReady(true)
  }, [])

  const guard = useCallback(<T>(fn: () => T, fallback: T): T => {
    if (!isReady || !playerRef.current) return fallback
    try { return fn() }
    catch { return fallback }
  }, [isReady])

  const api: YouTubePlayerAPI = {
    isReady,
    play:           () => guard(() => { playerRef.current.playVideo(); return undefined }, undefined),
    pause:          () => guard(() => { playerRef.current.pauseVideo(); return undefined }, undefined),
    seekTo:         (s)  => guard(() => { playerRef.current.seekTo(s, true); return undefined }, undefined),
    setVolume:      (v)  => guard(() => { playerRef.current.setVolume(v); return undefined }, undefined),
    getDuration:    ()   => guard(() => playerRef.current.getDuration() as number, 0),
    getCurrentTime: ()   => guard(() => playerRef.current.getCurrentTime() as number, 0),
  }

  return { playerRef, api, onReady }
}
