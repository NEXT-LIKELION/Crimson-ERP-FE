import React from 'react';

interface SecondaryButtonProps {
  text: string;
  icon?: React.ReactNode;
  onClick?: () => void;
};

const SecondaryButton: React.FC<SecondaryButtonProps> = ({ text, icon, onClick }) => {
  const disabled = false;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center
        h-10 px-4 py-2 rounded-md
        text-gray-700 text-sm font-medium leading-tight
        bg-white hover:bg-gray-100 active:bg-gray-200 disabled:bg-white
        border border-gray-300 hover:border-gray-300 active:border-gray-300 disabled:border-gray-200
        transition-colors duration-200 ease-in-out
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {icon && <span className="mr-2 w-4 h-4">{icon}</span>}
      {text}
    </button>
  );
};

export default SecondaryButton;
