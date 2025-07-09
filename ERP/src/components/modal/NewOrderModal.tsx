// src/components/modal/NewOrderModal.tsx
import React, { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2, FiShoppingBag, FiCalendar, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import DateInput from '../input/DateInput';
import SelectInput from '../input/SelectInput';
import RadioButton from '../common/RadioButton';
import { useOrdersStore, Order } from '../../store/ordersStore';
import { useAuthStore } from '../../store/authStore';
import { fetchSuppliers } from '../../api/supplier';
import { fetchInventories, fetchVariantsByProductId } from '../../api/inventory';
import { createOrder } from '../../api/orders';
import { useEmployees } from '../../hooks/queries/useEmployees';

interface NewOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (newOrder: Order) => void;
}

interface OrderItemPayload {
    product_id: string | null; // 상품 ID
    variant: string | null;
    quantity: number;
    unit_price: number;
    remark: string;
    spec: string;
}

const NewOrderModal: React.FC<NewOrderModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [supplier, setSupplier] = useState<number>(0);
    const [supplierName, setSupplierName] = useState<string>('');
    const [orderDate, setOrderDate] = useState<Date | null>(null); // 초기값 null
    const [deliveryDate, setDeliveryDate] = useState<Date | null>(null); // 초기값 null
    const [items, setItems] = useState<OrderItemPayload[]>([
        {
            product_id: null,
            variant: null,
            quantity: 1,
            unit_price: 0,
            remark: '',
            spec: '',
        },
    ]);
    const [workInstructions, setWorkInstructions] = useState<string>(
        '로고 디자인은 첨부파일대로 적용해 주시기 바랍니다. 샘플 확인 후 본 생산 진행 예정입니다.'
    );
    const [includesTax, setIncludesTax] = useState<boolean>(true);
    const [hasPackaging, setHasPackaging] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [formErrors, setFormErrors] = useState<string[]>([]);
    const [variantsByProduct, setVariantsByProduct] = useState<{ [productId: string]: any[] }>({});
    const { data: employeesData } = useEmployees();
    const employees = employeesData?.data || [];
    const user = useAuthStore((state) => state.user);

    const { addOrder } = useOrdersStore();

    useEffect(() => {
        if (isOpen) {
            fetchSuppliers().then((res) => setSuppliers(res.data));
            fetchInventories().then((res) => setProducts(res.data));
            resetForm();
            setSupplierName('');
        }
    }, [isOpen]);

    const resetForm = () => {
        setSupplier(0);
        setSupplierName('');
        setOrderDate(null); // 초기값 null
        setDeliveryDate(null); // 초기값 null
        setItems([
            {
                product_id: null,
                variant: null,
                quantity: 1,
                unit_price: 0,
                remark: '',
                spec: '',
            },
        ]);
        setWorkInstructions('로고 디자인은 첨부파일대로 적용해 주시기 바랍니다. 샘플 확인 후 본 생산 진행 예정입니다.');
        setIncludesTax(true);
        setHasPackaging(true);
        setFormErrors([]);
    };

    const handleAddItem = () => {
        setItems([
            ...items,
            {
                product_id: null,
                variant: null,
                quantity: 1,
                unit_price: 0,
                remark: '',
                spec: '',
            },
        ]);
    };

    const handleRemoveItem = (idx: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== idx));
        } else {
            alert('최소 하나의 발주 항목이 필요합니다.');
        }
    };

    const handleItemChange = (idx: number, field: string, value: any) => {
        setItems(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
    };

    const calculateTotal = (): number => {
        const total = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
        return includesTax ? total : Math.round(total * 1.1);
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
        items.forEach((item, index) => {
            if (!item.product_id) {
                errors.push(`${index + 1}번 항목의 상품을 선택해주세요.`);
            }
            if (
                !item.variant ||
                !(item.product_id && variantsByProduct[item.product_id]?.find((v: any) => v.option === item.variant))
            ) {
                errors.push(`${index + 1}번 항목의 품목을 선택해주세요.`);
            }
            if (!item.spec) {
                errors.push(`${index + 1}번 항목의 규격을 입력해주세요.`);
            }
            if (item.quantity <= 0) {
                errors.push(`${index + 1}번 항목의 수량은 0보다 커야 합니다.`);
            }
            if (item.unit_price <= 0) {
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
        if (!supplier) {
            setFormErrors(['공급업체를 선택해주세요.']);
            return;
        }
        if (!validateForm()) {
            alert('필수 입력값을 모두 입력해주세요.');
            return;
        }
        setIsSubmitting(true);
        try {
            const payload = {
                supplier,
                order_date: orderDate ? orderDate.toISOString().slice(0, 10) : '',
                expected_delivery_date: deliveryDate ? deliveryDate.toISOString().slice(0, 10) : '',
                status: 'PENDING',
                instruction_note: workInstructions,
                note: '',
                vat_included: includesTax,
                packaging_included: hasPackaging,
                manager_name: user?.first_name || user?.username || '',
                items: items.map((item) => {
                    const product_id = item.product_id;
                    const variantObj =
                        product_id && variantsByProduct[product_id]?.find((v: any) => v.option === item.variant);
                    return {
                        product_id: product_id,
                        variant_code: variantObj ? variantObj.variant_code : undefined,
                        quantity: item.quantity,
                        unit_price: includesTax ? item.unit_price : Math.round(item.unit_price * 1.1),
                        remark: item.remark,
                        spec: item.spec,
                    };
                }),
            };
            const res = await createOrder(payload);
            alert('발주가 성공적으로 신청되었습니다.');
            if (onSuccess) onSuccess(res.data);
            onClose();
        } catch (error) {
            setFormErrors(['발주 신청 중 오류가 발생했습니다. 다시 시도해주세요.']);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 공급업체 선택 핸들러
    const handleSupplierChange = (name: string) => {
        setSupplierName(name);
        const found = suppliers.find((s) => s.name === name);
        setSupplier(found ? found.id : 0);
    };

    // 2. 행별 상품 선택 핸들러
    const handleProductChange = async (idx: number, name: string) => {
        const found = products.find((p) => p.name === name);
        const product_id = found ? found.product_id : null;
        // 품목 캐시 없으면 fetch
        if (product_id && !variantsByProduct[product_id]) {
            try {
                const res = await fetchVariantsByProductId(product_id);
                setVariantsByProduct((prev) => ({ ...prev, [product_id]: res.data.variants || [] }));
            } catch (e) {
                setVariantsByProduct((prev) => ({ ...prev, [product_id]: [] }));
            }
        }
        // 상품 바뀌면 품목, 규격 초기화
        setItems(items.map((item, i) => (i === idx ? { ...item, product_id, variant: null, spec: '' } : item)));
    };

    // 필요하다면 아래와 같이 items의 product_id를 받아서 찾는 함수로 변경
    const getVariantNameById = (product_id: string | null, id: number | null) => {
        if (!product_id || !id) return '';
        const found = variantsByProduct[product_id]?.find((v: any) => v.id === id);
        return found ? found.option : '';
    };
    // 5. 행별 품목 선택 핸들러
    const handleVariantChange = (idx: number, option: string) => {
        console.log('품목(variant) 선택:', option);
        handleItemChange(idx, 'variant', option);
    };

    if (!isOpen) return null;

    if (!employees.length) {
        return <div>직원 목록을 불러오는 중...</div>;
    }

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

                    {/* 공급업체 정보 + 발주 정보 레이아웃 복구 */}
                    <div className="flex justify-center items-start gap-6">
                        {/* 왼쪽: 공급업체 정보 */}
                        <div className="w-96 space-y-4">
                            <div className="flex items-center">
                                <FiShoppingBag className="w-6 h-6 text-gray-900 mr-2" />
                                <h3 className="text-base font-medium text-gray-900">공급업체 정보</h3>
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700">
                                    공급업체 선택 <span className="text-red-500">*</span>
                                </label>
                                <SelectInput
                                    defaultText="공급업체 선택"
                                    options={suppliers.map((s: any) => s.name)}
                                    value={supplierName}
                                    onChange={handleSupplierChange}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700">담당자</label>
                                <SelectInput
                                    defaultText="담당자 선택"
                                    options={employees.map((e: any) => e.first_name || e.username)}
                                    value={user?.first_name || user?.username || ''}
                                    onChange={() => {}}
                                />
                            </div>
                        </div>
                        {/* 오른쪽: 발주 정보 */}
                        <div className="w-96 space-y-4">
                            <div className="flex items-center">
                                <FiCalendar className="w-6 h-6 text-gray-900 mr-2" />
                                <h3 className="text-base font-medium text-gray-900">발주 정보</h3>
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700">
                                    발주일자 <span className="text-red-500">*</span>
                                </label>
                                <DateInput placeholder="발주일자 선택" value={orderDate} onChange={setOrderDate} />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700">
                                    예상 납품일 <span className="text-red-500">*</span>
                                </label>
                                <DateInput
                                    placeholder="예상 납품일 선택"
                                    value={deliveryDate}
                                    onChange={setDeliveryDate}
                                />
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
                                disabled={isSubmitting || !supplier}
                            >
                                <FiPlus className="w-3.5 h-3.5 mr-1" />
                                항목 추가
                            </button>
                        </div>
                        <div className="border border-gray-200 rounded-md overflow-hidden">
                            <div className="min-w-[952px]">
                                {' '}
                                {/* 기존보다 100px 넓힘 */}
                                {/* Table Header */}
                                <div className="bg-gray-50 h-8">
                                    <div className="h-8 flex">
                                        <div className="w-32 px-3 py-2 flex items-center">
                                            <span className="text-xs font-medium text-gray-500 uppercase">
                                                상품 <span className="text-red-500">*</span>
                                            </span>
                                        </div>
                                        <div className="w-32 px-3 py-2 flex items-center">
                                            <span className="text-xs font-medium text-gray-500 uppercase">
                                                품목 <span className="text-red-500">*</span>
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
                                    {items.map((item, idx) => (
                                        <div key={idx} className="h-14 flex border-t border-gray-200">
                                            {/* 상품 드롭다운 */}
                                            <div className="w-32 px-3 py-3.5 flex items-center">
                                                <SelectInput
                                                    defaultText="상품 선택"
                                                    options={products.map((p: any) => p.name)}
                                                    value={(() => {
                                                        const found = products.find(
                                                            (p: any) => p.product_id === item.product_id
                                                        );
                                                        return found ? found.name : '';
                                                    })()}
                                                    onChange={(name: string) => {
                                                        handleProductChange(idx, name);
                                                    }}
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            {/* 품목 드롭다운 */}
                                            <div className="w-32 px-3 py-3.5 flex items-center">
                                                <SelectInput
                                                    defaultText="품목 선택"
                                                    options={
                                                        item.product_id && variantsByProduct[item.product_id]
                                                            ? variantsByProduct[item.product_id].map(
                                                                  (v: any) => v.option
                                                              )
                                                            : []
                                                    }
                                                    onChange={(option: string) => {
                                                        handleVariantChange(idx, option);
                                                    }}
                                                    value={item.variant ?? ''}
                                                    disabled={isSubmitting || !item.product_id}
                                                />
                                            </div>
                                            <div className="w-32 px-3 py-3.5 flex items-center">
                                                <input
                                                    type="text"
                                                    value={item.spec}
                                                    onChange={(e) => handleItemChange(idx, 'spec', e.target.value)}
                                                    placeholder="규격"
                                                    className="w-full px-2 pt-1.5 pb-1 border border-gray-300 rounded-md text-sm placeholder-gray-400"
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
                                                        handleItemChange(idx, 'quantity', parseInt(e.target.value) || 0)
                                                    }
                                                    className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                                                    min="1"
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            <div className="w-32 px-3 py-3.5 flex items-center">
                                                <input
                                                    type="number"
                                                    value={item.unit_price}
                                                    onChange={(e) =>
                                                        handleItemChange(
                                                            idx,
                                                            'unit_price',
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
                                                    {(item.quantity && item.unit_price
                                                        ? includesTax
                                                            ? item.quantity * item.unit_price
                                                            : Math.round(item.quantity * item.unit_price * 1.1)
                                                        : 0
                                                    ).toLocaleString()}
                                                    원
                                                </div>
                                            </div>
                                            <div className="w-32 px-3 py-3.5 flex items-center">
                                                <input
                                                    type="text"
                                                    value={item.remark}
                                                    onChange={(e) => handleItemChange(idx, 'remark', e.target.value)}
                                                    placeholder="비고"
                                                    className="w-full px-2 pt-1.5 pb-1 border border-gray-300 rounded-md text-sm placeholder-gray-400"
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            <div className="w-14 px-3 py-3 flex items-center justify-center">
                                                <button
                                                    type="button"
                                                    className="text-red-500 hover:text-red-700"
                                                    onClick={() => handleRemoveItem(idx)}
                                                    disabled={isSubmitting}
                                                >
                                                    <FiTrash2 className="w-5 h-5" />
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
