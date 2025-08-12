// src/types/product.ts

export interface ProductVariant {
  product_id: string;
  variant_code: string;
  name: string;
  category: string;
  option: string;
  stock: number;
  price: number;
  min_stock: number;
  description: string;
  memo: string;
  cost_price: number | null;
  order_count: number;
  return_count: number;
  sales: number;
  suppliers: {
    name: string;
    is_primary: boolean;
    cost_price: number;
  }[];
}

export interface Product {
  id?: number;
  product_id: string;
  name: string;
  variants?: ProductVariant[];
  category?: string;

  // 프론트에서만 사용하는 임시 필드들 (테이블 렌더링용)
  option?: string;
  price?: number | string;
  stock?: number;
  cost_price?: number | string;
  min_stock?: number;
  variant_id?: number | string;
  variant_code?: string;
  orderCount?: number;
  returnCount?: number;
  order_count?: number;
  return_count?: number;
  sales?: number;
  salesCount?: number;
  totalSales?: string;
  status?: string;
  created_at?: string;
  description?: string;
  memo?: string;
  suppliers?: { name: string; is_primary: boolean }[];
}

// API 응답 타입 정의
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Inventory API 응답 타입들
export type InventoryApiResponse = PaginatedResponse<ProductVariant>;
export type ProductOptionsResponse = Product[];

// 상품 옵션 API 응답 (product_id, name만 포함)
export interface ProductOption {
  product_id: string;
  name: string;
}
export type ProductOptionsApiResponse = ProductOption[];

// 재고 조정 이력 타입
export interface InventoryAdjustment {
  id: number;
  variant_code: string;
  product_id: string;
  product_name: string;
  delta: number;
  reason: string;
  created_by: string;
  created_at: string;
}

export type InventoryAdjustmentResponse = PaginatedResponse<InventoryAdjustment>;

// 공급업체 타입
export interface Supplier {
  id: number;
  name: string;
  contact_info?: string;
  created_at: string;
  updated_at: string;
}

// 제품 생성 폼 타입
export interface ProductFormData {
  name: string;
  category: string;
  option: string;
  stock: number;
  price: number;
  min_stock: number;
  description: string;
  memo: string;
  suppliers: ProductSupplierData[];
}

// 제품에 연결된 공급업체 데이터
export interface ProductSupplierData {
  supplier_name: string;
  cost_price: number;
  is_primary: boolean;
}

// 상품 생성 완료 후 콜백용 타입 (ProductFormData + variant_id)
export interface CreatedProductData extends ProductFormData {
  variant_id: string;
}
