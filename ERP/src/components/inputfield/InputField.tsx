import React from 'react';
import TextInput from '../input/TextInput';
import SelectInput from '../input/SelectInput';
import PrimaryButton from '../button/PrimaryButton';
import { MdSearch } from 'react-icons/md';

interface InputFieldProps {
    productName: string;
    onProductNameChange: (v: string) => void;
    status: string;
    onStatusChange: (v: string) => void;
    onSearch: () => void;
}

const InputField: React.FC<InputFieldProps> = ({
    productName,
    onProductNameChange,
    status,
    onStatusChange,
    onSearch,
}) => (
    <div className="p-4 bg-white shadow-md rounded-lg w-full">
        <div className="flex space-x-4 mb-4">
            <div className="flex flex-col">
                <p className="text-sm font-semibold text-gray-700">상품명</p>
                <TextInput placeholder="상품명으로 검색" value={productName} onChange={onProductNameChange} />
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
        </div>
        <div className="flex justify-end">
            <PrimaryButton text="검색하기" icon={<MdSearch size={16} />} onClick={onSearch} />
        </div>
    </div>
);

export default InputField;
