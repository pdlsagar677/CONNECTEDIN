import React, { useEffect, useState } from 'react'
import { Bookmark, Heart, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import API from '@/lib/api'
import type { Post } from '@/types'

const SavedPosts: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const res = await API.get('/post/bookmarks')
        if (res.data.success) {
          setPosts(res.data.posts)
        }
      } catch (error) {
        console.error(error)
      }
      setLoading(false)
    }
    fetchBookmarks()
  }, [])

  if (loading) {
    return (
      <div className='flex justify-center items-center h-[60vh]'>
        <div className='animate-spin w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full' />
      </div>
    )
  }

  return (
    <div className='py-6 md:py-8 px-4'>
      <div className='max-w-4xl mx-auto'>
        <div className='flex items-center gap-3 mb-6 md:mb-8'>
          <Bookmark className='w-6 h-6' />
          <h1 className='text-xl md:text-2xl font-bold'>Saved Posts</h1>
        </div>

        {posts.length === 0 ? (
          <div className='text-center py-20'>
            <Bookmark className='w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4' />
            <h2 className='text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2'>No saved posts yet</h2>
            <p className='text-gray-500 dark:text-gray-400'>Posts you save will appear here.</p>
          </div>
        ) : (
          <div className='grid grid-cols-2 sm:grid-cols-3 gap-1'>
            {posts.map((post) => (
              <Link
                key={post._id}
                to={`/profile/${post.author._id}`}
                className='relative aspect-square group'
              >
                <img
                  src={post.image}
                  alt={post.caption}
                  className='w-full h-full object-cover'
                  loading='lazy'
                />
                <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 sm:gap-6'>
                  <span className='text-white font-semibold flex items-center gap-1 text-sm sm:text-base'>
                    <Heart className='w-4 h-4 sm:w-5 sm:h-5 fill-white' /> {post.likes.length}
                  </span>
                  <span className='text-white font-semibold flex items-center gap-1 text-sm sm:text-base'>
                    <MessageCircle className='w-4 h-4 sm:w-5 sm:h-5 fill-white' /> {post.comments.length}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SavedPosts
