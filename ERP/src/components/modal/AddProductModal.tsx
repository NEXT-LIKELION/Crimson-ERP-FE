import { useEffect, useState } from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import TextInput from '../input/TextInput';
import SelectInput from '../input/SelectInput';
import { FaBoxArchive, FaClipboardList, FaFileCircleCheck } from 'react-icons/fa6';
import { BsCoin } from 'react-icons/bs';
import { createInventoryItem } from '../../api/inventory';

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (product: any) => void;
}

const AddProductModal = ({ isOpen, onClose, onSave }: AddProductModalProps) => {
    const [form, setForm] = useState<any>({});
    const [adjustQty, setAdjustQty] = useState(0);
    const [adjustType, setAdjustType] = useState('입고 (증가)');
    const [adjustReason, setAdjustReason] = useState('신규 입고');
    const [errors, setErrors] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            setForm({});
            setAdjustQty(0);
            setAdjustType('입고 (증가)');
            setAdjustReason('신규 입고');
            setErrors([]);
        }
    }, [isOpen]);

    const handleChange = (field: string, value: string | number) => {
        setForm((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        const errs = [];
        if (!form.name?.trim()) errs.push('상품명을 입력해주세요.');
        if (!form.product_id?.trim()) errs.push('상품코드를 입력해주세요.');
        if (!form.price || isNaN(Number(form.price))) errs.push('판매가는 숫자여야 합니다.');
        if (!form.cost_price || isNaN(Number(form.cost_price))) errs.push('매입가는 숫자여야 합니다.');
        if (errs.length > 0) {
            setErrors(errs);
            return;
        }

        const adjustedStock = adjustType.includes('입고')
            ? adjustQty
            : adjustType.includes('출고')
            ? Math.max(0, 0 - adjustQty)
            : adjustQty;

        // 상품 정보 생성 - 단일 API 호출로 변경
        const itemPayload = {
            product_id: form.product_id,
            name: form.name,
            option: form.option || '기본 옵션',
            price: Number(form.price),
            stock: adjustedStock,
            min_stock: 20, // 기본값 설정
        };

        try {
            const itemRes = await createInventoryItem(itemPayload);
            const newProduct = {
                ...form,
                id: itemRes.id,
                stock: adjustedStock,
            };

            onSave(newProduct);
            onClose();
        } catch (err: any) {
            console.error('상품 등록 실패:', err);
            const errorMessage = err.response?.data?.message || err.message || '상품 등록 중 오류가 발생했습니다.';
            setErrors([errorMessage]);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <div className="w-[900px] max-h-[90vh] bg-white rounded-lg shadow-lg overflow-auto">
                <div className="px-6 py-4 border-b border-gray-300 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold">상품 추가</h2>
                    </div>
                    <button onClick={onClose}>
                        <FiX className="w-6 h-6 text-gray-500 hover:text-gray-700" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {errors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <div className="flex items-start">
                                <FiAlertTriangle className="text-red-600 mr-2 mt-1" />
                                <ul className="text-sm text-red-700 list-disc list-inside">
                                    {errors.map((err, i) => (
                                        <li key={i}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-10">
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <FaBoxArchive className="text-indigo-500" />
                                <h3 className="text-md font-semibold">기본 정보</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <TextInput
                                        label="상품코드"
                                        value={form.product_id || ''}
                                        onChange={(val) => handleChange('product_id', val)}
                                    />
                                </div>
                                <TextInput
                                    label="품목코드"
                                    value={form.item_code || ''}
                                    onChange={(val) => handleChange('item_code', val)}
                                />
                                <TextInput
                                    label="상품명"
                                    value={form.name || ''}
                                    onChange={(val) => handleChange('name', val)}
                                />
                                <TextInput
                                    label="옵션"
                                    value={form.option || ''}
                                    onChange={(val) => handleChange('option', val)}
                                />
                                <TextInput
                                    label="카테고리"
                                    value={form.category || ''}
                                    onChange={(val) => handleChange('category', val)}
                                />
                            </div>
                        </section>

                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <BsCoin className="text-indigo-500" />
                                <h3 className="text-md font-semibold">판매 정보</h3>
                            </div>
                            <div className="space-y-4">
                                <TextInput
                                    label="판매가"
                                    value={form.price || ''}
                                    onChange={(val) => handleChange('price', val)}
                                />
                                <TextInput
                                    label="매입가"
                                    value={form.cost_price || ''}
                                    onChange={(val) => handleChange('cost_price', val)}
                                />
                                <TextInput
                                    label="현재 재고"
                                    type="number"
                                    value={form.stock?.toString() || '0'}
                                    onChange={(val) => handleChange('stock', Number(val))}
                                />

                                <div>
                                    <TextInput
                                        label="최소 재고"
                                        value={form.min_stock || ''}
                                        onChange={(val) => handleChange('min_stock', val)}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        재고가 이 수준 이하로 떨어지면 경고가 표시됩니다.
                                    </p>
                                </div>
                                <TextInput
                                    label="상품 상태"
                                    value={form.status || '판매중'}
                                    onChange={(val) => handleChange('status', val)}
                                />
                            </div>
                        </section>
                    </div>

                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <FaClipboardList className="text-indigo-500" />
                            <h3 className="text-md font-semibold">추가 정보</h3>
                        </div>
                        <div className="space-y-4">
                            <label className="text-sm text-gray-600">상품 설명</label>
                            <textarea
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                rows={3}
                                value={form.description || ''}
                                onChange={(e) => handleChange('description', e.target.value)}
                            />
                            <TextInput
                                label="공급업체 정보"
                                value={form.supplier || ''}
                                onChange={(val) => handleChange('supplier', val)}
                            />
                            <div>
                                <label className="text-sm text-gray-600">관리자 메모</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                    rows={3}
                                    value={form.memo || ''}
                                    onChange={(e) => handleChange('memo', e.target.value)}
                                />
                            </div>
                        </div>
                    </section>

                    <section className="border border-gray-300 rounded-md p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <FaFileCircleCheck className="text-indigo-500" />
                            <h3 className="text-md font-semibold">재고 조정</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm text-gray-600">조정 유형</label>
                                <SelectInput
                                    options={['입고 (증가)', '출고 (감소)', '직접 설정']}
                                    value={adjustType}
                                    onChange={(val) => setAdjustType(val)}
                                />
                            </div>
                            <TextInput
                                label="수량"
                                type="number"
                                value={adjustQty.toString()}
                                onChange={(val) => setAdjustQty(Number(val))}
                            />
                            <div>
                                <label className="text-sm text-gray-600">사유</label>
                                <SelectInput
                                    options={['신규 입고', '반품', '파손/손실', '재고 수정', '기타']}
                                    value={adjustReason}
                                    onChange={setAdjustReason}
                                />
                            </div>
                        </div>
                    </section>
                </div>

                <div className="px-6 py-4 border-t border-gray-300 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-700 border rounded-md">
                        취소
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                        저장하기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddProductModal;
