import React from 'react';
import TextInput from '../input/TextInput';
import SelectInput from '../input/SelectInput';
import PrimaryButton from '../button/PrimaryButton';
import { MdSearch, MdRefresh } from 'react-icons/md';

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
                <div className="flex flex-col">
                    <p className="text-sm font-semibold text-gray-700">판매합계</p>
                    <div className="flex items-center space-x-2">
                        <TextInput
                            placeholder="최소값"
                            type="number"
                            value={minSales}
                            onChange={onMinSalesChange}
                            onKeyDown={handleKeyDown}
                        />
                        <span className="text-gray-500">~</span>
                        <TextInput
                            placeholder="최대값"
                            type="number"
                            value={maxSales}
                            onChange={onMaxSalesChange}
                            onKeyDown={handleKeyDown}
                        />
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
