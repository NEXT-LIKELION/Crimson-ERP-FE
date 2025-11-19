// src/components/sidebar.tsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IconType } from 'react-icons';
import { FiGrid, FiShoppingCart, FiUsers, FiLogOut, FiHome } from 'react-icons/fi';
import { useLogout } from '../hooks/queries/useLogout';

const MENU_ITEMS = [
  { icon: FiGrid, label: '대시보드', path: '/' },
  // { icon: FiBox, label: '재고 관리', path: '/inventory' },
  { icon: FiShoppingCart, label: '발주 관리', path: '/orders' },
  { icon: FiUsers, label: 'HR 관리', path: '/hr' },
  { icon: FiHome, label: '업체 관리', path: '/supplier' },
];

const SidebarHeader: React.FC = () => (
  <div className='flex h-16 items-center border-b border-gray-200 px-4 py-1'>
    <img
      src='/images/crimsonlogo.png'
      alt='Logo'
      className='mr-3 h-14 w-14 rounded object-cover object-center'
    />

    <span className='text-xl leading-7 font-bold text-black'>크림슨스토어</span>
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
    className={`flex w-full cursor-pointer items-center rounded-md p-2 ${
      active ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
    }`}>
    <Icon className='mr-3 h-6 w-6' />
    <span className='text-sm leading-tight font-medium'>{label}</span>
  </div>
);

const SidebarFooter: React.FC = () => {
  const logoutMutation = useLogout();

  return (
    <div
      className='flex cursor-pointer items-center border-t border-gray-200 px-4 py-4 hover:bg-gray-100'
      onClick={() => logoutMutation.mutate()}>
      <FiLogOut className='mr-3 h-6 w-6 text-gray-600' />
      <span className='text-sm leading-tight font-medium text-gray-600'>
        {logoutMutation.isPending ? '로그아웃 중...' : '로그아웃'}
      </span>
    </div>
  );
};

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className='flex w-64 flex-col border-r border-gray-200 bg-white'>
      <SidebarHeader />

      <nav className='flex flex-1 flex-col gap-1 px-2 py-4'>
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
