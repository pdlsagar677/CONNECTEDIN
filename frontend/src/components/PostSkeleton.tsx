import React from 'react';

const PostSkeleton: React.FC = () => {
  return (
    <div className='my-8 w-full max-w-sm mx-auto animate-pulse'>
      {/* Header */}
      <div className='flex items-center gap-3 mb-3'>
        <div className='w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700' />
        <div className='flex-1'>
          <div className='h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded' />
        </div>
      </div>

      {/* Image */}
      <div className='w-full aspect-square bg-gray-200 dark:bg-gray-700 rounded-sm' />

      {/* Action buttons */}
      <div className='flex gap-3 mt-3'>
        <div className='w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded' />
        <div className='w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded' />
        <div className='w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded' />
      </div>

      {/* Likes */}
      <div className='h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded mt-3' />

      {/* Caption */}
      <div className='h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mt-2' />
      <div className='h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mt-1.5' />
    </div>
  );
};

export default PostSkeleton;
