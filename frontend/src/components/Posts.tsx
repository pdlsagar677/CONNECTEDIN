import React, { useEffect, useRef, useCallback } from 'react'
import Post from './Post'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import PostSkeleton from './PostSkeleton'

interface PostsProps {
    loadMore: () => void;
    hasMore: boolean;
    isLoading: boolean;
}

const Posts: React.FC<PostsProps> = ({ loadMore, hasMore, isLoading }) => {
    const posts = useSelector((store: RootState) => store.post?.posts || [])
    const observerRef = useRef<IntersectionObserver | null>(null)

    // Callback ref — fires every time the sentinel DOM element appears/changes
    const sentinelCallback = useCallback((node: HTMLDivElement | null) => {
        // Disconnect old observer
        if (observerRef.current) observerRef.current.disconnect()
        if (!node) return

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore()
                }
            },
            { rootMargin: '600px' }
        )
        observerRef.current.observe(node)
    }, [loadMore])

    // Cleanup on unmount
    useEffect(() => {
        return () => { observerRef.current?.disconnect() }
    }, [])

    return (
        <div>
            {/* Posts or skeletons */}
            {posts.length === 0 && isLoading ? (
                <div className='space-y-6'>
                    <PostSkeleton />
                    <PostSkeleton />
                    <PostSkeleton />
                </div>
            ) : posts.length === 0 ? (
                <div className='text-center text-gray-500 dark:text-gray-400 py-8'>
                    No posts available
                </div>
            ) : (
                posts.map((post) => <Post key={post._id} post={post} />)
            )}

            {/* Sentinel — ALWAYS rendered when hasMore, so observer can find it */}
            {hasMore && posts.length > 0 && (
                <div ref={sentinelCallback} className='h-4' />
            )}

            {/* Loading more spinner */}
            {isLoading && hasMore && posts.length > 0 && (
                <div className='flex justify-center py-6'>
                    <div className='w-6 h-6 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin' />
                </div>
            )}

            {!hasMore && posts.length > 0 && (
                <div className='text-center py-8 text-gray-400 dark:text-gray-500 text-sm'>
                    You're all caught up!
                </div>
            )}
        </div>
    )
}

export default Posts
