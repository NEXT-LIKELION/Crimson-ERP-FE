import { api } from './axios';

// 공급업체 목록 조회
export const fetchSuppliers = () => api.get('/supplier/');

// 공급업체 상세 조회
export const fetchSupplierById = (id: number) => api.get(`/supplier/${id}/`);

// 공급업체 생성
export const createSupplier = (data: {
  name: string;
  contact: string;
  manager: string;
  email: string;
  address: string;
  variant_codes?: string[];
}) => api.post('/supplier/', data);

// 공급업체 수정
export const updateSupplier = (
  id: number,
  data: {
    name?: string;
    contact?: string;
    manager?: string;
    email?: string;
    address?: string;
  }
) => api.patch(`/supplier/${id}/`, data);

// 공급업체별 variant 매핑 정보 조회
export const fetchSupplierVariants = (supplierId: number) =>
  api.get(`/supplier/${supplierId}/variants/`);

// 공급업체-상품 매핑 추가
export const addSupplierVariantMapping = (
  supplierId: number,
  data: {
    variant_code: string;
    cost_price?: number;
    lead_time_days?: number;
    is_primary?: boolean;
  }
) => api.post(`/supplier/${supplierId}/variants/`, data);

// 공급업체-상품 매핑 삭제
export const removeSupplierVariantMapping = (supplierId: number, variantCode: string) =>
  api.delete(`/supplier/${supplierId}/variants/${variantCode}/`);

// 공급업체별 variant 정보 수정
export const updateSupplierVariant = (
  id: number,
  code: string,
  data: {
    cost_price?: number;
    is_primary?: boolean;
  }
) => api.patch(`/supplier/variants/${id}/${code}/`, data);
