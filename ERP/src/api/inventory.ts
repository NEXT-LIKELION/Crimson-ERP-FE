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
  return api.get('/inventory/variants/export', { params });
};
export const updateInventoryItem = (productId: number, data: Partial<Product>) => {
  return api.put(`/inventory/${productId}/`, data);
};

export const updateInventoryVariant = (variantId: string, data: Partial<ProductVariant>) => {
  return api
    .patch(`/inventory/variants/${variantId}/`, data)
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.error('updateInventoryVariant - error:', error);
      console.error('updateInventoryVariant - error response:', error.response?.data);
      console.error('updateInventoryVariant - error status:', error.response?.status);
      throw error;
    });
};

export const createInventoryVariant = async (itemPayload: Omit<ProductVariantCreate, 'category_name'>) => {
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

// 카테고리 목록 조회
export const fetchCategories = () => api.get('/inventory/categories/');

// 상품명 중복 여부 확인 (대소문자/공백 무시 정확 일치)
export const checkProductNameExists = async (
  name: string
): Promise<{ isDuplicate: boolean; error?: string }> => {
  try {
    const res = await fetchProductOptions();
    const list: ProductOption[] = res.data || [];
    const target = (name || '').trim().toLowerCase();
    const isDuplicate = list.some((p: ProductOption) => (p?.name || '').trim().toLowerCase() === target);
    return { isDuplicate };
  } catch (e) {
    console.error('상품명 중복 체크 실패:', e);
    return {
      isDuplicate: false,
      error: '상품명 중복 확인 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.',
    };
  }
};

// 병합용 전체 데이터 조회 (모든 페이지)
export const fetchAllInventoriesForMerge = async (): Promise<ProductVariant[]> => {
  try {
    let allData: ProductVariant[] = [];
    let page = 1;
    let hasMoreData = true;

    while (hasMoreData) {
      const response = await fetchInventories({ page });
      const pageData = response.data.results || [];
      allData = [...allData, ...pageData];

      // 다음 페이지가 있는지 확인
      hasMoreData = response.data.next !== null;
      page++;
    }

    return allData;
  } catch (error) {
    console.error('전체 데이터 로드 실패:', error);
    throw error;
  }
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

export const fetchFilteredInventoriesForExport = async (appliedFilters: InventoryExportFilters): Promise<ProductVariant[]> => {
  try {
    let allData: ProductVariant[] = [];
    let page = 1;
    let hasMoreData = true;

    // 백엔드 필터 (상태 필터 제외)
    const backendFilters = { ...appliedFilters };
    delete backendFilters.status;
    delete backendFilters.page;

    // 모든 페이지에서 데이터 수집
    while (hasMoreData) {
      const response = await fetchInventories({ ...backendFilters, page });
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
  } catch (error) {
    console.error('필터링된 데이터 로드 실패:', error);
    throw error;
  }
};

// 재고 조정
export const adjustStock = (
  variantCode: string,
  data: {
    actual_stock: number;
    reason: string;
    updated_by: string;
  }
) => {
  return api
    .put(`/inventory/variants/stock/${variantCode}/`, data)
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.error('adjustStock - error:', error);
      console.error('adjustStock - error response:', error.response?.data);
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
      console.error('fetchStockAdjustments - error:', error);
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
      console.error('mergeVariants - error:', error);
      console.error('mergeVariants - error response:', error.response?.data);
      throw error;
    });
};

// duplicate removed
