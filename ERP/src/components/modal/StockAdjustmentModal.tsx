import React, { useState, useEffect } from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import { FaBoxes } from 'react-icons/fa';
import TextInput from '../input/TextInput';
import PrimaryButton from '../button/PrimaryButton';
import SecondaryButton from '../button/SecondaryButton';
import { useAuthStore } from '../../store/authStore';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useAdjustStock, useStockHistory } from '../../hooks/queries/useStockAdjustment';
import { useQuery } from '@tanstack/react-query';
import { fetchVariantDetail } from '../../api/inventory';
import { InventoryAdjustment } from '../../types/product';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant: {
    variant_code: string;
    product_id: string;
    name: string;
    option: string;
    current_stock: number;
    min_stock: number;
  } | null;
  onSuccess?: () => void;
  year?: number; // 재고조정 대상 연도 (미지정 시 현재 연도)
  month?: number; // 재고조정 대상 월 (미지정 시 현재 월)
}

const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  variant,
  onSuccess,
  year,
  month,
}) => {
  const user = useAuthStore((state) => state.user);
  const adjustStockMutation = useAdjustStock();
  const [actualStock, setActualStock] = useState<string>('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  // props로 전달받은 연도/월 사용, 없으면 현재 연도/월 사용
  const currentYear = year ?? new Date().getFullYear();
  const currentMonth = month ?? new Date().getMonth() + 1;

  // 최신 variant 정보 조회 (실시간 재고 정보 포함)
  const { data: latestVariantData } = useQuery({
    queryKey: ['variantDetail', variant?.variant_code],
    queryFn: () => fetchVariantDetail(variant?.variant_code || ''),
    enabled: isOpen && !!variant?.variant_code,
    staleTime: 0, // 항상 최신 데이터 가져오기
  });

  // 재고조정 이력 조회
  const { data: adjustmentHistory } = useStockHistory({
    variant_code: variant?.variant_code,
    year: currentYear,
    month: currentMonth,
    page: 1,
  });

  const adjustments: InventoryAdjustment[] = adjustmentHistory?.results || [];

  // 모달이 열릴 때마다 초기화
  useEffect(() => {
    if (isOpen && variant) {
      // 최신 variant 데이터가 있으면 사용, 없으면 기존 variant 데이터 사용
      const currentStock = latestVariantData?.data?.stock ?? variant.current_stock;
      setActualStock(currentStock.toString());
      setReason('');
      setErrors([]);
    }
  }, [isOpen, variant, latestVariantData]);

  // 숫자 입력에서 음수/지수 입력 차단
  const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const blockedKeys = ['-', '+', 'e', 'E'];
    if (blockedKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleSubmit = async () => {
    if (!variant) return;

    const errs = [];
    const actualStockNum = Math.max(0, parseInt(actualStock));

    if (!actualStock.trim() || isNaN(actualStockNum)) {
      errs.push('실제 재고수량을 올바르게 입력해주세요.');
    }
    // 음수 입력은 0으로 자동 보정
    if (!reason.trim()) {
      errs.push('조정 사유를 입력해주세요.');
    }

    if (errs.length > 0) {
      setErrors(errs);
      return;
    }

    // 최신 재고 데이터 사용
    const currentStockFromLatest = latestVariantData?.data?.stock ?? variant.current_stock;
    const delta = actualStockNum - currentStockFromLatest;

    if (delta === 0) {
      alert('현재 재고와 동일한 수량입니다. 조정이 필요하지 않습니다.');
      return;
    }

    const confirmMessage = `재고를 조정하시겠습니까?\n\n현재 재고: ${currentStockFromLatest}EA\n실제 재고: ${actualStockNum}EA\n변경량: ${delta > 0 ? '+' : ''}${delta}EA\n\n사유: ${reason}`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    adjustStockMutation.mutate(
      {
        variantCode: variant.variant_code,
        data: {
          delta: delta,
          reason: reason.trim(),
          created_by: user?.username || 'unknown',
          year: currentYear,
          month: currentMonth,
        },
      },
      {
        onSuccess: () => {
          alert('재고 조정이 완료되었습니다.');
          onSuccess?.();
          onClose();
        },
        onError: (error: unknown) => {
          console.error('재고 조정 실패:', error);
          const apiError = error as ApiError;
          const errorMsg =
            ('response' in (error as object) && apiError?.response?.data?.error) ||
            '재고 조정 중 오류가 발생했습니다.';
          setErrors([errorMsg]);
        },
      }
    );
  };

  useEscapeKey(onClose, isOpen);

  if (!isOpen || !variant) return null;

  // 최신 재고 데이터 사용
  const currentStockFromLatest = latestVariantData?.data?.stock ?? variant.current_stock;
  const delta = parseInt(actualStock) - currentStockFromLatest;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm'>
      <div className='mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-lg'>
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
          <div className='flex items-center gap-2'>
            <FaBoxes className='text-blue-500' />
            <h2 className='text-lg font-semibold'>재고 조정</h2>
          </div>
          <button onClick={onClose} disabled={adjustStockMutation.isPending}>
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

            {/* 상품 정보 - 간소화 */}
            <div className='grid grid-cols-2 gap-3 text-sm'>
              <div>
                <span className='text-gray-500'>상품코드</span>
                <p className='font-medium'>{variant.product_id}</p>
              </div>
              <div>
                <span className='text-gray-500'>품목코드</span>
                <p className='font-medium'>{variant.variant_code}</p>
              </div>
              <div className='col-span-2'>
                <span className='text-gray-500'>상품명</span>
                <p className='font-medium'>{variant.name}</p>
              </div>
            </div>

            {/* 재고 현황 - 간소화 */}
            <div className='flex items-center gap-4 rounded-md border border-gray-200 bg-gray-50 p-3'>
              <div>
                <span className='text-xs text-gray-500'>현재 재고</span>
                <p className='text-lg font-semibold text-gray-900'>{currentStockFromLatest}EA</p>
              </div>
              <div className='h-8 w-px bg-gray-300' />
              <div>
                <span className='text-xs text-gray-500'>최소 재고</span>
                <p className='text-sm font-medium text-gray-700'>{variant.min_stock}EA</p>
              </div>
            </div>

            {/* 재고조정 이력 */}
            {adjustments.length > 0 && (
              <div className='rounded-md border border-gray-200 bg-gray-50'>
                <div className='border-b border-gray-200 px-3 py-2'>
                  <h3 className='text-sm font-medium text-gray-700'>
                    조정 이력 ({currentYear}년 {currentMonth}월)
                  </h3>
                </div>
                <div className='max-h-48 overflow-y-auto'>
                  <div className='divide-y divide-gray-200'>
                    {adjustments.map((adj) => (
                      <div key={adj.id} className='px-3 py-2 text-xs'>
                        <div className='flex items-start justify-between gap-2'>
                          <div className='min-w-0 flex-1'>
                            <div className='flex items-center gap-2'>
                              <span
                                className={`font-medium ${
                                  adj.delta > 0
                                    ? 'text-green-600'
                                    : adj.delta < 0
                                      ? 'text-red-600'
                                      : 'text-gray-600'
                                }`}>
                                {adj.delta > 0 ? '+' : ''}
                                {adj.delta}EA
                              </span>
                              <span className='text-gray-500'>·</span>
                              <span className='text-gray-600'>{adj.created_by}</span>
                              <span className='text-gray-400'>{formatDate(adj.created_at)}</span>
                            </div>
                            <p className='mt-1 text-gray-600'>{adj.reason}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 조정 입력 */}
            <div className='space-y-3'>
              <TextInput
                label='실제 재고수량'
                type='number'
                value={actualStock}
                onChange={(val) => {
                  // 빈 값은 허용, 음수는 무시
                  if (val === '') {
                    setActualStock('');
                    return;
                  }
                  const n = Number(val);
                  if (!Number.isNaN(n) && n >= 0) {
                    setActualStock(val);
                  }
                }}
                onKeyDown={handleNumberKeyDown}
                noSpinner
                placeholder='실제 확인한 재고수량을 입력하세요'
              />

              {actualStock && !isNaN(parseInt(actualStock)) && (
                <div
                  className={`rounded-md border p-2.5 ${
                    delta > 0
                      ? 'border-green-200 bg-green-50'
                      : delta < 0
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                  }`}>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='text-gray-600'>변경량</span>
                    <span
                      className={`font-semibold ${
                        delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                      {delta > 0 ? '+' : ''}
                      {delta}EA
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className='mb-1.5 block text-sm font-medium text-gray-700'>
                  조정 사유 <span className='text-red-500'>*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder='예: 2025년 1분기 실사, 파손/불량, 도난/분실 등'
                  rows={2}
                  className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
                />
              </div>
            </div>
          </div>
        </div>

        <div className='flex justify-end gap-3 border-t border-gray-200 px-6 py-4'>
          <SecondaryButton text='취소' onClick={onClose} disabled={adjustStockMutation.isPending} />
          <PrimaryButton
            text={adjustStockMutation.isPending ? '조정 중...' : '재고 조정'}
            onClick={handleSubmit}
            disabled={adjustStockMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
};

export default StockAdjustmentModal;
