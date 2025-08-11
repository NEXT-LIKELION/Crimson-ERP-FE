import { useEffect, useState } from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import TextInput from '../input/TextInput';
import SelectInput from '../input/SelectInput';
import { FaBoxArchive, FaClipboardList } from 'react-icons/fa6';
import { BsCoin } from 'react-icons/bs';
import {
    fetchProductOptions,
    createProductWithVariant,
    fetchAllInventoriesForMerge,
    checkProductNameExists,
} from '../../api/inventory';
import { useSuppliers } from '../../hooks/queries/useSuppliers';
import { useQuery } from '@tanstack/react-query';

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (product: any) => void;
}

const AddProductModal = ({ isOpen, onClose, onSave }: AddProductModalProps) => {
    const { data: suppliersData } = useSuppliers();
    const supplierOptions = suppliersData?.data?.map((s: any) => s.name) || [];

    // 기존 상품 목록 조회
    const { data: productsData } = useQuery({
        queryKey: ['productOptions'],
        queryFn: fetchProductOptions,
        enabled: isOpen,
    });
    const productOptions =
        productsData?.data?.map((p: any) => ({ value: p.product_id, label: `${p.product_id} - ${p.name}` })) || [];

    // 기존 데이터에서 카테고리 목록 추출
    const { data: allInventoriesData } = useQuery({
        queryKey: ['allInventories'],
        queryFn: fetchAllInventoriesForMerge,
        enabled: isOpen,
    });

    // 동적 카테고리 옵션 생성 + 새 카테고리 추가 옵션
    const existingCategories = allInventoriesData
        ? Array.from(new Set(allInventoriesData.map((item: any) => item.category).filter(Boolean)))
        : ['일반', '한정', '신상품']; // 로딩 중일 때 기본 카테고리
    const categoryOptions = [...existingCategories, '직접 입력'];

    const [isCustomCategory, setIsCustomCategory] = useState(false);

    const [productType, setProductType] = useState<'new' | 'existing'>('new'); // 신상품 vs 기존상품 옵션 추가
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [form, setForm] = useState<any>({
        name: '',
        category: '',
        option: '',
        stock: 0,
        price: 0,
        min_stock: 0,
        description: '',
        memo: '',
        suppliers: [{ supplier_name: '', cost_price: 0, is_primary: true }],
    });
    const [errors, setErrors] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            setProductType('new');
            setSelectedProductId('');
            setIsCustomCategory(false);
            setForm({
                name: '',
                category: '',
                option: '',
                stock: 0,
                price: 0,
                min_stock: 0,
                description: '',
                memo: '',
                suppliers: [{ supplier_name: '', cost_price: 0, is_primary: true }],
            });
            setErrors([]);
        }
    }, [isOpen]);

    const handleChange = (field: string, value: string | number) => {
        setForm((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleCategoryChange = (value: string) => {
        if (value === '직접 입력') {
            setIsCustomCategory(true);
            setForm((prev: any) => ({ ...prev, category: '' }));
        } else {
            setIsCustomCategory(false);
            setForm((prev: any) => ({ ...prev, category: value }));
        }
    };

    const handleSupplierChange = (index: number, field: string, value: any) => {
        const newSuppliers = [...form.suppliers];
        newSuppliers[index] = { ...newSuppliers[index], [field]: value };
        setForm((prev: any) => ({ ...prev, suppliers: newSuppliers }));
    };

    const handleAddSupplier = () => {
        setForm((prev: any) => ({
            ...prev,
            suppliers: [...prev.suppliers, { supplier_name: '', cost_price: 0, is_primary: false }],
        }));
    };

    const handleRemoveSupplier = (index: number) => {
        if (form.suppliers.length > 1) {
            const newSuppliers = [...form.suppliers];
            newSuppliers.splice(index, 1);
            setForm((prev: any) => ({ ...prev, suppliers: newSuppliers }));
        }
    };

    const handleSubmit = async () => {
        const errs = [];

        // 공통 유효성 검사
        if (!form.option?.trim()) errs.push('옵션을 입력해주세요.');
        if (!form.price || isNaN(Number(form.price))) errs.push('판매가는 숫자여야 합니다.');
        if (!form.suppliers || !form.suppliers[0]?.supplier_name) errs.push('공급업체 정보는 필수입니다.');

        // 상품 유형별 유효성 검사
        if (productType === 'new') {
            if (!form.name?.trim()) errs.push('상품명을 입력해주세요.');
            if (!form.category?.trim()) errs.push('카테고리를 선택해주세요.');
        } else {
            if (!selectedProductId) errs.push('기존 상품을 선택해주세요.');
        }
        if (errs.length > 0) {
            setErrors(errs);
            return;
        }

        // 상품명 중복 검사 (신규 상품에 한함)
        if (productType === 'new') {
            const isDup = await checkProductNameExists(form.name);
            if (isDup) {
                alert(`이미 존재하는 상품명입니다: ${form.name}`);
                return;
            }
        }

        // product_id 자동 생성 함수 (P0000XXX 형식)
        const generateProductId = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const randomChar1 = chars.charAt(Math.floor(Math.random() * chars.length));
            const randomChar2 = chars.charAt(Math.floor(Math.random() * chars.length));
            const randomChar3 = chars.charAt(Math.floor(Math.random() * chars.length));
            return `P0000${randomChar1}${randomChar2}${randomChar3}`;
        };

        try {
            let variantPayload: any;

            if (productType === 'new') {
                // 새로운 상품
                variantPayload = {
                    product_id: generateProductId(),
                    name: form.name,
                    category: form.category,
                    option: form.option || '기본',
                    stock: Number(form.stock) || 0,
                    price: Number(form.price),
                    min_stock: Number(form.min_stock) || 0,
                    description: form.description || '',
                    memo: form.memo || '',
                    suppliers: form.suppliers
                        .filter((s: any) => s.supplier_name)
                        .map((s: any) => ({
                            name: s.supplier_name,
                            cost_price: Number(s.cost_price) || 0,
                            is_primary: s.is_primary,
                        })),
                };
            } else {
                // 기존 상품에 옵션 추가
                const selectedProduct = productsData?.data?.find((p: any) => p.product_id === selectedProductId);
                variantPayload = {
                    product_id: selectedProductId,
                    name: selectedProduct?.name || form.name,
                    category: form.category,
                    option: form.option || '기본',
                    stock: Number(form.stock) || 0,
                    price: Number(form.price),
                    min_stock: Number(form.min_stock) || 0,
                    description: form.description || '',
                    memo: form.memo || '',
                    suppliers: form.suppliers
                        .filter((s: any) => s.supplier_name)
                        .map((s: any) => ({
                            name: s.supplier_name,
                            cost_price: Number(s.cost_price) || 0,
                            is_primary: s.is_primary,
                        })),
                };
            }

            const variantRes = await createProductWithVariant(variantPayload);

            const newProduct = {
                ...form,
                variant_id: variantRes.variant_code,
            };

            onSave(newProduct);
            onClose();
        } catch (err: any) {
            console.error('상품 생성 실패:', err);
            setErrors(['상품 생성 중 오류가 발생했습니다.']);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <div className="w-[900px] max-h-[90vh] bg-white rounded-lg shadow-lg overflow-auto">
                <div className="px-6 py-4 border-b border-gray-300 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">상품 추가</h2>
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

                    {/* 상품 유형 선택 */}
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <h3 className="text-sm font-medium text-blue-900 mb-3">상품 유형 선택</h3>
                        <div className="flex space-x-6">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="productType"
                                    value="new"
                                    checked={productType === 'new'}
                                    onChange={(e) => setProductType(e.target.value as 'new' | 'existing')}
                                    className="mr-2 text-blue-600"
                                />
                                <span className="text-sm font-medium text-gray-700">✨ 완전히 새로운 상품</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="productType"
                                    value="existing"
                                    checked={productType === 'existing'}
                                    onChange={(e) => setProductType(e.target.value as 'new' | 'existing')}
                                    className="mr-2 text-blue-600"
                                />
                                <span className="text-sm font-medium text-gray-700">📬 기존 상품에 옵션 추가</span>
                            </label>
                        </div>
                        <p className="text-xs text-blue-600 mt-2">
                            {productType === 'new'
                                ? '새로운 상품코드를 생성합니다.'
                                : '기존 상품에 새로운 옵션(색상, 사이즈 등)을 추가합니다.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-10">
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <FaBoxArchive className="text-indigo-500" />
                                <h3 className="text-md font-semibold">기본 정보</h3>
                            </div>
                            <div className="space-y-4">
                                {productType === 'existing' && (
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">기존 상품 선택</label>
                                        <select
                                            value={selectedProductId}
                                            onChange={(e) => setSelectedProductId(e.target.value)}
                                            className="h-9 w-full rounded-md pl-4 pr-14 py-2 text-sm font-normal bg-zinc-100 text-gray-700 border border-gray-300 focus:outline-none focus:border-indigo-600"
                                        >
                                            <option value="">-- 상품을 선택하세요 --</option>
                                            {productOptions.map(
                                                (p: { value: string; label: string }, index: number) => (
                                                    <option key={index} value={p.value}>
                                                        {p.label}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>
                                )}
                                {productType === 'new' && (
                                    <>
                                        <TextInput
                                            label="상품명"
                                            value={form.name || ''}
                                            onChange={(val) => handleChange('name', val)}
                                        />
                                        <SelectInput
                                            label="카테고리"
                                            value={isCustomCategory ? '직접 입력' : form.category || ''}
                                            options={categoryOptions}
                                            onChange={handleCategoryChange}
                                        />
                                        {isCustomCategory && (
                                            <TextInput
                                                label="새 카테고리명"
                                                value={form.category || ''}
                                                onChange={(val) => handleChange('category', val)}
                                                placeholder="새 카테고리를 입력하세요"
                                            />
                                        )}
                                    </>
                                )}
                                <TextInput
                                    label="옵션"
                                    value={form.option || ''}
                                    onChange={(val) => handleChange('option', val)}
                                    placeholder="예: 색상, 사이즈 등"
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
                                    onChange={(val) => handleChange('price', Number(val) || 0)}
                                />
                                <TextInput
                                    label="초기 재고수량"
                                    type="number"
                                    value={form.stock?.toString() || '0'}
                                    onChange={(val) => handleChange('stock', Number(val) || 0)}
                                />
                                <TextInput
                                    label="최소 재고수량"
                                    type="number"
                                    value={form.min_stock?.toString() || '0'}
                                    onChange={(val) => handleChange('min_stock', Number(val) || 0)}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    재고가 이 수준 이하로 떨어지면 경고가 표시됩니다.
                                </p>
                            </div>
                        </section>
                    </div>

                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <FaClipboardList className="text-indigo-500" />
                            <h3 className="text-md font-semibold">추가 정보</h3>
                        </div>

                        <label className="text-sm text-gray-600">상품 설명</label>
                        <textarea
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            rows={3}
                            value={form.description || ''}
                            onChange={(e) => handleChange('description', e.target.value)}
                        />

                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-medium text-gray-700">공급업체 정보</h4>
                                <button
                                    type="button"
                                    onClick={handleAddSupplier}
                                    className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-md hover:bg-blue-100"
                                >
                                    + 공급업체 추가
                                </button>
                            </div>
                            {form.suppliers.map((supplier: any, index: number) => (
                                <div key={index} className="border border-gray-300 p-4 rounded-md bg-gray-50 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">공급업체 {index + 1}</span>
                                        {form.suppliers.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSupplier(index)}
                                                className="text-red-500 hover:text-red-700 text-sm"
                                            >
                                                삭제
                                            </button>
                                        )}
                                    </div>
                                    <SelectInput
                                        label="공급업체명"
                                        value={supplier.supplier_name || ''}
                                        options={supplierOptions}
                                        onChange={(val) => handleSupplierChange(index, 'supplier_name', val)}
                                    />
                                    <TextInput
                                        label="매입가"
                                        type="number"
                                        value={supplier.cost_price?.toString() || ''}
                                        onChange={(val) => handleSupplierChange(index, 'cost_price', Number(val) || 0)}
                                    />
                                    <label className="inline-flex items-center text-sm text-gray-600">
                                        <input
                                            type="checkbox"
                                            className="mr-2"
                                            checked={supplier.is_primary}
                                            onChange={(e) =>
                                                handleSupplierChange(index, 'is_primary', e.target.checked)
                                            }
                                        />
                                        주요 공급업체
                                    </label>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">관리자 메모</label>
                            <textarea
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={3}
                                value={form.memo || ''}
                                onChange={(e) => handleChange('memo', e.target.value)}
                                placeholder="상품에 대한 추가 메모를 입력하세요"
                            />
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
