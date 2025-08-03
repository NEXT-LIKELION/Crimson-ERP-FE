import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { FaHistory } from 'react-icons/fa';
import { useStockHistory } from '../../hooks/queries/useStockAdjustment';
import Pagination from '../pagination/pagination';

interface StockHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface StockAdjustment {
    id: number;
    variant_code: string;
    product_name: string;
    option: string;
    previous_stock: number;
    current_stock: number;
    change_amount: number;
    reason: string;
    updated_by: string;
    created_at: string;
}

const StockHistoryModal: React.FC<StockHistoryModalProps> = ({
    isOpen,
    onClose
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [variantCodeFilter, setVariantCodeFilter] = useState('');
    
    const { data: historyData, isLoading, error } = useStockHistory({
        page: currentPage,
        variant_code: variantCodeFilter || undefined
    });

    const adjustments: StockAdjustment[] = historyData?.results || [];
    const totalCount = historyData?.count || 0;
    const itemsPerPage = 20;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleSearch = () => {
        setCurrentPage(1);
    };

    const handleReset = () => {
        setVariantCodeFilter('');
        setCurrentPage(1);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl mx-4 max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-gray-300 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <FaHistory className="text-blue-500" />
                        <h2 className="text-lg font-semibold">재고 변경 이력</h2>
                    </div>
                    <button onClick={onClose}>
                        <FiX className="w-6 h-6 text-gray-500 hover:text-gray-700" />
                    </button>
                </div>

                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                품목코드로 검색
                            </label>
                            <input
                                type="text"
                                value={variantCodeFilter}
                                onChange={(e) => setVariantCodeFilter(e.target.value)}
                                placeholder="품목코드를 입력하세요"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <button
                                onClick={handleSearch}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                            >
                                검색
                            </button>
                            <button
                                onClick={handleReset}
                                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
                            >
                                초기화
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="text-gray-500">로딩 중...</div>
                        </div>
                    ) : error ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="text-red-500">데이터 로드 중 오류가 발생했습니다.</div>
                        </div>
                    ) : adjustments.length === 0 ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="text-gray-500">재고 변경 이력이 없습니다.</div>
                        </div>
                    ) : (
                        <div className="relative overflow-x-auto">
                            <table className="w-full text-sm text-gray-700 border-collapse">
                                <thead className="text-xs uppercase bg-gray-50 border-b border-gray-300">
                                    <tr>
                                        <th className="px-4 py-3 text-left">일시</th>
                                        <th className="px-4 py-3 text-left">품목코드</th>
                                        <th className="px-4 py-3 text-left">상품명</th>
                                        <th className="px-4 py-3 text-left">옵션</th>
                                        <th className="px-4 py-3 text-center">이전 재고</th>
                                        <th className="px-4 py-3 text-center">현재 재고</th>
                                        <th className="px-4 py-3 text-center">변경량</th>
                                        <th className="px-4 py-3 text-left">사유</th>
                                        <th className="px-4 py-3 text-left">담당자</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {adjustments.map((adjustment, index) => (
                                        <tr
                                            key={adjustment.id}
                                            className={`border-b border-gray-200 ${
                                                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                            }`}
                                        >
                                            <td className="px-4 py-3 text-sm">
                                                {formatDate(adjustment.created_at)}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium">
                                                {adjustment.variant_code}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {adjustment.product_name}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {adjustment.option}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-center">
                                                {adjustment.previous_stock}EA
                                            </td>
                                            <td className="px-4 py-3 text-sm text-center">
                                                {adjustment.current_stock}EA
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span
                                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                        adjustment.change_amount > 0
                                                            ? 'bg-green-100 text-green-800'
                                                            : adjustment.change_amount < 0
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}
                                                >
                                                    {adjustment.change_amount > 0 ? '+' : ''}
                                                    {adjustment.change_amount}EA
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {adjustment.reason}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {adjustment.updated_by}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {totalCount > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                                총 {totalCount.toLocaleString()}건의 재고 변경 이력
                            </div>
                            <Pagination
                                currentPage={currentPage}
                                totalItems={totalCount}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockHistoryModal;