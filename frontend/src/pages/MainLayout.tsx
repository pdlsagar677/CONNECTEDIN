import React from 'react';
import { Outlet } from 'react-router-dom';
import LeftSidebar from '../components/LeftSideBar';
import MobileNavBar from '../components/MobileNavBar';
import FloatingChat from '../components/FloatingChat';
import FloatingSuggested from '../components/FloatingSuggested';

const MainLayout: React.FC = () => {
  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-950'>
      <LeftSidebar />
      <main className='md:ml-64 pt-14 md:pt-0 pb-14 md:pb-0 min-h-screen'>
        <Outlet />
      </main>
      <MobileNavBar />
      <FloatingChat />
      <FloatingSuggested />
    </div>
  );
};

export default MainLayout;
