import React, { useState } from 'react';

interface CheckboxProps {
  label: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, defaultChecked = false, disabled = false, onChange }) => {
  const [checked, setChecked] = useState(defaultChecked);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;
    setChecked(isChecked);  // 상태 업데이트
    onChange?.(isChecked);  // 부모로 상태 전달
  };

  return (
    <label className="inline-flex items-center space-x-2 font-inter">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={handleChange}  // onChange로 상태 관리
        className={`
          w-4 h-4 rounded-sm
          border border-neutral-500
          accent-indigo-600
          text-indigo-600
          focus:ring-indigo-600
          disabled:cursor-not-allowed
          disabled:opacity-50
          focus:ring-0
        `}
      />
      <span className={`
        text-sm
        ${disabled ? 'text-gray-400' : 'text-gray-700'}
      `}>
        {label}
      </span>
    </label>
  );
};

export default Checkbox;