import { useState, useRef, useCallback, useEffect } from 'react'
import Peer, { MediaConnection } from 'peerjs'
import { useAuth } from '@/contexts/AuthContext'

interface WebRTCState {
  localStream:      MediaStream | null
  remoteStream:     MediaStream | null
  isScreenSharing:  boolean
  isWatchPartyActive: boolean
  isUnavailable:    boolean
  error:            string | null
  roomId:           string | null
}

interface WebRTCActions {
  startScreenShare: () => Promise<void>
  stopScreenShare:  () => void
  joinWatchParty:   (code: string) => void
  disconnect:       () => void
}

export function useWebRTC(): WebRTCState & WebRTCActions {
  const { user } = useAuth()
  const peerRef = useRef<Peer | null>(null)
  const connectionsRef = useRef<Map<string, MediaConnection>>(new Map()) // For broadcasting to multiple viewers

  const [state, setState] = useState<WebRTCState>({
    localStream:       null,
    remoteStream:      null,
    isScreenSharing:   false,
    isWatchPartyActive:false,
    isUnavailable:     !navigator.mediaDevices?.getDisplayMedia,
    error:             null,
    roomId:            null
  })

  // Initialize peer randomly on mount just to be ready to receive/broadcast
  useEffect(() => {
    if (!user) return
    const id = `nlwp_${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    const p = new Peer(id)

    p.on('open', (peerId) => {
      const code = peerId.split('_')[1]
      setState(s => ({ ...s, roomId: code }))
    })

    p.on('call', (call) => {
      // Someone is calling to join our watch party!
      // If we are broadcasting, answer with our local stream
      if (connectionsRef.current.has(call.peer)) return // Already connected
      
      // We must answer using localStream ref (we need the latest state, so we use a clever hack or trust state.localStream closure)
      // Actually, we'll answer inside the useEffect, but localStream changes.
      // Easiest is to add a listener in startScreenShare.
    })

    peerRef.current = p

    return () => {
      p.destroy()
    }
  }, [user])

  const startScreenShare = useCallback(async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setState(s => ({ ...s, isUnavailable: true, error: 'Screen sharing is not supported.' }))
      return
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true })
      setState(s => ({ ...s, localStream: stream, isScreenSharing: true, isWatchPartyActive: true }))

      // When someone wants to watch, they will call us.
      // We must register the 'call' event handler here because stream is loaded.
      if (peerRef.current) {
        peerRef.current.removeAllListeners('call')
        peerRef.current.on('call', (call) => {
          call.answer(stream)
          connectionsRef.current.set(call.peer, call)
          call.on('close', () => connectionsRef.current.delete(call.peer))
        })
      }

      // Auto-stop when user stops sharing via browser UI
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare()
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start screen share'
      setState(s => ({ ...s, error: msg }))
    }
  }, [])

  const stopScreenShare = useCallback(() => {
    state.localStream?.getTracks().forEach(t => t.stop())
    connectionsRef.current.forEach(c => c.close())
    connectionsRef.current.clear()

    setState(s => ({ ...s, localStream: null, isScreenSharing: false, isWatchPartyActive: false }))
  }, [state.localStream])

  const joinWatchParty = useCallback((code: string) => {
    if (!peerRef.current || !code) return
    const call = peerRef.current.call(`nlwp_${code.toUpperCase()}`, new MediaStream()) // Send blank stream to trigger call
    
    call.on('stream', (remoteStream) => {
      setState(s => ({ ...s, remoteStream, isWatchPartyActive: true }))
    })

    call.on('close', () => {
      setState(s => ({ ...s, remoteStream: null, isWatchPartyActive: false }))
    })

    connectionsRef.current.set(call.peer, call)
  }, [])

  const disconnect = useCallback(() => {
    stopScreenShare()
    connectionsRef.current.forEach(c => c.close())
    connectionsRef.current.clear()
    setState(s => ({ ...s, remoteStream: null, isWatchPartyActive: false }))
  }, [stopScreenShare])

  return { ...state, startScreenShare, stopScreenShare, joinWatchParty, disconnect }
}
