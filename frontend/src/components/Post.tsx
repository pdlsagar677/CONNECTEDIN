import React, { useState, useRef } from 'react'
import { Bookmark, MessageCircle, MoreHorizontal, Send, Heart, User, X } from 'lucide-react'
import CommentDialog from './CommentDialog'
import EditPostModal from './EditPostModal'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import { setPosts, setSelectedPost } from '@/redux/postSlice'
import { RootState } from '@/redux/store'
import API from '@/lib/api'
import SharePostModal from './SharePostModal'
import type { Post as PostType, Comment } from '@/types'

interface PostProps {
    post: PostType
}

const Post: React.FC<PostProps> = ({ post }) => {
    const [text, setText] = useState<string>("")
    const [open, setOpen] = useState<boolean>(false)
    const [showMoreOptions, setShowMoreOptions] = useState<boolean>(false)
    const [shareOpen, setShareOpen] = useState<boolean>(false)
    const [editOpen, setEditOpen] = useState<boolean>(false)
    const [showHeartAnim, setShowHeartAnim] = useState<boolean>(false)

    const user = useSelector((store: RootState) => store.auth?.user)
    const posts = useSelector((store: RootState) => store.post?.posts || [])

    const [liked, setLiked] = useState<boolean>(post.likes.includes(user?._id || '') || false)
    const [postLike, setPostLike] = useState<number>(post.likes.length)
    const [comment, setComment] = useState<Comment[]>(post.comments)
    const dispatch = useDispatch()
    const lastTapRef = useRef<number>(0)

    const changeEventHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputText = e.target.value
        if (inputText.trim()) {
            setText(inputText)
        } else {
            setText("")
        }
    }

    const likeOrDislikeHandler = async () => {
        try {
            const action = liked ? 'dislike' : 'like'
            const res = await API.get(`/post/${post._id}/${action}`)
            if (res.data.success) {
                const updatedLikes = liked ? postLike - 1 : postLike + 1
                setPostLike(updatedLikes)
                setLiked(!liked)

                const updatedPostData = posts.map(p =>
                    p._id === post._id ? {
                        ...p,
                        likes: liked ? p.likes.filter(id => id !== user?._id) : [...p.likes, user?._id || '']
                    } : p
                )
                dispatch(setPosts(updatedPostData))
                toast.success(res.data.message)
            }
        } catch (error) {
            console.log(error)
        }
    }

    const handleDoubleTap = async () => {
        const now = Date.now()
        if (now - lastTapRef.current < 300) {
            // Double tap detected
            if (!liked) {
                await likeOrDislikeHandler()
            }
            // Show heart animation
            setShowHeartAnim(true)
            setTimeout(() => setShowHeartAnim(false), 800)
        }
        lastTapRef.current = now
    }

    const commentHandler = async () => {
        try {
            const res = await API.post(`/post/${post._id}/comment`, { text })
            if (res.data.success) {
                const updatedCommentData = [...comment, res.data.comment]
                setComment(updatedCommentData)

                const updatedPostData = posts.map(p =>
                    p._id === post._id ? { ...p, comments: updatedCommentData } : p
                )

                dispatch(setPosts(updatedPostData))
                toast.success(res.data.message)
                setText("")
            }
        } catch (error) {
            console.log(error)
        }
    }

    const deletePostHandler = async () => {
        try {
            const res = await API.delete(`/post/delete/${post?._id}`)
            if (res.data.success) {
                const updatedPostData = posts.filter((postItem) => postItem?._id !== post?._id)
                dispatch(setPosts(updatedPostData))
                toast.success(res.data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error((error as any).response?.data?.message || 'Error deleting post')
        }
    }

    const bookmarkHandler = async () => {
        try {
            const res = await API.get(`/post/${post?._id}/bookmark`)
            if (res.data.success) {
                toast.success(res.data.message)
            }
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div className='my-8 w-full max-w-sm mx-auto'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                    <div className='w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden'>
                        {post.author?.profilePicture ? (
                            <img
                                src={post.author.profilePicture}
                                alt={`${post.author.username}'s profile`}
                                className='w-full h-full object-cover'
                            />
                        ) : (
                            <User className='w-4 h-4 text-gray-500 dark:text-gray-400' />
                        )}
                    </div>
                    <div className='flex items-center gap-3'>
                        <h1 className='font-medium'>{post.author?.username}</h1>
                        {user?._id === post.author._id && (
                            <span className='px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full'>Author</span>
                        )}
                    </div>
                </div>

                <div className='relative'>
                    <MoreHorizontal
                        className='cursor-pointer hover:text-gray-600 dark:hover:text-gray-300'
                        onClick={() => setShowMoreOptions(!showMoreOptions)}
                    />
                    {showMoreOptions && (
                        <div className='absolute right-0 top-8 bg-white dark:bg-gray-900 shadow-lg rounded-lg border dark:border-gray-700 z-10 min-w-[150px]'>
                            {post?.author?._id !== user?._id && (
                                <div className='cursor-pointer w-full text-[#ED4956] font-bold p-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-center'>
                                    Unfollow
                                </div>
                            )}
                            <div className='cursor-pointer w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-center'>
                                Add to favorites
                            </div>
                            {user && user?._id === post?.author._id && (
                                <>
                                    <div
                                        onClick={() => { setEditOpen(true); setShowMoreOptions(false) }}
                                        className='cursor-pointer w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-center text-blue-600'
                                    >
                                        Edit
                                    </div>
                                    <div
                                        onClick={deletePostHandler}
                                        className='cursor-pointer w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-center text-red-600'
                                    >
                                        Delete
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Post Image with double-tap like */}
            <div className='relative my-2' onClick={handleDoubleTap}>
                <img
                    className='rounded-sm w-full aspect-square object-cover'
                    src={post.image}
                    alt="post_img"
                    loading='lazy'
                />
                {/* Heart animation on double-tap */}
                {showHeartAnim && (
                    <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
                        <Heart
                            className='text-white fill-white drop-shadow-lg'
                            size={80}
                            style={{
                                animation: 'heartPop 0.8s ease-out forwards',
                            }}
                        />
                    </div>
                )}
            </div>

            <div className='flex items-center justify-between my-2'>
                <div className='flex items-center gap-3'>
                    <Heart
                        onClick={likeOrDislikeHandler}
                        className={`cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 ${liked ? 'fill-red-500 text-red-500' : ''}`}
                        size={24}
                    />
                    <MessageCircle
                        onClick={() => {
                            dispatch(setSelectedPost(post))
                            setOpen(true)
                        }}
                        className='cursor-pointer hover:text-gray-600 dark:hover:text-gray-300'
                        size={24}
                    />
                    <Send onClick={() => setShareOpen(true)} className='cursor-pointer hover:text-gray-600 dark:hover:text-gray-300' size={24} />
                </div>
                <Bookmark
                    onClick={bookmarkHandler}
                    className='cursor-pointer hover:text-gray-600 dark:hover:text-gray-300'
                    size={24}
                />
            </div>

            <span className='font-medium block mb-2'>{postLike} likes</span>
            <p>
                <span className='font-medium mr-2'>{post.author?.username}</span>
                {post.caption}
            </p>

            {comment.length > 0 && (
                <span
                    onClick={() => {
                        dispatch(setSelectedPost(post))
                        setOpen(true)
                    }}
                    className='cursor-pointer text-sm text-gray-400 dark:text-gray-500'
                >
                    View all {comment.length} comments
                </span>
            )}

            <CommentDialog open={open} setOpen={setOpen} />
            <SharePostModal open={shareOpen} setOpen={setShareOpen} postId={post._id} />
            <EditPostModal post={post} open={editOpen} setOpen={setEditOpen} />

            <div className='flex items-center justify-between mt-2'>
                <input
                    type="text"
                    placeholder='Add a comment...'
                    value={text}
                    onChange={changeEventHandler}
                    className='outline-none text-sm w-full p-2 border-b border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:bg-gray-900 dark:text-gray-100'
                />
                {text && (
                    <span
                        onClick={commentHandler}
                        className='text-[#3BADF8] cursor-pointer font-medium ml-2'
                    >
                        Post
                    </span>
                )}
            </div>

            {/* Heart animation keyframes */}
            <style>{`
                @keyframes heartPop {
                    0% { transform: scale(0); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 1; }
                    100% { transform: scale(1); opacity: 0; }
                }
            `}</style>
        </div>
    )
}

export default Post
