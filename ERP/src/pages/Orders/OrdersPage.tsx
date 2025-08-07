import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FiPlus, FiSearch, FiLoader, FiRotateCcw, FiPrinter, FiDownload } from 'react-icons/fi';
import PrimaryButton from '../../components/button/PrimaryButton';
import GreenButton from '../../components/button/GreenButton';
import StatusBadge from '../../components/common/StatusBadge';
import TextInput from '../../components/input/TextInput';
import SelectInput from '../../components/input/SelectInput';
import OrderDetailModal from '../../components/modal/OrderDetailModal';
import NewOrderModal from '../../components/modal/NewOrderModal';
import { Order, OrderStatus, OrdersResponse } from '../../store/ordersStore';
import { useAuthStore } from '../../store/authStore';
import { useOrder } from '../../hooks/queries/useOrder';
import axios from '../../api/axios';
import { deleteOrder, createOrder, fetchOrderById, exportOrders } from '../../api/orders';
import { fetchInventories } from '../../api/inventory';
import { fetchSuppliers } from '../../api/supplier';
import { usePermissions } from '../../hooks/usePermissions';
        
// 검색 필터 타입 정의
interface SearchFilters {
    orderId: string;
    supplier: string;
    status: string;
    dateRange: string;
    startDate: string;
    endDate: string;
}

// order_date를 YYYY-MM-DD로 변환
function parseOrderDate(dateStr: string | undefined | null): string {
    if (!dateStr) return '';
    const match = dateStr.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
    if (match) {
        const [, year, month, day] = match;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateStr; // 이미 포맷이 맞으면 그대로
}

// 숫자를 한글로 변환하는 함수 추가 (OrderDetailModal.tsx에서 복사)
function numberToKorean(num: number): string {
    const hanA = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구', '십'];
    const danA = ['', '만', '억', '조', '경'];
    let result = '';
    let i = 0;
    while (num > 0) {
        let str = '';
        let n = num % 10000;
        num = Math.floor(num / 10000);
        if (n > 0) {
            let d = 1000;
            for (let j = 0; j < 4; j++) {
                let q = Math.floor(n / d);
                if (q > 0) {
                    str += hanA[q] + (d > 1 ? hanA[10] : '');
                }
                n %= d;
                d = Math.floor(d / 10);
            }
            result = str + danA[i] + result;
        }
        i++;
    }
    return result || '영';
}


const OrdersPage: React.FC = () => {
    // 모든 Hook 선언을 최상단에 위치시킴
    const permissions = usePermissions();
    const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState<boolean>(false);
    const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState<boolean>(false);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [ordersResponse, setOrdersResponse] = useState<OrdersResponse | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [searchInputs, setSearchInputs] = useState<SearchFilters>({
        orderId: "",
        supplier: "",
        status: "모든 상태",
        dateRange: "전체 기간",
        startDate: "",
        endDate: "",
    });
    const [searchFilters, setSearchFilters] = useState<SearchFilters>({
        orderId: "",
        supplier: "",
        status: "모든 상태",
        dateRange: "전체 기간",
        startDate: "",
        endDate: "",
    });
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage, setItemsPerPage] = useState<number>(10);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [debugInfo, setDebugInfo] = useState<{
        lastFetch: string;
        dataLength: number;
        error: string | null;
    }>({
        lastFetch: "",
        dataLength: 0,
        error: null,
    });
    const { data, isLoading, isError, error, refetch } = useOrder();
    const user = useAuthStore((state) => state.user);
    const isManager = user?.role === "대표";
    const [variantIdToCode, setVariantIdToCode] = useState<Record<number, string>>({});
    const [supplierNameToId, setSupplierNameToId] = useState<Record<string, number>>({});

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

    useEffect(() => {
        if (error) {
            console.error("Order fetch error:", error);
            setDebugInfo((prev) => ({
                ...prev,
                error: error instanceof Error ? error.message : "Unknown error occurred",
            }));
        }
    }, [error]);

    useEffect(() => {
        if (data?.data) {
            console.log("Setting orders data:", data.data);
            if (data.data.results) {
                // 페이지네이션된 응답
                setOrdersResponse(data.data);
                setOrders(Array.isArray(data.data.results) ? data.data.results : []);
            } else {
                // 기존 배열 응답 (호환성)
                setOrders(Array.isArray(data.data) ? data.data : []);
            }
        }
    }, [data]);

    useEffect(() => {
        fetchInventories().then((res) => {
            const mapping: Record<number, string> = {};
            const products = Array.isArray(res.data) ? res.data : [];
            products.forEach((product: any) => {
                (product.variants || []).forEach((variant: any) => {
                    if (variant.id && variant.variant_code) {
                        mapping[variant.id] = variant.variant_code;
                    }
                });
            });
            setVariantIdToCode(mapping);
        }).catch((error) => {
            console.error('Failed to fetch inventories:', error);
            setVariantIdToCode({});
        });
    }, []);

    useEffect(() => {
        fetchSuppliers().then((res) => {
            const mapping: Record<string, number> = {};
            const suppliers = Array.isArray(res.data) ? res.data : [];
            suppliers.forEach((supplier: any) => {
                mapping[supplier.name] = supplier.id;
            });
            setSupplierNameToId(mapping);
        }).catch((error) => {
            console.error('Failed to fetch suppliers:', error);
            setSupplierNameToId({});
        });
    }, []);

    const formatDate = useCallback((dateString: string) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                console.warn("Invalid date string:", dateString);
                return "날짜 없음";
            }
            return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
        } catch (error) {
            console.error("Date formatting error:", error);
        }
    }, []);

    const filteredOrders = useMemo(() => {
        console.log("Filtering orders:", { orders, searchFilters }); // 디버깅 로그
        if (!Array.isArray(orders)) {
            console.warn("orders is not an array:", orders);
            return [];
        }
        let result = [...orders];

        if (searchFilters.orderId) {
            result = result.filter((order) =>
                order.product_names?.some((name: string) =>
                    name.toLowerCase().includes(searchFilters.orderId.toLowerCase())
                )
            );
        }

        // 공급업체 id로 필터링
        if (searchFilters.supplier) {
            result = result.filter((order) => String(order.supplier) === searchFilters.supplier);
        }

        // 상태 필터링
        const statusMap: Record<string, OrderStatus> = {
            '승인 대기': 'PENDING',
            승인됨: 'APPROVED',
            취소됨: 'CANCELLED',
            완료: 'COMPLETED',
        };

        if (searchFilters.status !== "모든 상태") {
            const filterStatus = statusMap[searchFilters.status];
            if (filterStatus) {
                result = result.filter((order) => order.status === filterStatus);
            }
        }

        // 날짜 필터링
        if (searchFilters.dateRange === "커스텀 기간") {
            // 커스텀 날짜 범위 처리
            if (searchFilters.startDate || searchFilters.endDate) {
                result = result.filter((order) => {
                    if (!order.order_date) return false;
                    const orderDate = new Date(order.order_date);
                    
                    let isValid = true;
                    if (searchFilters.startDate) {
                        const startDate = new Date(searchFilters.startDate);
                        isValid = isValid && orderDate >= startDate;
                    }
                    if (searchFilters.endDate) {
                        const endDate = new Date(searchFilters.endDate);
                        endDate.setHours(23, 59, 59, 999); // 해당 날짜 끝까지 포함
                        isValid = isValid && orderDate <= endDate;
                    }
                    
                    return isValid;
                });
            }
        } else if (searchFilters.dateRange !== "전체 기간") {
            // 기존 고정 기간 처리
            const today = new Date();
            let startDate: Date;

            switch (searchFilters.dateRange) {
                case "최근 1개월":
                    startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
                    break;
                case "최근 3개월":
                    startDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
                    break;
                case "최근 6개월":
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
        result = result.map(
            (order) =>
                ({
                    ...order,
                    order_date: order.order_date ? formatDate(order.order_date) : "",
                } as Order)
        );

        console.log("Filtered results:", result); // 디버깅 로그
        return result;
    }, [orders, searchFilters, formatDate]);

    const paginatedOrders = useMemo(() => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
    }, [filteredOrders, currentPage, itemsPerPage]);

    const totalPages = useMemo(() => Math.ceil(filteredOrders.length / itemsPerPage), [filteredOrders, itemsPerPage]);

    const handleOpenOrderDetail = useCallback((orderId: number) => {
        setSelectedOrderId(orderId);
        setIsOrderDetailModalOpen(true);
    }, []);

    const handlePrintOrder = useCallback((order: Order) => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            alert("팝업이 차단되었습니다. 팝업 차단을 해제해주세요.");
            return;
        }

        // 인쇄할 HTML 내용 생성
        const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>발주서 - ${order.product_names ? order.product_names.join(", ") : "-"}</title>
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
            <p><strong>발주물품:</strong> ${order.product_names ? order.product_names.join(", ") : "-"}</p>
            <p><strong>발주일자:</strong> ${order.order_date}</p>
            <p><strong>공급업체:</strong> ${order.supplier}</p>
            <p><strong>담당자:</strong> ${order.manager}</p>
          </div>
        </div>
        <p>아래와 같이 발주하오니 기일 내 필히 납품하여 주시기 바랍니다.</p>
        <p><strong>총 금액:</strong> {(order.total_price ?? 0).toLocaleString()}원</p>
        <p><strong>상태:</strong> ${
            order.status === "PENDING" ? "승인 대기" : order.status === "APPROVED" ? "승인됨" : "취소됨"
        }</p>
        <button onclick="window.print()">인쇄</button>
      </body>
      </html>
    `;

        printWindow.document.open();
        printWindow.document.write(printContent);
        printWindow.document.close();
    }, []);

    const handleDownloadOrderExcel = async (order: Order) => {
        try {
            console.log('주문 상세 요청 시작');
            const res = await axios.get(`/orders/${order.id}`);
            console.log('주문 상세 응답', res.data);
            const orderDetail = res.data;
            // 2. 전체 공급업체 목록 fetch
            console.log('공급업체 목록 요청');
            const suppliersRes = await fetchSuppliers();
            console.log('공급업체 목록 응답', suppliersRes.data);
            const suppliers = suppliersRes.data;
            // 3. orderDetail.supplier(이름)과 suppliers의 name을 비교해 매칭
            const supplierDetail = suppliers.find((s: any) => s.name === orderDetail.supplier) || {
                name: orderDetail.supplier,
                contact: '',
                manager: '',
                email: '',
            };
            console.log('엑셀 템플릿 fetch');
            const response = await fetch('/data/template.xlsx');
            console.log('엑셀 템플릿 fetch 완료', response);
            const arrayBuffer = await response.arrayBuffer();
            console.log('xlsx-populate import');
            const XlsxPopulate = (await import('xlsx-populate/browser/xlsx-populate-no-encryption')).default;
            console.log('xlsx-populate import 완료', XlsxPopulate);
            const workbook = await XlsxPopulate.fromDataAsync(arrayBuffer);
            const sheet = workbook.sheet(0);
            // 4. 셀 값 매핑 (OrderDetailModal.tsx와 동일)
            sheet.cell('I10').value(orderDetail.manager);
            sheet.cell('I11').value(supplierDetail.name);
            sheet.cell('W11').value(supplierDetail.contact);
            sheet.cell('I12').value(supplierDetail.manager);
            sheet.cell('W12').value(supplierDetail.email);
            sheet.cell('E16').value(orderDetail.order_date);
            sheet
                .cell('Q16')
                .value(
                    orderDetail.expected_delivery_date ? `납품일자: ${orderDetail.expected_delivery_date}` : '납품일자:'
                );
            sheet.cell('E17').value('고려대학교 100주년기념관(크림슨스토어)');
            const totalAmount = orderDetail.items.reduce(
                (sum: any, item: any) => sum + item.quantity * item.unit_price,
                0
            );
            sheet.cell('G18').value(numberToKorean(totalAmount));
            sheet.cell('Q18').value(`${totalAmount.toLocaleString()})`);
            sheet
                .cell('AG18')
                .value(orderDetail.vat_included ? true : false)
                .style('numberFormat', ';;;');
            sheet
                .cell('AH18')
                .value(orderDetail.vat_included ? false : true)
                .style('numberFormat', ';;;');
            sheet.cell('AB31').value(orderDetail.packaging_included ? true : false);
            sheet.cell('A30').value(orderDetail.instruction_note || '');
            sheet.cell('A33').value(orderDetail.note || '');
            // 품목 테이블
            const startRow = 21;
            const templateRow = 22;
            const itemCount = orderDetail.items.length;
            if (itemCount > 6) {
                for (let i = 6; i < itemCount; i++) {
                    sheet.row(templateRow).copyTo(sheet.row(startRow + i));
                }
            }
            orderDetail.items.forEach((item: any, idx: number) => {
                const row = startRow + idx;
                sheet.cell(`C${row}`).value(item.item_name);
                sheet.cell(`H${row}`).value(item.spec);
                sheet.cell(`K${row}`).value('EA');
                sheet.cell(`N${row}`).value(item.quantity);
                sheet.cell(`Q${row}`).value(item.unit_price);
                sheet.cell(`X${row}`).value(item.quantity * item.unit_price);
                sheet.cell(`AD${row}`).value(item.remark || '');
            });
            const templateRows = 6;
            if (orderDetail.items.length < templateRows) {
                for (let i = orderDetail.items.length; i < templateRows; i++) {
                    const row = startRow + i;
                    ['C', 'H', 'K', 'N', 'Q', 'X', 'AD'].forEach((col) => {
                        sheet.cell(`${col}${row}`).value('');
                    });
                }
            }
            // 5. 파일 저장
            console.log('saveAs import');
            const saveAs = (await import('file-saver')).saveAs;
            console.log('saveAs import 완료', saveAs);
            const blob = await workbook.outputAsync();
            saveAs(blob, `(주)고대미래_발주서_${orderDetail.id}.xlsx`);
            console.log('엑셀 파일 저장 완료');
        } catch (error) {
            console.error('엑셀 다운로드 중 오류 발생:', error);
            alert('엑셀 생성 중 오류가 발생했습니다. 콘솔을 확인해 주세요.');
        }
    };

    const handlePageChange = useCallback((pageNumber: number) => {
        setCurrentPage(pageNumber);
    }, []);

    const handleFilterChange = useCallback((key: keyof SearchFilters, value: string) => {
        setSearchFilters((prev) => {
            const newFilters = {
                ...prev,
                [key]: value,
            };
            setCurrentPage(1); // 필터 변경 시 첫 페이지로 리셋
            return newFilters;
        });
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
            case "PENDING":
                return <StatusBadge text="승인 대기" theme="pending" />;
            case "APPROVED":
                return <StatusBadge text="승인됨" theme="approved" />;
            case "CANCELLED":
                return <StatusBadge text="취소됨" theme="rejected" />;
            case 'COMPLETED':
                return <StatusBadge text="완료" theme="completed" />;
            default:
                return <StatusBadge text="기타" theme="neutral" />;
        }
    }, []);

    const formatCurrency = useCallback((amount: number | undefined) => {
        if (amount === undefined) {
            console.warn("Attempted to format undefined amount");
            return "0원";
        }
        try {
            return `${amount.toLocaleString("ko-KR")}원`;
        } catch (error) {
            console.error("Currency formatting error:", error);
            return "0원";
        }
    }, []);

    const handleDeleteOrder = async (order: Order) => {
        if (window.confirm("정말 삭제하시겠습니까?")) {
            await deleteOrder(order.id);
            await refetch(); // 서버에서 최신 목록 다시 받아오기
        }
    };

    const handleExportToExcel = async () => {
        setIsExporting(true);
        try {
            // 현재 필터 조건으로 export API 호출
            const params: any = {};
            
            if (searchFilters.orderId) params.product_name = searchFilters.orderId;
            if (searchFilters.supplier) params.supplier = searchFilters.supplier;
            if (searchFilters.status !== "모든 상태") {
                const statusMap: Record<string, string> = {
                    '승인 대기': 'PENDING',
                    승인됨: 'APPROVED',
                    취소됨: 'CANCELLED',
                    완료: 'COMPLETED',
                };
                params.status = statusMap[searchFilters.status];
            }
            
            // 날짜 범위 처리
            if (searchFilters.dateRange !== "전체 기간") {
                const today = new Date();
                let startDate: Date;
                
                switch (searchFilters.dateRange) {
                    case "최근 1개월":
                        startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
                        break;
                    case "최근 3개월":
                        startDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
                        break;
                    case "최근 6개월":
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
                ['발주번호', '공급업체', '담당자', '상태', '발주일', '예상납품일', '총수량', '총금액', '상품명', '비고'],
                ...orders.map((order: any) => [
                    order.id,
                    order.supplier,
                    order.manager,
                    order.status === 'PENDING' ? '승인 대기' : 
                    order.status === 'APPROVED' ? '승인됨' : 
                    order.status === 'CANCELLED' ? '취소됨' : 
                    order.status === 'COMPLETED' ? '완료' : order.status,
                    order.order_date,
                    order.expected_delivery_date || '',
                    order.total_quantity,
                    order.total_price,
                    order.product_names ? order.product_names.join(', ') : '',
                    order.note || ''
                ])
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
                { wch: 8 },  // 총수량
                { wch: 12 }, // 총금액
                { wch: 30 }, // 상품명
                { wch: 20 }  // 비고
            ];

            XLSX.utils.book_append_sheet(wb, ws, '발주목록');
            
            const today = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `발주목록_${today}.xlsx`);
            
        } catch (error) {
            console.error('Excel export error:', error);
            alert('엑셀 파일 생성 중 오류가 발생했습니다.');
        } finally {
            setIsExporting(false);
        }
    };

    // 조건부 렌더링은 Hook 선언 이후에만 위치
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
                <div className="flex gap-2 items-center">
                    <button
                        onClick={handleExportToExcel}
                        className={`inline-flex items-center justify-center h-10 px-4 py-2 rounded-md text-white text-sm font-medium leading-tight transition-colors duration-200 ease-in-out ${
                            isExporting 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
                        }`}
                        disabled={isExporting}
                        aria-label="엑셀로 내보내기"
                    >
                        <span className="mr-2 w-4 h-4 flex items-center justify-center">
                            <FiDownload size={18} />
                        </span>
                        {isExporting ? '내보내는 중...' : '엑셀로 내보내기'}
                    </button>
                    {permissions.canCreate('ORDER') && (
                        <GreenButton
                            text="새 발주 신청"
                            icon={<FiPlus />}
                            onClick={() => setIsNewOrderModalOpen(true)}
                            aria-label="새 발주 신청"
                        />
                    )}
                </div>
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
                            onChange={(value) => handleInputChange("orderId", value)}
                            className="w-full"
                            extra={{ 
                                id: "order-id-search",
                                onKeyDown: handleKeyDown
                            }}
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
                            onChange={(value) => handleInputChange("supplier", value)}
                            className="w-full"
                            extra={{ 
                                id: "supplier-search",
                                onKeyDown: handleKeyDown
                            }}
                        />
                    </div>
                    <div className="w-64 flex flex-col gap-1">
                        <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
                            상태
                        </label>
                        <SelectInput
                            defaultText="모든 상태"
                            value={searchInputs.status}
                            options={['모든 상태', '승인 대기', '승인됨', '취소됨', '완료']}
                            onChange={(value) => handleInputChange('status', value)}
                            extra={{
                                id: "status-filter",
                                "aria-label": "주문 상태 필터",
                            }}
                        />
                    </div>
                    <div className="w-64 flex flex-col gap-1">
                        <label htmlFor="date-range-filter" className="text-sm font-medium text-gray-700">
                            기간
                        </label>
                        <SelectInput
                            defaultText="전체 기간"
                            value={searchInputs.dateRange}
                            options={["전체 기간", "최근 1개월", "최근 3개월", "최근 6개월", "커스텀 기간"]}
                            onChange={(value) => handleInputChange("dateRange", value)}
                            extra={{
                                id: "date-range-filter",
                                "aria-label": "날짜 범위 필터",
                            }}
                        />
                    </div>
                </div>
                {/* 커스텀 기간 선택 시 날짜 입력 필드 표시 */}
                {searchInputs.dateRange === "커스텀 기간" && (
                    <div className="flex items-end gap-4">
                        <div className="w-64 flex flex-col gap-1">
                            <label htmlFor="start-date" className="text-sm font-medium text-gray-700">
                                시작 날짜
                            </label>
                            <input
                                type="date"
                                id="start-date"
                                value={searchInputs.startDate}
                                onChange={(e) => handleInputChange("startDate", e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div className="w-64 flex flex-col gap-1">
                            <label htmlFor="end-date" className="text-sm font-medium text-gray-700">
                                종료 날짜
                            </label>
                            <input
                                type="date"
                                id="end-date"
                                value={searchInputs.endDate}
                                onChange={(e) => handleInputChange("endDate", e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>
                )}
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
                                    다운로드
                                </th>
                                <th
                                    scope="col"
                                    className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center"
                                >
                                    삭제
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedOrders.length > 0 ? (
                                paginatedOrders.map((order) => {
                                    const isPending = order.status === "PENDING";
                                    return (
                                        <tr
                                            key={order.id}
                                            className={`${
                                                isPending ? "bg-yellow-50" : ""
                                            } hover:bg-gray-50 transition-colors`}
                                        >
                                            <td className="px-4 py-4 text-sm font-medium text-gray-900 text-center">
                                                {order.product_names ? order.product_names.join(", ") : "-"}
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
                                                        order.product_names ? order.product_names.join(", ") : "-"
                                                    } 상세보기`}
                                                >
                                                    상세보기
                                                </button>
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <button
                                                    onClick={() => handleDownloadOrderExcel(order)}
                                                    className="p-2 rounded text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                                                    aria-label={`${
                                                        order.product_names ? order.product_names.join(', ') : '-'
                                                    } 다운로드`}
                                                >
                                                    <FiDownload className="w-4 h-4" />
                                                </button>
                                            </td>
                                            <td className="px-6 py-3.5 text-center">
                                                <button
                                                    onClick={() => handleDeleteOrder(order)}
                                                    className="px-3 py-1 bg-red-600 rounded text-xs font-medium text-white flex items-center justify-center hover:bg-red-700 transition-colors"
                                                    aria-label={`${
                                                        order.product_names ? order.product_names.join(", ") : "-"
                                                    } 삭제`}
                                                >
                                                    삭제
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-sm text-gray-500 text-center">
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
                                            ? "text-indigo-600 bg-indigo-50 border border-indigo-600"
                                            : "text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
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
                    onSuccess={() => {
                        refetch(); // 주문 생성 후 서버에서 최신 목록 받아오기
                        setIsNewOrderModalOpen(false);
                    }}
                />
            )}
        </div>
    );
};

export default OrdersPage;
