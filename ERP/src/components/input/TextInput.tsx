import React, { useState } from 'react';

interface TextInputProps {
    label?: string;
    value?: string;
    type?: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    error?: boolean;
    onChange?: (value: string) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    extra?: Record<string, unknown>;
    id?: string;
}

const TextInput: React.FC<TextInputProps> = ({
    label,
    value = '',
    type = 'text',
    placeholder,
    disabled = false,
    error = false,
    className,
    onChange,
    onKeyDown,
}) => {
    const [internalValue, setInternalValue] = useState<string>('');
    const isControlled = value !== undefined;
    const inputValue = isControlled ? value : internalValue;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        if (!isControlled) setInternalValue(newValue);
        onChange?.(newValue); // 상태 전달
    };

    return (
        <div>
            {label && <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>}
            <input
                type={type}
                value={inputValue}
                placeholder={placeholder}
                disabled={disabled}
                onChange={handleChange}
                onKeyDown={onKeyDown}
                className={`
        h-9 w-52 rounded-md
        text-sm font-normal
        pl-3 pr-10 pt-2.5 pb-2
        border border-gray-300
        focus:outline-none font-inter
        ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700'}
        ${error ? 'border-red-500 text-red-600' : ''}
        ${!disabled && !error ? 'focus:ring-2 focus:ring-indigo-600' : ''}
        ${className}
      `}
            />
        </div>
    );
};

export default TextInput;