import React from 'react';
import TextInput from '../input/TextInput';
import SearchInput from '../input/SearchInput';
import SelectInput from '../input/SelectInput';
import PrimaryButton from '../button/PrimaryButton';
import { MdSearch } from 'react-icons/md';

const InputField: React.FC = () => {
    return (
        <div className="p-4 bg-white shadow-md rounded-lg w-full flex flex-col space-y-4">
            {/* 입력 필드 (한 줄 정렬) */}
            <div className="flex space-x-4">
                <div className="flex flex-col">
                    <p className="text-sm font-semibold text-gray-700">상호명</p>
                    <TextInput placeholder="상호명으로 검색" />
                </div>

                <div className="flex flex-col">
                    <p className="text-sm font-semibold text-gray-700">상품명</p>
                    <TextInput placeholder="상품명으로 검색" />
                </div>

                <div className="flex flex-col">
                    <p className="text-sm font-semibold text-gray-700">상품코드</p>
                    <TextInput placeholder="상품코드로 검색" />
                </div>

                {/* <div className="flex flex-col">
                    <p className="text-sm font-semibold text-gray-700">검색 필드</p>
                    <SearchInput placeholder="이름 또는 사번으로 검색" />
                </div> */}

                <div className="flex flex-col">
                    <p className="text-sm font-semibold text-gray-700">상태</p>
                    <SelectInput
                        defaultText="모든 상태"
                        options={['모든 상태', '정상', '재고부족', '품절']}
                        onChange={(value) => console.log('Selected status:', value)}
                    />
                </div>

                <div className="flex flex-col">
                    <p className="text-sm font-semibold text-gray-700">카테고리</p>
                    <SelectInput
                        defaultText="모든 카테고리"
                        options={['모든 카테고리', '판촉물', '문구', '기념품']}
                        onChange={(value) => console.log('Selected status:', value)}
                    />
                </div>

                {/* <div className="flex flex-col">
                    <p className="text-sm font-semibold text-gray-700">기간</p>
                    <SelectInput
                        defaultText="전체 기간"
                        options={['전체 기간', 'B', 'C']}
                        onChange={(value) => console.log('Selected period:', value)}
                    />
                </div> */}

                {/* <div className="flex flex-col">
                    <p className="text-sm font-semibold text-gray-700">제목</p>
                    <TextInput placeholder="비활성화된 입력" disabled />
                </div> */}
            </div>
            {/* 버튼 (하단 우측) */}
            <div className="flex justify-end">
                <PrimaryButton text="검색하기" icon={<MdSearch size={16} />} />
            </div>
        </div>
    );
};

export default InputField;
