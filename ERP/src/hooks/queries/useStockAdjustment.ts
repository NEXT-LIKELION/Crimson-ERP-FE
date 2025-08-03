import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adjustStock, fetchStockAdjustments } from '../../api/inventory';

// 재고 조정 훅
export const useAdjustStock = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ variantCode, data }: {
            variantCode: string;
            data: {
                actual_stock: number;
                reason: string;
                updated_by: string;
            };
        }) => adjustStock(variantCode, data),
        onSuccess: () => {
            // 재고 조정 후 관련 데이터 다시 로드
            queryClient.invalidateQueries({ queryKey: ['inventories'] });
            queryClient.invalidateQueries({ queryKey: ['stockHistory'] });
        },
        onError: (error) => {
            console.error('재고 조정 실패:', error);
        }
    });
};

// 재고 변경 이력 조회 훅
export const useStockHistory = (params?: {
    page?: number;
    variant_code?: string;
}) => {
    return useQuery({
        queryKey: ['stockHistory', params],
        queryFn: () => fetchStockAdjustments(params),
        select: (response) => response.data,
        staleTime: 1000 * 60 * 5, // 5분간 데이터 신선도 유지
    });
};