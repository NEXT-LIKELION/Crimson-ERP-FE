import { useEffect, useState } from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import TextInput from '../input/TextInput';
import SelectInput from '../input/SelectInput';
import { FaBoxArchive, FaClipboardList } from 'react-icons/fa6';
import { BsCoin } from 'react-icons/bs';
import { useSuppliers } from '../../hooks/queries/useSuppliers';

interface EditProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any;
    onSave: (product: any) => void;
    onStockAdjustClick: (variant: {
        variant_code: string;
        product_id: string;
        name: string;
        option: string;
        current_stock: number;
        min_stock: number;
    }) => void;
}

interface SupplierForm {
    supplier_name: string;
    cost_price: number;
    is_primary: boolean;
}

interface EditForm {
    product_id: string;
    name: string;
    variant_id?: number | string;
    variant_code?: string;
    option?: string;
    stock: number;
    min_stock?: number;
    price?: number | string;
    cost_price?: number | string;
    description?: string;
    memo?: string;
    suppliers: SupplierForm[];
}

const EditProductModal = ({ isOpen, onClose, product, onSave, onStockAdjustClick }: EditProductModalProps) => {
    const { data: suppliersData, isLoading: isLoadingSuppliers } = useSuppliers();
    const supplierOptions = suppliersData?.data?.map((s: any) => s.name) || [];
    const [form, setForm] = useState<EditForm>({
        ...product,
        suppliers: product.suppliers || [{ supplier_name: '', cost_price: 0, is_primary: false }],
    });
    const [errors, setErrors] = useState<string[]>([]);

    // 숫자 입력에서 음수/지수 입력 차단
    const handleNumberKeyDown = (e: any) => {
        const blockedKeys = ['-', '+', 'e', 'E'];
        if (blockedKeys.includes(e.key)) {
            e.preventDefault();
        }
    };

    const handleRemoveSupplier = (index: number) => {
        setForm((prev: EditForm) => {
            const updatedSuppliers = [...prev.suppliers];
            updatedSuppliers.splice(index, 1);
            return { ...prev, suppliers: updatedSuppliers };
        });
    };

    const handleChange = (field: string, value: string | number) => {
        setForm((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSupplierChange = (index: number, field: keyof SupplierForm, value: any) => {
        const newSuppliers = [...form.suppliers];
        newSuppliers[index] = { ...newSuppliers[index], [field]: value };
        setForm((prev) => ({ ...prev, suppliers: newSuppliers }));
    };

    const handleAddSupplier = () => {
        setForm((prev: EditForm) => ({
            ...prev,
            suppliers: [...prev.suppliers, { supplier_name: '', cost_price: 0, is_primary: false }],
        }));
    };

    const handleSubmit = () => {
        const errs = [];
        if (!form.name?.trim()) errs.push('상품명을 입력해주세요.');
        if (!form.price || isNaN(Number(form.price))) errs.push('판매가는 숫자여야 합니다.');
        // 원가 데이터 유효성 검사 - 빈 값이면 0으로 처리
        const costPrice = form.cost_price === '' || form.cost_price === undefined ? 0 : Number(form.cost_price);
        if (isNaN(costPrice)) {
            errs.push('매입가는 숫자여야 합니다.');
        }
        // 공급업체 필수 안내
        if (errs.length > 0) {
            setErrors(errs);
            return;
        }

        const filteredSuppliers = form.suppliers.filter((s) => s.supplier_name && s.supplier_name !== '선택');

        const updated = {
            variant_code: form.variant_code, // variant 식별을 위해 추가
            product_id: form.product_id,
            name: form.name,
            option: form.option || '기본',
            price: Number(form.price), // 숫자로 변환
            min_stock: Number(form.min_stock) || 0, // 최소재고가 없는 경우 0으로 설정
            description: form.description || '',
            memo: form.memo || '',
            suppliers: filteredSuppliers.map((s) => ({
                name: s.supplier_name, // 백엔드가 기대하는 'name' 필드로 변경
                cost_price: Number(s.cost_price) || 0, // 원가 데이터가 없는 경우 0으로 설정
                is_primary: s.is_primary,
            })),
        };

        onSave(updated);
        onClose();
    };

    useEffect(() => {
        if (isOpen && product) {
            setForm({
                ...product,
                product_id: product.product_id ?? '',
                description: product.description || '',
                memo: product.memo || '',
                min_stock: product.min_stock || 0, // 최소재고가 없는 경우 0으로 설정
                cost_price: product.cost_price || 0, // 원가 데이터가 없는 경우 0으로 설정
                suppliers:
                    product.suppliers && product.suppliers.length > 0
                        ? product.suppliers.map((s: any) => ({
                              supplier_name: s.name,
                              cost_price: s.cost_price || 0,
                              is_primary: s.is_primary,
                          }))
                        : [{ supplier_name: '', cost_price: 0, is_primary: false }],
            });
            setErrors([]);
        }
    }, [isOpen, product]);

    if (!isOpen || !product || isLoadingSuppliers) return null;

    const avgCost =
        form.suppliers.length > 0
            ? Math.round(form.suppliers.reduce((sum, s) => sum + s.cost_price, 0) / form.suppliers.length)
            : 0;

    return (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <div className="w-[900px] max-h-[90vh] bg-white rounded-lg shadow-lg overflow-auto">
                <div className="px-6 py-4 border-b border-gray-300 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold">상품 정보 편집</h2>
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
                                <TextInput label="상품코드" value={form.product_id} disabled />
                                <TextInput label="품목코드" value={form.variant_id?.toString() || ''} disabled />
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
                                    type="number"
                                    value={form.price?.toString() || ''}
                                    onChange={(val) => handleChange('price', Math.max(0, Number(val) || 0))}
                                    onKeyDown={handleNumberKeyDown}
                                    noSpinner
                                />
                                <TextInput label="매입가" value={avgCost?.toLocaleString() || ''} disabled />
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">현재 재고</label>
                                    <div
                                        onClick={() =>
                                            onStockAdjustClick({
                                                variant_code: form.variant_code || form.variant_id?.toString() || '',
                                                product_id: form.product_id,
                                                name: form.name,
                                                option: form.option || '기본',
                                                current_stock: form.stock || 0,
                                                min_stock: form.min_stock || 0,
                                            })
                                        }
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        title="클릭하여 재고 조정"
                                    >
                                        {Math.max(0, Number(form.stock) || 0).toString()}
                                    </div>
                                    <p className="text-xs text-blue-600 mt-1">
                                        💡 재고 칸을 클릭하여 재고를 조정할 수 있습니다.
                                    </p>
                                </div>
                                <TextInput
                                    label="최소 재고"
                                    type="number"
                                    value={Math.max(0, Number(form.min_stock) || 0).toString()}
                                    onChange={(val) => handleChange('min_stock', Math.max(0, Number(val) || 0))}
                                    onKeyDown={handleNumberKeyDown}
                                    noSpinner
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    재고가 이 수준 이하로 떨어지면 경고가 표시됩니다.
                                </p>
                            </div>
                        </section>
                    </div>
                    {/* 설명 추가 */}
                    <section>
                        <div className="mb-2">
                            <label className="text-sm font-medium text-gray-700">설명</label>
                        </div>
                        <textarea
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            rows={3}
                            value={form.description || ''}
                            onChange={(e) => handleChange('description', e.target.value)}
                        />
                    </section>

                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <FaClipboardList className="text-indigo-500" />
                            <h3 className="text-md font-semibold">공급업체 정보</h3>
                        </div>

                        <table className="w-full table-auto border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border px-4 py-2 text-left">공급업체</th>
                                    <th className="border px-4 py-2 text-left">매입가</th>
                                    <th className="border px-4 py-2 text-center">주요 공급자</th>
                                    <th className="border px-4 py-2 text-center">삭제</th>
                                </tr>
                            </thead>
                            <tbody>
                                {form.suppliers.map((s, i) => (
                                    <tr key={i}>
                                        {/* 공급업체 선택 */}
                                        <td className="border px-4 py-2">
                                            <SelectInput
                                                value={s.supplier_name}
                                                options={supplierOptions}
                                                onChange={(val) => handleSupplierChange(i, 'supplier_name', val)}
                                            />
                                        </td>

                                        {/* 매입가 입력 */}
                                        <td className="border px-4 py-2">
                                            <TextInput
                                                type="number"
                                                value={s.cost_price.toString()}
                                                onChange={(val) => handleSupplierChange(i, 'cost_price', Number(val))}
                                            />
                                        </td>

                                        {/* 주요공급자 체크박스 */}
                                        <td className="border px-4 py-2 text-center">
                                            <input
                                                type="checkbox"
                                                checked={s.is_primary}
                                                onChange={(e) =>
                                                    handleSupplierChange(i, 'is_primary', e.target.checked)
                                                }
                                            />
                                        </td>

                                        {/* 행 삭제 버튼 */}
                                        <td className="border px-4 py-2 text-center">
                                            <button
                                                onClick={() => handleRemoveSupplier(i)}
                                                className="text-red-500 hover:underline"
                                            >
                                                삭제
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {/* 새로운 공급자 추가 버튼 */}
                                <tr>
                                    <td colSpan={4} className="px-4 py-2">
                                        <button
                                            onClick={handleAddSupplier}
                                            className="text-indigo-600 hover:underline text-sm"
                                        >
                                            + 공급업체 추가
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div>
                            <label className="text-sm text-gray-600">관리자 메모</label>
                            <textarea
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                rows={3}
                                value={form.memo?.toString() || ''}
                                onChange={(e) => handleChange('memo', e.target.value)}
                            />
                        </div>
                    </section>

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
        </div>
    );
};

export default EditProductModal;
