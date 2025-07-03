import { useEffect, useState } from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import TextInput from '../input/TextInput';

interface AddSupplierModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (supplier: any) => void;
    initialData?: any;
    title?: string;
}

const AddSupplierModal = ({
    isOpen,
    onClose,
    onSave,
    initialData = {},
    title = '공급업체 추가',
}: AddSupplierModalProps) => {
    const [form, setForm] = useState<any>(initialData || {});
    const [errors, setErrors] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            setForm(initialData || {});
            setErrors([]);
        }
    }, [isOpen, initialData]);

    const handleChange = (field: string, value: string) => {
        setForm((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        const errs = [];
        if (!form.name?.trim()) errs.push('업체명을 입력해주세요.');
        if (!form.contact?.trim()) errs.push('연락처를 입력해주세요.');
        if (!form.manager?.trim()) errs.push('담당자를 입력해주세요.');
        if (!form.email?.trim()) errs.push('이메일을 입력해주세요.');
        if (!form.address?.trim()) errs.push('주소를 입력해주세요.');
        if (errs.length > 0) {
            setErrors(errs);
            return;
        }
        onSave(form);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <div className="w-[500px] max-h-[90vh] bg-white rounded-lg shadow-lg overflow-auto">
                <div className="px-6 py-4 border-b border-gray-300 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <button onClick={onClose}>
                        <FiX className="w-6 h-6 text-gray-500 hover:text-gray-700" />
                    </button>
                </div>
                <div className="p-6 space-y-8">
                    {errors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <div className="flex items-start">
                                <FiAlertTriangle className="text-red-600 mr-2 mt-1" />
                                <ul className="text-sm text-red-700 list-disc list-inside">
                                    {errors.map((err, i) => (
                                        <li key={i}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                    <div className="space-y-4">
                        <TextInput
                            label="업체명"
                            value={form.name || ''}
                            onChange={(val) => handleChange('name', val)}
                        />
                        <TextInput
                            label="연락처"
                            value={form.contact || ''}
                            onChange={(val) => handleChange('contact', val)}
                        />
                        <TextInput
                            label="담당자"
                            value={form.manager || ''}
                            onChange={(val) => handleChange('manager', val)}
                        />
                        <TextInput
                            label="이메일"
                            value={form.email || ''}
                            onChange={(val) => handleChange('email', val)}
                        />
                        <TextInput
                            label="주소"
                            value={form.address || ''}
                            onChange={(val) => handleChange('address', val)}
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-8">
                        <button
                            className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                            onClick={onClose}
                        >
                            취소
                        </button>
                        <button
                            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                            onClick={handleSubmit}
                        >
                            저장
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddSupplierModal;
