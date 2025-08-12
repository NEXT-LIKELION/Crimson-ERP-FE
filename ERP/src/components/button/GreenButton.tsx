import React from 'react';

interface GreenButtonProps {
  text: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

const GreenButton: React.FC<GreenButtonProps> = ({ text, icon, onClick }) => {
  const disabled = false; // 내부에서 기본값 설정

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm leading-tight font-medium text-white transition-colors duration-200 ease-in-out hover:bg-green-700 active:bg-green-800 disabled:bg-gray-300 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} `}>
      {icon && <span className='mr-2 h-4 w-4'>{icon}</span>}
      {text}
    </button>
  );
};

export default GreenButton;
