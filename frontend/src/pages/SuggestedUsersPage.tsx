import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { User, UserPlus, UserCheck, Sparkles } from 'lucide-react'
import { RootState } from '@/redux/store'
import { setAuthUser, setSuggestedUsers } from '@/redux/authSlice'
import { toast } from 'sonner'
import API from '@/lib/api'
import useGetSuggestedUsers from '@/hooks/useGetSuggestedUsers'

const SuggestedUsersPage: React.FC = () => {
  useGetSuggestedUsers()
  const { suggestedUsers, user } = useSelector((store: RootState) => store.auth)
  const dispatch = useDispatch()

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
          const updatedSuggested = filteredSuggestedUsers.filter((u) => u._id !== targetUserId)
          dispatch(setSuggestedUsers(updatedSuggested))
        }
        toast.success(res.data.message)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong')
    }
  }

  return (
    <div className='max-w-lg mx-auto px-4 py-6'>
      <div className='flex items-center gap-2 mb-6'>
        <Sparkles className='w-5 h-5 text-blue-600' />
        <h1 className='text-xl font-bold text-gray-800 dark:text-gray-100'>Suggested for you</h1>
      </div>

      {filteredSuggestedUsers.length === 0 ? (
        <div className='text-center py-16'>
          <UserPlus className='w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4' />
          <p className='text-gray-500 dark:text-gray-400'>No suggestions right now. Check back later!</p>
        </div>
      ) : (
        <div className='space-y-3'>
          {filteredSuggestedUsers.map((suggestedUser) => {
            const isFollowing = user?.following?.includes(suggestedUser._id)
            return (
              <div
                key={suggestedUser._id}
                className='flex items-center justify-between bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800'
              >
                <Link
                  to={`/profile/${suggestedUser._id}`}
                  className='flex items-center gap-3 flex-1 min-w-0'
                >
                  <div className='w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0'>
                    {suggestedUser.profilePicture ? (
                      <img src={suggestedUser.profilePicture} alt={suggestedUser.username} className='w-full h-full object-cover' />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center'>
                        <User className='w-6 h-6 text-gray-400 dark:text-gray-500' />
                      </div>
                    )}
                  </div>
                  <div className='min-w-0'>
                    <p className='font-semibold text-sm text-gray-800 dark:text-gray-100 truncate'>{suggestedUser.username}</p>
                    <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>{suggestedUser.bio || 'No bio yet'}</p>
                  </div>
                </Link>

                <button
                  onClick={() => followHandler(suggestedUser._id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ml-2 ${
                    isFollowing
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {isFollowing ? (
                    <><UserCheck className='w-3.5 h-3.5' /> Following</>
                  ) : (
                    <><UserPlus className='w-3.5 h-3.5' /> Follow</>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SuggestedUsersPage
