import { useEffect, useState } from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import TextInput from '../input/TextInput';
import CategorySelect from '../input/CategorySelect';
import PrimaryButton from '../button/PrimaryButton';
import SecondaryButton from '../button/SecondaryButton';
import { Product } from '../../types/product';
import type { ApiProductVariant } from '../../hooks/queries/useInventories';

// Product 타입 확장 (API 응답 필드 포함)
type ExtendedProduct = Product & {
  offline_name?: string;
  online_name?: string;
  big_category?: string;
  middle_category?: string;
};
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useQuery } from '@tanstack/react-query';
import { fetchVariantDetail, fetchCategories } from '../../api/inventory';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ExtendedProduct;
  onSave: (product: ExtendedProduct) => void;
}

interface EditForm {
  product_id: string;
  offline_name?: string;
  online_name?: string;
  big_category?: string;
  middle_category?: string;
  category?: string;
  variant_id?: number | string;
  variant_code?: string;
  option?: string;
  min_stock?: number;
  price?: number | string;
  description?: string;
  memo?: string;
  channels: string[];
}

const EditProductModal = ({ isOpen, onClose, product, onSave }: EditProductModalProps) => {
  // 카테고리 목록 조회
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    enabled: isOpen,
  });

  // 최신 variant 정보 조회
  const { data: latestVariantData } = useQuery({
    queryKey: ['variantDetail', product?.variant_code],
    queryFn: () => fetchVariantDetail(product?.variant_code || ''),
    enabled: isOpen && !!product?.variant_code,
    staleTime: 0, // 항상 최신 데이터 가져오기
  });

  // 동적 카테고리 옵션 생성
  const categoriesDataTyped = categoriesData?.data as
    | { big_categories?: string[]; middle_categories?: string[]; categories?: string[] }
    | undefined;
  const existingCategories = categoriesDataTyped?.categories || [];
  const categoryOptions = Array.isArray(existingCategories)
    ? [...new Set(existingCategories)].sort()
    : [];
  categoryOptions.push('직접 입력');

  const existingBigCategories = categoriesDataTyped?.big_categories || [];
  const bigCategoryOptions = Array.isArray(existingBigCategories)
    ? [...new Set(existingBigCategories)].sort()
    : [];
  bigCategoryOptions.push('직접 입력');

  const existingMiddleCategories = categoriesDataTyped?.middle_categories || [];
  const middleCategoryOptions = Array.isArray(existingMiddleCategories)
    ? [...new Set(existingMiddleCategories)].sort()
    : [];
  middleCategoryOptions.push('직접 입력');

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isCustomBigCategory, setIsCustomBigCategory] = useState(false);
  const [isCustomMiddleCategory, setIsCustomMiddleCategory] = useState(false);

  const [form, setForm] = useState<EditForm>({
    product_id: product.product_id || '',
    offline_name: product.offline_name || product.name || '',
    online_name: product.online_name || '',
    big_category: product.big_category || '',
    middle_category: product.middle_category || '',
    category: product.category || '',
    variant_code: product.variant_code || '',
    option: product.option || '',
    min_stock: product.min_stock || 0,
    price: product.price || 0,
    description: product.description || '',
    memo: product.memo || '',
    channels: product.channels || [],
  });
  const [errors, setErrors] = useState<string[]>([]);

  // 숫자 입력에서 음수/지수 입력 차단
  const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const blockedKeys = ['-', '+', 'e', 'E'];
    if (blockedKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleChange = (field: string, value: string | number | string[]) => {
    setForm((prev: EditForm) => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (value: string) => {
    if (value === '직접 입력') {
      setIsCustomCategory(true);
      setForm((prev) => ({ ...prev, category: '' }));
    } else {
      setIsCustomCategory(false);
      setForm((prev) => ({ ...prev, category: value }));
    }
  };

  const handleBigCategoryChange = (value: string) => {
    if (value === '직접 입력') {
      setIsCustomBigCategory(true);
      setForm((prev) => ({ ...prev, big_category: '' }));
    } else {
      setIsCustomBigCategory(false);
      setForm((prev) => ({ ...prev, big_category: value }));
    }
  };

  const handleMiddleCategoryChange = (value: string) => {
    if (value === '직접 입력') {
      setIsCustomMiddleCategory(true);
      setForm((prev) => ({ ...prev, middle_category: '' }));
    } else {
      setIsCustomMiddleCategory(false);
      setForm((prev) => ({ ...prev, middle_category: value }));
    }
  };

  const handleSubmit = () => {
    const errs = [];
    if (!form.offline_name?.trim()) errs.push('오프라인 상품명을 입력해주세요.');
    if (!form.price || isNaN(Number(form.price))) errs.push('판매가는 숫자여야 합니다.');
    if (!form.channels || form.channels.length === 0)
      errs.push('판매 채널을 최소 하나 이상 선택해주세요.');

    if (errs.length > 0) {
      alert(errs.join('\n'));
      return;
    }

    const updated: ExtendedProduct = {
      ...product,
      variant_code: form.variant_code || '',
      product_id: form.product_id,
      name: form.offline_name || '',
      offline_name: form.offline_name || '',
      online_name: form.online_name,
      big_category: form.big_category,
      middle_category: form.middle_category,
      category: form.category,
      option: form.option || '기본',
      price: Number(form.price),
      min_stock: Number(form.min_stock) || 0,
      description: form.description || '',
      memo: form.memo || '',
      channels: form.channels,
    };

    onSave(updated);
    onClose();
  };

  useEffect(() => {
    if (isOpen && product) {
      const variantData = latestVariantData?.data || product;

      const variantDataTyped = variantData as ApiProductVariant;
      setForm({
        product_id: product.product_id || '',
        offline_name: variantDataTyped.offline_name || product.offline_name || product.name || '',
        online_name: variantDataTyped.online_name || product.online_name || '',
        big_category: variantDataTyped.big_category || product.big_category || '',
        middle_category: variantDataTyped.middle_category || product.middle_category || '',
        category: variantDataTyped.category || product.category || '',
        variant_code: product.variant_code || '',
        option: variantDataTyped.option || product.option || '',
        min_stock: variantDataTyped.min_stock || product.min_stock || 0,
        price: variantDataTyped.price || product.price || 0,
        description: variantDataTyped.description || product.description || '',
        memo: variantDataTyped.memo || product.memo || '',
        channels: variantDataTyped.channels || product.channels || [],
      });

      // 커스텀 카테고리 상태 초기화
      setIsCustomCategory(false);
      setIsCustomBigCategory(false);
      setIsCustomMiddleCategory(false);
      setErrors([]);
    }
  }, [isOpen, product, latestVariantData]);

  useEscapeKey(onClose, isOpen);

  if (!isOpen || !product) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm'>
      <div className='mx-4 flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-lg'>
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
          <h2 className='text-lg font-semibold'>상품 정보 편집</h2>
          <button onClick={onClose}>
            <FiX className='h-6 w-6 text-gray-500 hover:text-gray-700' />
          </button>
        </div>

        <div className='flex-1 overflow-y-auto px-6 py-4'>
          <div className='space-y-4'>
            {errors.length > 0 && (
              <div className='rounded-md border border-red-200 bg-red-50 p-3'>
                <div className='flex items-start'>
                  <FiAlertTriangle className='mt-0.5 mr-2 text-red-600' />
                  <ul className='list-inside list-disc text-xs text-red-700'>
                    {errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* 기본 정보 */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-3'>
                <TextInput label='상품코드' value={form.product_id} disabled />
                <TextInput label='품목코드' value={form.variant_code || ''} disabled />
                <TextInput
                  label='오프라인 상품명'
                  value={form.offline_name || ''}
                  onChange={(val) => handleChange('offline_name', val)}
                />
                <TextInput
                  label='온라인 상품명'
                  value={form.online_name || ''}
                  onChange={(val) => handleChange('online_name', val)}
                  placeholder='온라인 판매용 상품명 (선택)'
                />
                <CategorySelect
                  label='대분류'
                  value={isCustomBigCategory ? '직접 입력' : form.big_category || ''}
                  options={bigCategoryOptions}
                  onChange={handleBigCategoryChange}
                  placeholder='대분류 선택'
                />
                {isCustomBigCategory && (
                  <TextInput
                    label='새 대분류명'
                    value={form.big_category || ''}
                    onChange={(val) => handleChange('big_category', val)}
                    placeholder='새 대분류를 입력하세요'
                  />
                )}
                <CategorySelect
                  label='중분류'
                  value={isCustomMiddleCategory ? '직접 입력' : form.middle_category || ''}
                  options={middleCategoryOptions}
                  onChange={handleMiddleCategoryChange}
                  placeholder='중분류 선택'
                />
                {isCustomMiddleCategory && (
                  <TextInput
                    label='새 중분류명'
                    value={form.middle_category || ''}
                    onChange={(val) => handleChange('middle_category', val)}
                    placeholder='새 중분류를 입력하세요'
                  />
                )}
                <CategorySelect
                  label='카테고리'
                  value={isCustomCategory ? '직접 입력' : form.category || ''}
                  options={categoryOptions}
                  onChange={handleCategoryChange}
                  placeholder='카테고리 선택'
                />
                {isCustomCategory && (
                  <TextInput
                    label='새 카테고리명'
                    value={form.category || ''}
                    onChange={(val) => handleChange('category', val)}
                    placeholder='새 카테고리를 입력하세요'
                  />
                )}
                <TextInput
                  label='옵션'
                  value={form.option || ''}
                  onChange={(val) => handleChange('option', val)}
                />
              </div>

              <div className='space-y-3'>
                <TextInput
                  label='판매가'
                  type='number'
                  value={form.price?.toString() || ''}
                  onChange={(val) => handleChange('price', Math.max(0, Number(val) || 0))}
                  onKeyDown={handleNumberKeyDown}
                  noSpinner
                />
                <TextInput
                  label='최소 재고'
                  type='number'
                  value={Math.max(0, Number(form.min_stock) || 0).toString()}
                  onChange={(val) => handleChange('min_stock', Math.max(0, Number(val) || 0))}
                  onKeyDown={handleNumberKeyDown}
                  noSpinner
                />
              </div>
            </div>

            {/* 판매 채널 */}
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                판매 채널 <span className='text-red-500'>*</span>
              </label>
              <div className='flex gap-4'>
                <label className='flex items-center text-sm'>
                  <input
                    type='checkbox'
                    checked={form.channels.includes('online')}
                    onChange={(e) => {
                      const channels = e.target.checked
                        ? [...form.channels, 'online']
                        : form.channels.filter((c) => c !== 'online');
                      handleChange('channels', channels);
                    }}
                    className='mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                  />
                  온라인
                </label>
                <label className='flex items-center text-sm'>
                  <input
                    type='checkbox'
                    checked={form.channels.includes('offline')}
                    onChange={(e) => {
                      const channels = e.target.checked
                        ? [...form.channels, 'offline']
                        : form.channels.filter((c) => c !== 'offline');
                      handleChange('channels', channels);
                    }}
                    className='mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                  />
                  오프라인
                </label>
              </div>
            </div>

            {/* 설명 */}
            <div>
              <label className='mb-1.5 block text-sm font-medium text-gray-700'>설명</label>
              <textarea
                className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
                rows={2}
                value={form.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>

            {/* 관리자 메모 */}
            <div>
              <label className='mb-1.5 block text-sm font-medium text-gray-700'>관리자 메모</label>
              <textarea
                className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
                rows={2}
                value={form.memo?.toString() || ''}
                onChange={(e) => handleChange('memo', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className='flex justify-end gap-3 border-t border-gray-200 px-6 py-4'>
          <SecondaryButton text='취소' onClick={onClose} />
          <PrimaryButton text='저장하기' onClick={handleSubmit} />
        </div>
      </div>
    </div>
  );
};

export default EditProductModal;
