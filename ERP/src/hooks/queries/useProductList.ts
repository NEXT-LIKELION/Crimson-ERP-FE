import { useQuery } from '@tanstack/react-query';
import { fetchProductList } from '../../api/inventory';

// API 응답 타입 정의
interface ProductListItem {
  product_id: string;
  name: string;
  online_name?: string;
}

interface ProductListResponse {
  data: ProductListItem[];
}

// 상품 목록 조회 훅
export const useProductList = (enabled: boolean = true) => {
  return useQuery<ProductListResponse>({
    queryKey: ['productList'],
    queryFn: fetchProductList,
    enabled,
    staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지
    gcTime: 1000 * 60 * 10, // 10분 후 unused query는 메모리에서 제거
  });
};
