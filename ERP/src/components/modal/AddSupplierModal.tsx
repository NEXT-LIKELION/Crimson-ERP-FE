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

const defaultForm = { name: '', contact: '', manager: '', email: '', address: '' };

const AddSupplierModal = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  title = '공급업체 추가',
}: AddSupplierModalProps) => {
  const [form, setForm] = useState<any>(initialData ?? defaultForm);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ?? defaultForm);
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
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm'>
      <div className='max-h-[90vh] w-[500px] overflow-auto rounded-lg bg-white shadow-lg'>
        <div className='flex items-center justify-between border-b border-gray-300 px-6 py-4'>
          <h2 className='text-lg font-semibold'>{title}</h2>
          <button onClick={onClose}>
            <FiX className='h-6 w-6 text-gray-500 hover:text-gray-700' />
          </button>
        </div>
        <div className='space-y-8 p-6'>
          {errors.length > 0 && (
            <div className='rounded-md border border-red-200 bg-red-50 p-4'>
              <div className='flex items-start'>
                <FiAlertTriangle className='mt-1 mr-2 text-red-600' />
                <ul className='list-inside list-disc text-sm text-red-700'>
                  {errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <div className='space-y-4'>
            <TextInput
              label='업체명'
              value={form.name || ''}
              onChange={(val) => handleChange('name', val)}
            />
            <TextInput
              label='연락처'
              value={form.contact || ''}
              onChange={(val) => handleChange('contact', val)}
            />
            <TextInput
              label='담당자'
              value={form.manager || ''}
              onChange={(val) => handleChange('manager', val)}
            />
            <TextInput
              label='이메일'
              value={form.email || ''}
              onChange={(val) => handleChange('email', val)}
            />
            <TextInput
              label='주소'
              value={form.address || ''}
              onChange={(val) => handleChange('address', val)}
            />
          </div>
          <div className='mt-8 flex justify-end gap-2'>
            <button
              className='rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300'
              onClick={onClose}>
              취소
            </button>
            <button
              className='rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700'
              onClick={handleSubmit}>
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSupplierModal;
