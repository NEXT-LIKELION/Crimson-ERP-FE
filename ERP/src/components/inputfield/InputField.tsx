import React, { useState, useEffect } from 'react';
import TextInput from '../input/TextInput';
import SelectInput from '../input/SelectInput';
import PrimaryButton from '../button/PrimaryButton';
import { MdSearch, MdRefresh } from 'react-icons/md';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

// 슬라이더 범위 상수
const SLIDER_CONFIG = {
  STOCK: { min: 0, max: 1000 },
  SALES: { min: 0, max: 5000000 },
} as const;

interface InputFieldProps {
  productName: string;
  onProductNameChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  categoryOptions?: string[];
  status: string;
  onStatusChange: (v: string) => void;
  minStock: string;
  onMinStockChange: (v: string) => void;
  maxStock: string;
  onMaxStockChange: (v: string) => void;
  minSales: string;
  onMinSalesChange: (v: string) => void;
  maxSales: string;
  onMaxSalesChange: (v: string) => void;
  onSearch: () => void;
  onReset: () => void;
}

const InputField: React.FC<InputFieldProps> = ({
  productName,
  onProductNameChange,
  category,
  onCategoryChange,
  categoryOptions = ['모든 카테고리', '일반', '특가', '한정판'],
  status,
  onStatusChange,
  minStock,
  onMinStockChange,
  maxStock,
  onMaxStockChange,
  minSales,
  onMinSalesChange,
  maxSales,
  onMaxSalesChange,
  onSearch,
  onReset,
}) => {
  // 슬라이더의 내부 상태 관리
  const [salesSliderValues, setSalesSliderValues] = useState<[number, number]>([
    SLIDER_CONFIG.SALES.min,
    SLIDER_CONFIG.SALES.max,
  ]);
  const [stockSliderValues, setStockSliderValues] = useState<[number, number]>([
    SLIDER_CONFIG.STOCK.min,
    SLIDER_CONFIG.STOCK.max,
  ]);

  // 컴포넌트 마운트 시에만 초기화
  useEffect(() => {
    const minSalesVal = parseInt(minSales) || SLIDER_CONFIG.SALES.min;
    const maxSalesVal = parseInt(maxSales) || SLIDER_CONFIG.SALES.max;
    const minStockVal = parseInt(minStock) || SLIDER_CONFIG.STOCK.min;
    const maxStockVal = parseInt(maxStock) || SLIDER_CONFIG.STOCK.max;

    setSalesSliderValues([minSalesVal, maxSalesVal]);
    setStockSliderValues([minStockVal, maxStockVal]);
  }, [minSales, maxSales, minStock, maxStock]); // props가 변경될 때마다 초기화

  // 엔터키 입력 시 검색 실행
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  // 판매합계 슬라이더 값 변경 핸들러 (드래그 중에는 UI만 업데이트)
  const handleSalesSliderChange = (value: number[]) => {
    const [min, max] = value;
    setSalesSliderValues([min, max]);
    // 드래그 중에는 부모에게 전달하지 않음 (UI만 업데이트)
  };
  const handleSalesSliderAfterChange = (value: number[]) => {
    // 드래그 완료 후에만 부모에게 변경사항 전달
    const [min, max] = value;
    onMinSalesChange(min.toString());
    onMaxSalesChange(max.toString());
  };

  // 재고수량 슬라이더 값 변경 핸들러 (드래그 중에는 UI만 업데이트)
  const handleStockSliderChange = (value: number[]) => {
    const [min, max] = value;
    setStockSliderValues([min, max]);
    // 드래그 중에는 부모에게 전달하지 않음 (UI만 업데이트)
  };
  const handleStockSliderAfterChange = (value: number[]) => {
    // 드래그 완료 후에만 부모에게 변경사항 전달
    const [min, max] = value;
    onMinStockChange(min.toString());
    onMaxStockChange(max.toString());
  };

  return (
    <div className='w-full rounded-lg bg-white p-4 shadow-md'>
      {/* 첫 번째 행: 상품명, 카테고리, 상태 */}
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
          <p className='text-sm font-semibold text-gray-700'>카테고리</p>
          <SelectInput
            defaultText='모든 카테고리'
            options={categoryOptions}
            value={category}
            onChange={onCategoryChange}
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

      {/* 두 번째 행: 재고수량 슬라이더, 판매합계 슬라이더 */}
      <div className='mb-4 flex space-x-6'>
        <div className='flex w-72 flex-col'>
          <p className='mb-1 text-sm font-semibold text-gray-700'>재고수량</p>
          <Slider
            range
            min={SLIDER_CONFIG.STOCK.min}
            max={SLIDER_CONFIG.STOCK.max}
            step={10}
            value={stockSliderValues}
            onChange={handleStockSliderChange as (value: number | number[]) => void}
            onChangeComplete={handleStockSliderAfterChange as (value: number | number[]) => void}
            allowCross={false}
            pushable={0}
            trackStyle={[
              {
                backgroundColor: '#10b981',
                left: `${(stockSliderValues[0] / SLIDER_CONFIG.STOCK.max) * 100}%`,
                width: `${((stockSliderValues[1] - stockSliderValues[0]) / SLIDER_CONFIG.STOCK.max) * 100}%`,
              },
            ]}
            railStyle={{ backgroundColor: '#e5e7eb' }}
            handleStyle={[
              { borderColor: '#10b981', backgroundColor: '#10b981' },
              { borderColor: '#10b981', backgroundColor: '#10b981' },
            ]}
          />
          <div className='mt-1 flex justify-between px-1 text-sm text-gray-600'>
            <span>{stockSliderValues[0]}개</span>
            <span>{stockSliderValues[1]}개</span>
          </div>
        </div>
        <div className='flex w-72 flex-col'>
          <p className='mb-1 text-sm font-semibold text-gray-700'>판매합계</p>
          <Slider
            range
            min={SLIDER_CONFIG.SALES.min}
            max={SLIDER_CONFIG.SALES.max}
            step={10000}
            value={salesSliderValues}
            onChange={handleSalesSliderChange as (value: number | number[]) => void}
            onChangeComplete={handleSalesSliderAfterChange as (value: number | number[]) => void}
            trackStyle={[
              {
                backgroundColor: '#2563eb',
                left: `${(salesSliderValues[0] / SLIDER_CONFIG.SALES.max) * 100}%`,
                width: `${((salesSliderValues[1] - salesSliderValues[0]) / SLIDER_CONFIG.SALES.max) * 100}%`,
              },
            ]}
            railStyle={{ backgroundColor: '#e5e7eb' }}
            handleStyle={[
              { borderColor: '#2563eb', backgroundColor: '#2563eb' },
              { borderColor: '#2563eb', backgroundColor: '#2563eb' },
            ]}
          />
          <div className='mt-1 flex justify-between px-1 text-sm text-gray-600'>
            <span>{salesSliderValues[0].toLocaleString()}원</span>
            <span>{salesSliderValues[1].toLocaleString()}원</span>
          </div>
        </div>
      </div>
      <div className='flex justify-end space-x-2'>
        <button
          onClick={() => {
            // 슬라이더 먼저 리셋
            setSalesSliderValues([SLIDER_CONFIG.SALES.min, SLIDER_CONFIG.SALES.max]);
            setStockSliderValues([SLIDER_CONFIG.STOCK.min, SLIDER_CONFIG.STOCK.max]);
            // 그 다음 부모 컴포넌트 리셋
            onReset();
          }}
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
