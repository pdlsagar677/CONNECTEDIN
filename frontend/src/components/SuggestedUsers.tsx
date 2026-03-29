import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { User, UserPlus, UserCheck, Sparkles, ChevronRight } from 'lucide-react'
import { RootState } from '@/redux/store'
import { setAuthUser, setSuggestedUsers } from '@/redux/authSlice'
import { toast } from 'sonner'
import API from '@/lib/api'

const SuggestedUsers: React.FC = () => {
  const { suggestedUsers, user } = useSelector((store: RootState) => store.auth)
  const dispatch = useDispatch()

  // Filter out the logged-in user and already followed users from suggested users
  const filteredSuggestedUsers = suggestedUsers?.filter(
    (suggestedUser) =>
      String(suggestedUser._id) !== String(user?._id) &&
      !user?.following?.some((id) => String(id) === String(suggestedUser._id))
  ) || []

  const followHandler = async (targetUserId: string) => {
    try {
      const res = await API.post(`/users/followorunfollow/${targetUserId}`)
      if (res.data.success) {
        if (user) {
          const isCurrentlyFollowing = user.following?.includes(targetUserId)
          const updatedFollowing = isCurrentlyFollowing
            ? user.following.filter((id) => id !== targetUserId)
            : [...user.following, targetUserId]
          dispatch(setAuthUser({ ...user, following: updatedFollowing }))
          
          // Update suggested users list by removing the followed user
          const updatedSuggested = filteredSuggestedUsers.filter(
            (u) => u._id !== targetUserId
          )
          dispatch(setSuggestedUsers(updatedSuggested))
        }
        toast.success(res.data.message)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong')
    }
  }

  const handleSeeAll = () => {
    // Navigate to explore page or open modal
    window.location.href = '/explore'
  }

  if (filteredSuggestedUsers.length === 0) {
    return null
  }

  return (
    <div className='bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-800 p-5'>
      {/* Header */}
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-2'>
          <div className='w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center'>
            <Sparkles className='w-4 h-4 text-blue-600' />
          </div>
          <h1 className='font-semibold text-gray-800 dark:text-gray-100 text-base'>Suggested for you</h1>
        </div>
        {filteredSuggestedUsers.length > 0 && (
          <button
            onClick={handleSeeAll}
            className='text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors'
          >
            See All
            <ChevronRight className='w-3 h-3' />
          </button>
        )}
      </div>

      {/* Suggested Users List */}
      <div className='space-y-4'>
        {filteredSuggestedUsers.slice(0, 5).map((suggestedUser) => {
          const isFollowing = user?.following?.includes(suggestedUser._id)
          return (
            <div
              key={suggestedUser._id}
              className='flex items-center justify-between group animate-fadeInUp'
            >
              <Link
                to={`/profile/${suggestedUser?._id}`}
                className='flex items-center gap-3 flex-1 min-w-0'
              >
                {/* Avatar */}
                <div className='relative flex-shrink-0'>
                  <div className='w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 ring-2 ring-blue-500/20 group-hover:ring-blue-500/40 transition-all'>
                    {suggestedUser?.profilePicture ? (
                      <img
                        src={suggestedUser.profilePicture}
                        alt={suggestedUser.username}
                        className='w-full h-full object-cover'
                      />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center'>
                        <User className='w-6 h-6 text-gray-400 dark:text-gray-500' />
                      </div>
                    )}
                  </div>
                  {/* Online indicator */}
                  {suggestedUser && (
                    <div className='absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-900' />
                  )}
                </div>

                {/* User Info */}
                <div className='flex-1 min-w-0'>
                  <p className='font-semibold text-gray-800 dark:text-gray-100 text-sm hover:text-blue-600 transition-colors truncate'>
                    {suggestedUser?.username}
                  </p>
                  <p className='text-gray-500 dark:text-gray-400 text-xs truncate'>
                    {suggestedUser?.bio || 'No bio yet'}
                  </p>
                  {suggestedUser?.followers && (
                    <p className='text-gray-400 dark:text-gray-500 text-xs mt-0.5'>
                      {suggestedUser.followers.length} followers
                    </p>
                  )}
                </div>
              </Link>

              {/* Follow/Unfollow Button */}
              <button
                onClick={() => followHandler(suggestedUser._id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  isFollowing
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                    : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 shadow-sm hover:shadow'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className='w-3 h-3' />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className='w-3 h-3' />
                    Follow
                  </>
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Footer Note */}
      {filteredSuggestedUsers.length > 3 && (
        <div className='mt-4 pt-3 border-t border-gray-100 dark:border-gray-800'>
          <p className='text-xs text-gray-400 dark:text-gray-500 text-center flex items-center justify-center gap-1'>
            <Sparkles className='w-3 h-3' />
            Discover more people to connect with
          </p>
        </div>
      )}
    </div>
  )
}

// Add animation styles (add this to your global CSS)
const styles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fadeInUp {
    animation: fadeInUp 0.3s ease-out forwards;
  }
`

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style")
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}

export default SuggestedUsers