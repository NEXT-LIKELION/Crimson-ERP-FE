// src/components/modals/EmployeeContractModal.tsx
import React from 'react';
import { FiX, FiUser, FiCalendar, FiPrinter, FiArrowLeft } from 'react-icons/fi';
import { MappedEmployee } from '../../api/hr';

interface EmployeeContractModalProps {
    employee: MappedEmployee;
    onClose: () => void;
    onViewInfo: () => void;
}

// 날짜 형식 변환 함수
const formatDateToKorean = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}년 ${month}월 ${day}일`;
};

// 계약 종료일 계산 (입사일로부터 1년 후)
const getContractEndDate = (hireDate: string): string => {
    if (!hireDate) return '';
    const date = new Date(hireDate);
    if (isNaN(date.getTime())) return '';

    date.setFullYear(date.getFullYear() + 1);
    return formatDateToKorean(date.toISOString().split('T')[0]);
};

const EmployeeContractModal: React.FC<EmployeeContractModalProps> = ({ employee, onClose, onViewInfo }) => {
    // 배경 클릭 시 모달 닫기
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>근로계약서 - ${employee.name}</title>
                        <style>
                            body {
                                font-family: 'Noto Sans KR', sans-serif;
                                padding: 40px;
                                line-height: 1.6;
                            }
                            .contract-header {
                                text-align: center;
                                margin-bottom: 40px;
                            }
                            .contract-title {
                                font-size: 24px;
                                font-weight: bold;
                                margin-bottom: 20px;
                            }
                            .contract-content {
                                margin-bottom: 30px;
                            }
                            .contract-section {
                                margin-bottom: 20px;
                            }
                            .contract-section-title {
                                font-weight: bold;
                                margin-bottom: 10px;
                            }
                            .signature-area {
                                margin-top: 50px;
                                display: flex;
                                justify-content: space-between;
                            }
                            .signature-box {
                                text-align: center;
                                width: 200px;
                            }
                            .signature-line {
                                border-top: 1px solid #000;
                                margin-top: 50px;
                                padding-top: 10px;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="contract-header">
                            <h1 class="contract-title">근로계약서</h1>
                        </div>

                        <div class="contract-content">
                            <div class="contract-section">
                                <div class="contract-section-title">1. 근로자 정보</div>
                                <p>성명: ${employee.name}</p>
                                <p>직급: ${employee.position}</p>
                                <p>부서: ${employee.department}</p>
                                <p>이메일: ${employee.email}</p>
                                <p>연락처: ${employee.phone}</p>
                            </div>

                            <div class="contract-section">
                                <div class="contract-section-title">2. 근로조건</div>
                                <p>근무시간: 평일 09:00 ~ 18:00 (휴게시간 12:00 ~ 13:00)</p>
                                <p>근무일: 주 5일 (월~금)</p>
                                <p>급여지급일: 매월 25일</p>
                            </div>

                            <div class="contract-section">
                                <div class="contract-section-title">3. 계약기간</div>
                                <p>시작일: ${formatDateToKorean(employee.hire_date)}</p>
                                <p>종료일: ${getContractEndDate(employee.hire_date)}</p>
                            </div>
                        </div>

                        <div class="signature-area">
                            <div class="signature-box">
                                <div class="signature-line">근로자: ${employee.name}</div>
                            </div>
                            <div class="signature-box">
                                <div class="signature-line">회사 대표: 유시진</div>
                            </div>
                        </div>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 overflow-auto"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={handleBackdropClick}
        >
            <div
                className="w-[896px] max-h-[90vh] bg-white rounded-lg shadow-xl flex flex-col overflow-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 헤더 */}
                <div className="px-4 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">
                        근로계약서 - {employee.name} ({employee.id})
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                {/* 계약서 내용 */}
                <div className="p-6">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="space-y-6">
                            {/* 근로자 정보 */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">1. 근로자 정보</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center">
                                        <FiUser className="w-6 h-6 mr-2 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700">이름:</span>
                                        <span className="text-sm ml-1 text-gray-700">{employee.name}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <FiUser className="w-6 h-6 mr-2 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700">직급:</span>
                                        <span className="text-sm ml-1 text-gray-700">{employee.position}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <FiUser className="w-6 h-6 mr-2 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700">부서:</span>
                                        <span className="text-sm ml-1 text-gray-700">{employee.department}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <FiCalendar className="w-6 h-6 mr-2 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700">입사일:</span>
                                        <span className="text-sm ml-1 text-gray-700">
                                            {formatDateToKorean(employee.hire_date)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* 근로조건 */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">2. 근로조건</h3>
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-700">
                                        근무시간: 평일 09:00 ~ 18:00 (휴게시간 12:00 ~ 13:00)
                                    </p>
                                    <p className="text-sm text-gray-700">근무일: 주 5일 (월~금)</p>
                                    <p className="text-sm text-gray-700">급여지급일: 매월 25일</p>
                                </div>
                            </div>

                            {/* 계약기간 */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">3. 계약기간</h3>
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-700">
                                        시작일: {formatDateToKorean(employee.hire_date)}
                                    </p>
                                    <p className="text-sm text-gray-700">
                                        종료일: {getContractEndDate(employee.hire_date)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 하단 액션 버튼 */}
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                    <div className="flex justify-between items-center">
                        <button
                            onClick={onViewInfo}
                            className="px-5 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200 text-sm font-medium shadow-sm flex items-center"
                        >
                            <FiArrowLeft className="w-4 h-4 mr-2" />
                            직원 정보로 돌아가기
                        </button>
                        <button
                            onClick={handlePrint}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl flex items-center"
                        >
                            <FiPrinter className="w-4 h-4 mr-2" />
                            계약서 인쇄
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeContractModal;
