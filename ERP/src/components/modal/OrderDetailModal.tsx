// src/components/modal/OrderDetailModal.tsx
import React, { useEffect, useState, useRef } from 'react';
import { FiX, FiPrinter, FiDownload, FiCheck } from 'react-icons/fi';
import { useOrdersStore } from '../../store/ordersStore';
import axios from '../../api/axios';

interface OrderDetailModalProps {
    orderId: number;
    isOpen: boolean;
    onClose: () => void;
    isManager: boolean;
    onApproveSuccess?: () => void;
}

interface OrderDetailItem {
    id: number;
    name: string;
    spec: string;
    unit: string;
    quantity: number;
    price: number;
    amount: number;
    note?: string;
}

interface OrderDetail {
    id: number;
    orderNumber: string;
    supplier: string;
    orderDate: string;
    deliveryDate: string;
    totalAmount: number;
    manager: string;
    hasPackaging: boolean;
    items: OrderDetailItem[];
    notes: string;
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

    useEffect(() => {
        if (isOpen && orderId) {
            fetchOrderDetails();
        }
    }, [isOpen, orderId]);

    const fetchOrderDetails = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`/orders/${orderId}`);
            console.log('Received order data:', response.data);

            if (!response.data) {
                throw new Error('주문 데이터가 없습니다.');
            }

            const orderData = response.data;

            // 필수 필드 검증
            if (!orderData.id || (!orderData.variant_id && !orderData.variant_code) || !orderData.supplier_id) {
                throw new Error('필수 주문 정보가 누락되었습니다.');
            }

            // OrderDetail 형식으로 변환
            const orderDetail: OrderDetail = {
                id: orderData.id,
                orderNumber: orderData.variant?.name || '주문번호 없음',
                supplier: orderData.supplier?.name || '공급업체 정보 없음',
                orderDate: orderData.order_date || '발주일자 없음',
                deliveryDate: orderData.delivery_date || '납품일자 없음',
                totalAmount: orderData.total_amount || 0,
                manager: orderData.manager || '담당자 정보 없음',
                hasPackaging: orderData.has_packaging || false,
                items:
                    orderData.items?.map((item: any) => ({
                        id: item.id,
                        name: item.name || '품목명 없음',
                        spec: item.spec || '규격 없음',
                        unit: item.unit || 'EA',
                        quantity: item.quantity || 0,
                        price: item.price || 0,
                        amount: item.amount || 0,
                        note: item.note,
                    })) || [],
                notes: orderData.notes || '',
            };

            console.log('Transformed order detail:', orderDetail);
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
                <title>발주서 - ${orderDetail.orderNumber}</title>
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
                            <div class="info-item"><span class="label">발주일자:</span> ${orderDetail.orderDate}</div>
                            <div class="info-item"><span class="label">납품일자:</span> ${
                                orderDetail.deliveryDate
                            }</div>
                            <div class="info-item"><span class="label">납품장소:</span> 고려대학교 100주년기념관(크림슨스토어)</div>
                        </div>
                        <div class="info-column">
                            <div class="info-item"><span class="label">구매비용:</span> 일금 ${orderDetail.totalAmount.toLocaleString()}원정</div>
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
                                    <td>${item.name}</td>
                                    <td>${item.spec}</td>
                                    <td style="text-align: center;">${item.unit}</td>
                                    <td style="text-align: center;">${item.quantity}</td>
                                    <td class="amount">${item.price.toLocaleString()}</td>
                                    <td class="amount">${item.amount.toLocaleString()}</td>
                                    <td>${item.note || ''}</td>
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
                                    .reduce((total, item) => total + item.price, 0)
                                    .toLocaleString()}</td>
                                <td class="amount">${orderDetail.totalAmount.toLocaleString()}</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div>
                        <div class="label">작업지시사항:</div>
                        <div class="work-instruction">
                            로고 디자인은 첨부파일대로 적용해 주시기 바랍니다. 샘플 확인 후 본 생산 진행 예정입니다.
                        </div>
                    </div>
                    
                    <div class="packaging">
                        <span class="label">포장:</span>
                        <span class="packaging-value">${orderDetail.hasPackaging ? '있음' : '없음'}</span>
                    </div>
                    
                    <div class="note-section">
                        <div class="label">비고:</div>
                        <div>${orderDetail.notes}</div>
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

    const handleDownloadPDF = () => {
        if (!orderDetail) return;

        // HTML 요소를 그대로 PDF로 변환
        if (printRef.current) {
            // 사용자에게 PDF 다운로드 중임을 알림
            alert('PDF 파일이 다운로드됩니다. 잠시만 기다려주세요.');

            // PDF 파일 생성 (실제 환경에서는 html2canvas 및 jsPDF를 사용)
            // html2canvas 및 jsPDF 라이브러리를 설치해야 함 (npm install html2canvas jspdf)
            // 이 예제에서는 간단히 새 창을 열어 페이지를 그대로 표시
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                alert('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
                return;
            }

            // PDF 다운로드 페이지 HTML 생성 (실제로는 html2canvas와 jsPDF 사용)
            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>발주서 - ${orderDetail.orderNumber} - PDF</title>
                    <meta charset="UTF-8">
                    <style>
                        body { 
                            font-family: 'Malgun Gothic', Arial, sans-serif; 
                            margin: 20px; 
                            color: #333; 
                        }
                        .message {
                            margin-bottom: 20px;
                            padding: 15px;
                            background-color: #f0f8ff;
                            border: 1px solid #b0d8ff;
                            border-radius: 5px;
                        }
                        .download-btn {
                            padding: 10px 20px;
                            background-color: #4a6bef;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 16px;
                            margin-top: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="message">
                        <h2>PDF 다운로드</h2>
                        <p>이 페이지는 실제 환경에서 PDF 파일을 다운로드하는 페이지입니다.</p>
                        <p>발주서 "${orderDetail.orderNumber}"가 PDF 파일로 다운로드됩니다.</p>
                        <p>실제 환경에서는 html2canvas와 jsPDF 라이브러리를 사용하여 자동으로 PDF가 다운로드됩니다.</p>
                    </div>
                    <button class="download-btn" onclick="window.print()">PDF로 저장하기</button>
                </body>
                </html>
            `;

            printWindow.document.open();
            printWindow.document.write(printContent);
            printWindow.document.close();
        }
    };

    if (!isOpen || !orderDetail) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="w-[896px] max-h-[90vh] bg-white rounded-lg shadow-xl overflow-auto">
                {/* Header */}
                <div className="w-full h-16 border-b border-gray-200 px-4 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">발주서 상세보기 - {orderDetail.orderNumber}</h2>
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
                                        <span className="font-bold">수신:</span> {orderDetail.supplier}
                                    </p>
                                    <p>
                                        <span className="font-bold">전화:</span> 010-6675-7797
                                    </p>
                                    <p>
                                        <span className="font-bold">담당자:</span> 박한솔
                                    </p>
                                    <p>
                                        <span className="font-bold">이메일:</span> hspark_factcorp@kakao.com
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
                                        <span className="font-bold">발주일자:</span> {orderDetail.orderDate}
                                    </p>
                                    <p>
                                        <span className="font-bold">납품일자:</span> {orderDetail.deliveryDate}
                                    </p>
                                    <p>
                                        <span className="font-bold">납품장소:</span> 고려대학교
                                        100주년기념관(크림슨스토어)
                                    </p>
                                </div>
                                <div className="w-1/2 space-y-1">
                                    <p>
                                        <span className="font-bold">구매비용:</span> 일금 팔십오만 원정 (₩{' '}
                                        {orderDetail.totalAmount.toLocaleString()})
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
                                                <td className="border border-stone-300 p-2">{item.name}</td>
                                                <td className="border border-stone-300 p-2">{item.spec}</td>
                                                <td className="border border-stone-300 p-2 text-center">{item.unit}</td>
                                                <td className="border border-stone-300 p-2 text-center">
                                                    {item.quantity}
                                                </td>
                                                <td className="border border-stone-300 p-2 text-right">
                                                    {item.price.toLocaleString()}
                                                </td>
                                                <td className="border border-stone-300 p-2 text-right">
                                                    {item.amount.toLocaleString()}
                                                </td>
                                                <td className="border border-stone-300 p-2">{item.note || ''}</td>
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
                                                    .reduce((total, item) => total + item.price, 0)
                                                    .toLocaleString()}
                                            </td>
                                            <td className="border border-stone-300 p-2 text-right">
                                                {orderDetail.totalAmount.toLocaleString()}
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
                                    <p>
                                        로고 디자인은 첨부파일대로 적용해 주시기 바랍니다. 샘플 확인 후 본 생산 진행
                                        예정입니다.
                                    </p>
                                </div>
                            </div>

                            {/* Packaging */}
                            <div className="px-5 my-5 flex items-center">
                                <span className="font-bold mr-6">포장:</span>
                                <div className="bg-zinc-100 px-3 py-1 rounded-md border border-gray-300">
                                    <span>{orderDetail.hasPackaging ? '있음' : '없음'}</span>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="px-5 my-5">
                                <p>
                                    <span className="font-bold">비고:</span> {orderDetail.notes}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-4 flex justify-end space-x-3">
                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded"
                    >
                        <FiDownload className="w-6 h-6 mr-2" />
                        PDF 저장
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
    );
};

export default OrderDetailModal;
