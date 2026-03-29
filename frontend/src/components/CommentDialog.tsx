import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MoreHorizontal, User, X } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import Comment from './Comment'
import { toast } from 'sonner'
import { setPosts } from '@/redux/postSlice'
import { RootState } from '@/redux/store'
import API from '@/lib/api'
import type { Comment as CommentType } from '@/types'

interface CommentDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
}

const CommentDialog: React.FC<CommentDialogProps> = ({ open, setOpen }) => {
  const [text, setText] = useState<string>("")
  const [showMoreOptions, setShowMoreOptions] = useState<boolean>(false)

  const selectedPost = useSelector((store: RootState) => store.post?.selectedPost)
  const posts = useSelector((store: RootState) => store.post?.posts || [])

  const [comment, setComment] = useState<CommentType[]>([])
  const dispatch = useDispatch()

  useEffect(() => {
    if (selectedPost) {
      setComment(selectedPost.comments)
    }
  }, [selectedPost])

  const changeEventHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputText = e.target.value
    if (inputText.trim()) {
      setText(inputText)
    } else {
      setText("")
    }
  }

  const sendMessageHandler = async () => {
    try {
      const res = await API.post(`/post/${selectedPost?._id}/comment`, { text })

      if (res.data.success) {
        const updatedCommentData = [...comment, res.data.comment]
        setComment(updatedCommentData)

        if (selectedPost) {
          const updatedPostData = posts.map(p =>
            p._id === selectedPost._id ? { ...p, comments: updatedCommentData } : p
          )
          dispatch(setPosts(updatedPostData))
          toast.success(res.data.message)
          setText("")
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  if (!open || !selectedPost) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-5xl w-full mx-4 max-h-[90vh] flex flex-col relative shadow-lg dark:shadow-gray-900/30">
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 z-10 bg-white dark:bg-gray-900 rounded-full p-2 shadow-lg dark:shadow-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X className="w-5 h-5 text-gray-800 dark:text-gray-100" />
        </button>

        <div className="flex flex-1 min-h-0">
          <div className="w-1/2">
            <img
              src={selectedPost?.image}
              alt="post_img"
              className="w-full h-full object-cover rounded-l-lg"
              loading='lazy'
            />
          </div>

          <div className="w-1/2 flex flex-col justify-between">
            <div className="flex items-center justify-between p-4">
              <div className="flex gap-3 items-center">
                <Link to={`/profile/${selectedPost?.author?._id}`}>
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                    {selectedPost?.author?.profilePicture ? (
                      <img
                        src={selectedPost.author.profilePicture}
                        alt={`${selectedPost.author.username}'s profile`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    )}
                  </div>
                </Link>
                <div>
                  <Link to={`/profile/${selectedPost?.author?._id}`} className="font-semibold text-xs text-gray-800 dark:text-gray-100">
                    {selectedPost?.author?.username}
                  </Link>
                </div>
              </div>

              <div className="relative">
                <MoreHorizontal
                  className="cursor-pointer text-gray-800 dark:text-gray-100"
                  onClick={() => setShowMoreOptions(!showMoreOptions)}
                />
                {showMoreOptions && (
                  <div className="absolute right-0 top-8 bg-white dark:bg-gray-900 shadow-lg dark:shadow-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700 z-10 min-w-[150px]">
                    <div className="cursor-pointer w-full text-[#ED4956] font-bold p-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-center">
                      Unfollow
                    </div>
                    <div className="cursor-pointer w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-center text-gray-800 dark:text-gray-100">
                      Add to favorites
                    </div>
                  </div>
                )}
              </div>
            </div>

            <hr />

            <div className="flex-1 overflow-y-auto max-h-96 p-4">
              {comment.map((commentItem) => (
                <Comment key={commentItem._id} comment={commentItem} />
              ))}
            </div>

            <div className="p-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={text}
                  onChange={changeEventHandler}
                  placeholder="Add a comment..."
                  className="w-full outline-none border text-sm border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 p-2 rounded focus:border-blue-500"
                />
                <button
                  disabled={!text.trim()}
                  onClick={sendMessageHandler}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommentDialog
