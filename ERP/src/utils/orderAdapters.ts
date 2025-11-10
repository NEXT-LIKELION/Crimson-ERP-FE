import { Order, OrderItem } from '../store/ordersStore';

// API 응답에서 UI 표시용으로 변환하는 어댑터 함수들

// 레거시 OrderItem 형식 (기존 컴포넌트 호환성)
export interface LegacyOrderItem {
  id: number;
  name: string;
  spec: string;
  unit: string;
  quantity: number;
  price: number;
  amount?: number;
  note?: string;
}

// 레거시 Order 형식 (기존 컴포넌트 호환성)
export interface LegacyOrder {
  id: number;
  supplier: string;
  manager: string;
  status: string;
  note: string;
  order_date: string;
  expected_delivery_date?: string;
  total_quantity: number;
  total_price: number;
  product_names: string[];
}

// API OrderItem을 레거시 형식으로 변환
export const adaptOrderItemToLegacy = (item: OrderItem): LegacyOrderItem => ({
  id: item.id,
  name: item.item_name,
  spec: item.spec || '',
  unit: item.unit || '',
  quantity: item.quantity,
  price: item.unit_price,
  amount: item.quantity * item.unit_price,
  note: item.remark || '',
});

// 레거시 OrderItem을 API 형식으로 변환
export const adaptLegacyOrderItemToApi = (item: LegacyOrderItem): Omit<OrderItem, 'id'> => ({
  variant_code: '', // 이 값은 별도로 설정 필요
  item_name: item.name,
  quantity: item.quantity,
  unit: item.unit,
  unit_price: item.price,
  remark: item.note,
  spec: item.spec,
});

// API Order를 레거시 형식으로 변환
export const adaptOrderToLegacy = (order: Order): LegacyOrder => ({
  id: order.id,
  supplier: order.supplier,
  manager: order.manager,
  status: order.status,
  note: order.note || '',
  order_date: order.order_date,
  expected_delivery_date: order.expected_delivery_date,
  total_quantity: parseFloat(order.total_quantity) || 0,
  total_price: parseFloat(order.total_price) || 0,
  product_names: order.product_names ? order.product_names.split(', ') : [],
});

// 레거시 Order를 API 형식으로 변환 (주문 생성 시)
export const adaptLegacyOrderToApi = (
  order: LegacyOrder,
  additionalFields: {
    supplier_id: number;
    manager_name: string;
    vat_included?: boolean;
    packaging_included?: boolean;
    instruction_note?: string;
  }
) => ({
  supplier: additionalFields.supplier_id,
  manager_name: additionalFields.manager_name,
  order_date: order.order_date,
  expected_delivery_date: order.expected_delivery_date || '',
  status: order.status,
  instruction_note: additionalFields.instruction_note,
  note: order.note,
  vat_included: additionalFields.vat_included,
  packaging_included: additionalFields.packaging_included,
});

// 숫자 형식 변환 유틸리티
export const parseOrderTotal = (value: string | number): number => {
  if (typeof value === 'number') return value;
  return parseFloat(value) || 0;
};

// product_names 배열 변환 유틸리티
export const parseProductNames = (value: string | string[]): string[] => {
  if (Array.isArray(value)) return value;
  return value ? value.split(', ').filter(Boolean) : [];
};

// 주문 아이템 배열 변환
export const adaptOrderItemsToLegacy = (items: OrderItem[] = []): LegacyOrderItem[] => {
  return items.map(adaptOrderItemToLegacy);
};

// 주문 목록 전체 변환
export const adaptOrdersListToLegacy = (orders: Order[]): LegacyOrder[] => {
  return orders.map(adaptOrderToLegacy);
};
