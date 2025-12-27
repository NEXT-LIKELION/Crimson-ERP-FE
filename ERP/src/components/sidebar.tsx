// src/components/sidebar.tsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IconType } from 'react-icons';
import { FiGrid, FiBox, FiShoppingCart, FiUsers, FiLogOut, FiHome, FiMenu } from 'react-icons/fi';
import { useLogout } from '../hooks/queries/useLogout';
import { useSidebarStore } from '../store/sidebarStore';

const MENU_ITEMS = [
  { icon: FiGrid, label: '대시보드', path: '/' },
  { icon: FiBox, label: '재고 관리', path: '/inventory' },
  { icon: FiShoppingCart, label: '발주 관리', path: '/orders' },
  { icon: FiUsers, label: 'HR 관리', path: '/hr' },
  { icon: FiHome, label: '업체 관리', path: '/supplier' },
];

// SidebarHeader는 제거하고 메인 컴포넌트에서 직접 처리

interface SidebarItemProps {
  icon: IconType;
  label: string;
  path: string;
  active: boolean;
  onClick: () => void;
  collapsed?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  active,
  onClick,
  collapsed,
}) => (
  <div
    onClick={onClick}
    className={`flex w-full cursor-pointer items-center rounded-md p-2 transition-colors ${
      active ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
    } ${collapsed ? 'justify-center' : ''}`}
    title={collapsed ? label : undefined}>
    <Icon className={`h-6 w-6 flex-shrink-0 ${collapsed ? '' : 'mr-3'}`} />
    {!collapsed && <span className='text-sm leading-tight font-medium'>{label}</span>}
  </div>
);

interface SidebarFooterProps {
  collapsed?: boolean;
}

const SidebarFooter: React.FC<SidebarFooterProps> = ({ collapsed }) => {
  const logoutMutation = useLogout();

  return (
    <div
      className={`flex cursor-pointer items-center border-t border-gray-200 px-4 py-4 transition-colors hover:bg-gray-100 ${
        collapsed ? 'justify-center' : ''
      }`}
      onClick={() => logoutMutation.mutate()}
      title={collapsed ? '로그아웃' : undefined}>
      <FiLogOut className={`h-6 w-6 flex-shrink-0 text-gray-600 ${collapsed ? '' : 'mr-3'}`} />
      {!collapsed && (
        <span className='text-sm leading-tight font-medium text-gray-600'>
          {logoutMutation.isPending ? '로그아웃 중...' : '로그아웃'}
        </span>
      )}
    </div>
  );
};

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, toggleSidebar } = useSidebarStore();

  return (
    <aside
      className={`flex flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-in-out ${
        isOpen ? 'w-64' : 'w-16'
      }`}>
      {/* 토글 버튼이 포함된 헤더 */}
      <div className='flex h-16 items-center justify-between border-b border-gray-200 px-4 py-1'>
        {isOpen ? (
          <>
            <div className='flex items-center'>
              <img
                src='/images/crimsonlogo.png'
                alt='Logo'
                className='mr-3 h-14 w-14 rounded object-cover object-center'
              />
              <span className='text-xl leading-7 font-bold text-black'>크림슨스토어</span>
            </div>
            <button
              onClick={toggleSidebar}
              className='rounded p-1 transition-colors hover:bg-gray-100'
              aria-label='사이드바 접기'>
              <FiMenu className='h-6 w-6 text-gray-600' />
            </button>
          </>
        ) : (
          <button
            onClick={toggleSidebar}
            className='w-full rounded p-1 transition-colors hover:bg-gray-100'
            aria-label='사이드바 펼치기'>
            <FiMenu className='h-6 w-6 text-gray-600' />
          </button>
        )}
      </div>

      <nav className='flex flex-1 flex-col gap-1 px-2 py-4'>
        {MENU_ITEMS.map(({ icon, label, path }) => (
          <SidebarItem
            key={path}
            icon={icon}
            label={label}
            path={path}
            active={location.pathname === path}
            onClick={() => navigate(path)}
            collapsed={!isOpen}
          />
        ))}
      </nav>

      <SidebarFooter collapsed={!isOpen} />
    </aside>
  );
};

export default Sidebar;
