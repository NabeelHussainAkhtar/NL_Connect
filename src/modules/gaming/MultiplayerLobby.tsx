import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, Users, Globe, Clock, UserPlus, MessageSquare, Play } from 'lucide-react'

interface Player {
    id: string
    name: string
    avatar: string
    isReady: boolean
}

interface Room {
    id: string
    name: string
    players: Player[]
    maxPlayers: number
    status: 'waiting' | 'playing' | 'full'
}

interface MultiplayerLobbyProps {
    gameType: string
    onExit: () => void
}

export default function MultiplayerLobby({ gameType, onExit }: MultiplayerLobbyProps) {
    const [view, setView] = useState<'lobby' | 'room'>('lobby')
    const [currentRoom, setCurrentRoom] = useState<Room | null>(null)
    const [playerName, setPlayerName] = useState('Player')
    const [rooms, setRooms] = useState<Room[]>([])
    const [joinRoomId, setJoinRoomId] = useState('')

    const getGameTitle = () => {
        switch (gameType) {
            case '8-ball-pool': return '8 Ball Pool'
            case 'uno-online': return 'Uno Online'
            case 'draw-guess': return 'Draw & Guess'
            default: return 'Multiplayer Game'
        }
    }

    const getGameIcon = () => {
        switch (gameType) {
            case '8-ball-pool': return '🎱'
            case 'uno-online': return '🃏'
            case 'draw-guess': return '🎨'
            default: return '🎮'
        }
    }



    const joinRoom = (room: Room) => {
        if (room.players.length >= room.maxPlayers) return

        const newPlayer: Player = {
            id: Date.now().toString(),
            name: playerName,
            avatar: playerName.charAt(0).toUpperCase(),
            isReady: false
        }

        const updatedRoom: Room = {
            ...room,
            players: [...room.players, newPlayer],
            status: room.players.length + 1 >= room.maxPlayers ? 'full' : 'waiting'
        }

        setCurrentRoom(updatedRoom)
        setView('room')

        // Update rooms list
        setRooms(rooms.map(r => r.id === room.id ? updatedRoom : r))
    }

    const leaveRoom = () => {
        if (currentRoom) {
            const updatedRoom: Room = {
                ...currentRoom,
                players: currentRoom.players.filter(p => p.name !== playerName),
                status: 'waiting'
            }

            setRooms(rooms.map(r => r.id === currentRoom.id ? updatedRoom : r))
        }

        setCurrentRoom(null)
        setView('lobby')
    }

    const toggleReady = () => {
        if (!currentRoom) return

        const updatedRoom: Room = {
            ...currentRoom,
            players: currentRoom.players.map(p =>
                p.name === playerName ? { ...p, isReady: !p.isReady } : p
            )
        }

        setCurrentRoom(updatedRoom)
        setRooms(rooms.map(r => r.id === currentRoom.id ? updatedRoom : r))
    }

    const startGame = () => {
        if (!currentRoom) return

        const allReady = currentRoom.players.every(p => p.isReady)
        if (!allReady) {
            alert('All players must be ready to start!')
            return
        }

        // In a real app, this would start the actual game
        alert(`Starting ${getGameTitle()} with ${currentRoom.players.length} players!`)

        // For demo, we'll just show a mock game screen
        setCurrentRoom({ ...currentRoom, status: 'playing' })
    }

    const createRoom = () => {
        if (!playerName.trim()) return alert('Please enter your name first')
        const id = Math.random().toString(36).substring(2, 8).toUpperCase()
        const newPlayer: Player = { id: Date.now().toString(), name: playerName, avatar: playerName.charAt(0).toUpperCase(), isReady: true }
        const newRoom: Room = { 
            id, 
            name: `${playerName}'s Room`, 
            players: [newPlayer], 
            maxPlayers: gameType === 'draw-guess' ? 8 : gameType === 'uno-online' ? 4 : 2, 
            status: 'waiting' 
        }

        setRooms(prev => [...prev, newRoom])
        setCurrentRoom(newRoom)
        setView('room')
    }

    return (
        <motion.div
            className="absolute inset-0 bg-[var(--surface)] z-50 flex flex-col w-full h-full"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
            {/* Header */}
            <div className="h-14 px-2 flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--surface-raised)] shrink-0 shadow-sm">
                <button onClick={onExit} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/5">
                    <ChevronLeft size={24} style={{ color: 'var(--text-primary)' }} />
                </button>
                <h2 className="font-black text-[16px] text-[var(--accent)] tracking-tight">{getGameTitle().toUpperCase()}</h2>
                <div className="w-10" />
            </div>

            {view === 'lobby' ? (
                <div className="flex-1 flex flex-col bg-[var(--surface)]">
                    {/* Game info */}
                    <div className="p-6 text-center border-b border-[var(--border-color)]">
                        <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl"
                            style={{ background: 'var(--surface-card)' }}>
                            {getGameIcon()}
                        </div>
                        <h1 className="text-2xl font-bold mb-2">{getGameTitle()}</h1>
                        <p className="text-sm text-[var(--text-secondary)] mb-4">
                            Play with friends or join random players worldwide
                        </p>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Enter Room Code"
                                maxLength={6}
                                value={joinRoomId}
                                onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                                className="flex-1 bg-[var(--surface-sunken)] px-4 rounded-2xl border border-[var(--border-color)] outline-none text-sm font-bold tracking-widest uppercase"
                            />
                            <button 
                                className="h-12 px-6 rounded-2xl text-sm font-bold text-white shadow-lg bg-[var(--accent)]"
                                onClick={() => {
                                    if (joinRoomId.length > 0) {
                                        const newRoom: Room = { id: joinRoomId, name: `Room ${joinRoomId}`, players: [], maxPlayers: 2, status: 'waiting' }
                                        joinRoom(newRoom)
                                    }
                                }}
                            >
                                Join
                            </button>
                        </div>
                    </div>

                    {/* Player name input */}
                    <div className="p-4 border-b border-[var(--border-color)]">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-[var(--text-secondary)]">Your name:</span>
                            <input
                                type="text"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                className="flex-1 bg-transparent border-b border-[var(--border-color)] focus:outline-none focus:border-[var(--accent)] py-1"
                                maxLength={12}
                            />
                        </div>
                    </div>

                    {/* Create room button */}
                    <div className="p-4">
                        <motion.button
                            onClick={createRoom}
                            className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-white shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #00b894, #00c896)' }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <UserPlus size={20} /> Create New Room
                        </motion.button>
                    </div>

                    {/* Available rooms */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                            <Users size={14} /> Available Rooms
                        </h3>

                        <div className="space-y-3">
                            {rooms.map((room) => (
                                <motion.div
                                    key={room.id}
                                    className="bg-[var(--surface-card)] rounded-xl p-4 cursor-pointer"
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => joinRoom(room)}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-bold">{room.name}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs px-2 py-1 rounded-full" style={{
                                                background: room.status === 'waiting' ? 'rgba(48,209,88,0.1)' : 'rgba(255,55,95,0.1)',
                                                color: room.status === 'waiting' ? '#30d158' : '#ff375f'
                                            }}>
                                                {room.status === 'waiting' ? 'Waiting' : 'Full'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="flex -space-x-2">
                                                {room.players.slice(0, 3).map((player, i) => (
                                                    <div key={player.id} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-[var(--surface)]"
                                                        style={{ background: i === 0 ? '#4f7dff' : i === 1 ? '#ff375f' : '#00f5d4', color: 'white' }}>
                                                        {player.avatar}
                                                    </div>
                                                ))}
                                                {room.players.length > 3 && (
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs bg-[var(--surface-sunken)] border-2 border-[var(--surface)]">
                                                        +{room.players.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-xs text-[var(--text-secondary)]">
                                                {room.players.length}/{room.maxPlayers} players
                                            </span>
                                        </div>

                                        <button className="text-xs px-3 py-1.5 rounded-lg font-medium"
                                            style={{ background: 'var(--accent)', color: 'white' }}>
                                            Join
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col bg-[var(--surface)]">
                    {/* Room header */}
                    <div className="p-4 border-b border-[var(--border-color)]">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold">{currentRoom?.name}</h3>
                                <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                                    <Clock size={12} /> Waiting for players...
                                </p>
                            </div>
                            <button
                                onClick={leaveRoom}
                                className="text-xs px-3 py-1.5 rounded-lg"
                                style={{ background: 'var(--surface-card)', color: 'var(--text-primary)' }}
                            >
                                Leave
                            </button>
                        </div>
                    </div>

                    {/* Players list */}
                    <div className="flex-1 p-6">
                        <h4 className="font-bold mb-4 flex items-center gap-2">
                            <Users size={16} /> Players in Room
                        </h4>

                        <div className="space-y-3">
                            {currentRoom?.players.map((player) => (
                                <div key={player.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-card)]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                                            style={{ background: player.name === playerName ? '#4f7dff' : '#ff375f', color: 'white' }}>
                                            {player.avatar}
                                        </div>
                                        <div>
                                            <div className="font-medium">{player.name} {player.name === playerName && '(You)'}</div>
                                            <div className="text-xs text-[var(--text-secondary)]">
                                                {player.isReady ? 'Ready to play' : 'Not ready'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`w-3 h-3 rounded-full ${player.isReady ? 'bg-[#30d158]' : 'bg-[var(--text-tertiary)]'}`} />
                                </div>
                            ))}
                        </div>

                        {/* Chat (mock) */}
                        <div className="mt-8">
                            <h4 className="font-bold mb-3 flex items-center gap-2">
                                <MessageSquare size={16} /> Room Chat
                            </h4>
                            <div className="bg-[var(--surface-card)] rounded-xl p-4 h-32 overflow-y-auto">
                                <div className="space-y-2">
                                    <div className="text-xs">
                                        <span className="font-bold" style={{ color: '#4f7dff' }}>Alex:</span> Who's ready to play?
                                    </div>
                                    <div className="text-xs">
                                        <span className="font-bold" style={{ color: '#ff375f' }}>Sam:</span> Just joined, give me a sec
                                    </div>
                                    <div className="text-xs">
                                        <span className="font-bold" style={{ color: '#00f5d4' }}>System:</span> {playerName} joined the room
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Room controls */}
                    <div className="p-4 border-t border-[var(--border-color)]">
                        <div className="flex gap-3">
                            <button
                                onClick={toggleReady}
                                className="flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2"
                                style={{
                                    background: currentRoom?.players.find(p => p.name === playerName)?.isReady
                                        ? 'var(--accent-success)'
                                        : 'var(--surface-card)',
                                    color: currentRoom?.players.find(p => p.name === playerName)?.isReady ? 'white' : 'var(--text-primary)'
                                }}
                            >
                                {currentRoom?.players.find(p => p.name === playerName)?.isReady ? 'Ready ✓' : 'Mark Ready'}
                            </button>

                            <button
                                onClick={startGame}
                                className="flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2"
                                style={{ background: 'var(--accent)', color: 'white' }}
                                disabled={!currentRoom?.players.every(p => p.isReady)}
                            >
                                <Play size={16} /> Start Game
                            </button>
                        </div>

                        <div className="text-center text-xs text-[var(--text-secondary)] mt-3">
                            {currentRoom?.players.filter(p => p.isReady).length}/{currentRoom?.players.length} players ready
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    )
}