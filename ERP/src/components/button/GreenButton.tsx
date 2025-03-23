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
      className={`
        inline-flex items-center justify-center
        h-10 px-4 py-2 rounded-md
        text-white text-sm font-medium leading-tight
        bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-gray-300
        transition-colors duration-200 ease-in-out
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {icon && <span className="mr-2 w-4 h-4">{icon}</span>}
      {text}
    </button>
  );
};

export default GreenButton;
