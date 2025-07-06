import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FiPrinter, FiPlus, FiSearch, FiLoader } from 'react-icons/fi';
import PrimaryButton from '../../components/button/PrimaryButton';
import GreenButton from '../../components/button/GreenButton';
import StatusBadge from '../../components/common/StatusBadge';
import TextInput from '../../components/input/TextInput';
import SelectInput from '../../components/input/SelectInput';
import OrderDetailModal from '../../components/modal/OrderDetailModal';
import NewOrderModal from '../../components/modal/NewOrderModal';
import { Order, OrderStatus } from '../../store/ordersStore';
import { useAuthStore } from '../../store/authStore';
import { useOrder } from '../../hooks/queries/useOrder';
import axios from '../../api/axios';

// 검색 필터 타입 정의
interface SearchFilters {
    orderId: string;
    supplier: string;
    status: string;
    dateRange: string;
}

// 공급업체 매핑 객체 추가 (상단에 위치)
const supplierMapping = {
    1: '팩토리코퍼레이션',
    2: '한국판촉물',
    3: '대한상사',
    4: '서울프로모션',
};

const OrdersPage: React.FC = () => {
    // 모달 상태
    const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState<boolean>(false);
    const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState<boolean>(false);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

    // 검색 입력값 상태 (입력창에 바로 반영)
    const [searchInputs, setSearchInputs] = useState<SearchFilters>({
        orderId: '',
        supplier: '',
        status: '모든 상태',
        dateRange: '전체 기간',
    });

    // 검색 필터 상태
    const [searchFilters, setSearchFilters] = useState<SearchFilters>({
        orderId: '',
        supplier: '',
        status: '모든 상태',
        dateRange: '전체 기간',
    });

    // 페이지네이션 상태
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage, setItemsPerPage] = useState<number>(10);

    // 디버깅을 위한 상태 추가
    const [debugInfo, setDebugInfo] = useState<{
        lastFetch: string;
        dataLength: number;
        error: string | null;
    }>({
        lastFetch: '',
        dataLength: 0,
        error: null,
    });

    // API 훅 사용
    const { data, isLoading, isError, error, refetch } = useOrder();
    const orders = useMemo(() => {
        console.log('Orders data received:', data); // 디버깅 로그
        return data?.data || [];
    }, [data]);

    // 사용자 권한 확인
    const user = useAuthStore((state) => state.user);
    const isManager = user?.role === '대표';

    // 데이터 변경 감지 및 디버깅 정보 업데이트
    useEffect(() => {
        if (data) {
            setDebugInfo((prev) => ({
                ...prev,
                lastFetch: new Date().toISOString(),
                dataLength: data.data?.length || 0,
                error: null,
            }));
        }
    }, [data]);

    // 에러 발생 시 디버깅 정보 업데이트
    useEffect(() => {
        if (error) {
            console.error('Order fetch error:', error);
            setDebugInfo((prev) => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            }));
        }
    }, [error]);

    // 날짜 포맷팅 함수 추가
    const formatDate = useCallback((dateString: string) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                console.warn('Invalid date string:', dateString);
                return '날짜 없음';
            }
            return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
        } catch (error) {
            console.error('Date formatting error:', error);
        }
    }, []);

    // 필터링된 주문 목록 (메모이제이션)
    const filteredOrders = useMemo(() => {
        console.log('Filtering orders:', { orders, searchFilters }); // 디버깅 로그
        let result = [...orders];

        if (searchFilters.orderId) {
            result = result.filter((order) =>
                order.product_names?.some((name: string) => name.toLowerCase().includes(searchFilters.orderId.toLowerCase()))
            );
        }

        // 공급업체 id로 필터링
        if (searchFilters.supplier) {
            result = result.filter((order) => String(order.supplier_id) === searchFilters.supplier);
        }

        // 상태 필터링
        const statusMap: Record<string, OrderStatus> = {
            '승인 대기': 'PENDING',
            승인됨: 'APPROVED',
            취소됨: 'CANCELLED',
        };

        if (searchFilters.status !== '모든 상태') {
            const filterStatus = statusMap[searchFilters.status];
            if (filterStatus) {
                result = result.filter((order) => order.status === filterStatus);
            }
        }

        // 날짜 필터링
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

            result = result.filter((order) => {
                if (!order.order_date) return false;
                const orderDate = new Date(order.order_date);
                return orderDate >= startDate && orderDate <= today;
            });
        }

        // 날짜 형식 변환
        result = result.map((order) => ({
            ...order,
            order_date: formatDate(order.order_date),
        }));

        console.log('Filtered results:', result); // 디버깅 로그
        return result;
    }, [orders, searchFilters, formatDate]);

    // 페이지네이션 로직
    const paginatedOrders = useMemo(() => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
    }, [filteredOrders, currentPage, itemsPerPage]);

    // 총 페이지 수 계산
    const totalPages = useMemo(() => Math.ceil(filteredOrders.length / itemsPerPage), [filteredOrders, itemsPerPage]);

    // 주문 승인 핸들러
    const handleApproveOrder = useCallback(
        async (orderId: number) => {
            try {
                console.log('Approving order:', orderId); // 디버깅 로그
                await axios.put(`/api/orders/${orderId}/approve`);
                await refetch(); // 데이터 새로고침
                alert('발주가 성공적으로 승인되었습니다.');
            } catch (error) {
                console.error('Error approving order:', error);
                alert('발주 승인 중 오류가 발생했습니다.');
            }
        },
        [refetch]
    );

    // 주문 상세 모달 열기
    const handleOpenOrderDetail = useCallback((orderId: number) => {
        setSelectedOrderId(orderId);
        setIsOrderDetailModalOpen(true);
    }, []);

    // 주문 인쇄 핸들러
    const handlePrintOrder = useCallback((order: Order) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
            return;
        }

        // 인쇄할 HTML 내용 생성
        const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>발주서 - ${order.product_names ? order.product_names.join(', ') : '-'}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .header { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
          .info-section { display: flex; margin-bottom: 20px; }
          .info-column { flex: 1; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total-row { font-weight: bold; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">발 주 서</div>
        <div class="info-section">
          <div class="info-column">
            <p><strong>사업자번호:</strong> 682-88-00080</p>
            <p><strong>상호:</strong> ㈜고대미래</p>
            <p><strong>대표자:</strong> 유시진</p>
            <p><strong>주소:</strong> 서울특별시 성북구 안암로145, 고려대학교 100주년삼성기념관 103호 크림슨 스토어</p>
          </div>
          <div class="info-column">
            <p><strong>발주물품:</strong> ${order.product_names ? order.product_names.join(', ') : '-'}</p>
            <p><strong>발주일자:</strong> ${order.order_date}</p>
            <p><strong>공급업체:</strong> ${order.supplier}</p>
            <p><strong>담당자:</strong> ${order.manager}</p>
          </div>
        </div>
        <p>아래와 같이 발주하오니 기일 내 필히 납품하여 주시기 바랍니다.</p>
        <p><strong>총 금액:</strong> {(order.total_price ?? 0).toLocaleString()}원</p>
        <p><strong>상태:</strong> ${
            order.status === 'PENDING' ? '승인 대기' : order.status === 'APPROVED' ? '승인됨' : '취소됨'
        }</p>
        <button onclick="window.print()">인쇄</button>
      </body>
      </html>
    `;

        printWindow.document.open();
        printWindow.document.write(printContent);
        printWindow.document.close();
    }, []);

    // 페이지 변경 핸들러
    const handlePageChange = useCallback((pageNumber: number) => {
        setCurrentPage(pageNumber);
    }, []);

    // 필터 변경 핸들러
    const handleFilterChange = useCallback((key: keyof SearchFilters, value: string) => {
        setSearchFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
        setCurrentPage(1); // 필터 변경 시 첫 페이지로 리셋
    }, []);

    // 검색 입력값 변경 핸들러
    const handleInputChange = (key: keyof SearchFilters, value: string) => {
        setSearchInputs((prev) => ({ ...prev, [key]: value }));
    };

    // 검색 버튼 클릭 시에만 필터 적용
    const handleSearch = () => {
        setSearchFilters(searchInputs);
        setCurrentPage(1);
    };

    // 새 주문 성공 핸들러
    const handleNewOrderSuccess = useCallback(
        async (newOrder: Order) => {
            console.log('New order created:', newOrder); // 디버깅 로그
            await refetch();
            setIsNewOrderModalOpen(false);
        },
        [refetch]
    );

    // 상태 배지 렌더링
    const renderStatusBadge = useCallback((status: OrderStatus) => {
        switch (status) {
            case 'PENDING':
                return <StatusBadge text="승인 대기" theme="pending" />;
            case 'APPROVED':
                return <StatusBadge text="승인됨" theme="approved" />;
            case 'CANCELLED':
                return <StatusBadge text="취소됨" theme="rejected" />;
            default:
                return <StatusBadge text="기타" theme="neutral" />;
        }
    }, []);

    // 통화 포맷팅 함수 개선
    const formatCurrency = useCallback((amount: number | undefined) => {
        if (amount === undefined) {
            console.warn('Attempted to format undefined amount');
            return '0원';
        }
        try {
            return `${amount.toLocaleString('ko-KR')}원`;
        } catch (error) {
            console.error('Currency formatting error:', error);
            return '0원';
        }
    }, []);

    // 로딩 상태 UI 개선
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="flex items-center space-x-2">
                    <FiLoader className="animate-spin text-indigo-600" size={24} />
                    <span>주문 정보를 불러오는 중...</span>
                </div>
            </div>
        );
    }

    // 에러 상태 UI 개선
    if (isError) {
        return (
            <div className="flex flex-col justify-center items-center h-full space-y-4">
                <div className="text-red-500">
                    <p>주문 정보를 불러오는 중 오류가 발생했습니다.</p>
                    <p className="text-sm mt-2">에러 상세: {debugInfo.error}</p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                    다시 시도
                </button>
                <div className="text-sm text-gray-500">
                    <p>마지막 시도: {debugInfo.lastFetch}</p>
                    <p>데이터 길이: {debugInfo.dataLength}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* 페이지 헤더 */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">발주 관리</h1>
                <GreenButton
                    text="새 발주 신청"
                    icon={<FiPlus />}
                    onClick={() => setIsNewOrderModalOpen(true)}
                    aria-label="새 발주 신청"
                />
            </div>

            {/* 검색 섹션 */}
            <div className="p-4 bg-white rounded-lg shadow-sm flex flex-col gap-4">
                <div className="flex items-start gap-4">
                    <div className="w-64 flex flex-col gap-1">
                        <label htmlFor="order-id-search" className="text-sm font-medium text-gray-700">
                            상품명
                        </label>
                        <TextInput
                            id="order-id-search"
                            placeholder="상품명으로 검색"
                            value={searchInputs.orderId}
                            onChange={(value) => handleInputChange('orderId', value)}
                            className="w-full"
                            extra={{ id: 'order-id-search' }}
                        />
                    </div>
                    <div className="w-64 flex flex-col gap-1">
                        <label htmlFor="supplier-search" className="text-sm font-medium text-gray-700">
                            공급업체
                        </label>
                        <TextInput
                            id="supplier-search"
                            placeholder="공급업체로 검색"
                            value={searchInputs.supplier}
                            onChange={(value) => handleInputChange('supplier', value)}
                            className="w-full"
                            extra={{ id: 'supplier-search' }}
                        />
                    </div>
                    <div className="w-64 flex flex-col gap-1">
                        <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
                            상태
                        </label>
                        <SelectInput
                            defaultText="모든 상태"
                            options={['모든 상태', '승인 대기', '승인됨', '취소됨']}
                            onChange={(value) => handleFilterChange('status', value)}
                            extra={{
                                id: 'status-filter',
                                'aria-label': '주문 상태 필터',
                            }}
                        />
                    </div>
                    <div className="w-64 flex flex-col gap-1">
                        <label htmlFor="date-range-filter" className="text-sm font-medium text-gray-700">
                            기간
                        </label>
                        <SelectInput
                            defaultText="전체 기간"
                            options={['전체 기간', '최근 1개월', '최근 3개월', '최근 6개월']}
                            onChange={(value) => handleFilterChange('dateRange', value)}
                            extra={{
                                id: 'date-range-filter',
                                'aria-label': '날짜 범위 필터',
                            }}
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <PrimaryButton text="검색하기" icon={<FiSearch />} onClick={handleSearch} aria-label="주문 검색" />
                </div>
            </div>

            {/* 주문 테이블 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-4 py-5 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">발주 목록</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    발주물품
                                </th>
                                <th
                                    scope="col"
                                    className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    공급업체
                                </th>
                                <th
                                    scope="col"
                                    className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    발주일
                                </th>
                                <th
                                    scope="col"
                                    className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    총 금액
                                </th>
                                <th
                                    scope="col"
                                    className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    상태
                                </th>
                                <th
                                    scope="col"
                                    className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    담당자
                                </th>
                                <th
                                    scope="col"
                                    className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center"
                                >
                                    상세보기
                                </th>
                                <th
                                    scope="col"
                                    className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center"
                                >
                                    인쇄
                                </th>
                                {isManager && (
                                    <th
                                        scope="col"
                                        className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center"
                                    >
                                        승인
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedOrders.length > 0 ? (
                                paginatedOrders.map((order) => {
                                    const isPending = order.status === 'PENDING';
                                    return (
                                        <tr
                                            key={order.id}
                                            className={`${
                                                isPending ? 'bg-yellow-50' : ''
                                            } hover:bg-gray-50 transition-colors`}
                                        >
                                            <td className="px-4 py-4 text-sm font-medium text-gray-900 text-center">
                                                {order.product_names ? order.product_names.join(', ') : '-'}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-500 text-center">
                                                {order.supplier}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-500 text-center">
                                                {order.order_date}
                                            </td>
                                            <td className="px-4 py-4 text-sm font-medium text-gray-900 text-center">
                                                {formatCurrency(order.total_price)}
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                {renderStatusBadge(order.status)}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-500 text-center">
                                                {order.manager}
                                            </td>
                                            <td className="px-7 py-3.5 text-center">
                                                <button
                                                    onClick={() => handleOpenOrderDetail(order.id)}
                                                    className="px-3 py-1 bg-indigo-600 rounded-md text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
                                                    aria-label={`${
                                                        order.product_names ? order.product_names.join(', ') : '-'
                                                    } 상세보기`}
                                                >
                                                    상세보기
                                                </button>
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <button
                                                    onClick={() => handlePrintOrder(order)}
                                                    className="p-2 rounded text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                                                    aria-label={`${
                                                        order.product_names ? order.product_names.join(', ') : '-'
                                                    } 인쇄`}
                                                >
                                                    <FiPrinter className="w-4 h-4" />
                                                </button>
                                            </td>
                                            {isManager && (
                                                <td className="px-6 py-3.5 text-center">
                                                    {isPending ? (
                                                        <button
                                                            onClick={() => handleApproveOrder(order.id)}
                                                            className="px-3 py-1 bg-green-600 rounded text-xs font-medium text-white flex items-center justify-center hover:bg-green-700 transition-colors"
                                                            aria-label={`${
                                                                order.product_names
                                                                    ? order.product_names.join(', ')
                                                                    : '-'
                                                            } 승인`}
                                                        >
                                                            <span className="w-3 h-3 mr-1 relative">
                                                                <span className="absolute inset-0 bg-white rounded-full transform scale-75"></span>
                                                            </span>
                                                            승인
                                                        </button>
                                                    ) : (
                                                        <div className="px-5 text-green-600 text-xs font-medium flex items-center justify-center">
                                                            <span className="w-4 h-4 mr-1 relative">
                                                                <span className="absolute inset-0 bg-green-600 rounded-full transform scale-75"></span>
                                                            </span>
                                                            완료
                                                        </div>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan={isManager ? 9 : 8}
                                        className="px-4 py-8 text-sm text-gray-500 text-center"
                                    >
                                        검색 결과가 없습니다.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 페이지네이션 */}
                <div className="px-4 py-3 bg-white border-t border-gray-200 flex justify-between items-center">
                    <div className="flex items-center">
                        <span className="text-sm text-gray-700">항목당 표시</span>
                        <select
                            className="mx-2 py-1 px-2 bg-gray-100 border border-gray-300 rounded-md text-sm"
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            aria-label="페이지당 항목 수 선택"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                        <span className="text-sm text-gray-700">/ 페이지</span>
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center justify-center rounded-md w-10 h-9 text-gray-500 border border-gray-200 hover:bg-gray-50 focus:outline-none disabled:opacity-50"
                            aria-label="이전 페이지"
                        >
                            &lt;
                        </button>

                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            const pageNum = i + 1;
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                    className={`relative inline-flex items-center justify-center w-10 h-9 rounded-md ${
                                        currentPage === pageNum
                                            ? 'text-indigo-600 bg-indigo-50 border border-indigo-600'
                                            : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'
                                    } focus:outline-none`}
                                    aria-label={`${pageNum}페이지로 이동`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="relative inline-flex items-center justify-center rounded-md w-10 h-9 text-gray-500 border border-gray-200 hover:bg-gray-50 focus:outline-none disabled:opacity-50"
                            aria-label="다음 페이지"
                        >
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
                    isManager={isManager}
                    onApproveSuccess={() => refetch()}
                />
            )}

            {/* 새 주문 모달 */}
            {isNewOrderModalOpen && (
                <NewOrderModal
                    isOpen={isNewOrderModalOpen}
                    onClose={() => setIsNewOrderModalOpen(false)}
                    onSuccess={handleNewOrderSuccess}
                />
            )}
        </div>
    );
};

export default OrdersPage;
