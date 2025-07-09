import { useState, useEffect } from 'react';
import Pagination from '../pagination/pagination';
import { MdOutlineEdit, MdOutlineDelete } from 'react-icons/md';
import { MdFilterList, MdOutlineDownload } from 'react-icons/md';
import { RxCaretSort } from 'react-icons/rx';
import { useNavigate } from 'react-router-dom';
import { Product } from '../../types/product';
import { MdRestore } from 'react-icons/md';

// Custom type for table data with string variant_id
interface TableProduct extends Omit<Product, 'variant_id'> {
    variant_id: string;
    orderCount: number;
    returnCount: number;
    totalSales: string;
    status: string; // 상태 필드 추가 (정상, 재고부족, 품절)
}

interface InventoryTableProps {
    inventories: Product[];
    onDelete: (productId: string) => Promise<void>;
    filters?: {
        productName?: string;
        status?: string;
        minSales?: string;
        maxSales?: string;
    };
    deletedVariant?: Product | null;
    onUndoDelete?: () => void;
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

const InventoryTable = ({ inventories, onDelete, filters, deletedVariant, onUndoDelete }: InventoryTableProps) => {
    const navigate = useNavigate();
    const [data, setData] = useState<TableProduct[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
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

        let rows = inventories.flatMap((item) => {
            const variants = item.variants || [];
            return variants.map((variant) => {
                const stock = variant.stock;
                const minStock = variant.min_stock || 0;

                // 상태 계산: 품절 > 재고부족 > 정상
                let status = '정상';
                if (stock === 0) {
                    status = '품절';
                } else if (stock < minStock) {
                    status = '재고부족';
                }

                const row = {
                    ...item,
                    option: variant.option,
                    price: variant.price,
                    stock: variant.stock,
                    cost_price: variant.cost_price || 0, // 원가 데이터가 없는 경우 0으로 설정
                    min_stock: variant.min_stock || 0, // 최소재고가 없는 경우 0으로 설정
                    variant_id: variant.variant_code || '',
                    orderCount: variant.order_count ?? 0,
                    returnCount: variant.return_count ?? 0,
                    totalSales: variant.sales ? `${variant.sales.toLocaleString()}원` : '0원', // 새로운 sales 필드 사용
                    status: status, // 계산된 상태 추가
                };
                console.log(
                    'row 생성 - product_id:',
                    item.product_id,
                    'variant_code:',
                    variant.variant_code,
                    'min_stock:',
                    row.min_stock,
                    'sales:',
                    variant.sales,
                    'status:',
                    status
                );
                return row;
            });
        });

        // 필터링 적용
        if (filters) {
            rows = rows.filter((row) => {
                // 상품명 필터
                if (filters.productName && !row.name.toLowerCase().includes(filters.productName.toLowerCase())) {
                    return false;
                }

                // 상태 필터
                if (filters.status && filters.status !== '모든 상태') {
                    if (filters.status === '재고부족' && row.status !== '재고부족') {
                        return false;
                    }
                    if (filters.status === '품절' && row.status !== '품절') {
                        return false;
                    }
                    if (filters.status === '정상' && row.status !== '정상') {
                        return false;
                    }
                }

                // 판매합계 필터
                if (filters.minSales || filters.maxSales) {
                    const salesValue = Number(row.totalSales.replace(/[^\d]/g, '')) || 0;
                    const minSalesValue = parseInt(filters.minSales || '0') || 0;
                    const maxSalesValue = parseInt(filters.maxSales || '1000000') || 1000000;

                    // 기본값(0, 1000000)이 아닌 경우에만 필터링 적용
                    if (!(minSalesValue === 0 && maxSalesValue === 1000000)) {
                        if (salesValue < minSalesValue || salesValue > maxSalesValue) {
                            return false;
                        }
                    }
                }

                return true;
            });
        }

        console.log('InventoryTable - mapped data:', rows);
        setData(rows);
    }, [inventories, filters]);

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

    const paginatedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="p-6 bg-white shadow-md rounded-lg">
            {/* 헤더 */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold flex items-center">상품별 재고 현황</h2>
                <div className="flex items-center space-x-3 text-gray-500">
                    <span className="text-sm">총 {data.length}개 상품</span>
                    <MdFilterList
                        className="cursor-pointer hover:text-gray-700"
                        size={20}
                        onClick={() => alert('필터 클릭')}
                    />
                    <MdOutlineDownload
                        className="cursor-pointer hover:text-gray-700"
                        size={20}
                        onClick={() => alert('다운로드 클릭')}
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
                                <td className="px-4 py-2">{product.option}</td>
                                <td className="px-4 py-2">{Number(product.price).toLocaleString()}원</td>
                                <td className="px-4 py-2">{Number(product.cost_price).toLocaleString()}원</td>
                                <td className="px-4 py-2">
                                    {product.stock}EA ({product.min_stock !== undefined ? product.min_stock : '-'})
                                </td>
                                <td className="px-4 py-2">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                                <td className="px-4 py-2 flex space-x-2 items-center">
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
                                    {String(deletedVariant?.variant_id) === product.variant_id && (
                                        <MdRestore
                                            className="text-yellow-600 cursor-pointer"
                                            onClick={onUndoDelete}
                                            title="삭제 취소"
                                        />
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pagination
                currentPage={currentPage}
                totalItems={data.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
            />
        </div>
    );
};

export default InventoryTable;
