import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { Users, X, User, UserPlus, UserCheck } from 'lucide-react';
import { RootState } from '../redux/store';
import { setAuthUser, setSuggestedUsers } from '../redux/authSlice';
import { toast } from 'sonner';
import API from '../lib/api';

const FloatingSuggested: React.FC = () => {
  const [open, setOpen] = useState(false);

  const { suggestedUsers, user } = useSelector((store: RootState) => store.auth);
  const location = useLocation();
  const dispatch = useDispatch();

  const filteredUsers = suggestedUsers?.filter(
    (s) =>
      String(s._id) !== String(user?._id) &&
      !user?.following?.some((id) => String(id) === String(s._id))
  ) || [];

  const followHandler = async (targetUserId: string) => {
    try {
      const res = await API.post(`/users/followorunfollow/${targetUserId}`);
      if (res.data.success && user) {
        const isFollowing = user.following?.includes(targetUserId);
        const updatedFollowing = isFollowing
          ? user.following.filter((id) => id !== targetUserId)
          : [...user.following, targetUserId];
        dispatch(setAuthUser({ ...user, following: updatedFollowing }));
        dispatch(setSuggestedUsers(filteredUsers.filter((u) => u._id !== targetUserId)));
        toast.success(res.data.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    }
  };

  // Hide on suggested page and on mobile
  if (location.pathname === '/suggested') return null;
  if (filteredUsers.length === 0) return null;

  return (
    <div className='hidden md:block fixed bottom-6 left-72 z-40'>
      {/* Panel */}
      {open && (
        <div className='w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-3 animate-[slideUp_0.2s_ease-out]'>
          {/* Header */}
          <div className='px-4 py-3 border-b dark:border-gray-700 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Users size={16} className='text-blue-600' />
              <h3 className='font-semibold text-gray-800 dark:text-gray-100 text-sm'>Suggested for you</h3>
            </div>
            <button onClick={() => setOpen(false)} className='text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'>
              <X size={18} />
            </button>
          </div>

          {/* User List */}
          <div className='max-h-80 overflow-y-auto'>
            {filteredUsers.slice(0, 10).map((suggestedUser) => {
              const isFollowing = user?.following?.includes(suggestedUser._id);
              return (
                <div
                  key={suggestedUser._id}
                  className='flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'
                >
                  <Link
                    to={`/profile/${suggestedUser._id}`}
                    onClick={() => setOpen(false)}
                    className='flex items-center gap-3 flex-1 min-w-0'
                  >
                    <div className='w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0'>
                      {suggestedUser.profilePicture ? (
                        <img src={suggestedUser.profilePicture} alt='' className='w-full h-full object-cover' />
                      ) : (
                        <div className='w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500'>
                          <User size={18} />
                        </div>
                      )}
                    </div>
                    <div className='min-w-0'>
                      <p className='text-sm font-semibold text-gray-800 dark:text-gray-100 truncate'>{suggestedUser.username}</p>
                      <p className='text-xs text-gray-400 dark:text-gray-500 truncate'>{suggestedUser.bio || 'New to SNAP_GRAM'}</p>
                    </div>
                  </Link>

                  <button
                    onClick={() => followHandler(suggestedUser._id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ml-2 ${
                      isFollowing
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isFollowing ? <UserCheck size={12} /> : <UserPlus size={12} />}
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* See all link */}
          <Link
            to='/suggested'
            onClick={() => setOpen(false)}
            className='block text-center py-2.5 border-t dark:border-gray-700 text-xs font-semibold text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'
          >
            See all suggestions
          </Link>
        </div>
      )}

      {/* Floating Bubble */}
      <button
        onClick={() => setOpen(!open)}
        className='w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 relative'
      >
        {open ? <X size={20} /> : <Users size={20} />}
        {!open && filteredUsers.length > 0 && (
          <span className='absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1'>
            {filteredUsers.length > 9 ? '9+' : filteredUsers.length}
          </span>
        )}
      </button>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default FloatingSuggested;
