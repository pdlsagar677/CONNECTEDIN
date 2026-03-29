import React from 'react';

const StorySkeleton: React.FC = () => {
  return (
    <div className='flex gap-4 overflow-hidden py-4 animate-pulse'>
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className='flex flex-col items-center gap-1.5 flex-shrink-0'>
          <div className='w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700' />
          <div className='h-2 w-10 bg-gray-200 dark:bg-gray-700 rounded' />
        </div>
      ))}
    </div>
  );
};

export default StorySkeleton;
