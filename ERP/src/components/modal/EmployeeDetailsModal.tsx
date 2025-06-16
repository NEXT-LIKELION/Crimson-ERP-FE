// src/components/modals/EmployeeDetailsModal.tsx
import React, { useState } from 'react';
import { FiX, FiUser, FiCalendar, FiMail, FiPhone, FiEdit, FiCheck, FiXCircle, FiEye, FiFileText } from 'react-icons/fi';
import { MappedEmployee } from '../../api/hr';

interface EmployeeDetailsModalProps {
    employee: MappedEmployee;
    onClose: () => void;
    onViewContract: () => void;
    onUpdateEmployee: (updatedEmployee: MappedEmployee) => Promise<void>;
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

const EmployeeDetailsModal: React.FC<EmployeeDetailsModalProps> = ({
    employee,
    onClose,
    onViewContract,
    onUpdateEmployee,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedEmployee, setEditedEmployee] = useState<MappedEmployee>(employee);

    React.useEffect(() => {
        setEditedEmployee(employee);
    }, [employee]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditedEmployee((prev: MappedEmployee) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSave = async () => {
        if (!editedEmployee.email || !editedEmployee.phone) {
            alert('이메일과 전화번호를 입력해주세요.');
            return;
        }

        try {
            await onUpdateEmployee(editedEmployee);
            setIsEditing(false);
            alert('직원 정보가 성공적으로 업데이트되었습니다.');
        } catch (error) {
            console.error('직원 정보 업데이트 실패:', error);
            alert('직원 정보 업데이트에 실패했습니다. 다시 시도해주세요.');
        }
    };

    const handleCancel = () => {
        setEditedEmployee(employee);
        setIsEditing(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden transform animate-in zoom-in-95 duration-300">
                {/* 헤더 */}
                <div className="bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-5 flex justify-between items-center">
                    <div className="flex items-center">
                        <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-3">
                            <FiEye className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">
                                직원 상세보기
                            </h2>
                            <p className="text-rose-100 text-sm">{employee.name} (사번 #{employee.id})</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-white hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-white hover:bg-opacity-20"
                    >
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                {/* 이탭 메뉴 제거하고 바로 컨텐츠 영역 */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6">
                        {/* 기본 정보 */}
                        <div className="bg-gray-50 rounded-xl p-6 mb-6">
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <FiUser className="w-5 h-5 mr-2 text-gray-600" />
                                    기본 정보
                                </h3>
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 flex items-center transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                                    >
                                        <FiEdit className="w-4 h-4 mr-2" />
                                        정보 수정
                                    </button>
                                ) : (
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={handleSave}
                                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                                        >
                                            <FiCheck className="w-4 h-4 mr-2" />
                                            저장
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                                        >
                                            <FiXCircle className="w-4 h-4 mr-2" />
                                            취소
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* 이름 */}
                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <FiUser className="w-5 h-5 mr-3 text-gray-500" />
                                            <div>
                                                <span className="text-sm font-medium text-gray-600">이름</span>
                                                <p className="text-base font-semibold text-gray-900">{employee.name}</p>
                                            </div>
                                        </div>
                                        {isEditing && (
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                수정 불가
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* 직급 */}
                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                    <div className="flex items-center">
                                        <FiUser className="w-5 h-5 mr-3 text-gray-500" />
                                        <div className="flex-1">
                                            <span className="text-sm font-medium text-gray-600">직급</span>
                                            {isEditing ? (
                                                <select
                                                    name="position"
                                                    value={editedEmployee.position}
                                                    onChange={(e) =>
                                                        setEditedEmployee((prev) => ({ ...prev, position: e.target.value }))
                                                    }
                                                    className="block w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-gray-50 text-base font-semibold"
                                                >
                                                    <option value="직원">직원</option>
                                                    <option value="대표">대표</option>
                                                </select>
                                            ) : (
                                                <p className="text-base font-semibold text-gray-900">{employee.position}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 입사일 - 전체 너비 */}
                                <div className="bg-white rounded-lg p-4 border border-gray-200 md:col-span-2">
                                    <div className="flex items-center">
                                        <FiCalendar className="w-5 h-5 mr-3 text-gray-500" />
                                        <div>
                                            <span className="text-sm font-medium text-gray-600">입사일</span>
                                            <p className="text-base font-semibold text-gray-900">
                                                {formatDateToKorean(employee.hire_date)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* 이메일 - 전체 너비 */}
                                <div className="bg-white rounded-lg p-4 border border-gray-200 md:col-span-2">
                                    <div className="flex items-center">
                                        <FiMail className="w-5 h-5 mr-3 text-gray-500" />
                                        <div className="flex-1">
                                            <span className="text-sm font-medium text-gray-600">이메일</span>
                                            {isEditing ? (
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={editedEmployee.email}
                                                    onChange={handleChange}
                                                    className="block w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-gray-50 text-base font-semibold"
                                                    placeholder="이메일 주소를 입력하세요"
                                                />
                                            ) : (
                                                <p className="text-base font-semibold text-gray-900">{employee.email}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 전화번호 - 전체 너비 */}
                                <div className="bg-white rounded-lg p-4 border border-gray-200 md:col-span-2">
                                    <div className="flex items-center">
                                        <FiPhone className="w-5 h-5 mr-3 text-gray-500" />
                                        <div className="flex-1">
                                            <span className="text-sm font-medium text-gray-600">전화번호</span>
                                            {isEditing ? (
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={editedEmployee.phone}
                                                    onChange={handleChange}
                                                    className="block w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-gray-50 text-base font-semibold"
                                                    placeholder="전화번호를 입력하세요"
                                                />
                                            ) : (
                                                <p className="text-base font-semibold text-gray-900">{employee.phone}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* 하단 액션 버튼 */}
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                    <div className="flex justify-between items-center">
                        <button
                            onClick={onViewContract}
                            className="px-5 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200 text-sm font-medium shadow-sm flex items-center"
                        >
                            <FiFileText className="w-4 h-4 mr-2" />
                            근로계약서 보기
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl hover:from-rose-600 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl"
                        >
                            닫기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDetailsModal;
