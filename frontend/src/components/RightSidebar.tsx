import React from 'react'
import SuggestedUsers from './SuggestedUsers'

const RightSidebar: React.FC = () => {
  return (
    <div className='w-80 ml-8 my-10 flex-shrink-0'>
      <SuggestedUsers />
    </div>
  )
}

export default RightSidebar
