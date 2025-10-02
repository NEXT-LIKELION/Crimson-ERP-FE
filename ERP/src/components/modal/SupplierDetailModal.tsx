import React, { useState, useMemo } from 'react';
import { FiX, FiLoader, FiAlertTriangle } from 'react-icons/fi';
import { useSupplierById, useUpdateSupplierVariant } from '../../hooks/queries/useSuppliers';
import { EnrichedSupplierVariant } from '../../types/product';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface SupplierDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierId: number | null;
}

interface VariantEdit {
  cost_price: number;
  is_primary: boolean;
}

const SupplierDetailModal: React.FC<SupplierDetailModalProps> = ({
  isOpen,
  onClose,
  supplierId,
}) => {
  const [variantEdits, setVariantEdits] = useState<Record<string, VariantEdit>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  // 공급업체 정보 조회
  const { data: supplierData, isLoading: supplierLoading, error: supplierError } = useSupplierById(supplierId ?? 0);
  
  // 공급업체 variant 업데이트 mutation (낙관적 업데이트 포함)
  const updateVariantMutation = useUpdateSupplierVariant();

  const supplier = supplierData?.data;

  // supplier의 variants 배열을 enriched variants로 변환
  const enrichedVariants = useMemo((): EnrichedSupplierVariant[] => {
    if (!supplier?.variants || !Array.isArray(supplier.variants)) {
      return [];
    }

    return supplier.variants.map((variant: { variant_code: string; name: string; option: string; stock: number; cost_price?: number; is_primary?: boolean }) => ({
      variant_code: variant.variant_code,
      product_name: variant.name,
      option: variant.option,
      stock: variant.stock,
      cost_price: variant.cost_price || 0,
      is_primary: variant.is_primary || false,
    }));
  }, [supplier?.variants]);

  // variant 편집 핸들러
  const handleEditChange = (
    code: string,
    field: keyof VariantEdit,
    value: number | boolean,
    original: VariantEdit
  ) => {
    setVariantEdits((prev) => {
      const current = prev[code] ?? {
        cost_price: original.cost_price,
        is_primary: original.is_primary,
      };
      return {
        ...prev,
        [code]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  // 저장 핸들러 (낙관적 업데이트 포함)
  const handleSave = async (variant: EnrichedSupplierVariant) => {
    if (!supplierId) return;

    const code = variant.variant_code;
    const edit = variantEdits[code] || {
      cost_price: variant.cost_price,
      is_primary: variant.is_primary,
    };

    setSavingId(code);
    
    try {
      await updateVariantMutation.mutateAsync({
        supplierId,
        variantCode: code,
        data: {
          cost_price: edit.cost_price,
          is_primary: edit.is_primary,
        }
      });
      
      // 성공 시 편집 상태 초기화
      setVariantEdits((prev) => {
        const newState = { ...prev };
        delete newState[code];
        return newState;
      });
      
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSavingId(null);
    }
  };

  // 배경 클릭으로 닫기
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEscapeKey(onClose, isOpen);

  if (!isOpen || !supplierId) return null;

  // 로딩 상태
  if (supplierLoading) {
    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm' onClick={handleBackdropClick}>
        <div className='w-full max-w-4xl rounded-xl border border-gray-200 bg-white p-6 shadow-lg'>
          <div className='flex h-64 items-center justify-center'>
            <div className='flex flex-col items-center'>
              <FiLoader className='mb-4 h-8 w-8 animate-spin text-blue-600' />
              <p className='font-medium text-gray-600'>공급업체 정보를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (supplierError) {
    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm' onClick={handleBackdropClick}>
        <div className='w-full max-w-4xl rounded-xl border border-gray-200 bg-white p-6 shadow-lg'>
          <div className='flex h-64 items-center justify-center'>
            <div className='rounded-lg border border-red-200 bg-red-50 p-8 text-center'>
              <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100'>
                <FiAlertTriangle className='h-6 w-6 text-red-600' />
              </div>
              <h3 className='mb-2 text-lg font-semibold text-red-800'>데이터를 불러올 수 없습니다</h3>
              <p className='text-red-600'>잠시 후 다시 시도해주세요.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm' onClick={handleBackdropClick}>
      <div className='max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg' onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
          <div className='flex items-center'>
            <div className='mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100'>
              <span className='text-lg font-semibold text-blue-600'>📦</span>
            </div>
            <div>
              <h2 className='text-lg font-semibold text-gray-900'>공급업체 상세 정보</h2>
              <p className='text-sm text-gray-500'>{supplier?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className='text-gray-400 transition-colors hover:text-gray-600'>
            <FiX className='h-5 w-5' />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className='flex-1 overflow-y-auto p-6'>
          {supplier ? (
            <>
              {/* 공급업체 기본 정보 */}
              <div className='mb-8 grid grid-cols-1 gap-4 rounded-lg bg-gray-50 p-6 md:grid-cols-2'>
                <div>
                  <h3 className='mb-4 text-lg font-semibold text-gray-900'>기본 정보</h3>
                  <div className='space-y-3'>
                    <div>
                      <span className='block text-sm font-medium text-gray-600'>업체명</span>
                      <span className='text-gray-900'>{supplier.name}</span>
                    </div>
                    <div>
                      <span className='block text-sm font-medium text-gray-600'>담당자</span>
                      <span className='text-gray-900'>{supplier.manager}</span>
                    </div>
                    <div>
                      <span className='block text-sm font-medium text-gray-600'>연락처</span>
                      <span className='text-gray-900'>{supplier.contact}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className='mb-4 text-lg font-semibold text-gray-900'>연락 정보</h3>
                  <div className='space-y-3'>
                    <div>
                      <span className='block text-sm font-medium text-gray-600'>이메일</span>
                      <span className='text-gray-900'>{supplier.email}</span>
                    </div>
                    <div>
                      <span className='block text-sm font-medium text-gray-600'>주소</span>
                      <span className='text-gray-900'>{supplier.address}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 공급 품목 */}
              <div>
                <h3 className='mb-4 text-lg font-semibold text-gray-900'>
                  공급 품목 ({enrichedVariants.length}개)
                </h3>
                
                {enrichedVariants.length === 0 ? (
                  <div className='rounded-lg border border-gray-200 bg-gray-50 p-8 text-center'>
                    <p className='text-gray-600'>등록된 공급 품목이 없습니다.</p>
                  </div>
                ) : (
                  <div className='overflow-x-auto rounded-lg border border-gray-200'>
                    <table className='w-full border-collapse text-sm text-gray-700'>
                      <thead className='border-b border-gray-300 bg-gray-50'>
                        <tr>
                          <th className='border-b px-4 py-3 text-left font-medium text-gray-900'>CODE</th>
                          <th className='border-b px-4 py-3 text-left font-medium text-gray-900'>품목명</th>
                          <th className='border-b px-4 py-3 text-left font-medium text-gray-900'>옵션</th>
                          <th className='border-b px-4 py-3 text-center font-medium text-gray-900'>재고</th>
                          <th className='border-b px-4 py-3 text-center font-medium text-gray-900'>단가</th>
                          <th className='border-b px-4 py-3 text-center font-medium text-gray-900'>대표</th>
                          <th className='border-b px-4 py-3 text-center font-medium text-gray-900'>저장</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enrichedVariants.map((variant) => {
                          const code = variant.variant_code;
                          const edit = variantEdits[code] || {
                            cost_price: variant.cost_price,
                            is_primary: variant.is_primary,
                          };

                          return (
                            <tr key={code} className='border-b border-gray-100 hover:bg-gray-50'>
                              <td className='px-4 py-3'>
                                <code className='rounded bg-gray-100 px-2 py-1 text-xs'>{code}</code>
                              </td>
                              <td className='px-4 py-3 font-medium'>{variant.product_name}</td>
                              <td className='px-4 py-3'>{variant.option}</td>
                              <td className='px-4 py-3 text-center'>{variant.stock.toLocaleString()}</td>
                              <td className='px-4 py-3 text-center'>
                                <input
                                  type='number'
                                  className='w-24 rounded border border-gray-300 px-2 py-1 text-right text-sm focus:border-blue-500 focus:outline-none'
                                  value={edit.cost_price}
                                  onChange={(e) =>
                                    handleEditChange(code, 'cost_price', Number(e.target.value), {
                                      cost_price: variant.cost_price,
                                      is_primary: variant.is_primary,
                                    })
                                  }
                                />
                              </td>
                              <td className='px-4 py-3 text-center'>
                                <input
                                  type='checkbox'
                                  checked={edit.is_primary}
                                  onChange={(e) =>
                                    handleEditChange(code, 'is_primary', e.target.checked, {
                                      cost_price: variant.cost_price,
                                      is_primary: variant.is_primary,
                                    })
                                  }
                                  className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                                />
                              </td>
                              <td className='px-4 py-3 text-center'>
                                <button
                                  className='rounded bg-blue-600 px-3 py-1 text-xs text-white transition-colors hover:bg-blue-700 disabled:opacity-50'
                                  onClick={() => handleSave(variant)}
                                  disabled={savingId === code}>
                                  {savingId === code ? (
                                    <div className='flex items-center'>
                                      <FiLoader className='mr-1 h-3 w-3 animate-spin' />
                                      저장중
                                    </div>
                                  ) : (
                                    '저장'
                                  )}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className='py-12 text-center'>
              <p className='text-gray-600'>공급업체 정보를 찾을 수 없습니다.</p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className='border-t border-gray-200 bg-gray-50 px-6 py-4'>
          <div className='flex justify-end'>
            <button
              onClick={onClose}
              className='rounded-lg bg-gray-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700'>
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierDetailModal;