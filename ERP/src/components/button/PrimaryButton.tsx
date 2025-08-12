import React, { ButtonHTMLAttributes, ReactNode } from 'react';

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  text: string;
  icon?: ReactNode;
};

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
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
      className={`inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm leading-tight font-medium text-white ${
        disabled
          ? 'cursor-not-allowed bg-gray-300'
          : 'cursor-pointer bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
      } transition-colors duration-200 ease-in-out ${className}`.trim()}>
      {icon && <span className='mr-2 h-4 w-4'>{icon}</span>}
      {text}
    </button>
  );
};

export default PrimaryButton;
