import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchInventories } from '../../api/inventory';
import { Product } from '../../types/product';
import { useEffect, useMemo } from 'react';

// type PaginatedResponse = {
//     count: number;
//     next: string | null;
//     previous: string | null;
//     results: Product[];
// };

export const useInventories = (filters?: {
  name?: string;
  category?: string;
  status?: string; // 프론트엔드 전용 필터 (점진적으로 서버로 이동 예정)
  min_stock?: number;
  max_stock?: number;
  min_sales?: number;
  max_sales?: number;
}) => {
  // API 파라미터명 변환
  const apiFilters: Record<string, unknown> = filters ? { ...filters } : {};
  
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

  // useInfiniteQuery로 효율적인 페이지네이션 구현
  const query = useInfiniteQuery({
    queryKey: ['inventories', apiFilters, frontendStatus],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetchInventories({ 
        ...apiFilters, 
        page: pageParam,
        page_size: 20 // 페이지당 20개로 증가 (성능과 UX 균형)
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      // 다음 페이지가 있으면 현재 페이지 + 1, 없으면 undefined
      return lastPage.next ? 
        new URL(lastPage.next).searchParams.get('page') ? 
          parseInt(new URL(lastPage.next).searchParams.get('page')!) : undefined
        : undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5, // 5분간 캐시 유지로 성능 개선
    gcTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    if (query.isError) {
      console.error('❌ 재고 목록 불러오기 실패:', query.error);
    }
  }, [query.isSuccess, query.isError, query.data, query.error]);

  // useInfiniteQuery 데이터 처리 - 모든 페이지의 데이터를 하나로 합침
  const allData = useMemo(() => {
    if (!query.data?.pages) return [];
    return query.data.pages.flatMap(page => page.results || []);
  }, [query.data?.pages]);

  // 프론트엔드 상태 필터링 적용 (점진적으로 서버로 이동 예정)
  const filteredData = useMemo(() => {
    return allData.filter((item: Product) => {
      // 상태 필터 확인 (나머지 필터는 이미 서버에서 처리됨)
      if (frontendStatus && frontendStatus !== '모든 상태') {
        const stock = item.stock;
        const minStock = item.min_stock || 0;

        let status = '정상';
        if (stock === 0) {
          status = '품절';
        } else if ((stock ?? 0) < minStock) {
          status = '재고부족';
        }

        if (status !== frontendStatus) {
          return false;
        }
      }
      return true;
    });
  }, [allData, frontendStatus]);

  // 전체 개수 계산 (첫 페이지에서 가져온 count 사용)
  const totalCount = query.data?.pages?.[0]?.count ?? 0;

  return {
    // 기본 쿼리 정보
    ...query,
    // 무한 스크롤용 데이터와 함수들
    data: filteredData,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    // 호환성을 위한 기존 구조 유지
    pagination: {
      count: totalCount,
      next: query.hasNextPage ? 'has-more' : null,
      previous: null,
    },
    // 새로운 무한 스크롤 관련 정보
    infiniteScroll: {
      totalLoaded: allData.length,
      totalFiltered: filteredData.length,
      totalCount: totalCount,
      hasNextPage: query.hasNextPage,
      isLoadingMore: query.isFetchingNextPage,
    },
    // 편의 함수
    refetch: () => query.refetch(),
  };
};
