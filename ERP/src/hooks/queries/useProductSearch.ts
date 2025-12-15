import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchInventories } from '../../api/inventory';
import { ProductOption } from '../../types/product';
import type { components } from '../../types/api';

// OpenAPI 스키마 기반 Variant 타입 (실제 응답 구조)
type ApiProductVariant = components['schemas']['ProductVariant'] & {
  // 백엔드 응답에 name 필드가 포함되는 경우를 위한 확장
  name?: string;
};

interface ProductSearchFilters {
  product_name?: string;
}

// API 응답 타입 정의 (페이지네이션 래퍼 + OpenAPI Variant 스키마)
interface ProductSearchPageData {
  results: ApiProductVariant[];
  count: number;
  next: string | null;
  previous: string | null;
}

export const useProductSearch = (filters?: ProductSearchFilters) => {
  // API 파라미터 준비 (product_name은 그대로 유지)
  const apiFilters: Record<string, unknown> = filters ? { ...filters } : {};

  // useInfiniteQuery - 자동 프리페치 완전 비활성화
  const query = useInfiniteQuery({
    queryKey: ['productSearch', apiFilters],
    queryFn: async ({ pageParam = 1 }) => {
      const finalParams = {
        ...apiFilters,
        page: pageParam,
        page_size: 20, // 페이지당 20개
      };
      const response = await api.get('/inventory/variants/', { params: finalParams });
      return response.data;
    },
    getNextPageParam: (lastPage: ProductSearchPageData) => {
      // lastPage.next가 null이 아니면, URL에서 page 파라미터 추출
      if (lastPage.next) {
        const url = new URL(lastPage.next, window.location.origin);
        const pageParam = url.searchParams.get('page');
        return pageParam ? Number(pageParam) : undefined;
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

  // product_id 기준 중복 제거하여 ProductOption 형태로 변환 (기존 방식)
  const productOptions = useMemo(() => {
    const uniqueProducts = new Map<string, ProductOption>();

    allData.forEach((variant: ApiProductVariant) => {
      const productId = variant.product_id ?? variant.variant_code;
      const displayName = variant.name ?? variant.offline_name ?? variant.online_name ?? productId;

      if (!uniqueProducts.has(productId)) {
        uniqueProducts.set(productId, {
          product_id: productId,
          name: displayName,
        });
      }
    });
    return Array.from(uniqueProducts.values()) as ProductOption[];
  }, [allData]);

  // 전체 개수 계산
  const totalCount = query.data?.pages?.[0]?.count ?? 0;

  // TanStack Query 내장 기능 사용

  return {
    // 기본 쿼리 정보
    ...query,
    // 변환된 데이터
    data: productOptions,
    // 무한 스크롤용 함수들 (TanStack Query 내장)
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    // 페이지네이션 정보
    pagination: {
      count: totalCount,
      next: query.hasNextPage ? 'has-more' : null,
      previous: null,
    },
    // 무한 스크롤 관련 정보
    infiniteScroll: {
      totalLoaded: allData.length,
      totalFiltered: productOptions.length,
      totalCount: totalCount,
      hasNextPage: query.hasNextPage,
      isLoadingMore: query.isFetchingNextPage,
    },
    // 편의 함수
    refetch: () => query.refetch(),
  };
};
