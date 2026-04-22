import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider }  from '@/contexts/AuthContext'
import { PlayerProvider } from '@/contexts/PlayerContext'
import { CallProvider } from '@/contexts/CallContext'
import { RoomProvider } from '@/contexts/RoomContext'
import AppRouter from '@/router/AppRouter'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <CallProvider>
          <PlayerProvider>
            <RoomProvider>
              <AppRouter />
            </RoomProvider>
          </PlayerProvider>
        </CallProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
)
