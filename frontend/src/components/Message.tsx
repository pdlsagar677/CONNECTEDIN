import React from 'react'
import { User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import useGetAllMessage from '@/hooks/useGetAllMessage'
import useGetRTM from '@/hooks/useGetRTM'

interface Message {
  id: string
  message: string
  senderId: string
  // Add other message properties as needed
}

interface User {
  id: string
  username: string
  profilePicture?: string
  // Add other user properties as needed
}

interface ChatState {
  messages: Message[]
}

interface AuthState {
  user: User
}

interface RootState {
  chat: ChatState
  auth: AuthState
}

interface MessagesProps {
  selectedUser: User | null
}

const Messages: React.FC<MessagesProps> = ({ selectedUser }) => {
  useGetRTM()
  useGetAllMessage()
  
  const { messages } = useSelector((store: RootState) => store.chat)
  const { user } = useSelector((store: RootState) => store.auth)

  return (
    <div>
      <div className="flex items-center gap-3 p-4 border-b">
        <div className="relative">
          {selectedUser?.profilePicture ? (
            <img 
              src={selectedUser.profilePicture} 
              alt={selectedUser.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">{selectedUser?.username}</h3>
          <Link to="/profile" className="text-sm text-blue-600 hover:underline">
            View profile
          </Link>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        {messages && messages.map((msg) => {
          return (
            <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.senderId === user.id 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-800'
              }`}>
                {msg.message}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Messages