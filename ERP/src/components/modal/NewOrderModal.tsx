// src/components/modal/NewOrderModal.tsx
import React, { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2, FiShoppingBag, FiCalendar, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import DateInput from '../input/DateInput';
import SelectInput from '../input/SelectInput';
import RadioButton from '../common/RadioButton';
import { useOrdersStore, Order } from '../../store/ordersStore';
import { useAuthStore } from '../../store/authStore';
import { fetchSuppliers } from '../../api/supplier';
import { fetchSupplierById } from '../../api/supplier';
import { fetchInventories, fetchVariantsByProductId } from '../../api/inventory';
import { createOrder } from '../../api/orders';

interface NewOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (newOrder: Order) => void;
}

interface OrderItemPayload {
    variant: number | null;
    quantity: number;
    unit_price: number;
    remark: string;
    spec: string;
}

const NewOrderModal: React.FC<NewOrderModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [supplier, setSupplier] = useState<number | null>(null);
    const [orderDate, setOrderDate] = useState<Date | null>(new Date());
    const [deliveryDate, setDeliveryDate] = useState<Date | null>(null);
    const [items, setItems] = useState<OrderItemPayload[]>([
        {
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
    const [itemVariants, setItemVariants] = useState<{ [key: number]: any[] }>({});
    const [supplierVariants, setSupplierVariants] = useState<any[]>([]);
    const [supplierProducts, setSupplierProducts] = useState<{ product_id: string; name: string }[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
    const [productVariants, setProductVariants] = useState<any[]>([]);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);

    const { addOrder } = useOrdersStore();
    const user = useAuthStore((state) => state.user);

    useEffect(() => {
        if (isOpen) {
            fetchSuppliers().then((res) => setSuppliers(res.data));
            fetchInventories().then((res) => setProducts(res.data));
            fetchInventories().then((res) => setAllProducts(res.data));
            resetForm();
        }
    }, [isOpen]);

    const resetForm = () => {
        setSupplier(null);
        setOrderDate(new Date());
        const twoWeeksLater = new Date();
        twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
        setDeliveryDate(twoWeeksLater);
        setItems([
            {
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
        const newId = items.length > 0 ? Math.max(...items.map((item) => item.id)) + 1 : 1;
        const newItem: OrderItemPayload = {
            id: newId,
            variant: null,
            quantity: 0,
            unit_price: 0,
            amount: 0,
            remark: '',
            spec: '',
        };
        setItems([...items, newItem]);
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
        return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    };

    const formatDate = (date: Date | null): string => {
        if (!date) return '';
        return date.toISOString();
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

    const handleSupplierChange = (name: string) => {
        console.log('선택된 공급업체:', name);
        setSelectedSupplier(name);
        const found = suppliers.find((s) => s.name === name);
        setSupplier(found ? found.id : null);
        setSelectedProduct(null);
        setProductVariants([]);
        setItems([{ variant: null, quantity: 1, unit_price: 0, remark: '', spec: '' }]);
        const filteredProducts = allProducts.filter((product) =>
            product.variants.some((variant) => variant.suppliers.some((s: any) => s.name === name))
        );
        setSupplierProducts(filteredProducts.map((p: any) => ({ product_id: p.product_id, name: p.name })));
    };

    const handleProductChange = (name: string) => {
        console.log('선택된 상품:', name);
        setSelectedProduct(name);
        setItems([{ variant: null, quantity: 1, unit_price: 0, remark: '', spec: '' }]);
        const product = allProducts.find((p) => p.name === name);
        if (!product) {
            setProductVariants([]);
            return;
        }
        console.log('해당 상품의 variants:', product.variants);
        const filteredVariants = product.variants.filter((variant: any) =>
            variant.suppliers.some((s: any) => s.name === selectedSupplier)
        );
        setProductVariants(filteredVariants);
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
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
                items: items.map((item) => ({
                    variant: item.variant,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    remark: item.remark,
                    spec: item.spec,
                })),
            };
            await createOrder(payload);
            alert('발주가 성공적으로 신청되었습니다.');
            if (onSuccess) onSuccess(payload);
            onClose();
        } catch (error) {
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
                                <SelectInput
                                    defaultText="공급업체 선택"
                                    options={suppliers.map((s) => s.name)}
                                    onChange={handleSupplierChange}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700">
                                    상품 선택 <span className="text-red-500">*</span>
                                </label>
                                <SelectInput
                                    defaultText="상품 선택"
                                    options={supplierProducts.map((p) => p.name)}
                                    onChange={handleProductChange}
                                    disabled={!selectedSupplier}
                                />
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
                                    {items.map((item, idx) => (
                                        <div key={idx} className="h-14 flex border-t border-gray-200">
                                            <div className="w-32 px-3 py-3.5 flex items-center">
                                                <SelectInput
                                                    defaultText="품목명(Variant) 선택"
                                                    options={productVariants.map((v) => v.option)}
                                                    onChange={(option) => {
                                                        let foundId = null;
                                                        for (const product of allProducts) {
                                                            const found = product.variants.find(
                                                                (v) => v.option === String(option)
                                                            );
                                                            if (found) {
                                                                foundId = found.id;
                                                                break;
                                                            }
                                                        }
                                                        console.log('선택된 옵션:', option, '→ id:', foundId);
                                                        handleItemChange(idx, 'variant', foundId);
                                                    }}
                                                    value={
                                                        item.variant
                                                            ? (() => {
                                                                  for (const product of allProducts) {
                                                                      const found = product.variants.find(
                                                                          (v) => v.id === item.variant
                                                                      );
                                                                      if (found) return found.option;
                                                                  }
                                                                  return '';
                                                              })()
                                                            : ''
                                                    }
                                                    disabled={!selectedProduct}
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
                                                        ? item.quantity * item.unit_price
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
