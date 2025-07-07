import React, { useState } from 'react';
import { FaCaretDown } from 'react-icons/fa';

interface SelectInputProps {
    label?: string;
    value?: string;
    defaultText?: string;
    options: string[];
    onChange?: (value: string) => void;
    extra?: Record<string, unknown>;
    id?: string;
    'aria-label'?: string;
}

const SelectInput: React.FC<SelectInputProps> = ({ label, value, defaultText = '선택', options, onChange }) => {
    const [selectedValue, setSelectedValue] = useState<string>(defaultText);
    const isControlled = value !== undefined;
    const selectValue = isControlled ? value : selectedValue;

    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = event.target.value;
        if (!isControlled) setSelectedValue(newValue);
        onChange?.(newValue);
    };

    return (
        <div className="relative inline-flex flex-col w-full">
            {label && <label className="block text-sm text-gray-600 mb-1">{label}</label>}
            <div className="relative">
                <select
                    value={selectValue}
                    onChange={handleChange}
                    className={`
                    h-9 w-full rounded-md
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
                    className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 ${
                        selectValue ? 'text-indigo-600' : 'text-gray-500'
                    } w-3 h-3`}
                />
            </div>
        </div>
    );
};

export default SelectInput;
