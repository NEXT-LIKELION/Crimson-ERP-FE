// src/types/product.ts
import type { components } from './api';

// ProductVariant (API 응답용 - 읽기 전용 필드들)
export interface ProductVariant {
  product_id: string; // readOnly
  name: string; // readOnly
  category: string; // readOnly
  variant_code: string;
  option: string;
  stock: number; // readOnly
  price: number;
  min_stock: number;
  description: string;
  memo: string;
  cost_price: number; // readOnly, 기본 원가 (number 타입)
  order_count: number; // readOnly
  return_count: number; // readOnly
  sales: string; // readOnly, 계산된 값 (string 타입)
  suppliers: string; // readOnly, 표시용 텍스트 (string 타입)
  channels: string[]; // 판매 채널 목록
}

// 스냅샷 관련 타입 정의
export interface InventorySnapshot {
  id: number;
  created_at: string;
  reason: string;
  actor?: string;
  meta?: {
    upload_channel?: 'online' | 'offline';
    upload_type?: string;
    upload_reason?: string;
    filename?: string;
    filesize?: number;
    [key: string]: string | number | boolean | null | undefined;
  };
}

// ProductVariant 생성용
export interface ProductVariantCreate {
  product_id: string; // readOnly
  category: string;
  category_name: string; // readOnly
  option: string;
  stock: number;
  price: number;
  min_stock: number;
  description: string;
  memo: string;
  name: string;
  channels: string[];
}

// 프론트엔드 통합 타입 (기존 코드 호환성)
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
  cost_price?: number | string; // API: number, 프론트: number/string 허용
  min_stock?: number;
  variant_id?: number | string;
  variant_code?: string;
  channels?: string[]; // 판매 채널
  orderCount?: number;
  returnCount?: number;
  order_count?: number;
  return_count?: number;
  sales?: number | string; // API: string, 프론트: number 허용
  salesCount?: number;
  totalSales?: string;
  status?: string;
  created_at?: string;
  description?: string;
  memo?: string;
  suppliers?: string; // 조회용 표시 텍스트
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

// ProductOption 중복 제거 - 위에서 이미 정의됨

// 기본 Supplier 엔티티 (GET /supplier/, GET /supplier/{id}/ 응답)
export interface Supplier {
  id: number;
  name: string;
  contact: string;
  manager: string;
  email: string;
  address: string;
}

// 발주 품목
export interface SupplierOrderItem {
  variant_code: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

// 발주 정보
export interface SupplierOrder {
  id: number;
  order_date: string;
  expected_delivery_date: string;
  status: string;
  total_price: number;
  items: SupplierOrderItem[];
}

// 발주 내역 API 응답
export interface SupplierOrdersResponse {
  supplier: string;
  orders: SupplierOrder[];
}

// Supplier 생성용 (POST /supplier/ 요청)
export interface SupplierCreateData {
  name: string;
  contact: string;
  manager: string;
  email: string;
  address: string;
}

// Supplier 수정용 (PATCH /supplier/{id}/ 요청)
export interface SupplierOption {
  id?: number; // readOnly, 응답에만 포함
  name: string;
  contact: string;
  manager: string;
  email: string;
  address: string;
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
  channels: string[];
}

// 제품에 연결된 공급업체 데이터 (기존 호환성)
export interface ProductSupplierData {
  supplier_name: string;
  cost_price: number;
  is_primary?: boolean; // 옵셔널로 변경
}

// 숫자 변환 유틸리티
export function ensureNumber(value: number | string | undefined): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return isNaN(parsed) ? undefined : parsed;
}

// 상품 생성 완료 후 콜백용 타입 (ProductFormData + variant_id + product_id)
export interface CreatedProductData extends ProductFormData {
  variant_id: string;
  product_id: string;
}

// 월별 재고 현황 타입 (백엔드 OpenAPI 스키마 재사용)
export type ProductVariantStatus = components['schemas']['ProductVariantStatus'];

// 월별 재고 현황 API 응답
export type ProductVariantStatusResponse = PaginatedResponse<ProductVariantStatus>;
