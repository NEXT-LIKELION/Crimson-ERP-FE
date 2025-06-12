import { api } from "./axios";

// 🔹 1. 발주 목록 조회 (GET /orders/)
export const fetchOrders = () => api.get("/api/v1/orders/orders");

// 🔹 2. 발주 생성 (POST /orders/)
export const createOrder = (payload: {
  product_id: number;
  quantity: number;
  // 필요한 경우: supplier_id, note 등 추가
}) => api.post("/api/v1/orders/", payload);

// 🔹 3. 특정 발주 조회 (GET /orders/{order_id}/)
export const fetchOrderById = (orderId: number) =>
  api.get(`/api/v1/orders/${orderId}/`);

// 🔹 4. 발주 취소 (DELETE /orders/{order_id}/)
export const deleteOrder = (orderId: number) =>
  api.delete(`/api/v1/orders/${orderId}/`);

// 🔹 5. 발주 상태 변경 (PATCH /orders/{order_id}/status/)
export const updateOrderStatus = (
  orderId: number,
  payload: { status: "대기" | "발주완료" | "입고완료" } // 또는 서버에서 허용하는 상태
) => api.patch(`/api/v1/orders/${orderId}/status/`, payload);
