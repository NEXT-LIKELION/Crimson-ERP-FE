import React from 'react';

interface PrimaryButtonProps {
  text: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ text, icon, onClick, disabled = false }) => {

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center
        h-10 px-4 py-2 rounded-md
        text-white text-sm font-medium leading-tight
        bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-gray-300
        transition-colors duration-200 ease-in-out
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {icon && <span className="mr-2 w-4 h-4">{icon}</span>}
      {text}
    </button>
  );
};

export default PrimaryButton;
