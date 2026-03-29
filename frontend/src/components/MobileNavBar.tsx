import React from 'react';
import { Home, Search, Compass, UserPlus, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

const MobileNavBar: React.FC = () => {
  const { user } = useSelector((store: RootState) => store.auth);
  const location = useLocation();
  const path = location.pathname;

  const navItems = [
    { icon: Home, to: '/home', label: 'Home' },
    { icon: Search, to: '/explore', label: 'Explore' },
    { icon: UserPlus, to: '/suggested', label: 'Suggested' },
    { icon: Compass, to: '/saved', label: 'Saved' },
    { icon: User, to: `/profile/${user?._id}`, label: 'Profile' },
  ];

  return (
    <nav className='md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe'>
      <div className='flex items-center justify-around h-12'>
        {navItems.map(({ icon: Icon, to, label }) => {
          const isActive = path === to || (label === 'Home' && path === '/');
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center flex-1 h-full ${
                isActive ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {label === 'Profile' && user?.profilePicture ? (
                <div className={`w-6 h-6 rounded-full overflow-hidden ${isActive ? 'ring-1 ring-black' : ''}`}>
                  <img src={user.profilePicture} alt='profile' className='w-full h-full object-cover' />
                </div>
              ) : (
                <Icon size={24} strokeWidth={isActive ? 2.5 : 1.5} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavBar;
