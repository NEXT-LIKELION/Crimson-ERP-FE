import React from 'react';
import TextInput from '../input/TextInput';
import SelectInput from '../input/SelectInput';
import CategorySelect from '../input/CategorySelect';
import PrimaryButton from '../button/PrimaryButton';
import { MdSearch, MdRefresh } from 'react-icons/md';

interface InputFieldProps {
  productName: string;
  onProductNameChange: (v: string) => void;
  bigCategory: string;
  onBigCategoryChange: (v: string) => void;
  middleCategory: string;
  onMiddleCategoryChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  bigCategoryOptions?: string[];
  middleCategoryOptions?: string[];
  categoryOptions?: string[];
  status: string;
  onStatusChange: (v: string) => void;
  onSearch: () => void;
  onReset: () => void;
}

const InputField: React.FC<InputFieldProps> = ({
  productName,
  onProductNameChange,
  bigCategory,
  onBigCategoryChange,
  middleCategory,
  onMiddleCategoryChange,
  category,
  onCategoryChange,
  bigCategoryOptions = [],
  middleCategoryOptions = [],
  categoryOptions = [],
  status,
  onStatusChange,
  onSearch,
  onReset,
}) => {
  // 엔터키 입력 시 검색 실행
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className='w-full rounded-lg bg-white p-4 shadow-md'>
      {/* 첫 번째 행: 상품명, 대분류, 중분류, 소분류, 상태 */}
      <div className='mb-4 flex space-x-4'>
        <div className='flex flex-col'>
          <p className='text-sm font-semibold text-gray-700'>상품명</p>
          <TextInput
            placeholder='상품명으로 검색'
            value={productName}
            onChange={onProductNameChange}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className='flex flex-col'>
          <p className='text-sm font-semibold text-gray-700'>대분류</p>
          <CategorySelect
            value={bigCategory}
            onChange={onBigCategoryChange}
            options={bigCategoryOptions}
            showCount={false}
          />
        </div>
        <div className='flex flex-col'>
          <p className='text-sm font-semibold text-gray-700'>중분류</p>
          <CategorySelect
            value={middleCategory}
            onChange={onMiddleCategoryChange}
            options={middleCategoryOptions}
            showCount={false}
          />
        </div>
        <div className='flex flex-col'>
          <p className='text-sm font-semibold text-gray-700'>소분류</p>
          <CategorySelect
            value={category}
            onChange={onCategoryChange}
            options={categoryOptions}
            showCount={false}
          />
        </div>
        <div className='flex flex-col'>
          <p className='text-sm font-semibold text-gray-700'>상태</p>
          <SelectInput
            defaultText='모든 상태'
            options={['모든 상태', '정상', '재고부족', '품절']}
            value={status}
            onChange={onStatusChange}
          />
        </div>
      </div>
      <div className='flex justify-end space-x-2'>
        <button
          onClick={onReset}
          className='inline-flex h-10 cursor-pointer items-center justify-center rounded-md bg-gray-200 px-4 py-2 text-sm leading-tight font-medium text-gray-700 transition-colors duration-200 ease-in-out hover:bg-gray-300 active:bg-gray-400'>
          <MdRefresh size={16} className='mr-2' />
          초기화
        </button>
        <PrimaryButton text='검색하기' icon={<MdSearch size={16} />} onClick={onSearch} />
      </div>
    </div>
  );
};

export default InputField;
