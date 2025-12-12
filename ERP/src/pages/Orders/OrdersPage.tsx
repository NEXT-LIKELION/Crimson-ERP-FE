import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FiPlus, FiSearch, FiLoader, FiDownload } from 'react-icons/fi';
import PrimaryButton from '../../components/button/PrimaryButton';
import GreenButton from '../../components/button/GreenButton';
import StatusBadge from '../../components/common/StatusBadge';
import TextInput from '../../components/input/TextInput';
import SelectInput from '../../components/input/SelectInput';
import DateInput from '../../components/input/DateInput';
import OrderDetailModal from '../../components/modal/OrderDetailModal';
import NewOrderModal from '../../components/modal/NewOrderModal';
import { Order, OrderStatus } from '../../store/ordersStore';
// import { useAuthStore } from '../../store/authStore'; // 제거 - permissions 사용
import { useOrder } from '../../hooks/queries/useOrder';
import axios from '../../api/axios';
import { deleteOrder, exportOrders } from '../../api/orders';
import { fetchInventories } from '../../api/inventory';
import { fetchSuppliers } from '../../api/supplier';
import { usePermissions } from '../../hooks/usePermissions';
import { getErrorMessage } from '../../utils/errorHandling';
import { handleDownloadExcel, OrderDetail, SupplierDetail } from '../../utils/orderUtils';
// 검색 필터 타입 정의
interface SearchFilters {
  orderId: string;
  supplier: string;
  status: string;
  dateRange: string;
  startDate: Date | null;
  endDate: Date | null;
}

// // 숫자를 한글로 변환하는 함수 추가 (OrderDetailModal.tsx에서 복사)
// function numberToKorean(num: number): string {
//   const hanA = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구', '십'];
//   const danA = ['', '만', '억', '조', '경'];
//   let result = '';
//   let i = 0;
//   while (num > 0) {
//     let str = '';
//     let n = num % 10000;
//     num = Math.floor(num / 10000);
//     if (n > 0) {
//       let d = 1000;
//       for (let j = 0; j < 4; j++) {
//         const q = Math.floor(n / d);
//         if (q > 0) {
//           str += hanA[q] + (d > 1 ? hanA[10] : '');
//         }
//         n %= d;
//         d = Math.floor(d / 10);
//       }
//       result = str + danA[i] + result;
//     }
//     i++;
//   }
//   return result || '영';
// }

const OrdersPage: React.FC = () => {
  // 모든 Hook 선언을 최상단에 위치시킴
  const permissions = usePermissions();
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState<boolean>(false);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState<boolean>(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
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

  const [orders, setOrders] = useState<Order[]>([]);
  const [searchInputs, setSearchInputs] = useState<SearchFilters>({
    orderId: '',
    supplier: '',
    status: '모든 상태',
    dateRange: '전체 기간',
    startDate: null,
    endDate: null,
  });
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    orderId: '',
    supplier: '',
    status: '모든 상태',
    dateRange: '전체 기간',
    startDate: null,
    endDate: null,
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [itemsPerPage, setItemsPerPage] = useState<number>(10); // 주석 처리된 UI에서 사용 예정
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<{
    lastFetch: string;
    dataLength: number;
    error: string | null;
  }>({
    lastFetch: '',
    dataLength: 0,
    error: null,
  });

  // searchFilters를 OrderApiParams 형식으로 변환
  const orderApiParams = useMemo(() => {
    const params: {
      page?: number;
      product_name?: string;
      supplier?: string;
      status?: string;
      start_date?: string;
      end_date?: string;
    } = {
      page: currentPage,
    };

    // 상품명 검색 (orderId 필터를 product_name으로 사용)
    if (searchFilters.orderId) {
      params.product_name = searchFilters.orderId;
    }

    // 공급업체 필터
    if (searchFilters.supplier) {
      params.supplier = searchFilters.supplier;
    }

    // 상태 필터
    const statusMap: Record<string, string> = {
      '승인 대기': 'PENDING',
      승인됨: 'APPROVED',
      취소됨: 'CANCELLED',
      완료: 'COMPLETED',
    };
    if (searchFilters.status !== '모든 상태') {
      const filterStatus = statusMap[searchFilters.status];
      if (filterStatus) {
        params.status = filterStatus;
      }
    }

    // 날짜 필터
    if (searchFilters.dateRange === '사용자 지정') {
      if (searchFilters.startDate) {
        params.start_date = searchFilters.startDate.toISOString().split('T')[0];
      }
      if (searchFilters.endDate) {
        params.end_date = searchFilters.endDate.toISOString().split('T')[0];
      }
    } else if (searchFilters.dateRange !== '전체 기간') {
      // 기존 고정 기간 처리
      const today = new Date();
      let startDate: Date;

      switch (searchFilters.dateRange) {
        case '최근 1개월':
          startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
          break;
        case '최근 3개월':
          startDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
          break;
        case '최근 6개월':
          startDate = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
          break;
        default:
          startDate = new Date(0);
      }
      params.start_date = startDate.toISOString().split('T')[0];
      params.end_date = today.toISOString().split('T')[0];
    }

    return params;
  }, [currentPage, searchFilters]);

  const { data, isLoading, isError, error, refetch } = useOrder(orderApiParams);
  // isManager 대신 permissions.hasPermission('ORDER') 사용로 변경
  // const user = useAuthStore((state) => state.user); // 제거
  // const isManager = user?.role === 'MANAGER'; // 제거

  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '날짜 없음';
      }
      return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    } catch {
      return '날짜 오류';
    }
  }, []);

  useEffect(() => {
    if (data) {
      setDebugInfo((prev) => ({
        ...prev,
        lastFetch: new Date().toISOString(),
        dataLength: data.data?.results?.length || 0,
        error: null,
      }));
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      setDebugInfo((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }));
    }
  }, [error]);

  useEffect(() => {
    if (data?.data) {
      if (data.data.results) {
        // 페이지네이션된 응답 - 날짜 형식 변환만 수행
        const formattedOrders = (Array.isArray(data.data.results) ? data.data.results : []).map(
          (order) =>
            ({
              ...order,
              order_date: order.order_date ? formatDate(order.order_date) : '',
            }) as Order
        );
        setOrders(formattedOrders);
      } else {
        // 기존 배열 응답 (호환성)
        const formattedOrders = (Array.isArray(data.data) ? data.data : []).map(
          (order) =>
            ({
              ...order,
              order_date: order.order_date ? formatDate(order.order_date) : '',
            }) as Order
        );
        setOrders(formattedOrders);
      }
    }
  }, [data, formatDate]);

  useEffect(() => {
    fetchInventories({ page_size: 1000 }) // OrdersPage에서는 매핑용으로 많은 데이터 필요
      .then((res) => {
        const mapping: Record<number, string> = {};
        const products = Array.isArray(res.data.results) ? res.data.results : [];
        products.forEach((product: { variants?: unknown[] }) => {
          ((product.variants as { id?: number; variant_code?: string }[]) || []).forEach(
            (variant) => {
              if (variant.id && variant.variant_code) {
                mapping[variant.id] = variant.variant_code;
              }
            }
          );
        });
      })
      .catch(() => {
        alert('상품 데이터를 불러오는데 실패했습니다.');
      });
  }, []);

  useEffect(() => {
    fetchSuppliers()
      .then((res) => {
        const mapping: Record<string, number> = {};
        const suppliers = Array.isArray(res.data) ? res.data : [];
        suppliers.forEach((supplier: { name: string; id: number }) => {
          mapping[supplier.name] = supplier.id;
        });
      })
      .catch(() => {
        alert('공급업체 데이터를 불러오는데 실패했습니다.');
      });
  }, []);

  // 서버 사이드 페이지네이션을 사용하므로 클라이언트 사이드 필터링/페이지네이션 제거
  // 서버에서 받은 데이터를 그대로 사용
  const paginatedOrders = useMemo(() => {
    return orders;
  }, [orders]);

  const totalPages = useMemo(
    () => Math.ceil((data?.data?.count || 0) / itemsPerPage) || 1,
    [data?.data?.count, itemsPerPage]
  );
  // itemsPerPage가 변경되면 페이지를 1로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const handleOpenOrderDetail = useCallback((orderId: number) => {
    setSelectedOrderId(orderId);
    setIsOrderDetailModalOpen(true);
  }, []);

  const handleDownloadOrderExcel = async (order: Order) => {
    try {
      const res = await axios.get(`/orders/${order.id}`);
      const orderDetail: OrderDetail = res.data;
      // 2. 전체 공급업체 목록 fetch
      const suppliersRes = await fetchSuppliers();
      const suppliers = suppliersRes.data;
      // 3. orderDetail.supplier(이름)과 suppliers의 name을 비교해 매칭
      const supplierDetail: SupplierDetail = suppliers.find(
        (s: { name: string }) => s.name === orderDetail.supplier
      ) || {
        name: orderDetail.supplier,
        contact: '',
        manager: '',
        email: '',
      };

      await handleDownloadExcel(orderDetail, supplierDetail, {
        includeNote: true,
      });
    } catch (error) {
      alert('엑셀 파일 생성 중 오류가 발생했습니다.' + getErrorMessage(error));
    }
  };

  const handlePageChange = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber);
  }, []);

  const handleInputChange = (key: keyof SearchFilters, value: string) => {
    setSearchInputs((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    setSearchFilters(searchInputs);
    setCurrentPage(1);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const renderStatusBadge = useCallback((status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <StatusBadge text='승인 대기' theme='pending' />;
      case 'APPROVED':
        return <StatusBadge text='승인됨' theme='approved' />;
      case 'CANCELLED':
        return <StatusBadge text='취소됨' theme='rejected' />;
      case 'COMPLETED':
        return <StatusBadge text='완료' theme='completed' />;
      default:
        return <StatusBadge text='기타' theme='neutral' />;
    }
  }, []);

  const formatCurrency = useCallback((amount: string | number | undefined) => {
    if (amount === undefined || amount === null) {
      return '0원';
    }
    try {
      // 숫자로 변환 시도
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      return `${numAmount.toLocaleString('ko-KR')}원`;
    } catch {
      return '0원';
    }
  }, []);

  const handleDeleteOrder = async (order: Order) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      await deleteOrder(order.id);
      await refetch(); // 서버에서 최신 목록 다시 받아오기
    }
  };

  const handleExportToExcel = async () => {
    setIsExporting(true);
    try {
      // 현재 필터 조건으로 export API 호출
      const params: Record<string, string> = {};

      if (searchFilters.orderId) params.product_name = searchFilters.orderId;
      if (searchFilters.supplier) params.supplier = searchFilters.supplier;
      if (searchFilters.status !== '모든 상태') {
        const statusMap: Record<string, string> = {
          '승인 대기': 'PENDING',
          승인됨: 'APPROVED',
          취소됨: 'CANCELLED',
          완료: 'COMPLETED',
        };
        params.status = statusMap[searchFilters.status];
      }

      // 날짜 범위 처리
      if (searchFilters.dateRange !== '전체 기간') {
        const today = new Date();
        let startDate: Date;

        switch (searchFilters.dateRange) {
          case '최근 1개월':
            startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
            break;
          case '최근 3개월':
            startDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
            break;
          case '최근 6개월':
            startDate = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
            break;
          default:
            startDate = new Date(0);
        }

        params.start_date = startDate.toISOString().split('T')[0];
        params.end_date = today.toISOString().split('T')[0];
      }

      const response = await exportOrders(params);
      const orders = response.data;

      // 엑셀 데이터 생성
      const excelData = [
        [
          '발주번호',
          '공급업체',
          '담당자',
          '상태',
          '발주일',
          '예상납품일',
          '총수량',
          '총금액',
          '상품명',
          '비고',
        ],
        ...orders.map(
          (order: {
            id: number;
            supplier: string;
            manager: string;
            order_date: string;
            expected_delivery_date: string;
            status: string;
            total_quantity: number;
            total_price: number;
            product_names: string;
            note?: string;
          }) => [
            order.id,
            order.supplier,
            order.manager,
            order.status === 'PENDING'
              ? '승인 대기'
              : order.status === 'APPROVED'
                ? '승인됨'
                : order.status === 'CANCELLED'
                  ? '취소됨'
                  : order.status === 'COMPLETED'
                    ? '완료'
                    : order.status,
            order.order_date,
            order.expected_delivery_date || '',
            order.total_quantity,
            order.total_price,
            order.product_names && Array.isArray(order.product_names)
              ? order.product_names.join(', ')
              : order.product_names || '',
            order.note || '',
          ]
        ),
      ];

      // 동적 import로 xlsx 라이브러리 로드
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);

      // 컬럼 너비 설정
      ws['!cols'] = [
        { wch: 10 }, // 발주번호
        { wch: 15 }, // 공급업체
        { wch: 10 }, // 담당자
        { wch: 10 }, // 상태
        { wch: 12 }, // 발주일
        { wch: 12 }, // 예상납품일
        { wch: 8 }, // 총수량
        { wch: 12 }, // 총금액
        { wch: 30 }, // 상품명
        { wch: 20 }, // 비고
      ];

      XLSX.utils.book_append_sheet(wb, ws, '발주목록');

      const today = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `발주목록_${today}.xlsx`);
    } catch (error) {
      alert('엑셀 파일 생성 중 오류가 발생했습니다.' + getErrorMessage(error));
    } finally {
      setIsExporting(false);
    }
  };

  // 조건부 렌더링은 Hook 선언 이후에만 위치
  if (isLoading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='flex items-center space-x-2'>
          <FiLoader className='animate-spin text-indigo-600' size={24} />
          <span>주문 정보를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className='flex h-full flex-col items-center justify-center space-y-4'>
        <div className='text-red-500'>
          <p>주문 정보를 불러오는 중 오류가 발생했습니다.</p>
          <p className='mt-2 text-sm'>에러 상세: {debugInfo.error}</p>
        </div>
        <button
          onClick={() => refetch()}
          className='rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700'>
          다시 시도
        </button>
        <div className='text-sm text-gray-500'>
          <p>마지막 시도: {debugInfo.lastFetch}</p>
          <p>데이터 길이: {debugInfo.dataLength}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-6'>
      {/* 페이지 헤더 */}
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-gray-900'>발주 관리</h1>
        <div className='flex items-center gap-2'>
          <button
            onClick={handleExportToExcel}
            className={`inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm leading-tight font-medium text-white transition-colors duration-200 ease-in-out ${
              isExporting
                ? 'cursor-not-allowed bg-gray-400'
                : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
            }`}
            disabled={isExporting}
            aria-label='엑셀로 내보내기'>
            <span className='mr-2 flex h-4 w-4 items-center justify-center'>
              <FiDownload size={18} />
            </span>
            {isExporting ? '내보내는 중...' : '엑셀로 내보내기'}
          </button>
          {permissions.canCreate('ORDER') && (
            <GreenButton
              text='새 발주 신청'
              icon={<FiPlus />}
              onClick={() => setIsNewOrderModalOpen(true)}
              aria-label='새 발주 신청'
            />
          )}
        </div>
      </div>

      {/* 검색 섹션 */}
      <div className='flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm'>
        <div className='flex items-start gap-4'>
          <div className='flex w-64 flex-col gap-1'>
            <label htmlFor='order-id-search' className='text-sm font-medium text-gray-700'>
              상품명
            </label>
            <TextInput
              id='order-id-search'
              placeholder='상품명으로 검색'
              value={searchInputs.orderId}
              onChange={(value) => handleInputChange('orderId', value)}
              onKeyDown={handleKeyDown}
              className='w-full'
            />
          </div>
          <div className='flex w-64 flex-col gap-1'>
            <label htmlFor='supplier-search' className='text-sm font-medium text-gray-700'>
              공급업체
            </label>
            <TextInput
              id='supplier-search'
              placeholder='공급업체로 검색'
              value={searchInputs.supplier}
              onChange={(value) => handleInputChange('supplier', value)}
              onKeyDown={handleKeyDown}
              className='w-full'
            />
          </div>
          <div className='flex w-64 flex-col gap-1'>
            <label htmlFor='status-filter' className='text-sm font-medium text-gray-700'>
              상태
            </label>
            <SelectInput
              defaultText='모든 상태'
              value={searchInputs.status}
              options={['모든 상태', '승인 대기', '승인됨', '취소됨', '완료']}
              onChange={(value) => handleInputChange('status', value)}
              extra={{
                id: 'status-filter',
                'aria-label': '주문 상태 필터',
              }}
            />
          </div>
          <div className='flex w-64 flex-col gap-1'>
            <label htmlFor='date-range-filter' className='text-sm font-medium text-gray-700'>
              기간
            </label>
            <SelectInput
              defaultText='전체 기간'
              value={searchInputs.dateRange}
              options={['전체 기간', '최근 1개월', '최근 3개월', '최근 6개월', '사용자 지정']}
              onChange={(value) => handleInputChange('dateRange', value)}
              extra={{
                id: 'date-range-filter',
                'aria-label': '날짜 범위 필터',
              }}
            />
          </div>
        </div>
        {/* 사용자 지정 기간 선택 시 날짜 입력 필드 표시 */}
        {searchInputs.dateRange === '사용자 지정' && (
          <div className='flex items-end gap-4'>
            <div className='flex flex-col gap-1'>
              <label htmlFor='start-date' className='text-sm font-medium text-gray-700'>
                시작 날짜
              </label>
              <DateInput
                placeholder='시작 날짜 선택'
                value={searchInputs.startDate}
                onChange={(date) =>
                  handleInputChange('startDate', date ? date.toISOString().split('T')[0] : '')
                }
              />
            </div>
            <div className='flex flex-col gap-1'>
              <label htmlFor='end-date' className='text-sm font-medium text-gray-700'>
                종료 날짜
              </label>
              <DateInput
                placeholder='종료 날짜 선택'
                value={searchInputs.endDate}
                onChange={(date) =>
                  handleInputChange('endDate', date ? date.toISOString().split('T')[0] : '')
                }
              />
            </div>
          </div>
        )}
        <div className='flex justify-end'>
          <PrimaryButton
            text='검색하기'
            icon={<FiSearch />}
            onClick={handleSearch}
            aria-label='주문 검색'
          />
        </div>
      </div>

      {/* 주문 테이블 */}
      <div className='overflow-hidden rounded-lg bg-white shadow-sm'>
        <div className='flex items-center justify-between border-b border-gray-200 px-4 py-5'>
          <h2 className='text-lg font-medium text-gray-900'>발주 목록</h2>
        </div>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th
                  scope='col'
                  className='px-4 py-3 text-xs font-medium tracking-wider text-gray-500 uppercase'>
                  발주물품
                </th>
                <th
                  scope='col'
                  className='px-4 py-3 text-xs font-medium tracking-wider text-gray-500 uppercase'>
                  공급업체
                </th>
                <th
                  scope='col'
                  className='px-4 py-3 text-xs font-medium tracking-wider text-gray-500 uppercase'>
                  발주일
                </th>
                <th
                  scope='col'
                  className='px-4 py-3 text-xs font-medium tracking-wider text-gray-500 uppercase'>
                  총 금액
                </th>
                <th
                  scope='col'
                  className='px-4 py-3 text-xs font-medium tracking-wider text-gray-500 uppercase'>
                  상태
                </th>
                <th
                  scope='col'
                  className='px-4 py-3 text-xs font-medium tracking-wider text-gray-500 uppercase'>
                  담당자
                </th>
                <th
                  scope='col'
                  className='px-4 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase'>
                  상세보기
                </th>
                <th
                  scope='col'
                  className='px-4 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase'>
                  다운로드
                </th>
                <th
                  scope='col'
                  className='px-4 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase'>
                  삭제
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200 bg-white'>
              {paginatedOrders.length > 0 ? (
                <>
                  {paginatedOrders.map((order) => {
                    const isPending = order.status === 'PENDING';
                    return (
                      <tr
                        key={order.id}
                        className={`${
                          isPending ? 'bg-yellow-50' : ''
                        } transition-colors hover:bg-gray-50`}>
                        <td className='px-4 py-4 text-center text-sm font-medium text-gray-900'>
                          {Array.isArray(order.product_names)
                            ? order.product_names.join(', ')
                            : order.product_names || '-'}
                        </td>
                        <td className='px-4 py-4 text-center text-sm text-gray-500'>
                          {order.supplier}
                        </td>
                        <td className='px-4 py-4 text-center text-sm text-gray-500'>
                          {order.order_date}
                        </td>
                        <td className='px-4 py-4 text-center text-sm font-medium text-gray-900'>
                          {formatCurrency(order.total_price)}
                        </td>
                        <td className='px-4 py-3.5 text-center'>
                          {renderStatusBadge(order.status)}
                        </td>
                        <td className='px-4 py-4 text-center text-sm text-gray-500'>
                          {order.manager}
                        </td>
                        <td className='px-7 py-3.5 text-center'>
                          <button
                            onClick={() => handleOpenOrderDetail(order.id)}
                            className='rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-indigo-700'
                            aria-label={`${Array.isArray(order.product_names) ? order.product_names.join(', ') : order.product_names || '-'} 상세보기`}>
                            상세보기
                          </button>
                        </td>
                        <td className='px-6 py-3 text-center'>
                          <button
                            onClick={() => handleDownloadOrderExcel(order)}
                            className='rounded p-2 text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800'
                            aria-label={`${Array.isArray(order.product_names) ? order.product_names.join(', ') : order.product_names || '-'} 다운로드`}>
                            <FiDownload className='h-4 w-4' />
                          </button>
                        </td>
                        <td className='px-6 py-3.5 text-center'>
                          <button
                            onClick={() => handleDeleteOrder(order)}
                            className='mx-auto flex items-center justify-center rounded bg-red-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-red-700'
                            aria-label={`${Array.isArray(order.product_names) ? order.product_names.join(', ') : order.product_names || '-'} 삭제`}>
                            삭제
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {/* 빈 행으로 테이블 높이 일정하게 유지 (항상 10개 행 표시) */}
                  {Array.from({ length: Math.max(0, itemsPerPage - paginatedOrders.length) }).map(
                    (_, index) => (
                      <tr key={`empty-${index}`} className='h-[57px]'>
                        <td className='px-4 py-4'></td>
                        <td className='px-4 py-4'></td>
                        <td className='px-4 py-4'></td>
                        <td className='px-4 py-4'></td>
                        <td className='px-4 py-3.5'></td>
                        <td className='px-4 py-4'></td>
                        <td className='px-7 py-3.5'></td>
                        <td className='px-6 py-3'></td>
                        <td className='px-6 py-3.5'></td>
                      </tr>
                    )
                  )}
                </>
              ) : (
                <>
                  <tr>
                    <td colSpan={9} className='px-4 py-8 text-center text-sm text-gray-500'>
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                  {/* 빈 행으로 테이블 높이 일정하게 유지 (항상 10개 행 표시) */}
                  {Array.from({ length: itemsPerPage - 1 }).map((_, index) => (
                    <tr key={`empty-${index}`} className='h-[57px]'>
                      <td className='px-4 py-4'></td>
                      <td className='px-4 py-4'></td>
                      <td className='px-4 py-4'></td>
                      <td className='px-4 py-4'></td>
                      <td className='px-4 py-3.5'></td>
                      <td className='px-4 py-4'></td>
                      <td className='px-7 py-3.5'></td>
                      <td className='px-6 py-3'></td>
                      <td className='px-6 py-3.5'></td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className='flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3'>
          <div className='flex items-center'>
            {/* 페이지당 항목 수 선택 기능 (현재 주석 처리, 기본값 10개 사용) */}
            {/* <span className='text-sm text-gray-700'>항목당 표시</span>
            <select
              className='mx-2 rounded-md border border-gray-300 bg-gray-100 px-2 py-1 text-sm'
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              aria-label='페이지당 항목 수 선택'>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className='text-sm text-gray-700'>/ 페이지</span> */}
          </div>

          <div className='flex items-center space-x-2'>
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className='relative inline-flex h-9 w-10 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 focus:outline-none disabled:opacity-50'
              aria-label='이전 페이지'>
              &lt;
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`relative inline-flex h-9 w-10 items-center justify-center rounded-md ${
                    currentPage === pageNum
                      ? 'border border-indigo-600 bg-indigo-50 text-indigo-600'
                      : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  } focus:outline-none`}
                  aria-label={`${pageNum}페이지로 이동`}>
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className='relative inline-flex h-9 w-10 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 focus:outline-none disabled:opacity-50'
              aria-label='다음 페이지'>
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* 주문 상세 모달 */}
      {isOrderDetailModalOpen && selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          isOpen={isOrderDetailModalOpen}
          onClose={() => setIsOrderDetailModalOpen(false)}
          isManager={permissions.hasPermission('ORDER')}
          onReorder={(data) => {
            setReorderData(data);
            setIsOrderDetailModalOpen(false);
            setIsNewOrderModalOpen(true);
          }}
        />
      )}

      {/* 새 주문 모달 */}
      {isNewOrderModalOpen && (
        <NewOrderModal
          isOpen={isNewOrderModalOpen}
          onClose={() => {
            setIsNewOrderModalOpen(false);
            setReorderData(undefined);
          }}
          onSuccess={() => {
            refetch(); // 주문 생성 후 서버에서 최신 목록 받아오기
            setIsNewOrderModalOpen(false);
            setReorderData(undefined);
          }}
          initialData={reorderData}
        />
      )}
    </div>
  );
};

export default OrdersPage;
