import React, { useState, useEffect } from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import { FaBoxes } from 'react-icons/fa';
import TextInput from '../input/TextInput';
import PrimaryButton from '../button/PrimaryButton';
import SecondaryButton from '../button/SecondaryButton';
import { useAuthStore } from '../../store/authStore';

interface StockAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    variant: {
        variant_code: string;
        product_id: string;
        name: string;
        option: string;
        current_stock: number;
        min_stock: number;
    } | null;
    onSuccess: () => void;
    onAdjust: (
        variantCode: string,
        data: {
            actual_stock: number;
            reason: string;
            updated_by: string;
        }
    ) => Promise<void>;
}

const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
    isOpen,
    onClose,
    variant,
    onSuccess,
    onAdjust,
}) => {
    const user = useAuthStore((state) => state.user);
    const [actualStock, setActualStock] = useState<string>('');
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    // 모달이 열릴 때마다 초기화
    useEffect(() => {
        if (isOpen && variant) {
            setActualStock(variant.current_stock.toString());
            setReason('');
            setErrors([]);
        }
    }, [isOpen, variant]);

    // 숫자 입력에서 음수/지수 입력 차단
    const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const blockedKeys = ['-', '+', 'e', 'E'];
        if (blockedKeys.includes(e.key)) {
            e.preventDefault();
        }
    };

    const handleSubmit = async () => {
        if (!variant) return;

        const errs = [];
        const actualStockNum = Math.max(0, parseInt(actualStock));

        if (!actualStock.trim() || isNaN(actualStockNum)) {
            errs.push('실제 재고수량을 올바르게 입력해주세요.');
        }
        // 음수 입력은 0으로 자동 보정
        if (!reason.trim()) {
            errs.push('조정 사유를 입력해주세요.');
        }

        if (errs.length > 0) {
            setErrors(errs);
            return;
        }

        const delta = actualStockNum - variant.current_stock;

        if (delta === 0) {
            alert('현재 재고와 동일한 수량입니다. 조정이 필요하지 않습니다.');
            return;
        }

        const confirmMessage = `재고를 조정하시겠습니까?\n\n현재 재고: ${
            variant.current_stock
        }EA\n실제 재고: ${actualStockNum}EA\n변경량: ${delta > 0 ? '+' : ''}${delta}EA\n\n사유: ${reason}`;

        if (!window.confirm(confirmMessage)) {
            return;
        }

        setIsLoading(true);
        try {
            await onAdjust(variant.variant_code, {
                actual_stock: actualStockNum,
                reason: reason.trim(),
                updated_by: user?.username || 'unknown',
            });

            alert('재고 조정이 완료되었습니다.');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('재고 조정 실패:', error);
            setErrors([error?.response?.data?.error || '재고 조정 중 오류가 발생했습니다.']);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !variant) return null;

    const delta = parseInt(actualStock) - variant.current_stock;

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
                <div className="px-6 py-4 border-b border-gray-300 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <FaBoxes className="text-blue-500" />
                        <h2 className="text-lg font-semibold">재고 조정</h2>
                    </div>
                    <button onClick={onClose} disabled={isLoading}>
                        <FiX className="w-6 h-6 text-gray-500 hover:text-gray-700" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
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

                    {/* 상품 정보 */}
                    <div className="bg-gray-50 rounded-md p-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">상품 정보</h3>
                        <div className="space-y-1 text-sm text-gray-600">
                            <p>
                                <span className="font-medium">상품코드:</span> {variant.product_id}
                            </p>
                            <p>
                                <span className="font-medium">품목코드:</span> {variant.variant_code}
                            </p>
                            <p>
                                <span className="font-medium">상품명:</span> {variant.name}
                            </p>
                            <p>
                                <span className="font-medium">옵션:</span> {variant.option}
                            </p>
                        </div>
                    </div>

                    {/* 재고 정보 */}
                    <div className="bg-blue-50 rounded-md p-4">
                        <h3 className="text-sm font-medium text-blue-900 mb-3">재고 현황</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-blue-700 font-medium">현재 재고</span>
                                <p className="text-xl font-bold text-blue-900">{variant.current_stock}EA</p>
                            </div>
                            <div>
                                <span className="text-blue-700 font-medium">최소 재고</span>
                                <p className="text-lg font-semibold text-blue-800">{variant.min_stock}EA</p>
                            </div>
                        </div>
                    </div>

                    {/* 조정 입력 */}
                    <div className="space-y-4">
                        <TextInput
                            label="실제 재고수량"
                            type="number"
                            value={actualStock}
                            onChange={(val) => {
                                // 빈 값은 허용, 음수는 무시
                                if (val === '') {
                                    setActualStock('');
                                    return;
                                }
                                const n = Number(val);
                                if (!Number.isNaN(n) && n >= 0) {
                                    setActualStock(val);
                                }
                            }}
                            onKeyDown={handleNumberKeyDown}
                            noSpinner
                            placeholder="실제 확인한 재고수량을 입력하세요"
                        />

                        {actualStock && !isNaN(parseInt(actualStock)) && (
                            <div
                                className={`p-3 rounded-md ${
                                    delta > 0 ? 'bg-green-50' : delta < 0 ? 'bg-red-50' : 'bg-gray-50'
                                }`}
                            >
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">변경량:</span>
                                    <span
                                        className={`font-bold ${
                                            delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-gray-600'
                                        }`}
                                    >
                                        {delta > 0 ? '+' : ''}
                                        {delta}EA
                                        {delta > 0 ? ' (증가)' : delta < 0 ? ' (감소)' : ' (변경없음)'}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                조정 사유 <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="예: 2025년 1분기 실사, 파손/불량, 도난/분실 등"
                                rows={3}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-300 flex justify-end gap-3">
                    <SecondaryButton text="취소" onClick={onClose} disabled={isLoading} />
                    <PrimaryButton
                        text={isLoading ? '조정 중...' : '재고 조정'}
                        onClick={handleSubmit}
                        disabled={isLoading}
                    />
                </div>
            </div>
        </div>
    );
};

export default StockAdjustmentModal;