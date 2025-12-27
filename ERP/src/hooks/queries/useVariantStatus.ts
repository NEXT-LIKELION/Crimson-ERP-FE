import { useQuery } from '@tanstack/react-query';
import { fetchVariantStatus } from '../../api/inventory';
import { ProductVariantStatusResponse } from '../../types/product';

interface UseVariantStatusParams {
  year: number;
  month: number;
  page?: number;
  ordering?: string;
}

export const useVariantStatus = ({ year, month, page = 1, ordering }: UseVariantStatusParams) => {
  return useQuery<ProductVariantStatusResponse>({
    queryKey: ['variantStatus', year, month, page, ordering],
    queryFn: async () => {
      const response = await fetchVariantStatus({ year, month, page, ordering });
      return response.data;
    },
    enabled: !!year && !!month, // year와 month가 있을 때만 쿼리 실행
    staleTime: 1000 * 60 * 5, // 5분
  });
};
