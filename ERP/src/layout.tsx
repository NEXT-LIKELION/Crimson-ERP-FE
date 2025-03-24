// src/components/Layout.tsx
import React, { ReactNode } from 'react';
import Sidebar from './components/sidebar';
import { useAuthStore } from './store/authStore';

interface LayoutProps {
    children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const user = useAuthStore((state) => state.user);

    return (
        <div className="flex flex-col w-full h-screen bg-gray-50 font-inter">
            <div className="w-[1440px] h-[900px] mx-auto flex flex-row">
                <Sidebar />

                <main className="flex-1 flex flex-col">
                    {/* 헤더 */}
                    <header className="h-16 px-6 py-4 bg-white border-b border-gray-200 flex justify-between items-center">
                        <div>
                            <span className="text-xl font-medium text-black leading-7">스토어 ERP 시스템</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-200 rounded-full" />
                            <span className="pl-2 text-base text-black font-normal leading-normal">
                                {user ? `${user.username} ${user.role}님` : '사용자'}
                            </span>
                        </div>
                    </header>

                    {/* 컨텐츠 */}
                    <section className="flex-1 p-6 flex flex-col gap-6 overflow-auto">{children}</section>
                </main>
            </div>
        </div>
    );
};

export default Layout;
