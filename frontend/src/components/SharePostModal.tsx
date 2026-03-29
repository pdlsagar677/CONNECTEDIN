import React, { useState } from 'react'
import { X, Search, User, Send } from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import { toast } from 'sonner'
import API from '@/lib/api'
import type { User as UserType } from '@/types'

interface SharePostModalProps {
  open: boolean
  setOpen: (open: boolean) => void
  postId: string
}

const SharePostModal: React.FC<SharePostModalProps> = ({ open, setOpen, postId }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [sending, setSending] = useState<string | null>(null)
  const suggestedUsers = useSelector((store: RootState) => store.auth.suggestedUsers || [])

  const filteredUsers = searchQuery
    ? suggestedUsers.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()))
    : suggestedUsers

  const shareHandler = async (receiverId: string) => {
    try {
      setSending(receiverId)
      const res = await API.post(`/message/send/${receiverId}`, {
        textMessage: `[Shared Post] Check out this post!`,
        postId,
      })
      if (res.data.success) {
        toast.success('Post shared!')
        setOpen(false)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to share')
    } finally {
      setSending(null)
    }
  }

  if (!open) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60'>
      <div className='bg-white rounded-xl w-full max-w-sm max-h-[60vh] flex flex-col'>
        <div className='flex items-center justify-between p-4 border-b'>
          <h2 className='font-bold text-lg'>Share Post</h2>
          <X className='w-5 h-5 cursor-pointer hover:text-gray-600' onClick={() => setOpen(false)} />
        </div>

        <div className='p-3 border-b'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search...'
              className='w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
        </div>

        <div className='flex-1 overflow-y-auto'>
          {filteredUsers.map((user: UserType) => (
            <div key={user._id} className='flex items-center justify-between p-3 hover:bg-gray-50'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center'>
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt={user.username} className='w-full h-full object-cover' />
                  ) : (
                    <User className='w-5 h-5 text-gray-400' />
                  )}
                </div>
                <span className='font-medium text-sm'>{user.username}</span>
              </div>
              <button
                onClick={() => shareHandler(user._id)}
                disabled={sending === user._id}
                className='bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 disabled:opacity-50'
              >
                <Send size={14} />
                {sending === user._id ? 'Sending...' : 'Send'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SharePostModal
