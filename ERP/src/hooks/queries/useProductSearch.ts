import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/axios';
import { ProductOption } from '../../types/product';
import { useMemo } from 'react';

interface ProductSearchFilters {
  product_name?: string;
}

export const useProductSearch = (filters?: ProductSearchFilters) => {
  const queryClient = useQueryClient();

  // API 파라미터 준비 (product_name은 그대로 유지)
  const apiFilters: Record<string, unknown> = filters ? { ...filters } : {};

  // useInfiniteQuery - 자동 프리페치 완전 비활성화
  const query = useInfiniteQuery({
    queryKey: ['productSearch', apiFilters],
    queryFn: async ({ pageParam = 1 }) => {
      const finalParams = {
        ...apiFilters,
        page: pageParam,
        page_size: 20 // 페이지당 20개
      };
      console.log('🔍 Product Search API Request:', finalParams);
      const response = await api.get('/inventory/variants/', { params: finalParams });
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

  // useInfiniteQuery 데이터 처리
  const allData = useMemo(() => {
    if (!query.data?.pages) return [];
    return query.data.pages.flatMap(page => page.results || []);
  }, [query.data?.pages]);

  // product_id 기준 중복 제거하여 ProductOption 형태로 변환 (기존 방식)
  const productOptions = useMemo(() => {
    const uniqueProducts = new Map();
    allData.forEach((variant: any) => {
      if (!uniqueProducts.has(variant.product_id)) {
        uniqueProducts.set(variant.product_id, {
          product_id: variant.product_id,
          name: variant.name
        });
      }
    });
    return Array.from(uniqueProducts.values()) as ProductOption[];
  }, [allData]);

  // 전체 개수 계산
  const totalCount = query.data?.pages?.[0]?.count ?? 0;

  // hasNextPage 수동 계산
  const currentLoadedCount = allData.length;
  const hasNextPage = currentLoadedCount < totalCount;

  // 수동 fetchNextPage
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
        page_size: 20
      };
      console.log('🔍 Product Search API Request (수동 페치):', finalParams);
      const response = await api.get('/inventory/variants/', { params: finalParams });

      // QueryClient를 통해 기존 데이터에 새 페이지 추가
      queryClient.setQueryData(['productSearch', apiFilters], (oldData: any) => {
        if (!oldData) return { pages: [response.data], pageParams: [1, nextPageParam] };

        return {
          ...oldData,
          pages: [...oldData.pages, response.data],
          pageParams: [...(oldData.pageParams || []), nextPageParam]
        };
      });

    } catch (error) {
      console.error('❌ 다음 페이지 불러오기 실패:', error);
    }
  };

  return {
    // 기본 쿼리 정보
    ...query,
    // 변환된 데이터
    data: productOptions,
    // 무한 스크롤용 함수들
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage: query.isFetching,
    // 페이지네이션 정보
    pagination: {
      count: totalCount,
      next: hasNextPage ? 'has-more' : null,
      previous: null,
    },
    // 무한 스크롤 관련 정보
    infiniteScroll: {
      totalLoaded: allData.length,
      totalFiltered: productOptions.length,
      totalCount: totalCount,
      hasNextPage: hasNextPage,
      isLoadingMore: query.isFetching,
    },
    // 편의 함수
    refetch: () => query.refetch(),
  };
};