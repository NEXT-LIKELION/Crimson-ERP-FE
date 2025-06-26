import { useState, useEffect } from "react";
import Pagination from "../pagination/pagination";
import { MdOutlineEdit, MdOutlineDelete } from "react-icons/md";
import { MdFilterList, MdOutlineDownload } from "react-icons/md";
import { RxCaretSort } from "react-icons/rx";
import { useNavigate } from "react-router-dom";
import { Product } from "../../types/product";

// Custom type for table data with string variant_id
interface TableProduct extends Omit<Product, "variant_id"> {
    variant_id: string;
    orderCount: number;
    returnCount: number;
    totalSales: string;
}

// props 타입 추가
interface InventoryTableProps {
    inventories: Product[];
    onDelete: (productId: string) => Promise<void>;
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
    sortOrder: "asc" | "desc" | null;
    onSort: (key: keyof TableProduct) => void;
}) => (
    <th
        className="px-4 py-3 border-b border-gray-300 text-left cursor-pointer"
        onClick={() => onSort(sortKey)}
    >
        <div className="flex justify-between items-center w-full">
            <span>{label}</span>
            <RxCaretSort
                className={`transition ${
                    sortOrder ? "text-black" : "text-gray-400"
                }`}
            />
        </div>
    </th>
);

const InventoryTable = ({ inventories, onDelete }: InventoryTableProps) => {
    const navigate = useNavigate();
    const [data, setData] = useState<TableProduct[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{
        key: keyof TableProduct;
        order: "asc" | "desc" | null;
    }>({
        key: "product_id",
        order: null,
    });

    const itemsPerPage = 10;

    useEffect(() => {
        if (!Array.isArray(inventories)) return;
        const rows = inventories.flatMap((item) => {
            const variants = item.variants || [];
            return variants.map((variant) => ({
                ...item,
                option: variant.option,
                price: variant.price,
                stock: variant.stock,
                variant_id: variant.variant_code || "",
                orderCount: variant.order_count ?? 0,
                returnCount: variant.return_count ?? 0,
                totalSales:
                    variant.order_count &&
                    variant.return_count &&
                    variant.price &&
                    variant.order_count - variant.return_count > 0
                        ? `${
                              (variant.order_count - variant.return_count) *
                              variant.price
                          }원`
                        : "0원",
            }));
        });

        setData(rows);
    }, [inventories]);

    // 정렬 함수
    const handleSort = (key: keyof TableProduct) => {
        let order: "asc" | "desc" | null = "asc";
        if (sortConfig.key === key && sortConfig.order === "asc") {
            order = "desc";
        } else if (sortConfig.key === key && sortConfig.order === "desc") {
            order = null;
        }
        setSortConfig({ key, order });

        if (order) {
            const sortedData = [...data].sort((a, b) => {
                const aValue = a[key];
                const bValue = b[key];

                if (typeof aValue === "number" && typeof bValue === "number") {
                    return order === "asc" ? aValue - bValue : bValue - aValue;
                }

                return order === "asc"
                    ? String(aValue).localeCompare(String(bValue))
                    : String(bValue).localeCompare(String(aValue));
            });
            setData(sortedData);
        }
    };

    const paginatedData = data.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="p-6 bg-white shadow-md rounded-lg">
            {/* 헤더 */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold flex items-center">
                    상품별 재고 현황
                </h2>
                <div className="flex items-center space-x-3 text-gray-500">
                    <span className="text-sm">총 {data.length}개 상품</span>
                    <MdFilterList
                        className="cursor-pointer hover:text-gray-700"
                        size={20}
                        onClick={() => alert("필터 클릭")}
                    />
                    <MdOutlineDownload
                        className="cursor-pointer hover:text-gray-700"
                        size={20}
                        onClick={() => alert("다운로드 클릭")}
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
                                sortOrder={
                                    sortConfig.key === "product_id"
                                        ? sortConfig.order
                                        : null
                                }
                                onSort={handleSort}
                            />
                            <SortableHeader
                                label="품목코드"
                                sortKey="categoryCode"
                                sortOrder={
                                    sortConfig.key === "categoryCode"
                                        ? sortConfig.order
                                        : null
                                }
                                onSort={handleSort}
                            />
                            <SortableHeader
                                label="상품명"
                                sortKey="name"
                                sortOrder={
                                    sortConfig.key === "name"
                                        ? sortConfig.order
                                        : null
                                }
                                onSort={handleSort}
                            />
                            <th className="px-4 py-3 border-b border-gray-300">
                                옵션
                            </th>
                            <SortableHeader
                                label="판매가"
                                sortKey="price"
                                sortOrder={
                                    sortConfig.key === "price"
                                        ? sortConfig.order
                                        : null
                                }
                                onSort={handleSort}
                            />
                            <SortableHeader
                                label="재고(최소재고)"
                                sortKey="stock"
                                sortOrder={
                                    sortConfig.key === "stock"
                                        ? sortConfig.order
                                        : null
                                }
                                onSort={handleSort}
                            />
                            <th className="px-4 py-3 border-b border-gray-300">
                                결제수량
                            </th>
                            <th className="px-4 py-3 border-b border-gray-300">
                                환불수량
                            </th>
                            <SortableHeader
                                label="판매합계"
                                sortKey="totalSales"
                                sortOrder={
                                    sortConfig.key === "totalSales"
                                        ? sortConfig.order
                                        : null
                                }
                                onSort={handleSort}
                            />
                            <th className="px-4 py-3 border-b border-gray-300">
                                관리
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((product, index) => (
                            <tr
                                key={index}
                                className="bg-white border-b border-gray-200"
                            >
                                <td className="px-4 py-2">
                                    {product.product_id}
                                </td>
                                <td className="px-4 py-2">
                                    {product.variant_id}
                                </td>
                                <td className="px-4 py-2">{product.name}</td>
                                <td className="px-4 py-2">{product.option}</td>
                                <td className="px-4 py-2">{product.price}원</td>
                                <td className="px-4 py-2">{product.stock}EA</td>
                                <td className="px-4 py-2">
                                    {product.orderCount}개
                                </td>
                                <td className="px-4 py-2">
                                    {product.returnCount}개
                                </td>
                                <td className="px-4 py-2">
                                    {product.totalSales}
                                </td>
                                <td className="px-4 py-2 flex space-x-2">
                                    <MdOutlineEdit
                                        className="text-indigo-500 cursor-pointer"
                                        onClick={() => {
                                            navigate(
                                                `?edit=${product.variant_id}`
                                            );
                                        }}
                                    />
                                    <MdOutlineDelete
                                        className="text-red-500 cursor-pointer"
                                        onClick={() =>
                                            onDelete(product.variant_id)
                                        }
                                    />
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
