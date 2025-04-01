import React from 'react';
import {useState} from 'react';
import { MdOutlineEdit, MdOutlineHistory } from 'react-icons/md';
import StatusBadge from '../common/StatusBadge'

// 데이터 행의 타입 정의
interface TableRow {
    [key: string]: string | boolean;
}

interface TableProps {
    columns: string[];
    data: TableRow[];
}

//재고 수치 - 배지 색상 매핑함수
const mapStockBadge = (stockStr: string) : 'rejected' | 'pending' | 'neutral' => {
    const [current, max] = stockStr.split('/').map(s => parseInt(s.trim()));
    const ratio = current / max;

    if (ratio <= 0.2) return 'rejected';
    if (ratio <= 0.5) return 'pending';
    return 'neutral';
}

//상태 배지 색상 지정
const mapStatusToBadge = (status: string): 'pending' | 'approved' | 'active' | 'neutral' => {
    switch (status) {
        case '승인 대기':
            return 'pending';
        case '승인됨':
            return 'approved';
        case '입고 완료':
            return 'active';
        default:
            return 'neutral';
    }
};

const Table: React.FC<TableProps> = ({ columns, data }) => {
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);

    // 행 배경색을 결정하는 함수
    const getRowBackgroundColor = (index: number, row: TableRow): string => {
        // 호버 상태인 경우
        if (hoveredRow === index) {
            return 'bg-[#F9FAFB]';
        }
        // "승인 대기" 상태의 경우 강조 배경색
        if (Object.values(row).includes("승인 대기")) {
            return 'bg-[#FFFBEB]';
        }
        // 기본 행인 경우
        return 'bg-[#FFFFFF]';
    };

    return (
        <div className="relative overflow-x-auto sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 font-inter border-collapse">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        {columns.map((col, index) => (
                            <th
                                key={index}
                                scope="col"
                                className="h-[40px] p-3 border border-[#E5E7EB] text-[#6B7280] font-light"
                            >
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (
                        <tr
                            key={index}
                            className={`${getRowBackgroundColor(index, row)} transition-colors duration-150`}
                            onMouseEnter={() => setHoveredRow(index)}
                            onMouseLeave={() => setHoveredRow(null)}
                        >
                            {columns.map((col, colIndex) => {
                                const value = row[col];

                                // 현재 재고 배지 적용
                                if (col === '현재 재고' && typeof value === 'string') {
                                    const theme = mapStockBadge(value);
                                    return (
                                        <td
                                            key={colIndex}
                                            className="h-[40px] p-3 border border-[#E5E7EB] text-[#6B7280] font-light"
                                        >
                                            <StatusBadge text={value} theme={theme} />
                                        </td>
                                    );
                                }

                                // 상태 배지 적용
                                if (col === '상태' && typeof value === 'string') {
                                    const theme = mapStatusToBadge(value);
                                    return (
                                        <td
                                            key={colIndex}
                                            className="h-[40px] p-3 border border-[#E5E7EB] text-[#6B7280] font-light"
                                        >
                                            <StatusBadge text={value} theme={theme} />
                                        </td>
                                    );
                                }

                                //기본 출력
                                return (
                                    <td
                                        key={colIndex}
                                        className="h-[40px] p-3 border border-[#E5E7EB] text-[#6B7280] font-light"
                                    >
                                        {value?.toString() ?? '-'}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
