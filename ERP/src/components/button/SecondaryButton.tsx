import React, { ButtonHTMLAttributes, ReactNode } from "react";

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
            className={`
        inline-flex items-center justify-center
        h-10 px-4 py-2 rounded-md
        text-gray-700 text-sm font-medium leading-tight
        bg-white border
        ${
            disabled
                ? "border-gray-200 cursor-not-allowed"
                : "border-gray-300 hover:bg-gray-100 active:bg-gray-200 cursor-pointer"
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

export default SecondaryButton;
