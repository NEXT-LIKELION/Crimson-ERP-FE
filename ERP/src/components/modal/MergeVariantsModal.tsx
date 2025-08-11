import React, { useState, useEffect } from 'react';
import { Product } from '../../types/product';
import PrimaryButton from '../button/PrimaryButton';
import SecondaryButton from '../button/SecondaryButton';
import { FaExclamationTriangle } from 'react-icons/fa';
import { precheckMergeConflicts } from '@/utils/mergePrecheck';

interface MergeVariantsModalProps {
    isOpen: boolean;
    onClose: () => void;
    variants: Product[];
    onMerge: (targetCode: string, sourceCodes: string[]) => Promise<void>;
}

const MergeVariantsModal: React.FC<MergeVariantsModalProps> = ({ isOpen, onClose, variants, onMerge }) => {
    const [targetVariant, setTargetVariant] = useState<string>('');
    const [sourceVariants, setSourceVariants] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [precheckDuplicates, setPrecheckDuplicates] = useState<Array<{ id: number; name: string }> | null>(null);

    // 모달이 열릴 때마다 초기화
    useEffect(() => {
        if (isOpen) {
            setTargetVariant('');
            setSourceVariants([]);
        }
    }, [isOpen]);

    const handleSourceToggle = (variantCode: string) => {
        setSourceVariants((prev) =>
            prev.includes(variantCode) ? prev.filter((code) => code !== variantCode) : [...prev, variantCode]
        );
    };

    const handleMerge = async () => {
        if (!targetVariant || sourceVariants.length === 0) {
            alert('Target 상품과 최소 1개의 Source 상품을 선택해주세요.');
            return;
        }

        if (sourceVariants.includes(targetVariant)) {
            alert('Target 상품은 Source 목록에 포함될 수 없습니다.');
            return;
        }

        setIsLoading(true);
        try {
            // 1) 사전 중복 검사
            const { duplicates } = await precheckMergeConflicts(targetVariant, sourceVariants);
            if (duplicates.length > 0) {
                setPrecheckDuplicates(duplicates);
                alert(
                    `병합 불가: 타깃에 이미 연결된 공급업체가 있습니다.\n\n중복: ${duplicates
                        .map((d) => d.name)
                        .join(', ')}`
                );
                return;
            }

            // 2) 사용자 최종 확인
            const confirmMessage = `다음 병합을 진행하시겠습니까?\n\nTarget: ${targetVariant}\nSources: ${sourceVariants.join(
                ', '
            )}\n\n⚠️ Source 상품들은 영구 삭제됩니다.`;
            if (!window.confirm(confirmMessage)) {
                return;
            }

            await onMerge(targetVariant, sourceVariants);
            alert('상품 병합이 완료되었습니다.');
            onClose();
        } catch (error) {
            console.error('병합 실패:', error);
            alert('병합 중 오류가 발생했습니다. 공급업체 중복 여부를 확인해주세요.');
        } finally {
            setIsLoading(false);
        }
    };

    const availableForTarget = variants.filter((v) => !sourceVariants.includes(v.variant_code || ''));
    const availableForSource = variants.filter((v) => v.variant_code !== targetVariant);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">상품 코드 병합</h2>

                {/* Target 선택 */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        1. 최종 남길 상품 선택 (Target)
                    </label>
                    <select
                        value={targetVariant}
                        onChange={(e) => setTargetVariant(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">-- Target 상품을 선택하세요 --</option>
                        {availableForTarget.map((variant) => (
                            <option key={variant.variant_code} value={variant.variant_code}>
                                {variant.variant_code} - {variant.name} ({variant.option})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Source 선택 */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        2. 병합할 상품들 선택 (Sources)
                    </label>
                    <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                        {availableForSource.length === 0 ? (
                            <p className="text-gray-500 text-sm">선택 가능한 상품이 없습니다.</p>
                        ) : (
                            availableForSource.map((variant) => (
                                <label key={variant.variant_code} className="flex items-center mb-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={sourceVariants.includes(variant.variant_code || '')}
                                        onChange={() => handleSourceToggle(variant.variant_code || '')}
                                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="text-sm">
                                        {variant.variant_code} - {variant.name} ({variant.option})
                                    </span>
                                </label>
                            ))
                        )}
                    </div>
                </div>

                {/* 주의사항 */}
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-start">
                        <FaExclamationTriangle className="text-yellow-600 mt-1 mr-2 flex-shrink-0" />
                        <div className="text-sm text-yellow-800">
                            <p className="font-semibold mb-1">⚠️ 주의사항:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>병합된 상품들(Sources)은 영구 삭제됩니다</li>
                                <li>재고량과 주문이력이 Target 상품으로 통합됩니다</li>
                                <li>이 작업은 되돌릴 수 없습니다</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* 프리체크 결과 안내 */}
                {precheckDuplicates && precheckDuplicates.length > 0 && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                        타깃 품목에 이미 연결된 공급업체가 있어 병합할 수 없습니다:{' '}
                        {precheckDuplicates.map((d) => d.name).join(', ')}
                    </div>
                )}

                {/* 버튼 */}
                <div className="flex justify-end space-x-3">
                    <SecondaryButton text="취소" onClick={onClose} disabled={isLoading} />
                    <PrimaryButton
                        text={isLoading ? '병합 중...' : '병합 실행'}
                        onClick={handleMerge}
                        disabled={isLoading || !targetVariant || sourceVariants.length === 0}
                    />
                </div>
            </div>
        </div>
    );
};

export default MergeVariantsModal;
