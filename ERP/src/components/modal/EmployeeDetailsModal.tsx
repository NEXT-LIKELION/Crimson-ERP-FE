// src/components/modals/EmployeeDetailsModal.tsx
import React, { useState } from "react";
import { FiX, FiEdit, FiCheck, FiXCircle, FiFileText, FiCalendar } from "react-icons/fi";
import { MappedEmployee } from "../../pages/HR/HRPage";
import { ALLOWED_TABS_OPTIONS, parseVacationDays } from "../../api/hr";
import { useEmployee } from "../../hooks/queries/useEmployees";
import VacationCalendar from "../calendar/VacationCalendar";

interface EmployeeDetailsModalProps {
    employee: MappedEmployee;
    onClose: () => void;
    onViewContract: () => void;
    onUpdateEmployee: (updatedEmployee: MappedEmployee) => Promise<void>;
    isAdmin: boolean;
}

// 날짜 형식 변환 함수
const formatDateToKorean = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}년 ${month}월 ${day}일`;
};

const EmployeeDetailsModal: React.FC<EmployeeDetailsModalProps> = ({
    employee,
    onClose,
    onViewContract,
    onUpdateEmployee,
    isAdmin,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedEmployee, setEditedEmployee] = useState<MappedEmployee>(employee);
    const [showVacationCalendar, setShowVacationCalendar] = useState(false);

    // 실시간 직원 상세 정보 조회
    const { data: employeeDetailData, isLoading: employeeDetailLoading } = useEmployee(employee.id);
    
    // 최신 직원 정보 (휴가 데이터 포함)
    const currentEmployee = employeeDetailData?.data || employee;

    React.useEffect(() => {
        setEditedEmployee(employee);
    }, [employee]);

    // 휴가 데이터 파싱
    const vacationDays = parseVacationDays(currentEmployee.vacation_days);
    const vacationPendingDays = parseVacationDays(currentEmployee.vacation_pending_days);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditedEmployee((prev: MappedEmployee) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleAllowedTabsChange = (tabValue: string) => {
        if (editedEmployee.role === "MANAGER") return; // MANAGER는 수정 불가

        const currentTabs = editedEmployee.allowed_tabs || [];
        const newTabs = currentTabs.includes(tabValue)
            ? currentTabs.filter((tab) => tab !== tabValue)
            : [...currentTabs, tabValue];

        setEditedEmployee((prev) => ({
            ...prev,
            allowed_tabs: newTabs,
        }));
    };

    const handleSave = async () => {
        if (!editedEmployee.email || !editedEmployee.phone) {
            alert("이메일과 전화번호를 입력해주세요.");
            return;
        }

        if (!editedEmployee.name || !editedEmployee.hire_date) {
            alert("이름과 입사일을 입력해주세요.");
            return;
        }

        if (editedEmployee.annual_leave_days < 0 || editedEmployee.annual_leave_days > 365) {
            alert("연차 일수는 0일에서 365일 사이여야 합니다.");
            return;
        }

        // MANAGER가 아닌 경우 권한 체크
        if (
            editedEmployee.role !== "MANAGER" &&
            (!editedEmployee.allowed_tabs || editedEmployee.allowed_tabs.length === 0)
        ) {
            alert("최소 하나의 접근 권한을 선택해주세요.");
            return;
        }

        try {
            await onUpdateEmployee(editedEmployee);
            setIsEditing(false);
            alert("직원 정보가 성공적으로 업데이트되었습니다.");
        } catch (error) {
            console.error("직원 정보 업데이트 실패:", error);
            alert("직원 정보 업데이트에 실패했습니다. 다시 시도해주세요.");
        }
    };

    const handleCancel = () => {
        setEditedEmployee(employee);
        setIsEditing(false);
    };

    // 배경 클릭 시 모달 닫기
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
            onClick={handleBackdropClick}
        >
            <div
                className="w-full max-w-sm bg-white rounded-lg shadow-lg border border-gray-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 헤더 */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">직원 정보</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* 콘텐츠 */}
                <div className="p-6">
                    <div className="space-y-4">
                        {/* 이름 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-900">{employee.name}</span>
                                {isEditing && (
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        수정 불가
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* 직급 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">직급</label>
                            {isEditing && isAdmin ? (
                                <select
                                    name="role"
                                    value={editedEmployee.role}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                                >
                                    <option value="STAFF">직원</option>
                                    <option value="INTERN">인턴</option>
                                </select>
                            ) : (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-900">{employee.position}</span>
                                    {isEditing && !isAdmin && (
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                            수정 불가
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 입사일 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">입사일</label>
                            {isEditing && isAdmin ? (
                                <input
                                    type="date"
                                    name="hire_date"
                                    value={editedEmployee.hire_date}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                                />
                            ) : (
                                <span className="text-gray-900">{formatDateToKorean(employee.hire_date)}</span>
                            )}
                        </div>

                        {/* 이메일 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                            {isEditing ? (
                                <input
                                    type="email"
                                    name="email"
                                    value={editedEmployee.email}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                                    placeholder="이메일 주소를 입력하세요"
                                />
                            ) : (
                                <span className="text-gray-900">{employee.email}</span>
                            )}
                        </div>

                        {/* 전화번호 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    name="phone"
                                    value={editedEmployee.phone}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                                    placeholder="전화번호를 입력하세요"
                                />
                            ) : (
                                <span className="text-gray-900">{employee.phone}</span>
                            )}
                        </div>

                        {/* 연차 일수 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">연차 일수</label>
                            {isEditing && isAdmin ? (
                                <input
                                    type="number"
                                    name="annual_leave_days"
                                    value={editedEmployee.annual_leave_days}
                                    onChange={handleChange}
                                    min="0"
                                    max="365"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                                    placeholder="연차 일수를 입력하세요"
                                />
                            ) : (
                                <span className="text-gray-900">
                                    {currentEmployee.annual_leave_days}일 (남은 연차: {typeof currentEmployee.remaining_leave_days === 'string' ? parseInt(currentEmployee.remaining_leave_days) || 0 : currentEmployee.remaining_leave_days}일)
                                </span>
                            )}
                        </div>

                        {/* 권한 탭 관리 - MANAGER가 아닌 경우만 표시 */}
                        {employee.role !== "MANAGER" && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">접근 권한</label>
                                {isEditing && isAdmin ? (
                                    <div className="space-y-2">
                                        {ALLOWED_TABS_OPTIONS.map((tab) => (
                                            <label key={tab.value} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={(editedEmployee.allowed_tabs || []).includes(tab.value)}
                                                    onChange={() => handleAllowedTabsChange(tab.value)}
                                                    className="mr-2 h-4 w-4 text-rose-600 focus:ring-rose-500 border-gray-300 rounded"
                                                />
                                                <span className="text-sm text-gray-700">{tab.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-1">
                                        {(employee.allowed_tabs || []).map((tab) => {
                                            const tabOption = ALLOWED_TABS_OPTIONS.find((opt) => opt.value === tab);
                                            return (
                                                <span
                                                    key={tab}
                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                                >
                                                    {tabOption?.label || tab}
                                                </span>
                                            );
                                        })}
                                        {(!employee.allowed_tabs || employee.allowed_tabs.length === 0) && (
                                            <span className="text-sm text-gray-500">권한이 설정되지 않았습니다</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 버튼 영역 */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="space-y-3">
                            {/* 휴가 캘린더 버튼 */}
                            <button
                                onClick={() => setShowVacationCalendar(true)}
                                disabled={employeeDetailLoading}
                                className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FiCalendar className="w-4 h-4 mr-2" />
                                {employeeDetailLoading ? '로딩 중...' : '휴가 캘린더 보기'}
                            </button>

                            {/* 근로계약서 버튼 */}
                            {isAdmin && (
                                <button
                                    onClick={onViewContract}
                                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center justify-center text-sm"
                                >
                                    <FiFileText className="w-4 h-4 mr-2" />
                                    근로계약서 보기
                                </button>
                            )}

                            {/* 수정 관련 버튼들 */}
                            {isAdmin &&
                                (!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="w-full px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 flex items-center justify-center text-sm"
                                    >
                                        <FiEdit className="w-4 h-4 mr-2" />
                                        정보 수정
                                    </button>
                                ) : (
                                    <div className="space-y-2">
                                        <button
                                            onClick={handleSave}
                                            className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center justify-center text-sm"
                                        >
                                            <FiCheck className="w-4 h-4 mr-2" />
                                            저장
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center justify-center text-sm"
                                        >
                                            <FiXCircle className="w-4 h-4 mr-2" />
                                            취소
                                        </button>
                                    </div>
                                ))}

                            {/* 닫기 버튼 */}
                            <button
                                onClick={onClose}
                                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 휴가 캘린더 모달 */}
            {showVacationCalendar && (
                <VacationCalendar
                    vacationDays={vacationDays}
                    vacationPendingDays={vacationPendingDays}
                    onClose={() => setShowVacationCalendar(false)}
                    employeeName={employee.name}
                />
            )}
        </div>
    );
};

export default EmployeeDetailsModal;
