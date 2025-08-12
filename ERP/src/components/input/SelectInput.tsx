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
  disabled?: boolean;
}

const SelectInput: React.FC<SelectInputProps> = ({
  label,
  value,
  defaultText = '선택',
  options,
  onChange,
  disabled,
}) => {
  const [selectedValue, setSelectedValue] = useState<string>(defaultText);
  const isControlled = value !== undefined;
  const selectValue = isControlled ? value : selectedValue;

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = event.target.value;
    if (!isControlled) setSelectedValue(newValue);
    onChange?.(newValue);
  };

  return (
    <div className='relative inline-flex w-full flex-col'>
      {label && <label className='mb-1 block text-sm text-gray-600'>{label}</label>}
      <div className='relative'>
        <select
          value={selectValue}
          onChange={handleChange}
          disabled={disabled}
          className={`h-9 w-full appearance-none rounded-md border border-gray-300 bg-zinc-100 py-2 pr-14 pl-4 text-sm font-normal text-gray-700 focus:border-indigo-600 focus:outline-none`}>
          <option value='' disabled hidden>
            {defaultText}
          </option>
          {options.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
        <FaCaretDown
          className={`absolute top-1/2 right-4 -translate-y-1/2 text-gray-500 ${
            selectValue ? 'text-indigo-600' : 'text-gray-500'
          } h-3 w-3`}
        />
      </div>
    </div>
  );
};

export default SelectInput;
