import React, { useEffect, useState } from 'react'
import { X, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import { setAuthUser } from '@/redux/authSlice'
import { toast } from 'sonner'
import API from '@/lib/api'
import type { User as UserType } from '@/types'

interface FollowersFollowingModalProps {
  open: boolean
  setOpen: (open: boolean) => void
  userId: string
  type: 'followers' | 'following'
}

const FollowersFollowingModal: React.FC<FollowersFollowingModalProps> = ({ open, setOpen, userId, type }) => {
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const currentUser = useSelector((store: RootState) => store.auth.user)
  const dispatch = useDispatch()

  useEffect(() => {
    if (open && userId) {
      fetchUsers()
    }
  }, [open, userId, type])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await API.get(`/users/${userId}/${type}`)
      if (res.data.success) {
        setUsers(res.data.users)
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  const followUnfollowHandler = async (targetUserId: string) => {
    try {
      const res = await API.post(`/users/followorunfollow/${targetUserId}`)
      if (res.data.success) {
        if (currentUser) {
          const isFollowing = currentUser.following?.includes(targetUserId)
          const updatedFollowing = isFollowing
            ? currentUser.following.filter(id => id !== targetUserId)
            : [...currentUser.following, targetUserId]
          dispatch(setAuthUser({ ...currentUser, following: updatedFollowing }))
        }
        toast.success(res.data.message)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong')
    }
  }

  if (!open) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60'>
      <div className='bg-white dark:bg-gray-900 rounded-xl w-full max-w-md max-h-[70vh] flex flex-col shadow-lg dark:shadow-gray-900/30'>
        <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700'>
          <h2 className='font-bold text-lg capitalize text-gray-800 dark:text-gray-100'>{type}</h2>
          <X className='w-5 h-5 cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300' onClick={() => setOpen(false)} />
        </div>

        <div className='flex-1 overflow-y-auto'>
          {loading ? (
            <div className='p-4 text-center text-gray-400 dark:text-gray-500'>Loading...</div>
          ) : users.length === 0 ? (
            <div className='p-4 text-center text-gray-400 dark:text-gray-500'>
              No {type} yet
            </div>
          ) : (
            users.map((user) => {
              const isFollowing = currentUser?.following?.includes(user._id)
              const isCurrentUser = currentUser?._id === user._id
              return (
                <div key={user._id} className='flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800'>
                  <Link
                    to={`/profile/${user._id}`}
                    onClick={() => setOpen(false)}
                    className='flex items-center gap-3'
                  >
                    <div className='w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center'>
                      {user.profilePicture ? (
                        <img src={user.profilePicture} alt={user.username} className='w-full h-full object-cover' />
                      ) : (
                        <User className='w-5 h-5 text-gray-400 dark:text-gray-500' />
                      )}
                    </div>
                    <div>
                      <p className='font-semibold text-sm text-gray-800 dark:text-gray-100'>{user.username}</p>
                      <p className='text-gray-400 dark:text-gray-500 text-xs'>{user.bio || ''}</p>
                    </div>
                  </Link>
                  {!isCurrentUser && (
                    <button
                      onClick={() => followUnfollowHandler(user._id)}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        isFollowing
                          ? 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default FollowersFollowingModal
