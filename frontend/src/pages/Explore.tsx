import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Heart, MessageCircle, TrendingUp, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { setSelectedPost } from '@/redux/postSlice'
import { RootState } from '@/redux/store'
import CommentDialog from '@/components/CommentDialog'
import API from '@/lib/api'
import type { Post } from '@/types'

const Explore: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'trending' | 'recent' | 'popular'>('trending')
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const dispatch = useDispatch()

  const fetchPosts = async (pageNum: number, filter: string = activeFilter, append: boolean = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      
      const res = await API.get(`/post/explore?page=${pageNum}&filter=${filter}`)
      if (res.data.success) {
        if (append) {
          setPosts(prev => [...prev, ...res.data.posts])
        } else {
          setPosts(res.data.posts)
        }
        setHasMore(res.data.hasMore)
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchPosts(1, activeFilter, false)
    setPage(1)
  }, [activeFilter])

  // Infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          const nextPage = page + 1
          setPage(nextPage)
          fetchPosts(nextPage, activeFilter, true)
        }
      },
      { threshold: 0.1 }
    )
    
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }
    
    return () => observerRef.current?.disconnect()
  }, [hasMore, loading, loadingMore, page, activeFilter])

  const openPost = (post: Post) => {
    dispatch(setSelectedPost(post))
    setDialogOpen(true)
  }

  const filters = [
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'recent', label: 'Recent', icon: Sparkles },
    { id: 'popular', label: 'Popular', icon: Heart }
  ]

  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 pt-20 md:pt-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1 className='text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent mb-2'>
            Explore
          </h1>
          <p className='text-gray-500 dark:text-gray-400 text-sm'>
            Discover amazing content from the community
          </p>
        </div>

        {/* Filters */}
        <div className='flex justify-center gap-2 mb-8'>
          {filters.map((filter) => {
            const Icon = filter.icon
            const isActive = activeFilter === filter.id
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
                <span className='text-sm'>{filter.label}</span>
              </button>
            )
          })}
        </div>

        {/* Loading State */}
        {loading && posts.length === 0 ? (
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4'>
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className='relative group cursor-pointer'>
                <div className='aspect-square bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl' />
                <div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl' />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Posts Grid */}
            {posts.length > 0 ? (
              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4'>
                {posts.map((post, index) => (
                  <div
                    key={post._id}
                    onClick={() => openPost(post)}
                    className='relative group cursor-pointer animate-fadeInUp'
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className='relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm hover:shadow-xl transition-all duration-300'>
                      <img
                        src={post.image}
                        alt='post'
                        className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500'
                        loading='lazy'
                      />
                      
                      {/* Overlay */}
                      <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                        <div className='absolute bottom-0 left-0 right-0 p-3'>
                          <div className='flex items-center justify-between text-white'>
                            <div className='flex items-center gap-1'>
                              <Heart size={16} className='fill-white' />
                              <span className='text-sm font-medium'>{post.likes?.length || 0}</span>
                            </div>
                            <div className='flex items-center gap-1'>
                              <MessageCircle size={16} />
                              <span className='text-sm font-medium'>{post.comments?.length || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className='flex flex-col items-center justify-center py-20'>
                <div className='w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4'>
                  <ImageIcon className='w-12 h-12 text-gray-400 dark:text-gray-500' />
                </div>
                <h3 className='text-gray-700 dark:text-gray-200 font-semibold text-lg mb-1'>No posts yet</h3>
                <p className='text-gray-400 dark:text-gray-500 text-sm'>Be the first to share something amazing!</p>
              </div>
            )}

            {/* Load More Trigger */}
            {hasMore && posts.length > 0 && (
              <div ref={loadMoreRef} className='flex justify-center mt-8 py-4'>
                {loadingMore && (
                  <div className='flex items-center gap-2 text-gray-500 dark:text-gray-400'>
                    <Loader2 className='w-5 h-5 animate-spin' />
                    <span className='text-sm'>Loading more...</span>
                  </div>
                )}
              </div>
            )}

            {/* End of Content */}
            {!hasMore && posts.length > 0 && (
              <div className='text-center mt-8 py-6'>
                <div className='inline-flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm'>
                  <Sparkles className='w-4 h-4' />
                  <span>You've reached the end</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <CommentDialog open={dialogOpen} setOpen={setDialogOpen} />
    </div>
  )
}

// Add this to your global CSS or tailwind config
const styles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fadeInUp {
    animation: fadeInUp 0.4s ease-out forwards;
  }
`

// Add styles to head (you can add this to your main CSS file instead)
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style")
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}

export default Explore