// src/store/ordersStore.ts
import { create } from 'zustand';

export type OrderStatus = 'PENDING' | 'APPROVED' | 'CANCELLED' | 'COMPLETED';

export interface OrderItem {
  id: number;
  variant_code: string;
  item_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  remark?: string;
  spec?: string;
}

export interface Order {
  id: number;
  supplier: string;
  manager: string;
  status: OrderStatus;
  note?: string;
  order_date: string;
  expected_delivery_date?: string;
  total_quantity: string;
  total_price: string;
  product_names: string;
  created_at?: string;
  instruction_note?: string;
  vat_included?: boolean;
  packaging_included?: boolean;
  items?: OrderItem[];
}

export interface OrdersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Order[];
}

interface OrdersState {
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrder: (id: number, order: Partial<Order>) => void;
  deleteOrder: (id: number) => void;
}

export const useOrdersStore = create<OrdersState>((set) => ({
  orders: [],
  addOrder: (order) =>
    set((state) => ({
      orders: [...state.orders, order],
    })),
  updateOrder: (id, updatedOrder) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === id ? { ...order, ...updatedOrder } : order
      ),
    })),
  deleteOrder: (id) =>
    set((state) => ({
      orders: state.orders.filter((order) => order.id !== id),
    })),
}));
