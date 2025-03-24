import React, { useState } from 'react';

// 데이터 행의 타입 정의
interface TableRow {
    name: string;
    empId: string;
    department: string;
    status: string;
    isHighlighted: boolean;
}

// 테이블 컴포넌트의 props 타입 정의
interface TableProps {
    data?: TableRow[];
}

const Table: React.FC<TableProps> = ({ data = [] }) => {
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);

    // 행 배경색을 결정하는 함수
    const getRowBackgroundColor = (index: number, isHighlighted: boolean): string => {
        // 호버 상태인 경우
        if (hoveredRow === index) {
            return 'bg-[#F9FAFB]';
        }
        // 강조 행인 경우
        if (isHighlighted) {
            return 'bg-[#FFFBEB]';
        }
        // 기본 행인 경우
        return 'bg-[#FFFFFF]';
    };

    // 샘플 데이터 (실제 구현 시 props로 받아옴)
    const sampleData: TableRow[] =
        data.length > 0
            ? data
            : [
                  {
                      name: '홍길동',
                      empId: 'EMP-2023-0001',
                      department: '영업부',
                      status: '재직중',
                      isHighlighted: false,
                  },
                  {
                      name: '김철수',
                      empId: 'EMP-2023-0002',
                      department: '인사부',
                      status: '재직중',
                      isHighlighted: true,
                  },
                  {
                      name: '이영희',
                      empId: 'EMP-2023-0003',
                      department: '개발부',
                      status: '재직중',
                      isHighlighted: false,
                  },
              ];

    return (
        <div className="relative overflow-x-auto sm:rounded-lg">
            <table className="table-fixed text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 font-inter border-collapse">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th
                            scope="col"
                            className="w-[150px] h-[40px] p-3 border border-[#E5E7EB] text-[#6B7280] font-light"
                        >
                            이름
                        </th>
                        <th
                            scope="col"
                            className="w-[150px] h-[40px] p-3 border border-[#E5E7EB] text-[#6B7280] font-light"
                        >
                            사번
                        </th>
                        <th
                            scope="col"
                            className="w-[150px] h-[40px] p-3 border border-[#E5E7EB] text-[#6B7280] font-light"
                        >
                            부서
                        </th>
                        <th
                            scope="col"
                            className="w-[150px] h-[40px] p-3 border border-[#E5E7EB] text-[#6B7280] font-light"
                        >
                            상태
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sampleData.map((row, index) => (
                        <tr
                            key={index}
                            className={`${getRowBackgroundColor(
                                index,
                                row.isHighlighted
                            )} transition-colors duration-150`}
                            onMouseEnter={() => setHoveredRow(index)}
                            onMouseLeave={() => setHoveredRow(null)}
                        >
                            <th
                                scope="row"
                                className="w-[150px] h-[40px] p-3 text-[#111827] font-light whitespace-nowrap dark:text-white border border-[#E5E7EB]"
                            >
                                {row.name}
                            </th>
                            <td className="w-[150px] h-[40px] p-3 border border-[#E5E7EB] text-[#6B7280] font-light">
                                {row.empId}
                            </td>
                            <td className="w-[150px] h-[40px] p-3 border border-[#E5E7EB] text-[#6B7280] font-light">
                                {row.department}
                            </td>
                            <td className="w-[150px] h-[40px] p-3 border border-[#E5E7EB] text-[#6B7280] font-light">
                                {row.status}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
