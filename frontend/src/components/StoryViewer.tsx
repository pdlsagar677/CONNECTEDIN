import React, { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, User, Trash2, Eye, Send } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import { markStoryViewed, removeStory, StoryGroup } from '@/redux/storySlice'
import { toast } from 'sonner'
import API from '@/lib/api'

interface StoryViewerProps {
  feed: StoryGroup[]
  initialGroupIndex: number
  onClose: () => void
}

interface Viewer {
  _id: string
  username: string
  profilePicture?: string
}

const StoryViewer: React.FC<StoryViewerProps> = ({ feed, initialGroupIndex, onClose }) => {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex)
  const [storyIndex, setStoryIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [showViewers, setShowViewers] = useState(false)
  const [viewers, setViewers] = useState<Viewer[]>([])
  const [loadingViewers, setLoadingViewers] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const dispatch = useDispatch()
  const user = useSelector((store: RootState) => store.auth.user)

  const currentGroup = feed[groupIndex]
  const currentStory = currentGroup?.stories[storyIndex]
  const isOwnStory = currentGroup?.user._id === user?._id

  const markViewed = useCallback(async (storyId: string) => {
    if (!user) return
    try {
      await API.put(`/stories/${storyId}/view`)
      dispatch(markStoryViewed({ storyId, userId: user._id }))
    } catch (error) {
      // silent fail
    }
  }, [user, dispatch])

  useEffect(() => {
    if (currentStory) {
      markViewed(currentStory._id)
    }
    setShowViewers(false)
    setReplyText('')
  }, [currentStory?._id, markViewed])

  // Auto-advance timer
  useEffect(() => {
    if (isPaused || showViewers) return
    setProgress(0)
    const duration = 5000
    const interval = 50
    let elapsed = 0

    const timer = setInterval(() => {
      elapsed += interval
      setProgress((elapsed / duration) * 100)

      if (elapsed >= duration) {
        goNext()
      }
    }, interval)

    return () => clearInterval(timer)
  }, [groupIndex, storyIndex, isPaused, showViewers])

  const goNext = () => {
    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex(storyIndex + 1)
    } else if (groupIndex < feed.length - 1) {
      setGroupIndex(groupIndex + 1)
      setStoryIndex(0)
    } else {
      onClose()
    }
  }

  const goPrev = () => {
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1)
    } else if (groupIndex > 0) {
      setGroupIndex(groupIndex - 1)
      setStoryIndex(feed[groupIndex - 1].stories.length - 1)
    }
  }

  const handleDelete = async () => {
    if (!currentStory) return
    try {
      const res = await API.delete(`/stories/${currentStory._id}`)
      if (res.data.success) {
        dispatch(removeStory(currentStory._id))
        toast.success('Story deleted')
        // Advance to next or close
        if (currentGroup.stories.length <= 1) {
          if (groupIndex < feed.length - 1) {
            setStoryIndex(0)
          } else {
            onClose()
          }
        } else if (storyIndex >= currentGroup.stories.length - 1) {
          setStoryIndex(Math.max(0, storyIndex - 1))
        }
      }
    } catch (error) {
      toast.error('Failed to delete story')
    }
  }

  const handleShowViewers = async () => {
    if (!currentStory) return
    setShowViewers(!showViewers)
    if (!showViewers) {
      setLoadingViewers(true)
      try {
        const res = await API.get(`/stories/${currentStory._id}/viewers`)
        if (res.data.success) {
          setViewers(res.data.viewers)
        }
      } catch (error) {
        setViewers([])
      }
      setLoadingViewers(false)
    }
  }

  const handleReply = async () => {
    if (!replyText.trim() || !currentStory || !currentGroup) return
    setSendingReply(true)
    try {
      const res = await API.post(`/message/send/${currentGroup.user._id}`, {
        textMessage: replyText,
        storyReply: {
          storyId: currentStory._id,
          storyImage: currentStory.image,
        },
      })
      if (res.data.success) {
        toast.success(`Reply sent to ${currentGroup.user.username}`)
        setReplyText('')
      }
    } catch (error) {
      toast.error('Failed to send reply')
    }
    setSendingReply(false)
  }

  if (!currentGroup || !currentStory) return null

  return (
    <div className='fixed inset-0 bg-black z-50 flex items-center justify-center'>
      {/* Close button */}
      <button onClick={onClose} className='absolute top-4 right-4 z-10 text-white hover:text-gray-300'>
        <X size={28} />
      </button>

      {/* Left arrow */}
      {(groupIndex > 0 || storyIndex > 0) && (
        <button onClick={goPrev} className='absolute left-4 z-10 text-white hover:text-gray-300'>
          <ChevronLeft size={36} />
        </button>
      )}

      {/* Right arrow */}
      {(groupIndex < feed.length - 1 || storyIndex < currentGroup.stories.length - 1) && (
        <button onClick={goNext} className='absolute right-4 z-10 text-white hover:text-gray-300'>
          <ChevronRight size={36} />
        </button>
      )}

      {/* Story content */}
      <div className='relative w-full max-w-md h-[85vh] rounded-xl overflow-hidden'>
        {/* Progress bars */}
        <div className='absolute top-0 left-0 right-0 z-10 flex gap-1 p-2'>
          {currentGroup.stories.map((_, i) => (
            <div key={i} className='flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden'>
              <div
                className='h-full bg-white rounded-full transition-all'
                style={{
                  width: i < storyIndex ? '100%' : i === storyIndex ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* User info + actions */}
        <div className='absolute top-6 left-3 right-3 z-10 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className='w-8 h-8 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center'>
              {currentGroup.user.profilePicture ? (
                <img src={currentGroup.user.profilePicture} alt='' className='w-full h-full object-cover' />
              ) : (
                <User size={16} className='text-gray-300' />
              )}
            </div>
            <span className='text-white text-sm font-semibold'>{currentGroup.user.username}</span>
            <span className='text-white/60 text-xs'>
              {getTimeAgo(currentStory.createdAt)}
            </span>
          </div>

          {/* Owner actions: viewers + delete */}
          {isOwnStory && (
            <div className='flex items-center gap-3'>
              <button
                onClick={handleShowViewers}
                className='flex items-center gap-1 text-white/80 hover:text-white transition-colors'
              >
                <Eye size={18} />
                <span className='text-xs'>{currentStory.viewers.length}</span>
              </button>
              <button
                onClick={handleDelete}
                className='text-white/80 hover:text-red-400 transition-colors'
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Image */}
        <img
          src={currentStory.image}
          alt='story'
          className='w-full h-full object-cover'
        />

        {/* Caption */}
        {currentStory.caption && !showViewers && (
          <div className='absolute bottom-16 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent'>
            <p className='text-white text-sm'>{currentStory.caption}</p>
          </div>
        )}

        {/* Viewers Panel (own story) */}
        {showViewers && isOwnStory && (
          <div className='absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm rounded-t-2xl p-4 max-h-[50%] overflow-y-auto'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-white font-semibold text-sm'>
                Viewers ({currentStory.viewers.length})
              </h3>
              <button onClick={() => setShowViewers(false)} className='text-white/60 hover:text-white'>
                <X size={16} />
              </button>
            </div>
            {loadingViewers ? (
              <p className='text-white/60 text-sm text-center py-4'>Loading...</p>
            ) : viewers.length === 0 ? (
              <p className='text-white/60 text-sm text-center py-4'>No viewers yet</p>
            ) : (
              <div className='space-y-3'>
                {viewers.map((viewer) => (
                  <div key={viewer._id} className='flex items-center gap-3'>
                    <div className='w-8 h-8 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center'>
                      {viewer.profilePicture ? (
                        <img src={viewer.profilePicture} alt='' className='w-full h-full object-cover' />
                      ) : (
                        <User size={14} className='text-gray-300' />
                      )}
                    </div>
                    <span className='text-white text-sm'>{viewer.username}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reply input (other's story) */}
        {!isOwnStory && !showViewers && (
          <div className='absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent'>
            <div className='flex items-center gap-2'>
              <input
                type='text'
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={() => setIsPaused(true)}
                onBlur={() => { if (!replyText) setIsPaused(false) }}
                onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                placeholder={`Reply to ${currentGroup.user.username}...`}
                className='flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-white text-sm placeholder-white/50 outline-none focus:border-white/40'
              />
              {replyText.trim() && (
                <button
                  onClick={handleReply}
                  disabled={sendingReply}
                  className='bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full disabled:opacity-50 transition-colors'
                >
                  <Send size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Click areas for prev/next */}
        {!showViewers && (
          <div className='absolute inset-0 flex' style={{ bottom: '60px' }}>
            <div className='w-1/3 h-full cursor-pointer' onClick={goPrev} />
            <div className='w-1/3 h-full' />
            <div className='w-1/3 h-full cursor-pointer' onClick={goNext} />
          </div>
        )}
      </div>
    </div>
  )
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default StoryViewer
