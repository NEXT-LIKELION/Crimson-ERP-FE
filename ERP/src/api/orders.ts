import { api } from './axios';

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
  expected_delivery_date: string;
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
