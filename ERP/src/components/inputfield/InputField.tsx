import React from 'react';
import TextInput from '../input/TextInput';
import SelectInput from '../input/SelectInput';
import PrimaryButton from '../button/PrimaryButton';
import { MdSearch, MdRefresh } from 'react-icons/md';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

interface InputFieldProps {
    productName: string;
    onProductNameChange: (v: string) => void;
    status: string;
    onStatusChange: (v: string) => void;
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
    status,
    onStatusChange,
    minSales,
    onMinSalesChange,
    maxSales,
    onMaxSalesChange,
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
        <div className="p-4 bg-white shadow-md rounded-lg w-full">
            <div className="flex space-x-4 mb-4">
                <div className="flex flex-col">
                    <p className="text-sm font-semibold text-gray-700">상품명</p>
                    <TextInput
                        placeholder="상품명으로 검색"
                        value={productName}
                        onChange={onProductNameChange}
                        onKeyDown={handleKeyDown}
                    />
                </div>
                <div className="flex flex-col">
                    <p className="text-sm font-semibold text-gray-700">상태</p>
                    <SelectInput
                        defaultText="모든 상태"
                        options={['모든 상태', '정상', '재고부족', '품절']}
                        value={status}
                        onChange={onStatusChange}
                    />
                </div>
                <div className="flex flex-col w-72">
                    <p className="text-sm font-semibold text-gray-700 mb-1">판매합계</p>
                    <Slider
                        range
                        min={0}
                        max={1000000}
                        step={10000}
                        defaultValue={[Number(minSales), Number(maxSales)]}
                        onChange={(value) => {
                            const [min, max] = value as number[];
                            onMinSalesChange(min.toString());
                            onMaxSalesChange(max.toString());
                        }}
                        trackStyle={[{ backgroundColor: '#2563eb' }]} // 파란색
                        handleStyle={[
                            { borderColor: '#2563eb', backgroundColor: '#2563eb' },
                            { borderColor: '#2563eb', backgroundColor: '#2563eb' },
                        ]}
                    />
                    <div className="flex justify-between text-sm text-gray-600 mt-1 px-1">
                        <span>{Number(minSales).toLocaleString()}원</span>
                        <span>{Number(maxSales).toLocaleString()}원</span>
                    </div>
                </div>
            </div>
            <div className="flex justify-end space-x-2">
                <button
                    onClick={onReset}
                    className="inline-flex items-center justify-center h-10 px-4 py-2 rounded-md text-gray-700 text-sm font-medium leading-tight bg-gray-200 hover:bg-gray-300 active:bg-gray-400 transition-colors duration-200 ease-in-out cursor-pointer"
                >
                    <MdRefresh size={16} className="mr-2" />
                    초기화
                </button>
                <PrimaryButton text="검색하기" icon={<MdSearch size={16} />} onClick={onSearch} />
            </div>
        </div>
    );
};

export default InputField;
