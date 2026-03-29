import React, { useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { User, Loader2, ChevronDown, Lock, Trash2, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { setAuthUser, setToken } from '@/redux/authSlice'
import { RootState } from '@/redux/store'
import API from '@/lib/api'

interface EditProfileInput {
  profilePhoto: File | string | undefined
  bio: string
  gender: string
}

const EditProfile: React.FC = () => {
  const imageRef = useRef<HTMLInputElement>(null)
  const { user } = useSelector((store: RootState) => store.auth)
  const [loading, setLoading] = useState<boolean>(false)
  const [input, setInput] = useState<EditProfileInput>({
    profilePhoto: user?.profilePicture,
    bio: user?.bio || '',
    gender: user?.gender || 'male'
  })
  const [isGenderOpen, setIsGenderOpen] = useState<boolean>(false)
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const fileChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setInput({ ...input, profilePhoto: file })
  }

  const selectChangeHandler = (value: string) => {
    setInput({ ...input, gender: value })
    setIsGenderOpen(false)
  }

  const editProfileHandler = async () => {
    const formData = new FormData()
    formData.append('bio', input.bio)
    formData.append('gender', input.gender)
    if (input.profilePhoto && input.profilePhoto instanceof File) {
      formData.append('profilePhoto', input.profilePhoto)
    }
    try {
      setLoading(true)
      const res = await API.post('/users/profile/edit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
      })
      if (res.data.success && user) {
        const updatedUserData = {
          ...user,
          bio: res.data.user?.bio,
          profilePicture: res.data.user?.profilePicture,
          gender: res.data.user.gender
        }
        dispatch(setAuthUser(updatedUserData))
        navigate(`/profile/${user?._id}`)
        toast.success(res.data.message)
      }
    } catch (error: any) {
      console.log(error)
      toast.error(error.response?.data?.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const changePasswordHandler = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error('Please fill in all password fields'); return
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters'); return
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match'); return
    }
    try {
      setPasswordLoading(true)
      const res = await API.post('/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })
      if (res.data.success) {
        toast.success(res.data.message)
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password')
    } finally {
      setPasswordLoading(false)
    }
  }

  const deleteAccountHandler = async () => {
    if (!deletePassword) { toast.error('Please enter your password'); return }
    try {
      setDeleteLoading(true)
      const res = await API.delete('/users/delete-account', { data: { password: deletePassword } })
      if (res.data.success) {
        toast.success(res.data.message)
        dispatch(setToken(null))
        dispatch(setAuthUser(null))
        navigate('/login')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete account')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className='max-w-2xl mx-auto px-4 py-4 md:py-0'>
      <section className='flex flex-col gap-6 w-full my-8'>
        <h1 className='font-bold text-xl'>Edit Profile</h1>
        <div className='flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-xl p-4'>
          <div className='flex items-center gap-3'>
            <div className="relative">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="profile"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </div>
              )}
            </div>
            <div>
              <h1 className='font-bold text-sm'>{user?.username}</h1>
              <span className='text-gray-600 dark:text-gray-300'>{user?.bio || 'Bio here...'}</span>
            </div>
          </div>
          <input
            ref={imageRef}
            onChange={fileChangeHandler}
            type='file'
            className='hidden'
            accept='image/*'
          />
          <button
            onClick={() => imageRef?.current?.click()}
            className='bg-[#0095F6] text-white px-4 py-2 rounded-md h-8 hover:bg-[#318bc7] text-sm font-medium'
          >
            Change photo
          </button>
        </div>
        <div>
          <h1 className='font-bold text-xl mb-2'>Bio</h1>
          <textarea
            value={input.bio}
            onChange={(e) => setInput({ ...input, bio: e.target.value })}
            name='bio'
            className="w-full min-h-[100px] p-3 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:bg-gray-800 dark:text-gray-100"
            placeholder="Tell us about yourself..."
          />
        </div>
        <div>
          <h1 className='font-bold mb-2'>Gender</h1>
          <div className="relative">
            <button
              onClick={() => setIsGenderOpen(!isGenderOpen)}
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 dark:text-gray-100 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className="capitalize">{input.gender}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isGenderOpen ? 'rotate-180' : ''}`} />
            </button>
            {isGenderOpen && (
              <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md mt-1 shadow-lg z-10">
                <button
                  onClick={() => selectChangeHandler('male')}
                  className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700 dark:text-gray-100"
                >
                  Male
                </button>
                <button
                  onClick={() => selectChangeHandler('female')}
                  className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700 dark:text-gray-100"
                >
                  Female
                </button>
              </div>
            )}
          </div>
        </div>
        <div className='flex justify-end'>
          {loading ? (
            <button
              disabled
              className='w-fit bg-[#0095F6] text-white px-6 py-2 rounded-md hover:bg-[#2a8ccd] flex items-center gap-2'
            >
              <Loader2 className='h-4 w-4 animate-spin' />
              Please wait
            </button>
          ) : (
            <button
              onClick={editProfileHandler}
              className='w-fit bg-[#0095F6] text-white px-6 py-2 rounded-md hover:bg-[#2a8ccd]'
            >
              Submit
            </button>
          )}
        </div>

        {/* ─── Change Password ─── */}
        <div className='border-t pt-6 mt-4'>
          <h1 className='font-bold text-xl mb-4 flex items-center gap-2'>
            <Lock className='w-5 h-5' /> Change Password
          </h1>
          <div className='flex flex-col gap-3'>
            <div className='relative'>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder='Current password'
                className='w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100'
              />
              <button type='button' onClick={() => setShowPasswords(!showPasswords)} className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400'>
                {showPasswords ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
              </button>
            </div>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              placeholder='New password (min 6 characters)'
              className='w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100'
            />
            <input
              type={showPasswords ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              placeholder='Confirm new password'
              className='w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100'
            />
            <div className='flex justify-end'>
              <button
                onClick={changePasswordHandler}
                disabled={passwordLoading}
                className='w-fit bg-[#0095F6] text-white px-6 py-2 rounded-md hover:bg-[#2a8ccd] flex items-center gap-2 disabled:opacity-50'
              >
                {passwordLoading && <Loader2 className='h-4 w-4 animate-spin' />}
                {passwordLoading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>

        {/* ─── Danger Zone: Delete Account ─── */}
        <div className='border-t border-red-200 pt-6 mt-4 mb-8'>
          <h1 className='font-bold text-xl mb-2 flex items-center gap-2 text-red-600'>
            <AlertTriangle className='w-5 h-5' /> Danger Zone
          </h1>
          <p className='text-sm text-gray-500 dark:text-gray-400 mb-4'>
            Permanently delete your account and all associated data (posts, comments, messages, stories, likes, followers). This action cannot be undone.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className='flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 font-medium text-sm'
            >
              <Trash2 className='w-4 h-4' /> Delete My Account
            </button>
          ) : (
            <div className='bg-red-50 border border-red-200 rounded-lg p-4 flex flex-col gap-3'>
              <p className='text-sm font-medium text-red-700'>
                Enter your password to confirm account deletion:
              </p>
              <input
                type='password'
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder='Your password'
                className='w-full p-3 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-gray-100'
              />
              <div className='flex gap-2 justify-end'>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeletePassword('') }}
                  className='px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                >
                  Cancel
                </button>
                <button
                  onClick={deleteAccountHandler}
                  disabled={deleteLoading}
                  className='flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium disabled:opacity-50'
                >
                  {deleteLoading && <Loader2 className='h-4 w-4 animate-spin' />}
                  {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default EditProfile
