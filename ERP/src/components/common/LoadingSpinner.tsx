import React from 'react';

interface LoadingSpinnerProps {
  overlay?: boolean;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  overlay = false,
  size = 'md',
  text = '로딩 중...',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const spinner = (
    <div className='flex flex-col items-center justify-center gap-3'>
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600`}></div>
      {text && <p className='text-sm font-medium text-gray-600'>{text}</p>}
    </div>
  );

  if (overlay) {
    return (
      <div className='fixed inset-0 z-[9999] flex items-center justify-center bg-white/90 backdrop-blur-sm'>
        {spinner}
      </div>
    );
  }

  return <div className='flex items-center justify-center py-12'>{spinner}</div>;
};

export default LoadingSpinner;
