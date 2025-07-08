import { api } from './axios';

// 🔹 1. 발주 목록 조회 (GET /orders/)
export const fetchOrders = () => api.get('/orders');

// 🔹 2. 발주 생성 (POST /orders/)
export const createOrder = (payload: {
    supplier: number;
    order_date: string;
    expected_delivery_date: string;
    status: string;
    instruction_note: string;
    note: string;
    vat_included: boolean;
    packaging_included: boolean;
    manager_name: string;
    items: {
        variant_code: string;
        quantity: number;
        unit_price: number;
        remark: string;
        spec: string;
    }[];
}) => api.post('/orders/', payload);

// 🔹 3. 특정 발주 조회 (GET /orders/{order_id}/)
export const fetchOrderById = (orderId: number) => api.get(`/orders/${orderId}/`);

// 🔹 4. 발주 취소 (DELETE /orders/{order_id}/)
export const deleteOrder = (orderId: number) => api.delete(`/orders/${orderId}/`);

// 🔹 5. 발주 상태 변경 (PATCH /orders/{order_id}/status/)
export const updateOrderStatus = (
    orderId: number,
    payload: { status: '대기' | '발주완료' | '입고완료' } // 또는 서버에서 허용하는 상태
) => api.patch(`/orders/${orderId}/status/`, payload);
