import { api } from './axios';

// 공급업체 목록 조회
export const fetchSuppliers = () => api.get('/supplier/');

// 공급업체 상세 조회
export const fetchSupplierById = (id: number) => api.get(`/supplier/${id}/`);

// 공급업체 생성
export const createSupplier = (data: any) => api.post('/supplier/', data);

// 공급업체 수정
export const updateSupplier = (id: number, data: any) => api.put(`/supplier/${id}/`, data);

// (삭제는 백엔드에 구현되면 추가)
