// src/components/modals/EmployeeDetailsModal.tsx
import React, { useState } from 'react';
import { FiX, FiUser, FiCalendar, FiMail, FiPhone, FiEdit, FiCheck, FiXCircle } from 'react-icons/fi';
import StatusBadge from '../common/StatusBadge';
import PrimaryButton from '../button/PrimaryButton';
import SecondaryButton from '../button/SecondaryButton';
import { Employee } from '@/api/hr';

interface EmployeeDetailsModalProps {
    employee: Employee;
    onClose: () => void;
    onViewContract: () => void;
    onUpdateEmployee: (updatedEmployee: Employee) => Promise<void>;
}

const EmployeeDetailsModal: React.FC<EmployeeDetailsModalProps> = ({
    employee,
    onClose,
    onViewContract,
    onUpdateEmployee,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedEmployee, setEditedEmployee] = useState<Employee>(employee);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditedEmployee((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSave = async () => {
        try {
            await onUpdateEmployee(editedEmployee);
            setIsEditing(false);
        } catch (error) {
            console.error('직원 정보 업데이트 실패:', error);
        }
    };

    const handleCancel = () => {
        setEditedEmployee(employee);
        setIsEditing(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="w-[896px] max-h-[900px] bg-white rounded-lg shadow-xl flex flex-col overflow-hidden">
                {/* 헤더 */}
                <div className="px-4 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">
                        직원 상세보기 - {employee.name} ({employee.id})
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                {/* 탭 메뉴 */}
                <div className="p-6 flex flex-col gap-6">
                    {/* 기본 정보 */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">기본 정보</h3>
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-indigo-600 hover:text-indigo-900 flex items-center"
                                >
                                    <FiEdit className="w-4 h-4 mr-1" />
                                    수정
                                </button>
                            ) : (
                                <div className="flex space-x-2">
                                    <button
                                        onClick={handleSave}
                                        className="text-green-600 hover:text-green-900 flex items-center"
                                    >
                                        <FiCheck className="w-4 h-4 mr-1" />
                                        저장
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="text-red-600 hover:text-red-900 flex items-center"
                                    >
                                        <FiXCircle className="w-4 h-4 mr-1" />
                                        취소
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center">
                                        <FiUser className="w-6 h-6 mr-2 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700">이름:</span>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                name="name"
                                                value={editedEmployee.name}
                                                onChange={handleChange}
                                                className="ml-2 p-1 border border-gray-300 rounded"
                                            />
                                        ) : (
                                            <span className="text-sm ml-1 text-gray-700">{employee.name}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center">
                                        <FiUser className="w-6 h-6 mr-2 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700">직급:</span>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                name="position"
                                                value={editedEmployee.position}
                                                onChange={handleChange}
                                                className="ml-2 p-1 border border-gray-300 rounded"
                                            />
                                        ) : (
                                            <span className="text-sm ml-1 text-gray-700">{employee.position}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center">
                                        <FiCalendar className="w-6 h-6 mr-2 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700">입사일:</span>
                                        <span className="text-sm ml-1 text-gray-700">{employee.hire_date}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center">
                                        <FiMail className="w-6 h-6 mr-2 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700">이메일:</span>
                                        {isEditing ? (
                                            <input
                                                type="email"
                                                name="email"
                                                value={editedEmployee.email}
                                                onChange={handleChange}
                                                className="ml-2 p-1 border border-gray-300 rounded"
                                            />
                                        ) : (
                                            <span className="text-sm ml-1 text-gray-700">{employee.email}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center">
                                        <FiPhone className="w-6 h-6 mr-2 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700">전화번호:</span>
                                        {isEditing ? (
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={editedEmployee.phone}
                                                onChange={handleChange}
                                                className="ml-2 p-1 border border-gray-300 rounded"
                                            />
                                        ) : (
                                            <span className="text-sm ml-1 text-gray-700">{employee.phone}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex justify-end space-x-3">
                        <SecondaryButton text="근로계약서 보기" onClick={onViewContract} />
                        <PrimaryButton text="닫기" onClick={onClose} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDetailsModal;
