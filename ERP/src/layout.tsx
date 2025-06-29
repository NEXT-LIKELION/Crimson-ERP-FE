// src/components/Layout.tsx
import React, { ReactNode } from 'react';
import Sidebar from './components/sidebar';
import { useAuthStore } from './store/authStore';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
    children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const user = useAuthStore((state) => state.user);
    const hideAuth = location.pathname.startsWith('/auth');

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 font-inter">
            <div className="flex flex-1">
                {!hideAuth && <Sidebar />}
                <main className="flex-1 flex flex-col overflow-hidden">
                    {/* 헤더 */}
                    {!hideAuth && (
                        <header className="h-16 px-6 py-4 bg-white border-b border-gray-200 flex justify-between items-center">
                            <div>
                                <span className="text-xl font-medium text-black leading-7">스토어 ERP 시스템</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                                <span className="pl-2 text-base text-black font-normal leading-normal">
                                    {user ? `${user.username}님` : '사용자'}
                                </span>
                            </div>
                        </header>
                    )}

                    {/* 컨텐츠 */}
                    <section className="flex-1 p-6 overflow-y-auto min-w-[1200px]">{children}</section>
                </main>
            </div>
        </div>
    );
};

export default Layout;
