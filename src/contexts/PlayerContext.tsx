import {
  createContext, useContext, useReducer, useCallback,
  ReactNode, useMemo, useRef, useEffect
} from 'react'
import { YouTubeSearchResult, getMockTracks } from '@/lib/youtube'
import { YouTubePlayerAPI } from '@/hooks/useYouTubePlayer'

// ── State ──────────────────────────────────────────────────────
interface PlayerState {
  currentTrack: YouTubeSearchResult | null
  playlist: YouTubeSearchResult[]
  isPlaying: boolean
  volume: number   // 0–100
  progress: number   // 0–100 (percentage)
  duration: number   // seconds
  isMiniPlayerVisible: boolean
  isFullPlayerVisible: boolean
  isMusicMode: boolean
  isVideoFullScreen: boolean
  brightness: number
  isShuffle: boolean
  isRepeat: boolean
}

// ── Actions ────────────────────────────────────────────────────
type PlayerAction =
  | { type: 'LOAD_TRACK'; payload: YouTubeSearchResult }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SKIP_NEXT' }
  | { type: 'SKIP_PREV' }
  | { type: 'SET_PLAYLIST'; payload: YouTubeSearchResult[] }
  | { type: 'SHOW_MINI'; payload: boolean }
  | { type: 'SHOW_FULL_PLAYER'; payload: boolean }
  | { type: 'SET_MUSIC_MODE'; payload: boolean }
  | { type: 'SET_VIDEO_FULL_SCREEN'; payload: boolean }
  | { type: 'SET_BRIGHTNESS'; payload: number }
  | { type: 'TOGGLE_SHUFFLE' }
  | { type: 'TOGGLE_REPEAT' }

const getInitialState = (): PlayerState => {
  try {
    const saved = localStorage.getItem('nl_player_state')
    if (saved) {
      const parsed = JSON.parse(saved)
      return { 
        ...parsed, 
        isPlaying: false, 
        isMiniPlayerVisible: !!parsed.currentTrack,
        isFullPlayerVisible: false,
        progress: 0
      }
    }
  } catch (e) {
    console.warn('Player state resume failed', e)
  }
  return {
    currentTrack: null,
    playlist: [],
    isPlaying: false,
    volume: 75,
    progress: 0,
    duration: 0,
    isMiniPlayerVisible: false,
    isFullPlayerVisible: false,
    isMusicMode: true,
    isVideoFullScreen: false,
    brightness: 1,
    isShuffle: false,
    isRepeat: false,
  }
}

const initialState = getInitialState()

function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'LOAD_TRACK':
      return { ...state, currentTrack: action.payload, isPlaying: true, progress: 0, isMiniPlayerVisible: true }
    case 'TOGGLE_PLAY':
      return { ...state, isPlaying: !state.isPlaying }
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload }
    case 'SET_VOLUME':
      return { ...state, volume: action.payload }
    case 'SET_PROGRESS':
      return { ...state, progress: action.payload }
    case 'SET_DURATION':
      return { ...state, duration: action.payload }
    case 'SKIP_NEXT': {
      if (!state.currentTrack) return state
      let nextIdx = state.playlist.findIndex(t => t.videoId === state.currentTrack?.videoId) + 1
      if (state.isShuffle && state.playlist.length > 0) {
        nextIdx = Math.floor(Math.random() * state.playlist.length)
      } else if (nextIdx >= state.playlist.length) {
        if (state.isRepeat) nextIdx = 0
        else return { ...state, isPlaying: false, progress: 0 } // Stop at end
      }
      const next = state.playlist[nextIdx]
      return { ...state, currentTrack: next, isPlaying: true, progress: 0 }
    }
    case 'SKIP_PREV': {
      const idx = state.playlist.findIndex(t => t.videoId === state.currentTrack?.videoId)
      const prev = state.playlist[(idx - 1 + state.playlist.length) % state.playlist.length]
      return { ...state, currentTrack: prev, isPlaying: true, progress: 0 }
    }
    case 'SET_PLAYLIST':
      return { ...state, playlist: action.payload }
    case 'SHOW_MINI':
      return { ...state, isMiniPlayerVisible: action.payload }
    case 'SHOW_FULL_PLAYER':
      return { ...state, isFullPlayerVisible: action.payload }
    case 'SET_MUSIC_MODE':
      return { ...state, isMusicMode: action.payload }
    case 'SET_VIDEO_FULL_SCREEN':
      return { ...state, isVideoFullScreen: action.payload }
    case 'SET_BRIGHTNESS':
      return { ...state, brightness: action.payload }
    case 'TOGGLE_SHUFFLE':
      return { ...state, isShuffle: !state.isShuffle }
    case 'TOGGLE_REPEAT':
      return { ...state, isRepeat: !state.isRepeat }
    default:
      return state
  }
}

// ── Context ────────────────────────────────────────────────────
interface PlayerContextValue {
  state: PlayerState
  playerApiRef: React.MutableRefObject<YouTubePlayerAPI | null>
  loadTrack: (track: YouTubeSearchResult) => void
  togglePlay: () => void
  setPlaying: (v: boolean) => void
  setVolume: (v: number) => void
  setProgress: (v: number) => void
  setDuration: (v: number) => void
  skipNext: () => void
  skipPrev: () => void
  setPlaylist: (pl: YouTubeSearchResult[]) => void
  showMini: (v: boolean) => void
  showFullPlayer: (v: boolean) => void
  setMusicMode: (v: boolean) => void
  setVideoFullScreen: (v: boolean) => void
  setBrightness: (v: number) => void
  toggleShuffle: () => void
  toggleRepeat: () => void
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(playerReducer, initialState)
  const playerApiRef = useRef<YouTubePlayerAPI | null>(null)

  const loadTrack = useCallback((t: YouTubeSearchResult) => dispatch({ type: 'LOAD_TRACK', payload: t }), [])
  const togglePlay = useCallback(() => dispatch({ type: 'TOGGLE_PLAY' }), [])
  const setPlaying = useCallback((v: boolean) => dispatch({ type: 'SET_PLAYING', payload: v }), [])
  const setVolume = useCallback((v: number) => dispatch({ type: 'SET_VOLUME', payload: v }), [])
  const setProgress = useCallback((v: number) => dispatch({ type: 'SET_PROGRESS', payload: v }), [])
  const setDuration = useCallback((v: number) => dispatch({ type: 'SET_DURATION', payload: v }), [])
  const skipNext = useCallback(() => dispatch({ type: 'SKIP_NEXT' }), [])
  const skipPrev = useCallback(() => dispatch({ type: 'SKIP_PREV' }), [])
  const setPlaylist = useCallback((pl: YouTubeSearchResult[]) => dispatch({ type: 'SET_PLAYLIST', payload: pl }), [])
  const showMini = useCallback((v: boolean) => dispatch({ type: 'SHOW_MINI', payload: v }), [])
  const showFullPlayer = useCallback((v: boolean) => dispatch({ type: 'SHOW_FULL_PLAYER', payload: v }), [])
  const setMusicMode = useCallback((v: boolean) => dispatch({ type: 'SET_MUSIC_MODE', payload: v }), [])
  const setVideoFullScreen = useCallback((v: boolean) => dispatch({ type: 'SET_VIDEO_FULL_SCREEN', payload: v }), [])
  const setBrightness = useCallback((v: number) => dispatch({ type: 'SET_BRIGHTNESS', payload: v }), [])
  const toggleShuffle = useCallback(() => dispatch({ type: 'TOGGLE_SHUFFLE' }), [])
  const toggleRepeat = useCallback(() => dispatch({ type: 'TOGGLE_REPEAT' }), [])

  // Persistence Sync
  useEffect(() => {
    const { isPlaying, progress, duration, isFullPlayerVisible, ...persistable } = state
    localStorage.setItem('nl_player_state', JSON.stringify(persistable))
  }, [state])

  const value = useMemo(() => ({
    state, playerApiRef, loadTrack, togglePlay, setPlaying, setVolume,
    setProgress, setDuration, skipNext, skipPrev, setPlaylist, showMini, showFullPlayer, setMusicMode,
    setVideoFullScreen, setBrightness, toggleShuffle, toggleRepeat
  }), [state, loadTrack, togglePlay, setPlaying, setVolume, setProgress, setDuration, skipNext, skipPrev, setPlaylist, showMini, showFullPlayer, setMusicMode, setVideoFullScreen, setBrightness, toggleShuffle, toggleRepeat])

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider')
  return ctx
}
