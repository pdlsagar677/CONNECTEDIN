import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AtSign, Heart, MessageCircle, Edit, Archive, Megaphone, Mail, MapPin, Calendar, Check, UserPlus } from 'lucide-react';
import useGetUserProfile from '../hooks/useGetUserProfile';
import { RootState } from '../redux/store';
import { setAuthUser, setUserProfile } from '../redux/authSlice';
import { toast } from 'sonner';
import API from '../lib/api';
import FollowersFollowingModal from './FollowersFollowingModal';
import type { Post } from '../types';

const Profile: React.FC = () => {
  const params = useParams<{ id: string }>();
  const userId = params.id;

  useGetUserProfile(userId);

  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [followModal, setFollowModal] = useState<{ open: boolean; type: 'followers' | 'following' }>({ open: false, type: 'followers' });

  const { userProfile, user } = useSelector((store: RootState) => store.auth);
  const dispatch = useDispatch();

  const isLoggedInUserProfile = user?._id === userProfile?._id;
  const isFollowing = user && userProfile ? userProfile.followers?.includes(user._id) : false;

  const handleTabChange = (tab: 'posts' | 'saved') => {
    setActiveTab(tab);
  };

  const displayedPost: Post[] = activeTab === 'posts'
    ? (userProfile?.posts || [])
    : (userProfile?.bookmarks || []);

  const followUnfollowHandler = async () => {
    if (!userProfile?._id) return;
    try {
      const res = await API.post(`/users/followorunfollow/${userProfile._id}`);
      if (res.data.success) {
        const updatedFollowers = isFollowing
          ? userProfile.followers.filter((id: string) => id !== user?._id)
          : [...userProfile.followers, user?._id || ''];

        dispatch(setUserProfile({ ...userProfile, followers: updatedFollowers }));

        if (user) {
          const updatedFollowing = isFollowing
            ? user.following.filter((id: string) => id !== userProfile._id)
            : [...user.following, userProfile._id];
          dispatch(setAuthUser({ ...user, following: updatedFollowing }));
        }

        toast.success(res.data.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900'>
      <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 md:pt-8'>
        {/* Profile Header */}
        <div className='bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-800 p-6 md:p-8 mb-6'>
          <div className='flex flex-col md:flex-row gap-8 items-center md:items-start'>
            {/* Profile Image */}
            <div className='relative'>
              <div className='relative'>
                <div className='w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden ring-4 ring-blue-500/20 shadow-lg'>
                  <img
                    src={userProfile?.profilePicture || '/default-profile.png'}
                    alt='profile'
                    className='w-full h-full object-cover'
                  />
                </div>
                
              </div>
            </div>

            {/* Profile Info */}
            <div className='flex-1 text-center md:text-left'>
              <div className='flex flex-col md:flex-row md:items-center gap-4 mb-4'>
                <h2 className='text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100'>
                  {userProfile?.username || 'Loading...'}
                </h2>
                
                {userProfile && (
                  <div className='flex flex-wrap gap-2 justify-center md:justify-start'>
                    {isLoggedInUserProfile ? (
                      <>
                        <Link to='/account/edit'>
                          <button className='flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-medium transition-colors'>
                            <Edit size={16} /> Edit Profile
                          </button>
                        </Link>
                        <button className='flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-950 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium transition-colors'>
                          <Archive size={16} /> Archive
                        </button>
                      </>
                    ) : (
                      <div className='flex gap-2'>
                        <button
                          onClick={followUnfollowHandler}
                          className={`flex items-center gap-2 px-5 py-2 rounded-xl font-semibold transition-all duration-200 ${
                            isFollowing 
                              ? 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
                              : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-md hover:shadow-lg'
                          }`}
                        >
                          {isFollowing ? (
                            <>
                              <Check size={18} /> Following
                            </>
                          ) : (
                            <>
                              <UserPlus size={18} /> Follow
                            </>
                          )}
                        </button>
                        <Link to='/chat'>
                          <button className='flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium transition-colors'>
                            <Mail size={16} /> Message
                          </button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className='flex justify-center md:justify-start gap-6 mb-4'>
                <div className='text-center'>
                  <p className='text-xl font-bold text-gray-800 dark:text-gray-100'>{userProfile?.posts?.length || 0}</p>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>Posts</p>
                </div>
                <div 
                  className='text-center cursor-pointer hover:opacity-75 transition-opacity'
                  onClick={() => setFollowModal({ open: true, type: 'followers' })}
                >
                  <p className='text-xl font-bold text-gray-800 dark:text-gray-100'>{userProfile?.followers?.length || 0}</p>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>Followers</p>
                </div>
                <div 
                  className='text-center cursor-pointer hover:opacity-75 transition-opacity'
                  onClick={() => setFollowModal({ open: true, type: 'following' })}
                >
                  <p className='text-xl font-bold text-gray-800 dark:text-gray-100'>{userProfile?.following?.length || 0}</p>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>Following</p>
                </div>
              </div>

              {/* Bio */}
              <div className='space-y-2'>
                {userProfile?.bio && (
                  <p className='text-gray-700 dark:text-gray-200 text-sm'>{userProfile.bio}</p>
                )}
                <div className='flex items-center justify-center md:justify-start gap-2 text-gray-500 dark:text-gray-400 text-sm'>
                  <AtSign size={14} />
                  <span>{userProfile?.username || ''}</span>
                </div>
               
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className='bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-800'>
          <div className='border-b border-gray-100 dark:border-gray-800'>
            <div className='flex overflow-x-auto scrollbar-hide'>
              <button
                className={`flex-1 py-4 text-sm font-semibold transition-colors relative whitespace-nowrap ${
                  activeTab === 'posts' 
                    ? 'text-blue-600'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
                onClick={() => handleTabChange('posts')}
              >
                POSTS
                {activeTab === 'posts' && (
                  <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full' />
                )}
              </button>
              <button
                className={`flex-1 py-4 text-sm font-semibold transition-colors relative whitespace-nowrap ${
                  activeTab === 'saved' 
                    ? 'text-blue-600'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
                onClick={() => handleTabChange('saved')}
              >
                SAVED
                {activeTab === 'saved' && (
                  <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full' />
                )}
              </button>
            </div>
          </div>

          {/* Posts Grid */}
          <div className='p-4'>
            {displayedPost.length > 0 ? (
              <div className='grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4'>
                {displayedPost.map((post) => (
                  <div 
                    key={post._id} 
                    className='relative group cursor-pointer aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800'
                  >
                    <img
                      src={post.image}
                      alt='post'
                      className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                      loading='lazy'
                    />
                    <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 text-white transition-all duration-300'>
                      <div className='flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full'>
                        <Heart size={16} className='fill-current' />
                        <span className='text-sm font-medium'>{post.likes?.length || 0}</span>
                      </div>
                      <div className='flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full'>
                        <MessageCircle size={16} />
                        <span className='text-sm font-medium'>{post.comments?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-16'>
                <div className='w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center'>
                  {activeTab === 'posts' ? (
                    <Heart className='w-8 h-8 text-gray-400 dark:text-gray-500' />
                  ) : (
                    <Archive className='w-8 h-8 text-gray-400 dark:text-gray-500' />
                  )}
                </div>
                <p className='text-gray-500 dark:text-gray-400 font-medium'>
                  {userProfile 
                    ? `No ${activeTab === 'posts' ? 'posts' : 'saved items'} yet` 
                    : 'Loading profile...'
                  }
                </p>
                {activeTab === 'posts' && isLoggedInUserProfile && (
                  <p className='text-sm text-gray-400 dark:text-gray-500 mt-1'>
                    Share your first post to get started!
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {userProfile && (
        <FollowersFollowingModal
          open={followModal.open}
          setOpen={(open) => setFollowModal({ ...followModal, open })}
          userId={userProfile._id}
          type={followModal.type}
        />
      )}
    </div>
  );
};

export default Profile;