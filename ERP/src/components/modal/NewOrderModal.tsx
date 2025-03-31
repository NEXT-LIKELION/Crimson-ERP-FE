// src/components/modal/NewOrderModal.tsx
import React, { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2, FiShoppingBag, FiCalendar, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import DateInput from '../input/DateInput';
import SelectInput from '../input/SelectInput';
import TextInput from '../input/TextInput';
import RadioButton from '../common/RadioButton';
import { useOrdersStore, Order } from '../../store/ordersStore';
import { useAuthStore } from '../../store/authStore';
import axios from '../../api/axios';

interface NewOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (newOrder: Order) => void;
}

interface OrderItem {
    id: number;
    name: string;
    spec: string;
    unit: string;
    quantity: number;
    price: number;
    amount: number;
    note?: string;
}

const NewOrderModal: React.FC<NewOrderModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [supplier, setSupplier] = useState<string>('');
    const [orderDate, setOrderDate] = useState<Date | null>(new Date());
    const [deliveryDate, setDeliveryDate] = useState<Date | null>(null);
    const [items, setItems] = useState<OrderItem[]>([
        {
            id: 1,
            name: '텀블러(블랙)',
            spec: '300ml',
            unit: 'EA',
            quantity: 100,
            price: 8000,
            amount: 800000,
            note: '',
        },
    ]);
    const [workInstructions, setWorkInstructions] = useState<string>(
        '로고 디자인은 첨부파일대로 적용해 주시기 바랍니다. 샘플 확인 후 본 생산 진행 예정입니다.'
    );
    const [includesTax, setIncludesTax] = useState<boolean>(true);
    const [hasPackaging, setHasPackaging] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [formErrors, setFormErrors] = useState<string[]>([]);
    const [suppliers, setSuppliers] = useState<string[]>(['팩토리코퍼레이션', '한국판촉물', '대한상사']);

    const { addOrder } = useOrdersStore();
    const user = useAuthStore((state) => state.user);

    useEffect(() => {
        // 공급업체 목록을 가져오는 API 호출 (실제 환경에서 사용)
        const fetchSuppliers = async () => {
            try {
                // const response = await axios.get('/api/suppliers');
                // setSuppliers(response.data);

                // 개발 환경에서는 고정 데이터 사용
                setSuppliers(['팩토리코퍼레이션', '한국판촉물', '대한상사', '서울프로모션']);
            } catch (error) {
                console.error('공급업체 목록 조회 실패:', error);
            }
        };

        if (isOpen) {
            fetchSuppliers();
            // 모달이 열릴 때마다 기본값으로 초기화
            resetForm();
        }
    }, [isOpen]);

    const resetForm = () => {
        setSupplier('');
        setOrderDate(new Date());
        // 예상 납품일은 기본적으로 2주 후로 설정
        const twoWeeksLater = new Date();
        twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
        setDeliveryDate(twoWeeksLater);

        setItems([
            {
                id: 1,
                name: '텀블러(블랙)',
                spec: '300ml',
                unit: 'EA',
                quantity: 100,
                price: 8000,
                amount: 800000,
                note: '',
            },
        ]);
        setWorkInstructions('로고 디자인은 첨부파일대로 적용해 주시기 바랍니다. 샘플 확인 후 본 생산 진행 예정입니다.');
        setIncludesTax(true);
        setHasPackaging(true);
        setFormErrors([]);
    };

    const handleAddItem = () => {
        const newId = items.length > 0 ? Math.max(...items.map((item) => item.id)) + 1 : 1;
        const newItem: OrderItem = {
            id: newId,
            name: '',
            spec: '',
            unit: 'EA',
            quantity: 0,
            price: 0,
            amount: 0,
            note: '',
        };
        setItems([...items, newItem]);
    };

    const handleRemoveItem = (id: number) => {
        // 적어도 하나의 항목은 유지해야 함
        if (items.length > 1) {
            setItems(items.filter((item) => item.id !== id));
        } else {
            alert('최소 하나의 발주 항목이 필요합니다.');
        }
    };

    const handleItemChange = (id: number, field: keyof OrderItem, value: string | number) => {
        setItems(
            items.map((item) => {
                if (item.id === id) {
                    const updatedItem = { ...item, [field]: value };

                    // 수량이나 가격이 변경되면 금액 자동 계산
                    if (field === 'quantity' || field === 'price') {
                        const quantity = field === 'quantity' ? Number(value) : item.quantity;
                        const price = field === 'price' ? Number(value) : item.price;
                        updatedItem.amount = quantity * price;
                    }

                    return updatedItem;
                }
                return item;
            })
        );
    };

    const calculateTotal = (): number => {
        return items.reduce((sum, item) => sum + item.amount, 0);
    };

    const formatDate = (date: Date | null): string => {
        if (!date) return '';

        // YYYY-MM-DD 형식으로 변환
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    };

    const validateForm = (): boolean => {
        const errors: string[] = [];

        if (!supplier) {
            errors.push('공급업체를 선택해주세요.');
        }

        if (!orderDate) {
            errors.push('발주일자를 선택해주세요.');
        }

        if (!deliveryDate) {
            errors.push('예상 납품일을 선택해주세요.');
        }

        // 각 발주 항목 검증
        items.forEach((item, index) => {
            if (!item.name) {
                errors.push(`${index + 1}번 항목의 품목명을 입력해주세요.`);
            }

            if (!item.spec) {
                errors.push(`${index + 1}번 항목의 규격을 입력해주세요.`);
            }

            if (item.quantity <= 0) {
                errors.push(`${index + 1}번 항목의 수량은 0보다 커야 합니다.`);
            }

            if (item.price <= 0) {
                errors.push(`${index + 1}번 항목의 단가는 0보다 커야 합니다.`);
            }
        });

        if (!workInstructions.trim()) {
            errors.push('작업지시사항을 입력해주세요.');
        }

        setFormErrors(errors);
        return errors.length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            // 폼 검증 실패
            return;
        }

        setIsSubmitting(true);

        try {
            // 새 발주 번호 생성
            const now = new Date();
            const year = now.getFullYear();
            const orderNumber = `ORD-${year}-${Math.floor(Math.random() * 10000)
                .toString()
                .padStart(4, '0')}`;

            // 새 발주 데이터 생성
            const newOrder: Order = {
                id: Math.floor(Math.random() * 10000), // 실제로는 서버에서 생성
                productName: orderNumber,
                orderDate: formatDate(orderDate),
                totalAmount: calculateTotal(),
                status: 'pending',
                manager: user?.username || '사용자',
                supplier: supplier,
                items: items,
            };

            // 실제 환경에서는 API 호출
            // const response = await axios.post('/api/orders', newOrder);
            // const createdOrder = response.data;

            // 로컬 상태 업데이트
            addOrder(newOrder);

            // 성공 메시지
            alert('발주가 성공적으로 신청되었습니다.');

            // 성공 콜백 호출
            if (onSuccess) {
                onSuccess(newOrder);
            }

            // 모달 닫기
            onClose();
        } catch (error) {
            console.error('발주 신청 실패:', error);
            setFormErrors(['발주 신청 중 오류가 발생했습니다. 다시 시도해주세요.']);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="w-[900px] max-h-[90vh] bg-white rounded-lg shadow-xl overflow-auto">
                {/* Header */}
                <div className="px-4 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center">
                        <FiShoppingBag className="w-6 h-6 text-indigo-500 mr-2" />
                        <h2 className="text-lg font-medium text-gray-900">새 발주 신청</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500" disabled={isSubmitting}>
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* 폼 오류 메시지 표시 */}
                    {formErrors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <div className="flex items-start">
                                <FiAlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-2" />
                                <div>
                                    <h3 className="text-sm font-medium text-red-800">다음 오류를 확인해주세요:</h3>
                                    <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                                        {formErrors.map((error, index) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Supplier and Order Info */}
                    <div className="flex justify-center items-start gap-6">
                        <div className="w-96 space-y-4">
                            <div className="flex items-center">
                                <FiShoppingBag className="w-6 h-6 text-gray-900 mr-2" />
                                <h3 className="text-base font-medium text-gray-900">공급업체 정보</h3>
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700">
                                    공급업체 선택 <span className="text-red-500">*</span>
                                </label>
                                <SelectInput defaultText="공급업체 선택" options={suppliers} onChange={setSupplier} />
                            </div>
                        </div>
                        <div className="w-96 space-y-4">
                            <div className="flex items-center">
                                <FiCalendar className="w-6 h-6 text-gray-900 mr-2" />
                                <h3 className="text-base font-medium text-gray-900">발주 정보</h3>
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700">
                                    발주일자 <span className="text-red-500">*</span>
                                </label>
                                <DateInput placeholder="발주일자 선택" onChange={setOrderDate} />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700">
                                    예상 납품일 <span className="text-red-500">*</span>
                                </label>
                                <DateInput placeholder="예상 납품일 선택" onChange={setDeliveryDate} />
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <FiShoppingBag className="w-6 h-6 text-gray-900 mr-2" />
                                <h3 className="text-base font-medium text-gray-900">
                                    발주 품목 <span className="text-red-500">*</span>
                                </h3>
                            </div>
                            <button
                                onClick={handleAddItem}
                                className="px-3 py-1 bg-indigo-600 text-white rounded-md flex items-center text-sm font-medium"
                                disabled={isSubmitting}
                            >
                                <FiPlus className="w-3.5 h-3.5 mr-1" />
                                항목 추가
                            </button>
                        </div>
                        <div className="border border-gray-200 rounded-md overflow-hidden">
                            <div className="min-w-[852px]">
                                {/* Table Header */}
                                <div className="bg-gray-50 h-8">
                                    <div className="h-8 flex">
                                        <div className="w-32 px-3 py-2 flex items-center">
                                            <span className="text-xs font-medium text-gray-500 uppercase">
                                                품목명 <span className="text-red-500">*</span>
                                            </span>
                                        </div>
                                        <div className="w-32 px-3 py-2 flex items-center">
                                            <span className="text-xs font-medium text-gray-500 uppercase">
                                                규격 <span className="text-red-500">*</span>
                                            </span>
                                        </div>
                                        <div className="w-20 px-3 py-2 flex items-center">
                                            <span className="text-xs font-medium text-gray-500 uppercase">단위</span>
                                        </div>
                                        <div className="w-24 px-3 py-2 flex items-center">
                                            <span className="text-xs font-medium text-gray-500 uppercase">
                                                수량 <span className="text-red-500">*</span>
                                            </span>
                                        </div>
                                        <div className="w-32 px-3 py-2 flex items-center">
                                            <span className="text-xs font-medium text-gray-500 uppercase">
                                                단가 <span className="text-red-500">*</span>
                                            </span>
                                        </div>
                                        <div className="w-20 px-3 py-2 flex items-center">
                                            <span className="text-xs font-medium text-gray-500 uppercase">금액</span>
                                        </div>
                                        <div className="w-32 px-3 py-2 flex items-center">
                                            <span className="text-xs font-medium text-gray-500 uppercase">비고</span>
                                        </div>
                                        <div className="w-14 px-4 py-2 flex items-center justify-center">
                                            <span className="text-xs font-medium text-gray-500 uppercase">삭제</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Table Body */}
                                <div className="bg-white">
                                    {items.map((item) => (
                                        <div key={item.id} className="h-14 flex border-t border-gray-200">
                                            <div className="w-32 px-3 py-3.5 flex items-center">
                                                <input
                                                    type="text"
                                                    value={item.name}
                                                    onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            <div className="w-32 px-3 py-3.5 flex items-center">
                                                <input
                                                    type="text"
                                                    value={item.spec}
                                                    onChange={(e) => handleItemChange(item.id, 'spec', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            <div className="w-20 px-3 py-3.5 flex items-center justify-center">
                                                <div className="px-3 py-1 bg-zinc-100 rounded-md border border-gray-300 w-11 text-center">
                                                    <span className="text-sm">EA</span>
                                                </div>
                                            </div>
                                            <div className="w-24 px-3 py-3.5 flex items-center">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) =>
                                                        handleItemChange(
                                                            item.id,
                                                            'quantity',
                                                            parseInt(e.target.value) || 0
                                                        )
                                                    }
                                                    className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                                                    min="1"
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            <div className="w-32 px-3 py-3.5 flex items-center">
                                                <input
                                                    type="number"
                                                    value={item.price}
                                                    onChange={(e) =>
                                                        handleItemChange(
                                                            item.id,
                                                            'price',
                                                            parseInt(e.target.value) || 0
                                                        )
                                                    }
                                                    className="w-28 px-2 py-1 border border-gray-300 rounded-md text-sm"
                                                    min="0"
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            <div className="w-20 px-3 py-2 flex items-center justify-center">
                                                <div className="text-sm font-normal text-gray-900 leading-tight">
                                                    {item.amount.toLocaleString()}
                                                    <br />원
                                                </div>
                                            </div>
                                            <div className="w-32 px-3 py-3.5 flex items-center">
                                                <input
                                                    type="text"
                                                    value={item.note || ''}
                                                    onChange={(e) => handleItemChange(item.id, 'note', e.target.value)}
                                                    placeholder="비고"
                                                    className="w-full px-2 pt-1.5 pb-1 border border-gray-300 rounded-md text-sm placeholder-gray-400"
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            <div className="w-14 px-3 py-3 flex items-center justify-center">
                                                <button
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    className="p-1 text-red-600 hover:text-red-800"
                                                    disabled={isSubmitting || items.length <= 1}
                                                >
                                                    <FiTrash2 className="w-6 h-6" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Total Row */}
                                    <div className="h-9 bg-gray-50 border-t border-gray-200 flex">
                                        <div className="w-[577px] px-3 py-2 flex justify-end items-center">
                                            <span className="text-sm font-medium text-gray-900">합계</span>
                                        </div>
                                        <div className="w-72 px-3 py-2 flex items-center">
                                            <span className="text-sm font-bold text-gray-900">
                                                {calculateTotal().toLocaleString()}원
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div className="flex justify-center items-start gap-6">
                        <div className="w-96 space-y-4">
                            <h3 className="text-base font-medium text-gray-900">부가 정보</h3>
                            <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-700 pr-4">부가세:</span>
                                <div className="space-x-4 flex">
                                    <RadioButton
                                        label="포함"
                                        value="include"
                                        checked={includesTax}
                                        onChange={() => setIncludesTax(true)}
                                        disabled={isSubmitting}
                                    />
                                    <RadioButton
                                        label="미포함"
                                        value="exclude"
                                        checked={!includesTax}
                                        onChange={() => setIncludesTax(false)}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-700 pr-4">포장:</span>
                                <div className="space-x-4 flex">
                                    <RadioButton
                                        label="있음"
                                        value="yes"
                                        checked={hasPackaging}
                                        onChange={() => setHasPackaging(true)}
                                        disabled={isSubmitting}
                                    />
                                    <RadioButton
                                        label="없음"
                                        value="no"
                                        checked={!hasPackaging}
                                        onChange={() => setHasPackaging(false)}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="w-96 space-y-3">
                            <h3 className="text-base font-medium text-gray-900">
                                작업지시사항 <span className="text-red-500">*</span>
                            </h3>
                            <textarea
                                value={workInstructions}
                                onChange={(e) => setWorkInstructions(e.target.value)}
                                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md text-sm"
                                placeholder="작업지시사항을 입력해주세요."
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t border-gray-200 flex justify-end items-center">
                        <div className="flex-1 flex items-center">
                            <FiCheckCircle className="w-6 h-6 text-green-700 mr-2" />
                            <span className="text-sm text-green-700">발주 준비가 완료되었습니다.</span>
                        </div>
                        <div className="space-x-3 flex">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md shadow-sm text-sm font-medium"
                                disabled={isSubmitting}
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSubmit}
                                className={`px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm text-sm font-medium ${
                                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? '처리 중...' : '발주 신청'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewOrderModal;
