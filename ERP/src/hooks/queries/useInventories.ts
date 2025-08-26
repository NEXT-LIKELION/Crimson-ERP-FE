import { useQuery } from '@tanstack/react-query';
import { fetchInventories } from '../../api/inventory';
import { Product } from '../../types/product';
import { useEffect } from 'react';

// type PaginatedResponse = {
//     count: number;
//     next: string | null;
//     previous: string | null;
//     results: Product[];
// };

export const useInventories = (filters?: {
  page?: number;
  page_size?: number;
  name?: string;
  category?: string;
  status?: string; // 프론트엔드 전용 필터
  min_stock?: number;
  max_stock?: number;
  min_sales?: number;
  max_sales?: number;
}) => {
  // 백엔드로 보낼 필터와 프론트엔드에서 처리할 필터 분리
  const backendFilters = filters ? { ...filters } : {};
  const frontendStatus = backendFilters.status;
  const hasStatusFilter = frontendStatus && frontendStatus !== '모든 상태';

  // API 파라미터명 변환
  const apiFilters: Record<string, unknown> = { ...backendFilters };
  
  if (backendFilters.min_stock !== undefined) {
    apiFilters.stock_gt = backendFilters.min_stock - 1; // min_stock 5 -> stock_gt 4 (4초과)
    delete apiFilters.min_stock;
  }
  if (backendFilters.max_stock !== undefined) {
    apiFilters.stock_lt = backendFilters.max_stock + 1; // max_stock 100 -> stock_lt 101 (101미만)
    delete apiFilters.max_stock;
  }
  if (backendFilters.min_sales !== undefined) {
    apiFilters.sales_min = backendFilters.min_sales;
    delete apiFilters.min_sales;
  }
  if (backendFilters.max_sales !== undefined) {
    apiFilters.sales_max = backendFilters.max_sales;
    delete apiFilters.max_sales;
  }

  // 필터가 하나라도 있으면 모든 데이터를 가져와야 함 (프론트엔드에서 정확한 필터링/페이지네이션)
  const hasAnyFilter = Boolean(
    filters?.name ||
      filters?.category ||
      hasStatusFilter ||
      filters?.min_stock !== undefined ||
      filters?.max_stock !== undefined ||
      filters?.min_sales !== undefined ||
      filters?.max_sales !== undefined
  );



  delete apiFilters.status; // 백엔드에는 status 필터 제외

  // 필터가 있으면 모든 데이터를 가져와야 함 (페이지네이션 제거)
  if (hasAnyFilter) {
    delete apiFilters.page;
  }



  // 필터가 있을 때는 모든 페이지 데이터를 가져오는 커스텀 훅 사용
  const query = useQuery({
    queryKey: ['inventories', apiFilters, frontendStatus], // 캐시 키에는 모든 필터 포함
    queryFn: async () => {
      if (hasAnyFilter) {
        // 모든 페이지를 순차적으로 가져와서 합치기
        let allData: unknown[] = [];
        let page = 1;
        let hasMoreData = true;

        while (hasMoreData) {
          const response = await fetchInventories({ ...apiFilters, page });
          const pageData = response.data.results || [];
          allData = [...allData, ...pageData];

          hasMoreData = response.data.next !== null;
          page++;


        }

        return {
          data: {
            results: allData,
            count: allData.length,
            next: null,
            previous: null,
          },
        };
      } else {
        // 필터가 없으면 기본 API 호출
        return fetchInventories(apiFilters);
      }
    },
    staleTime: 0, // 캐시 비활성화로 항상 최신 데이터 가져오기
    gcTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    if (query.isError) {
      console.error('❌ 재고 목록 불러오기 실패:', query.error);
    }
  }, [query.isSuccess, query.isError, query.data, query.error]);

  // 프론트엔드 상태 필터링 적용
  const allData = query.data?.data?.results || [];


  const filteredData = allData.filter((item: Product) => {
    // 1. 상품명 필터 확인
    if (filters?.name && !item.name.toLowerCase().includes(filters.name.toLowerCase())) {
      return false;
    }

    // 2. 카테고리 필터 확인
    if (filters?.category && item.category !== filters.category) {
      return false;
    }

    // 3. 상태 필터 확인
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

    // 4. 재고수량 필터 확인
    if (filters?.min_stock !== undefined) {
      if ((item.stock ?? 0) < filters.min_stock) {
        return false;
      }
    }
    if (filters?.max_stock !== undefined) {
      if ((item.stock ?? 0) > filters.max_stock) {
        return false;
      }
    }

    // 5. 판매합계 필터 확인
    if (filters?.min_sales !== undefined && filters?.min_sales > 0) {
      const sales = typeof item.sales === 'string' ? Number(item.sales) || 0 : item.sales || 0;
      if (sales < filters.min_sales) {
        return false;
      }
    }
    if (filters?.max_sales !== undefined && filters?.max_sales < 5000000) {
      const sales = typeof item.sales === 'string' ? Number(item.sales) || 0 : item.sales || 0;
      if (sales > filters.max_sales) {
        return false;
      }
    }

    // 모든 필터를 통과한 상품
    return true;
  });



  // 필터가 있을 때는 프론트엔드 페이지네이션 적용
  const currentPage = filters?.page ?? 1;
  const itemsPerPage = 10;

  let paginationInfo;
  if (hasAnyFilter) {
    // 프론트엔드 페이지네이션
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    paginationInfo = {
      count: totalItems,
      next: currentPage < totalPages ? `page=${currentPage + 1}` : null,
      previous: currentPage > 1 ? `page=${currentPage - 1}` : null,
    };



    return {
      ...query,
      data: paginatedData,
      pagination: paginationInfo,
    };
  } else {
    // 필터가 없을 때만 백엔드 페이지네이션 사용
    paginationInfo = {
      count: query.data?.data?.count ?? 0,
      next: query.data?.data?.next ?? null,
      previous: query.data?.data?.previous ?? null,
    };

    return {
      ...query,
      data: filteredData,
      pagination: paginationInfo,
    };
  }
};
