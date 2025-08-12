import React from 'react';

interface SmallButtonProps {
  text: string;
  backgroundColor: string;
  color: string;
  onClick?: () => void;
}

const SmallButton: React.FC<SmallButtonProps> = ({ text, backgroundColor, color, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: backgroundColor,
        color: color,
      }}
      className={`inline-flex h-8 cursor-pointer items-center justify-center rounded-md px-3 py-1 text-xs leading-none font-medium transition-colors duration-200 ease-in-out`}>
      {text}
    </button>
  );
};

export default SmallButton;
