export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
]

export function createPeerConnection(): RTCPeerConnection {
  return new RTCPeerConnection({ iceServers: ICE_SERVERS })
}

export function addStreamToPeer(pc: RTCPeerConnection, stream: MediaStream): void {
  stream.getTracks().forEach(track => pc.addTrack(track, stream))
}

export function isScreenShareSupported(): boolean {
  return !!(navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices)
}

/**
 * SIGNALING STUB — Replace with real transport.
 * Options: Firebase Realtime DB, Cloudflare Worker + WebSocket, Socket.io
 */
export const signaling = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  send: (data: unknown) => {
    console.log('[SIGNALING STUB] Would send:', data)
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onMessage: (_handler: (data: unknown) => void) => {
    console.log('[SIGNALING STUB] Would subscribe to messages')
    return () => {} // returns unsubscribe fn
  },
}
