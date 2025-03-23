// src/components/sidebar.tsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IconType } from 'react-icons';
import { FiGrid, FiBox, FiShoppingCart, FiUsers, FiLogOut } from 'react-icons/fi';
import axios from '../api/axios';
import { useAuthStore } from '../store/authStore';

const MENU_ITEMS = [
    { icon: FiGrid, label: '대시보드', path: '/' },
    { icon: FiBox, label: '재고 관리', path: '/inventory' },
    { icon: FiShoppingCart, label: '발주 관리', path: '/orders' },
    { icon: FiUsers, label: 'HR 관리', path: '/hr' },
];

const SidebarHeader: React.FC = () => (
    <div className="h-16 px-4 py-1 border-b border-gray-200 flex items-center">
        <span className="text-xl font-bold text-black leading-7">크림슨스토어</span>
    </div>
);

interface SidebarItemProps {
    icon: IconType;
    label: string;
    path: string;
    active: boolean;
    onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, active, onClick }) => (
    <div
        onClick={onClick}
        className={`w-full p-2 flex items-center cursor-pointer rounded-md ${
            active ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
        }`}
    >
        <Icon className="w-6 h-6 mr-3" />
        <span className="text-sm font-medium leading-tight">{label}</span>
    </div>
);

const SidebarFooter: React.FC = () => {
    const navigate = useNavigate();
    const logout = useAuthStore((state) => state.logout);

    const handleLogout = async () => {
        try {
            await axios.post('/logout');
            logout();
            navigate('/auth'); // 로그인 페이지 경로 (제공된 라우팅에 맞춤)
        } catch (error) {
            console.error('로그아웃 실패:', error);
            alert('로그아웃 중 문제가 발생했습니다. 다시 시도해주세요.');
        }
    };

    return (
        <div
            className="px-4 py-4 border-t border-gray-200 flex items-center cursor-pointer hover:bg-gray-100"
            onClick={handleLogout}
        >
            <FiLogOut className="w-6 h-6 text-gray-600 mr-3" />
            <span className="text-sm font-medium text-gray-600 leading-tight">로그아웃</span>
        </div>
    );
};

const Sidebar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
            <SidebarHeader />

            <nav className="flex-1 flex flex-col gap-1 px-2 py-4">
                {MENU_ITEMS.map(({ icon, label, path }) => (
                    <SidebarItem
                        key={path}
                        icon={icon}
                        label={label}
                        path={path}
                        active={location.pathname === path}
                        onClick={() => navigate(path)}
                    />
                ))}
            </nav>

            <SidebarFooter />
        </aside>
    );
};

export default Sidebar;
