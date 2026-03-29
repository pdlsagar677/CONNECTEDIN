import React from 'react'
import Feed from '../components/Feed'
import Stories from '../components/Stories'
import { Outlet } from 'react-router-dom'
import useGetAllPost from '@/hooks/useGetAllPost'
import useGetSuggestedUsers from '@/hooks/useGetSuggestedUsers'

const Home: React.FC = () => {
    const { loadMore, hasMore, isLoading } = useGetAllPost()
    useGetSuggestedUsers()

    return (
        <div className='flex justify-center'>
            <div className='w-full max-w-xl px-4 sm:px-0'>
                <div className='pt-4 md:pt-8'>
                    <Stories />
                </div>
                <Feed loadMore={loadMore} hasMore={hasMore} isLoading={isLoading} />
                <Outlet />
            </div>
        </div>
    )
}

export default Home
