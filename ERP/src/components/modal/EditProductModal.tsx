import { useEffect, useState } from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import TextInput from '../input/TextInput';
import SelectInput from '../input/SelectInput';
import PrimaryButton from '../button/PrimaryButton';
import SecondaryButton from '../button/SecondaryButton';
import { useSuppliers } from '../../hooks/queries/useSuppliers';
import { Product, Supplier } from '../../types/product';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useQuery } from '@tanstack/react-query';
import { fetchVariantDetail } from '../../api/inventory';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSave: (product: Product) => void;
  onStockAdjustClick: (variant: {
    variant_code: string;
    product_id: string;
    name: string;
    option: string;
    current_stock: number;
    min_stock: number;
  }) => void;
}

interface SupplierForm {
  supplier_name: string;
  cost_price: number;
  is_primary: boolean;
}

interface EditForm {
  product_id: string;
  name: string;
  variant_id?: number | string;
  variant_code?: string;
  option?: string;
  stock: number;
  min_stock?: number;
  price?: number | string;
  cost_price?: number | string;
  description?: string;
  memo?: string;
  suppliers: SupplierForm[];
  channels: string[];
}

const EditProductModal = ({
  isOpen,
  onClose,
  product,
  onSave,
  onStockAdjustClick,
}: EditProductModalProps) => {
  const { data: suppliersData, isLoading: isLoadingSuppliers } = useSuppliers();
  const supplierOptions = suppliersData?.data?.map((s: Supplier) => s.name) || [];

  // 최신 variant 정보 조회 (실시간 재고 정보 포함)
  const { data: latestVariantData } = useQuery({
    queryKey: ['variantDetail', product?.variant_code],
    queryFn: () => fetchVariantDetail(product?.variant_code || ''),
    enabled: isOpen && !!product?.variant_code,
    staleTime: 0, // 항상 최신 데이터 가져오기
  });
  const [form, setForm] = useState<EditForm>({
    ...product,
    stock: product.stock ?? 0,
    suppliers: Array.isArray(product.suppliers)
      ? product.suppliers.map((s) => ({
          supplier_name: s.name,
          cost_price: s.cost_price,
          is_primary: s.is_primary,
        }))
      : [{ supplier_name: '', cost_price: 0, is_primary: false }],
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

  const handleRemoveSupplier = (index: number) => {
    setForm((prev: EditForm) => {
      const updatedSuppliers = [...prev.suppliers];
      updatedSuppliers.splice(index, 1);
      return { ...prev, suppliers: updatedSuppliers };
    });
  };

  const handleChange = (field: string, value: string | number | string[]) => {
    setForm((prev: EditForm) => ({ ...prev, [field]: value }));
  };

  const handleSupplierChange = (
    index: number,
    field: keyof SupplierForm,
    value: string | number | boolean
  ) => {
    const newSuppliers = [...form.suppliers];
    newSuppliers[index] = { ...newSuppliers[index], [field]: value };
    setForm((prev) => ({ ...prev, suppliers: newSuppliers }));
  };

  const handleAddSupplier = () => {
    setForm((prev: EditForm) => ({
      ...prev,
      suppliers: [...prev.suppliers, { supplier_name: '', cost_price: 0, is_primary: false }],
    }));
  };

  const handleSubmit = () => {
    const errs = [];
    if (!form.name?.trim()) errs.push('상품명을 입력해주세요.');
    if (!form.price || isNaN(Number(form.price))) errs.push('판매가는 숫자여야 합니다.');
    if (!form.channels || form.channels.length === 0)
      errs.push('판매 채널을 최소 하나 이상 선택해주세요.');
    // 원가 데이터 유효성 검사 - 빈 값이면 0으로 처리
    const costPrice =
      form.cost_price === '' || form.cost_price === undefined ? 0 : Number(form.cost_price);
    if (isNaN(costPrice)) {
      errs.push('매입가는 숫자여야 합니다.');
    }

    // 공급업체 검증
    const filteredSuppliers = form.suppliers.filter(
      (s) => s.supplier_name && s.supplier_name !== '선택' && s.supplier_name.trim()
    );

    // 공급업체가 최소 1개는 있어야 함
    if (filteredSuppliers.length === 0) {
      errs.push('공급업체를 최소 1개 이상 선택해주세요.');
    }

    // 추가된 공급업체 행이 있는데 선택되지 않은 경우 체크
    if (filteredSuppliers.length !== form.suppliers.length && filteredSuppliers.length > 0) {
      errs.push('선택하지 않은 공급업체가 있습니다. 삭제 버튼을 눌러 제거해주세요.');
    }

    if (errs.length > 0) {
      alert(errs.join('\n'));
      return;
    }

    const updated = {
      variant_code: form.variant_code, // variant 식별을 위해 추가
      product_id: form.product_id,
      name: form.name,
      option: form.option || '기본',
      price: Number(form.price), // 숫자로 변환
      min_stock: Number(form.min_stock) || 0, // 최소재고가 없는 경우 0으로 설정
      description: form.description || '',
      memo: form.memo || '',
      channels: form.channels, // 판매 채널 추가
    };

    onSave(updated);
    onClose();
  };

  useEffect(() => {
    if (isOpen && product) {
      // 최신 variant 데이터가 있으면 사용, 없으면 기존 product 데이터 사용
      const currentStock = latestVariantData?.data?.stock ?? product.stock ?? 0;

      setForm({
        ...product,
        product_id: product.product_id ?? '',
        stock: currentStock, // 최신 재고 정보 사용
        description: product.description || '',
        memo: product.memo || '',
        min_stock: product.min_stock || 0, // 최소재고가 없는 경우 0으로 설정
        cost_price: product.cost_price || 0, // 원가 데이터가 없는 경우 0으로 설정
        channels: product.channels || [], // 채널 데이터 로딩
        suppliers: Array.isArray(product.suppliers)
          ? product.suppliers.map(
              (s: { name: string; cost_price?: number; is_primary?: boolean }) => ({
                supplier_name: s.name,
                cost_price: s.cost_price || 0,
                is_primary: s.is_primary ?? false,
              })
            )
          : [{ supplier_name: '', cost_price: 0, is_primary: false }],
      });
      setErrors([]);
    }
  }, [isOpen, product, latestVariantData]);

  useEscapeKey(onClose, isOpen);

  if (!isOpen || !product || isLoadingSuppliers) return null;

  const avgCost =
    form.suppliers.length > 0
      ? Math.round(form.suppliers.reduce((sum, s) => sum + s.cost_price, 0) / form.suppliers.length)
      : 0;

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
                <TextInput label='품목코드' value={form.variant_id?.toString() || ''} disabled />
                <TextInput
                  label='상품명'
                  value={form.name || ''}
                  onChange={(val) => handleChange('name', val)}
                />
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
                <TextInput label='매입가' value={avgCost?.toLocaleString() || ''} disabled />
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>현재 재고</label>
                  <div
                    onClick={() => {
                      const currentStock = latestVariantData?.data?.stock ?? form.stock ?? 0;
                      const productName = product.offline_name || form.name || '';
                      onStockAdjustClick({
                        variant_code: form.variant_code || form.variant_id?.toString() || '',
                        product_id: form.product_id,
                        name: productName,
                        option: form.option || '기본',
                        current_stock: currentStock,
                        min_stock: form.min_stock || 0,
                      });
                    }}
                    className='w-full cursor-pointer rounded-md border border-gray-300 bg-blue-50 px-3 py-2 text-sm transition-colors hover:bg-blue-100'
                    title='클릭하여 재고 조정'>
                    {Math.max(0, Number(latestVariantData?.data?.stock ?? form.stock) || 0).toLocaleString()}
                  </div>
                  <p className='mt-1 text-xs text-gray-500'>클릭하여 재고 조정</p>
                </div>
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
                className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                rows={2}
                value={form.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>

            {/* 공급업체 정보 */}
            <div className='rounded-md border border-gray-200'>
              <div className='border-b border-gray-200 bg-gray-50 px-3 py-2'>
                <h3 className='text-sm font-medium text-gray-700'>공급업체 정보</h3>
              </div>
              <div className='overflow-x-auto'>
                <table className='w-full border-collapse text-sm'>
                  <thead>
                    <tr className='border-b border-gray-200 bg-gray-50'>
                      <th className='px-3 py-2 text-left text-xs font-medium text-gray-500'>공급업체</th>
                      <th className='px-3 py-2 text-left text-xs font-medium text-gray-500'>매입가</th>
                      <th className='px-3 py-2 text-center text-xs font-medium text-gray-500'>주요</th>
                      <th className='px-3 py-2 text-center text-xs font-medium text-gray-500'>삭제</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200'>
                    {form.suppliers.map((s, i) => (
                      <tr key={i}>
                        <td className='px-3 py-2'>
                          <SelectInput
                            value={s.supplier_name}
                            options={supplierOptions}
                            onChange={(val) => handleSupplierChange(i, 'supplier_name', val)}
                          />
                        </td>
                        <td className='px-3 py-2'>
                          <TextInput
                            type='number'
                            value={s.cost_price.toString()}
                            onChange={(val) => handleSupplierChange(i, 'cost_price', Number(val))}
                          />
                        </td>
                        <td className='px-3 py-2 text-center'>
                          <input
                            type='checkbox'
                            checked={s.is_primary}
                            onChange={(e) => handleSupplierChange(i, 'is_primary', e.target.checked)}
                            className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                          />
                        </td>
                        <td className='px-3 py-2 text-center'>
                          <button
                            onClick={() => handleRemoveSupplier(i)}
                            className='text-xs text-red-500 hover:text-red-700'>
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className='border-t border-gray-200 px-3 py-2'>
                  <button
                    onClick={handleAddSupplier}
                    className='text-sm text-blue-600 hover:text-blue-700'>
                    + 공급업체 추가
                  </button>
                </div>
              </div>
            </div>

            {/* 관리자 메모 */}
            <div>
              <label className='mb-1.5 block text-sm font-medium text-gray-700'>관리자 메모</label>
              <textarea
                className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
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
