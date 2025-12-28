import { api } from './axios';
import { ProductVariant } from '../types/product';

// 🔹 1. 발주 목록 조회 (GET /orders/)
export const fetchOrders = (params?: {
  ordering?: string;
  product_name?: string;
  supplier?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
}) => api.get('/orders/', { params });

// 🔹 2. 발주 생성 (POST /orders/)
export const createOrder = (payload: {
  supplier: number;
  manager_name: string;
  order_date: string;
  expected_delivery_date?: string;
  status: string;
  instruction_note?: string;
  note?: string;
  vat_included?: boolean;
  packaging_included?: boolean;
  items: {
    variant_code: string;
    quantity: number;
    unit_price: number;
    unit?: string;
    remark?: string;
    spec?: string;
  }[];
}) => api.post('/orders/', payload);

// 🔹 3. 특정 발주 조회 (GET /orders/{order_id}/)
export const fetchOrderById = (orderId: number) => api.get(`/orders/${orderId}/`);

// 🔹 4. 발주 삭제 (DELETE /orders/{order_id}/)
export const deleteOrder = (orderId: number) => api.delete(`/orders/${orderId}/`);

// 🔹 5. 발주 상태 변경 (PATCH /orders/{order_id}/)
export const updateOrderStatus = (orderId: number, payload: { status: string }) =>
  api.patch(`/orders/${orderId}/`, payload);

// 🔹 6. 발주 목록 Export (GET /orders/export/)
export const exportOrders = (params?: {
  ordering?: string;
  product_name?: string;
  supplier?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}) => api.get('/orders/export/', { params });

// 🔹 7. 업체별 상품 목록 조회 (프론트엔드 최적화용)
export const fetchProductsBySupplier = async (supplierId: number) => {
  try {
    // 업체 정보 조회
    const supplierRes = await api.get(`/supplier/${supplierId}/`);
    const supplier = supplierRes.data;

    if (!supplier.variants || supplier.variants.length === 0) {
      return { data: [] };
    }

    // 업체의 variants에서 유니크한 상품명 추출
    const uniqueProductNames = [...new Set(supplier.variants.map((v: { name: string }) => v.name))];

    // 전체 상품 목록 조회
    const productsRes = await api.get('/inventory/');
    const allProducts = productsRes.data || [];

    // 업체가 공급하는 상품만 필터링
    const supplierProducts = allProducts.filter((product: { name: string }) =>
      uniqueProductNames.includes(product.name)
    );

    return { data: supplierProducts };
  } catch (error) {
    console.error('Failed to fetch products by supplier:', error);
    throw error;
  }
};

// 🔹 8. 상품 검색 (발주용) - 모든 상품에서 검색 (페이지네이션 지원)
export const searchProducts = async (query: string) => {
  try {
    let allVariants: ProductVariant[] = [];
    let page = 1;
    let hasMoreData = true;

    const baseParams: Record<string, string | number> = {
      page_size: 100,
    };

    // 검색어가 있을 때만 필터링 파라미터 추가
    if (query.trim()) {
      baseParams.product_name = query;
    }

    // 모든 페이지를 순회하여 전체 데이터 수집
    while (hasMoreData) {
      const params = { ...baseParams, page };
      const response = await api.get('/inventory/variants/', { params });
      const pageData = response.data?.results || [];

      allVariants = [...allVariants, ...pageData];

      // 다음 페이지가 있는지 확인
      hasMoreData = response.data?.next !== null;
      page++;
    }

    // 중복 제거: 각 variant_code별로 하나씩만 사용
    const uniqueVariants = new Map();
    allVariants.forEach((variant) => {
      if (!uniqueVariants.has(variant.variant_code)) {
        uniqueVariants.set(variant.variant_code, {
          product_id: variant.product_id,
          name: variant.offline_name || variant.online_name || '',
          variant_code: variant.variant_code,
        });
      }
    });

    const productOptions = Array.from(uniqueVariants.values());
    return { data: productOptions };
  } catch (error) {
    console.error('Failed to search products:', error);
    throw error;
  }
};
