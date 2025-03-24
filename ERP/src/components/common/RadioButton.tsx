import React from 'react';

interface RadioButtonProps {
  label: string;
  value: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
}

const RadioButton: React.FC<RadioButtonProps> = ({ label, value, checked, disabled = false, onChange }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      onChange(event.target.value);  // 부모로 상태 전달
    }
  };

  return (
    <label className="inline-flex items-center space-x-2 font-inter">
      <input
        type="radio"
        value={value}
        checked={checked}  // 상태 기반으로 체크 여부 설정
        disabled={disabled}
        onChange={handleChange}  // onChange로 상태 관리
        className={`
          w-4 h-4 rounded-full
          border border-neutral-500
          text-indigo-600
          accent-indigo-600
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

export default RadioButton;
