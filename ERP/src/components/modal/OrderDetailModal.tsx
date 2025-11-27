// src/components/modal/OrderDetailModal.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { FiX, FiPrinter, FiDownload, FiRepeat } from 'react-icons/fi';
import { OrderItem as StoreOrderItem } from '../../store/ordersStore';
import axios from '../../api/axios';
import { fetchSuppliers } from '../../api/supplier';
import { getStatusDisplayName, handleDownloadExcel, OrderDetail } from '../../utils/orderUtils';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useQueryClient } from '@tanstack/react-query';
import NewOrderModal from './NewOrderModal';
import OrderDetailDocument from '../order/OrderDetailDocument';

interface ApiError {
  response?: {
    data?: {
      detail?: string;
    };
  };
}

interface OrderDetailModalProps {
  orderId: number;
  isOpen: boolean;
  onClose: () => void;
  isManager: boolean;
  onReorder?: (reorderData: {
    supplierId?: number;
    supplierName?: string;
    manager?: string;
    items?: Array<{
      product_id: string | null;
      variant: string | null;
      variant_code: string;
      quantity: number;
      cost_price: number;
      unit_price: number;
      unit?: string;
      remark?: string;
      spec: string;
    }>;
    vat_included?: boolean;
    packaging_included?: boolean;
    instruction_note?: string;
    note?: string;
  }) => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  orderId,
  isOpen,
  onClose,
  isManager,
  onReorder,
}) => {
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const documentRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();
  const [suppliers, setSuppliers] = useState<
    Array<{
      id: number;
      name: string;
      contact: string;
      manager: string;
      email: string;
      address: string;
    }>
  >([]);
  const [supplierDetail, setSupplierDetail] = useState<{
    id: number;
    name: string;
    contact: string;
    manager: string;
    email: string;
    address: string;
  } | null>(null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState<boolean>(false);
  const [reorderData, setReorderData] = useState<
    | {
        supplierId?: number;
        supplierName?: string;
        manager?: string;
        items?: Array<{
          product_id: string | null;
          variant: string | null;
          variant_code: string;
          quantity: number;
          cost_price: number;
          unit_price: number;
          unit?: string;
          remark?: string;
          spec: string;
        }>;
        vat_included?: boolean;
        packaging_included?: boolean;
        instruction_note?: string;
        note?: string;
      }
    | undefined
  >(undefined);

  const fetchOrderDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/orders/${orderId}`);
      const orderData = response.data;

      // 필수 필드 검증 (id, supplier, items 등)
      if (!orderData.id || !orderData.supplier || !orderData.items) {
        throw new Error('필수 주문 정보가 누락되었습니다.');
      }

      // OrderDetail 형식으로 변환
      const formattedOrderDetail: OrderDetail = {
        id: orderData.id,
        supplier: orderData.supplier,
        manager: orderData.manager,
        order_date: orderData.order_date,
        expected_delivery_date: orderData.expected_delivery_date,
        status: orderData.status,
        instruction_note: orderData.instruction_note || '',
        note: orderData.note || '',
        created_at: orderData.created_at,
        vat_included: orderData.vat_included || false,
        packaging_included: orderData.packaging_included || false,

        items: orderData.items.map((item: StoreOrderItem) => ({
          id: item.id,
          variant_code: item.variant_code,
          quantity: item.quantity,
          unit_price: item.unit_price,
          unit: item.unit || '',
          remark: item.remark || '',
          spec: item.spec || '',
          item_name: item.item_name || '',
        })),
      };

      setOrderDetail(formattedOrderDetail);
    } catch (error) {
      console.error('주문 세부사항 로드 실패:', error);
      setOrderDetail(null);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    }
  }, [isOpen, orderId, fetchOrderDetails]);

  useEffect(() => {
    if (isOpen) {
      fetchSuppliers().then((res) => setSuppliers(res.data));
    }
  }, [isOpen]);

  useEffect(() => {
    if (orderDetail && suppliers.length > 0) {
      const found = suppliers.find((s) => s.name === orderDetail.supplier);
      setSupplierDetail(found || null);
    }
  }, [orderDetail, suppliers]);

  useEscapeKey(onClose, isOpen);

  const handlePrintOrder = () => {
    if (!orderDetail || !documentRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
      return;
    }

    const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join('');

    const documentHTML = documentRef.current.outerHTML;

    printWindow.document.open();
    printWindow.document.write(`<!DOCTYPE html>
            <html>
            <head>
          <meta charset="UTF-8" />
                <title>발주서 - ${orderDetail.id}</title>
          ${styleTags}
                <style>
            body { background-color: white; padding: 20px; }
            @media print { body { padding: 0; } }
                </style>
            </head>
            <body>
          ${documentHTML}
          <script>
            window.onload = function() { window.print(); };
          </script>
            </body>
      </html>`);
    printWindow.document.close();
  };

  const handleDownloadExcelClick = async () => {
    if (!orderDetail || !supplierDetail) {
      alert('주문 정보 또는 공급업체 정보가 없습니다.');
      return;
    }

    await handleDownloadExcel(orderDetail, supplierDetail);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!orderDetail) return;
    try {
      const response = await axios.patch(`/orders/${orderDetail.id}/`, { status: newStatus });
      const { order, stock_changes } = response.data;
      setOrderDetail(order); // 상세정보 갱신

      // React Query 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['orders'] });

      // 상태 변경 메시지 생성
      const statusText = getStatusDisplayName(newStatus);

      // 실제 재고 변경이 있는 항목만 필터링
      const actualStockChanges =
        stock_changes?.filter(
          (s: { stock_before: number; stock_after: number }) => s.stock_before !== s.stock_after
        ) || [];

      if (actualStockChanges.length > 0) {
        // 실제 재고 변경이 있는 경우
        const stockMessage = actualStockChanges
          .map(
            (s: {
              name: string;
              option: string;
              stock_before: number;
              stock_after: number;
              quantity: number;
            }) =>
              `${s.name}(${s.option}): ${s.stock_before} → ${s.stock_after} (${s.stock_before > s.stock_after ? '-' : '+'}${Math.abs(s.quantity)})`
          )
          .join('\n');
        alert(`상태가 ${statusText}로 변경되었습니다.\n\n재고가 변경되었습니다:\n${stockMessage}`);
      } else {
        // 재고 변경이 없는 경우
        alert(`상태가 ${statusText}로 변경되었습니다.`);
      }
    } catch (e: unknown) {
      const apiError = e as ApiError;
      alert(apiError.response?.data?.detail || '상태 변경 실패');
    }
  };

  const handleReorder = () => {
    if (!orderDetail || !supplierDetail) {
      alert('주문 정보 또는 공급업체 정보가 없습니다.');
      return;
    }

    // OrderDetailItem[]을 OrderItemPayload[]로 변환
    const reorderItems = orderDetail.items.map((item) => ({
      product_id: null, // variant_code만으로는 product_id를 찾을 수 없으므로 null
      variant: null, // variant_code만으로는 variant를 찾을 수 없으므로 null
      variant_code: item.variant_code,
      quantity: item.quantity,
      cost_price: item.unit_price, // VAT 역산 없이 현재 가격 그대로 사용
      unit_price: item.unit_price, // VAT 역산 없이 현재 가격 그대로 사용
      unit: item.unit || 'EA',
      remark: item.remark || '',
      spec: item.spec || '',
    }));

    // 재발주 데이터 구성
    const reorderDataToSet = {
      supplierId: supplierDetail.id,
      supplierName: supplierDetail.name,
      manager: orderDetail.manager,
      items: reorderItems,
      vat_included: orderDetail.vat_included,
      packaging_included: orderDetail.packaging_included,
      instruction_note: orderDetail.instruction_note,
      note: orderDetail.note,
    };

    // 부모 컴포넌트에 재발주 데이터 전달
    if (onReorder) {
      onReorder(reorderDataToSet);
      onClose(); // 현재 모달 닫기
    } else {
      // onReorder가 없으면 기존 방식 (내부에서 관리)
      setReorderData(reorderDataToSet);
      setIsNewOrderModalOpen(true); // NewOrderModal 열기
      // 상태 업데이트가 완료된 후 모달 닫기 (비동기 상태 업데이트 대응)
      setTimeout(() => {
        onClose(); // 현재 모달 닫기
      }, 0);
    }
  };

  if (!isOpen || !orderDetail) {
    // OrderDetailModal이 닫혀도 NewOrderModal은 열려있을 수 있도록 별도로 렌더링
    return (
      <>
        {isNewOrderModalOpen && (
          <NewOrderModal
            isOpen={isNewOrderModalOpen}
            onClose={() => {
              setIsNewOrderModalOpen(false);
              setReorderData(undefined);
            }}
            onSuccess={() => {
              setIsNewOrderModalOpen(false);
              setReorderData(undefined);
              queryClient.invalidateQueries({ queryKey: ['orders'] });
            }}
            initialData={reorderData}
          />
        )}
      </>
    );
  }

  return (
    <div className='bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black'>
      <div className='max-h-[90vh] w-[896px] overflow-auto rounded-lg bg-white shadow-xl'>
        {/* Header */}
        <div className='flex h-16 w-full items-center justify-between border-b border-gray-200 px-4'>
          <h2 className='text-lg font-medium text-gray-900'>발주서 상세보기 - {orderDetail.id}</h2>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-500'>
            <FiX className='h-6 w-6' />
          </button>
        </div>

        {/* Content - PDF로 저장될 부분 */}
        <div className='overflow-auto p-6'>
          {isLoading ? (
            <div className='flex h-64 items-center justify-center'>
              <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600'></div>
            </div>
          ) : (
            <OrderDetailDocument
              ref={documentRef}
              orderDetail={orderDetail}
              supplierDetail={supplierDetail}
            />
          )}
        </div>

        {/* Footer */}
        <div className='flex items-end justify-between px-4 py-4'>
          {/* 좌측: 상태 변경 버튼 그룹 (대표만 가능) */}
          <div className='flex gap-3'>
            {isManager && orderDetail.status !== 'APPROVED' && (
              <button
                className='rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700'
                onClick={() => handleStatusChange('APPROVED')}>
                발주 승인
              </button>
            )}
            {isManager && orderDetail.status !== 'CANCELLED' && (
              <button
                className='rounded bg-red-500 px-4 py-2 text-white transition hover:bg-red-600'
                onClick={() => handleStatusChange('CANCELLED')}>
                발주 취소
              </button>
            )}
            {isManager && orderDetail.status === 'APPROVED' && (
              <button
                className='rounded bg-green-600 px-4 py-2 text-white transition hover:bg-green-700'
                onClick={() => handleStatusChange('COMPLETED')}>
                입고 완료
              </button>
            )}
            {!isManager && (
              <div className='px-4 py-2 text-sm text-gray-500'>상태 변경은 대표만 가능합니다.</div>
            )}
          </div>
          {/* 우측: PDF/인쇄/승인 버튼 */}
          <div className='flex space-x-3'>
            <button
              onClick={handleReorder}
              className='flex items-center rounded bg-yellow-500 px-4 py-2 text-white'>
              <FiRepeat className='mr-2 h-6 w-6' />
              재발주
            </button>
            <button
              onClick={handleDownloadExcelClick}
              className='flex items-center rounded bg-green-600 px-4 py-2 text-white'>
              <FiDownload className='mr-2 h-6 w-6' />
              엑셀 저장
            </button>
            <button
              onClick={handlePrintOrder}
              className='flex items-center rounded bg-indigo-600 px-4 py-2 text-white'>
              <FiPrinter className='mr-2 h-6 w-6' />
              인쇄
            </button>
          </div>
        </div>
      </div>

      {/* 재발주 모달 - 항상 렌더링하되 isOpen으로 제어 */}
      <NewOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => {
          setIsNewOrderModalOpen(false);
          setReorderData(undefined);
        }}
        onSuccess={() => {
          setIsNewOrderModalOpen(false);
          setReorderData(undefined);
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        }}
        initialData={reorderData}
      />
    </div>
  );
};

export default OrderDetailModal;
