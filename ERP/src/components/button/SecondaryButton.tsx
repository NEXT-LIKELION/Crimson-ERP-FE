import React, { ButtonHTMLAttributes, ReactNode } from 'react';

type SecondaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    text: string;
    icon?: ReactNode;
};

const SecondaryButton: React.FC<SecondaryButtonProps> = ({
    text,
    icon,
    className = "",
    disabled = false,
    onClick,
    ...rest
}) => {

  return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            {...rest}
            className={`
                inline-flex items-center justify-center
                h-10 px-4 py-2 rounded-md
                text-gray-700 text-sm font-medium leading-tight
                bg-white hover:bg-gray-100 active:bg-gray-200 disabled:bg-white
                border border-gray-300 hover:border-gray-300 active:border-gray-300 disabled:border-gray-200
                transition-colors duration-200 ease-in-out
                ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                ${className}
            `.trim()}
    >
      {icon && <span className="mr-2 w-4 h-4">{icon}</span>}
      {text}
    </button>
  );
};

export default SecondaryButton;
