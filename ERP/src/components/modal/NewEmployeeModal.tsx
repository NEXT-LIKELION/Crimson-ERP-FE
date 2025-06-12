// src/components/modals/NewEmployeeModal.tsx
import React, { useState } from 'react';
import { FiX, FiSave } from 'react-icons/fi';
import PrimaryButton from '../button/PrimaryButton';
import SelectInput from '../input/SelectInput';
import { EmployeeCreateData } from '@/api/hr';

interface NewEmployeeModalProps {
    onClose: () => void;
    onSubmit: (employeeData: EmployeeCreateData) => Promise<void>;
}

const NewEmployeeModal: React.FC<NewEmployeeModalProps> = ({ onClose, onSubmit }) => {
    const [formData, setFormData] = useState<EmployeeCreateData>({
        name: '',
        position: '',
        department: '',
        email: '',
        phone: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await onSubmit(formData);
        } catch (error) {
            console.error('Form submission error:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="w-[600px] bg-white rounded-lg shadow-xl">
                {/* 헤더 */}
                <div className="px-4 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">새 직원 등록</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                {/* 폼 */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            이름
                        </label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                            직급
                        </label>
                        <input
                            type="text"
                            name="position"
                            id="position"
                            value={formData.position}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                            부서
                        </label>
                        <input
                            type="text"
                            name="department"
                            id="department"
                            value={formData.department}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            이메일
                        </label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                            전화번호
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            id="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                        >
                            등록
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewEmployeeModal;
