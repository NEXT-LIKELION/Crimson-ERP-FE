import api from './axios';
import { Product, ProductVariant, ProductVariantCreate, ProductOption } from '../types/product';

interface InventoryFilterParams {
  name?: string;
  category?: string;
  stock_gt?: number;
  stock_lt?: number;
  sales_min?: number;
  sales_max?: number;
}

interface FetchInventoriesParams extends InventoryFilterParams {
  page?: number;
  page_size?: number;
}

export const fetchInventories = (params?: FetchInventoriesParams) => {
  return api.get('/inventory/variants/', { params });
};

export const fetchInventoriesForExport = (params?: InventoryFilterParams) => {
  return api.get('/inventory/variants/export/', { params });
};
export const updateInventoryItem = (productId: number, data: Partial<Product>) => {
  return api.put(`/inventory/${productId}/`, data);
};

export const updateInventoryVariant = (variantId: string, data: Partial<Product>) => {
  return api
    .patch(`/inventory/variants/${variantId}/`, data)
    .then((response) => {
      return response;
    })
    .catch((error) => {
      throw error;
    });
};

export const createInventoryVariant = async (
  itemPayload: Omit<ProductVariantCreate, 'category_name'>
) => {
  const res = await api.post(`/inventory/variants/`, itemPayload);
  return res.data;
};
export const createInventoryItem = async (itemPayload: Omit<Product, 'id' | 'variants'>) => {
  const res = await api.post(`/inventory/`, itemPayload);
  return res.data;
}; // 상품만 생성

// 상품과 variant를 함께 생성하는 함수 (백엔드 구조에 따라 사용)
export const createProductWithVariant = async (
  itemPayload: Omit<ProductVariantCreate, 'category_name'>
) => {
  const res = await api.post(`/inventory/variants/`, itemPayload);
  return res.data;
};

export const checkProductIdExists = async (product_id: string) => {
  const res = await api.get('/inventory/', {
    params: { product_id },
  });
  return res.data.length > 0; // (product_id) 중복 검사 -> 존재하면 true
};

/**
 * Delete an InventoryItem (and its variants via cascade).
 * @param productId  the InventoryItem.id to delete
 */
export const deleteProductVariant = async (variantCode: string) => {
  return api.delete(`/inventory/variants/${variantCode}/`);
};

export const fetchVariantsByProductId = (productId: string) => api.get(`/inventory/${productId}/`);

// 상품 드롭다운용 목록 조회 (product_id, name만)
export const fetchProductOptions = () => api.get('/inventory/');

// 단일 variant 상세 조회
export const fetchVariantDetail = (variantCode: string) =>
  api.get(`/inventory/variants/${variantCode}/`);

// 상품명 중복 여부 확인 (대소문자/공백 무시 정확 일치)
export const checkProductNameExists = async (
  name: string
): Promise<{ isDuplicate: boolean; error?: string }> => {
  try {
    const res = await fetchProductOptions();
    const list: ProductOption[] = res.data || [];
    const target = (name || '').trim().toLowerCase();
    const isDuplicate = list.some(
      (p: ProductOption) => (p?.name || '').trim().toLowerCase() === target
    );
    return { isDuplicate };
  } catch {
    return { isDuplicate: false };
  }
};

// 병합용 전체 데이터 조회 (큰 page_size로 최소한의 요청)
export const fetchAllInventoriesForMerge = async (): Promise<ProductVariant[]> => {
  const response = await fetchInventoriesForExport();
  const data: ProductVariant[] = response.data || [];
  return data;
};

// 엑셀 익스포트용 필터링된 전체 데이터 조회
interface InventoryExportFilters {
  name?: string;
  category?: string;
  status?: string;
  stock_gt?: number;
  stock_lt?: number;
  sales_min?: number;
  sales_max?: number;
  page?: number;
}

export const fetchFilteredInventoriesForExport = async (
  appliedFilters: InventoryExportFilters
): Promise<ProductVariant[]> => {
  // 백엔드 필터 (상태 필터와 페이지 관련 제외)
  const backendFilters = { ...appliedFilters };
  delete backendFilters.status;
  delete backendFilters.page;

  // 필터링된 모든 데이터를 페이지별로 수집
  let allData: ProductVariant[] = [];
  let page = 1;
  let hasMoreData = true;

  while (hasMoreData) {
    const params =
      Object.keys(backendFilters).length > 0
        ? { ...backendFilters, page, page_size: 100 }
        : { page, page_size: 100 };

    const response = await fetchInventories(params);
    const pageData = response.data.results || [];
    allData = [...allData, ...pageData];

    hasMoreData = response.data.next !== null;
    page++;
  }

  // 프론트엔드 필터링 적용
  const filteredData = allData.filter((item: ProductVariant) => {
    // 상품명 필터
    if (
      appliedFilters?.name &&
      !item.name.toLowerCase().includes(appliedFilters.name.toLowerCase())
    ) {
      return false;
    }

    // 카테고리 필터
    if (appliedFilters?.category && item.category !== appliedFilters.category) {
      return false;
    }

    // 상태 필터
    if (appliedFilters?.status && appliedFilters.status !== '모든 상태') {
      const stock = item.stock;
      const minStock = item.min_stock || 0;
      let status = '정상';
      if (stock === 0) {
        status = '품절';
      } else if (stock < minStock) {
        status = '재고부족';
      }
      if (status !== appliedFilters.status) return false;
    }

    // 재고수량 필터
    if (appliedFilters?.stock_gt !== undefined) {
      if (item.stock <= appliedFilters.stock_gt) return false;
    }
    if (appliedFilters?.stock_lt !== undefined) {
      if (item.stock >= appliedFilters.stock_lt) return false;
    }

    // 판매합계 필터
    if (appliedFilters?.sales_min !== undefined && appliedFilters?.sales_min > 0) {
      const sales = typeof item.sales === 'string' ? Number(item.sales) || 0 : item.sales || 0;
      if (sales < appliedFilters.sales_min) return false;
    }
    if (appliedFilters?.sales_max !== undefined && appliedFilters?.sales_max < 5000000) {
      const sales = typeof item.sales === 'string' ? Number(item.sales) || 0 : item.sales || 0;
      if (sales > appliedFilters.sales_max) return false;
    }

    return true;
  });

  return filteredData;
};

// 재고 조정
export const adjustStock = (
  variantCode: string,
  data: {
    delta: number;
    reason: string;
    created_by: string;
    year?: number;
    month?: number;
  }
) => {
  return api
    .post('/inventory/adjustments/', {
      variant_code: variantCode,
      delta: data.delta,
      reason: data.reason,
      created_by: data.created_by,
      year: data.year,
      month: data.month,
    })
    .then((response) => {
      return response;
    })
    .catch((error) => {
      throw error;
    });
};

// 재고 변경 이력 조회
export const fetchStockAdjustments = (params?: { page?: number; variant_code?: string }) => {
  return api
    .get('/inventory/adjustments/', { params })
    .then((response) => {
      return response;
    })
    .catch((error) => {
      throw error;
    });
};

// 상품 코드 병합
export const mergeVariants = async (payload: {
  target_variant_code: string;
  source_variant_codes: string[];
}) => {
  return api
    .post('/inventory/variants/merge/', payload)
    .then((response) => {
      return response;
    })
    .catch((error) => {
      throw error;
    });
};

// 카테고리 목록 조회
export const fetchCategories = () => {
  return api.get('/inventory/category/')
    .then(response => {
      // API 응답 형식: { big_categories: [], middle_categories: [], categories: [] }
      // categories 배열만 추출
      const categories = response.data?.categories || [];
      // 배열이 아닌 경우 빈 배열 반환
      const categoryArray = Array.isArray(categories) ? categories : [];
      return { ...response, data: categoryArray };
    })
    .catch(error => {
      console.warn('카테고리 조회 실패, 기본값 사용:', error);
      // 실패 시 기본 카테고리 반환
      return { data: ['의류', '전자제품', '생활용품', '식품', '화장품', '도서', '스포츠', '기타'] };
    });
};

// 월별 재고 현황 조회
export const fetchVariantStatus = (params: {
  year: number;
  month: number;
  page?: number;
  ordering?: string;
}) => {
  return api.get('/inventory/variant-status/', { params });
};


// 월별 재고 현황 개별 항목 수정
export const updateVariantStatus = (
  year: number,
  month: number,
  variantCode: string,
  data: {
    warehouse_stock_start?: number;
    store_stock_start?: number;
    inbound_quantity?: number;
    store_sales?: number;
    online_sales?: number;
  }
) => {
  return api.patch(`/inventory/variant-status/${year}/${month}/${variantCode}/`, data);
};

// 월별 재고 현황 엑셀 업로드
export const uploadVariantStatusExcel = (
  file: File,
  year?: number,
  month?: number
) => {
  const formData = new FormData();
  formData.append('file', file);

  const params = new URLSearchParams();
  if (year) params.append('year', year.toString());
  if (month) params.append('month', month.toString());

  const url = `/inventory/variants/upload-excel/${params.toString() ? `?${params.toString()}` : ''}`;

  return api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// 월별 재고 현황 엑셀 다운로드 (JSON 데이터 반환)
export const downloadVariantStatusExcel = (params: {
  year: number;
  month: number;
  product_code?: string;
  variant_code?: string;
  category?: string;
}) => {
  return api.get('/inventory/variants/export/', {
    params
    // responseType 제거 - JSON 데이터이므로 기본 처리
  });
};
