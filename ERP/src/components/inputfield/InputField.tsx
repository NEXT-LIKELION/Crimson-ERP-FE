import React, { useState, useEffect } from "react";
import TextInput from "../input/TextInput";
import SelectInput from "../input/SelectInput";
import PrimaryButton from "../button/PrimaryButton";
import { MdSearch, MdRefresh } from "react-icons/md";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

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
    categoryOptions = ["모든 카테고리", "일반", "특가", "한정판"],
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
    const [salesSliderValues, setSalesSliderValues] = useState<[number, number]>([0, 5000000]);
    const [stockSliderValues, setStockSliderValues] = useState<[number, number]>([0, 1000]);

    // props의 minSales, maxSales가 변경될 때 슬라이더 값 동기화
    useEffect(() => {
        const min = minSales ? parseInt(minSales) : 0;
        const max = maxSales ? parseInt(maxSales) : 5000000;
        setSalesSliderValues([min, max]);
    }, [minSales, maxSales]);

    // props의 minStock, maxStock이 변경될 때 슬라이더 값 동기화
    useEffect(() => {
        const min = minStock ? parseInt(minStock) : 0;
        const max = maxStock ? parseInt(maxStock) : 1000;
        setStockSliderValues([min, max]);
    }, [minStock, maxStock]);

    // 엔터키 입력 시 검색 실행
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            onSearch();
        }
    };

    // 판매합계 슬라이더 값 변경 핸들러
    const handleSalesSliderChange = (value: number | number[]) => {
        const [min, max] = value as number[];
        setSalesSliderValues([min, max]);
        onMinSalesChange(min.toString());
        onMaxSalesChange(max.toString());
    };

    // 재고수량 슬라이더 값 변경 핸들러
    const handleStockSliderChange = (value: number | number[]) => {
        const [min, max] = value as number[];
        setStockSliderValues([min, max]);
        onMinStockChange(min.toString());
        onMaxStockChange(max.toString());
    };

    return (
        <div className="p-4 bg-white shadow-md rounded-lg w-full">
            {/* 첫 번째 행: 상품명, 카테고리, 상태 */}
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
                    <p className="text-sm font-semibold text-gray-700">카테고리</p>
                    <SelectInput
                        defaultText="모든 카테고리"
                        options={categoryOptions}
                        value={category}
                        onChange={onCategoryChange}
                    />
                </div>
                <div className="flex flex-col">
                    <p className="text-sm font-semibold text-gray-700">상태</p>
                    <SelectInput
                        defaultText="모든 상태"
                        options={["모든 상태", "정상", "재고부족", "품절"]}
                        value={status}
                        onChange={onStatusChange}
                    />
                </div>
            </div>
            
            {/* 두 번째 행: 재고수량 슬라이더, 판매합계 슬라이더 */}
            <div className="flex space-x-6 mb-4">
                <div className="flex flex-col w-72">
                    <p className="text-sm font-semibold text-gray-700 mb-1">재고수량</p>
                    <Slider
                        range
                        min={0}
                        max={1000}
                        step={10}
                        value={stockSliderValues}
                        onChange={handleStockSliderChange}
                        trackStyle={[{ backgroundColor: "#10b981" }]} // 초록색
                        handleStyle={[
                            { borderColor: "#10b981", backgroundColor: "#10b981" },
                            { borderColor: "#10b981", backgroundColor: "#10b981" },
                        ]}
                    />
                    <div className="flex justify-between text-sm text-gray-600 mt-1 px-1">
                        <span>{stockSliderValues[0]}개</span>
                        <span>{stockSliderValues[1]}개</span>
                    </div>
                </div>
                <div className="flex flex-col w-72">
                    <p className="text-sm font-semibold text-gray-700 mb-1">판매합계</p>
                    <Slider
                        range
                        min={0}
                        max={5000000}
                        step={10000}
                        value={salesSliderValues}
                        onChange={handleSalesSliderChange}
                        trackStyle={[{ backgroundColor: "#2563eb" }]} // 파란색
                        handleStyle={[
                            { borderColor: "#2563eb", backgroundColor: "#2563eb" },
                            { borderColor: "#2563eb", backgroundColor: "#2563eb" },
                        ]}
                    />
                    <div className="flex justify-between text-sm text-gray-600 mt-1 px-1">
                        <span>{salesSliderValues[0].toLocaleString()}원</span>
                        <span>{salesSliderValues[1].toLocaleString()}원</span>
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
