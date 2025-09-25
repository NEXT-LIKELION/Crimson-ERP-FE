// src/components/Layout.tsx
import React, { ReactNode } from 'react';
import Sidebar from './components/sidebar';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const hideAuth = location.pathname.startsWith('/auth');
  const user = useAuthStore((state) => state.user);

  return (
    <div className='font-inter flex h-screen overflow-hidden bg-gray-50'>
      <div className='flex flex-1'>
        {!hideAuth && <Sidebar />}
        <main className='flex flex-1 flex-col overflow-hidden'>
          {/* 헤더 */}
          {!hideAuth && (
            <header className='flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 py-4'>
              <div>
                <span className='text-xl leading-7 font-medium text-black'>스토어 ERP 시스템</span>
              </div>
              <div className='flex items-center flex-shrink-0'>
                <div className='h-8 w-8 rounded-full bg-gray-200' />
                <span className='pl-2 text-base leading-normal font-normal text-black whitespace-nowrap'>
                  {user ? `${user.first_name}님` : '사용자'}
                </span>
              </div>
            </header>
          )}

          {/* 컨텐츠 */}
          <section className='min-w-[1200px] flex-1 overflow-y-auto p-6'>{children}</section>
        </main>
      </div>
    </div>
  );
};

export default Layout;
