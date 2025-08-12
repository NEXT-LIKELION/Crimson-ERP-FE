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
  noSpinner?: boolean; // number input spinner 제거
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
  noSpinner = false,
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
      {label && <label className='mb-1 block text-xs font-medium text-gray-700'>{label}</label>}
      <input
        type={type}
        value={inputValue}
        placeholder={placeholder}
        disabled={disabled}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        className={`font-inter h-9 w-52 rounded-md border border-gray-300 pt-2.5 pr-10 pb-2 pl-3 text-sm font-normal focus:outline-none ${disabled ? 'cursor-not-allowed bg-gray-100 text-gray-400' : 'bg-white text-gray-700'} ${error ? 'border-red-500 text-red-600' : ''} ${!disabled && !error ? 'focus:ring-2 focus:ring-indigo-600' : ''} ${noSpinner && type === 'number' ? 'no-spin appearance-none' : ''} ${className} `}
        inputMode={type === 'number' ? 'numeric' : undefined}
      />
    </div>
  );
};

export default TextInput;
