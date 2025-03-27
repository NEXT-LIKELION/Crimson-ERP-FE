import React from 'react';
import { MdOutlineEdit, MdOutlineHistory } from 'react-icons/md';

interface Product {
    productCode: string;
    categoryCode: string;
    name: string;
    option: string;
    price: string;
    stock: number;
    orderCount: number;
    returnCount: number;
    salesCount: number;
    totalSales: string;
    actions?: React.ReactNode;
}

interface TableProps {
    data: Product[];
    columns: { key: string; label: string }[];
}

const Table: React.FC<TableProps> = ({ data, columns }) => {
    return (
        <div className="relative overflow-x-auto sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500 border-collapse">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key} className="px-4 py-3 border">
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((product, index) => (
                        <tr key={index} className="bg-white border-b">
                            {columns.map((col) => (
                                <td key={col.key} className="px-4 py-2 border">
                                    {col.key === 'actions' ? (
                                        <div className="flex space-x-2">
                                            <MdOutlineEdit
                                                className="text-indigo-500 cursor-pointer"
                                                onClick={() => alert('수정 클릭')}
                                            />
                                            <MdOutlineHistory
                                                className="text-indigo-500 cursor-pointer"
                                                onClick={() => alert('조회 클릭')}
                                            />
                                        </div>
                                    ) : (
                                        (product as any)[col.key] // 동적 키 접근
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
