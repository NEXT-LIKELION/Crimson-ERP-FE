import React, { ButtonHTMLAttributes, ReactNode } from 'react';

type SecondaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  text: string;
  icon?: ReactNode;
};

const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  text,
  icon,
  className = '',
  disabled = false,
  onClick,
  ...rest
}) => {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      {...rest}
      className={`inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm leading-tight font-medium text-gray-700 transition-colors duration-200 ease-in-out hover:border-gray-300 hover:bg-gray-100 active:border-gray-300 active:bg-gray-200 disabled:border-gray-200 disabled:bg-white ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${className} `.trim()}>
      {icon && <span className='mr-2 h-4 w-4'>{icon}</span>}
      {text}
    </button>
  );
};

export default SecondaryButton;
