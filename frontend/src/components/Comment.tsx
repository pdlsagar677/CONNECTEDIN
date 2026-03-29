import React from 'react'
import { User } from 'lucide-react'

interface Author {
  username: string
  profilePicture?: string
}

interface CommentData {
  author: Author
  text: string
}

interface CommentProps {
  comment: CommentData
}

const Comment: React.FC<CommentProps> = ({ comment }) => {
  return (
    <div className="my-2">
      <div className="flex gap-3 items-center">
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
          {comment?.author?.profilePicture ? (
            <img 
              src={comment.author.profilePicture} 
              alt={`${comment.author.username}'s profile`}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-4 h-4 text-gray-500" />
          )}
        </div>
        <h1 className="font-bold text-sm">
          {comment?.author.username}{' '}
          <span className="font-normal pl-1">{comment?.text}</span>
        </h1>
      </div>
    </div>
  )
}

export default Comment