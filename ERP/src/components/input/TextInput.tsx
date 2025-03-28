import React, { useState } from 'react';

interface TextInputProps {
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  onChange?: (value: string) => void;
}

const TextInput: React.FC<TextInputProps> = ({ placeholder, disabled = false, error = false, className, onChange }) => {
  const [value, setValue] = useState<string>('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setValue(newValue);
    onChange?.(newValue);  // 상태 전달
  };

  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={handleChange}
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
  );
};

export default TextInput;