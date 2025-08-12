import React from 'react';

interface StatusBadgeProps {
  text: string;
  theme: 'pending' | 'approved' | 'active' | 'neutral' | 'rejected' | 'completed';
  icon?: React.ReactNode; // 선택적 아이콘
}

const themeClasses = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  active: 'bg-blue-100 text-blue-800',
  neutral: 'bg-gray-100 text-gray-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-indigo-100 text-indigo-800',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ text, theme, icon }) => {
  return (
    <span
      className={`font-inter inline-flex h-6 items-center justify-center rounded-full px-2 py-1 text-xs font-medium ${themeClasses[theme]} `}>
      {icon && <span className='h-3 w-3 pr-1'>{icon}</span>}
      {text}
    </span>
  );
};

export default StatusBadge;
