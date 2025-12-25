import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adjustStock, fetchStockAdjustments } from '../../api/inventory';

// 재고 조정 훅
export const useAdjustStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      variantCode,
      data,
    }: {
      variantCode: string;
      data: {
        delta: number;
        reason: string;
        created_by: string;
        year?: number;
        month?: number;
      };
    }) => adjustStock(variantCode, data),
    onSuccess: () => {
      // 재고 조정 후 관련 데이터 다시 로드
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
      queryClient.invalidateQueries({ queryKey: ['stockHistory'] });
      queryClient.invalidateQueries({ queryKey: ['variantStatus'] });
      queryClient.invalidateQueries({ queryKey: ['variantDetail'] });
    },
    onError: (error) => {
      console.error('재고 조정 실패:', error);
    },
  });
};

// 재고 변경 이력 조회 훅
export const useStockHistory = (params?: {
  page?: number;
  variant_code?: string;
  year?: number;
  month?: number;
}) => {
  return useQuery({
    queryKey: ['stockHistory', params],
    queryFn: () => fetchStockAdjustments(params),
    select: (response) => response.data,
    staleTime: 1000 * 60 * 5, // 5분간 데이터 신선도 유지
  });
};
