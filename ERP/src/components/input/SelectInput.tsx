import React, { useState } from 'react';
import { FaCaretDown } from 'react-icons/fa';

interface SelectInputProps {
    defaultText?: string;
    options: string[];
    onChange?: (value: string) => void;
    extra?: Record<string, unknown>;
    id?: string;
    'aria-label'?: string;
}

const SelectInput: React.FC<SelectInputProps> = ({ defaultText = '선택', options, onChange }) => {
    const [selectedValue, setSelectedValue] = useState<string>('');

    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = event.target.value;
        setSelectedValue(newValue);
        onChange?.(newValue);
    };

    return (
        <div className="relative inline-flex items-center font-inter">
            <select
                value={selectedValue}
                onChange={handleChange}
                className={`
            h-9 w-52 rounded-md
            pl-4 pr-14 py-2
            text-sm font-normal
            bg-zinc-100 text-gray-700
            border border-gray-300
            focus:outline-none focus:border-indigo-600
            appearance-none
          `}
            >
                <option value="" disabled hidden>
                    {defaultText}
                </option>
                {options.map((option, index) => (
                    <option key={index} value={option}>
                        {option}
                    </option>
                ))}
            </select>
            <FaCaretDown
                className={`absolute right-4 text-gray-500 ${
                    selectedValue ? 'text-indigo-600' : 'text-gray-500'
                } w-3 h-3`}
            />
        </div>
    );
};

export default SelectInput;
