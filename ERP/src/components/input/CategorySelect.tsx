import React, { useState, useEffect, useRef } from 'react';
import { MdKeyboardArrowDown } from 'react-icons/md';

interface CategoryOption {
  value: string;
  label: string;
  count?: number;
}

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  searchable?: boolean;
  showCount?: boolean;
  disabled?: boolean;
  className?: string;
}

const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  onChange,
  options = [],
  placeholder = '카테고리 선택',
  searchable = false,
  showCount = false,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<CategoryOption[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 옵션 변환
  useEffect(() => {
    const categoryOptions: CategoryOption[] = [
      { value: '', label: '모든 카테고리' },
      ...options.map(option => ({
        value: option,
        label: option,
        count: showCount ? Math.floor(Math.random() * 100) : undefined, // 임시 카운트
      }))
    ];

    setFilteredOptions(categoryOptions);
  }, [options, showCount]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleOptionSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const displayValue = value || '모든 카테고리';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* 메인 버튼 */}
      <button
        type="button"
        className={`
          flex w-48 items-center justify-between rounded-md border px-3 py-2 text-left text-sm
          transition-colors duration-200 ease-in-out
          ${disabled
            ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
            : isOpen
              ? 'border-blue-500 bg-white ring-1 ring-blue-500'
              : 'border-gray-300 bg-white hover:border-gray-400'
          }
          text-gray-900
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className="block truncate">{displayValue}</span>
        <MdKeyboardArrowDown
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && !disabled && (
        <div className="absolute left-0 top-full z-50 mt-1 w-48 max-h-64 overflow-hidden rounded-md border border-gray-300 bg-white shadow-lg">
          {/* 옵션 리스트 */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={`${option.value}-${index}`}
                  type="button"
                  className={`
                    flex w-full items-center justify-between px-3 py-2 text-left text-sm
                    transition-colors duration-150 ease-in-out hover:bg-gray-50
                    ${value === option.value
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-900'
                    }
                  `}
                  onClick={() => handleOptionSelect(option.value)}
                >
                  <span className="block truncate">{option.label}</span>
                  {option.count !== undefined && (
                    <span className="ml-2 text-xs text-gray-500">
                      ({option.count}개)
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">
                카테고리가 없습니다.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategorySelect;