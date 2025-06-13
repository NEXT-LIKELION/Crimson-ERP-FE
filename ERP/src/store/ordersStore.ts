// src/store/ordersStore.ts
import { create } from "zustand";

export type OrderStatus = "PENDING" | "APPROVED" | "CANCELLED";

export interface OrderItem {
    id: number;
    name: string;
    spec: string;
    unit: string;
    quantity: number;
    price: number;
    amount?: number;
    note?: string;
}

export interface Order {
    id: number;
    variant_id: string;
    variant: {
        id: number;
        product_id: string;
        name: string;
        created_at: string;
    };
    supplier_id: number;
    quantity: number;
    status: OrderStatus;
    order_date: string;
    // Legacy fields for backward compatibility
    productName?: string;
    totalAmount?: number;
    manager?: string;
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
