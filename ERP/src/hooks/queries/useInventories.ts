import { useInfiniteQuery, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchInventories } from '../../api/inventory';
import { ProductVariant } from '../../types/product';

// 로컬 ProductVariant 타입 기반 (실제 응답 구조)
export type ApiProductVariant = ProductVariant & {
  // 백엔드 응답에 name 필드가 포함되는 경우를 위한 확장
  name?: string;
  offline_name?: string;
  online_name?: string;
  // 백엔드에서 추가로 내려주는 필드들 (스키마에는 없지만 실제 응답에 포함될 수 있음)
  product_id?: string;
  category?: string;
  cost_price?: number;
  order_count?: number;
  return_count?: number;
  sales?: number | string;
  suppliers?: string;
};

// API 응답 타입 정의
interface InventoryPageData {
  results: ApiProductVariant[];
  count: number;
  next: string | null;
  previous: string | null;
}

// useInventories 훅의 반환 타입 정의
export interface UseInventoriesReturn {
  data: ApiProductVariant[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  fetchNextPage: () => Promise<void>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  infiniteScroll: {
    totalLoaded: number;
    totalFiltered: number;
    totalCount: number;
    hasNextPage: boolean;
    isLoadingMore: boolean;
  };
  pagination: {
    count: number;
    next: string | null;
    previous: string | null;
  };
}

export const useInventories = (filters?: {
  name?: string;
  category?: string;
  status?: string; // 프론트엔드 전용 필터 (점진적으로 서버로 이동 예정)
  min_stock?: number;
  max_stock?: number;
  min_sales?: number;
  max_sales?: number;
}): UseInventoriesReturn => {
  const queryClient = useQueryClient();

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

  // useInfiniteQuery - 자동 프리페치 완전 비활성화
  const query = useInfiniteQuery({
    queryKey: ['inventories', apiFilters, frontendStatus],
    queryFn: async ({ pageParam = 1 }) => {
      const finalParams = {
        ...apiFilters,
        page: pageParam,
        // page_size는 API 기본값 10 사용
      };
      const response = await fetchInventories(finalParams);
      return response.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      // 다음 페이지가 있는지 확인
      if (lastPage.next) {
        return allPages.length + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    enabled: true,
    // 자동 프리페치 관련 옵션들 모두 비활성화
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // useInfiniteQuery 데이터 처리
  const allData = useMemo(() => {
    if (!query.data?.pages) return [];
    return query.data.pages.flatMap((page) => page.results || []);
  }, [query.data?.pages]);

  // 프론트엔드 상태 필터링 적용 (점진적으로 서버로 이동 예정)
  const filteredData = useMemo(() => {
    return allData.filter((item: ApiProductVariant) => {
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

  // 전체 개수 계산
  const totalCount = query.data?.pages?.[0]?.count ?? 0;

  // hasNextPage 수동 계산
  const currentLoadedCount = allData.length;
  const hasNextPage = currentLoadedCount < totalCount;

  // 수동 fetchNextPage - React Query의 queryClient를 사용해서 직접 새 페이지 데이터 추가
  const fetchNextPage = async () => {
    if (!hasNextPage || query.isFetching) {
      return;
    }

    const nextPageParam = query.data?.pages?.length ? query.data.pages.length + 1 : 2;

    try {
      const finalParams = {
        ...apiFilters,
        page: nextPageParam,
        // page_size는 API 기본값 10 사용
      };
      const response = await fetchInventories(finalParams);

      // QueryClient를 통해 기존 데이터에 새 페이지 추가
      queryClient.setQueryData(
        ['inventories', apiFilters, frontendStatus],
        (oldData: InfiniteData<InventoryPageData> | undefined) => {
          if (!oldData) return { pages: [response.data], pageParams: [1, nextPageParam] };

          return {
            ...oldData,
            pages: [...oldData.pages, response.data],
            pageParams: [...(oldData.pageParams || []), nextPageParam],
          };
        }
      );
    } catch (error) {
      console.error('❌ 다음 페이지 불러오기 실패:', error);
    }
  };

  return {
    // 기본 쿼리 정보
    ...query,
    // 무한 스크롤용 데이터와 함수들
    data: filteredData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage: query.isFetching,
    // 호환성을 위한 기존 구조 유지
    pagination: {
      count: totalCount,
      next: hasNextPage ? 'has-more' : null,
      previous: null,
    },
    // 새로운 무한 스크롤 관련 정보
    infiniteScroll: {
      totalLoaded: allData.length,
      totalFiltered: filteredData.length,
      totalCount: totalCount,
      hasNextPage: hasNextPage,
      isLoadingMore: query.isFetching,
    },
    // 편의 함수
    refetch: () => query.refetch(),
  };
};
