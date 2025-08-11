import { useState, useEffect } from 'react';
import Pagination from '../pagination/pagination';
import { MdOutlineEdit, MdOutlineDelete } from 'react-icons/md';
import { MdFilterList, MdOutlineDownload } from 'react-icons/md';
import { RxCaretSort } from 'react-icons/rx';
import { useNavigate } from 'react-router-dom';
import { Product } from '../../types/product';

// Custom type for table data with string variant_id
interface TableProduct extends Omit<Product, 'variant_id'> {
    variant_id: string;
    orderCount: number;
    returnCount: number;
    totalSales: string;
    status: string;
    category: string;
}

interface InventoryTableProps {
    inventories: Product[];
    onDelete: (productId: string) => Promise<void>;
    pagination?: {
        count: number;
        next: string | null;
        previous: string | null;
    };
    currentPage: number;
    onPageChange: (page: number) => void;
    onExportToExcel: () => void;
}

// 정렬 가능한 헤더 컴포넌트
const SortableHeader = ({
    label,
    sortKey,
    sortOrder,
    onSort,
}: {
    label: string;
    sortKey: keyof TableProduct;
    sortOrder: 'asc' | 'desc' | null;
    onSort: (key: keyof TableProduct) => void;
}) => (
    <th className="px-4 py-3 border-b border-gray-300 text-left cursor-pointer" onClick={() => onSort(sortKey)}>
        <div className="flex justify-between items-center w-full">
            <span>{label}</span>
            <RxCaretSort className={`transition ${sortOrder ? 'text-black' : 'text-gray-400'}`} />
        </div>
    </th>
);

const InventoryTable = ({
    inventories,
    onDelete,
    pagination,
    currentPage = 1,
    onPageChange,
    onExportToExcel,
}: InventoryTableProps) => {
    const navigate = useNavigate();
    const [data, setData] = useState<TableProduct[]>([]);
    const [sortConfig, setSortConfig] = useState<{
        key: keyof TableProduct;
        order: 'asc' | 'desc' | null;
    }>({
        key: 'product_id',
        order: null,
    });

    const itemsPerPage = 10;

    useEffect(() => {
        if (!Array.isArray(inventories)) return;
        console.log('InventoryTable - inventories changed:', inventories.length);

        // 백엔드에서 이미 필터링된 데이터를 직접 받아서 상태만 계산
        const rows = inventories.map((item) => {
            const stock = Number(item.stock) || 0;
            const minStock = Number(item.min_stock) || 0;

            // 상태 계산: 품절 > 재고부족 > 정상
            let status = '정상';
            if (stock === 0) {
                status = '품절';
            } else if (stock && stock < minStock) {
                status = '재고부족';
            }

            const row = {
                ...item,
                cost_price: item.cost_price || 0,
                min_stock: minStock,
                variant_id: item.variant_code || '',
                orderCount: item.order_count ?? 0,
                returnCount: item.return_count ?? 0,
                totalSales: item.sales ? `${item.sales.toLocaleString()}원` : '0원',
                status: status,
                category: item.category || '',
                stock,
            };
            return row;
        });

        console.log('InventoryTable - mapped data:', rows);
        setData(rows);
    }, [inventories]);

    // 정렬 함수
    const handleSort = (key: keyof TableProduct) => {
        let order: 'asc' | 'desc' | null = 'asc';
        if (sortConfig.key === key && sortConfig.order === 'asc') {
            order = 'desc';
        } else if (sortConfig.key === key && sortConfig.order === 'desc') {
            order = null;
        }
        setSortConfig({ key, order });

        if (order) {
            const sortedData = [...data].sort((a, b) => {
                const aValue = a[key];
                const bValue = b[key];

                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return order === 'asc' ? aValue - bValue : bValue - aValue;
                }

                return order === 'asc'
                    ? String(aValue).localeCompare(String(bValue))
                    : String(bValue).localeCompare(String(aValue));
            });
            setData(sortedData);
        }
    };

    // 백엔드에서 이미 페이지네이션된 데이터를 받으므로 슬라이싱하지 않음
    const paginatedData = data;

    return (
        <div className="p-6 bg-white shadow-md rounded-lg">
            {/* 헤더 */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold flex items-center">상품별 재고 현황</h2>
                <div className="flex items-center space-x-3 text-gray-500">
                    <span className="text-sm">총 {pagination?.count ?? data.length}개 상품</span>
                    <MdFilterList
                        className="cursor-pointer hover:text-gray-700"
                        size={20}
                        onClick={() => alert('필터 클릭')}
                    />
                    <MdOutlineDownload
                        className="cursor-pointer hover:text-gray-700"
                        size={20}
                        onClick={onExportToExcel || (() => alert('Export 기능이 연결되지 않았습니다.'))}
                    />
                </div>
            </div>

            {/* 테이블 */}
            <div className="relative overflow-x-auto sm:rounded-lg">
                <table className="w-full text-sm text-gray-700 border-collapse">
                    <thead className="text-xs uppercase bg-gray-50 border-b border-gray-300">
                        <tr>
                            <SortableHeader
                                label="상품코드"
                                sortKey="product_id"
                                sortOrder={sortConfig.key === 'product_id' ? sortConfig.order : null}
                                onSort={handleSort}
                            />
                            <SortableHeader
                                label="품목코드"
                                sortKey="variant_id"
                                sortOrder={sortConfig.key === 'variant_id' ? sortConfig.order : null}
                                onSort={handleSort}
                            />
                            <SortableHeader
                                label="상품명"
                                sortKey="name"
                                sortOrder={sortConfig.key === 'name' ? sortConfig.order : null}
                                onSort={handleSort}
                            />
                            <SortableHeader
                                label="카테고리"
                                sortKey="category"
                                sortOrder={sortConfig.key === 'category' ? sortConfig.order : null}
                                onSort={handleSort}
                            />
                            <th className="px-4 py-3 border-b border-gray-300">옵션</th>
                            <SortableHeader
                                label="판매가"
                                sortKey="price"
                                sortOrder={sortConfig.key === 'price' ? sortConfig.order : null}
                                onSort={handleSort}
                            />
                            <SortableHeader
                                label="매입가"
                                sortKey="cost_price"
                                sortOrder={sortConfig.key === 'cost_price' ? sortConfig.order : null}
                                onSort={handleSort}
                            />
                            <SortableHeader
                                label="재고(최소재고)"
                                sortKey="stock"
                                sortOrder={sortConfig.key === 'stock' ? sortConfig.order : null}
                                onSort={handleSort}
                            />
                            <SortableHeader
                                label="상태"
                                sortKey="status"
                                sortOrder={sortConfig.key === 'status' ? sortConfig.order : null}
                                onSort={handleSort}
                            />
                            <th className="px-4 py-3 border-b border-gray-300">결제수량</th>
                            <th className="px-4 py-3 border-b border-gray-300">환불수량</th>
                            <SortableHeader
                                label="판매합계"
                                sortKey="totalSales"
                                sortOrder={sortConfig.key === 'totalSales' ? sortConfig.order : null}
                                onSort={handleSort}
                            />
                            <th className="px-4 py-3 border-b border-gray-300">관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((product, index) => (
                            <tr
                                key={index}
                                className={`border-b border-gray-200 ${
                                    Number(product.stock) < Number(product.min_stock) ? 'bg-red-50' : 'bg-white'
                                }`}
                            >
                                <td className="px-4 py-2">{product.product_id}</td>
                                <td className="px-4 py-2">{product.variant_id}</td>
                                <td className="px-4 py-2">{product.name}</td>
                                <td className="px-4 py-2">{product.category}</td>
                                <td className="px-4 py-2">{product.option}</td>
                                <td className="px-4 py-2">{Number(product.price).toLocaleString()}원</td>
                                <td className="px-4 py-2">{Number(product.cost_price).toLocaleString()}원</td>
                                <td className="px-4 py-2">
                                    {product.stock}EA ({product.min_stock !== undefined ? product.min_stock : '-'})
                                </td>
                                <td className="px-4 py-2">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                            product.status === '품절'
                                                ? 'bg-red-100 text-red-800'
                                                : product.status === '재고부족'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-green-100 text-green-800'
                                        }`}
                                    >
                                        {product.status}
                                    </span>
                                </td>
                                <td className="px-4 py-2">{product.orderCount}개</td>
                                <td className="px-4 py-2">{product.returnCount}개</td>
                                <td className="px-4 py-2">{product.totalSales}</td>
                                <td className="px-4 py-2 align-middle text-center">
                                    <div className="inline-flex items-center justify-center gap-2">
                                        <MdOutlineEdit
                                            className="text-indigo-500 cursor-pointer"
                                            onClick={() => {
                                                navigate(`?edit=${product.variant_id}`);
                                            }}
                                        />
                                        <MdOutlineDelete
                                            className="text-red-500 cursor-pointer"
                                            onClick={() => onDelete(product.variant_id)}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {pagination && onPageChange && (
                <Pagination
                    currentPage={currentPage}
                    totalItems={pagination.count}
                    itemsPerPage={itemsPerPage}
                    onPageChange={onPageChange}
                />
            )}
        </div>
    );
};

export default InventoryTable;
