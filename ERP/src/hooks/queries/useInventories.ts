import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchInventories } from '../../api/inventory';
import { components } from '../../types/api';

// API 응답 타입 (api.d.ts의 ProductVariant 사용)
export type ApiProductVariant = components['schemas']['ProductVariant'];

// useInventories 훅의 반환 타입 정의
export interface UseInventoriesReturn {
  data: ApiProductVariant[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  pagination: {
    count: number;
    next: string | null;
    previous: string | null;
  };
}

export const useInventories = (
  filters?: {
    name?: string;
    category?: string;
    status?: string; // 프론트엔드 전용 필터 (점진적으로 서버로 이동 예정)
    min_stock?: number;
    max_stock?: number;
    min_sales?: number;
    max_sales?: number;
  },
  page: number = 1,
  pageSize: number = 10
): UseInventoriesReturn => {
  // API 파라미터명 변환
  const apiFilters: Record<string, unknown> = filters ? { ...filters } : {};

  // name을 product_name으로 변환
  if (filters?.name !== undefined) {
    apiFilters.product_name = filters.name;
    delete apiFilters.name;
  }

  if (filters?.min_stock !== undefined) {
    apiFilters.stock_gt = filters.min_stock - 1; // min_stock 5 -> stock_gt 4 (4초과)
    delete apiFilters.min_stock;
  }
  if (filters?.max_stock !== undefined) {
    apiFilters.stock_lt = filters.max_stock + 1; // max_stock 100 -> stock_lt 101 (101미만)
    delete apiFilters.max_stock;
  }
  if (filters?.min_sales !== undefined) {
    apiFilters.sales_min = filters.min_sales;
    delete apiFilters.min_sales;
  }
  if (filters?.max_sales !== undefined) {
    apiFilters.sales_max = filters.max_sales;
    delete apiFilters.max_sales;
  }

  // 프론트엔드 전용 필터는 API에서 제외
  const frontendStatus = filters?.status;
  delete apiFilters.status;

  // useQuery로 페이지네이션 지원
  const query = useQuery({
    queryKey: ['inventories', apiFilters, frontendStatus, page, pageSize],
    queryFn: async () => {
      const finalParams = {
        ...apiFilters,
        page,
        page_size: pageSize,
      };
      const response = await fetchInventories(finalParams);
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    enabled: true,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // 데이터 처리
  const data = useMemo(() => {
    if (!query.data?.results) return [];
    
    // 프론트엔드 상태 필터링 적용 (점진적으로 서버로 이동 예정)
    return query.data.results.filter((item: ApiProductVariant) => {
      // 상태 필터 확인 (나머지 필터는 이미 서버에서 처리됨)
      if (frontendStatus && frontendStatus !== '모든 상태') {
        const stock = item.stock;
        const minStock = item.min_stock || 0;

        let status = '정상';
        if (Number(stock) === 0) {
          status = '품절';
        } else if ((Number(stock) || 0) < minStock) {
          status = '재고부족';
        }

        if (status !== frontendStatus) {
          return false;
        }
      }
      return true;
    });
  }, [query.data?.results, frontendStatus]);

  return {
    // 기본 쿼리 정보
    data,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    // 페이지네이션 정보
    pagination: {
      count: query.data?.count ?? 0,
      next: query.data?.next ?? null,
      previous: query.data?.previous ?? null,
    },
    // 편의 함수
    refetch: () => query.refetch(),
  };
};
