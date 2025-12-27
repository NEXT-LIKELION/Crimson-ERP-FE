import { useEffect, useState } from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import TextInput from '../input/TextInput';
import CategorySelect from '../input/CategorySelect';
import { FaBoxArchive, FaClipboardList } from 'react-icons/fa6';
import { BsCoin } from 'react-icons/bs';
import {
  fetchProductOptions,
  createProductWithVariant,
  fetchAllInventoriesForMerge,
  fetchCategories,
  fetchVariantDetail,
} from '../../api/inventory';
import { useQuery } from '@tanstack/react-query';
import { ProductFormData, ProductOption, CreatedProductData } from '../../types/product';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import type { operations } from '../../types/api';
import type { ApiProductVariant } from '../../hooks/queries/useInventories';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: CreatedProductData) => void;
}

const AddProductModal = ({ isOpen, onClose, onSave }: AddProductModalProps) => {
  // 상태 선언
  const [productType, setProductType] = useState<'new' | 'existing'>('new');

  // 기존 상품 목록 조회
  const { data: productsData } = useQuery({
    queryKey: ['productOptions'],
    queryFn: fetchProductOptions,
    enabled: isOpen,
  });
  const productOptions =
    productsData?.data?.map((p: ProductOption) => ({
      value: p.product_id,
      label: `${p.product_id} - ${p.name}`,
    })) || [];

  // 카테고리 목록 조회
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    enabled: isOpen,
  });

  // 기존 데이터에서 카테고리 목록 추출 및 중복 체크용
  const { data: allInventoriesData } = useQuery({
    queryKey: ['allInventories'],
    queryFn: fetchAllInventoriesForMerge,
    enabled: isOpen,
  });

  // 동적 카테고리 옵션 생성 + 새 카테고리 추가 옵션
  // categoriesData?.data는 { big_categories: [], middle_categories: [], categories: [] } 형태
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
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedProductInfo, setSelectedProductInfo] = useState<{
    online_name?: string;
    big_category?: string;
    middle_category?: string;
  } | null>(null);
  const [form, setForm] = useState<ProductFormData>({
    name: '',
    online_name: '',
    category: '',
    big_category: '',
    middle_category: '',
    option: '',
    detail_option: '',
    price: 0,
    min_stock: 0,
    description: '',
    memo: '',
    channels: [],
  });
  const [errors, setErrors] = useState<string[]>([]);

  // 숫자 입력에서 음수/지수 입력 차단
  const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const blockedKeys = ['-', '+', 'e', 'E'];
    if (blockedKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  useEffect(() => {
    if (isOpen) {
      setProductType('new');
      setSelectedProductId('');
      setSelectedProductInfo(null);
      setIsCustomCategory(false);
      setIsCustomBigCategory(false);
      setIsCustomMiddleCategory(false);
      setForm({
        name: '',
        online_name: '',
        category: '',
        big_category: '',
        middle_category: '',
        option: '',
        detail_option: '',
        price: 0,
        min_stock: 0,
        description: '',
        memo: '',
        channels: [],
      });
      setErrors([]);
    }
  }, [isOpen]);

  useEscapeKey(onClose, isOpen);

  // 기존 상품 선택 시 해당 상품의 variant 정보 가져오기 (GET 요청)
  useEffect(() => {
    if (productType === 'existing' && selectedProductId && allInventoriesData) {
      // 해당 product_id의 첫 번째 variant 찾기
      const existingVariant = allInventoriesData.find(
        (item: ApiProductVariant) => item.product_id === selectedProductId
      ) as ApiProductVariant | undefined;

      if (existingVariant && existingVariant.variant_code) {
        // 온라인 상품명, 대분류, 중분류는 읽기 전용으로 저장 (form에서 제외)
        setSelectedProductInfo({
          online_name: existingVariant.online_name,
          big_category: existingVariant.big_category,
          middle_category: existingVariant.middle_category,
        });

        // GET 요청으로 variant 상세 정보 가져오기
        fetchVariantDetail(existingVariant.variant_code)
          .then((response) => {
            const variantDetail = response.data as ApiProductVariant;
            // 판매가, 최소재고수량을 form에 채움
            setForm((prev) => ({
              ...prev,
              price: variantDetail.price || 0,
              min_stock: variantDetail.min_stock || 0,
              // 옵션과 상세옵션은 비워둠 (사용자가 입력)
              option: '',
              detail_option: '',
            }));
          })
          .catch((error) => {
            console.error('Variant 상세 정보 조회 실패:', error);
            // 실패 시 기존 데이터 사용
            setForm((prev) => ({
              ...prev,
              price: existingVariant.price || 0,
              min_stock: existingVariant.min_stock || 0,
              option: '',
              detail_option: '',
            }));
          });
      }
    } else if (productType === 'existing' && !selectedProductId) {
      // 상품 선택이 해제되면 초기화
      setSelectedProductInfo(null);
      setForm((prev) => ({
        ...prev,
        price: 0,
        min_stock: 0,
        option: '',
        detail_option: '',
      }));
    }
  }, [selectedProductId, allInventoriesData, productType]);

  const handleChange = (field: keyof ProductFormData, value: string | number | string[]) => {
    setForm((prev: ProductFormData) => ({ ...prev, [field]: value }));
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

  // 활성 상품 중복 체크 (variants 데이터 기반)
  const checkDuplicateInActiveProducts = (name: string): boolean => {
    if (!allInventoriesData || !name?.trim()) return false;
    const activeProductNames = new Set(
      allInventoriesData
        .map((v: ApiProductVariant) => {
          // ApiProductVariant에는 offline_name 또는 online_name 사용
          const productName = v.offline_name || v.online_name || '';
          return productName.trim().toLowerCase();
        })
        .filter((n) => n) // 빈 문자열 제거
    );
    return activeProductNames.has(name.trim().toLowerCase());
  };

  const handleSubmit = async () => {
    const errs = [];

    // 공통 유효성 검사
    if (!form.option?.trim()) errs.push('옵션을 입력해주세요.');
    if (form.price !== undefined && (isNaN(Number(form.price)) || form.price < 0))
      errs.push('판매가는 0 이상의 숫자여야 합니다.');
    if (!form.channels || form.channels.length === 0)
      errs.push('판매 채널을 최소 하나 이상 선택해주세요.');

    // 상품 유형별 유효성 검사
    if (productType === 'new') {
      if (!form.name?.trim()) errs.push('상품명을 입력해주세요.');
      if (!form.category?.trim()) errs.push('카테고리를 선택해주세요.');
    } else {
      if (!selectedProductId) errs.push('기존 상품을 선택해주세요.');
    }
    if (errs.length > 0) {
      alert(errs.join('\n'));
      return;
    }

    // 상품명 중복 검사 (신규 상품에 한함, 활성 상품만)
    if (productType === 'new') {
      if (checkDuplicateInActiveProducts(form.name)) {
        alert(`이미 존재하는 상품명입니다: ${form.name}`);
        return;
      }
    }

    // product_id 자동 생성 함수 (P0000XXX 형식)
    const generateProductId = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const randomChar1 = chars.charAt(Math.floor(Math.random() * chars.length));
      const randomChar2 = chars.charAt(Math.floor(Math.random() * chars.length));
      const randomChar3 = chars.charAt(Math.floor(Math.random() * chars.length));
      return `P0000${randomChar1}${randomChar2}${randomChar3}`;
    };

    try {
      // API 타입 사용: operations["inventory_variants_create"]["requestBody"]["content"]["application/json"]
      type VariantCreatePayload =
        operations['inventory_variants_create']['requestBody']['content']['application/json'];
      let variantPayload: VariantCreatePayload;

      if (productType === 'new') {
        // 새로운 상품
        variantPayload = {
          product_id: generateProductId(),
          name: form.name,
          online_name: form.online_name || undefined,
          category: form.category || undefined,
          big_category: form.big_category || undefined,
          middle_category: form.middle_category || undefined,
          option: form.option || undefined,
          detail_option: form.detail_option || undefined,
          price: form.price || undefined,
          min_stock: form.min_stock || undefined,
          description: form.description || undefined,
          memo: form.memo || undefined,
          channels: form.channels || undefined,
        };
      } else {
        // 기존 상품에 옵션 추가
        const selectedProduct = productsData?.data?.find(
          (p: ProductOption) => p.product_id === selectedProductId
        );

        // 기존 상품의 카테고리를 가져오기 위해 전체 재고 데이터에서 찾기
        const existingVariant = allInventoriesData?.find(
          (item: ApiProductVariant) => item.product_id === selectedProductId
        ) as ApiProductVariant | undefined;

        variantPayload = {
          product_id: selectedProductId,
          name: selectedProduct?.name || form.name,
          // selectedProductInfo에서 온라인명, 대분류, 중분류 가져오기
          online_name: selectedProductInfo?.online_name || undefined,
          category: existingVariant?.category || form.category || undefined,
          big_category: selectedProductInfo?.big_category || undefined,
          middle_category: selectedProductInfo?.middle_category || undefined,
          // 수정 가능한 필드들
          option: form.option || undefined,
          detail_option: form.detail_option || undefined,
          price: form.price || undefined,
          min_stock: form.min_stock || undefined,
          description: form.description || undefined,
          memo: form.memo || undefined,
          channels: form.channels || undefined,
        };
      }

      const variantRes = await createProductWithVariant(variantPayload);

      const newProduct = {
        ...form,
        variant_id: variantRes.variant_code,
        product_id: variantRes.product_id,
      };

      onSave(newProduct);
      onClose();
    } catch {
      alert('상품 생성 중 오류가 발생했습니다.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm'>
      <div className='max-h-[90vh] w-[900px] overflow-auto rounded-lg bg-white shadow-lg'>
        <div className='flex items-center justify-between border-b border-gray-300 px-6 py-4'>
          <h2 className='text-lg font-semibold'>상품 추가</h2>
          <button onClick={onClose}>
            <FiX className='h-6 w-6 text-gray-500 hover:text-gray-700' />
          </button>
        </div>

        <div className='space-y-8 p-6'>
          {errors.length > 0 && (
            <div className='rounded-md border border-red-200 bg-red-50 p-4'>
              <div className='flex items-start'>
                <FiAlertTriangle className='mt-1 mr-2 text-red-600' />
                <ul className='text-red-707 list-inside list-disc text-sm'>
                  {errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* 상품 유형 선택 */}
          <div className='rounded-md border border-blue-200 bg-blue-50 p-4'>
            <h3 className='mb-3 text-sm font-medium text-blue-900'>상품 유형 선택</h3>
            <div className='flex space-x-6'>
              <label className='flex cursor-pointer items-center'>
                <input
                  type='radio'
                  name='productType'
                  value='new'
                  checked={productType === 'new'}
                  onChange={(e) => setProductType(e.target.value as 'new' | 'existing')}
                  className='mr-2 text-blue-600'
                />
                <span className='text-sm font-medium text-gray-700'>✨ 완전히 새로운 상품</span>
              </label>
              <label className='flex cursor-pointer items-center'>
                <input
                  type='radio'
                  name='productType'
                  value='existing'
                  checked={productType === 'existing'}
                  onChange={(e) => setProductType(e.target.value as 'new' | 'existing')}
                  className='mr-2 text-blue-600'
                />
                <span className='text-sm font-medium text-gray-700'>📬 기존 상품에 옵션 추가</span>
              </label>
            </div>
            <p className='mt-2 text-xs text-blue-600'>
              {productType === 'new'
                ? '새로운 상품코드를 생성합니다.'
                : '기존 상품에 새로운 옵션(색상, 사이즈 등)을 추가합니다.'}
            </p>
          </div>

          <div className='grid grid-cols-2 gap-10'>
            <section>
              <div className='mb-3 flex items-center gap-2'>
                <FaBoxArchive className='text-indigo-500' />
                <h3 className='text-md font-semibold'>기본 정보</h3>
              </div>
              <div className='space-y-4'>
                {productType === 'existing' && (
                  <CategorySelect
                    label='기존 상품 선택'
                    value={
                      productOptions.find(
                        (p: { value: string; label: string }) => p.value === selectedProductId
                      )?.label ||
                      selectedProductId ||
                      ''
                    }
                    options={productOptions.map((p: { value: string; label: string }) => p.label)}
                    onChange={(value) => {
                      // label로 선택된 경우 해당 value 찾기
                      const selectedOption = productOptions.find(
                        (p: { value: string; label: string }) => p.label === value
                      );
                      setSelectedProductId(selectedOption?.value || '');
                    }}
                    placeholder='기존 상품을 선택하세요'
                  />
                )}
                {productType === 'new' && (
                  <>
                    <TextInput
                      label='오프라인 상품명'
                      value={form.name || ''}
                      onChange={(val) => handleChange('name', val)}
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
                  </>
                )}
                {productType === 'existing' && selectedProductInfo && (
                  <>
                    <div>
                      <label className='mb-1 block text-sm text-gray-600'>온라인 상품명</label>
                      <div className='h-9 w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700'>
                        {selectedProductInfo.online_name || '-'}
                      </div>
                    </div>
                    <div>
                      <label className='mb-1 block text-sm text-gray-600'>대분류</label>
                      <div className='h-9 w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700'>
                        {selectedProductInfo.big_category || '-'}
                      </div>
                    </div>
                    <div>
                      <label className='mb-1 block text-sm text-gray-600'>중분류</label>
                      <div className='h-9 w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700'>
                        {selectedProductInfo.middle_category || '-'}
                      </div>
                    </div>
                  </>
                )}
                <TextInput
                  label='옵션'
                  value={form.option || ''}
                  onChange={(val) => handleChange('option', val)}
                  placeholder='예: 색상, 사이즈 등'
                />
                <TextInput
                  label='상세 옵션'
                  value={form.detail_option || ''}
                  onChange={(val) => handleChange('detail_option', val)}
                  placeholder='예: M, L, XL 등'
                />
              </div>
            </section>

            <section>
              <div className='mb-3 flex items-center gap-2'>
                <BsCoin className='text-indigo-500' />
                <h3 className='text-md font-semibold'>판매 정보</h3>
              </div>
              <div className='space-y-4'>
                <TextInput
                  label='판매가'
                  type='number'
                  value={form.price?.toString() || ''}
                  onChange={(val) => handleChange('price', Math.max(0, Number(val) || 0))}
                  onKeyDown={handleNumberKeyDown}
                  noSpinner
                />
                <TextInput
                  label='최소 재고수량'
                  type='number'
                  value={Math.max(0, Number(form.min_stock) || 0).toString()}
                  onChange={(val) => handleChange('min_stock', Math.max(0, Number(val) || 0))}
                  onKeyDown={handleNumberKeyDown}
                  noSpinner
                />
                <p className='mt-1 text-xs text-gray-500'>
                  재고가 이 수준 이하로 떨어지면 경고가 표시됩니다.
                </p>

                <div className='mt-4'>
                  <label className='mb-2 block text-sm font-medium text-gray-700'>
                    판매 채널 <span className='text-red-500'>*</span>
                  </label>
                  <div className='flex gap-4'>
                    <label className='flex items-center'>
                      <input
                        type='checkbox'
                        checked={(form.channels || []).includes('online')}
                        onChange={(e) => {
                          const currentChannels = form.channels || [];
                          const channels = e.target.checked
                            ? [...currentChannels, 'online']
                            : currentChannels.filter((c) => c !== 'online');
                          handleChange('channels', channels);
                        }}
                        className='mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                      />
                      온라인
                    </label>
                    <label className='flex items-center'>
                      <input
                        type='checkbox'
                        checked={(form.channels || []).includes('offline')}
                        onChange={(e) => {
                          const currentChannels = form.channels || [];
                          const channels = e.target.checked
                            ? [...currentChannels, 'offline']
                            : currentChannels.filter((c) => c !== 'offline');
                          handleChange('channels', channels);
                        }}
                        className='mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                      />
                      오프라인
                    </label>
                  </div>
                  <p className='mt-1 text-xs text-gray-500'>
                    온라인, 오프라인 중 최소 하나 이상 선택해야 합니다.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <section>
            <div className='mb-3 flex items-center gap-2'>
              <FaClipboardList className='text-indigo-500' />
              <h3 className='text-md font-semibold'>추가 정보</h3>
            </div>

            <label className='text-sm text-gray-600'>상품 설명</label>
            <textarea
              className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm'
              rows={3}
              value={form.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
            />

            <div className='mt-4'>
              <label className='mb-2 block text-sm font-medium text-gray-700'>관리자 메모</label>
              <textarea
                className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500'
                rows={3}
                value={form.memo || ''}
                onChange={(e) => handleChange('memo', e.target.value)}
                placeholder='상품에 대한 추가 메모를 입력하세요'
              />
            </div>
          </section>
        </div>

        <div className='flex justify-end gap-3 border-t border-gray-300 px-6 py-4'>
          <button onClick={onClose} className='rounded-md border px-4 py-2 text-gray-700'>
            취소
          </button>
          <button
            onClick={handleSubmit}
            className='rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700'>
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProductModal;
