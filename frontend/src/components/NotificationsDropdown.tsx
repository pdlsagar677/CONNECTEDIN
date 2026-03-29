import React, { useEffect } from 'react'
import { X, User, Heart, MessageCircle, UserPlus, CheckCheck, Clock, Bell, Sparkles } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { RootState } from '@/redux/store'
import { setNotifications, setUnreadCount, markAllRead, NotificationItem } from '@/redux/notificationSlice'
import API from '@/lib/api'

interface NotificationsDropdownProps {
  open: boolean
  setOpen: (open: boolean) => void
}

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ open, setOpen }) => {
  const dispatch = useDispatch()
  const { notifications, unreadCount } = useSelector((store: RootState) => store.notification)

  useEffect(() => {
    if (open) {
      fetchNotifications()
    }
  }, [open])

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications')
      if (res.data.success) {
        dispatch(setNotifications(res.data.notifications))
        const unread = res.data.notifications.filter((n: NotificationItem) => !n.read).length
        dispatch(setUnreadCount(unread))
      }
    } catch (error) {
      console.log(error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await API.put('/notifications/read-all')
      dispatch(markAllRead())
      dispatch(setUnreadCount(0))
    } catch (error) {
      console.log(error)
    }
  }

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d`
    if (days < 30) return `${Math.floor(days / 7)}w`
    return `${Math.floor(days / 30)}mo`
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': 
        return <Heart size={16} className='text-red-500 fill-red-500' />
      case 'comment': 
        return <MessageCircle size={16} className='text-blue-500' />
      case 'follow': 
        return <UserPlus size={16} className='text-green-500' />
      default: 
        return null
    }
  }

  const getMessage = (type: string, username: string) => {
    switch (type) {
      case 'like': 
        return `${username} liked your post`
      case 'comment': 
        return `${username} commented on your post`
      case 'follow': 
        return `${username} started following you`
      default: 
        return `${username} interacted with your content`
    }
  }

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className='fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fadeIn'
        onClick={() => setOpen(false)}
      />
      
      {/* Notifications Panel */}
      <div className='fixed right-0 top-0 bottom-0 z-50 w-full sm:w-96 bg-white dark:bg-gray-900 shadow-2xl flex flex-col animate-slideInRight'>
        {/* Header */}
        <div className='sticky top-0 bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Bell className='w-5 h-5 text-white' />
              <h2 className='text-lg font-bold text-white'>Notifications</h2>
              {unreadCount > 0 && (
                <span className='bg-white/20 text-white text-xs rounded-full px-2 py-0.5'>
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className='flex items-center gap-3'>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className='flex items-center gap-1 text-white/90 hover:text-white text-xs font-medium transition-colors'
                >
                  <CheckCheck className='w-3 h-3' />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className='p-1 rounded-full hover:bg-white/20 transition-colors'
              >
                <X className='w-5 h-5 text-white' />
              </button>
            </div>
          </div>
          <p className='text-white/80 text-xs mt-1'>Stay updated with what's happening</p>
        </div>

        {/* Notifications List */}
        <div className='flex-1 overflow-y-auto'>
          {notifications.length === 0 ? (
            <div className='flex flex-col items-center justify-center h-full p-8 text-center'>
              <div className='w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4'>
                <Bell className='w-10 h-10 text-gray-400 dark:text-gray-500' />
              </div>
              <h3 className='text-gray-700 dark:text-gray-200 font-semibold mb-1'>No notifications yet</h3>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                When someone interacts with your content, you'll see it here
              </p>
            </div>
          ) : (
            <div className='divide-y divide-gray-100 dark:divide-gray-800'>
              {notifications.map((notification: NotificationItem) => (
                <Link
                  key={notification._id}
                  to={
                    notification.type === 'follow' 
                      ? `/profile/${notification.sender._id}` 
                      : notification.post 
                        ? `/profile/${notification.sender._id}` 
                        : '#'
                  }
                  onClick={() => setOpen(false)}
                  className={`block p-4 transition-all duration-200 ${
                    !notification.read
                      ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className='flex gap-3'>
                    {/* Avatar */}
                    <div className='flex-shrink-0'>
                      <div className='w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ring-2 ring-offset-2 ring-blue-500/20'>
                        {notification.sender?.profilePicture ? (
                          <img
                            src={notification.sender.profilePicture}
                            alt={notification.sender.username}
                            className='w-full h-full object-cover'
                          />
                        ) : (
                          <User className='w-6 h-6 text-gray-400' />
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm text-gray-800 dark:text-gray-100'>
                        <span className='font-semibold hover:text-blue-600 transition-colors'>
                          {notification.sender?.username}
                        </span>{' '}
                        <span className='text-gray-600 dark:text-gray-300'>
                          {notification.type === 'like' && 'liked your post'}
                          {notification.type === 'comment' && 'commented on your post'}
                          {notification.type === 'follow' && 'started following you'}
                        </span>
                      </p>
                      
                      <div className='flex items-center gap-2 mt-1.5'>
                        <div className='flex items-center gap-1'>
                          {getIcon(notification.type)}
                          <div className='flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400'>
                            <Clock className='w-3 h-3' />
                            <span>{getTimeAgo(notification.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      
                    </div>

                    {/* Post Image */}
                    {notification.post?.image && (
                      <div className='flex-shrink-0'>
                        <div className='w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700'>
                          <img
                            src={notification.post.image}
                            alt=''
                            className='w-full h-full object-cover'
                          />
                        </div>
                      </div>
                    )}

                    {/* Unread Indicator */}
                    {!notification.read && (
                      <div className='flex-shrink-0'>
                        <div className='w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 animate-pulse' />
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className='sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-5 py-3'>
            <p className='text-xs text-gray-400 dark:text-gray-500 text-center flex items-center justify-center gap-1'>
              <Sparkles className='w-3 h-3' />
              Stay connected with your community
            </p>
          </div>
        )}
      </div>

      {/* Add animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </>
  )
}

export default NotificationsDropdown