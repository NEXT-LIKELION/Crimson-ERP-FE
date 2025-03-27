import React from 'react';
import TextInput from '../input/TextInput';
import SearchInput from '../input/SearchInput';
import SelectInput from '../input/SelectInput';

const InputField: React.FC = () => {
    return (
        <div className="p-4 border border-gray-300 rounded-md w-full flex space-x-4">
            {/* 상품명 */}
            <div className="flex flex-col">
                <p className="text-sm font-semibold text-gray-700">상품명</p>
                <TextInput placeholder="상품명으로 검색" />
            </div>

            {/* 검색 필드 */}
            <div className="flex flex-col">
                <p className="text-sm font-semibold text-gray-700">검색 필드</p>
                <SearchInput placeholder="이름 또는 사번으로 검색" />
            </div>

            {/* 상태 필드 */}
            <div className="flex flex-col">
                <p className="text-sm font-semibold text-gray-700">상태</p>
                <SelectInput
                    defaultText="모든 상태"
                    options={['모든 상태', 'A', 'B', 'C']}
                    onChange={(value: string) => console.log('Selected status:', value)}
                />
            </div>

            {/* 기간 필드 */}
            <div className="flex flex-col">
                <p className="text-sm font-semibold text-gray-700">기간</p>
                <SelectInput
                    defaultText="전체 기간"
                    options={['전체 기간', 'B', 'C']}
                    onChange={(value: string) => console.log('Selected period:', value)}
                />
            </div>

            {/* 비활성화된 입력 필드 */}
            <div className="flex flex-col">
                <p className="text-sm font-semibold text-gray-700">제목</p>
                <TextInput placeholder="비활성화된 입력" disabled />
            </div>
        </div>
    );
};

export default InputField;
