import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import Peer, { MediaConnection } from 'peerjs'
import { useAuth } from './AuthContext'

const WORKER = 'https://nl-connect-worker.nabeelhussain2k02.workers.dev'

interface CallContextType {
  peerId: string | null
  incomingCall: MediaConnection | null
  activeCall: MediaConnection | null
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  callState: 'idle' | 'ringing' | 'connected' | 'calling'
  isVideo: boolean
  remoteId: string | null
  remoteName: string | null
  remoteAvatar: string | null
  currentCamera: 'front' | 'back'
  callDuration: number
  initiateCall: (targetUid: string, video: boolean) => void
  answerCall: () => void
  rejectCall: () => void
  endCall: () => void
  toggleMedia: (type: 'audio' | 'video') => void
  switchCamera: () => void
}

const CallContext = createContext<CallContextType | null>(null)

export const useCall = () => {
  const ctx = useContext(CallContext)
  if (!ctx) throw new Error("useCall must be used within CallProvider")
  return ctx
}

export function CallProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [peer, setPeer] = useState<Peer | null>(null)
  const [peerId, setPeerId] = useState<string | null>(null)

  const [incomingCall, setIncomingCall] = useState<MediaConnection | null>(null)
  const [activeCall, setActiveCall] = useState<MediaConnection | null>(null)

  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)

  const [callState, setCallState] = useState<'idle' | 'ringing' | 'connected' | 'calling'>('idle')
  const [isVideo, setIsVideo] = useState(false)
  const [remoteId, setRemoteId] = useState<string | null>(null)
  const [remoteName, setRemoteName] = useState<string | null>(null)
  const [remoteAvatar, setRemoteAvatar] = useState<string | null>(null)
  const [currentCamera, setCurrentCamera] = useState<'front' | 'back'>('front')
  const [callDuration, setCallDuration] = useState(0)

  const ringtoneRef = useRef<HTMLAudioElement | null>(null)
  const callingToneRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    ringtoneRef.current = new Audio('/audio/ringtone.mp3')
    ringtoneRef.current.loop = true
    callingToneRef.current = new Audio('/audio/ringing_while_on_call.mp3')
    callingToneRef.current.loop = true
    return () => {
      ringtoneRef.current?.pause()
      callingToneRef.current?.pause()
    }
  }, [])

  useEffect(() => {
    let interval: any = null
    if (callState === 'connected') {
      setCallDuration(0)
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    } else {
      setCallDuration(0)
    }
    return () => clearInterval(interval)
  }, [callState])

  const stopAllAudio = () => {
    if (ringtoneRef.current) { ringtoneRef.current.pause(); ringtoneRef.current.currentTime = 0; }
    if (callingToneRef.current) { callingToneRef.current.pause(); callingToneRef.current.currentTime = 0; }
  }

  const fetchRemoteProfile = async (uid: string) => {
    try {
      const res = await fetch(`${WORKER}/api/users/me?uid=${uid}`)
      const data = await res.json()
      if (data.display_name) {
        setRemoteName(data.display_name)
        setRemoteAvatar(data.avatar_url)
      }
    } catch (e) {
      console.error("Profile fetch error:", e)
    }
  }

  useEffect(() => {
    if (!user) return
    let destroyed = false
    
    const initPeer = (idSuffix = '') => {
      const id = `nlconn_${user.uid}${idSuffix}`
      const p = new Peer(id, { debug: 0 })

      p.on('open', async (openId) => {
        if (!destroyed) {
          setPeerId(openId)
          // Sync Peer ID to DB
          await fetch(`${WORKER}/api/presence`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: user.uid, is_online: true, peer_id: openId })
          })
        }
      })

      p.on('call', (call) => {
        if (!destroyed) {
          const rId = call.peer.replace('nlconn_', '').split('_')[0]
          setIncomingCall(call)
          setIsVideo(call.metadata?.video || false)
          setRemoteId(rId)
          fetchRemoteProfile(rId)
          setCallState('ringing')
          localStorage.setItem('nl_call_unread', 'true')
          ringtoneRef.current?.play().catch(console.error)
        }
      })

      p.on('error', (err) => {
        console.warn('PeerJS Error:', err)
        if (err.type === 'unavailable-id' && !destroyed) {
          try { p.destroy() } catch(e) {}
          setTimeout(() => initPeer(`_${Date.now().toString(36).slice(-4)}`), 500)
        }
      })

      setPeer(p)
      return p
    }

    const p = initPeer()
    return () => {
      destroyed = true
      try {
        p.destroy()
      } catch (e) {
        console.warn('PeerJS cleanup error:', e)
      }
    }
  }, [user])

  const initiateCall = async (targetUid: string, useVideo: boolean) => {
    if (!peer) return
    try {
      // Native Permission Check (Capacitor)
      if (typeof window !== 'undefined' && (window as any).Capacitor) {
         const { Camera } = await import('@capacitor/camera')
         try {
           const status = await Camera.checkPermissions()
           if (status.camera !== 'granted' || (useVideo && status.photos !== 'granted')) {
             await Camera.requestPermissions()
           }
         } catch (e) { console.error("Native permission check failed, falling back to browser prompt", e) }
      }

      // 1. Get Target's target peer ID from presence
      const presRes = await fetch(`${WORKER}/api/presence?uids=${targetUid}`)
      const presData = await presRes.json()
      const targetPeerId = presData[0]?.peer_id || `nlconn_${targetUid}`

      const stream = await navigator.mediaDevices.getUserMedia({ video: useVideo, audio: true })
      setLocalStream(stream)
      setIsVideo(useVideo)
      setCallState('calling')
      setRemoteId(targetUid)
      fetchRemoteProfile(targetUid)

      const call = peer.call(targetPeerId, stream, { metadata: { video: useVideo } })

      call.on('stream', (remoteSet) => {
        setRemoteStream(remoteSet)
        setCallState('connected')
        stopAllAudio()
      })

      call.on('close', () => cleanupCall())
      call.on('error', () => cleanupCall())

      setActiveCall(call)
      callingToneRef.current?.play().catch(console.error)
    } catch (e) {
      console.error(e)
      alert("Failed to initiate call. Please ensure Camera and Microphone permissions are enabled.")
      cleanupCall()
    }
  }

  const answerCall = async () => {
    if (!incomingCall) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true })
      setLocalStream(stream)
      incomingCall.answer(stream)
      incomingCall.on('stream', (remoteSet) => {
        setRemoteStream(remoteSet)
        setCallState('connected')
        stopAllAudio()
      })
      incomingCall.on('close', () => cleanupCall())
      incomingCall.on('error', () => cleanupCall())
      setActiveCall(incomingCall)
      setIncomingCall(null)
    } catch (e) {
      console.error(e)
      incomingCall.close()
      cleanupCall()
    }
  }

  const rejectCall = () => {
    if (incomingCall) { incomingCall.close(); setIncomingCall(null); }
    setCallState('idle')
  }

  const endCall = async () => {
    if (activeCall) activeCall.close()
    if (incomingCall) incomingCall.close()
    
    // SIGNALING: Inform other side call ended via presence (Signaling Heartbeat)
    if (user && remoteId) {
      await fetch(`${WORKER}/api/presence`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, is_online: true, signaling: { type: 'hangup', sender: user.uid, target: remoteId } })
      }).catch(() => {})
    }
    
    cleanupCall()
  }

  const cleanupCall = () => {
    setCallState('idle')
    setActiveCall(null)
    setIncomingCall(null)
    setRemoteId(null)
    setRemoteName(null)
    setRemoteAvatar(null)
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
    }
    setRemoteStream(null)
    stopAllAudio()
  }

  // Monitor Signaling for Hangup
  useEffect(() => {
    if (!user || callState === 'idle') return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${WORKER}/api/presence?uids=${user.uid}`)
        if (res.ok) {
          const data = await res.json()
          const signal = data[0]?.signaling
          if (signal?.type === 'hangup' && signal.target === user.uid) {
             cleanupCall()
          }
        }
      } catch {}
    }, 2000)
    return () => clearInterval(interval)
  }, [user, callState])

  const toggleMedia = (type: 'audio' | 'video') => {
    if (localStream) {
      if (type === 'audio') {
        const track = localStream.getAudioTracks()[0]
        if (track) track.enabled = !track.enabled
      } else {
        const track = localStream.getVideoTracks()[0]
        if (track) track.enabled = !track.enabled
      }
    }
  }

  const switchCamera = async () => {
    if (!localStream || !isVideo) return
    try {
      const newFacingMode = currentCamera === 'front' ? 'back' : 'front'
      const constraints = { 
        video: { 
          facingMode: newFacingMode === 'front' ? 'user' : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }, 
        audio: true 
      }
      
      const newStream = await navigator.mediaDevices.getUserMedia(constraints)
      const newVideoTrack = newStream.getVideoTracks()[0]
      
      if (activeCall && activeCall.peerConnection) {
        const senders = activeCall.peerConnection.getSenders()
        const videoSender = senders.find(s => s.track?.kind === 'video')
        if (videoSender && newVideoTrack) {
          await videoSender.replaceTrack(newVideoTrack)
        }
      }
      
      // Stop only video tracks from old stream to keep audio if needed, 
      // but usually getUserMedia(constraints) returns a fresh audio track too.
      localStream.getTracks().forEach(t => t.stop())
      
      setLocalStream(newStream)
      setCurrentCamera(newFacingMode)
    } catch (err) { 
      console.error('Error switching camera:', err)
      alert("Failed to switch camera. It may be in use by another app.")
    }
  }

  return (
    <CallContext.Provider value={{
      peerId, incomingCall, activeCall, localStream, remoteStream, callState, isVideo, remoteId, remoteName, remoteAvatar,
      currentCamera, callDuration, initiateCall, answerCall, rejectCall, endCall, toggleMedia, switchCamera
    }}>
      {children}
    </CallContext.Provider>
  )
}
