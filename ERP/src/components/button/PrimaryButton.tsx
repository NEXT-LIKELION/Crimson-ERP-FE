import React, { ButtonHTMLAttributes, ReactNode } from 'react';

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    text: string;
    icon?: ReactNode;
};

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ text, icon, ...props }) => {

  return (
    <button
      {...props}
      className={`
        inline-flex items-center justify-center
        h-10 px-4 py-2 rounded-md
        text-white text-sm font-medium leading-tight
        bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-gray-300
        transition-colors duration-200 ease-in-out
        ${props.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        ${props.className || ''}
      `.trim()}
    >
      {icon && <span className="mr-2 w-4 h-4">{icon}</span>}
      {text}
    </button>
  );
};

export default PrimaryButton;
