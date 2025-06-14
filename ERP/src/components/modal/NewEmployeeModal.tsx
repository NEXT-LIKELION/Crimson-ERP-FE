// src/components/modals/NewEmployeeModal.tsx
import React, { useState } from 'react';
import { FiX, FiUser, FiMail, FiPhone, FiLock, FiUserPlus } from 'react-icons/fi';

import SelectInput from '../input/SelectInput';
import { EmployeeCreateData } from '../../api/hr';

interface NewEmployeeModalProps {
    onClose: () => void;
    onSubmit: (employeeData: EmployeeCreateData) => Promise<void>;
}

// 한국어 직급을 영어 role로 매핑하는 함수
const mapKoreanToRole = (koreanPosition: string): string => {
    switch (koreanPosition) {
        case '대표':
            return 'MANAGER';
        case '직원':
            return 'STAFF';
        default:
            return 'STAFF';
    }
};

const NewEmployeeModal: React.FC<NewEmployeeModalProps> = ({ onClose, onSubmit }) => {
    const [formData, setFormData] = useState<EmployeeCreateData>({
        username: '',
        role: 'STAFF',
        email: '',
        contact: '',
        password: '',
    });


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev: EmployeeCreateData) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handlePositionChange = (value: string) => {
        setFormData((prev: EmployeeCreateData) => ({
            ...prev,
            role: mapKoreanToRole(value),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.username || !formData.email || !formData.contact || !formData.role || !formData.password) {
            alert('모든 필수 항목을 입력해주세요.');
            return;
        }

        try {
            await onSubmit(formData);
        } catch (error) {
            console.error('Form submission error:', error);
            alert('직원 등록에 실패했습니다. 다시 시도해주세요.');
        }
    };

    // 직급 옵션
    const positionOptions = ['대표', '직원'];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transform animate-in zoom-in-95 duration-300">
                {/* 헤더 */}
                <div className="bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-5 flex justify-between items-center">
                    <div className="flex items-center">
                        <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-3">
                            <FiUserPlus className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-semibold text-white">새 직원 등록</h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-white hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-white hover:bg-opacity-20"
                    >
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                {/* 폼 */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-5">
                        <div>
                            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                                이름 *
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiUser className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="username"
                                    id="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                                    placeholder="직원 이름을 입력하세요"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">직급 *</label>
                            <div className="relative">
                                <SelectInput
                                    defaultText="직급을 선택하세요"
                                    options={positionOptions}
                                    onChange={handlePositionChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                이메일 *
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiMail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                                    placeholder="이메일 주소를 입력하세요"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="contact" className="block text-sm font-semibold text-gray-700 mb-2">
                                전화번호 *
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiPhone className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="tel"
                                    name="contact"
                                    id="contact"
                                    value={formData.contact}
                                    onChange={handleChange}
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                                    placeholder="010-0000-0000"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                                초기 비밀번호 *
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiLock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    id="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                                    placeholder="초기 비밀번호를 입력하세요"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200 shadow-sm"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-rose-500 to-rose-600 border border-transparent rounded-xl hover:from-rose-600 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-none flex items-center"
                            disabled={
                                !formData.role ||
                                !formData.username ||
                                !formData.email ||
                                !formData.contact ||
                                !formData.password
                            }
                        >
                            <FiUserPlus className="w-4 h-4 mr-2" />
                            등록하기
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewEmployeeModal;
