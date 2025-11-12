import { useEffect, useState } from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import TextInput from '../input/TextInput';
import { formatPhoneNumber } from '../../utils/formatters';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplier: Record<string, unknown>) => void;
  initialData?: Record<string, unknown>;
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
  const [form, setForm] = useState<Record<string, string>>(
    (initialData as Record<string, string>) ?? defaultForm
  );
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      const data = (initialData as Record<string, string>) ?? defaultForm;
      // 초기 연락처가 숫자만 있는 경우 포맷팅 적용
      if (data.contact && /^[0-9]+$/.test(data.contact)) {
        data.contact = formatPhoneNumber(data.contact);
      }
      setForm(data);
      setErrors([]);
    }
  }, [isOpen, initialData]);

  useEscapeKey(onClose, isOpen);

  const handleChange = (field: string, value: string) => {
    if (field === 'contact') {
      const numbers = value.replace(/[^0-9]/g, '');
      setForm((prev) => ({ ...prev, [field]: formatPhoneNumber(numbers) }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = () => {
    const errs = [];
    if (!form.name?.trim()) errs.push('업체명을 입력해주세요.');
    if (!form.contact?.trim()) errs.push('연락처를 입력해주세요.');
    if (!form.manager?.trim()) errs.push('담당자를 입력해주세요.');
    if (!form.email?.trim()) {
      errs.push('이메일을 입력해주세요.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.push('올바른 이메일 형식을 입력해주세요.');
    }
    if (!form.address?.trim()) errs.push('주소를 입력해주세요.');
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }

    // 올바른 형태로 데이터 구성
    const submitData = {
      name: form.name?.trim(),
      contact: form.contact?.trim(), // 하이픈 포함 문자열 전송
      manager: form.manager?.trim(),
      email: form.email?.trim(),
      address: form.address?.trim(),
    };

    onSave(submitData);
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
              placeholder='공급업체명을 입력해주세요 (예: (주)한국전자)'
              className='!w-full'
            />
            <TextInput
              label='연락처'
              value={form.contact || ''}
              onChange={(val) => handleChange('contact', val)}
              placeholder='연락처를 입력해주세요 (예: 01012345678)'
              className='!w-full'
            />
            <TextInput
              label='담당자'
              value={form.manager || ''}
              onChange={(val) => handleChange('manager', val)}
              placeholder='담당자명을 입력해주세요 (예: 홍길동)'
              className='!w-full'
            />
            <TextInput
              label='이메일'
              type='email'
              value={form.email || ''}
              onChange={(val) => handleChange('email', val)}
              placeholder='이메일을 입력해주세요 (예: supplier@company.com)'
              className='!w-full'
            />
            <div>
              <label className='mb-1 block text-xs font-medium text-gray-700'>주소</label>
              <textarea
                value={form.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                rows={3}
                className='w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none'
                placeholder='주소를 입력해주세요&#10;예: 서울특별시 강남구 테헤란로 123&#10;테헤란밸리 오피스빌딩 456호'
              />
            </div>
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
