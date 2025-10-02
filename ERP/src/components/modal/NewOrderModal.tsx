// src/components/modal/NewOrderModal.tsx
import React, { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2, FiShoppingBag, FiCalendar, FiAlertTriangle } from 'react-icons/fi';
import DateInput from '../input/DateInput';
import SelectInput from '../input/SelectInput';
import RadioButton from '../common/RadioButton';
import AddProductModal from './AddProductModal';
import AddSupplierModal from './AddSupplierModal';
import ProductSearchInput from '../input/ProductSearchInput';
import { Order } from '../../store/ordersStore';
import { useAuthStore } from '../../store/authStore';
import { fetchSuppliers, createSupplier, addSupplierVariantMapping } from '../../api/supplier';
import {
  fetchProductOptions,
  fetchVariantDetail,
  fetchVariantsByProductId,
} from '../../api/inventory';
import { createOrder } from '../../api/orders';
import { useEmployees } from '../../hooks/queries/useEmployees';
import { useQueryClient } from '@tanstack/react-query';
import { Supplier, ProductOption } from '../../types/product';
import {
  calculateTotalAmount,
  extractVariantCode,
  validateOrderForm,
  calculateVATPrice,
} from '../../utils/orderUtils';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newOrder: Order) => void;
}

interface OrderItemPayload {
  product_id: string | null;
  variant: string | null;
  variant_code: string;
  quantity: number;
  cost_price: number;
  unit_price: number;
  unit?: string;
  remark?: string;
  spec: string;
}

const NewOrderModal: React.FC<NewOrderModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [supplier, setSupplier] = useState<number>(0);
  const [supplierName, setSupplierName] = useState<string>('');
  const [orderDate, setOrderDate] = useState<Date | null>(null); // 초기값 null
  const [deliveryDate, setDeliveryDate] = useState<Date | null>(null); // 초기값 null
  const [items, setItems] = useState<OrderItemPayload[]>([
    {
      product_id: null,
      variant: null,
      variant_code: '',
      quantity: 1,
      cost_price: 0,
      unit_price: 0,
      unit: 'EA',
      remark: '',
      spec: '',
    },
  ]);
  const [workInstructions, setWorkInstructions] = useState<string>(
    '로고 디자인은 첨부파일대로 적용해 주시기 바랍니다. 샘플 확인 후 본 생산 진행 예정입니다.'
  );
  const [note, setNote] = useState<string>(''); // 발주 이유 (내부 공유용)
  const [includesTax, setIncludesTax] = useState<boolean>(true);
  const [hasPackaging, setHasPackaging] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [variantsByProduct, setVariantsByProduct] = useState<{
    [productId: string]: Array<{ variant_code: string; option: string }>;
  }>({});
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState<boolean>(false);
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState<boolean>(false);
  const [selectedManager, setSelectedManager] = useState<string>('');
  const {
    data: employeesData,
    isLoading: isEmployeesLoading,
    error: employeesError,
  } = useEmployees();
  const employees = employeesData?.data || [];
  const activeEmployees = employees.filter(
    (employee: { is_active?: boolean; status?: string; role?: string }) =>
      employee.role === 'MANAGER' || (employee.is_active === true && employee.status === 'approved')
  );
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (isOpen) {
      fetchSuppliers()
        .then((res) => {
          const supplierData = Array.isArray(res.data) ? res.data : [];
          setSuppliers(supplierData);
        })
        .catch((error) => {
          console.error('Failed to fetch suppliers:', error);
          setSuppliers([]);
          setFormErrors((prev) => [...prev, '공급업체 목록을 불러오는데 실패했습니다.']);
        });

      fetchProductOptions()
        .then((res) => {
          const productData = Array.isArray(res.data) ? res.data : [];
          setProducts(productData);
        })
        .catch((error) => {
          console.error('Failed to fetch product options:', error);
          setProducts([]);
          setFormErrors((prev) => [...prev, '상품 목록을 불러오는데 실패했습니다.']);
        });

      resetForm();
      setSupplierName('');
    }
  }, [isOpen]);

  const resetForm = () => {
    setSupplier(0);
    setSupplierName('');
    setOrderDate(null); // 초기값 null
    setDeliveryDate(null); // 초기값 null
    setItems([
      {
        product_id: null,
        variant: null,
        variant_code: '',
        quantity: 1,
        cost_price: 0,
        unit_price: 0,
        unit: 'EA',
        remark: '',
        spec: '',
      },
    ]);
    setWorkInstructions(
      '로고 디자인은 첨부파일대로 적용해 주시기 바랍니다. 샘플 확인 후 본 생산 진행 예정입니다.'
    );
    setNote('');
    setIncludesTax(true);
    setHasPackaging(true);
    setFormErrors([]);
    setSelectedManager('');
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        product_id: null,
        variant: null,
        variant_code: '',
        quantity: 1,
        cost_price: 0,
        unit_price: 0,
        unit: 'EA',
        remark: '',
        spec: '',
      },
    ]);
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx));
    } else {
      alert('최소 하나의 발주 항목이 필요합니다.');
    }
  };

  const handleItemChange = (idx: number, field: string, value: string | number) => {
    setItems(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const calculateTotal = (): number => {
    return calculateTotalAmount(items, includesTax);
  };

  const validateForm = (): boolean => {
    const errors = validateOrderForm({
      supplier,
      orderDate,
      items,
      workInstructions,
    });

    setFormErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async () => {
    if (!supplier) {
      setFormErrors(['공급업체를 선택해주세요.']);
      return;
    }
    if (!validateForm()) {
      alert('필수 입력값을 모두 입력해주세요.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        supplier,
        order_date: orderDate ? orderDate.toISOString().slice(0, 10) : '',
        expected_delivery_date: deliveryDate ? deliveryDate.toISOString().slice(0, 10) : undefined,
        status: 'PENDING',
        instruction_note: workInstructions || undefined,
        note: note || undefined,
        vat_included: includesTax,
        packaging_included: hasPackaging,
        manager_name: selectedManager || user?.first_name || user?.username || '',
        items: items
          .map((item) => {
            const variant_code = extractVariantCode(item, variantsByProduct);

            return {
              variant_code,
              quantity: item.quantity,
              unit_price: calculateVATPrice(item.cost_price, includesTax),
              unit: item.unit || undefined,
              remark: item.remark || undefined,
              spec: item.spec || undefined,
            };
          })
          .filter((item) => item.variant_code !== ''),
      };
      const res = await createOrder(payload);

      // 발주 생성 성공 후 자동으로 상품 매핑 추가
      try {
        const itemsToMap = items.filter((item) => extractVariantCode(item, variantsByProduct) !== '');

        const mappingPromises = itemsToMap.map(async (item) => {
            const variant_code = extractVariantCode(item, variantsByProduct);
            try {
              await addSupplierVariantMapping(supplier, {
                variant_code,
                cost_price: item.cost_price,
                is_primary: false,
              });
            } catch (error) {
              // 이미 매핑된 경우는 무시 (409 에러 등)
            }
          });

        await Promise.allSettled(mappingPromises);

        // 공급업체 캐시 무효화 (매핑 업데이트 반영)
        queryClient.invalidateQueries({ queryKey: ['suppliers'] });
        queryClient.invalidateQueries({ queryKey: ['supplier', supplier] });
      } catch (error) {
        alert('오류가 발생했습니다.');
        // 매핑 오류는 발주 성공에 영향을 주지 않음
      }

      alert('발주가 성공적으로 신청되었습니다.');
      if (onSuccess) onSuccess(res.data);
      onClose();
    } catch {
      setFormErrors(['발주 신청 중 오류가 발생했습니다. 다시 시도해주세요.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 공급업체 선택 핸들러
  const handleSupplierChange = async (name: string) => {
    setSupplierName(name);
    const found = suppliers.find((s) => s.name === name);
    const supplierId = found ? found.id : 0;
    setSupplier(supplierId);

    // 공급업체 변경 시에도 기존 선택사항 모두 유지
  };

  // 검색을 통한 상품 선택 핸들러 (기존 방식으로 복원)
  const handleProductSearchSelect = async (idx: number, product: ProductOption) => {
    await handleProductChangeByProductId(idx, product.product_id);
  };

  // 상품 변경 공통 로직 (복원)
  const handleProductChangeByProductId = async (idx: number, product_id: string | null) => {
    // 품목 캐시 없으면 fetch
    if (product_id && !variantsByProduct[product_id]) {
      try {
        const res = await fetchVariantsByProductId(product_id);
        // API 응답 구조 확인: res.data.variants 또는 res.data가 배열인지 확인
        const variantsData = res.data.variants || res.data || [];
        const variants = Array.isArray(variantsData) ? variantsData : [];

        // 업체가 선택된 경우 해당 업체의 variant_codes만 필터링
        let filteredVariants = variants;
        if (supplier > 0) {
          const selectedSupplier = suppliers.find((s) => s.id === supplier);
          if (selectedSupplier && selectedSupplier.variant_codes) {
            filteredVariants = variants.filter((variant: { variant_code: string }) =>
              selectedSupplier.variant_codes.includes(variant.variant_code)
            );
          }
        }

        setVariantsByProduct((prev) => ({ ...prev, [product_id]: filteredVariants }));
      } catch (e) {
        console.error('Failed to fetch variants:', e);
        setVariantsByProduct((prev) => ({ ...prev, [product_id]: [] }));
      }
    }
    // 상품 바뀌면 품목, 단가, 규격 초기화 (규격은 빈 문자열로)
    setItems(
      items.map((item, i) =>
        i === idx
          ? {
              ...item,
              product_id,
              variant: null,
              variant_code: '',
              unit_price: 0,
              spec: '', // 규격은 빈 문자열로 초기화
            }
          : item
      )
    );
  };

  // 5. 행별 품목 선택 핸들러 (자동 입력 포함)
  const handleVariantChange = async (idx: number, option: string) => {
    // 기본 variant 설정
    handleItemChange(idx, 'variant', option);

    // variant_code 찾기
    const item = items[idx];
    if (!item.product_id) return;

    const variants = variantsByProduct[item.product_id] || [];
    const selectedVariant = variants.find(
      (v: { option: string; variant_code: string }) => v.option === option
    );

    if (selectedVariant) {
      // variant_code 설정
      handleItemChange(idx, 'variant_code', selectedVariant.variant_code);

      try {
        // variant 상세 정보 조회하여 자동 입력
        const variantDetailRes = await fetchVariantDetail(selectedVariant.variant_code);
        const variantDetail = variantDetailRes.data;

        // 자동 입력: 가격과 규격
        setItems(
          items.map((currentItem, i) =>
            i === idx
              ? {
                  ...currentItem,
                  variant: option,
                  variant_code: selectedVariant.variant_code,
                  cost_price: variantDetail.cost_price || 0,
                  unit_price: variantDetail.price || 0,
                  // spec은 사용자가 직접 입력하도록 자동 입력 제거
                }
              : currentItem
          )
        );
      } catch (error) {
        console.error('Failed to fetch variant detail:', error);
        // 에러 발생 시 기본값만 설정
        setItems(
          items.map((currentItem, i) =>
            i === idx
              ? {
                  ...currentItem,
                  variant: option,
                  variant_code: selectedVariant.variant_code,
                }
              : currentItem
          )
        );
      }
    }
  };

  // 신상품 추가 성공 핸들러
  const handleProductAdded = async () => {
    try {
      // React Query 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['productOptions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });

      // 상품 목록 다시 불러오기
      const res = await fetchProductOptions();
      const productData = Array.isArray(res.data) ? res.data : [];
      setProducts(productData);
      setIsAddProductModalOpen(false);
    } catch (error) {
      console.error('Failed to refresh products:', error);
    }
  };

  // 새 공급자 생성 핸들러
  const handleCreateSupplier = async (supplierData: Record<string, unknown>) => {
    try {
      // 공급업체 생성 API 호출
      await createSupplier({
        name: supplierData.name as string,
        contact: supplierData.contact as string,
        manager: supplierData.manager as string,
        email: supplierData.email as string,
        address: supplierData.address as string,
        variant_codes: [], // 선택사항이므로 빈 배열로 설정
      });

      // 성공 후 공급자 목록 다시 불러오기
      const res = await fetchSuppliers();
      const updatedSupplierData = Array.isArray(res.data) ? res.data : [];
      setSuppliers(updatedSupplierData);
      setIsAddSupplierModalOpen(false);

      // 성공 메시지
      alert('공급업체가 성공적으로 추가되었습니다.');
    } catch (error) {
      console.error('Failed to create supplier:', error);
      setFormErrors((prev) => [...prev, '공급업체 추가에 실패했습니다. 다시 시도해주세요.']);
    }
  };

  useEscapeKey(onClose, isOpen);

  if (!isOpen) return null;

  return (
    <div className='bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black'>
      <div className='relative max-h-[90vh] w-[1100px] overflow-auto rounded-lg bg-white shadow-xl'>
        {/* 전체 로딩 상태 표시 */}
        {isEmployeesLoading && (
          <div className='bg-opacity-90 absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-white'>
            <div className='text-center'>
              <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600'></div>
              <p className='text-lg font-medium text-gray-800'>잠시만 기다려주세요</p>
              <p className='mt-1 text-sm text-gray-600'>직원 데이터를 불러오는 중입니다...</p>
            </div>
          </div>
        )}
        {/* Header */}
        <div className='flex items-center justify-between border-b border-gray-200 px-4 py-4'>
          <div className='flex items-center'>
            <FiShoppingBag className='mr-2 h-6 w-6 text-indigo-500' />
            <h2 className='text-lg font-medium text-gray-900'>새 발주 신청</h2>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-500'
            disabled={isSubmitting}>
            <FiX className='h-6 w-6' />
          </button>
        </div>

        {/* Content */}
        <div className='space-y-6 p-6'>
          {/* 에러 상태 표시 */}
          {employeesError && (
            <div className='rounded-md border border-red-200 bg-red-50 p-4'>
              <div className='flex items-start'>
                <FiAlertTriangle className='mt-0.5 mr-2 h-5 w-5 text-red-600' />
                <div>
                  <h3 className='text-sm font-medium text-red-800'>직원 데이터 로딩 오류</h3>
                  <p className='mt-1 text-sm text-red-700'>
                    직원 목록을 불러오는 중 오류가 발생했습니다. 일부 기능이 제한될 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* 폼 오류 메시지 표시 */}
          {formErrors.length > 0 && (
            <div className='rounded-md border border-red-200 bg-red-50 p-4'>
              <div className='flex items-start'>
                <FiAlertTriangle className='mt-0.5 mr-2 h-5 w-5 text-red-600' />
                <div>
                  <h3 className='text-sm font-medium text-red-800'>다음 오류를 확인해주세요:</h3>
                  <ul className='mt-2 list-inside list-disc text-sm text-red-700'>
                    {formErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 공급업체 정보 + 발주 정보 + 부가 정보 */}
          <div className='flex items-start justify-start gap-6'>
            {/* 왼쪽: 공급업체 정보 */}
            <div className='w-96 space-y-4'>
              <div className='flex items-center'>
                <FiShoppingBag className='mr-2 h-6 w-6 text-gray-900' />
                <h3 className='text-base font-medium text-gray-900'>공급업체 정보</h3>
              </div>
              <div className='space-y-1'>
                <label className='block text-sm font-medium text-gray-700'>
                  공급업체 선택 <span className='text-red-500'>*</span>
                </label>
                <div className='flex gap-2'>
                  <div className='flex-1'>
                    <SelectInput
                      defaultText='공급업체 선택'
                      options={suppliers.map((s) => s.name)}
                      value={supplierName}
                      onChange={handleSupplierChange}
                    />
                  </div>
                  <button
                    onClick={() => setIsAddSupplierModalOpen(true)}
                    className='flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700'
                    disabled={isSubmitting}>
                    <FiPlus className='mr-1 h-4 w-4' />새 공급자
                  </button>
                </div>
              </div>
              <div className='space-y-1'>
                <label className='block text-sm font-medium text-gray-700'>담당자</label>
                {isEmployeesLoading ? (
                  <div className='rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-500'>
                    직원 목록 로딩 중...
                  </div>
                ) : employeesError ? (
                  <div className='rounded-md border border-gray-300 px-3 py-2 text-sm text-red-500'>
                    직원 목록을 불러올 수 없습니다
                  </div>
                ) : (
                  <SelectInput
                    defaultText='담당자 선택'
                    options={activeEmployees.map(
                      (e: { first_name?: string; username: string }) => e.first_name || e.username
                    )}
                    value={selectedManager}
                    onChange={(name: string) => setSelectedManager(name)}
                    disabled={isSubmitting}
                  />
                )}
              </div>
            </div>
            {/* 가운데: 발주 정보 */}
            <div className='w-72 space-y-4'>
              <div className='flex items-center'>
                <FiCalendar className='mr-2 h-6 w-6 text-gray-900' />
                <h3 className='text-base font-medium text-gray-900'>발주 정보</h3>
              </div>
              <div className='space-y-1'>
                <label className='block text-sm font-medium text-gray-700'>
                  발주일자 <span className='text-red-500'>*</span>
                </label>
                <DateInput placeholder='발주일자 선택' value={orderDate} onChange={setOrderDate} />
              </div>
              <div className='space-y-1'>
                <label className='block text-sm font-medium text-gray-700'>
                  예상 납품일 <span className='text-red-500'>*</span>
                </label>
                <DateInput
                  placeholder='예상 납품일 선택'
                  value={deliveryDate}
                  onChange={setDeliveryDate}
                />
              </div>
            </div>
            {/* 오른쪽: 부가 정보 */}
            <div className='w-96 space-y-4'>
              <h3 className='text-base font-medium text-gray-900'>부가 정보</h3>
              <div className='flex items-center'>
                <span className='pr-4 text-sm font-medium text-gray-700'>부가세:</span>
                <div className='flex space-x-4'>
                  <RadioButton
                    label='포함'
                    value='include'
                    checked={includesTax}
                    onChange={() => setIncludesTax(true)}
                    disabled={isSubmitting}
                  />
                  <RadioButton
                    label='미포함'
                    value='exclude'
                    checked={!includesTax}
                    onChange={() => setIncludesTax(false)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className='flex items-center'>
                <span className='pr-4 text-sm font-medium text-gray-700'>포장:</span>
                <div className='flex space-x-4'>
                  <RadioButton
                    label='있음'
                    value='yes'
                    checked={hasPackaging}
                    onChange={() => setHasPackaging(true)}
                    disabled={isSubmitting}
                  />
                  <RadioButton
                    label='없음'
                    value='no'
                    checked={!hasPackaging}
                    onChange={() => setHasPackaging(false)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center'>
                <FiShoppingBag className='mr-2 h-6 w-6 text-gray-900' />
                <h3 className='text-base font-medium text-gray-900'>
                  발주 품목 <span className='text-red-500'>*</span>
                </h3>
              </div>
              <div className='flex items-center gap-2'>
                <button
                  onClick={handleAddItem}
                  className='flex items-center rounded-md bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-700'
                  disabled={isSubmitting}>
                  <FiPlus className='mr-1 h-3.5 w-3.5' />
                  항목 추가
                </button>
              </div>
            </div>
            <div className='overflow-visible rounded-md border border-gray-200'>
              <div className='min-w-[1100px] table-fixed'>
                {/* Table Header */}
                <div className='h-12 bg-gray-50 border-b border-gray-200'>
                  <div className='flex h-12 items-center'>
                    <div className='flex w-36 items-center justify-start px-3 py-2 flex-shrink-0'>
                      <span className='text-xs font-medium text-gray-500 uppercase'>
                        상품 <span className='text-red-500'>*</span>
                      </span>
                    </div>
                    <div className='flex w-36 items-center justify-start px-3 py-2 flex-shrink-0'>
                      <span className='text-xs font-medium text-gray-500 uppercase'>
                        상세 <span className='text-red-500'>*</span>
                      </span>
                    </div>
                    <div className='flex w-32 items-center justify-start px-3 py-2 flex-shrink-0'>
                      <span className='text-xs font-medium text-gray-500 uppercase'>
                        규격
                      </span>
                    </div>
                    <div className='flex w-20 items-center justify-center px-3 py-2 flex-shrink-0'>
                      <span className='text-xs font-medium text-gray-500 uppercase'>단위</span>
                    </div>
                    <div className='flex w-24 items-center justify-center px-3 py-2 flex-shrink-0'>
                      <span className='text-xs font-medium text-gray-500 uppercase'>
                        수량 <span className='text-red-500'>*</span>
                      </span>
                    </div>
                    <div className='flex w-28 items-center justify-center px-3 py-2 flex-shrink-0'>
                      <span className='text-xs font-medium text-gray-500 uppercase'>
                        매입가 <span className='text-red-500'>*</span>
                      </span>
                    </div>
                    <div className='flex w-28 items-center justify-center px-3 py-2 flex-shrink-0'>
                      <span className='text-xs font-medium text-gray-500 uppercase'>
                        판매가
                      </span>
                    </div>
                    <div className='flex w-24 items-center justify-center px-3 py-2 flex-shrink-0'>
                      <span className='text-xs font-medium text-gray-500 uppercase'>금액</span>
                    </div>
                    <div className='flex w-32 items-center justify-start px-3 py-2 flex-shrink-0'>
                      <span className='text-xs font-medium text-gray-500 uppercase'>비고</span>
                    </div>
                    <div className='flex w-16 items-center justify-center px-2 py-2 flex-shrink-0'>
                      <span className='text-xs font-medium text-gray-500 uppercase'>삭제</span>
                    </div>
                  </div>
                </div>
                {/* Table Body */}
                <div className='bg-white'>
                  {items.map((item, idx) => (
                    <div key={idx} className='flex h-24 border-t border-gray-200 items-center'>
                      {/* 상품 검색 및 드롭다운 */}
                      <div className='flex w-36 items-center px-3 py-2 flex-shrink-0'>
                        <div className='flex w-full flex-col gap-2'>
                          {/* 상품 검색 */}
                          <ProductSearchInput
                            placeholder='기존 상품 검색...'
                            value={(() => {
                              const found = products.find((p) => p.product_id === item.product_id);
                              return found ? found.name : '';
                            })()}
                            onSelect={(product) => handleProductSearchSelect(idx, product)}
                            disabled={isSubmitting}
                          />

                          <button
                            onClick={() => setIsAddProductModalOpen(true)}
                            className='flex items-center justify-center rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600'
                            disabled={isSubmitting}>
                            <FiPlus className='mr-1 h-3 w-3' />
                            신상품
                          </button>
                        </div>
                      </div>
                      {/* 품목 드롭다운 */}
                      <div className='flex w-36 items-center px-3 py-2 flex-shrink-0'>
                        <SelectInput
                          defaultText='품목 선택'
                          options={
                            item.product_id && variantsByProduct[item.product_id]
                              ? variantsByProduct[item.product_id].map((v) => v.option)
                              : []
                          }
                          onChange={(option: string) => {
                            handleVariantChange(idx, option);
                          }}
                          value={item.variant ?? ''}
                          disabled={isSubmitting || !item.product_id}
                        />
                      </div>
                      <div className='flex w-32 items-center px-3 py-2 flex-shrink-0'>
                        <input
                          type='text'
                          value={item.spec}
                          onChange={(e) => handleItemChange(idx, 'spec', e.target.value)}
                          placeholder='규격'
                          className={`w-full rounded-md border border-gray-300 px-2 py-1 text-sm placeholder-gray-400 ${
                            item.spec && item.variant ? 'border-blue-300 bg-blue-50' : ''
                          }`}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className='flex w-20 items-center justify-center px-3 py-2 flex-shrink-0'>
                        <input
                          type='text'
                          value={item.unit}
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                          className='w-full rounded-md border border-gray-300 px-2 py-1 text-center text-sm'
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className='flex w-24 items-center justify-center px-3 py-2 flex-shrink-0'>
                        <input
                          type='number'
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(idx, 'quantity', parseInt(e.target.value) || 0)
                          }
                          className='w-full rounded-md border border-gray-300 px-2 py-1 text-center text-sm'
                          min='1'
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className='flex w-28 items-center justify-center px-3 py-2 flex-shrink-0'>
                        <input
                          type='number'
                          value={item.cost_price}
                          onChange={(e) =>
                            handleItemChange(idx, 'cost_price', parseInt(e.target.value) || 0)
                          }
                          className={`w-full rounded-md border border-gray-300 px-2 py-1 text-center text-sm ${
                            item.cost_price > 0 && item.variant ? 'border-blue-300 bg-blue-50' : ''
                          }`}
                          min='0'
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className='flex w-28 items-center justify-center px-3 py-2 flex-shrink-0'>
                        <input
                          type='number'
                          value={item.unit_price}
                          onChange={(e) =>
                            handleItemChange(idx, 'unit_price', parseInt(e.target.value) || 0)
                          }
                          className='w-full rounded-md border border-gray-300 px-2 py-1 text-center text-sm'
                          min='0'
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className='flex w-24 items-center justify-center px-3 py-2 flex-shrink-0'>
                        <div className='text-sm font-medium text-gray-900 text-center'>
                          {(item.quantity && item.cost_price
                            ? includesTax
                              ? item.quantity * item.cost_price
                              : Math.round(item.quantity * item.cost_price * 1.1)
                            : 0
                          ).toLocaleString()}
                          원
                        </div>
                      </div>
                      <div className='flex w-32 items-center px-3 py-2 flex-shrink-0'>
                        <input
                          type='text'
                          value={item.remark}
                          onChange={(e) => handleItemChange(idx, 'remark', e.target.value)}
                          placeholder='비고'
                          className='w-full rounded-md border border-gray-300 px-2 py-1 text-sm placeholder-gray-400'
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className='flex w-16 items-center justify-center px-2 py-2 flex-shrink-0'>
                        <button
                          type='button'
                          className='text-red-500 hover:text-red-700 p-1'
                          onClick={() => handleRemoveItem(idx)}
                          disabled={isSubmitting}>
                          <FiTrash2 className='h-4 w-4' />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Total Row */}
                  <div className='flex h-12 border-t-2 border-gray-300 bg-gray-50 items-center'>
                    <div className='flex w-[624px] items-center justify-end px-3 py-2'>
                      <span className='text-sm font-semibold text-gray-900'>합계</span>
                    </div>
                    <div className='flex w-24 items-center justify-center px-3 py-2'>
                      <span className='text-sm font-bold text-gray-900'>
                        {calculateTotal().toLocaleString()}원
                      </span>
                    </div>
                    <div className='flex w-[452px] items-center px-3 py-2'></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 작업지시사항과 발주 이유 */}
          <div className='flex items-start justify-start gap-6'>
            <div className='w-1/2 space-y-3'>
              <h3 className='text-base font-medium text-gray-900'>
                작업지시사항 <span className='text-red-500'>*</span>
              </h3>
              <textarea
                value={workInstructions}
                onChange={(e) => setWorkInstructions(e.target.value)}
                className='h-24 w-full rounded-md border border-gray-300 px-3 py-2 text-sm'
                placeholder='작업지시사항을 입력해주세요.'
                disabled={isSubmitting}
              />
            </div>
            <div className='w-1/2 space-y-3'>
              <h3 className='text-base font-medium text-gray-900'>발주 이유 (내부 공유용)</h3>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className='h-24 w-full rounded-md border border-gray-300 px-3 py-2 text-sm'
                placeholder='발주 이유를 입력해주세요.'
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Footer */}
          <div className='flex items-center justify-end border-t border-gray-200 pt-4'>
            <div className='flex space-x-3'>
              <button
                onClick={onClose}
                className='rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm'
                disabled={isSubmitting}>
                취소
              </button>
              <button
                onClick={handleSubmit}
                className={`rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm ${
                  isSubmitting ? 'cursor-not-allowed opacity-70' : ''
                }`}
                disabled={isSubmitting}>
                {isSubmitting ? '처리 중...' : '발주 신청'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 신상품 추가 모달 */}
      {isAddProductModalOpen && (
        <AddProductModal
          isOpen={isAddProductModalOpen}
          onClose={() => setIsAddProductModalOpen(false)}
          onSave={handleProductAdded}
        />
      )}

      {/* 새 공급자 추가 모달 */}
      {isAddSupplierModalOpen && (
        <AddSupplierModal
          isOpen={isAddSupplierModalOpen}
          onClose={() => setIsAddSupplierModalOpen(false)}
          onSave={handleCreateSupplier}
        />
      )}
    </div>
  );
};

export default NewOrderModal;
