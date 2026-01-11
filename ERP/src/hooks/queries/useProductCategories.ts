import { useQuery } from '@tanstack/react-query';
import { fetchProductCategories } from '../../api/inventory';

// API 응답 타입 정의
interface ProductCategories {
  big_category?: string;
  middle_category?: string;
  category?: string;
}

interface ProductCategoriesResponse {
  data: ProductCategories;
}

// 상품 카테고리 조회 훅
export const useProductCategories = (product_id: string | null) => {
  return useQuery<ProductCategoriesResponse>({
    queryKey: ['productCategories', product_id],
    queryFn: () => fetchProductCategories(product_id!),
    enabled: !!product_id, // product_id가 있을 때만 요청 수행
    staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지
    gcTime: 1000 * 60 * 10, // 10분 후 unused query는 메모리에서 제거
  });
};
