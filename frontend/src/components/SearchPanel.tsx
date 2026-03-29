import React, { useState, useCallback, useEffect, useRef } from 'react'
import { X, Search, User, Users, Clock, TrendingUp, Sparkles, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import API from '@/lib/api'
import type { User as UserType } from '@/types'

interface SearchPanelProps {
  open: boolean
  setOpen: (open: boolean) => void
}

const SearchPanel: React.FC<SearchPanelProps> = ({ open, setOpen }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserType[]>([])
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [trendingUsers, setTrendingUsers] = useState<UserType[]>([])
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      fetchTrendingUsers()
      loadRecentSearches()
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const fetchTrendingUsers = async () => {
    try {
      const res = await API.get('/users/trending')
      if (res.data.success) {
        setTrendingUsers(res.data.users)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const loadRecentSearches = () => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }

  const saveRecentSearch = (username: string) => {
    const updated = [username, ...recentSearches.filter(s => s !== username)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }

  const searchUsers = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }
    try {
      setLoading(true)
      const res = await API.get(`/users/search?q=${encodeURIComponent(searchQuery)}`)
      if (res.data.success) {
        setResults(res.data.users)
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    if (debounceTimer) clearTimeout(debounceTimer)
    const timer = setTimeout(() => {
      searchUsers(value)
    }, 300)
    setDebounceTimer(timer)
  }

  const handleUserClick = (username: string) => {
    saveRecentSearch(username)
    handleClose()
  }

  const handleClearRecent = () => {
    setRecentSearches([])
    localStorage.removeItem('recentSearches')
  }

  const handleClose = () => {
    setOpen(false)
    setQuery('')
    setResults([])
  }

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className='fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fadeIn'
        onClick={handleClose}
      />
      
      {/* Search Panel */}
      <div className='fixed right-0 top-0 bottom-0 z-50 w-full sm:w-96 bg-white dark:bg-gray-900 shadow-2xl flex flex-col animate-slideInRight'>
        {/* Header */}
        <div className='sticky top-0 bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-4'>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-2'>
              <Search className='w-5 h-5 text-white' />
              <h2 className='text-lg font-bold text-white'>Search</h2>
            </div>
            <button
              onClick={handleClose}
              className='p-1 rounded-full hover:bg-white/20 transition-colors'
            >
              <X className='w-5 h-5 text-white' />
            </button>
          </div>
          
          {/* Search Input */}
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
            <input
              ref={inputRef}
              type='text'
              value={query}
              onChange={handleInputChange}
              placeholder='Search users by username...'
              className='w-full pl-10 pr-4 py-2.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all'
            />
          </div>
          <p className='text-white/80 text-xs mt-2'>Find friends and connect</p>
        </div>

        {/* Results Area */}
        <div className='flex-1 overflow-y-auto'>
          {loading && (
            <div className='flex flex-col items-center justify-center py-12'>
              <Loader2 className='w-8 h-8 text-blue-500 animate-spin mb-2' />
              <p className='text-gray-500 dark:text-gray-400 text-sm'>Searching...</p>
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className='flex flex-col items-center justify-center py-12'>
              <div className='w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3'>
                <User className='w-8 h-8 text-gray-400 dark:text-gray-500' />
              </div>
              <p className='text-gray-600 dark:text-gray-300 font-medium'>No users found</p>
              <p className='text-sm text-gray-400 dark:text-gray-500 mt-1'>Try a different username</p>
            </div>
          )}

          {!loading && query && results.length > 0 && (
            <div className='divide-y divide-gray-100 dark:divide-gray-800'>
              {results.map((user) => (
                <Link
                  key={user._id}
                  to={`/profile/${user._id}`}
                  onClick={() => handleUserClick(user.username)}
                  className='flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group'
                >
                  <div className='flex-shrink-0'>
                    <div className='w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ring-2 ring-blue-500/20 group-hover:ring-blue-500/40 transition-all'>
                      {user.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={user.username}
                          className='w-full h-full object-cover'
                        />
                      ) : (
                        <User className='w-6 h-6 text-gray-400 dark:text-gray-500' />
                      )}
                    </div>
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='font-semibold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 transition-colors'>
                      {user.username}
                    </p>
                    {user.bio && (
                      <p className='text-gray-500 dark:text-gray-400 text-xs truncate'>{user.bio}</p>
                    )}
                    {user.followers && (
                      <p className='text-gray-400 dark:text-gray-500 text-xs mt-0.5'>
                        {user.followers.length} followers
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <div className='py-4'>
              <div className='px-4 py-2 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Clock className='w-4 h-4 text-gray-400 dark:text-gray-500' />
                  <h3 className='text-sm font-medium text-gray-600 dark:text-gray-300'>Recent Searches</h3>
                </div>
                <button
                  onClick={handleClearRecent}
                  className='text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors'
                >
                  Clear all
                </button>
              </div>
              <div className='space-y-1'>
                {recentSearches.map((username, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(username)
                      searchUsers(username)
                    }}
                    className='w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'
                  >
                    <Clock className='w-4 h-4 text-gray-400 dark:text-gray-500' />
                    <span className='text-gray-700 dark:text-gray-200 text-sm'>{username}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trending Users */}
          {!query && trendingUsers.length > 0 && (
            <div className='py-4 border-t border-gray-100 dark:border-gray-800'>
              <div className='px-4 py-2 flex items-center gap-2'>
                <TrendingUp className='w-4 h-4 text-blue-500' />
                <h3 className='text-sm font-medium text-gray-600 dark:text-gray-300'>Trending Users</h3>
              </div>
              <div className='space-y-2'>
                {trendingUsers.map((user) => (
                  <Link
                    key={user._id}
                    to={`/profile/${user._id}`}
                    onClick={() => handleUserClick(user.username)}
                    className='flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group'
                  >
                    <div className='flex-shrink-0'>
                      <div className='w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200'>
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.username}
                            className='w-full h-full object-cover'
                          />
                        ) : (
                          <User className='w-5 h-5 text-gray-400 m-2.5' />
                        )}
                      </div>
                    </div>
                    <div className='flex-1'>
                      <p className='font-medium text-gray-800 dark:text-gray-100 text-sm group-hover:text-blue-600 transition-colors'>
                        {user.username}
                      </p>
                      {user.bio && (
                        <p className='text-gray-400 dark:text-gray-500 text-xs truncate'>{user.bio}</p>
                      )}
                    </div>
                    {user.followers && (
                      <span className='text-xs text-gray-400 dark:text-gray-500'>
                        {user.followers.length} followers
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!query && recentSearches.length === 0 && trendingUsers.length === 0 && (
            <div className='flex flex-col items-center justify-center py-12'>
              <div className='w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4'>
                <Users className='w-10 h-10 text-gray-400 dark:text-gray-500' />
              </div>
              <h3 className='text-gray-700 dark:text-gray-200 font-semibold mb-1'>Find your friends</h3>
              <p className='text-sm text-gray-500 dark:text-gray-400 text-center px-8'>
                Search for users by username to connect with them
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-5 py-3'>
          <p className='text-xs text-gray-400 dark:text-gray-500 text-center flex items-center justify-center gap-1'>
            <Sparkles className='w-3 h-3' />
            Search and discover new connections
          </p>
        </div>
      </div>

      {/* Add animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </>
  )
}

export default SearchPanel