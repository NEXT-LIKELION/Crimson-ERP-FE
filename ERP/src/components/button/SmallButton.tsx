import React from 'react';

interface SmallButtonProps {
  text: string;
  backgroundColor: string;
  color: string;
  onClick?: () => void;
};

const SmallButton: React.FC<SmallButtonProps> = ({ text, backgroundColor, color, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: backgroundColor,
        color: color,
      }}
      className={`
        inline-flex items-center justify-center
        h-8 px-3 py-1 rounded-md
        text-xs font-medium leading-none
        transition-colors duration-200 ease-in-out
        cursor-pointer
      `}
    >
      {text}
    </button>
  );
};

export default SmallButton;
