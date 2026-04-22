import { useState } from 'react'
import ChatList, { ChatItem } from '@/modules/comms/ChatList'
import ChatThread from '../modules/comms/ChatThread'

export default function Comms() {
  const [activeChat, setActiveChat] = useState<ChatItem | null>(null)

  return (
    <div className="h-full relative overflow-hidden flex bg-[var(--surface)] w-full">
      {!activeChat ? (
        <ChatList onSelect={setActiveChat} />
      ) : (
        <ChatThread chat={activeChat} onClose={() => setActiveChat(null)} />
      )}
    </div>
  )
}
