import React, { useEffect, useState } from 'react'
import { Plus, User } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import { setStoryFeed, StoryGroup } from '@/redux/storySlice'
import API from '@/lib/api'
import CreateStory from './CreateStory'
import StoryViewer from './StoryViewer'
import StorySkeleton from './StorySkeleton'

const Stories: React.FC = () => {
  const dispatch = useDispatch()
  const { storyFeed } = useSelector((store: RootState) => store.story)
  const { user } = useSelector((store: RootState) => store.auth)
  const [createOpen, setCreateOpen] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStories()
  }, [])

  const fetchStories = async () => {
    try {
      const res = await API.get('/stories/feed')
      if (res.data.success) {
        dispatch(setStoryFeed(res.data.feed))
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && storyFeed.length === 0) {
    return <StorySkeleton />
  }

  const openStory = (index: number) => {
    setSelectedGroupIndex(index)
    setViewerOpen(true)
  }

  return (
    <>
      <div className='flex gap-4 p-4 overflow-x-auto scrollbar-hide border-b border-gray-200 dark:border-gray-800 mb-4'>
        {/* Add Story Button */}
        <div
          onClick={() => setCreateOpen(true)}
          className='flex flex-col items-center gap-1 cursor-pointer flex-shrink-0'
        >
          <div className='w-16 h-16 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-orange-500 transition-colors'>
            {user?.profilePicture ? (
              <div className='relative w-full h-full'>
                <img
                  src={user.profilePicture}
                  alt='Your story'
                  className='w-full h-full rounded-full object-cover opacity-70'
                />
                <div className='absolute bottom-0 right-0 bg-orange-500 rounded-full p-0.5'>
                  <Plus size={12} className='text-white' />
                </div>
              </div>
            ) : (
              <Plus size={24} className='text-gray-400 dark:text-gray-500' />
            )}
          </div>
          <span className='text-xs text-gray-500 dark:text-gray-400'>Your story</span>
        </div>

        {/* Story Groups */}
        {storyFeed.map((group: StoryGroup, index: number) => {
          if (group.user._id === user?._id && group.stories.length > 0) {
            // Show own stories with view capability
            return (
              <div
                key={group.user._id}
                onClick={() => openStory(index)}
                className='flex flex-col items-center gap-1 cursor-pointer flex-shrink-0'
              >
                <div className={`w-16 h-16 rounded-full p-[2px] ${
                  group.hasUnviewed
                    ? 'bg-gradient-to-tr from-orange-500 to-red-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}>
                  <div className='w-full h-full rounded-full bg-white dark:bg-gray-900 p-[2px]'>
                    <div className='w-full h-full rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center'>
                      {group.user.profilePicture ? (
                        <img src={group.user.profilePicture} alt={group.user.username} className='w-full h-full object-cover' />
                      ) : (
                        <User size={20} className='text-gray-400' />
                      )}
                    </div>
                  </div>
                </div>
                <span className='text-xs text-gray-600 dark:text-gray-300 max-w-[64px] truncate'>{group.user.username}</span>
              </div>
            )
          }

          if (group.user._id === user?._id) return null

          return (
            <div
              key={group.user._id}
              onClick={() => openStory(index)}
              className='flex flex-col items-center gap-1 cursor-pointer flex-shrink-0'
            >
              <div className={`w-16 h-16 rounded-full p-[2px] ${
                group.hasUnviewed
                  ? 'bg-gradient-to-tr from-orange-500 to-red-500'
                  : 'bg-gray-600'
              }`}>
                <div className='w-full h-full rounded-full bg-gray-900 p-[2px]'>
                  <div className='w-full h-full rounded-full overflow-hidden bg-gray-700 flex items-center justify-center'>
                    {group.user.profilePicture ? (
                      <img src={group.user.profilePicture} alt={group.user.username} className='w-full h-full object-cover' />
                    ) : (
                      <User size={20} className='text-gray-400' />
                    )}
                  </div>
                </div>
              </div>
              <span className='text-xs text-gray-300 max-w-[64px] truncate'>{group.user.username}</span>
            </div>
          )
        })}
      </div>

      {createOpen && <CreateStory open={createOpen} setOpen={setCreateOpen} onCreated={fetchStories} />}
      {viewerOpen && (
        <StoryViewer
          feed={storyFeed}
          initialGroupIndex={selectedGroupIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  )
}

export default Stories
