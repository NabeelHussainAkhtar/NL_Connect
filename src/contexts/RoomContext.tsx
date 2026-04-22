import React, { createContext, useContext, useEffect, ReactNode } from 'react'
import { useRoomSync } from '@/hooks/useRoomSync'

type RoomContextType = ReturnType<typeof useRoomSync>

const RoomContext = createContext<RoomContextType | undefined>(undefined)

export function RoomProvider({ children }: { children: ReactNode }) {
  const roomSync = useRoomSync()

  return (
    <RoomContext.Provider value={roomSync}>
      {children}
    </RoomContext.Provider>
  )
}

export function useRoom() {
  const context = useContext(RoomContext)
  if (context === undefined) {
    throw new Error('useRoom must be used within a RoomProvider')
  }
  return context
}
