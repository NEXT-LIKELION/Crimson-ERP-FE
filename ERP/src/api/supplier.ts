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
export const updateSupplier = (id: number, data: {
  name?: string;
  contact?: string;
  manager?: string;
  email?: string;
  address?: string;
}) => api.patch(`/supplier/${id}/`, data);

// 공급업체별 variant 매핑 정보 조회 (API가 없으므로 비활성화)
// export const fetchSupplierVariants = (supplierId: number) => 
//   api.get(`/supplier/${supplierId}/variants/`);

// 공급업체별 variant 정보 수정
export const updateSupplierVariant = (id: number, code: string, data: {
  cost_price?: number;
  is_primary?: boolean;
}) => api.patch(`/supplier/variants/${id}/${code}/`, data);
// (삭제는 백엔드에 구현되면 추가)
