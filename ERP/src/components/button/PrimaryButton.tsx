import React, { ButtonHTMLAttributes, ReactNode } from "react";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    text: string;
    icon?: ReactNode;
};

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
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
            className={`
        inline-flex items-center justify-center
        h-10 px-4 py-2 rounded-md
        text-white text-sm font-medium leading-tight
        ${
            disabled
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 cursor-pointer"
        }
        transition-colors duration-200 ease-in-out
        ${className}
      `}
            {...rest}
        >
            {icon && <span className="mr-2 w-4 h-4">{icon}</span>}
            {text}
        </button>
    );
};

export default PrimaryButton;
