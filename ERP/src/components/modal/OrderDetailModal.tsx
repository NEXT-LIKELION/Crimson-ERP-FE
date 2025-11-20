// src/components/modal/OrderDetailModal.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { FiX, FiPrinter, FiDownload, FiRepeat } from 'react-icons/fi';
import { OrderItem as StoreOrderItem } from '../../store/ordersStore';
import axios from '../../api/axios';
import { fetchSuppliers } from '../../api/supplier';
import {
  getStatusDisplayName,
  handleDownloadExcel,
  numberToKorean,
  OrderDetail,
} from '../../utils/orderUtils';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useQueryClient } from '@tanstack/react-query';
import { ORDER_INFO } from '../../constant';
import NewOrderModal from './NewOrderModal';

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
  const printRef = useRef<HTMLDivElement>(null);

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
    // 인쇄 기능 구현
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
      return;
    }

    if (!orderDetail) return;

    // 인쇄할 스타일과 HTML 생성
    const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>발주서 - ${orderDetail.id}</title>
                <meta charset="UTF-8">
                <style>
                    body { 
                        font-family: 'Malgun Gothic', Arial, sans-serif; 
                        margin: 0; 
                        padding: 20px; 
                        color: #333; 
                    }
                    .order-container {
                        border: 1px solid #ddd;
                        padding: 20px;
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    .header { 
                        text-align: center; 
                        font-size: 24px; 
                        font-weight: bold; 
                        margin-bottom: 30px; 
                        border-bottom: 2px solid #333;
                        padding-bottom: 10px;
                    }
                    .info-section { 
                        display: flex; 
                        margin-bottom: 20px; 
                    }
                    .info-column { 
                        flex: 1; 
                        padding: 10px;
                    }
                    .info-item {
                        margin-bottom: 8px;
                    }
                    .label {
                        font-weight: bold;
                        margin-right: 8px;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 20px 0; 
                    }
                    th, td { 
                        border: 1px solid #ddd; 
                        padding: 8px; 
                        text-align: left; 
                    }
                    th { 
                        background-color: #f2f2f2; 
                        text-align: center;
                    }
                    .amount {
                        text-align: right;
                    }
                    .total-row { 
                        font-weight: bold; 
                        background-color: #f9f9f9;
                    }
                    .message {
                        margin: 20px 0;
                        font-size: 14px;
                    }
                    .note-section {
                        margin-top: 20px;
                        border-top: 1px solid #ddd;
                        padding-top: 20px;
                    }
                    .packaging {
                        margin: 15px 0;
                        display: flex;
                        align-items: center;
                    }
                    .packaging-value {
                        border: 1px solid #ddd;
                        background-color: #f9f9f9;
                        padding: 5px 15px;
                        margin-left: 10px;
                        border-radius: 4px;
                    }
                    .work-instruction {
                        border: 1px solid #ddd;
                        padding: 15px;
                        margin-top: 10px;
                        min-height: 60px;
                        background-color: #f9f9f9;
                    }
                    .print-button {
                        margin: 20px 0;
                        padding: 10px 20px;
                        background-color: #4a6bef;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    }
                    @media print {
                        .print-button { display: none; }
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="order-container">
                    <div class="header">발 주 서</div>
                    
                    <div class="info-section">
                        <div class="info-column">
                            <div class="info-item"><span class="label">사업자번호:</span> ${ORDER_INFO.BUSINESS_NUMBER}</div>
                            <div class="info-item"><span class="label">상호:</span> ${ORDER_INFO.COMPANY_NAME}</div>
                            <div class="info-item"><span class="label">대표자:</span> ${ORDER_INFO.CEO}</div>
                            <div class="info-item"><span class="label">주소:</span> ${ORDER_INFO.ADDRESS}</div>
                        </div>
                        <div class="info-column">
                            <div class="info-item"><span class="label">발신:</span> ${ORDER_INFO.COMPANY_NAME}</div>
                            <div class="info-item"><span class="label">전화:</span> ${ORDER_INFO.PHONE}</div>
                            <div class="info-item"><span class="label">담당자:</span> ${orderDetail.manager}</div>
                            <div class="info-item"><span class="label">FAX:</span> ${ORDER_INFO.FAX}</div>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <div class="info-column">
                            <div class="info-item"><span class="label">수신:</span> ${supplierDetail?.name || orderDetail.supplier}</div>
                            <div class="info-item"><span class="label">전화:</span> ${supplierDetail?.contact || '-'}</div>
                            <div class="info-item"><span class="label">담당자:</span> ${supplierDetail?.manager || '-'}</div>
                            <div class="info-item"><span class="label">이메일:</span> ${supplierDetail?.email || '-'}</div>
                        </div>
                    </div>
                    
                    <div class="message">
                        아래와 같이 발주하오니 기일 내 필히 납품하여 주시기 바랍니다.
                    </div>
                    
                    <div class="info-section">
                        <div class="info-column">
                            <div class="info-item"><span class="label">발주일자:</span> ${orderDetail.order_date}</div>
                            <div class="info-item"><span class="label">납품일자:</span> ${
                              orderDetail.expected_delivery_date
                            }</div>
                            <div class="info-item"><span class="label">납품장소:</span> ${ORDER_INFO.DELIVERY_LOCATION}</div>
                        </div>
                        <div class="info-column">
                            <div class="info-item"><span class="label">구매비용:</span> 일금 ${numberToKorean(
                              orderDetail.items.reduce(
                                (total, item) => total + item.quantity * item.unit_price,
                                0
                              )
                            )} (₩${orderDetail.items
                              .reduce((total, item) => total + item.quantity * item.unit_price, 0)
                              .toLocaleString()})</div>
                            <div class="info-item"><span class="label">부가세:</span> ${orderDetail.vat_included ? '포함' : '비포함'}</div>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 50px;">NO</th>
                                <th>발주품목 및 내역</th>
                                <th style="width: 80px;">규격</th>
                                <th style="width: 60px;">단위</th>
                                <th style="width: 60px;">수량</th>
                                <th style="width: 120px;">단가 (VAT 포함)</th>
                                <th style="width: 120px;">금액 (VAT 포함)</th>
                                <th style="width: 60px;">비고</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orderDetail.items
                              .map(
                                (item, index) => `
                                <tr>
                                    <td style="text-align: center;">${index + 1}</td>
                                    <td>${item.item_name}</td>
                                    <td>${item.spec}</td>
                                    <td style="text-align: center;">${item.unit_price.toLocaleString()}원</td>
                                    <td style="text-align: center;">${item.quantity}</td>
                                    <td class="amount">${item.unit_price.toLocaleString()}</td>
                                    <td class="amount">${(item.quantity * item.unit_price).toLocaleString()}</td>
                                    <td>${item.remark || ''}</td>
                                </tr>
                            `
                              )
                              .join('')}
                            <tr class="total-row">
                                <td colspan="4" style="text-align: center;">합계</td>
                                <td style="text-align: center;">${orderDetail.items.reduce(
                                  (total, item) => total + item.quantity,
                                  0
                                )}</td>
                                <td class="amount">${orderDetail.items
                                  .reduce((total, item) => total + item.unit_price, 0)
                                  .toLocaleString()}</td>
                                <td class="amount">${orderDetail.items
                                  .reduce(
                                    (total, item) => total + item.quantity * item.unit_price,
                                    0
                                  )
                                  .toLocaleString()}</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div>
                        <div class="label">작업지시사항:</div>
                        <div class="work-instruction">
                            ${orderDetail.instruction_note || ''}
                        </div>
                    </div>
                    
                    <div class="packaging">
                        <span class="label">포장:</span>
                        <span class="packaging-value">${orderDetail.packaging_included ? '있음' : '없음'}</span>
                    </div>
                    
                    <button class="print-button" onclick="window.print()">인쇄하기</button>
                </div>
            </body>
            </html>
        `;

    printWindow.document.open();
    printWindow.document.write(printContent);
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
        <div ref={printRef} className='overflow-auto p-6'>
          {isLoading ? (
            <div className='flex h-64 items-center justify-center'>
              <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600'></div>
            </div>
          ) : (
            <div className='w-full border border-stone-300'>
              {/* Title */}
              <div className='my-5 text-center'>
                <h3 className='text-xl font-bold'>발 주 서</h3>
              </div>

              {/* Company Information */}
              <div className='mb-3 flex px-5'>
                <div className='w-1/2 space-y-1'>
                  <p>
                    <span className='font-bold'>사업자번호:</span> 682-88-00080
                  </p>
                  <p>
                    <span className='font-bold'>상호:</span> ㈜고대미래
                  </p>
                  <p>
                    <span className='font-bold'>대표자:</span> 유시진
                  </p>
                  <p>
                    <span className='font-bold'>주소:</span> 서울특별시 성북구 안암로145, 고려대학교
                    100주년삼성기념관 103호 크림슨 스토어
                  </p>
                </div>
                <div className='w-1/2 space-y-1'>
                  <p>
                    <span className='font-bold'>발신:</span> ㈜고대미래
                  </p>
                  <p>
                    <span className='font-bold'>전화:</span> 02-3290-5116
                  </p>
                  <p>
                    <span className='font-bold'>담당자:</span> {orderDetail.manager}
                  </p>
                  <p>
                    <span className='font-bold'>FAX:</span> 02-923-0578
                  </p>
                </div>
              </div>

              {/* Supplier Information */}
              <div className='my-5 px-5'>
                <div className='space-y-1'>
                  <p>
                    <span className='font-bold'>수신:</span>{' '}
                    {supplierDetail?.name || orderDetail.supplier}
                  </p>
                  <p>
                    <span className='font-bold'>전화:</span> {supplierDetail?.contact || '-'}
                  </p>
                  <p>
                    <span className='font-bold'>담당자:</span> {supplierDetail?.manager || '-'}
                  </p>
                  <p>
                    <span className='font-bold'>이메일:</span> {supplierDetail?.email || '-'}
                  </p>
                </div>
              </div>

              {/* Order Message */}
              <div className='my-6 px-5'>
                <p className='text-base'>
                  아래와 같이 발주하오니 기일 내 필히 납품하여 주시기 바랍니다.
                </p>
              </div>

              {/* Order Details */}
              <div className='my-5 flex px-5'>
                <div className='w-1/2 space-y-1'>
                  <p>
                    <span className='font-bold'>발주일자:</span> {orderDetail.order_date}
                  </p>
                  <p>
                    <span className='font-bold'>납품일자:</span>{' '}
                    {orderDetail.expected_delivery_date}
                  </p>
                  <p>
                    <span className='font-bold'>납품장소:</span> 고려대학교
                    100주년기념관(크림슨스토어)
                  </p>
                </div>
                <div className='w-1/2 space-y-1'>
                  <p>
                    <span className='font-bold'>구매비용:</span> 일금{' '}
                    {numberToKorean(
                      orderDetail.items.reduce(
                        (total, item) => total + item.quantity * item.unit_price,
                        0
                      )
                    )}{' '}
                    (₩
                    {orderDetail.items
                      .reduce((total, item) => total + item.quantity * item.unit_price, 0)
                      .toLocaleString()}
                    )
                  </p>
                  <p>
                    <span className='font-bold'>부가세:</span>{' '}
                    {orderDetail.vat_included ? '포함' : '비포함'}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className='my-5 px-5'>
                <table className='w-full border border-gray-300'>
                  <thead className='bg-gray-100'>
                    <tr>
                      <th className='w-12 border border-stone-300 p-2 text-center'>NO</th>
                      <th className='border border-stone-300 p-2 text-center'>발주품목 및 내역</th>
                      <th className='w-20 border border-stone-300 p-2 text-center'>규격</th>
                      <th className='w-14 border border-stone-300 p-2 text-center'>단위</th>
                      <th className='w-14 border border-stone-300 p-2 text-center'>수량</th>
                      <th className='w-40 border border-stone-300 p-2 text-center'>
                        단가 (VAT 포함)
                      </th>
                      <th className='w-40 border border-stone-300 p-2 text-center'>
                        금액 (VAT 포함)
                      </th>
                      <th className='w-14 border border-stone-300 p-2 text-center'>비고</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderDetail.items.map((item, index) => (
                      <tr key={item.id}>
                        <td className='border border-stone-300 p-2 text-center'>{index + 1}</td>
                        <td className='border border-stone-300 p-2'>{item.item_name}</td>
                        <td className='border border-stone-300 p-2'>{item.spec}</td>
                        <td className='border border-stone-300 p-2 text-center'>{item.unit}</td>
                        <td className='border border-stone-300 p-2 text-center'>{item.quantity}</td>
                        <td className='border border-stone-300 p-2 text-right'>
                          {item.unit_price.toLocaleString()}
                        </td>
                        <td className='border border-stone-300 p-2 text-right'>
                          {(item.quantity * item.unit_price).toLocaleString()}
                        </td>
                        <td className='border border-stone-300 p-2'>{item.remark || ''}</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={4} className='border border-stone-300 p-2 text-center'>
                        합계
                      </td>
                      <td className='border border-stone-300 p-2 text-center'>
                        {orderDetail.items.reduce((total, item) => total + item.quantity, 0)}
                      </td>
                      <td className='border border-stone-300 p-2 text-right'>
                        {orderDetail.items
                          .reduce((total, item) => total + item.unit_price, 0)
                          .toLocaleString()}
                      </td>
                      <td className='border border-stone-300 p-2 text-right'>
                        {orderDetail.items
                          .reduce((total, item) => total + item.quantity * item.unit_price, 0)
                          .toLocaleString()}
                      </td>
                      <td className='border border-stone-300 p-2'></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Work Instructions */}
              <div className='my-5 px-5'>
                <div className='mb-2'>
                  <span className='font-bold'>작업지시사항:</span>
                </div>
                <div className='min-h-16 border border-gray-300 p-3'>
                  <p>{orderDetail.instruction_note || ''}</p>
                </div>
              </div>

              {/* Packaging */}
              <div className='my-5 flex items-center px-5'>
                <span className='mr-6 font-bold'>포장:</span>
                <div className='rounded-md border border-gray-300 bg-zinc-100 px-3 py-1'>
                  <span>{orderDetail.packaging_included ? '있음' : '없음'}</span>
                </div>
              </div>
            </div>
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
