import { useEffect, useState, useCallback, useRef } from 'react'
import Peer, { DataConnection, MediaConnection } from 'peerjs'

interface RoomState {
  videoId: string
  isPlaying: boolean
  currentTime: number
  lastUpdated: number
}

interface PeerMessage {
  type: 'SYNC' | 'CHAT' | 'KICK' | 'PARTICIPANTS' | 'JOIN_REQUEST' | 'WAITING_APPROVAL' | 'APPROVED' | 'REJECTED'
  mode?: 'music' | 'video' | 'clear-stream'
  payload: any
  sender: string
}

export function useRoomSync() {
  const [peer, setPeer] = useState<Peer | null>(null)
  const [roomId, setRoomId] = useState<string>('')
  const [isHost, setIsHost] = useState(false)
  const [connections, setConnections] = useState<DataConnection[]>([])
  const [mediaConnections, setMediaConnections] = useState<MediaConnection[]>([])
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [participants, setParticipants] = useState<{id: string, name: string}[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [joinStatus, setJoinStatus] = useState<'idle' | 'connecting' | 'waiting'>('idle')
  const [pendingRequests, setPendingRequests] = useState<{conn: DataConnection, name: string}[]>([])

  const connRefs = useRef<DataConnection[]>([])
  const mediaRefs = useRef<MediaConnection[]>([])
  const localStreamRef = useRef<MediaStream | null>(null)

  // Initialize Peer
  const initPeer = useCallback((id: string, asHost: boolean) => {
    const newPeer = new Peer(id, {
      config: {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      }
    })

    newPeer.on('open', (id) => {
      if (asHost) setRoomId(id)
      setIsHost(asHost)
      setPeer(newPeer)
      setError(null)
    })

    newPeer.on('error', (err) => {
      console.error('Peer Error:', err)
      setError(err.message)
    })

    // Host handles incoming connections
    if (asHost) {
      newPeer.on('connection', (conn) => {
        conn.on('open', () => {
          // Immediately inform guest they are waiting
          conn.send({ type: 'WAITING_APPROVAL' })
        })

        conn.on('data', (data: any) => {
          const msg = data as PeerMessage
          if (msg.type === 'JOIN_REQUEST') {
            setPendingRequests(prev => [...prev, { conn, name: msg.payload?.name || 'Guest' }])
          } else {
            handleIncomingMessage(msg, conn.peer)
          }
        })

        conn.on('close', () => {
          connRefs.current = connRefs.current.filter(c => c.peer !== conn.peer)
          setConnections([...connRefs.current])
          setPendingRequests(prev => prev.filter(p => p.conn.peer !== conn.peer))
        })
      })

      newPeer.on('call', (call) => {
        // If host receives a call? usually host is the caller for screen share
        // but we can support bidirectional if needed.
        call.answer() 
        call.on('stream', (stream) => {
          // host seeing guest? maybe for video chat later
        })
      })
    } else {
      // Viewer handles incoming calls from host
      newPeer.on('call', (call) => {
        call.answer()
        call.on('stream', (stream) => {
          setRemoteStream(stream)
        })
        mediaRefs.current.push(call)
        setMediaConnections([...mediaRefs.current])
      })
    }

    return newPeer
  }, [])

  const handleIncomingMessage = (msg: PeerMessage, from: string) => {
    switch (msg.type) {
      case 'SYNC':
        if (msg.mode === 'clear-stream') {
          setRemoteStream(null)
          return
        }
        // Viewer should react to host sync
        if (!isHost) {
          window.dispatchEvent(new CustomEvent('room-sync', { 
            detail: { ...msg.payload, mode: msg.mode } 
          }))
        }
        break
      case 'KICK':
        setJoinStatus('idle')
        setError(msg.payload?.reason || 'You have been disconnected.')
        // Clean local state without broadcasting
        setRoomId('')
        setConnections([])
        setRemoteStream(null)
        setPendingRequests([])
        localStorage.removeItem('nl_room_id')
        localStorage.removeItem('nl_room_is_host')
        setTimeout(() => { try { peer?.destroy(); setPeer(null); } catch(e) {} }, 100)
        break
      case 'CHAT':
        window.dispatchEvent(new CustomEvent('room-chat', { detail: { ...msg.payload, sender: msg.sender || from } }))
        
        // If host receives a chat from a guest, relay it to all OTHER guests
        if (isHost) {
          connRefs.current.forEach(conn => {
            if (conn.peer !== from && conn.open) {
              conn.send({ ...msg, sender: msg.sender || from })
            }
          })
        }
        break
      // etc
    }
  }

  // Create Room
  const createRoom = useCallback(() => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase()
    initPeer(id, true)
  }, [initPeer])

  // Join Room
  const joinRoom = useCallback((targetId: string, userName: string = 'Guest') => {
    setError(null)
    setIsConnecting(true)
    setJoinStatus('connecting')
    
    // Cleanup existing peer if any
    if (peer) {
      try { peer.destroy() } catch(e) {}
    }

    const p = initPeer(`JOIN-${Math.random().toString(36).substring(2, 6)}`, false)
    p.on('open', () => {
      const conn = p.connect(targetId, { reliable: true })
      
      const timeout = setTimeout(() => {
        if (!conn.open) {
          setError('Invalid Room Code or Host is unreachable.')
          setIsConnecting(false)
          setJoinStatus('idle')
          try { p.destroy() } catch(e) {}
        }
      }, 5000)

      conn.on('open', () => {
        clearTimeout(timeout)
        setIsConnecting(false)
        conn.send({ type: 'JOIN_REQUEST', payload: { name: userName }, sender: userName })
      })

      conn.on('data', (data: any) => {
        const msg = data as PeerMessage
        if (msg.type === 'WAITING_APPROVAL') {
          setJoinStatus('waiting')
        } else if (msg.type === 'APPROVED') {
          setJoinStatus('idle')
          connRefs.current.push(conn)
          setConnections([...connRefs.current])
          setRoomId(targetId)
        } else if (msg.type === 'REJECTED') {
          setJoinStatus('idle')
          setError('The host declined your join request.')
          try { p.destroy() } catch(e) {}
        } else {
          handleIncomingMessage(msg, conn.peer)
        }
      })

      conn.on('error', () => {
        clearTimeout(timeout)
        setIsConnecting(false)
        setJoinStatus('idle')
        setError('Connection failed.')
      })
    })
  }, [initPeer])

  // Broadcast to all peers (Host sends to all, Guest sends to Host)
  const broadcast = useCallback((type: PeerMessage['type'], payload: any, mode?: 'music' | 'video') => {
    const message: PeerMessage = { type, payload, mode, sender: isHost ? 'Host' : 'Guest' }
    connRefs.current.forEach(conn => {
      if (conn.open) conn.send(message)
    })
  }, [isHost])

  const streamMedia = useCallback((stream: MediaStream) => {
    localStreamRef.current = stream
    connRefs.current.forEach(conn => {
      const call = peer?.call(conn.peer, stream)
      if (call) mediaRefs.current.push(call)
    })
    setMediaConnections([...mediaRefs.current])
  }, [peer])

  const stopStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop())
      localStreamRef.current = null
    }
    broadcast('SYNC', { mode: 'clear-stream' }) // Optional hint to clear UI
  }, [broadcast])

  // Start Screen Share (Host only)
  const startScreenShare = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      alert("Screen sharing is not supported on this device. (Mobile apps usually require OS-level permissions for screen recording).")
      return null
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      streamMedia(stream)
      
      // Listen for browser UI "Stop sharing" button
      stream.getVideoTracks()[0].onended = () => {
        stopStream()
      }
      return stream
    } catch (err) {
      console.error('Screen Share Error:', err)
      return null
    }
  }, [streamMedia, stopStream])

  const approveRequest = useCallback((connPeerId: string) => {
    setPendingRequests(prev => {
      const req = prev.find(p => p.conn.peer === connPeerId)
      if (req) {
        req.conn.send({ type: 'APPROVED', payload: {}, sender: 'Host' })
        connRefs.current.push(req.conn)
        setConnections([...connRefs.current])
        if (localStreamRef.current) {
          const call = peer?.call(req.conn.peer, localStreamRef.current)
          if (call) mediaRefs.current.push(call)
        }
      }
      return prev.filter(p => p.conn.peer !== connPeerId)
    })
  }, [peer])

  const rejectRequest = useCallback((connPeerId: string) => {
    setPendingRequests(prev => {
      const req = prev.find(p => p.conn.peer === connPeerId)
      if (req) {
        req.conn.send({ type: 'REJECTED', payload: {}, sender: 'Host' })
        setTimeout(() => req.conn.close(), 500)
      }
      return prev.filter(p => p.conn.peer !== connPeerId)
    })
  }, [])

  const disconnect = useCallback((silent = false) => {
    if (isHost && !silent) {
      broadcast('KICK', { reason: 'Host has ended the watch party.' })
    }
    
    setTimeout(() => {
      try { peer?.destroy() } catch(e) { console.warn(e) }
      setPeer(null)
      setRoomId('')
      setIsHost(false)
      setConnections([])
      setRemoteStream(null)
      setPendingRequests([])
      setJoinStatus('idle')
      connRefs.current = []
      mediaRefs.current = []
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop())
      }
      localStorage.removeItem('nl_room_id')
      localStorage.removeItem('nl_room_is_host')
    }, silent ? 0 : 300)
  }, [peer, isHost, broadcast])

  // Sync state to local storage
  useEffect(() => {
    if (roomId && !roomId.startsWith('JOIN-')) {
      localStorage.setItem('nl_room_id', roomId)
      localStorage.setItem('nl_room_is_host', isHost.toString())
    }
  }, [roomId, isHost])

  // Auto-reconnect on mount
  useEffect(() => {
    const savedId = localStorage.getItem('nl_room_id')
    const savedIsHost = localStorage.getItem('nl_room_is_host') === 'true'
    
    if (savedId && !savedId.startsWith('JOIN-') && !roomId && !peer) {
      console.log('Attempting auto-reconnect to room:', savedId)
      if (savedIsHost) {
        initPeer(savedId, true)
      } else {
        joinRoom(savedId)
      }
    }
  }, [initPeer, joinRoom, roomId, peer])

  return {
    roomId, isHost, connections, remoteStream, error, isConnecting,
    joinStatus, pendingRequests, approveRequest, rejectRequest,
    createRoom, joinRoom, broadcast, startScreenShare, streamMedia, stopStream, disconnect
  }
}
