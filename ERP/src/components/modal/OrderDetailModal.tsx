// src/components/modal/OrderDetailModal.tsx
import React, { useEffect, useState, useRef } from 'react';
import { FiX, FiPrinter, FiDownload, FiCheck } from 'react-icons/fi';
import { useOrdersStore } from '../../store/ordersStore';
import axios from '../../api/axios';
import { fetchSuppliers } from '../../api/supplier';
import XlsxPopulate from 'xlsx-populate/browser/xlsx-populate';
import { saveAs } from 'file-saver';

// xlsx-populate 타입 선언 (임시)
declare module 'xlsx-populate/browser/xlsx-populate';

interface OrderDetailModalProps {
    orderId: number;
    isOpen: boolean;
    onClose: () => void;
    isManager: boolean;
    onApproveSuccess?: () => void;
}

interface OrderDetailItem {
    id: number;
    item_name: string;
    spec: string;
    unit_price: number;
    quantity: number;
    remark?: string;
    // 필요시 unit, amount 등 추가
}

interface OrderDetail {
    id: number;
    supplier: string;
    manager: string;
    order_date: string;
    expected_delivery_date?: string;
    status: string;
    note: string;
    instruction_note?: string;
    created_at: string;
    vat_included: boolean;
    packaging_included: boolean;
    items: OrderDetailItem[];
}

// 숫자 → 한글 금액 변환 함수 (간단 버전, 억/만/천/백/십/일 단위)
function numberToKorean(num: number): string {
    if (num === 0) return '영원정';
    const hanA = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
    const danA = ['', '십', '백', '천'];
    const unitA = ['', '만', '억', '조', '경'];
    let result = '';
    let unit = 0;
    while (num > 0) {
        let str = '';
        let part = num % 10000;
        num = Math.floor(num / 10000);
        if (part > 0) {
            let digit = 0;
            while (part > 0) {
                const n = part % 10;
                if (n > 0) str = hanA[n] + danA[digit] + str;
                part = Math.floor(part / 10);
                digit++;
            }
            result = str + unitA[unit] + result;
        }
        unit++;
    }
    return result + '원정';
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
    orderId,
    isOpen,
    onClose,
    isManager,
    onApproveSuccess,
}) => {
    const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { updateOrder } = useOrdersStore();
    const printRef = useRef<HTMLDivElement>(null);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [supplierDetail, setSupplierDetail] = useState<any | null>(null);

    useEffect(() => {
        if (isOpen && orderId) {
            fetchOrderDetails();
        }
    }, [isOpen, orderId]);

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

    const fetchOrderDetails = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`/orders/${orderId}`);
            const orderData = response.data;

            // 필수 필드 검증 (id, supplier, items 등)
            if (!orderData.id || !orderData.supplier || !orderData.items) {
                throw new Error('필수 주문 정보가 누락되었습니다.');
            }

            // OrderDetail 형식으로 변환
            const orderDetail: OrderDetail = {
                id: orderData.id,
                supplier: orderData.supplier,
                manager: orderData.manager,
                order_date: orderData.order_date,
                expected_delivery_date: orderData.expected_delivery_date,
                status: orderData.status,
                note: orderData.note,
                instruction_note: orderData.instruction_note,
                created_at: orderData.created_at,
                vat_included: orderData.vat_included,
                packaging_included: orderData.packaging_included,
                items: orderData.items,
            };

            setOrderDetail(orderDetail);
        } catch (error) {
            console.error('주문 상세정보 조회 실패:', error);
            alert('주문 상세정보를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!orderDetail) return;

        try {
            await axios.put(`/api/orders/${orderDetail.id}/approve`);

            // 로컬 상태 업데이트
            updateOrder(orderDetail.id, { status: 'APPROVED' });

            // 성공 메시지
            alert('발주가 성공적으로 승인되었습니다.');

            // 성공 콜백 호출
            if (onApproveSuccess) {
                onApproveSuccess();
            }

            onClose();
        } catch (error) {
            console.error('발주 승인 실패:', error);
            alert('발주 승인 중 오류가 발생했습니다.');
        }
    };

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
                            <div class="info-item"><span class="label">사업자번호:</span> 682-88-00080</div>
                            <div class="info-item"><span class="label">상호:</span> ㈜고대미래</div>
                            <div class="info-item"><span class="label">대표자:</span> 유시진</div>
                            <div class="info-item"><span class="label">주소:</span> 서울특별시 성북구 안암로145, 고려대학교 100주년삼성기념관 103호 크림슨 스토어</div>
                        </div>
                        <div class="info-column">
                            <div class="info-item"><span class="label">발신:</span> ㈜고대미래</div>
                            <div class="info-item"><span class="label">전화:</span> 02-3290-5116</div>
                            <div class="info-item"><span class="label">담당자:</span> ${orderDetail.manager}</div>
                            <div class="info-item"><span class="label">FAX:</span> 02-923-0578</div>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <div class="info-column">
                            <div class="info-item"><span class="label">수신:</span> ${orderDetail.supplier}</div>
                            <div class="info-item"><span class="label">전화:</span> 010-6675-7797</div>
                            <div class="info-item"><span class="label">담당자:</span> 박한솔</div>
                            <div class="info-item"><span class="label">이메일:</span> hspark_factcorp@kakao.com</div>
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
                            <div class="info-item"><span class="label">납품장소:</span> 고려대학교 100주년기념관(크림슨스토어)</div>
                        </div>
                        <div class="info-column">
                            <div class="info-item"><span class="label">구매비용:</span> 일금 ${numberToKorean(
                                orderDetail.items.reduce((total, item) => total + item.quantity * item.unit_price, 0)
                            )} (₩ ${orderDetail.items
            .reduce((total, item) => total + item.quantity * item.unit_price, 0)
            .toLocaleString()})</div>
                            <div class="info-item"><span class="label">부가세:</span> 포함</div>
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
                                    .reduce((total, item) => total + item.quantity * item.unit_price, 0)
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
                    
                    <div class="note-section">
                        <div class="label">비고:</div>
                        <div>${orderDetail.note}</div>
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

    const handleDownloadExcel = async () => {
        if (!orderDetail || !supplierDetail) {
            alert('주문 정보 또는 공급업체 정보가 없습니다.');
            return;
        }

        try {
            // 1. 템플릿 파일 fetch (blob → arrayBuffer)
            const response = await fetch('/data/template.xlsx');
            const arrayBuffer = await response.arrayBuffer();

            // 2. xlsx-populate로 workbook 로드
            const workbook = await XlsxPopulate.fromDataAsync(arrayBuffer);
            const sheet = workbook.sheet(0);

            // 3. 셀 값 매핑 (스타일/병합/수식 유지)
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

            const totalAmount = orderDetail.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
            sheet.cell('G18').value(numberToKorean(totalAmount));
            sheet.cell('Q18').value(`${totalAmount.toLocaleString()})`);

            // 부가세 체크박스 LinkedCell: 포함(AG18), 비포함(AH18)
            sheet
                .cell('AG18')
                .value(orderDetail.vat_included ? true : false)
                .style('numberFormat', ';;;'); // 포함(숨김)
            sheet
                .cell('AH18')
                .value(orderDetail.vat_included ? false : true)
                .style('numberFormat', ';;;'); // 비포함(숨김)
            // 포장 체크박스는 기존 LinkedCell(Z101 등) 사용
            sheet.cell('AB31').value(orderDetail.packaging_included ? true : false); // 포장 체크박스 LinkedCell
            // sheet.cell('AA18').value(orderDetail.vat_included ? '■' : '□'); // ← 문자 체크박스는 주석처리
            // sheet.cell('AD18').value(orderDetail.vat_included ? '□' : '■');
            // sheet.cell('Z31').value(orderDetail.packaging_included ? '■' : '□');
            // sheet.cell('AA31').value(orderDetail.packaging_included ? '□' : '■');

            // 작업지시/비고
            sheet.cell('A30').value(orderDetail.instruction_note || '');
            sheet.cell('A33').value(orderDetail.note || '');

            // 4. 품목 테이블 (행 복제 및 데이터 입력)
            const startRow = 21;
            const templateRow = 22;
            const itemCount = orderDetail.items.length;

            // 품목이 6개 초과면, 합계행 바로 위까지만 복제
            if (itemCount > 6) {
                for (let i = 6; i < itemCount; i++) {
                    sheet.row(templateRow).copyTo(sheet.row(startRow + i));
                }
            }

            // 품목 데이터 입력 (합계행은 건드리지 않음)
            orderDetail.items.forEach((item, idx) => {
                const row = startRow + idx;
                sheet.cell(`C${row}`).value(item.item_name);
                sheet.cell(`H${row}`).value(item.spec);
                sheet.cell(`K${row}`).value('EA');
                sheet.cell(`N${row}`).value(item.quantity);
                sheet.cell(`Q${row}`).value(item.unit_price);
                sheet.cell(`X${row}`).value(item.quantity * item.unit_price);
                sheet.cell(`AD${row}`).value(item.remark || '');
            });

            // 불필요한 빈 행을 셀 값 초기화로 대체 (브라우저 환경 호환)
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
            const blob = await workbook.outputAsync();
            saveAs(blob, `(주)고대미래_발주서_${orderDetail.id}.xlsx`);
        } catch (error) {
            console.error('엑셀 다운로드 실패:', error);
            alert('엑셀 파일 생성 중 오류가 발생했습니다.');
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!orderDetail) return;
        try {
            const response = await axios.patch(`/orders/${orderDetail.id}/`, { status: newStatus });
            const { order, stock_changes } = response.data;
            console.log('서버에서 내려온 order.status:', order.status);
            setOrderDetail(order); // 상세정보 갱신
            if (stock_changes && stock_changes.length > 0) {
                /*alert(
                    '재고가 변경되었습니다.\n' +
                        stock_changes
                            .map(
                                (s: any) =>
                                    `${s.name}(${s.option}): ${s.stock_before} → ${s.stock_after} (+${s.quantity})`
                            )
                            .join('\n')
                );*/
            }
            alert('상태가 변경되었습니다.');
        } catch (e: any) {
            alert(e.response?.data?.detail || '상태 변경 실패');
        }
    };

    if (!isOpen || !orderDetail) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="w-[896px] max-h-[90vh] bg-white rounded-lg shadow-xl overflow-auto">
                {/* Header */}
                <div className="w-full h-16 border-b border-gray-200 px-4 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">발주서 상세보기 - {orderDetail.id}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                {/* Content - PDF로 저장될 부분 */}
                <div ref={printRef} className="p-6 overflow-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : (
                        <div className="w-full border border-stone-300">
                            {/* Title */}
                            <div className="text-center my-5">
                                <h3 className="text-xl font-bold">발 주 서</h3>
                            </div>

                            {/* Company Information */}
                            <div className="flex px-5 mb-3">
                                <div className="w-1/2 space-y-1">
                                    <p>
                                        <span className="font-bold">사업자번호:</span> 682-88-00080
                                    </p>
                                    <p>
                                        <span className="font-bold">상호:</span> ㈜고대미래
                                    </p>
                                    <p>
                                        <span className="font-bold">대표자:</span> 유시진
                                    </p>
                                    <p>
                                        <span className="font-bold">주소:</span> 서울특별시 성북구 안암로145, 고려대학교
                                        100주년삼성기념관 103호 크림슨 스토어
                                    </p>
                                </div>
                                <div className="w-1/2 space-y-1">
                                    <p>
                                        <span className="font-bold">발신:</span> ㈜고대미래
                                    </p>
                                    <p>
                                        <span className="font-bold">전화:</span> 02-3290-5116
                                    </p>
                                    <p>
                                        <span className="font-bold">담당자:</span> {orderDetail.manager}
                                    </p>
                                    <p>
                                        <span className="font-bold">FAX:</span> 02-923-0578
                                    </p>
                                </div>
                            </div>

                            {/* Supplier Information */}
                            <div className="px-5 my-5">
                                <div className="space-y-1">
                                    <p>
                                        <span className="font-bold">수신:</span>{' '}
                                        {supplierDetail?.name || orderDetail.supplier}
                                    </p>
                                    <p>
                                        <span className="font-bold">전화:</span> {supplierDetail?.contact || '-'}
                                    </p>
                                    <p>
                                        <span className="font-bold">담당자:</span> {supplierDetail?.manager || '-'}
                                    </p>
                                    <p>
                                        <span className="font-bold">이메일:</span> {supplierDetail?.email || '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Order Message */}
                            <div className="px-5 my-6">
                                <p className="text-base">
                                    아래와 같이 발주하오니 기일 내 필히 납품하여 주시기 바랍니다.
                                </p>
                            </div>

                            {/* Order Details */}
                            <div className="px-5 flex my-5">
                                <div className="w-1/2 space-y-1">
                                    <p>
                                        <span className="font-bold">발주일자:</span> {orderDetail.order_date}
                                    </p>
                                    <p>
                                        <span className="font-bold">납품일자:</span>{' '}
                                        {orderDetail.expected_delivery_date}
                                    </p>
                                    <p>
                                        <span className="font-bold">납품장소:</span> 고려대학교
                                        100주년기념관(크림슨스토어)
                                    </p>
                                </div>
                                <div className="w-1/2 space-y-1">
                                    <p>
                                        <span className="font-bold">구매비용:</span> 일금{' '}
                                        {numberToKorean(
                                            orderDetail.items.reduce(
                                                (total, item) => total + item.quantity * item.unit_price,
                                                0
                                            )
                                        )}{' '}
                                        (₩ $
                                        {orderDetail.items
                                            .reduce((total, item) => total + item.quantity * item.unit_price, 0)
                                            .toLocaleString()}
                                        )
                                    </p>
                                    <p>
                                        <span className="font-bold">부가세:</span> 포함
                                    </p>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="px-5 my-5">
                                <table className="w-full border border-gray-300">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="border border-stone-300 p-2 text-center w-12">NO</th>
                                            <th className="border border-stone-300 p-2 text-center">
                                                발주품목 및 내역
                                            </th>
                                            <th className="border border-stone-300 p-2 text-center w-20">규격</th>
                                            <th className="border border-stone-300 p-2 text-center w-14">단위</th>
                                            <th className="border border-stone-300 p-2 text-center w-14">수량</th>
                                            <th className="border border-stone-300 p-2 text-center w-40">
                                                단가 (VAT 포함)
                                            </th>
                                            <th className="border border-stone-300 p-2 text-center w-40">
                                                금액 (VAT 포함)
                                            </th>
                                            <th className="border border-stone-300 p-2 text-center w-14">비고</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orderDetail.items.map((item, index) => (
                                            <tr key={item.id}>
                                                <td className="border border-stone-300 p-2 text-center">{index + 1}</td>
                                                <td className="border border-stone-300 p-2">{item.item_name}</td>
                                                <td className="border border-stone-300 p-2">{item.spec}</td>
                                                <td className="border border-stone-300 p-2 text-center">
                                                    {item.unit_price.toLocaleString()}원
                                                </td>
                                                <td className="border border-stone-300 p-2 text-center">
                                                    {item.quantity}
                                                </td>
                                                <td className="border border-stone-300 p-2 text-right">
                                                    {item.unit_price.toLocaleString()}
                                                </td>
                                                <td className="border border-stone-300 p-2 text-right">
                                                    {(item.quantity * item.unit_price).toLocaleString()}
                                                </td>
                                                <td className="border border-stone-300 p-2">{item.remark || ''}</td>
                                            </tr>
                                        ))}
                                        <tr>
                                            <td colSpan={4} className="border border-stone-300 p-2 text-center">
                                                합계
                                            </td>
                                            <td className="border border-stone-300 p-2 text-center">
                                                {orderDetail.items.reduce((total, item) => total + item.quantity, 0)}
                                            </td>
                                            <td className="border border-stone-300 p-2 text-right">
                                                {orderDetail.items
                                                    .reduce((total, item) => total + item.unit_price, 0)
                                                    .toLocaleString()}
                                            </td>
                                            <td className="border border-stone-300 p-2 text-right">
                                                {orderDetail.items
                                                    .reduce((total, item) => total + item.quantity * item.unit_price, 0)
                                                    .toLocaleString()}
                                            </td>
                                            <td className="border border-stone-300 p-2"></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Work Instructions */}
                            <div className="px-5 my-5">
                                <div className="mb-2">
                                    <span className="font-bold">작업지시사항:</span>
                                </div>
                                <div className="border border-gray-300 p-3 min-h-16">
                                    <p>{orderDetail.instruction_note || ''}</p>
                                </div>
                            </div>

                            {/* Packaging */}
                            <div className="px-5 my-5 flex items-center">
                                <span className="font-bold mr-6">포장:</span>
                                <div className="bg-zinc-100 px-3 py-1 rounded-md border border-gray-300">
                                    <span>{orderDetail.packaging_included ? '있음' : '없음'}</span>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="px-5 my-5">
                                <p>
                                    <span className="font-bold">비고:</span> {orderDetail.note}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-4 flex justify-between items-end">
                    {/* 좌측: 상태 변경 버튼 그룹 */}
                    <div className="flex gap-3">
                        {orderDetail.status !== 'APPROVED' && (
                            <button
                                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                                onClick={() => handleStatusChange('APPROVED')}
                            >
                                발주 승인
                            </button>
                        )}
                        {orderDetail.status !== 'CANCELLED' && (
                            <button
                                className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 transition"
                                onClick={() => handleStatusChange('CANCELLED')}
                            >
                                발주 취소
                            </button>
                        )}
                        {orderDetail.status !== 'COMPLETED' && (
                            <button
                                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition"
                                onClick={() => handleStatusChange('COMPLETED')}
                            >
                                발주 완료
                            </button>
                        )}
                    </div>
                    {/* 우측: PDF/인쇄/승인 버튼 */}
                    <div className="flex space-x-3">
                        <button
                            onClick={handleDownloadExcel}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded"
                        >
                            <FiDownload className="w-6 h-6 mr-2" />
                            엑셀 저장
                        </button>
                        <button
                            onClick={handlePrintOrder}
                            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded"
                        >
                            <FiPrinter className="w-6 h-6 mr-2" />
                            인쇄
                        </button>
                        {isManager && orderDetail && orderDetail.id && (
                            <button
                                onClick={handleApprove}
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded"
                            >
                                <FiCheck className="w-6 h-6 mr-2" />
                                승인
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailModal;
