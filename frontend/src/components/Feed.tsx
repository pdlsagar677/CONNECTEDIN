import React from 'react';
import Posts from './Posts';

interface FeedProps {
  loadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

const Feed: React.FC<FeedProps> = ({ loadMore, hasMore, isLoading }) => {
  return (
    <div className='flex flex-col items-center w-full'>
      <Posts loadMore={loadMore} hasMore={hasMore} isLoading={isLoading} />
    </div>
  );
};

export default Feed;
