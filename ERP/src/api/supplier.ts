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

// 공급업체별 발주 내역 조회
export const fetchSupplierOrders = (supplierId: number) =>
  api.get(`/supplier/${supplierId}/orders/`);
