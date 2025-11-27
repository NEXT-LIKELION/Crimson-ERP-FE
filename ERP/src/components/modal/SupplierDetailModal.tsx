import React from 'react';
import { FiX, FiLoader, FiAlertTriangle, FiPackage } from 'react-icons/fi';
import { useSupplierById, useSupplierOrders } from '../../hooks/queries/useSuppliers';
import { SupplierOrder, SupplierOrderItem } from '../../types/product';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { formatPhoneNumber } from '../../utils/formatters';

interface SupplierDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierId: number | null;
}

const SupplierDetailModal: React.FC<SupplierDetailModalProps> = ({
  isOpen,
  onClose,
  supplierId,
}) => {
  // 공급업체 기본 정보 조회
  const {
    data: supplierData,
    isLoading: supplierLoading,
    error: supplierError,
  } = useSupplierById(supplierId ?? 0);

  // 공급업체 발주 내역 조회
  const {
    data: ordersData,
    isLoading: ordersLoading,
    error: ordersError,
  } = useSupplierOrders(supplierId ?? 0);

  const supplier = supplierData?.data;
  const ordersResponse = ordersData?.data;

  // 배경 클릭으로 닫기
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEscapeKey(onClose, isOpen);

  if (!isOpen || !supplierId) return null;

  // 로딩 상태
  if (supplierLoading || ordersLoading) {
    return (
      <div
        className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm'
        onClick={handleBackdropClick}>
        <div className='w-full max-w-5xl rounded-xl border border-gray-200 bg-white p-6 shadow-lg'>
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
  if (supplierError || ordersError) {
    return (
      <div
        className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm'
        onClick={handleBackdropClick}>
        <div className='w-full max-w-5xl rounded-xl border border-gray-200 bg-white p-6 shadow-lg'>
          <div className='flex h-64 items-center justify-center'>
            <div className='rounded-lg border border-red-200 bg-red-50 p-8 text-center'>
              <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100'>
                <FiAlertTriangle className='h-6 w-6 text-red-600' />
              </div>
              <h3 className='mb-2 text-lg font-semibold text-red-800'>
                데이터를 불러올 수 없습니다
              </h3>
              <p className='text-red-600'>잠시 후 다시 시도해주세요.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 상태 색상 매핑
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'DELIVERED':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 상태 라벨 매핑
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '대기';
      case 'CONFIRMED':
        return '확정';
      case 'APPROVED':
        return '승인';
      case 'DELIVERED':
        return '완료';
      case 'COMPLETED':
        return '완료';
      case 'CANCELLED':
        return '취소';
      default:
        return status;
    }
  };

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm'
      onClick={handleBackdropClick}>
      <div
        className='max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg'
        onClick={(e) => e.stopPropagation()}>
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
        <div className='max-h-[calc(90vh-180px)] flex-1 overflow-y-auto p-6'>
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
                      <span className='text-gray-900'>{formatPhoneNumber(supplier.contact)}</span>
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

              {/* 발주 내역 */}
              <div>
                <h3 className='mb-4 text-lg font-semibold text-gray-900'>
                  발주 내역 ({ordersResponse?.orders.length || 0}건)
                </h3>

                {!ordersResponse?.orders || ordersResponse.orders.length === 0 ? (
                  <div className='rounded-lg border border-gray-200 bg-gray-50 p-8 text-center'>
                    <FiPackage className='mx-auto mb-3 h-12 w-12 text-gray-400' />
                    <p className='text-gray-600'>등록된 발주 내역이 없습니다.</p>
                  </div>
                ) : (
                  <div className='overflow-x-auto rounded-lg border border-gray-200'>
                    <table className='w-full border-collapse text-sm text-gray-700'>
                      <thead className='border-b border-gray-300 bg-gray-50'>
                        <tr>
                          <th className='border-b px-4 py-3 text-left font-medium text-gray-900'>
                            발주번호
                          </th>
                          <th className='border-b px-4 py-3 text-left font-medium text-gray-900'>
                            발주일
                          </th>
                          <th className='border-b px-4 py-3 text-left font-medium text-gray-900'>
                            예정일
                          </th>
                          <th className='border-b px-4 py-3 text-center font-medium text-gray-900'>
                            상태
                          </th>
                          <th className='border-b px-4 py-3 text-left font-medium text-gray-900'>
                            품목코드
                          </th>
                          <th className='border-b px-4 py-3 text-left font-medium text-gray-900'>
                            품목명
                          </th>
                          <th className='border-b px-4 py-3 text-center font-medium text-gray-900'>
                            수량
                          </th>
                          <th className='border-b px-4 py-3 text-right font-medium text-gray-900'>
                            매입가
                          </th>
                          <th className='border-b px-4 py-3 text-right font-medium text-gray-900'>
                            합계
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordersResponse.orders.map((order: SupplierOrder, orderIndex: number) => {
                          const isEvenOrder = orderIndex % 2 === 0;
                          const bgColor = isEvenOrder ? 'bg-white' : 'bg-gray-50';

                          return (
                            <React.Fragment key={order.id}>
                              {/* 발주의 품목들 */}
                              {order.items.map((item: SupplierOrderItem, itemIndex: number) => (
                                <tr
                                  key={`${order.id}-${item.variant_code}`}
                                  className={`border-b border-gray-100 ${bgColor}`}>
                                  {/* 발주 정보는 첫 행에만 표시 */}
                                  {itemIndex === 0 && (
                                    <>
                                      <td
                                        className='px-4 py-3 font-medium text-gray-900'
                                        rowSpan={order.items.length}>
                                        {order.id}
                                      </td>
                                      <td
                                        className='px-4 py-3 text-gray-700'
                                        rowSpan={order.items.length}>
                                        {new Date(order.order_date).toLocaleDateString('ko-KR')}
                                      </td>
                                      <td
                                        className='px-4 py-3 text-gray-700'
                                        rowSpan={order.items.length}>
                                        {new Date(order.expected_delivery_date).toLocaleDateString(
                                          'ko-KR'
                                        )}
                                      </td>
                                      <td
                                        className='px-4 py-3 text-center'
                                        rowSpan={order.items.length}>
                                        <span
                                          className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(order.status)}`}>
                                          {getStatusLabel(order.status)}
                                        </span>
                                      </td>
                                    </>
                                  )}
                                  {/* 품목 정보는 매 행마다 표시 */}
                                  <td className='px-4 py-3 font-medium'>{item.variant_code}</td>
                                  <td className='px-4 py-3'>{item.item_name}</td>
                                  <td className='px-4 py-3 text-center'>
                                    {item.quantity.toLocaleString()}
                                  </td>
                                  <td className='px-4 py-3 text-right'>
                                    {item.unit_price.toLocaleString()}원
                                  </td>
                                  <td className='px-4 py-3 text-right font-semibold'>
                                    {item.total.toLocaleString()}원
                                  </td>
                                </tr>
                              ))}
                              {/* 발주 소계 행 */}
                              <tr className='border-b-2 border-gray-300 bg-gray-100'>
                                <td
                                  colSpan={8}
                                  className='px-4 py-2 text-right font-semibold text-gray-700'>
                                  발주 {order.id} 소계
                                </td>
                                <td className='px-4 py-2 text-right font-bold text-blue-900'>
                                  {order.total_price.toLocaleString()}원
                                </td>
                              </tr>
                            </React.Fragment>
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
