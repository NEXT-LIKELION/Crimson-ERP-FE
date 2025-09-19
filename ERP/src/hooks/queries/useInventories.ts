import { useInfiniteQuery, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { fetchInventories } from '../../api/inventory';
import { Product, ProductVariant } from '../../types/product';

// API 응답 타입 정의
interface InventoryPageData {
  results: ProductVariant[];
  count: number;
  next: string | null;
  previous: string | null;
}

export const useInventories = (filters?: {
  name?: string;
  category?: string;
  status?: string; // 프론트엔드 전용 필터 (점진적으로 서버로 이동 예정)
  min_stock?: number;
  max_stock?: number;
  min_sales?: number;
  max_sales?: number;
}) => {
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
        page_size: 20, // 항상 page_size 포함
      };
      console.log('🔍 API Request Parameters:', finalParams);
      const response = await fetchInventories(finalParams);
      return response.data;
    },
    getNextPageParam: () => {
      // 항상 undefined 반환해서 자동 프리페치 완전 차단
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

  useEffect(() => {
    if (query.isError) {
      console.error('❌ 재고 목록 불러오기 실패:', query.error);
    }
  }, [query.isSuccess, query.isError, query.data, query.error]);

  // useInfiniteQuery 데이터 처리
  const allData = useMemo(() => {
    if (!query.data?.pages) return [];
    return query.data.pages.flatMap((page) => page.results || []);
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

  // 전체 개수 계산
  const totalCount = query.data?.pages?.[0]?.count ?? 0;

  // hasNextPage 수동 계산
  const currentLoadedCount = allData.length;
  const hasNextPage = currentLoadedCount < totalCount;

  // 수동 fetchNextPage - React Query의 queryClient를 사용해서 직접 새 페이지 데이터 추가
  const fetchNextPage = async () => {
    if (!hasNextPage || query.isFetching) {
      console.log('⏸️ fetchNextPage blocked:', { hasNextPage, isFetching: query.isFetching });
      return;
    }

    const nextPageParam = query.data?.pages?.length ? query.data.pages.length + 1 : 2;
    console.log('🔘 Manual fetchNextPage called for page:', nextPageParam);

    try {
      const finalParams = {
        ...apiFilters,
        page: nextPageParam,
        page_size: 20,
      };
      console.log('🔍 API Request Parameters (수동 페치):', finalParams);
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
