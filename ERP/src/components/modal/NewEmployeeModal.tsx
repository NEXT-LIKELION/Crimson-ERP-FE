// src/components/modals/NewEmployeeModal.tsx
import React, { useState } from 'react';
import { FiX, FiSave } from 'react-icons/fi';
import PrimaryButton from '../button/PrimaryButton';
import SelectInput from '../input/SelectInput';

interface NewEmployeeModalProps {
    onClose: () => void;
    onSubmit: (employeeData: Partial<Employee>) => void;
}

interface Employee {
    id: string;
    name: string;
    position: string;
    startDate: string;
    status: string;
    profileImage?: string;
    email?: string;
    phone?: string;
    birthdate?: string;
    gender?: string;
    address?: string;
    emergencyContact?: string;
    job?: string;
    contractPeriod?: string;
    workHours?: string;
    remainingLeave?: string;
}

const NewEmployeeModal: React.FC<NewEmployeeModalProps> = ({ onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        name: '',
        position: '직원', // 기본값 설정
        startDate: new Date().toISOString().split('T')[0], // 오늘 날짜를 기본값으로
        email: '',
        phone: '',
        birthdate: '',
        gender: '',
        address: '',
        emergencyContact: '',
        job: '크림슨스토어 판매 및 관리', // 기본값 설정
        workHours: '평일 09:00 ~ 18:00', // 기본값 설정
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handlePositionChange = (value: string) => {
        setFormData((prev) => ({
            ...prev,
            position: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 필수 필드 검증
        if (!formData.name) {
            alert('이름은 필수입니다.');
            return;
        }

        const contractEndDate = new Date(formData.startDate);
        contractEndDate.setFullYear(contractEndDate.getFullYear() + 1);
        const contractPeriod = `${formData.startDate} ~ ${contractEndDate.toISOString().split('T')[0]}`;

        onSubmit({
            ...formData,
            contractPeriod,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-[800px] max-h-[90vh] overflow-auto">
                {/* 헤더 */}
                <div className="px-4 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">새 직원 등록</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                {/* 폼 */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-2 gap-6">
                        {/* 기본 정보 섹션 */}
                        <div className="col-span-2">
                            <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
                                기본 정보
                            </h3>
                        </div>

                        {/* 이름 */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700">
                                이름 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                                required
                            />
                        </div>

                        {/* 직급 */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700">직급</label>
                            <div className="h-10">
                                <SelectInput
                                    defaultText="직급 선택"
                                    options={['대표', '직원']}
                                    onChange={handlePositionChange}
                                />
                            </div>
                        </div>

                        {/* 입사일 */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700">입사일</label>
                            <input
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                            />
                        </div>

                        {/* 이메일 */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700">이메일</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                            />
                        </div>

                        {/* 전화번호 */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700">전화번호</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="010-0000-0000"
                                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                            />
                        </div>

                        {/* 개인 정보 섹션 */}
                        <div className="col-span-2">
                            <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
                                개인 정보
                            </h3>
                        </div>

                        {/* 생년월일 */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700">생년월일</label>
                            <input
                                type="date"
                                name="birthdate"
                                value={formData.birthdate}
                                onChange={handleChange}
                                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                            />
                        </div>

                        {/* 성별 */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700">성별</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                            >
                                <option value="">선택하세요</option>
                                <option value="남성">남성</option>
                                <option value="여성">여성</option>
                            </select>
                        </div>

                        {/* 주소 */}
                        <div className="flex flex-col gap-1 col-span-2">
                            <label className="text-sm font-medium text-gray-700">주소</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                            />
                        </div>

                        {/* 비상 연락처 */}
                        <div className="flex flex-col gap-1 col-span-2">
                            <label className="text-sm font-medium text-gray-700">비상 연락처</label>
                            <input
                                type="text"
                                name="emergencyContact"
                                value={formData.emergencyContact}
                                onChange={handleChange}
                                placeholder="010-0000-0000 (관계)"
                                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                            />
                        </div>

                        {/* 인사 정보 섹션 */}
                        <div className="col-span-2">
                            <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
                                인사 정보
                            </h3>
                        </div>

                        {/* 직무 */}
                        <div className="flex flex-col gap-1 col-span-2">
                            <label className="text-sm font-medium text-gray-700">직무</label>
                            <input
                                type="text"
                                name="job"
                                value={formData.job}
                                onChange={handleChange}
                                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                            />
                        </div>

                        {/* 근무 시간 */}
                        <div className="flex flex-col gap-1 col-span-2">
                            <label className="text-sm font-medium text-gray-700">근무 시간</label>
                            <input
                                type="text"
                                name="workHours"
                                value={formData.workHours}
                                onChange={handleChange}
                                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* 제출 버튼 영역 */}
                    <div className="mt-8 flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
                        >
                            <FiSave className="mr-2" />
                            저장하기
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewEmployeeModal;
