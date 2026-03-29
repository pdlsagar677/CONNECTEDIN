import React, { useState } from 'react'
import { X } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { setPosts } from '@/redux/postSlice'
import { RootState } from '@/redux/store'
import { toast } from 'sonner'
import API from '@/lib/api'
import type { Post } from '@/types'

interface EditPostModalProps {
  post: Post
  open: boolean
  setOpen: (open: boolean) => void
}

const EditPostModal: React.FC<EditPostModalProps> = ({ post, open, setOpen }) => {
  const [caption, setCaption] = useState(post.caption)
  const [loading, setLoading] = useState(false)
  const posts = useSelector((store: RootState) => store.post?.posts || [])
  const dispatch = useDispatch()

  if (!open) return null

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await API.put(`/post/edit/${post._id}`, { caption })
      if (res.data.success) {
        const updatedPosts = posts.map(p =>
          p._id === post._id ? { ...p, caption: res.data.post.caption } : p
        )
        dispatch(setPosts(updatedPosts))
        toast.success('Post updated')
        setOpen(false)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update post')
    }
    setLoading(false)
  }

  return (
    <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
      <div className='bg-white rounded-xl w-full max-w-lg overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b'>
          <h2 className='font-semibold text-lg'>Edit Post</h2>
          <button onClick={() => setOpen(false)} className='text-gray-500 hover:text-gray-700'>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className='p-4'>
          {/* Post preview */}
          <div className='flex gap-3 mb-4'>
            <img
              src={post.image}
              alt='post'
              className='w-20 h-20 rounded-lg object-cover'
            />
            <div className='flex-1'>
              <p className='text-sm text-gray-500 mb-1'>Edit your caption</p>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className='w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                rows={4}
                placeholder='Write a caption...'
                maxLength={2200}
              />
              <p className='text-xs text-gray-400 text-right mt-1'>{caption.length}/2200</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='flex items-center justify-end gap-3 p-4 border-t'>
          <button
            onClick={() => setOpen(false)}
            className='px-4 py-2 text-sm text-gray-600 hover:text-gray-800'
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className='px-6 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors'
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditPostModal
